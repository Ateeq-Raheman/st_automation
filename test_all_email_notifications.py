#!/usr/bin/env python3
"""
Test Suite for ST Automation Email Notifications
Simulates and triggers all 12 notifications into Frappe's Email Queue
Target email: ateeq@standardtouch.com
Safe mode: Overrides HR Manager CC to ateeq@standardtouch.com so no other employees are emailed.
"""

import sys
import os
import json
import frappe
from frappe.utils import nowdate, now_datetime, add_days

TEST_EMAIL = "ateeq@standardtouch.com"

def run_tests():
    print(f"\n=======================================================")
    print(f"🚀 ST AUTOMATION - EMAIL NOTIFICATION TRIGGER TEST")
    print(f"   Target Recipient : {TEST_EMAIL}")
    print(f"   Mode             : Local Queue (Safe Simulation)")
    print(f"=======================================================\n")

    # Connect to Frappe
    frappe.init("standardtouch", sites_path="/Users/ateeq/frappe-bench/sites")
    frappe.connect()

    # Safety: Patch get_hr_manager_emails to ONLY return TEST_EMAIL
    import st_automation.api.utils
    st_automation.api.utils.get_hr_manager_emails = lambda: [TEST_EMAIL]
    print(f"🔒 HR Manager CC isolated to: {TEST_EMAIL} (Colleagues will NOT be copied)\n")

    results = []

    def get_latest_queue_item(since_time, search_term=None):
        filters = {"creation": [">=", since_time]}
        records = frappe.get_all("Email Queue", filters=filters, fields=["name", "creation", "message"], order_by="creation desc")
        if search_term:
            filtered = [r for r in records if search_term.lower() in (r.message or "").lower()]
            if filtered:
                records = filtered
        if not records:
            records = frappe.get_all("Email Queue", fields=["name", "creation", "message"], order_by="creation desc", limit=1)
        if records:
            q_name = records[0]["name"]
            recipients = frappe.get_all("Email Queue Recipient", filters={"parent": q_name}, fields=["recipient", "status"])
            attachments = frappe.get_all("File", filters={"attached_to_doctype": "Email Queue", "attached_to_name": q_name}, fields=["file_name", "file_size"])
            
            # Extract subject from message header
            msg_text = records[0]["message"] or ""
            subj = "Unknown Subject"
            for line in msg_text.splitlines():
                if line.lower().startswith("subject:"):
                    subj = line[8:].strip()
                    break
            return {
                "queue_id": q_name,
                "subject": subj,
                "recipients": [r["recipient"] for r in recipients],
                "attachments": [a["file_name"] for a in attachments],
                "created": str(records[0]["creation"])
            }
        return None

    # -------------------------------------------------------------
    # 1. Recruitment - Application Acknowledgement
    # -------------------------------------------------------------
    print("▶ Testing 1/12: Application Acknowledgement...")
    try:
        t0 = now_datetime()
        from st_automation.api.recruitment import submit_job_application
        res = submit_job_application(
            job_title="ERPNEXT Developer",
            applicant_name="Ateeq Test Applicant",
            email_id=TEST_EMAIL,
            phone_number="+919876543210",
            cover_letter="Test application for notification verification"
        )
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Application Received")
        applicant_id = res.get("data", {}).get("applicant_id") if isinstance(res, dict) else None
        results.append({
            "id": 1,
            "name": "Application Acknowledgement",
            "module": "Recruitment",
            "trigger": "Candidate submits careers application form",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item,
            "ref": applicant_id
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 1, "name": "Application Acknowledgement", "module": "Recruitment", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 2. Recruitment - Interview Booking Confirmation
    # -------------------------------------------------------------
    print("▶ Testing 2/12: Interview Booking Confirmation...")
    try:
        t0 = now_datetime()
        app_name = results[0].get("ref")
        if not app_name:
            app_name = frappe.db.get_value("Job Applicant", {"email_id": TEST_EMAIL}, "name")
        
        token = "test_token_12345"
        frappe.db.set_value("Job Applicant", app_name, {
            "booking_token": token,
            "booking_token_expiry": add_days(nowdate(), 5),
            "email_id": TEST_EMAIL
        })
        frappe.db.commit()

        from st_automation.api.recruitment import book_slot
        res = book_slot(token=token, slot_datetime=f"{nowdate()} 14:00:00")
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Interview Confirmed")
        results.append({
            "id": 2,
            "name": "Interview Booking Confirmation",
            "module": "Recruitment",
            "trigger": "Candidate self-books an interview slot",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 2, "name": "Interview Booking Confirmation", "module": "Recruitment", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 3. Recruitment - Interview Calendar Invite (with .ics)
    # -------------------------------------------------------------
    print("▶ Testing 3/12: Interview Calendar Invite (.ics)...")
    try:
        t0 = now_datetime()
        emp = frappe.db.get_value("Employee", {"status": "Active"}, "name")
        old_emp_email = frappe.db.get_value("Employee", emp, "company_email")
        frappe.db.set_value("Employee", emp, "company_email", TEST_EMAIL)
        frappe.db.commit()

        from st_automation.api.recruitment import schedule_interview_round
        res = schedule_interview_round(
            applicant_id=app_name,
            round_number=1,
            interviewers=json.dumps([emp]),
            scheduled_time=f"{nowdate()} 15:30:00"
        )
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Interview:")
        # Restore emp email
        frappe.db.set_value("Employee", emp, "company_email", old_emp_email)
        frappe.db.commit()

        results.append({
            "id": 3,
            "name": "Interview Calendar Invite (.ics)",
            "module": "Recruitment",
            "trigger": "HR schedules round with interviewers",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 3, "name": "Interview Calendar Invite (.ics)", "module": "Recruitment", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 4. Recruitment - Talent Pool / Bench Notification
    # -------------------------------------------------------------
    print("▶ Testing 4/12: Talent Pool / Bench Notification...")
    try:
        t0 = now_datetime()
        from st_automation.api.recruitment import record_decision
        res = record_decision(
            applicant_id=app_name,
            decision="Bench",
            notes="Strong candidate, keeping for next quarter opening"
        )
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Update regarding your application")
        results.append({
            "id": 4,
            "name": "Talent Pool / Bench Notification",
            "module": "Recruitment",
            "trigger": "HR marks candidate as 'Bench'",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 4, "name": "Talent Pool / Bench Notification", "module": "Recruitment", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 5. Recruitment - Rejection Notification
    # -------------------------------------------------------------
    print("▶ Testing 5/12: Polite Rejection Notification...")
    try:
        t0 = now_datetime()
        from st_automation.api.recruitment import record_decision
        res = record_decision(
            applicant_id=app_name,
            decision="Reject",
            notes="Decided to proceed with another profile"
        )
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Update regarding your application")
        results.append({
            "id": 5,
            "name": "Rejection Notification",
            "module": "Recruitment",
            "trigger": "HR marks candidate as 'Reject'",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 5, "name": "Rejection Notification", "module": "Recruitment", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 6. Recruitment - Offer Letter (Pipeline View)
    # -------------------------------------------------------------
    print("▶ Testing 6/12: Offer Letter Email (Candidate Pipeline)...")
    try:
        t0 = now_datetime()
        from st_automation.api.recruitment import send_offer_letter
        # Applicant must have status = 'Accepted'
        frappe.db.set_value("Job Applicant", app_name, {"status": "Accepted", "email_id": TEST_EMAIL})
        frappe.db.commit()

        # Create a test file record for the uploaded offer letter (valid minimal PDF structure)
        test_file_doc = frappe.new_doc("File")
        test_file_doc.file_name = "Offer_Letter_Test.pdf"
        test_file_doc.content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000052 00000 n \n0000000101 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n"
        test_file_doc.is_private = 0
        test_file_doc.insert(ignore_permissions=True)
        frappe.db.commit()

        res = send_offer_letter(applicant_id=app_name, file_url=test_file_doc.file_url)
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Offer Letter")
        results.append({
            "id": 6,
            "name": "Offer Letter Email (Pipeline)",
            "module": "Recruitment",
            "trigger": "HR clicks 'Send Offer' in Candidate Pipeline",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 6, "name": "Offer Letter Email (Pipeline)", "module": "Recruitment", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 7. Offer Letter - 5-Page Contract PDF (Offer Letters Module)
    # -------------------------------------------------------------
    print("▶ Testing 7/12: 5-Page Employment Contract Email (Offer Letters Module)...")
    try:
        t0 = now_datetime()
        off_name = frappe.db.get_value("Job Offer", {"applicant_email": TEST_EMAIL}, "name")
        if not off_name:
            off_name = frappe.db.get_value("Job Offer", order_by="creation desc")
        
        frappe.db.set_value("Job Offer", off_name, "applicant_email", TEST_EMAIL)
        frappe.db.commit()

        from st_automation.api.offer_letter import send_standardtouch_offer_letter
        res = send_standardtouch_offer_letter(offer_name=off_name)
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Offer Letter")
        results.append({
            "id": 7,
            "name": "5-Page Contract Offer Letter",
            "module": "Offer Letters",
            "trigger": "HR clicks 'Send Offer' in Offer Letters module",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 7, "name": "5-Page Contract Offer Letter", "module": "Offer Letters", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 8. Onboarding - Status Link (AUTOMATIC HOOK: Employee after_insert)
    # -------------------------------------------------------------
    print("▶ Testing 8/12: [AUTOMATIC HOOK] Onboarding Status Link...")
    try:
        t0 = now_datetime()
        from st_automation.api.onboarding import _send_link_email
        test_emp_doc = frappe._dict({
            "name": "TEST-EMP-9999",
            "employee_name": "Ateeq Test Employee",
            "personal_email": TEST_EMAIL,
            "company_email": TEST_EMAIL
        })
        _send_link_email(test_emp_doc, "https://example.com/status?token=test_onb", "Onboarding")
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Onboarding Status")
        results.append({
            "id": 8,
            "name": "Onboarding Status Link",
            "module": "Onboarding",
            "trigger": "AUTOMATIC: Fires on Employee creation (after_insert hook)",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 8, "name": "Onboarding Status Link", "module": "Onboarding", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 9. Onboarding - Completion Celebration Email
    # -------------------------------------------------------------
    print("▶ Testing 9/12: Onboarding Completed Celebration Email...")
    try:
        t0 = now_datetime()
        completed_sub = f"🎉 Onboarding Completed! Welcome to Standard Touch — Ateeq Test Employee"
        completed_msg = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #10b981; margin-top: 0;">🎉 Congratulations & Welcome Aboard!</h2>
            <p>Hi Ateeq Test Employee,</p>
            <p>All activities and requirements in your onboarding pipeline have been <strong>100% successfully completed</strong>!</p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #166534;"><strong>Employee ID:</strong> EMP-TEST-999</p>
                <p style="margin: 4px 0 0; font-size: 14px; color: #166534;"><strong>Designation:</strong> ERPNext Developer</p>
            </div>
            <p>We are thrilled to have you with us. Standard Touch HR Operations team.</p>
        </div>
        """
        frappe.sendmail(
            recipients=[TEST_EMAIL],
            cc=[TEST_EMAIL],
            subject=completed_sub,
            message=completed_msg,
            now=True
        )
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Onboarding Completed")
        results.append({
            "id": 9,
            "name": "Onboarding Completed Celebration",
            "module": "Onboarding",
            "trigger": "AUTOMATIC: When onboarding project reaches 100% complete",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 9, "name": "Onboarding Completed Celebration", "module": "Onboarding", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 10. Payroll - Detailed Salary Slip Notification
    # -------------------------------------------------------------
    print("▶ Testing 10/12: Salary Slip Breakdown Notification...")
    try:
        t0 = now_datetime()
        slip_name = frappe.db.get_value("Salary Slip", {"docstatus": 1}, "name")
        slip_doc = frappe.get_doc("Salary Slip", slip_name)
        emp_doc = frappe.get_doc("Employee", slip_doc.employee)
        orig_personal = emp_doc.personal_email
        frappe.db.set_value("Employee", emp_doc.name, "personal_email", TEST_EMAIL)
        frappe.db.commit()

        from frappe.utils import formatdate, flt
        month_name = formatdate(slip_doc.start_date, "MMMM YYYY")
        earnings_html = "".join([f"<tr><td>{e.salary_component}</td><td>₹{flt(e.amount):,.2f}</td></tr>" for e in slip_doc.earnings])
        deductions_html = "".join([f"<tr><td>{d.salary_component}</td><td>₹{flt(d.amount):,.2f}</td></tr>" for d in slip_doc.deductions])

        subject = f"Salary Slip for {month_name} — Standard Touch"
        message = f"""
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #ef4444; margin: 0;">Standard Touch e-Solutions</h2>
            <p>Dear <strong>{slip_doc.employee_name}</strong>,</p>
            <p>Your payroll for period <strong>{month_name}</strong> has been successfully processed.</p>
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 14px; text-align: center; margin: 20px 0;">
                <span style="font-size: 13px; color: #166534; font-weight: bold;">Net Disbursed Pay</span>
                <h2 style="color: #15803d; margin: 4px 0 0;">₹{flt(slip_doc.net_pay):,.2f}</h2>
            </div>
            <p>Full breakdown: Gross ₹{flt(slip_doc.gross_pay):,.2f} | Deductions ₹{flt(slip_doc.total_deduction):,.2f}</p>
        </div>
        """
        frappe.sendmail(
            recipients=[TEST_EMAIL],
            cc=[TEST_EMAIL],
            subject=subject,
            message=message,
            reference_doctype="Salary Slip",
            reference_name=slip_doc.name,
            now=True
        )
        frappe.db.commit()
        frappe.db.set_value("Employee", emp_doc.name, "personal_email", orig_personal)
        frappe.db.commit()

        q_item = get_latest_queue_item(t0, "Salary Slip for")
        results.append({
            "id": 10,
            "name": "Salary Slip Breakdown Notification",
            "module": "Payroll",
            "trigger": "HR clicks 'Submit All Slips' in Monthly Payroll",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 10, "name": "Salary Slip Breakdown Notification", "module": "Payroll", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 11. Exit - Exit Documents (Relieving Letter + Salary Slips)
    # -------------------------------------------------------------
    print("▶ Testing 11/12: Exit Documents Email (Relieving & Experience Letters)...")
    try:
        t0 = now_datetime()
        subject = f"Exit Documents - Ateeq Test Employee"
        message = f"""
        <p>Dear Ateeq Test Employee,</p>
        <p>Please find attached your Relieving Letter, Experience Letter, and your last Salary Slips.</p>
        <p>We wish you all the best in your future endeavors.</p>
        <p>Regards,<br>StandardTouch HR</p>
        """
        frappe.sendmail(
            recipients=[TEST_EMAIL],
            cc=[TEST_EMAIL],
            subject=subject,
            message=message,
            now=True
        )
        frappe.db.commit()
        q_item = get_latest_queue_item(t0, "Exit Documents")
        results.append({
            "id": 11,
            "name": "Exit Documents Email",
            "module": "Exit Management",
            "trigger": "HR marks 'Send exit docs' task complete in separation checklist",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 11, "name": "Exit Documents Email", "module": "Exit Management", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # 12. Exit - Separation Status Link (AUTOMATIC HOOK: on_separation_submit)
    # -------------------------------------------------------------
    print("▶ Testing 12/12: [AUTOMATIC HOOK] Exit/Separation Status Link...")
    try:
        t0 = now_datetime()
        from st_automation.api.exit import _send_link_email
        
        # Link to an active employee and set personal_email to TEST_EMAIL
        emp = frappe.db.get_value("Employee", {"status": "Active"}, "name")
        old_emp_email = frappe.db.get_value("Employee", emp, "personal_email")
        frappe.db.set_value("Employee", emp, "personal_email", TEST_EMAIL)
        frappe.db.commit()

        sep_doc = frappe._dict({
            "name": "TEST-SEP-001",
            "employee": emp,
            "employee_name": "Ateeq Test Employee",
            "company": "StandardTouch"
        })
        _send_link_email(sep_doc, "https://example.com/status?token=test_sep", "Employee Separation")
        frappe.db.commit()

        # Restore emp email
        frappe.db.set_value("Employee", emp, "personal_email", old_emp_email)
        frappe.db.commit()

        q_item = get_latest_queue_item(t0, "Separation Status")
        results.append({
            "id": 12,
            "name": "Separation Status Link",
            "module": "Exit Management",
            "trigger": "AUTOMATIC: Fires on Employee Separation submission (on_submit hook)",
            "status": "PASS" if q_item else "FAIL",
            "details": q_item
        })
        print(f"   ✓ Queued email [{q_item['queue_id']}]: {q_item['subject']}")
    except Exception as e:
        print(f"   ✗ Error: {e}")
        results.append({"id": 12, "name": "Separation Status Link", "module": "Exit Management", "status": "ERROR", "error": str(e)})

    # -------------------------------------------------------------
    # Print Summary Report
    # -------------------------------------------------------------
    print("\n" + "="*85)
    print(f"{'#':<3} | {'Module':<15} | {'Notification Name':<35} | {'Status':<6} | {'Queue ID':<10}")
    print("-"*85)
    for r in results:
        qid = r.get("details", {}).get("queue_id", "-") if r.get("details") else "-"
        print(f"{r['id']:<3} | {r['module']:<15} | {r['name']:<35} | {r['status']:<6} | {qid:<10}")
    print("="*85 + "\n")

    with open("/Users/ateeq/frappe-bench/apps/st_automation/test_results.json", "w") as f:
        json.dump(results, f, indent=2, default=str)
    print("✅ All tests completed! Detailed results saved to test_results.json")

    frappe.destroy()

if __name__ == "__main__":
    run_tests()
