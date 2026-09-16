import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_fields
from st_automation.templates_setup import create_default_templates


def after_install():
	"""Runs automatically when the app is installed on a site."""
	setup_custom_fields()
	setup_default_settings()
	create_default_templates()


def after_migrate():
	"""Runs automatically after bench migrate."""
	setup_custom_fields()
	setup_default_settings()
	create_default_templates()


def setup_custom_fields():
	"""
	Automatically creates all required custom fields on standard ERPNext DocTypes
	without requiring manual intervention.
	"""
	custom_fields = {
		"Employee": [
			{
				"fieldname": "onboarding_status_token",
				"label": "Onboarding Token",
				"fieldtype": "Data",
				"insert_after": "status",
				"read_only": 1,
				"no_copy": 1,
			},
			{
				"fieldname": "onboarding_status_token_expiry",
				"label": "Onboarding Token Expiry",
				"fieldtype": "Datetime",
				"insert_after": "onboarding_status_token",
				"read_only": 1,
			},
			{
				"fieldname": "probation_end_date",
				"label": "Probation End Date",
				"fieldtype": "Date",
				"insert_after": "date_of_joining",
			},
			{
				"fieldname": "biometric_enrolled",
				"label": "Biometric Enrolled",
				"fieldtype": "Check",
				"insert_after": "probation_end_date",
			}
		],
		"Employee Separation": [
			{
				"fieldname": "exit_status_token",
				"label": "Exit Status Token",
				"fieldtype": "Data",
				"insert_after": "status",
				"read_only": 1,
				"no_copy": 1,
			},
			{
				"fieldname": "exit_status_token_expiry",
				"label": "Exit Status Token Expiry",
				"fieldtype": "Datetime",
				"insert_after": "exit_status_token",
				"read_only": 1,
			},
			{
				"fieldname": "rehire_eligible",
				"label": "Eligible for Rehire",
				"fieldtype": "Select",
				"options": "\\nYes\\nNo",
				"insert_after": "exit_status_token_expiry",
			}
		],
		"Job Applicant": [
			{
				"fieldname": "st_section_booking",
				"label": "Interview & Slot Booking",
				"fieldtype": "Section Break",
				"insert_after": "status",
				"collapsible": 1,
			},
			{
				"fieldname": "booking_token",
				"label": "Booking Token",
				"fieldtype": "Data",
				"insert_after": "st_section_booking",
				"read_only": 1,
				"no_copy": 1,
			},
			{
				"fieldname": "booking_token_expiry",
				"label": "Booking Token Expiry",
				"fieldtype": "Datetime",
				"insert_after": "booking_token",
				"read_only": 1,
			},
			{
				"fieldname": "talent_pool_tag",
				"label": "Talent Pool / Bench Tag",
				"fieldtype": "Select",
				"options": "\nShortlisted\nOn Bench\nFuture Pipeline\nRejected",
				"insert_after": "booking_token_expiry",
			},
			{
				"fieldname": "interview_rating_summary",
				"label": "Interview Rating Summary",
				"fieldtype": "Data",
				"insert_after": "talent_pool_tag",
				"read_only": 1,
			},
			{
				"fieldname": "booked_slot_time",
				"label": "Booked Slot Time",
				"fieldtype": "Datetime",
				"insert_after": "interview_rating_summary",
				"read_only": 1,
			},
		],
		"Job Opening": [
			{
				"fieldname": "st_section_automation",
				"label": "HR Automation Settings",
				"fieldtype": "Section Break",
				"insert_after": "status",
			},
			{
				"fieldname": "interview_duration_mins",
				"label": "Interview Duration (Mins)",
				"fieldtype": "Int",
				"default": "45",
				"insert_after": "st_section_automation",
			},
			{
				"fieldname": "default_interviewer",
				"label": "Default Interviewer",
				"fieldtype": "Link",
				"options": "User",
				"insert_after": "interview_duration_mins",
			},
		],
	}

	try:
		create_custom_fields(custom_fields, ignore_validate=True)
		frappe.db.commit()
	except Exception as e:
		frappe.log_error(f"Error creating custom fields for st_automation: {e}", "st_automation Setup")


def setup_default_settings():
	"""Ensures safe defaults and required system configuration."""
	try:
		# Check if any company exists and set up sensible loan defaults if missing
		companies = frappe.get_all("Company", pluck="name")
		for company_name in companies:
			company_doc = frappe.get_doc("Company", company_name)
			updated = False

			# Check if loan_accrual_frequency field exists on Company
			if hasattr(company_doc, "loan_accrual_frequency") and not company_doc.loan_accrual_frequency:
				company_doc.loan_accrual_frequency = "Monthly"
				updated = True

			if updated:
				company_doc.save(ignore_permissions=True)

		frappe.db.commit()
	except Exception as e:
		frappe.log_error(f"Error configuring default settings: {e}", "st_automation Setup")
