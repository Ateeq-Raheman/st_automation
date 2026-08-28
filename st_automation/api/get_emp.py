import frappe

def run():
    emps = frappe.db.get_list("Employee", filters={"employee_name": ["in", ["Hamza Ali", "Abdul Manan"]]}, fields=["name", "employee_name"])
    print("EMPS:", emps)
