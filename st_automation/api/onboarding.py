import frappe
from frappe.utils import now_datetime, add_to_date, nowdate, getdate
from st_automation.api.utils import success_response, error_response, generate_secure_token

def get_site_onboarding_url(token):
    base_url = frappe.utils.get_url()
    return f"{base_url}/hr-ops?onboarding_token={token}"

# ─────────────────────────────────────────────
# Pipeline
# ─────────────────────────────────────────────

@frappe.whitelist()
def get_onboarding_pipeline(company=None, include_completed=0):
    try:
        include_completed = int(include_completed or 0)
        filters = {"docstatus": 1}
        if not include_completed:
            filters["boarding_status"] = ["!=", "Completed"]
        if company:
            filters["company"] = company

        onboardings = frappe.get_all(
            "Employee Onboarding",
            filters=filters,
            fields=["name", "employee", "employee_name", "designation", "department",
                     "company", "project", "boarding_status", "date_of_joining",
                     "boarding_begins_on", "creation"],
            order_by="creation desc"
        )

        results = []
        for ob in onboardings:
            tasks = []
            percent_complete = 0
            if ob.project:
                percent_complete = frappe.db.get_value("Project", ob.project, "percent_complete") or 0
                tasks = frappe.get_all(
                    "Task",
                    filters={"project": ob.project},
                    fields=["name", "subject", "status", "exp_start_date", "exp_end_date",
                             "completed_by", "completed_on", "description", "_assign", "creation"],
                    order_by="exp_start_date asc, creation asc"
                )
                # Parse _assign JSON
                import json
                for t in tasks:
                    try:
                        t["assigned_to"] = json.loads(t.get("_assign") or "[]")
                    except Exception:
                        t["assigned_to"] = []

            token = frappe.db.get_value("Employee", ob.employee, "onboarding_status_token") if ob.employee else None
            image = frappe.db.get_value("Employee", ob.employee, "image") if ob.employee else None

            results.append({
                "name": ob.name,
                "employee": ob.employee,
                "employee_name": ob.employee_name,
                "designation": ob.designation,
                "department": ob.department,
                "company": ob.company,
                "percent_complete": percent_complete,
                "boarding_status": ob.boarding_status,
                "date_of_joining": ob.date_of_joining,
                "boarding_begins_on": ob.boarding_begins_on,
                "tasks": tasks,
                "token": token,
                "status_url": get_site_onboarding_url(token) if token else None,
                "image": image,
            })

        return success_response({"onboardings": results})
    except Exception as e:
        return error_response("Error loading onboarding pipeline", e)


# ─────────────────────────────────────────────
# Start / Create Onboarding
# ─────────────────────────────────────────────

@frappe.whitelist()
def get_templates(company=None, template_type="onboarding"):
    """Return available templates for the given company."""
    try:
        dt = "Employee Onboarding Template" if template_type == "onboarding" else "Employee Separation Template"
        filters = {}
        if company:
            filters["company"] = company
        templates = frappe.get_all(dt, filters=filters, fields=["name", "title", "company"], order_by="title asc")
        return success_response({"templates": templates})
    except Exception as e:
        return error_response("Error loading templates", e)


@frappe.whitelist()
def start_onboarding(employee, template=None, joining_date=None):
    try:
        if not frappe.db.exists("Employee", employee):
            return error_response("Employee not found.")

        job_applicant = frappe.db.get_value("Employee", employee, "job_applicant") or employee

        # Prevent duplicate (HRMS uses job_applicant for uniqueness)
        existing = frappe.db.exists("Employee Onboarding", {"job_applicant": job_applicant, "docstatus": ["!=", 2]})
        if existing:
            return error_response(f"An onboarding already exists for this employee: {existing}")

        emp_doc = frappe.get_doc("Employee", employee)
        if not template:
            template = frappe.db.get_value("Employee Onboarding Template", {"company": emp_doc.company}, "name")

        if not template:
            return error_response(f"No Employee Onboarding Template found for company {emp_doc.company}")

        # Create Employee Onboarding record
        onb = frappe.new_doc("Employee Onboarding")
        onb.employee = employee
        onb.company = emp_doc.company
        onb.employee_name = emp_doc.employee_name
        onb.date_of_joining = joining_date or emp_doc.date_of_joining or nowdate()
        onb.boarding_begins_on = joining_date or emp_doc.date_of_joining or nowdate()
        onb.designation = emp_doc.designation
        onb.department = emp_doc.department
        onb.employee_onboarding_template = template
        onb.job_applicant = job_applicant
        onb.title = f"Onboarding - {emp_doc.employee_name}"
        onb.project_name = f"Onboarding - {emp_doc.employee_name}"

        # Copy activities from template
        template_doc = frappe.get_doc("Employee Onboarding Template", template)
        for act in template_doc.activities:
            onb.append("activities", {
                "activity_name": act.activity_name,
                "role": act.role,
                "user": act.user,
                "begin_on": act.begin_on,
                "duration": act.duration,
                "description": act.description,
                "task_weight": act.task_weight,
                "required_for_employee_creation": act.required_for_employee_creation
            })

        onb.boarding_status = "Pending"
        onb.flags.ignore_mandatory = True
        onb.insert(ignore_permissions=True, ignore_mandatory=True)
        onb.submit()
        frappe.db.commit()

        # Generate onboarding token
        token = generate_secure_token(prefix="onb_")
        emp_doc.db_set('onboarding_status_token', token)
        emp_doc.db_set('onboarding_status_token_expiry', add_to_date(now_datetime(), days=7))

        url = get_site_onboarding_url(token)
        _send_link_email(emp_doc, url, "Onboarding")

        return success_response({"onboarding_id": onb.name, "token": token, "url": url}, "Onboarding started successfully.")
    except Exception as e:
        frappe.db.rollback()
        return error_response(f"Error starting onboarding: {e}", e)


# ─────────────────────────────────────────────
# Task Operations
# ─────────────────────────────────────────────

@frappe.whitelist()
def complete_stage(employee, task_name, record_type="onboarding"):
    try:
        task = frappe.get_doc("Task", task_name)
        if task.status == "Completed":
            return error_response("Task is already completed.")

        # Check if the task is explicitly assigned to someone else
        if frappe.session.user != "Administrator":
            allocations = frappe.get_all("ToDo", filters={"reference_type": "Task", "reference_name": task_name, "status": "Open"}, pluck="allocated_to")
            if allocations and frappe.session.user not in allocations:
                return error_response(f"This task is assigned to {', '.join(allocations)}. Only they can mark it as completed.")

        # Sequential gating
        previous_tasks = frappe.get_all(
            "Task",
            filters={
                "project": task.project,
                "status": ["!=", "Completed"],
                "name": ["!=", task.name]
            },
            fields=["name", "subject", "exp_start_date", "creation"],
            order_by="exp_start_date asc, creation asc"
        )

        for prev in previous_tasks:
            if (prev.exp_start_date and task.exp_start_date and prev.exp_start_date < task.exp_start_date) or \
               (prev.exp_start_date == task.exp_start_date and prev.creation < task.creation):
                return error_response(f"Cannot complete this task. Task '{prev.subject}' must be completed first.")

        task.status = "Completed"
        task.completed_by = frappe.session.user
        task.completed_on = nowdate()
        task.save(ignore_permissions=True)
        frappe.db.commit()

        # Auto-update boarding_status if all tasks done
        _check_and_update_boarding_status(task.project)

        return success_response({"task": task.name}, "Task marked as completed.")
    except Exception as e:
        return error_response(f"Error completing stage: {e}", e)


@frappe.whitelist()
def assign_task(task_name, user):
    """Assign or reassign a task to a specific user."""
    try:
        if not frappe.db.exists("Task", task_name):
            return error_response("Task not found.")
        if not frappe.db.exists("User", user):
            return error_response("User not found.")

        from frappe.desk.form.assign_to import add as add_assign
        add_assign({
            "assign_to": [user],
            "doctype": "Task",
            "name": task_name,
            "description": frappe.db.get_value("Task", task_name, "subject") or ""
        })
        frappe.db.commit()
        return success_response({"task": task_name, "assigned_to": user}, "Task assigned successfully.")
    except Exception as e:
        return error_response(f"Error assigning task: {e}", e)


@frappe.whitelist()
def add_task_comment(task_name, comment):
    """Add a comment/note to a task."""
    try:
        if not frappe.db.exists("Task", task_name):
            return error_response("Task not found.")

        frappe.get_doc("Task", task_name).add_comment("Comment", comment)
        frappe.db.commit()
        return success_response(message="Comment added successfully.")
    except Exception as e:
        return error_response(f"Error adding comment: {e}", e)


# ─────────────────────────────────────────────
# Public Status (Employee-Facing Magic Link)
# ─────────────────────────────────────────────

@frappe.whitelist(allow_guest=True)
def get_employee_status(token):
    try:
        if not token:
            return error_response("Token is required.")

        emp = frappe.get_all("Employee",
            filters={"onboarding_status_token": token},
            fields=["name", "employee_name", "designation", "department", "company",
                     "date_of_joining", "onboarding_status_token_expiry"],
            limit=1)
        if not emp:
            return error_response("Invalid or expired token.")

        emp = emp[0]
        if emp.onboarding_status_token_expiry and emp.onboarding_status_token_expiry < now_datetime():
            return error_response("This status link has expired.")

        onboardings = frappe.get_all("Employee Onboarding",
            filters={"employee": emp.name, "docstatus": 1},
            fields=["name", "project", "boarding_status"],
            order_by="creation desc", limit=1)
        if not onboardings:
            return error_response("No active onboarding found for this employee.")

        obs = onboardings[0]
        tasks = []
        percent_complete = 0
        if obs.project:
            percent_complete = frappe.db.get_value("Project", obs.project, "percent_complete") or 0
            tasks = frappe.get_all("Task",
                filters={"project": obs.project},
                fields=["name", "subject", "status", "exp_start_date"],
                order_by="exp_start_date asc, creation asc")

        return success_response({
            "employee_name": emp.employee_name,
            "designation": emp.designation,
            "department": emp.department,
            "company": emp.company,
            "date_of_joining": emp.date_of_joining,
            "boarding_status": obs.boarding_status,
            "percent_complete": percent_complete,
            "tasks": tasks
        })
    except Exception as e:
        return error_response("Error loading employee status", e)


# ─────────────────────────────────────────────
# Magic Link Management
# ─────────────────────────────────────────────

@frappe.whitelist()
def resend_status_link(employee, record_type="onboarding"):
    try:
        emp_doc = frappe.get_doc("Employee", employee)
        if record_type == "onboarding":
            token = generate_secure_token(prefix="onb_")
            emp_doc.db_set('onboarding_status_token', token)
            emp_doc.db_set('onboarding_status_token_expiry', add_to_date(now_datetime(), days=7))

            url = get_site_onboarding_url(token)
            _send_link_email(emp_doc, url, "Onboarding")
            return success_response({"token": token, "url": url}, "Link generated and email sent.")
    except Exception as e:
        return error_response(f"Error resending link: {e}", e)


@frappe.whitelist()
def revoke_status_link(employee, record_type="onboarding"):
    try:
        if record_type == "onboarding":
            frappe.db.set_value("Employee", employee, {
                "onboarding_status_token": None,
                "onboarding_status_token_expiry": None
            }, update_modified=False)
            frappe.db.commit()
            return success_response(message="Onboarding link revoked successfully.")
    except Exception as e:
        return error_response(f"Error revoking link: {e}", e)


# ─────────────────────────────────────────────
# Email
# ─────────────────────────────────────────────

def _send_link_email(employee_doc, url, flow_type):
    email = employee_doc.personal_email or employee_doc.company_email
    if not email:
        return

    subject = f"Your {flow_type} Status - Standard Touch"
    message = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ED1D24; margin-top: 0;">{flow_type} Status Update</h2>
        <p>Hi {employee_doc.employee_name},</p>
        <p>You can track the progress of your {flow_type.lower()} by clicking the button below:</p>
        <div style="text-align: center; margin: 28px 0;">
            <a href="{url}" style="background-color: #ED1D24; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Status</a>
        </div>
        <p style="font-size: 13px; color: #818285;">This link is valid for 7 days.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
        <p style="font-size: 12px; color: #818285;">Standard Touch HR Operations Team</p>
    </div>
    """
    try:
        frappe.sendmail(
            recipients=[email],
            subject=subject,
            message=message,
            now=True
        )
    except Exception as e:
        frappe.log_error(f"Failed to send {flow_type} email to {email}: {e}")


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _check_and_update_boarding_status(project_name):
    """Auto-update Employee Onboarding/Separation boarding_status based on project completion."""
    if not project_name:
        return
    percent = frappe.db.get_value("Project", project_name, "percent_complete") or 0

    status = "Pending"
    if percent > 0 and percent < 100:
        status = "In Process"
    elif percent >= 100:
        status = "Completed"

    onb = frappe.db.exists("Employee Onboarding", {"project": project_name})
    if onb:
        frappe.db.set_value("Employee Onboarding", onb, "boarding_status", status)

    sep = frappe.db.exists("Employee Separation", {"project": project_name})
    if sep:
        frappe.db.set_value("Employee Separation", sep, "boarding_status", status)


# ─────────────────────────────────────────────
# Hook: on Employee creation
# ─────────────────────────────────────────────

def on_employee_creation(doc, method):
    """Hook on Employee after_insert — auto-create onboarding if created from recruitment."""
    try:
        # Only auto-create if the employee has a linked job_applicant (i.e. came from recruitment)
        if not doc.job_applicant:
            return

        # Guard against double-creation
        job_applicant = doc.job_applicant or doc.name
        existing = frappe.db.exists("Employee Onboarding", {"job_applicant": job_applicant, "docstatus": ["!=", 2]})
        if existing:
            return

        template = frappe.db.get_value("Employee Onboarding Template", {"company": doc.company}, "name")
        if template:
            try:
                onb = frappe.new_doc("Employee Onboarding")
                onb.employee = doc.name
                onb.company = doc.company
                onb.employee_name = doc.employee_name
                onb.date_of_joining = doc.date_of_joining or nowdate()
                onb.boarding_begins_on = doc.date_of_joining or nowdate()
                onb.designation = doc.designation
                onb.department = doc.department
                onb.employee_onboarding_template = template
                onb.job_applicant = job_applicant
                onb.title = f"Onboarding - {doc.employee_name}"
                onb.project_name = f"Onboarding - {doc.employee_name}"

                template_doc = frappe.get_doc("Employee Onboarding Template", template)
                for act in template_doc.activities:
                    onb.append("activities", {
                        "activity_name": act.activity_name,
                        "role": act.role,
                        "user": act.user,
                        "begin_on": act.begin_on,
                        "duration": act.duration,
                        "description": act.description,
                        "task_weight": act.task_weight,
                        "required_for_employee_creation": act.required_for_employee_creation
                    })

                onb.boarding_status = "Pending"
                onb.flags.ignore_mandatory = True
                onb.insert(ignore_permissions=True, ignore_mandatory=True)
                onb.submit()
            except Exception as inner_e:
                frappe.db.rollback()
                frappe.log_error(f"Failed to auto-create onboarding for {doc.name}: {inner_e}")
                return

        token = generate_secure_token(prefix="onb_")
        doc.db_set('onboarding_status_token', token)
        doc.db_set('onboarding_status_token_expiry', add_to_date(now_datetime(), days=7))

        url = get_site_onboarding_url(token)
        _send_link_email(doc, url, "Onboarding")
    except Exception as e:
        frappe.log_error(f"Error in on_employee_creation for {doc.name}: {e}")
