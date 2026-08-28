import frappe
def run():
    try:
        print("OPTIONS:", frappe.get_meta('Job Applicant').get_field('status').options)
    except Exception as e:
        print("ERROR:", e)
