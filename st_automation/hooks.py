app_name = "st_automation"
app_title = "StandardTouch HR Ops"
app_publisher = "Ateeq"
app_description = "Click-minimized, responsive HR operations app for Recruitment and Payroll for ERPNext"
app_email = "Ateeq@standardtouch.com"
app_license = "mit"

# Apps
# ------------------

# Each item in the list will be shown as an app in the apps page
add_to_apps_screen = [
	{
		"name": "st_automation",
		"logo": "/assets/st_automation/icon.svg",
		"title": "HR Operations",
		"route": "/hr-ops",
	}
]

# Website Routes & Desk Pages
# ----------------------------
website_route_rules = [
	{"from_route": "/hr-ops/<path:app_path>", "to_route": "hr-ops"},
	{"from_route": "/careers/<path:app_path>", "to_route": "hr-ops"},
]

# Installation & Migrations
# --------------------------
after_install = "st_automation.setup.after_install"
after_migrate = "st_automation.setup.after_migrate"

# Fixtures
# --------
fixtures = [
	{
		"dt": "Custom Field",
		"filters": [
			["dt", "in", ["Job Applicant", "Job Opening", "Company"]],
			["fieldname", "in", ["booking_token", "booking_token_expiry", "talent_pool_tag", "interview_rating_summary", "booked_slot_time", "interview_duration_mins", "default_interviewer"]]
		]
	}
]

doc_events = {
	"Employee": {
		"on_update": "st_automation.api.employee.assign_employee_role"
	},
	"Salary Slip": {
		"before_save": "st_automation.api.salary_slip.before_save"
	}
}
