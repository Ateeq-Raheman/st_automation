import frappe

def run():
    frappe.db.sql('delete from `tabSalary Slip`')
    frappe.db.sql('delete from `tabPayroll Entry`')
    frappe.db.sql('delete from `tabLoan`')
    frappe.db.sql('delete from `tabLoan Disbursement`')
    frappe.db.sql('delete from `tabLoan Repayment Schedule`')
    frappe.db.commit()
    print("Deleted all draft salary slips, payroll entries, and loans.")
