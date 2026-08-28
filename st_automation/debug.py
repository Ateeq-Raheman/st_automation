import frappe
def run():
    try:
        options = "Open\nReplied\nRejected\nHold\nAccepted\nAwaiting Slot Booking\nScheduled\nFeedback In"
        frappe.make_property_setter({
            "doctype": "Job Applicant",
            "doctype_or_field": "DocField",
            "fieldname": "status",
            "property": "options",
            "value": options,
            "property_type": "Text"
        }, is_system_generated=False)
        frappe.db.commit()
        print("Property Setter applied successfully.")
    except Exception as e:
        print("ERROR:", e)
