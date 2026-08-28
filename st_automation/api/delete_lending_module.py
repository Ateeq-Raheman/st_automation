import frappe

def run():
    frappe.db.delete("Module Def", "Loan Management")
    frappe.db.commit()
