import frappe
from frappe.utils import get_url, now_datetime, add_to_date, format_datetime, formatdate, getdate, get_datetime
import uuid
from datetime import timedelta


def split_datetime(dt_str):
	"""Splits a datetime-ish string (e.g. from a <input type=datetime-local>)
	into (date, time) for doctypes — like the core HRMS `Interview` — that
	store scheduling as separate Date + Time fields rather than one Datetime
	field. Assigning the full string to the Date field alone silently drops
	the time entirely. The time half is returned as a `timedelta` since
	that's what the Frappe ORM itself uses for Time fields."""
	dt = get_datetime(dt_str)
	return dt.date(), timedelta(hours=dt.hour, minutes=dt.minute, seconds=dt.second)


def combine_date_time(date_val, time_val):
	"""Combines a Date value and a Time value (as returned by the Frappe ORM —
	Time fields come back as `datetime.timedelta`) into a single ISO-8601
	datetime string with no timezone marker, so the frontend's `new Date(...)`
	interprets it as local time instead of misreading a date-only value as
	UTC midnight."""
	if not date_val:
		return None
	seconds = int(time_val.total_seconds()) if isinstance(time_val, timedelta) else 0
	hours, remainder = divmod(seconds, 3600)
	minutes, secs = divmod(remainder, 60)
	return f"{date_val}T{hours:02d}:{minutes:02d}:{secs:02d}"


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
