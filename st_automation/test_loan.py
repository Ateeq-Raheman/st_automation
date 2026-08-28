import frappe

def run():
    company = "StandardTouch"
    loan_doc = frappe.new_doc("Loan")
    loan_doc.applicant_type = "Employee"
    loan_doc.applicant = "EMP-100100016"
    loan_doc.company = company
    loan_doc.loan_amount = 50000
    loan_doc.repayment_periods = 10
    loan_doc.monthly_repayment_amount = 5000
    loan_doc.moratorium_tenure = 0
    loan_doc.loan_product = "SA-001"
    
    loan_doc.payment_account = frappe.db.get_value("Account", {"company": company, "account_type": "Cash"})
    if not loan_doc.payment_account: loan_doc.payment_account = frappe.db.get_value("Account", {"company": company, "root_type": "Asset", "is_group": 0})
    
    loan_doc.loan_account = frappe.db.get_value("Account", {"company": company, "account_type": "Receivable"})
    if not loan_doc.loan_account: loan_doc.loan_account = frappe.db.get_value("Account", {"company": company, "root_type": "Asset", "is_group": 0})
    
    income = frappe.db.get_value("Account", {"company": company, "root_type": "Income", "is_group": 0})
    loan_doc.interest_income_account = income
    loan_doc.penalty_income_account = income
    
    loan_doc.posting_date = "2026-08-28"
    loan_doc.flags.ignore_permissions = True
    loan_doc.flags.ignore_mandatory = True
    
    print("BEFORE INSERT ACCOUNTS:")
    print("Payment:", loan_doc.payment_account)
    print("Loan:", loan_doc.loan_account)
    print("Interest:", loan_doc.interest_income_account)
    print("Penalty:", loan_doc.penalty_income_account)
    
    try:
        loan_doc.insert(ignore_permissions=True)
        print("INSERT SUCCESS")
    except Exception as e:
        print("INSERT FAILED", e)
        print("AFTER FAILED ACCOUNTS:")
        print("Payment:", loan_doc.payment_account)
        print("Loan:", loan_doc.loan_account)
        print("Interest:", loan_doc.interest_income_account)
        print("Penalty:", loan_doc.penalty_income_account)
