import frappe
from st_automation.api.utils import success_response, error_response


@frappe.whitelist()
def get_current_user_profile():
	"""
	Returns the logged-in user profile, role flags, permissions,
	and system configuration summary.
	"""
	try:
		user = frappe.session.user
		if not user or user == "Guest":
			return success_response({
				"is_logged_in": False,
				"user": "Guest",
				"full_name": "Guest User",
				"roles": [],
				"is_hr_admin": False,
				"is_recruiter": False,
				"is_interviewer": False,
				"is_system_manager": False,
			})

		user_doc = frappe.get_doc("User", user)
		roles = frappe.get_roles(user)

		is_system_manager = "System Manager" in roles or "Administrator" in roles
		is_hr_admin = is_system_manager or "HR Manager" in roles or "HR User" in roles or "Payroll Manager" in roles
		is_recruiter = is_system_manager or is_hr_admin or "Recruitment Manager" in roles or "HR User" in roles
		is_interviewer = is_system_manager or is_recruiter or "Interviewer" in roles or "Employee" in roles

		# Default company if available
		default_company = frappe.defaults.get_user_default("company") or frappe.db.get_single_value("Global Defaults", "default_company")
		if not default_company:
			first_company = frappe.get_all("Company", limit=1, pluck="name")
			default_company = first_company[0] if first_company else ""

		companies = frappe.get_all("Company", fields=["name", "company_name", "default_currency"])

		return success_response({
			"is_logged_in": True,
			"user": user,
			"full_name": user_doc.full_name or user,
			"user_image": user_doc.user_image or "",
			"email": user_doc.email or user,
			"roles": roles,
			"is_hr_admin": is_hr_admin,
			"is_recruiter": is_recruiter,
			"is_interviewer": is_interviewer,
			"is_system_manager": is_system_manager,
			"default_company": default_company,
			"companies": companies,
			"csrf_token": frappe.sessions.get_csrf_token(),
		})
	except Exception as e:
		return error_response(f"Error fetching user profile: {str(e)}", e)
