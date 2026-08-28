import frappe

def run():
    if frappe.db.exists("Loan Product", "SA-001"):
        doc = frappe.get_doc("Loan Product", "SA-001")
        
        income = frappe.db.get_value("Account", {"company": doc.company, "root_type": "Income", "is_group": 0})
        asset = frappe.db.get_value("Account", {"company": doc.company, "root_type": "Asset", "is_group": 0})
        mop = frappe.db.get_value("Mode of Payment", {}) or "Cash"
        
        doc.interest_income_account = doc.interest_income_account or income
        doc.penalty_income_account = doc.penalty_income_account or income
        doc.disbursement_account = doc.disbursement_account or asset
        doc.interest_receivable_account = doc.interest_receivable_account or asset
        doc.penalty_receivable_account = doc.penalty_receivable_account or asset
        doc.mode_of_payment = doc.mode_of_payment or mop
        
        doc.flags.ignore_mandatory = True
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        print("Patched SA-001")
