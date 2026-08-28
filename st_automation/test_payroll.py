import frappe

def test_payroll_deep():
    company = frappe.db.get_single_value("Global Defaults", "default_company")
    if not company:
        company = frappe.get_all("Company")[0].name

    print(f"\n--- Testing Payroll for {company} ---")
    
    # 1. Clean up existing DRAFT Payroll Entries for August
    draft_payroll_entries = frappe.get_all("Payroll Entry", filters={"docstatus": 0, "start_date": "2026-08-01"})
    for pe in draft_payroll_entries:
        frappe.delete_doc("Payroll Entry", pe.name, force=1)
        print(f"Deleted draft Payroll Entry: {pe.name}")
        
    # Clean up existing DRAFT Salary Slips for August
    draft_slips = frappe.get_all("Salary Slip", filters={"docstatus": 0, "start_date": "2026-08-01"})
    for slip in draft_slips:
        frappe.delete_doc("Salary Slip", slip.name, force=1)
        print(f"Deleted draft Salary Slip: {slip.name}")

    frappe.db.commit()

    # 2. Get active employees
    employees = frappe.get_all("Employee", filters={"status": "Active", "company": company})
    
    # Ensure they have structure assigned
    for emp in employees:
        emp_name = emp.name
        assignments = frappe.get_all("Salary Structure Assignment", filters={"employee": emp_name, "docstatus": 1})
        if not assignments:
            print(f"Employee {emp_name} missing Salary Structure.")
            structures = frappe.get_all("Salary Structure", filters={"docstatus": 1, "is_active": "Yes"})
            if structures:
                from st_automation.api.payroll import assign_salary_structure
                assign_salary_structure(emp_name, structures[0].name, "2026-08-01", company)
                print(f"-> Assigned {structures[0].name} to {emp_name}")

    # 3. Run payroll
    from st_automation.api.payroll import run_payroll_and_report
    print("Executing Payroll Run...")
    res = run_payroll_and_report(company, "2026-08-01", "2026-08-31")
    import json
    if isinstance(res, dict):
        print(json.dumps(res, indent=2))
    elif hasattr(res, 'message'):
        print(res.message)
    else:
        print(res)

