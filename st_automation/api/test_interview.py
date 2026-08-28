import frappe
import json
from st_automation.api.recruitment import schedule_interview_round

def run():
    # Find an applicant
    applicant = frappe.get_all("Job Applicant", limit=1)
    if not applicant:
        print("No applicant found")
        return
    
    applicant_id = applicant[0].name
    
    # Find an employee
    employee = frappe.get_all("Employee", limit=1)
    if not employee:
        print("No employee found")
        return
        
    emp_id = employee[0].name
    
    print(f"Testing with applicant {applicant_id} and employee {emp_id}")
    
    # Call the function
    try:
        res = schedule_interview_round(
            applicant_id=applicant_id,
            round_number=1,
            interviewers=json.dumps([emp_id]),
            scheduled_time="2026-08-30 10:00:00"
        )
        print("Result:", res)
    except Exception as e:
        import traceback
        print("Error:", str(e))
        traceback.print_exc()
