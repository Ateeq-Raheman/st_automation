import frappe
from st_automation.api.payroll import create_loan_and_disburse, run_payroll_and_report

def test_loan():
    print("Testing Loan...")
    # Find an employee
    emp = frappe.get_all("Employee", limit=1, pluck="name")
    if not emp:
        print("No employee found.")
        return
    
    # Try creating a small loan
    try:
        res = create_loan_and_disburse(
            employee=emp[0],
            amount=5000,
            tenure_months=5,
            monthly_repayment_amount=1000,
            loan_product=None,
            company="StandardTouch"
        )
        print("Loan Test Result:", res)
    except Exception as e:
        print("Loan Test Exception:", str(e))

def test_payroll():
    print("Testing Payroll...")
    try:
        res = run_payroll_and_report(
            company="StandardTouch",
            start_date="2026-08-01",
            end_date="2026-08-31"
        )
        print("Payroll Test Result:", res)
    except Exception as e:
        print("Payroll Test Exception:", str(e))

def run():
    test_loan()
    test_payroll()
