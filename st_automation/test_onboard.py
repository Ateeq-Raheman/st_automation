import frappe
from st_automation.api.recruitment import onboard_candidate, record_decision

def test_onboard():
    # 1. Create a dummy candidate
    doc = frappe.new_doc("Job Applicant")
    doc.applicant_name = "Test Onboard User"
    doc.email_id = "test_onboard@example.com"
    doc.status = "Open"
    doc.job_title = "ERP Developer"
    doc.insert(ignore_permissions=True)
    
    # 2. Select them (moves them to Accepted state)
    print(f"Created applicant: {doc.name}")
    res_dec = record_decision(doc.name, "Select", "Looks good", None, None)
    print("Decision Response:", res_dec)
    
    # 3. Onboard them
    print("Onboarding candidate...")
    res_onb = onboard_candidate(doc.name)
    print("Onboard Response:", res_onb)
    
    # 4. Check if Employee exists
    if isinstance(res_onb, dict) and "employee" in res_onb.get("data", {}):
        emp_id = res_onb["data"]["employee"]
        print(f"Verifying Employee created: {emp_id}")
        if frappe.db.exists("Employee", emp_id):
            print("SUCCESS! Employee record exists in ERPNext.")
        else:
            print("FAILED! Employee not found.")
            
    # Cleanup (Optional)
    # frappe.delete_doc("Employee", emp_id)
    # frappe.delete_doc("Job Applicant", doc.name)
    # frappe.db.commit()

