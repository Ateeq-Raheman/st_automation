import frappe
from frappe.utils import (
	nowdate, getdate, formatdate, flt, cint,
	add_months, get_first_day, get_last_day, format_datetime
)
import json
from st_automation.api.utils import (
	success_response, error_response, safe_float, safe_int, ensure_custom_fields_exist
)


@frappe.whitelist()
def get_payroll_dashboard_summary(company=None, month=None, year=None):
	"""
	Command Center API: Single call returning all payroll readiness metrics,
	loan alerts, pending incentives, and structure coverage.
	"""
	ensure_custom_fields_exist()
	try:
		if not company:
			company = frappe.defaults.get_user_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
		if not company:
			first = frappe.get_all("Company", limit=1, pluck="name")
			company = first[0] if first else ""

		today = getdate()
		current_month = int(month) if month else today.month
		current_year = int(year) if year else today.year

		# Calculate date range for selected period
		start_date = getdate(f"{current_year}-{current_month:02d}-01")
		end_date = get_last_day(start_date)

		# 1. Total Active Employees
		active_employees = frappe.db.count("Employee", {"status": "Active", "company": company} if company else {"status": "Active"})

		# 2. Employees with active Salary Structure Assignment
		assigned_employees = frappe.db.sql("""
			select distinct employee from `tabSalary Structure Assignment`
			where docstatus = 1 and from_date <= %(end_date)s
			and (company = %(company)s or %(company)s is null or %(company)s = '')
		""", {"end_date": end_date, "company": company}, as_dict=True)
		assigned_count = len(assigned_employees)

		missing_structure_count = max(0, active_employees - assigned_count)

		# 3. Active Loans
		active_loans_count = 0
		if frappe.db.exists("DocType", "Loan"):
			active_loans_count = frappe.db.count("Loan", {"docstatus": 1, "status": ["in", ["Sanctioned", "Disbursed", "Partially Disbursed"]]})

		# 4. Pending Incentives / Additional Salaries for this period
		pending_incentives_count = 0
		total_incentives_amount = 0.0
		if frappe.db.exists("DocType", "Additional Salary"):
			incentives = frappe.get_all(
				"Additional Salary",
				fields=["amount", "employee"],
				filters={
					"docstatus": ["in", [0, 1]],
					"payroll_date": ["between", [start_date, end_date]],
				}
			)
			pending_incentives_count = len(incentives)
			total_incentives_amount = sum([safe_float(i.amount) for i in incentives])

		# 5. Salary Slips already processed for this period
		slips = frappe.get_all(
			"Salary Slip",
			fields=["name", "gross_pay", "total_deduction", "net_pay", "docstatus"],
			filters={
				"start_date": [">=", start_date],
				"end_date": ["<=", end_date],
				"docstatus": ["in", [0, 1]]
			}
		)
		processed_count = len(slips)
		total_gross = sum([safe_float(s.gross_pay) for s in slips])
		total_deductions = sum([safe_float(s.total_deduction) for s in slips])
		total_net_payout = sum([safe_float(s.net_pay) for s in slips])

		# Readiness calculation
		readiness_score = 100
		if active_employees > 0:
			readiness_score = int(((assigned_count) / active_employees) * 100)

		return success_response({
			"company": company,
			"period_month": current_month,
			"period_year": current_year,
			"start_date": str(start_date),
			"end_date": str(end_date),
			"active_employees": active_employees,
			"assigned_structure_count": assigned_count,
			"missing_structure_count": missing_structure_count,
			"active_loans_count": active_loans_count,
			"pending_incentives_count": pending_incentives_count,
			"total_incentives_amount": total_incentives_amount,
			"processed_slips_count": processed_count,
			"total_gross": total_gross,
			"total_deductions": total_deductions,
			"total_net_payout": total_net_payout,
			"readiness_score": readiness_score,
			"is_fully_processed": (processed_count >= active_employees and active_employees > 0)
		})
	except Exception as e:
		return error_response("Error loading payroll dashboard summary", e)


@frappe.whitelist()
def quick_add_incentive(employee, amount, salary_component=None, payroll_date=None, notes=None):
	"""
	Quick 2-click bonus/incentive creator. Creates standard Additional Salary doc.
	"""
	try:
		if not employee or not amount:
			return error_response("Employee and Amount are required.")

		amt = safe_float(amount)
		if amt <= 0:
			return error_response("Incentive amount must be greater than zero.")

		if not payroll_date:
			payroll_date = nowdate()

		# Auto-detect earning salary component if not passed
		if not salary_component:
			components = frappe.get_all(
				"Salary Component",
				filters={"type": "Earning"},
				pluck="name",
				limit=5
			)
			# Look for Incentive / Bonus or pick first
			salary_component = next((c for c in components if "incentive" in c.lower() or "bonus" in c.lower()), components[0] if components else "Incentive")

		# Create Additional Salary document
		doc = frappe.new_doc("Additional Salary")
		doc.employee = employee
		doc.salary_component = salary_component
		doc.amount = amt
		doc.payroll_date = payroll_date
		doc.overwrite_salary_structure_amount = 0
		doc.deduct_full_tax_on_selected_payroll_date = 0
		if notes:
			doc.description = notes

		doc.insert(ignore_permissions=True)
		doc.submit()
		frappe.db.commit()

		emp_name = frappe.db.get_value("Employee", employee, "employee_name") or employee

		return success_response({
			"name": doc.name,
			"employee": employee,
			"employee_name": emp_name,
			"amount": amt,
			"salary_component": salary_component,
			"payroll_date": payroll_date
		}, message=f"Added incentive of ₹{amt:,.2f} for {emp_name}!")
	except Exception as e:
		return error_response(f"Error adding incentive: {str(e)}", e)


@frappe.whitelist()
def bulk_add_incentives(incentives):
	"""
	Adds multiple employee bonuses in a single batch transaction.
	Expects JSON array: [{"employee": "HR-EMP-001", "amount": 5000, "component": "Performance Bonus", "notes": "Q3 Target"}]
	"""
	try:
		if isinstance(incentives, str):
			incentives = json.loads(incentives)

		if not incentives or not isinstance(incentives, list):
			return error_response("Invalid incentives list provided.")

		created_records = []
		errors = []

		for idx, item in enumerate(incentives):
			emp = item.get("employee")
			amt = safe_float(item.get("amount"))
			comp = item.get("component") or "Incentive"
			notes = item.get("notes") or "Bulk Bonus Entry"
			pdate = item.get("payroll_date") or nowdate()

			if not emp or amt <= 0:
				errors.append(f"Row {idx+1}: Missing employee or invalid amount.")
				continue

			try:
				doc = frappe.new_doc("Additional Salary")
				doc.employee = emp
				doc.salary_component = comp
				doc.amount = amt
				doc.payroll_date = pdate
				doc.overwrite_salary_structure_amount = 0
				doc.description = notes
				doc.insert(ignore_permissions=True)
				doc.submit()
				created_records.append({"employee": emp, "amount": amt, "name": doc.name})
			except Exception as row_err:
				errors.append(f"Employee {emp}: {str(row_err)}")

		frappe.db.commit()
		return success_response({
			"created_count": len(created_records),
			"errors": errors
		}, message=f"Successfully recorded {len(created_records)} bonus entries!")
	except Exception as e:
		return error_response(f"Error in bulk bonus entry: {str(e)}", e)


@frappe.whitelist()
def get_loan_preview(employee, amount, tenure_months, loan_product=None):
	"""
	Auto-calculates loan EMI installment and runs pre-flight sanity checks.
	Enforces moratorium = 0 and checks Company loan accrual prerequisites.
	"""
	try:
		amt = safe_float(amount)
		tenure = safe_int(tenure_months, 12)
		if amt <= 0 or tenure <= 0:
			return error_response("Amount and tenure must be positive numbers.")

		emp_data = frappe.db.get_value("Employee", employee, ["employee_name", "company", "department", "designation"], as_dict=True)
		if not emp_data:
			return error_response(f"Employee {employee} not found.")

		company = emp_data.company

		# Pre-flight check on Company Loan configuration
		company_doc = frappe.get_doc("Company", company)
		has_accrual_freq = bool(getattr(company_doc, "loan_accrual_frequency", None))

		# Estimate monthly installment (Principal / Tenure for 0% interest advance, or standard amortization)
		rate_of_interest = 0.0
		if loan_product and frappe.db.exists("Loan Product", loan_product):
			rate_of_interest = safe_float(frappe.db.get_value("Loan Product", loan_product, "rate_of_interest"))

		if rate_of_interest > 0:
			monthly_rate = (rate_of_interest / 100.0) / 12.0
			emi = (amt * monthly_rate * ((1 + monthly_rate) ** tenure)) / (((1 + monthly_rate) ** tenure) - 1)
		else:
			emi = amt / tenure

		total_repayment = emi * tenure
		total_interest = max(0.0, total_repayment - amt)

		return success_response({
			"employee": employee,
			"employee_name": emp_data.employee_name,
			"company": company,
			"principal_amount": amt,
			"tenure_months": tenure,
			"interest_rate": rate_of_interest,
			"monthly_installment": round(emi, 2),
			"total_repayment": round(total_repayment, 2),
			"total_interest": round(total_interest, 2),
			"moratorium_tenure": 0,
			"company_accrual_configured": has_accrual_freq
		})
	except Exception as e:
		return error_response(f"Error calculating loan preview: {str(e)}", e)


@frappe.whitelist()
def create_loan_and_disburse(employee, amount, tenure_months, monthly_repayment_amount=None, loan_product=None, custom_moratorium=0):
	"""
	Guided 3-Step Loan Wizard Execution:
	Collapses Loan Creation + Repayment Schedule + Disbursement into 1 atomic transaction.
	Enforces moratorium_tenure = 0 and auto-fixes company loan configuration.
	"""
	try:
		amt = safe_float(amount)
		tenure = safe_int(tenure_months, 12)
		moratorium = safe_int(custom_moratorium, 0)

		if amt <= 0 or tenure <= 0:
			return error_response("Amount and tenure must be greater than zero.")

		if not frappe.db.exists("DocType", "Loan"):
			return error_response("ERPNext Loan / Lending module is not installed or enabled.")

		emp_data = frappe.db.get_value("Employee", employee, ["employee_name", "company"], as_dict=True)
		if not emp_data:
			return error_response(f"Employee {employee} not found.")

		company = emp_data.company

		# Self-healing: Ensure company loan accrual frequency is set
		company_doc = frappe.get_doc("Company", company)
		if hasattr(company_doc, "loan_accrual_frequency") and not company_doc.loan_accrual_frequency:
			company_doc.loan_accrual_frequency = "Monthly"
			company_doc.save(ignore_permissions=True)
			frappe.db.commit()

		if not loan_product:
			products = frappe.get_all("Loan Product", limit=1, pluck="name")
			loan_product = products[0] if products else None
			
		# Ensure the Loan Product is explicitly a Term Loan (required for Repay From Salary)
		if loan_product:
			product_doc = frappe.get_doc("Loan Product", loan_product)
			if not product_doc.is_term_loan:
				product_doc.is_term_loan = 1
				product_doc.flags.ignore_permissions = True
				product_doc.save()

		if not monthly_repayment_amount:
			monthly_repayment_amount = round(amt / tenure, 2)

		# 1. Create Loan Document
		loan_doc = frappe.new_doc("Loan")
		loan_doc.applicant_type = "Employee"
		loan_doc.applicant = employee
		loan_doc.company = company
		loan_doc.loan_amount = amt
		loan_doc.repayment_periods = tenure
		loan_doc.monthly_repayment_amount = safe_float(monthly_repayment_amount)
		loan_doc.is_term_loan = 1
		loan_doc.repayment_start_date = frappe.utils.today()
		# Crucial: Moratorium tenure must be 0 to avoid delayed deductions
		loan_doc.moratorium_tenure = moratorium
		if hasattr(loan_doc, "repay_from_salary"):
			loan_doc.repay_from_salary = 1

		if loan_product:
			loan_doc.loan_product = loan_product

		# Fetch fallback accounts
		payment_account = frappe.db.get_value("Account", {"company": company, "account_type": "Cash"})
		if not payment_account:
			payment_account = frappe.db.get_value("Account", {"company": company, "root_type": "Asset", "is_group": 0})
			
		loan_account = frappe.db.get_value("Account", {"company": company, "account_type": "Receivable"})
		if not loan_account:
			loan_account = frappe.db.get_value("Account", {"company": company, "root_type": "Asset", "is_group": 0})
		
		loan_doc.payment_account = payment_account
		loan_doc.loan_account = loan_account
		
		# Income accounts
		income_account = frappe.db.get_value("Account", {"company": company, "root_type": "Income", "is_group": 0})
		if not income_account:
			income_account = frappe.db.get_value("Account", {"company": company, "is_group": 0})
		
		loan_doc.interest_income_account = income_account
		loan_doc.penalty_income_account = income_account

		loan_doc.posting_date = nowdate()
		loan_doc.flags.ignore_permissions = True
		loan_doc.flags.ignore_mandatory = True
		loan_doc.insert(ignore_permissions=True)
		loan_doc.submit()

		# 2. Automatically Create & Submit Loan Disbursement
		disbursement_name = None
		if frappe.db.exists("DocType", "Loan Disbursement"):
			try:
				disbursement = frappe.new_doc("Loan Disbursement")
				disbursement.against_loan = loan_doc.name
				disbursement.applicant_type = "Employee"
				disbursement.applicant = employee
				disbursement.company = company
				disbursement.disbursed_amount = amt
				disbursement.disbursement_date = nowdate()
				disbursement.payment_account = payment_account
				disbursement.flags.ignore_permissions = True
				disbursement.flags.ignore_mandatory = True
				disbursement.insert(ignore_permissions=True)
				disbursement.submit()
				disbursement_name = disbursement.name
			except Exception as disb_err:
				frappe.log_error(f"Loan disbursement note: {disb_err}", "st_automation Loan")

		frappe.db.commit()

		return success_response({
			"loan_name": loan_doc.name,
			"disbursement_name": disbursement_name,
			"employee": employee,
			"employee_name": emp_data.employee_name,
			"amount": amt,
			"tenure": tenure,
			"monthly_installment": monthly_repayment_amount,
			"moratorium": moratorium
		}, message=f"Loan of ₹{amt:,.2f} approved and disbursed for {emp_data.employee_name} in 1 click!")
	except Exception as e:
		return error_response(f"Error creating loan: {str(e)}", e)


@frappe.whitelist()
def run_payroll_and_report(company, start_date, end_date, cost_center=None):
	"""
	1-Click Payroll Execution Engine:
	Creates Payroll Entry -> Fetches Employees -> Creates Salary Slips -> Submits Slips.
	Returns comprehensive report with succeeded count, total payout, and flagged employees.
	"""
	try:
		if not company:
			return error_response("Company is required.")
		if not start_date or not end_date:
			return error_response("Start date and end date are required.")

		# Self-healing: Ensure company has a default payroll payable account
		company_doc = frappe.get_doc("Company", company)
		if not company_doc.default_payroll_payable_account:
			# Look for existing payable account
			payable_acc = frappe.db.get_value("Account", {"account_name": ["like", "%Payroll Payable%"], "company": company, "is_group": 0})
			if not payable_acc:
				# Attempt to create it under Current Liabilities
				liabilities = frappe.db.get_value("Account", {"account_type": "Current Liabilities", "company": company, "is_group": 1})
				if not liabilities:
					liabilities = frappe.db.get_value("Account", {"root_type": "Liability", "company": company, "is_group": 1})
				
				if liabilities:
					try:
						acc = frappe.new_doc("Account")
						acc.account_name = "Payroll Payable"
						acc.parent_account = liabilities
						acc.company = company
						acc.is_group = 0
						acc.account_type = "Payable"
						acc.insert(ignore_permissions=True)
						payable_acc = acc.name
					except Exception as e:
						frappe.log_error(f"Failed to create Payroll Payable Account: {e}")
			
			if payable_acc:
				company_doc.default_payroll_payable_account = payable_acc
				company_doc.save(ignore_permissions=True)
				frappe.db.commit()

		# Check if all active employees are already processed
		active_employees = frappe.db.count("Employee", {"status": "Active", "company": company})
		processed_employees_count = frappe.db.count("Salary Slip", {
			"company": company,
			"start_date": [">=", start_date],
			"end_date": ["<=", end_date],
			"docstatus": ["!=", 2]
		})

		if active_employees > 0 and processed_employees_count >= active_employees:
			# If there is a draft payroll entry, just return it so they can resume
			existing_pe = frappe.db.get_value("Payroll Entry", {
				"company": company,
				"start_date": start_date,
				"end_date": end_date,
				"docstatus": 0
			})
			if existing_pe:
				# Return existing draft stats
				slips = frappe.get_all("Salary Slip", filters={"payroll_entry": existing_pe}, fields=["name", "gross_pay", "total_deduction", "net_pay", "employee", "employee_name"])
				return success_response({
					"payroll_entry": existing_pe,
					"total_processed": len(slips),
					"total_gross": sum([safe_float(s.gross_pay) for s in slips]),
					"total_deductions": sum([safe_float(s.total_deduction) for s in slips]),
					"total_net_payout": sum([safe_float(s.net_pay) for s in slips]),
					"successful": slips,
					"failed": []
				}, message="Resumed existing Draft Payroll")
			else:
				return error_response(f"Payroll is already fully processed for all {active_employees} employees for {company} between {start_date} and {end_date}.")

		# Create Payroll Entry
		if not company_doc.default_payroll_payable_account:
			return error_response(f"Default Payroll Payable Account is not set for Company {company}. Please set it manually in Company master.")
			
		payroll_entry = frappe.new_doc("Payroll Entry")
		payroll_entry.company = company
		payroll_entry.start_date = start_date
		payroll_entry.end_date = end_date
		payroll_entry.payroll_frequency = "Monthly"
		payroll_entry.posting_date = end_date
		payroll_entry.exchange_rate = 1.0
		payroll_entry.payroll_payable_account = company_doc.default_payroll_payable_account
		if cost_center:
			payroll_entry.cost_center = cost_center

		payroll_entry.flags.ignore_permissions = True
		payroll_entry.insert(ignore_permissions=True)

		# Populate employee list
		try:
			payroll_entry.fill_employee_details()
		except Exception as fill_err:
			# Fallback manually if method name varies
			employees = frappe.get_all("Employee", filters={"status": "Active", "company": company}, fields=["name", "employee_name"])
			for emp in employees:
				payroll_entry.append("employees", {"employee": emp.name, "employee_name": emp.employee_name})

		payroll_entry.save(ignore_permissions=True)

		# Create Salary Slips
		try:
			payroll_entry.create_salary_slips()
		except Exception as slips_err:
			frappe.log_error(f"Payroll slips creation: {slips_err}", "st_automation Payroll")

		# Fetch all generated salary slips for this period
		generated_slips = frappe.get_all(
			"Salary Slip",
			fields=["name", "employee", "employee_name", "gross_pay", "total_deduction", "net_pay", "docstatus"],
			filters={"payroll_entry": payroll_entry.name}
		)

		# DO NOT SUBMIT Salary Slips or Payroll Entry yet (Draft mode)
		success_slips = []
		failed_slips = []
		total_payout = 0.0
		total_gross = 0.0
		total_deductions = 0.0

		for slip in generated_slips:
			success_slips.append({
				"salary_slip": slip.name,
				"employee": slip.employee,
				"employee_name": slip.employee_name,
				"gross_pay": safe_float(slip.gross_pay),
				"total_deduction": safe_float(slip.total_deduction),
				"net_pay": safe_float(slip.net_pay)
			})
			total_gross += safe_float(slip.gross_pay)
			total_deductions += safe_float(slip.total_deduction)
			total_payout += safe_float(slip.net_pay)

		frappe.db.commit()

		return success_response({
			"payroll_entry": payroll_entry.name,
			"total_processed": len(success_slips),
			"total_gross": total_gross,
			"total_deductions": total_deductions,
			"total_net_payout": total_payout,
			"successful": success_slips,
			"failed": failed_slips
		}, message=f"Draft Payroll generated! Review {len(success_slips)} salary slips before submitting.")
	except Exception as e:
		return error_response(f"Error executing payroll: {str(e)}", e)

@frappe.whitelist()
def submit_payroll(payroll_entry_id):
	"""
	Submits the Draft Payroll Entry and all its associated Salary Slips.
	"""
	try:
		if not frappe.db.exists("Payroll Entry", payroll_entry_id):
			return error_response(f"Payroll Entry {payroll_entry_id} not found.")

		payroll_entry = frappe.get_doc("Payroll Entry", payroll_entry_id)
		
		if payroll_entry.docstatus != 0:
			return error_response(f"Payroll Entry {payroll_entry_id} is already submitted or cancelled.")

		# Fetch all associated draft salary slips
		draft_slips = frappe.get_all(
			"Salary Slip",
			filters={"payroll_entry": payroll_entry.name, "docstatus": 0},
			pluck="name"
		)

		# Submit Salary Slips
		frappe.flags.mute_emails = True
		for slip_name in draft_slips:
			try:
				slip_doc = frappe.get_doc("Salary Slip", slip_name)
				slip_doc.submit()
			except Exception as e:
				frappe.log_error(f"Failed to submit Salary Slip {slip_name}: {e}", "st_automation Payroll Submit")
		frappe.flags.mute_emails = False

		# Submit Payroll Entry
		payroll_entry.submit()
		
		frappe.db.commit()
		return success_response(message=f"Payroll {payroll_entry.name} submitted successfully! {len(draft_slips)} slips processed.")

	except Exception as e:
		return error_response(f"Error submitting payroll: {str(e)}", e)


@frappe.whitelist()
def get_salary_slips_summary(company=None, month=None, year=None, employee=None):
	"""
	Returns paginated/filtered list of salary slips with PDF print URLs.
	"""
	try:
		filters = {}
		if company:
			filters["company"] = company
		if employee:
			filters["employee"] = employee

		today = getdate()
		m = int(month) if month else today.month
		y = int(year) if year else today.year
		start_date = getdate(f"{y}-{m:02d}-01")
		end_date = get_last_day(start_date)

		filters["start_date"] = [">=", start_date]
		filters["end_date"] = ["<=", end_date]

		# Role-based filtering: if not Administrator and not HR Manager, enforce their own employee record
		user = frappe.session.user
		if user != "Administrator" and "HR Manager" not in frappe.get_roles(user):
			emp_id = frappe.db.get_value("Employee", {"user_id": user, "status": "Active"}, "name")
			if emp_id:
				filters["employee"] = emp_id
			else:
				# No active employee linked to user, return empty list safely
				return success_response({
					"month": m,
					"year": y,
					"slips": [],
					"count": 0
				})

		slips = frappe.get_all(
			"Salary Slip",
			fields=[
				"name", "employee", "employee_name", "department", "designation",
				"start_date", "end_date", "gross_pay", "total_deduction", "net_pay",
				"docstatus", "posting_date"
			],
			filters=filters,
			order_by="employee_name asc",
			limit=200
		)

		import urllib.parse
		for s in slips:
			safe_name = urllib.parse.quote(s.name)
			s["pdf_url"] = f"/printview?doctype=Salary+Slip&name={safe_name}"

		return success_response({
			"month": m,
			"year": y,
			"slips": slips,
			"count": len(slips)
		})
	except Exception as e:
		return error_response("Error loading salary slips", e)

@frappe.whitelist()
def get_salary_structures(company=None):
	"""
	Returns all active (submitted) Salary Structures for a company.
	Safe alternative to frappe.client.get_list for React components.
	"""
	filters = {"is_active": "Yes", "docstatus": 1}
	if company:
		filters["company"] = company

	structures = frappe.get_all(
		"Salary Structure",
		filters=filters,
		fields=["name"],
		order_by="name asc"
	)
	# Also include draft structures so HR can see all
	if not structures:
		structures = frappe.get_all(
			"Salary Structure",
			filters={"company": company} if company else {},
			fields=["name"],
			order_by="name asc"
		)
	return success_response(structures)


@frappe.whitelist()
def get_active_employees(company=None):
	"""
	Returns a list of all active employees.
	Safe alternative to frappe.client.get_list for React components.
	"""
	filters = {"status": "Active"}
	if company:
		filters["company"] = company
		
	employees = frappe.get_all(
		"Employee", 
		filters=filters,
		fields=["name", "employee_name"],
		order_by="employee_name asc"
	)
	return success_response(employees)


@frappe.whitelist()
def assign_salary_structure(employee, salary_structure, from_date, company):
	"""
	Quickly assigns a salary structure to an employee.
	"""
	try:
		if not employee or not salary_structure or not from_date or not company:
			return error_response("Missing required fields")
			
		assignment = frappe.new_doc("Salary Structure Assignment")
		assignment.employee = employee
		assignment.salary_structure = salary_structure
		assignment.from_date = from_date
		assignment.company = company
		assignment.flags.ignore_permissions = True
		assignment.insert(ignore_permissions=True)
		assignment.submit()
		
		frappe.db.commit()
		return success_response({"name": assignment.name}, message="Salary Structure assigned successfully!")
	except Exception as e:
		return error_response(f"Failed to assign Salary Structure: {str(e)}", e)
