import frappe
import json

def check():
    out = {}
    try:
        eo_meta = frappe.get_meta('Employee Onboarding')
        out['Employee Onboarding'] = {df.fieldname: df.fieldtype for df in eo_meta.fields}
    except Exception as e:
        out['Employee Onboarding'] = str(e)
    try:
        eot_meta = frappe.get_meta('Employee Onboarding Template')
        out['Employee Onboarding Template'] = {df.fieldname: df.fieldtype for df in eot_meta.fields}
    except Exception as e:
        out['Employee Onboarding Template'] = str(e)
    try:
        es_meta = frappe.get_meta('Employee Separation')
        out['Employee Separation'] = {df.fieldname: df.fieldtype for df in es_meta.fields}
    except Exception as e:
        out['Employee Separation'] = str(e)
    try:
        est_meta = frappe.get_meta('Employee Separation Template')
        out['Employee Separation Template'] = {df.fieldname: df.fieldtype for df in est_meta.fields}
    except Exception as e:
        out['Employee Separation Template'] = str(e)
    try:
        emp_meta = frappe.get_meta('Employee')
        out['Employee'] = {df.fieldname: df.fieldtype for df in emp_meta.fields if df.fieldname in ('personal_email', 'preferred_email', 'probation_end_date')}
    except Exception as e:
        out['Employee'] = str(e)
    try:
        asset_meta = frappe.get_meta('Asset')
        out['Asset'] = {df.fieldname: df.fieldtype for df in asset_meta.fields if df.fieldname in ('custodian', 'employee', 'employee_name')}
    except Exception as e:
        out['Asset'] = str(e)
    try:
        asset_movement_meta = frappe.get_meta('Asset Movement')
        out['Asset Movement'] = {df.fieldname: df.fieldtype for df in asset_movement_meta.fields}
    except Exception as e:
        out['Asset Movement'] = str(e)
        
    print(json.dumps(out))
