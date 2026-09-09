import frappe
from st_automation.api.utils import success_response, error_response, ensure_custom_fields_exist


@frappe.whitelist()
def check_system_health(company=None):
	"""
	Pre-flight diagnostics check for ERPNext HR Ops.
	Surfaces configuration status with actionable badges and 1-click fixes.
	"""
	try:
		if not company:
			company = frappe.defaults.get_user_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
		if not company:
			first = frappe.get_all("Company", limit=1, pluck="name")
			company = first[0] if first else ""

		checks = []

		# 1. Custom Fields Status
		custom_fields_ready = frappe.db.exists("Custom Field", {"dt": "Job Applicant", "fieldname": "booking_token"})
		checks.append({
			"id": "custom_fields",
			"title": "HR Automation Custom Fields",
			"category": "Recruitment",
			"status": "pass" if custom_fields_ready else "action_required",
			"message": "Custom fields for candidate slot booking and talent pooling are active." if custom_fields_ready else "Custom fields missing. Click Auto-Fix to create them.",
			"can_auto_fix": True
		})

		# 2. Company Loan Accrual Setting
		has_loan_accrual = False
		if company:
			c_doc = frappe.get_doc("Company", company)
			if not hasattr(c_doc, "loan_accrual_frequency"):
				has_loan_accrual = True # V15 compatibility
			else:
				has_loan_accrual = bool(getattr(c_doc, "loan_accrual_frequency", None))

		checks.append({
			"id": "loan_accrual",
			"title": "Company Loan Accrual Frequency",
			"category": "Payroll & Loans",
			"status": "pass" if has_loan_accrual else "warning",
			"message": f"Loan Accrual Frequency set for {company}." if has_loan_accrual else f"Loan Accrual Frequency not set on {company}. Required for monthly loan installment deductions.",
			"can_auto_fix": True
		})

		# 3. Default Outgoing Email Account
		has_outgoing_email = frappe.db.exists("Email Account", {"enable_outgoing": 1, "default_outgoing": 1})
		checks.append({
			"id": "email_account",
			"title": "Default Outgoing Email Account",
			"category": "Communications",
			"status": "pass" if has_outgoing_email else "warning",
			"message": "Default email account is configured for sending interview invites & payslips." if has_outgoing_email else "No default outgoing email account set. Candidate emails will be queued in Frappe log.",
			"can_auto_fix": False
		})

		# 4. Salary Structure Coverage
		total_emp = frappe.db.count("Employee", {"status": "Active", "company": company} if company else {"status": "Active"})
		assigned_emp = len(frappe.db.sql("""
			select distinct employee from `tabSalary Structure Assignment`
			where docstatus = 1 and (company = %(company)s or %(company)s is null or %(company)s = '')
		""", {"company": company}, as_dict=True))

		coverage_pct = int((assigned_emp / total_emp * 100)) if total_emp > 0 else 100
		checks.append({
			"id": "salary_structure",
			"title": "Salary Structure Assignments",
			"category": "Payroll & Loans",
			"status": "pass" if coverage_pct == 100 else ("warning" if coverage_pct >= 50 else "action_required"),
			"message": f"{assigned_emp} of {total_emp} active employees have an assigned salary structure ({coverage_pct}%).",
			"can_auto_fix": False
		})

		# 5. Loan Product Availability
		loan_products_count = frappe.db.count("Loan Product") if frappe.db.exists("DocType", "Loan Product") else 0
		checks.append({
			"id": "loan_product",
			"title": "Standard Loan Products",
			"category": "Payroll & Loans",
			"status": "pass" if loan_products_count > 0 else "warning",
			"message": f"{loan_products_count} loan product(s) configured." if loan_products_count > 0 else "No Loan Product configured yet. Click Auto-Fix to create a standard 'Salary Advance' product.",
			"can_auto_fix": True
		})

		# 6. Active Job Openings
		active_jobs = frappe.db.count("Job Opening", {"status": "Open"})
		checks.append({
			"id": "job_openings",
			"title": "Active Job Openings",
			"category": "Recruitment",
			"status": "pass" if active_jobs > 0 else "info",
			"message": f"{active_jobs} active job opening(s) published." if active_jobs > 0 else "No active job openings. You can create one from the Recruitment tab.",
			"can_auto_fix": False
		})

		return success_response({
			"company": company,
			"checks": checks,
			"overall_status": "healthy" if all(c["status"] in ["pass", "info"] for c in checks) else "attention_needed"
		})
	except Exception as e:
		return error_response("Error running system diagnostics", e)


@frappe.whitelist()
def auto_fix_issue(issue_id, company=None):
	"""
	1-Click automatic self-healing for common configuration issues.
	"""
	try:
		if not company:
			company = frappe.defaults.get_user_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
		if not company:
			first = frappe.get_all("Company", limit=1, pluck="name")
			company = first[0] if first else ""

		if issue_id == "custom_fields":
			from st_automation.setup import setup_custom_fields
			setup_custom_fields()
			return success_response(message="Custom fields created and synced successfully!")

		if not company:
			company = frappe.defaults.get_user_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
			
		if issue_id == "loan_accrual":
			if company:
				c_doc = frappe.get_doc("Company", company)
				if hasattr(c_doc, "loan_accrual_frequency"):
					c_doc.loan_accrual_frequency = "Monthly"
					c_doc.save(ignore_permissions=True)
					frappe.db.commit()
					return success_response(message=f"Loan Accrual Frequency set to Monthly on {company}!")
				else:
					return success_response(message="Loan Accrual Frequency not required in this version.")
			return error_response(f"Could not update Company {company}.")

		elif issue_id == "loan_product":
			if frappe.db.exists("DocType", "Loan Product") and not frappe.db.exists("Loan Product", "Salary Advance"):
				lp = frappe.new_doc("Loan Product")
				lp.product_code = "SA-001"
				lp.product_name = "Salary Advance"
				lp.rate_of_interest = 0.0
				lp.max_loan_amount = 500000
				lp.repayment_method = "Repay Over Number of Periods"
				lp.company = company
				lp.loan_account = frappe.db.get_value("Account", {"company": company, "account_type": "Receivable"})
				lp.payment_account = frappe.db.get_value("Account", {"company": company, "account_type": "Cash"})
				
				# Income accounts (Crucial to prevent 'None' overwrites during Loan validation)
				income = frappe.db.get_value("Account", {"company": company, "root_type": "Income", "is_group": 0})
				lp.interest_income_account = income
				lp.penalty_income_account = income
				
				lp.flags.ignore_permissions = True
				lp.flags.ignore_mandatory = True
				lp.insert(ignore_permissions=True)
				frappe.db.commit()
				return success_response(message="Created default 'Salary Advance' (0% interest) Loan Product!")
			return success_response(message="Loan product already exists.")

		return error_response(f"Unknown issue ID: {issue_id}")
	except Exception as e:
		return error_response(f"Error executing auto-fix: {str(e)}", e)
