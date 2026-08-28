import frappe

def run():
    """Add feedback_token custom field to Interview doctype if it doesn't exist."""
    if not frappe.db.exists("Custom Field", "Interview-feedback_token"):
        cf = frappe.new_doc("Custom Field")
        cf.dt = "Interview"
        cf.fieldname = "feedback_token"
        cf.fieldtype = "Long Text"
        cf.label = "Feedback Token Map"
        cf.hidden = 1
        cf.insert(ignore_permissions=True)
        frappe.db.commit()
        print("✅ Custom field 'feedback_token' added to Interview doctype")
    else:
        print("ℹ️  Custom field 'feedback_token' already exists")
