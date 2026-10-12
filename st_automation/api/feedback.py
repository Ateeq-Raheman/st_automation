import frappe
from frappe import _
from frappe.utils import today, add_days, getdate

@frappe.whitelist(allow_guest=True)
def submit_feedback(feedback_type, feedback, rating=5, title=None, is_anonymous=1, attachment=None, company=None):
	"""
	Submit a staff feedback.
	Handles anonymity, sets user and employee linkage if not anonymous.
	"""
	user = frappe.session.user
	is_anon = 1 if (is_anonymous in (1, "1", True, "true")) else 0

	# Auto-generate title if missing
	if not title:
		clean_snippet = (feedback or "").strip()
		title = clean_snippet[:50] + "..." if len(clean_snippet) > 50 else clean_snippet
		if not title:
			title = f"{feedback_type} - {today()}"

	doc = frappe.new_doc("Staff Feedback")
	doc.title = title
	doc.feedback_type = feedback_type or "General Feedback"
	doc.rating = int(rating) if rating else 5
	doc.feedback = feedback
	doc.status = "Open"
	doc.date = today()
	doc.company = company
	doc.attachment = attachment
	doc.is_anonymous = is_anon

	# Record user so submitter can track their submission under "My Feedback",
	# while keeping the public display strictly anonymous (employee_name="Anonymous").
	if user and user != "Guest":
		doc.submitted_by_user = user
		emp = frappe.db.get_value(
			"Employee",
			{"user_id": user},
			["name", "employee_name", "department", "company"],
			as_dict=True
		)
		if emp:
			doc.employee = emp.name
			if not is_anon:
				doc.employee_name = emp.employee_name
				doc.department = emp.department
			else:
				doc.employee_name = "Anonymous"
				doc.department = None
			if not doc.company:
				doc.company = emp.company
	else:
		doc.submitted_by_user = None
		doc.employee = None
		doc.employee_name = "Anonymous"
		doc.department = None

	doc.insert(ignore_permissions=True)
	frappe.db.commit()

	return {
		"status": "success",
		"message": "Feedback submitted successfully!",
		"feedback_id": doc.name
	}


@frappe.whitelist()
def get_my_feedback(status=None):
	"""
	Returns feedback submitted by the currently logged-in user in this session (or linked employee).
	"""
	user = frappe.session.user
	if not user or user == "Guest":
		return []

	roles = frappe.get_roles(user)
	is_admin = any(r in roles for r in ["System Manager", "Administrator", "HR Manager"])

	emp = frappe.db.get_value("Employee", {"user_id": user}, "name")

	conditions = []
	values = {"user": user, "emp": emp}

	# If regular user, see own submissions. If admin and no personal submissions found, fall back to recent submissions so list is not empty
	conditions.append("(submitted_by_user = %(user)s OR owner = %(user)s" + (" OR employee = %(emp)s)" if emp else ")"))

	if status and status.lower() != "all":
		conditions.append("status = %(status)s")
		values["status"] = status

	where_clause = " AND ".join(conditions)

	feedbacks = frappe.db.sql(f"""
		SELECT 
			name, title, feedback_type, rating, status, date, feedback, attachment, is_anonymous
		FROM `tabStaff Feedback`
		WHERE {where_clause}
		ORDER BY creation DESC
	""", values, as_dict=True)

	# If admin/HR and has no personal submissions yet, also surface any recent submissions so they can test/see them
	if not feedbacks and is_admin:
		admin_conditions = []
		admin_values = {}
		if status and status.lower() != "all":
			admin_conditions.append("status = %(status)s")
			admin_values["status"] = status
		admin_where = f"WHERE {' AND '.join(admin_conditions)}" if admin_conditions else ""
		feedbacks = frappe.db.sql(f"""
			SELECT 
				name, title, feedback_type, rating, status, date, feedback, attachment, is_anonymous
			FROM `tabStaff Feedback`
			{admin_where}
			ORDER BY creation DESC
			LIMIT 20
		""", admin_values, as_dict=True)

	return feedbacks



@frappe.whitelist()
def get_feedback_overview(company=None, days=30):
	"""
	Returns Analytics Overview for HR / Managers:
	- Total Feedback
	- Positive % (Rating 4 or 5)
	- Needs Attention % (Rating 1 or 2)
	- Anonymous %
	- Breakdown by Category
	- Monthly/Daily Trend
	- Recent Feedback list
	"""
	try:
		days = int(days)
	except (ValueError, TypeError):
		days = 30

	start_date = add_days(today(), -days)

	filters = {"date": [">=", start_date]}
	if company:
		filters["company"] = company

	all_feedbacks = frappe.get_all(
		"Staff Feedback",
		filters=filters,
		fields=[
			"name", "title", "feedback_type", "rating", "status", "date", 
			"feedback", "is_anonymous", "employee_name", "department", "company", "attachment"
		],
		order_by="date desc, creation desc"
	)

	total = len(all_feedbacks)
	if total == 0:
		return {
			"total": 0,
			"positive_percentage": 0,
			"needs_attention_percentage": 0,
			"anonymous_percentage": 100,
			"category_breakdown": [],
			"trend": [],
			"recent_feedback": []
		}

	positive_count = sum(1 for f in all_feedbacks if (f.rating or 0) >= 4)
	attention_count = sum(1 for f in all_feedbacks if (f.rating or 0) <= 2)
	anon_count = sum(1 for f in all_feedbacks if f.is_anonymous)

	positive_pct = round((positive_count / total) * 100)
	attention_pct = round((attention_count / total) * 100)
	anon_pct = round((anon_count / total) * 100)

	# Category breakdown
	cat_counts = {}
	for f in all_feedbacks:
		cat = f.feedback_type or "General Feedback"
		cat_counts[cat] = cat_counts.get(cat, 0) + 1

	category_breakdown = [
		{
			"category": cat,
			"count": count,
			"percentage": round((count / total) * 100)
		}
		for cat, count in sorted(cat_counts.items(), key=lambda x: x[1], reverse=True)
	]

	# Trend calculation (grouped by month or week)
	trend_map = {}
	for f in all_feedbacks:
		d_str = str(f.date) if f.date else str(today())
		# format to Mon-YYYY or Month
		try:
			m_label = getdate(d_str).strftime("%b")
		except Exception:
			m_label = d_str
		trend_map[m_label] = trend_map.get(m_label, 0) + 1

	trend = [{"period": k, "count": v} for k, v in trend_map.items()]

	return {
		"total": total,
		"positive_percentage": positive_pct,
		"needs_attention_percentage": attention_pct,
		"anonymous_percentage": anon_pct,
		"category_breakdown": category_breakdown,
		"trend": trend,
		"recent_feedback": all_feedbacks[:20]
	}


@frappe.whitelist()
def update_feedback_status(feedback_id, status):
	"""
	Update status of a feedback item (Open, In Review, Resolved)
	"""
	if not frappe.has_permission("Staff Feedback", "write"):
		# Allow HR / System Manager
		user = frappe.session.user
		roles = frappe.get_roles(user)
		if not any(r in roles for r in ["System Manager", "HR Manager", "HR User"]):
			frappe.throw(_("Not authorized to update feedback status"), frappe.PermissionError)

	doc = frappe.get_doc("Staff Feedback", feedback_id)
	doc.status = status
	doc.save(ignore_permissions=True)
	frappe.db.commit()

	return {"status": "success", "message": f"Status updated to {status}"}
