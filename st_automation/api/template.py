import frappe
from frappe.utils import nowdate, now_datetime
from .utils import success_response, error_response
import json

@frappe.whitelist()
def get_templates(template_type="Onboarding"):
    try:
        doctype = f"Employee {template_type} Template"
        templates = frappe.get_all(
            doctype,
            fields=["name", "title", "company", "department", "designation"],
            order_by="creation desc"
        )
        return success_response({"templates": templates})
    except Exception as e:
        return error_response(f"Error fetching templates: {e}", e)

@frappe.whitelist()
def get_template(template_type, name):
    try:
        doctype = f"Employee {template_type} Template"
        if not frappe.db.exists(doctype, name):
            return error_response("Template not found")
            
        doc = frappe.get_doc(doctype, name)
        
        activities = []
        for act in doc.activities:
            activities.append({
                "activity_name": act.activity_name,
                "role": act.role,
                "user": act.user,
                "begin_on": act.begin_on,
                "duration": act.duration,
                "task_weight": act.task_weight,
                "required_for_employee_creation": act.required_for_employee_creation,
                "description": act.description
            })
            
        return success_response({
            "name": doc.name,
            "title": doc.title,
            "company": doc.company,
            "department": doc.department,
            "designation": doc.designation,
            "employee_grade": doc.employee_grade,
            "activities": activities
        })
    except Exception as e:
        return error_response(f"Error fetching template details: {e}", e)

@frappe.whitelist()
def save_template(template_type, data):
    try:
        doctype = f"Employee {template_type} Template"
        payload = json.loads(data)
        
        name = payload.get("name")
        if name and frappe.db.exists(doctype, name):
            doc = frappe.get_doc(doctype, name)
        else:
            doc = frappe.new_doc(doctype)
            
        doc.title = payload.get("title")
        doc.company = payload.get("company")
        doc.department = payload.get("department")
        doc.designation = payload.get("designation")
        doc.employee_grade = payload.get("employee_grade")
        
        doc.set("activities", [])
        for act in payload.get("activities", []):
            doc.append("activities", {
                "activity_name": act.get("activity_name"),
                "role": act.get("role"),
                "user": act.get("user"),
                "begin_on": int(act.get("begin_on") or 0),
                "duration": int(act.get("duration") or 0),
                "task_weight": float(act.get("task_weight") or 1.0),
                "required_for_employee_creation": int(act.get("required_for_employee_creation") or 0),
                "description": act.get("description")
            })
            
        doc.save(ignore_permissions=True)
        frappe.db.commit()
        
        return success_response({"name": doc.name}, "Template saved successfully")
    except Exception as e:
        frappe.db.rollback()
        return error_response(f"Error saving template: {e}", e)

@frappe.whitelist()
def delete_template(template_type, name):
    try:
        doctype = f"Employee {template_type} Template"
        if not frappe.db.exists(doctype, name):
            return error_response("Template not found")
            
        frappe.delete_doc(doctype, name, force=1, ignore_permissions=True)
        frappe.db.commit()
        
        return success_response({}, "Template deleted successfully")
    except Exception as e:
        frappe.db.rollback()
        return error_response(f"Error deleting template: {e}", e)

@frappe.whitelist()
def get_options_for_templates(company=None):
    try:
        filters = {"status": "Active"}
        if company:
            filters["company"] = company
            
        users = frappe.get_all("User", filters={"enabled": 1, "user_type": "System User"}, fields=["name", "full_name"])
        roles = frappe.get_all("Role", filters={"disabled": 0}, fields=["name", "role_name"])
        departments = frappe.get_all("Department", filters={"disabled": 0}, fields=["name"])
        designations = frappe.get_all("Designation", fields=["name"])
        employee_grades = frappe.get_all("Employee Grade", fields=["name"])
        companies = frappe.get_all("Company", fields=["name"])
        
        return success_response({
            "users": users,
            "roles": roles,
            "departments": departments,
            "designations": designations,
            "employee_grades": employee_grades,
            "companies": companies
        })
    except Exception as e:
        return error_response(f"Error fetching options: {e}", e)
