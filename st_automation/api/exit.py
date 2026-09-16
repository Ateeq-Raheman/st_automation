import frappe
from frappe.utils import now_datetime, add_to_date, nowdate, getdate
from st_automation.api.utils import success_response, error_response, generate_secure_token

def get_site_exit_url(token):
    base_url = frappe.utils.get_url()
    return f"{base_url}/hr-ops?exit_token={token}"

# ─────────────────────────────────────────────
# Pipeline
# ─────────────────────────────────────────────

@frappe.whitelist()
def get_exit_pipeline(company=None, include_completed=0):
    try:
        include_completed = int(include_completed or 0)
        filters = {"docstatus": 1}
        if not include_completed:
            filters["boarding_status"] = ["!=", "Completed"]
        if company:
            filters["company"] = company

        separations = frappe.get_all(
            "Employee Separation",
            filters=filters,
            fields=["name", "employee", "employee_name", "designation", "department",
                     "company", "project", "boarding_status", "resignation_letter_date",
                     "boarding_begins_on", "creation"],
            order_by="creation desc"
        )

        results = []
        for sep in separations:
            tasks = []
            percent_complete = 0
            if sep.project:
                percent_complete = frappe.db.get_value("Project", sep.project, "percent_complete") or 0
                tasks = frappe.get_all(
                    "Task",
                    filters={"project": sep.project},
                    fields=["name", "subject", "status", "exp_start_date", "exp_end_date",
                             "completed_by", "completed_on", "description", "_assign", "creation"],
                    order_by="exp_start_date asc, creation asc"
                )
                import json
                for t in tasks:
                    try:
                        t["assigned_to"] = json.loads(t.get("_assign") or "[]")
                    except Exception:
                        t["assigned_to"] = []

            token = frappe.db.get_value("Employee Separation", sep.name, "exit_status_token")
            image = frappe.db.get_value("Employee", sep.employee, "image") if sep.employee else None
            relieving_date = frappe.db.get_value("Employee", sep.employee, "relieving_date") if sep.employee else None
            emp_status = frappe.db.get_value("Employee", sep.employee, "status") if sep.employee else None

            results.append({
                "name": sep.name,
                "employee": sep.employee,
                "employee_name": sep.employee_name,
                "designation": sep.designation,
                "department": sep.department,
                "company": sep.company,
                "percent_complete": percent_complete,
                "boarding_status": sep.boarding_status,
                "resignation_letter_date": sep.resignation_letter_date,
                "boarding_begins_on": sep.boarding_begins_on,
                "tasks": tasks,
                "token": token,
                "status_url": get_site_exit_url(token) if token else None,
                "image": image,
                "relieving_date": relieving_date,
                "employee_status": emp_status,
            })

        return success_response({"separations": results})
    except Exception as e:
        return error_response("Error loading exit pipeline", e)


# ─────────────────────────────────────────────
# Start / Create Separation
# ─────────────────────────────────────────────

@frappe.whitelist()
def get_employees_for_separation(company=None):
    """Return active employees for the separation modal's employee picker."""
    try:
        filters = {"status": "Active"}
        if company:
            filters["company"] = company
        employees = frappe.get_all("Employee",
            filters=filters,
            fields=["name", "employee_name", "designation", "department", "company", "image"],
            order_by="employee_name asc",
            limit=500)
        return success_response({"employees": employees})
    except Exception as e:
        return error_response("Error loading employees", e)


@frappe.whitelist()
def get_templates(company=None):
    """Return available separation templates."""
    try:
        filters = {}
        if company:
            filters["company"] = company
        templates = frappe.get_all("Employee Separation Template",
            filters=filters,
            fields=["name", "title", "company"],
            order_by="title asc")
        return success_response({"templates": templates})
    except Exception as e:
        return error_response("Error loading templates", e)


@frappe.whitelist()
def start_separation(employee, template=None, resignation_date=None, relieving_date=None):
    """Create an Employee Separation from the custom HR-Ops page."""
    try:
        if not frappe.db.exists("Employee", employee):
            return error_response("Employee not found.")

        emp_doc = frappe.get_doc("Employee", employee)
        if emp_doc.status != "Active":
            return error_response(f"Employee {emp_doc.employee_name} is not Active (current status: {emp_doc.status}).")

        # Prevent duplicate
        existing = frappe.db.exists("Employee Separation", {
            "employee": employee, "docstatus": ["!=", 2], "boarding_status": ["!=", "Completed"]
        })
        if existing:
            return error_response(f"An active separation already exists for this employee: {existing}")

        if not template:
            template = frappe.db.get_value("Employee Separation Template", {"company": emp_doc.company}, "name")

        if not template:
            return error_response(f"No Employee Separation Template found for company {emp_doc.company}")

        sep = frappe.new_doc("Employee Separation")
        sep.employee = employee
        sep.company = emp_doc.company
        sep.employee_name = emp_doc.employee_name
        sep.designation = emp_doc.designation
        sep.department = emp_doc.department
        sep.resignation_letter_date = resignation_date or nowdate()
        sep.boarding_begins_on = resignation_date or nowdate()
        sep.employee_separation_template = template
        sep.boarding_status = "Pending"

        # Copy activities from template
        template_doc = frappe.get_doc("Employee Separation Template", template)
        for act in template_doc.activities:
            sep.append("activities", {
                "activity_name": act.activity_name,
                "role": act.role,
                "user": act.user,
                "begin_on": act.begin_on,
                "duration": act.duration,
                "description": act.description,
                "task_weight": act.task_weight,
            })

        sep.flags.ignore_mandatory = True
        sep.insert(ignore_permissions=True, ignore_mandatory=True)

        # Workaround for standard ERPNext duplicate Project error
        # ERPNext hardcodes project name to "Employee Separation : {employee}".
        # If an old project exists, it will throw an IntegrityError.
        expected_project_name = f"Employee Separation : {employee}"
        if frappe.db.exists("Project", expected_project_name):
            old_proj = frappe.get_doc("Project", expected_project_name)
            old_proj.db_set("project_name", f"{expected_project_name} - Old - {frappe.utils.now_datetime().strftime('%Y%m%d%H%M%S')}")

        sep.submit()
        frappe.db.commit()

        # Generate exit token
        token = generate_secure_token(prefix="ext_")
        sep.db_set('exit_status_token', token)
        sep.db_set('exit_status_token_expiry', add_to_date(now_datetime(), days=7))

        # Assign manager handover task
        _assign_manager_handover(sep)

        url = get_site_exit_url(token)
        _send_link_email(sep, url, "Separation")

        # Optionally set relieving date on employee
        if relieving_date:
            emp_doc.db_set('relieving_date', getdate(relieving_date))

        return success_response({
            "separation_id": sep.name,
            "token": token,
            "url": url
        }, f"Separation initiated for {emp_doc.employee_name}.")
    except Exception as e:
        frappe.db.rollback()
        return error_response(f"Error initiating separation: {e}", e)


# ─────────────────────────────────────────────
# Task Operations
# ─────────────────────────────────────────────

@frappe.whitelist()
def complete_stage(separation, task_name, record_type="exit"):
    try:
        sep_doc = frappe.get_doc("Employee Separation", separation)

        task = frappe.get_doc("Task", task_name)
        if task.project != sep_doc.project:
            return error_response("Task does not belong to this employee's pipeline.")

        if task.status == "Completed":
            return error_response("Task is already completed.")

        # Asset return validation
        if "asset" in task.subject.lower() and "return" in task.subject.lower():
            active_assets = frappe.get_all(
                "Asset",
                filters={"custodian": sep_doc.employee, "status": ["in", ["Issued", "In Use"]]},
                fields=["name", "item_code"]
            )
            if active_assets:
                asset_names = ", ".join([a.name for a in active_assets])
                return error_response(f"Cannot complete this stage. Employee still has active assets: {asset_names}. Please unassign them first.")

        # Sequential gating
        all_tasks = frappe.get_all(
            "Task",
            filters={"project": task.project},
            fields=["name", "subject", "status", "exp_start_date", "creation"],
            order_by="exp_start_date asc, creation asc"
        )
        for prev in all_tasks:
            if prev.name == task.name:
                break
            if prev.status != "Completed":
                return error_response(f"Cannot complete this task. Task '{prev.subject}' must be completed first.")

        task.status = "Completed"
        task.completed_by = frappe.session.user
        task.completed_on = nowdate()
        task.flags.ignore_permissions = True
        task.save(ignore_permissions=True)
        frappe.db.commit()

        # Auto-update boarding_status
        from st_automation.api.onboarding import _check_and_update_boarding_status
        _check_and_update_boarding_status(task.project)

        return success_response({"task": task.name, "status": task.status}, "Stage completed successfully.")
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
# Mark Employee as Left
# ─────────────────────────────────────────────

@frappe.whitelist()
def mark_employee_left(employee, relieving_date=None):
    """After separation is complete, mark employee as Left and deactivate user."""
    try:
        emp_doc = frappe.get_doc("Employee", employee)
        if emp_doc.status == "Left":
            return error_response("Employee is already marked as Left.")

        # Verify that the separation is actually completed
        active_sep = frappe.db.exists("Employee Separation", {
            "employee": employee, "docstatus": 1, "boarding_status": ["!=", "Completed"]
        })
        if active_sep:
            return error_response("Cannot mark as Left — the separation pipeline is not yet completed.")

        emp_doc.db_set('status', 'Left')
        emp_doc.db_set('relieving_date', getdate(relieving_date) if relieving_date else getdate(nowdate()))

        # Deactivate user account
        if emp_doc.user_id:
            frappe.db.set_value("User", emp_doc.user_id, "enabled", 0)

        frappe.db.commit()
        return success_response(message=f"{emp_doc.employee_name} has been marked as Left and their user account deactivated.")
    except Exception as e:
        return error_response(f"Error marking employee as left: {e}", e)


# ─────────────────────────────────────────────
# Public Status (Employee-Facing Magic Link)
# ─────────────────────────────────────────────

@frappe.whitelist(allow_guest=True)
def get_employee_status(token):
    try:
        if not token:
            return error_response("Token is required.")

        sep = frappe.get_all(
            "Employee Separation",
            filters={"exit_status_token": token},
            fields=["name", "employee", "employee_name", "designation", "department",
                     "company", "resignation_letter_date", "exit_status_token_expiry",
                     "project", "boarding_status"],
            limit=1)

        if not sep:
            return error_response("Invalid or expired token.")

        sep = sep[0]
        if sep.exit_status_token_expiry and sep.exit_status_token_expiry < now_datetime():
            return error_response("This status link has expired.")

        tasks = []
        percent_complete = 0
        if sep.project:
            percent_complete = frappe.db.get_value("Project", sep.project, "percent_complete") or 0
            tasks = frappe.get_all("Task",
                filters={"project": sep.project},
                fields=["name", "subject", "status", "exp_start_date"],
                order_by="exp_start_date asc, creation asc")

        return success_response({
            "employee_name": sep.employee_name,
            "designation": sep.designation,
            "department": sep.department,
            "company": sep.company,
            "resignation_letter_date": sep.resignation_letter_date,
            "boarding_status": sep.boarding_status,
            "percent_complete": percent_complete,
            "tasks": tasks
        })
    except Exception as e:
        return error_response("Error loading exit status", e)


# ─────────────────────────────────────────────
# Magic Link Management
# ─────────────────────────────────────────────

@frappe.whitelist()
def resend_status_link(separation, record_type="exit"):
    try:
        sep_doc = frappe.get_doc("Employee Separation", separation)
        token = generate_secure_token(prefix="ext_")
        sep_doc.db_set('exit_status_token', token)
        sep_doc.db_set('exit_status_token_expiry', add_to_date(now_datetime(), days=7))

        url = get_site_exit_url(token)
        _send_link_email(sep_doc, url, "Exit/Separation")
        return success_response({"token": token, "url": url}, "Link generated and email sent.")
    except Exception as e:
        return error_response(f"Error resending link: {e}", e)


@frappe.whitelist()
def revoke_status_link(separation, record_type="exit"):
    try:
        frappe.db.set_value("Employee Separation", separation, {
            "exit_status_token": None,
            "exit_status_token_expiry": None
        }, update_modified=False)
        frappe.db.commit()
        return success_response(message="Exit link revoked successfully.")
    except Exception as e:
        return error_response(f"Error revoking link: {e}", e)


# ─────────────────────────────────────────────
# Email
# ─────────────────────────────────────────────

def _send_link_email(separation_doc, url, flow_type):
    emp_doc = frappe.get_doc("Employee", separation_doc.employee)
    email = emp_doc.personal_email or emp_doc.company_email
    if not email:
        return

    subject = f"Your {flow_type} Status - Standard Touch"
    message = f"""
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #ED1D24; margin-top: 0;">{flow_type} Status Update</h2>
        <p>Hi {separation_doc.employee_name},</p>
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

def _assign_manager_handover(sep_doc):
    """Assign the 'Handover checklist (Manager)' task to the employee's reporting manager."""
    try:
        reports_to = frappe.db.get_value("Employee", sep_doc.employee, "reports_to")
        if not reports_to:
            return
        reports_to_user = frappe.db.get_value("Employee", reports_to, "user_id")
        if not reports_to_user or not sep_doc.project:
            return

        tasks = frappe.get_all("Task",
            filters={"project": sep_doc.project, "subject": ["like", "Handover checklist (Manager)%"]})
        for t in tasks:
            if not frappe.db.exists("ToDo", {"reference_type": "Task", "reference_name": t.name, "allocated_to": reports_to_user}):
                from frappe.desk.form.assign_to import add as add_assign
                add_assign({
                    "assign_to": [reports_to_user],
                    "doctype": "Task",
                    "name": t.name,
                    "description": f"Handover for {sep_doc.employee_name}"
                })
    except Exception as e:
        frappe.log_error(f"Error assigning manager handover: {e}")


def on_separation_submit(doc, method):
    """Hook on Employee Separation on_submit — generate token and assign manager."""
    try:
        token = generate_secure_token(prefix="ext_")
        doc.db_set('exit_status_token', token)
        doc.db_set('exit_status_token_expiry', add_to_date(now_datetime(), days=7))

        _assign_manager_handover(doc)

        url = get_site_exit_url(token)
        _send_link_email(doc, url, "Separation")
    except Exception as e:
        frappe.log_error(f"Error in on_separation_submit for {doc.name}: {e}")
