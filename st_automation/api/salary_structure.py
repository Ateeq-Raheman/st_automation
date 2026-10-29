import json
import frappe
from frappe.utils import flt, cint
from st_automation.api.utils import success_response, error_response
from st_automation.api.payroll import _assert_hr_admin


# Fields on the ERPNext/HRMS `Salary Structure` doctype that the web form
# edits directly (the rest — totals, net_pay — are computed by ERPNext).
STRUCTURE_FIELDS = [
	"company", "currency", "is_active", "is_default", "payroll_frequency", "letter_head",
	"salary_slip_based_on_timesheet", "salary_component", "hour_rate",
	"leave_encashment_amount_per_day", "max_benefits", "mode_of_payment", "payment_account",
]

# Fields on the child `Salary Detail` table (earnings / deductions rows).
DETAIL_FIELDS = [
	"salary_component", "abbr", "statistical_component", "is_tax_applicable", "is_flexible_benefit",
	"variable_based_on_taxable_salary", "depends_on_payment_days", "deduct_full_tax_on_selected_payroll_date",
	"condition", "amount_based_on_formula", "formula", "amount", "do_not_include_in_total",
	"exempted_from_income_tax", "do_not_include_in_accounts",
]

# Fields ERPNext lets you change after the structure is submitted.
ALLOW_ON_SUBMIT = ["is_active", "is_default"]


def _serialize_structure(doc):
	out = {f: doc.get(f) for f in STRUCTURE_FIELDS}
	out.update({
		"name": doc.name,
		"docstatus": doc.docstatus,
		"total_earning": flt(doc.get("total_earning")),
		"total_deduction": flt(doc.get("total_deduction")),
		"net_pay": flt(doc.get("net_pay")),
		"earnings": [{f: row.get(f) for f in DETAIL_FIELDS} for row in doc.get("earnings") or []],
		"deductions": [{f: row.get(f) for f in DETAIL_FIELDS} for row in doc.get("deductions") or []],
	})
	return out


def _fill_rows(doc, table, rows):
	doc.set(table, [])
	for row in rows or []:
		if not row.get("salary_component"):
			continue
		clean = {f: row.get(f) for f in DETAIL_FIELDS if f in row and row.get(f) not in (None, "")}
		for check in ("amount_based_on_formula", "depends_on_payment_days", "statistical_component",
				"do_not_include_in_total", "is_tax_applicable", "exempted_from_income_tax"):
			if check in clean:
				clean[check] = cint(clean[check])
		if "amount" in clean:
			clean["amount"] = flt(clean["amount"])
		doc.append(table, clean)


@frappe.whitelist()
def get_form_metadata(company=None):
	"""Dropdown data for the Salary Structure form, straight from ERPNext masters."""
	_assert_hr_admin()
	try:
		components = frappe.get_all(
			"Salary Component",
			filters={"disabled": 0},
			fields=["name", "salary_component_abbr as abbr", "type", "depends_on_payment_days",
					"amount_based_on_formula", "formula", "amount", "statistical_component",
					"is_tax_applicable", "do_not_include_in_total"],
			order_by="name asc",
		)
		return success_response({
			"components": components,
			"companies": frappe.get_all("Company", pluck="name"),
			"currencies": frappe.get_all("Currency", filters={"enabled": 1}, pluck="name"),
			"modes_of_payment": frappe.get_all("Mode of Payment", pluck="name"),
			"letter_heads": frappe.get_all("Letter Head", pluck="name"),
			"payroll_frequencies": ["Monthly", "Fortnightly", "Bimonthly", "Weekly", "Daily"],
			"default_company": company or frappe.defaults.get_user_default("Company"),
			"default_currency": frappe.db.get_value("Company", company, "default_currency") if company else None,
		})
	except Exception as e:
		return error_response("Failed to load form metadata", e)


@frappe.whitelist()
def list_salary_structures(company=None):
	"""All Salary Structures (drafts, submitted, cancelled) with assignment counts."""
	_assert_hr_admin()
	try:
		filters = {"docstatus": ["<", 2]}
		if company:
			filters["company"] = company
		rows = frappe.get_all(
			"Salary Structure",
			filters=filters,
			fields=["name", "company", "is_active", "is_default", "payroll_frequency", "currency",
					"docstatus", "total_earning", "total_deduction", "net_pay", "modified"],
			order_by="modified desc",
		)
		counts = dict(frappe.db.sql(
			"""select salary_structure, count(*) from `tabSalary Structure Assignment`
			where docstatus = 1 group by salary_structure"""
		))
		for r in rows:
			r["assignments"] = counts.get(r["name"], 0)
		return success_response(rows)
	except Exception as e:
		return error_response("Failed to load salary structures", e)


@frappe.whitelist()
def get_salary_structure(name):
	_assert_hr_admin()
	try:
		return success_response(_serialize_structure(frappe.get_doc("Salary Structure", name)))
	except Exception as e:
		return error_response(f"Failed to load Salary Structure {name}", e)


@frappe.whitelist()
def save_salary_structure(data, name=None, submit=0):
	"""
	Create (no `name`) or update (`name`) a Salary Structure through the normal
	ERPNext document lifecycle, so validations and totals match the desk form.
	Submitted structures only accept the ERPNext `allow_on_submit` fields.
	"""
	_assert_hr_admin()
	try:
		if isinstance(data, str):
			data = json.loads(data)
		submit = cint(submit)

		if name:
			doc = frappe.get_doc("Salary Structure", name)
			if doc.docstatus == 1:
				for f in ALLOW_ON_SUBMIT:
					if f in data:
						doc.db_set(f, data[f])
				frappe.db.commit()
				return success_response({"name": doc.name}, message="Salary Structure updated.")
			if doc.docstatus == 2:
				return error_response("Cancelled Salary Structures cannot be edited.")
		else:
			if not data.get("company"):
				return error_response("Company is required.")
			doc = frappe.new_doc("Salary Structure")
			# The structure name is its identity everywhere in ERPNext; the form
			# supplies it as `name` on create (autoname is `Prompt`).
			doc.__newname = data.get("structure_name")
			if not data.get("structure_name"):
				return error_response("Structure name is required.")

		for f in STRUCTURE_FIELDS:
			if f in data and data[f] not in (None, ""):
				doc.set(f, data[f])
		doc.set("salary_slip_based_on_timesheet", cint(data.get("salary_slip_based_on_timesheet")))
		_fill_rows(doc, "earnings", data.get("earnings"))
		_fill_rows(doc, "deductions", data.get("deductions"))

		doc.flags.ignore_permissions = True
		if doc.is_new():
			doc.insert(ignore_permissions=True)
		else:
			doc.save(ignore_permissions=True)
		if submit and doc.docstatus == 0:
			doc.submit()
		frappe.db.commit()
		return success_response({"name": doc.name}, message=f"Salary Structure {doc.name} saved.")
	except Exception as e:
		frappe.db.rollback()
		return error_response(f"Failed to save Salary Structure: {str(e)}", e)


@frappe.whitelist()
def delete_salary_structure(name):
	"""Delete a draft, or cancel then delete a submitted structure (ERPNext blocks it if assigned)."""
	_assert_hr_admin()
	try:
		doc = frappe.get_doc("Salary Structure", name)
		if doc.docstatus == 1:
			doc.flags.ignore_permissions = True
			doc.cancel()
		frappe.delete_doc("Salary Structure", name, ignore_permissions=True, force=0)
		frappe.db.commit()
		return success_response({"name": name}, message=f"Salary Structure {name} deleted.")
	except Exception as e:
		frappe.db.rollback()
		return error_response(f"Failed to delete Salary Structure: {str(e)}", e)


@frappe.whitelist()
def list_salary_structure_assignments(company=None, salary_structure=None, search=None):
	"""Every submitted assignment (not just the 10 most recent shown on the dashboard)."""
	_assert_hr_admin()
	try:
		filters = {"docstatus": 1}
		if company:
			filters["company"] = company
		if salary_structure:
			filters["salary_structure"] = salary_structure
		or_filters = None
		if search:
			like = f"%{search}%"
			or_filters = {"employee": ["like", like], "employee_name": ["like", like], "salary_structure": ["like", like]}
		rows = frappe.get_all(
			"Salary Structure Assignment",
			filters=filters,
			or_filters=or_filters,
			fields=["name", "employee", "employee_name", "department", "designation", "salary_structure",
					"base", "variable", "from_date", "company", "currency"],
			order_by="from_date desc, creation desc",
			limit_page_length=500,
		)
		return success_response(rows)
	except Exception as e:
		return error_response("Failed to load salary structure assignments", e)


@frappe.whitelist()
def delete_salary_structure_assignment(name):
	"""Cancel and delete an assignment (e.g. one made with the wrong base or date)."""
	_assert_hr_admin()
	try:
		doc = frappe.get_doc("Salary Structure Assignment", name)
		if doc.docstatus == 1:
			doc.flags.ignore_permissions = True
			doc.cancel()
		frappe.delete_doc("Salary Structure Assignment", name, ignore_permissions=True)
		frappe.db.commit()
		return success_response({"name": name}, message=f"Assignment {name} removed.")
	except Exception as e:
		frappe.db.rollback()
		return error_response(f"Failed to remove assignment: {str(e)}", e)
