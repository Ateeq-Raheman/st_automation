import frappe
from st_automation.api.payroll import create_loan_and_disburse, run_payroll_and_report, assign_salary_structure

def run():
    print("----- TESTING LOAN CREATION -----")
    emp = frappe.get_all("Employee", limit=1, pluck="name")
    if not emp:
        print("No employee found.")
    else:
        employee = emp[0]
        try:
            res = create_loan_and_disburse(
                employee=employee,
                amount=5000,
                tenure_months=5,
                monthly_repayment_amount=1000,
                loan_product=None
            )
            print("Loan Success:", res)
        except Exception as e:
            print("Loan Error:", str(e))
            import traceback
            traceback.print_exc()

    print("\n----- ASSIGNING SALARY STRUCTURE -----")
    # Get a salary structure
    struct = frappe.get_all("Salary Structure", limit=1, pluck="name")
    if struct and emp:
        print(f"Assigning {struct[0]} to {employee} from 2026-08-01")
        try:
            res = assign_salary_structure(
                employee=employee,
                salary_structure=struct[0],
                from_date="2026-08-01",
                company="StandardTouch"
            )
            print("Assignment:", res)
        except Exception as e:
            print("Assignment Error:", str(e))

    print("\n----- TESTING PAYROLL CREATION -----")
    # Disable email salary slip to prevent pdfkit crash!
    frappe.db.set_single_value('HR Settings', 'email_salary_slip_to_employee', 0)
    frappe.db.commit()
    print("Disabled 'Email Salary Slip to Employee' in HR Settings.")
    
    try:
        res = run_payroll_and_report(
            company="StandardTouch",
            start_date="2026-08-01",
            end_date="2026-08-31"
        )
        print("Payroll Success:", res)
    except Exception as e:
        print("Payroll Error:", str(e))
        import traceback
        traceback.print_exc()
