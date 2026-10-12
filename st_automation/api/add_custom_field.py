import frappe
from frappe.custom.doctype.custom_field.custom_field import create_custom_field

def create_field():
    create_custom_field("Employee Boarding Activity", {
        "fieldname": "custom_is_assignable",
        "label": "Requires External Assignment",
        "fieldtype": "Check",
        "insert_after": "activity_name",
        "default": "0",
        "description": "If checked, allows assigning this task to a specific User or Role (e.g. IT for email creation)."
    })
