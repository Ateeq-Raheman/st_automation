import frappe
from frappe.utils import get_url, now_datetime, add_to_date, format_datetime, formatdate, getdate
import uuid


def success_response(data=None, message=None):
	"""Standardized success response wrapper."""
	return {
		"status": "success",
		"message": message or "Operation completed successfully",
		"data": data if data is not None else {}
	}


def error_response(message, exc=None):
	"""Standardized error response wrapper."""
	if exc:
		error_title = f"{message}: {str(exc)}"[:130]
		try:
			frappe.log_error(str(exc), error_title)
		except Exception:
			pass
	return {
		"status": "error",
		"message": str(message),
		"data": {}
	}


def generate_secure_token(prefix="st_"):
	"""Generates a secure, URL-safe random token."""
	return f"{prefix}{uuid.uuid4().hex}"


def get_site_booking_url(token):
	"""Generates the absolute URL for candidate slot booking."""
	base_url = get_url()
	return f"{base_url}/hr-ops#/book-slot?token={token}"


def ensure_custom_fields_exist():
	"""Self-healing helper: ensures essential fields exist on Job Applicant & Company."""
	try:
		from st_automation.setup import setup_custom_fields
		setup_custom_fields()
	except Exception as e:
		frappe.log_error(f"Error ensuring custom fields: {e}", "st_automation Self-Healing")


def safe_float(val, default=0.0):
	try:
		return float(val or default)
	except (ValueError, TypeError):
		return default


def safe_int(val, default=0):
	try:
		return int(val or default)
	except (ValueError, TypeError):
		return default
