import frappe
from st_automation.api.recruitment import onboard_candidate

def run_flow():
    app = frappe.new_doc("Job Applicant")
    app.applicant_name = "Dummy Test Employee"
    app.email_id = "dummytest@example.com"
    app.status = "Accepted"
    app.insert(ignore_permissions=True)
    frappe.db.commit()

    onboard_candidate(app.name)
    frappe.db.commit()
    print("Dummy Onboarding Complete!")
