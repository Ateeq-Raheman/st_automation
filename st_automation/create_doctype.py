import frappe

def create_doctype():
    frappe.init(site="st_prod")
    frappe.connect()

    if not frappe.db.exists("DocType", "Exit Letter Template"):
        doc = frappe.get_doc({
            "doctype": "DocType",
            "name": "Exit Letter Template",
            "module": "ST Automation",
            "custom": 1,
            "naming_rule": "By fieldname",
            "autoname": "field:title",
            "fields": [
                {"fieldname": "title", "fieldtype": "Data", "label": "Title", "reqd": 1, "unique": 1},
                {"fieldname": "letter_type", "fieldtype": "Select", "label": "Letter Type", "options": "Relieving\nExperience", "reqd": 1},
                {"fieldname": "company", "fieldtype": "Link", "label": "Company", "options": "Company", "reqd": 1},
                {"fieldname": "template_html", "fieldtype": "Text Editor", "label": "Template HTML", "reqd": 1}
            ],
            "permissions": [{"role": "HR Manager", "read": 1, "write": 1, "create": 1, "delete": 1}]
        })
        doc.insert(ignore_permissions=True)
        print("Created DocType: Exit Letter Template")
    else:
        print("DocType already exists.")

    # Check for Task Type
    if not frappe.db.exists("Task Type", "Exit Documents"):
        doc = frappe.get_doc({
            "doctype": "Task Type",
            "name": "Exit Documents"
        })
        doc.insert(ignore_permissions=True)
        print("Created Task Type: Exit Documents")

    # Create Default Templates
    company = frappe.db.get_value("Company", {}, "name")
    
    if not frappe.db.exists("Exit Letter Template", f"Default Relieving Letter - {company}"):
        frappe.get_doc({
            "doctype": "Exit Letter Template",
            "title": f"Default Relieving Letter - {company}",
            "letter_type": "Relieving",
            "company": company,
            "template_html": """
<p>Dear {{ emp_doc.employee_name }},</p>
<p>This has reference to your resignation letter dated {{ frappe.utils.formatdate(sep_doc.resignation_letter_date) }}.</p>
<p>We would like to inform you that your resignation has been accepted and you are relieved from the services of <b>{{ sep_doc.company }}</b> effective from the closing hours of {{ frappe.utils.formatdate(emp_doc.relieving_date or frappe.utils.nowdate()) }}.</p>
<p>Your full and final settlement has been processed.</p>
<p>We wish you all the best in your future endeavors.</p>
            """
        }).insert(ignore_permissions=True)
        print("Created Default Relieving Letter")

    if not frappe.db.exists("Exit Letter Template", f"Default Experience Letter - {company}"):
        frappe.get_doc({
            "doctype": "Exit Letter Template",
            "title": f"Default Experience Letter - {company}",
            "letter_type": "Experience",
            "company": company,
            "template_html": """
<p>TO WHOMSOEVER IT MAY CONCERN</p>
<br>
<p>This is to certify that <b>{{ emp_doc.employee_name }}</b> was employed with <b>{{ sep_doc.company }}</b> as a <b>{{ sep_doc.designation }}</b> from {{ frappe.utils.formatdate(emp_doc.date_of_joining) }} to {{ frappe.utils.formatdate(emp_doc.relieving_date or frappe.utils.nowdate()) }}.</p>
<p>During their tenure with us, we found them to be professional, diligent, and hardworking.</p>
<p>We wish them success in all future assignments.</p>
            """
        }).insert(ignore_permissions=True)
        print("Created Default Experience Letter")
        
    frappe.db.commit()
    frappe.destroy()

create_doctype()
