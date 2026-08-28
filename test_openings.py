import frappe

def test():
    try:
        openings = frappe.get_all(
            "Job Opening",
            fields=["name", "job_title", "status", "designation", "department", "no_of_vacancies", "publish_on_website"],
            order_by="creation desc"
        )
        print("SUCCESS:", openings)
    except Exception as e:
        import traceback
        print("EXCEPTION:")
        traceback.print_exc()
