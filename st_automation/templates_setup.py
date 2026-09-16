import frappe

def create_default_templates():
    companies = frappe.get_all("Company", pluck="name")
    if not companies:
        return

    for company in companies:
        create_onboarding_template(company)
        create_separation_template(company)

def create_onboarding_template(company):
    template_name = f"Standard Onboarding - {company}"
    if frappe.db.exists("Employee Onboarding Template", template_name):
        return

    doc = frappe.new_doc("Employee Onboarding Template")
    doc.company = company
    doc.title = template_name
    
    try:
        doc.template_name = template_name
    except:
        pass
        
    activities = [
        {"activity_name": "Prepare offer letter", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Create Employee ID record", "begin_on": 0, "role": "HR Manager", "required_for_employee_creation": 1},
        {"activity_name": "Assign department/designation/reports-to", "begin_on": 0, "role": "HR Manager", "required_for_employee_creation": 1},
        {"activity_name": "Assign salary structure", "begin_on": 1, "role": "HR Manager"},
        {"activity_name": "Upload documents", "begin_on": 1, "role": "HR Manager"},
        {"activity_name": "Biometric enrollment", "begin_on": 2, "role": "HR Manager"},
        {"activity_name": "Add to email groups", "begin_on": 1, "role": "HR Manager"},
        {"activity_name": "Issue assets", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Provision ERPNext user + role", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Schedule induction/training", "begin_on": 3, "role": "HR Manager"},
        {"activity_name": "Probation review reminder", "begin_on": 76, "role": "HR Manager"}
    ]
    
    for act in activities:
        doc.append("activities", act)

    doc.flags.ignore_permissions = True
    try:
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception as e:
        frappe.log_error(f"Error creating Onboarding Template for {company}: {e}", "st_automation Setup")


def create_separation_template(company):
    template_name = f"Standard Separation - {company}"
    if frappe.db.exists("Employee Separation Template", {"title": template_name}):
        return

    doc = frappe.new_doc("Employee Separation Template")
    doc.company = company
    doc.title = template_name
    
    try:
        doc.template_name = template_name
    except:
        pass
        
    activities = [
        {"activity_name": "Handover checklist (Manager)", "begin_on": 0, "role": ""}, # Resolved dynamically
        {"activity_name": "Handover checklist (HR)", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Exit interview", "begin_on": -5, "role": "HR Manager"},
        {"activity_name": "Dues clearance", "begin_on": -3, "role": "HR Manager"},
        {"activity_name": "Asset return", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Final settlement", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Experience letter", "begin_on": 5, "role": "HR Manager"},
        {"activity_name": "Biometric removal", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Deactivate ERPNext user", "begin_on": 0, "role": "HR Manager"},
        {"activity_name": "Remove from email groups", "begin_on": 0, "role": "HR Manager"}
    ]
    
    for act in activities:
        doc.append("activities", act)

    doc.flags.ignore_permissions = True
    try:
        doc.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception as e:
        frappe.log_error(f"Error creating Separation Template for {company}: {e}", "st_automation Setup")
