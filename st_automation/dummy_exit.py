import frappe
from frappe.utils import nowdate

def run_exit():
    try:
        sep = frappe.new_doc("Employee Separation")
        sep.employee = "EMP-100100033"
        sep.resignation_letter_date = nowdate()
        sep.boarding_status = "Pending"
        sep.boarding_begins_on = nowdate()
        sep.company = frappe.db.get_value("Employee", "EMP-100100033", "company")
        sep.insert(ignore_permissions=True)
        sep.submit()
        frappe.db.commit()
        print("Separation Created:", sep.name)
    except Exception as e:
        print("Error:", e)
