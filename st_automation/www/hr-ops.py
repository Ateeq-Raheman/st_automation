import frappe
import glob
import os

no_cache = 1


def _find_built_asset(pattern):
	"""
	The Vite build now emits content-hashed filenames (`index-<hash>.js`)
	instead of a fixed `index.js` — that fixed name was the actual root
	cause of two rounds of "the fix isn't showing up" this session (Safari
	kept serving old cached bundles since the URL never changed on deploy).
	The hashed filename changes every build, so this resolves whichever one
	is actually on disk right now instead of a path hardcoded in the template.
	"""
	frontend_dir = os.path.join(frappe.get_app_path("st_automation"), "public", "frontend")
	matches = sorted(glob.glob(os.path.join(frontend_dir, pattern)))
	if not matches:
		return None
	return os.path.basename(matches[-1])


def get_context(context):
	context.no_cache = 1
	context.title = "Standard Touch — HR Operations"
	context.js_file = _find_built_asset("index-*.js") or "index.js"
	context.css_file = _find_built_asset("index-*.css") or "index.css"
	context.boot = frappe.as_json({
		"user": frappe.session.user,
		"is_logged_in": frappe.session.user != "Guest",
		"csrf_token": frappe.sessions.get_csrf_token() if frappe.session.user != "Guest" else "",
		"site_name": frappe.local.site,
	})
	return context
