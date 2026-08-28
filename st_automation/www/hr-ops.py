import frappe

no_cache = 1

def get_context(context):
	context.no_cache = 1
	context.title = "Standard Touch — HR Operations"
	context.boot = frappe.as_json({
		"user": frappe.session.user,
		"is_logged_in": frappe.session.user != "Guest",
		"csrf_token": frappe.sessions.get_csrf_token() if frappe.session.user != "Guest" else "",
		"site_name": frappe.local.site,
	})
	return context
