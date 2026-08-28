import frappe
from frappe.utils import (
	now_datetime, add_to_date, get_datetime, format_datetime,
	get_url, getdate, nowdate
)
import json
from datetime import datetime, timedelta
from st_automation.api.utils import (
	success_response, error_response, generate_secure_token,
	get_site_booking_url, ensure_custom_fields_exist
)


@frappe.whitelist()
def get_recruitment_overview():
	"""Returns overview metrics for the Recruitment Dashboard."""
	try:
		total_applicants = frappe.db.count("Job Applicant")
		open_applicants = frappe.db.count("Job Applicant", {"status": ["in", ["Open", "Applied"]]})
		shortlisted = frappe.db.count("Job Applicant", {"status": ["in", ["Shortlisted", "Awaiting Slot Booking"]]})
		interviews_scheduled = frappe.db.count("Job Applicant", {"status": "Interview Scheduled"})
		decisions_pending = frappe.db.count("Job Applicant", {"status": "Interview Completed"})
		selected = frappe.db.count("Job Applicant", {"status": ["in", ["Selected", "Accepted"]]})
		active_jobs = frappe.db.count("Job Opening", {"status": "Open"})

		# Upcoming interviews
		interviews = frappe.get_all(
			"Interview",
			fields=["name", "job_applicant", "job_opening", "scheduled_on", "status"],
			filters={"status": ["in", ["Scheduled", "Pending"]]},
			order_by="scheduled_on asc",
			limit=5
		)

		for item in interviews:
			if item.get("job_applicant"):
				item["applicant_name"] = frappe.db.get_value("Job Applicant", item["job_applicant"], "applicant_name")

		return success_response({
			"total_applicants": total_applicants,
			"open_applicants": open_applicants,
			"shortlisted": shortlisted,
			"interviews_scheduled": interviews_scheduled,
			"decisions_pending": decisions_pending,
			"selected": selected,
			"active_jobs": active_jobs,
			"upcoming_interviews": interviews
		})
	except Exception as e:
		return error_response("Error loading recruitment overview", e)


@frappe.whitelist()
def get_pipeline(job_opening=None, search=None):
	"""
	Returns all applicants organized by workflow stages for the Kanban pipeline.
	"""
	ensure_custom_fields_exist()
	try:
		filters = {}
		if job_opening and job_opening != "all":
			filters["job_title"] = job_opening

		applicants = frappe.get_all(
			"Job Applicant",
			fields=[
				"name", "applicant_name", "email_id", "phone_number",
				"job_title", "status", "creation", "resume_attachment",
				"booking_token", "booking_token_expiry", "talent_pool_tag",
				"interview_rating_summary", "booked_slot_time"
			],
			filters=filters,
			order_by="creation desc",
			limit=300
		)

		if search:
			q = search.lower()
			applicants = [
				a for a in applicants
				if q in (a.applicant_name or "").lower() or q in (a.email_id or "").lower() or q in (a.job_title or "").lower()
			]

		# Normalize pipeline stages to standard ERPNext statuses
		stages = {
			"Open": [],
			"Replied": [],
			"Accepted": [],
			"Hold": [],
			"Rejected": []
		}

		for app in applicants:
			raw_status = (app.get("status") or "Open").strip()
			booking_token = app.get("booking_token")
			talent_pool = app.get("talent_pool_tag")

			target_stage = "Open"
			if raw_status in ["Open", "Applied"]:
				target_stage = "Open"
			elif raw_status in ["Replied", "Shortlisted", "Awaiting Slot Booking", "Interview Scheduled", "Scheduled", "Interview Completed", "Under Review"]:
				target_stage = "Replied"
			elif raw_status in ["Accepted", "Selected"]:
				target_stage = "Accepted"
			elif raw_status in ["Hold", "On Bench", "Talent Pool"] or talent_pool == "On Bench":
				target_stage = "Hold"
			elif raw_status in ["Rejected"]:
				target_stage = "Rejected"
			else:
				target_stage = "Open"

			app["stage"] = target_stage
			app["booking_url"] = get_site_booking_url(booking_token) if booking_token else ""
			stages[target_stage].append(app)

		return success_response({
			"stages": stages,
			"total_count": len(applicants)
		})
	except Exception as e:
		return error_response("Error loading recruitment pipeline", e)


@frappe.whitelist()
def shortlist_and_notify(applicant_id, notes=None):
	"""
	Shortlists candidate, generates booking token with expiry, and triggers email.
	Multi-step action collapsed into 1 click!
	"""
	ensure_custom_fields_exist()
	try:
		if not frappe.db.exists("Job Applicant", applicant_id):
			return error_response(f"Applicant {applicant_id} does not exist.")

		doc = frappe.get_doc("Job Applicant", applicant_id)
		token = generate_secure_token(prefix="st_slot_")
		expiry = add_to_date(now_datetime(), days=3)

		doc.status = "Replied"
		doc.booking_token = token
		doc.booking_token_expiry = expiry
		if notes:
			doc.add_comment("Comment", f"Shortlisted by HR. Notes: {notes}")
		doc.save(ignore_permissions=True)
		frappe.db.commit()

		booking_url = get_site_booking_url(token)

		# Send notification email if candidate email is valid
		email_sent = False
		if doc.email_id:
			try:
				subject = f"Interview Invitation — Standard Touch ({doc.job_title or 'Position'})"
				message = f"""
				<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
					<h2 style="color: #4f46e5; margin-top: 0;">Congratulations, {doc.applicant_name}!</h2>
					<p>We have reviewed your application for <strong>{doc.job_title or 'the open role'}</strong> at Standard Touch and would love to invite you for an interview.</p>
					<p>Please click the button below to pick a slot that works best for your schedule:</p>
					<div style="text-align: center; margin: 28px 0;">
						<a href="{booking_url}" style="background-color: #4f46e5; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Select Interview Slot</a>
					</div>
					<p style="font-size: 13px; color: #64748b;">This booking link is valid for 72 hours. If you have any questions, feel free to reply to this email.</p>
					<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
					<p style="font-size: 12px; color: #94a3b8;">Standard Touch HR Operations Team</p>
				</div>
				"""
				frappe.sendmail(
					recipients=[doc.email_id],
					subject=subject,
					message=message,
					now=True
				)
				email_sent = True
			except Exception as mail_err:
				frappe.log_error(f"Failed to send email to {doc.email_id}: {mail_err}", "st_automation Email")

		return success_response({
			"applicant_id": applicant_id,
			"status": "Awaiting Slot Booking",
			"booking_token": token,
			"booking_url": booking_url,
			"expiry": format_datetime(expiry),
			"email_sent": email_sent
		}, message="Candidate shortlisted & interview booking link generated!")
	except Exception as e:
		return error_response(f"Error shortlisting candidate: {str(e)}", e)


@frappe.whitelist(allow_guest=True)
def get_available_slots(token):
	"""
	Public endpoint for candidate slot booking.
	Validates token and returns available time slots across the next 5 business days.
	"""
	ensure_custom_fields_exist()
	try:
		if not token:
			return error_response("Booking token is required.")

		applicants = frappe.get_all(
			"Job Applicant",
			fields=["name", "applicant_name", "email_id", "job_title", "booking_token_expiry", "status", "booked_slot_time"],
			filters={"booking_token": token},
			limit=1
		)

		if not applicants:
			return error_response("Invalid or expired booking link. Please contact HR.")

		applicant = applicants[0]
		expiry = applicant.get("booking_token_expiry")
		if expiry and get_datetime(expiry) < now_datetime():
			return error_response("This interview booking link has expired. Please contact the HR team for a new link.")

		if applicant.get("status") == "Interview Scheduled" and applicant.get("booked_slot_time"):
			return success_response({
				"already_booked": True,
				"applicant_name": applicant.applicant_name,
				"job_title": applicant.job_title,
				"booked_slot_time": format_datetime(applicant.booked_slot_time),
			}, message="You have already scheduled your interview.")

		# Generate next 5 business days slots
		# Standard Touch slots: 10:00 AM, 11:30 AM, 02:00 PM, 03:30 PM, 05:00 PM
		daily_time_slots = ["10:00", "11:30", "14:00", "15:30", "17:00"]
		slots_by_date = []

		current_date = getdate()
		# Start from tomorrow or today afternoon
		day_offset = 1 if now_datetime().hour >= 15 else 0

		days_collected = 0
		while days_collected < 5:
			test_date = current_date + timedelta(days=day_offset)
			day_offset += 1
			# Skip Sunday (6) and Saturday (5) if standard weekend
			if test_date.weekday() in [5, 6]:
				continue

			date_str = test_date.strftime("%Y-%m-%d")
			formatted_header = test_date.strftime("%A, %b %d")

			slot_items = []
			for t in daily_time_slots:
				dt_str = f"{date_str} {t}:00"
				slot_dt = datetime.strptime(dt_str, "%Y-%m-%d %H:%M:%S")

				# Format friendly label
				label = slot_dt.strftime("%I:%M %p")
				slot_items.append({
					"datetime": dt_str,
					"time_label": label,
					"is_available": True
				})

			slots_by_date.append({
				"date": date_str,
				"date_formatted": formatted_header,
				"slots": slot_items
			})
			days_collected += 1

		return success_response({
			"applicant_name": applicant.applicant_name,
			"job_title": applicant.job_title or "Position",
			"already_booked": False,
			"days": slots_by_date
		})
	except Exception as e:
		return error_response("Error loading available interview slots", e)


@frappe.whitelist(allow_guest=True)
def book_slot(token, slot_datetime, interviewer=None):
	"""
	Public endpoint to confirm interview slot booking in 1 click.
	Creates Interview doc and updates applicant.
	"""
	ensure_custom_fields_exist()
	try:
		if not token or not slot_datetime:
			return error_response("Missing token or slot datetime.")

		applicants = frappe.get_all(
			"Job Applicant",
			fields=["name", "applicant_name", "email_id", "job_title", "booking_token_expiry"],
			filters={"booking_token": token},
			limit=1
		)

		if not applicants:
			return error_response("Invalid or expired booking link.")

		app_info = applicants[0]
		doc = frappe.get_doc("Job Applicant", app_info.name)

		# Check default interviewer from Job Opening if not passed
		if not interviewer and doc.job_title:
			interviewer = frappe.db.get_value("Job Opening", {"job_title": doc.job_title}, "default_interviewer")
		if not interviewer:
			# Fallback to current administrator or system user
			interviewer = "Administrator"

		# Create ERPNext Interview record
		interview_doc = frappe.new_doc("Interview")
		interview_doc.job_applicant = doc.name
		interview_doc.job_opening = doc.job_title
		interview_doc.scheduled_on = slot_datetime
		interview_doc.status = "Scheduled"
		interview_doc.flags.ignore_permissions = True
		interview_doc.flags.ignore_mandatory = True
		try:
			interview_doc.insert(ignore_permissions=True)
		except Exception as int_err:
			frappe.log_error(f"Interview creation note: {int_err}", "st_automation Interview")

		# Update applicant status
		doc.status = "Replied"
		doc.booked_slot_time = slot_datetime
		# Clear token to prevent replay
		doc.booking_token = None
		doc.save(ignore_permissions=True)
		frappe.db.commit()

		formatted_time = format_datetime(slot_datetime)

		# Send Confirmation Email
		if doc.email_id:
			try:
				subject = f"Confirmed: Interview for {doc.job_title or 'Position'} — Standard Touch"
				message = f"""
				<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
					<h2 style="color: #10b981; margin-top: 0;">✓ Interview Confirmed!</h2>
					<p>Hi {doc.applicant_name},</p>
					<p>Your interview for <strong>{doc.job_title or 'Position'}</strong> is confirmed for:</p>
					<div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
						<p style="margin: 0; font-size: 16px; font-weight: bold; color: #1e293b;">📅 {formatted_time}</p>
					</div>
					<p>Our team will meet with you at the scheduled time. If you need to make any adjustments, please reply to this email.</p>
					<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
					<p style="font-size: 12px; color: #94a3b8;">Standard Touch HR Operations Team</p>
				</div>
				"""
				frappe.sendmail(
					recipients=[doc.email_id],
					subject=subject,
					message=message,
					now=True
				)
			except Exception as e:
				frappe.log_error(f"Failed to send confirmation email: {e}", "st_automation Email")

		return success_response({
			"applicant_name": doc.applicant_name,
			"job_title": doc.job_title,
			"slot_datetime": slot_datetime,
			"formatted_time": formatted_time
		}, message="Interview successfully scheduled!")
	except Exception as e:
		return error_response(f"Error booking slot: {str(e)}", e)


def generate_ics_content(subject, description, start_time, duration_hours=1):
	"""Generates an ICS file content for calendar invites."""
	from datetime import timedelta
	start_dt = get_datetime(start_time)
	end_dt = start_dt + timedelta(hours=duration_hours)
	
	dtstamp = now_datetime().strftime('%Y%m%dT%H%M%SZ')
	dtstart = start_dt.strftime('%Y%m%dT%H%M%S')
	dtend = end_dt.strftime('%Y%m%dT%H%M%S')
	
	ics = [
		"BEGIN:VCALENDAR",
		"VERSION:2.0",
		"PRODID:-//Standard Touch//HR Ops//EN",
		"CALSCALE:GREGORIAN",
		"METHOD:REQUEST",
		"BEGIN:VEVENT",
		f"DTSTAMP:{dtstamp}",
		f"DTSTART:{dtstart}",
		f"DTEND:{dtend}",
		f"SUMMARY:{subject}",
		f"DESCRIPTION:{description}",
		"STATUS:CONFIRMED",
		"SEQUENCE:0",
		"BEGIN:VALARM",
		"TRIGGER:-PT15M",
		"ACTION:DISPLAY",
		"DESCRIPTION:Reminder",
		"END:VALARM",
		"END:VEVENT",
		"END:VCALENDAR"
	]
	return "\\r\\n".join(ics)

@frappe.whitelist(allow_guest=True)
def submit_interview_feedback():
    """Endpoint for interviewers to submit feedback via a secure token.
    Expected GET/POST params:
        token: secure token generated per interviewer
        interview: Interview document name
        feedback: textual feedback (POST)
        rating: optional numeric rating (POST)
    """
    token = frappe.form_dict.get('token')
    interview_name = frappe.form_dict.get('interview')
    feedback = frappe.form_dict.get('feedback')
    rating = frappe.form_dict.get('rating')

    if not token or not interview_name:
        return error_response('Missing token or interview identifier')

    interview = frappe.get_doc('Interview', interview_name)
    # feedback_token stored as JSON mapping interviewer -> token
    token_map = {}
    try:
        token_map = json.loads(interview.feedback_token or '{}')
    except Exception:
        pass
    # Find interviewer associated with token
    interviewer = None
    for emp, tkn in token_map.items():
        if tkn == token:
            interviewer = emp
            break
    if not interviewer:
        return error_response('Invalid or expired feedback token')

    # Record feedback as a comment on the Interview
    comment_text = f"Feedback from {interviewer}: {feedback}"
    if rating:
        comment_text += f" (Rating: {rating})"
    interview.add_comment('Feedback', comment_text, comment_by=interviewer)
    interview.save(ignore_permissions=True)
    frappe.db.commit()
    return success_response(message='Feedback submitted successfully')


@frappe.whitelist()
def schedule_interview_round(applicant_id, round_number, interviewers, scheduled_time):
	"""
	Schedules a specific interview round (1, 2, or 3) for a candidate.
	Sends calendar invites (.ics) to all selected interviewers.
	"""
	ensure_custom_fields_exist()
	try:
		if not applicant_id or not round_number or not scheduled_time:
			return error_response("Applicant ID, round number, and scheduled time are required.")

		if isinstance(interviewers, str):
			interviewers = json.loads(interviewers)

		if not interviewers:
			return error_response("At least one interviewer must be selected.")

		doc = frappe.get_doc("Job Applicant", applicant_id)

		# Determine Round Label
		round_labels = {1: "Round 1 (Initial)", 2: "Round 2 (Technical)", 3: "Round 3 (Final/Managerial)"}
		round_name = round_labels.get(int(round_number), f"Round {round_number}")

		# Create Interview Record
		interview_doc = frappe.new_doc("Interview")
		interview_doc.job_applicant = doc.name
		
		# Resolve job_opening safely to avoid LinkValidationError from core ERPNext
		job_opening_id = doc.job_title
		if job_opening_id and not frappe.db.exists("Job Opening", job_opening_id):
			found_job = frappe.db.get_value("Job Opening", {"job_title": job_opening_id})
			if found_job:
				job_opening_id = found_job
			else:
				# Auto-create the job opening to satisfy standard ERPNext validations
				# Must have Designation and Company
				default_company = frappe.defaults.get_user_default("Company") or frappe.db.get_value("Company", {"is_group": 0}, "name")
				
				# Auto-create Designation if it doesn't exist
				if not frappe.db.exists("Designation", job_opening_id):
					new_des = frappe.new_doc("Designation")
					new_des.designation_name = job_opening_id
					new_des.insert(ignore_permissions=True)
					
				new_jo = frappe.new_doc("Job Opening")
				new_jo.job_title = job_opening_id
				new_jo.designation = job_opening_id
				new_jo.company = default_company
				new_jo.status = "Open"
				new_jo.flags.ignore_permissions = True
				new_jo.flags.ignore_mandatory = True
				new_jo.insert(ignore_permissions=True)
				job_opening_id = new_jo.name
				
			# Update the applicant's job_title to point to the valid ID
			doc.db_set("job_title", job_opening_id)

		if job_opening_id:
			interview_doc.job_opening = job_opening_id
			
		interview_doc.scheduled_on = scheduled_time
		interview_doc.status = "Pending"
		
		# Add Interviewers to child table
		for emp in interviewers:
			user_id = frappe.db.get_value("Employee", emp, "user_id")
			if user_id:
				interview_doc.append("interview_details", {
					"interviewer": user_id
				})
			else:
				# Fallback: if no user_id, check if employee has email and find user by email
				email = frappe.db.get_value("Employee", emp, "company_email") or frappe.db.get_value("Employee", emp, "personal_email")
				if email and frappe.db.exists("User", email):
					interview_doc.append("interview_details", {
						"interviewer": email
					})
			
		# Optional: add a custom field or append to remarks to denote the round
		interview_doc.flags.ignore_permissions = True
		interview_doc.flags.ignore_mandatory = True
		interview_doc.insert(ignore_permissions=True)
		
		# Log the round action
		doc.add_comment("Comment", f"Scheduled {round_name} for {format_datetime(scheduled_time)} with {', '.join(interviewers)}")
		doc.save(ignore_permissions=True)

		# Fetch emails for all selected interviewers (who are Employees)
		interviewer_emails = {}  # emp -> email
		for emp in interviewers:
			email = frappe.db.get_value("Employee", emp, "company_email") or frappe.db.get_value("Employee", emp, "personal_email")
			if email:
				interviewer_emails[emp] = email

		# Generate a unique feedback token per interviewer and store on the interview doc
		feedback_token_map = {}
		for emp in interviewers:
			feedback_token_map[emp] = generate_secure_token(prefix="fb_")

		# Store the feedback token map as JSON on the interview doc (custom field)
		try:
			frappe.db.set_value("Interview", interview_doc.name, "feedback_token", json.dumps(feedback_token_map), update_modified=False)
		except Exception:
			# If field doesn't exist yet, just log and continue
			frappe.log_error("feedback_token field not yet on Interview doctype. Please add it as a custom field.", "st_automation")

		# Generate ICS and send emails
		site_url = frappe.utils.get_url()
		emails_sent = 0
		if interviewer_emails:
			subject = f"Interview Scheduled: {round_name} with {doc.applicant_name}"
			description = f"Please conduct {round_name} for {doc.applicant_name} ({doc.job_title}).\\nCandidate Email: {doc.email_id}\\nCandidate Phone: {doc.phone_number}"
			ics_content = generate_ics_content(subject, description, scheduled_time)

			for emp, email in interviewer_emails.items():
				token = feedback_token_map.get(emp, "")
				feedback_url = f"{site_url}/interview-feedback?token={token}&interview={interview_doc.name}"
				emp_name = frappe.db.get_value("Employee", emp, "employee_name") or emp

				message = f"""
				<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
				  <h2 style="color: #4f46e5; margin-top: 0;">📅 Interview Assigned – {round_name}</h2>
				  <p>Hi {emp_name},</p>
				  <p>You have been assigned to conduct an interview with <strong>{doc.applicant_name}</strong> for the position of <strong>{doc.job_title or 'the open role'}</strong>.</p>
				  <div style="background-color: #f1f5f9; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
				    <p style="margin: 0; font-weight: bold;">🕐 {format_datetime(scheduled_time)}</p>
				  </div>
				  <p>After the interview, please click the link below to submit your feedback:</p>
				  <div style="text-align: center; margin: 24px 0;">
				    <a href="{feedback_url}" style="background-color: #10b981; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Submit Interview Feedback</a>
				  </div>
				  <p style="font-size: 12px; color: #94a3b8;">This feedback link is unique to you. Please do not share it. Your feedback will be recorded in the HR system under your name.</p>
				  <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
				  <p style="font-size: 12px; color: #94a3b8;">Standard Touch HR Operations Team</p>
				</div>
				"""

				try:
					frappe.sendmail(
						recipients=[email],
						subject=subject,
						message=message,
						attachments=[{
							"fname": "invite.ics",
							"fcontent": ics_content.encode("utf-8")
						}],
						now=True
					)
					emails_sent += 1
				except Exception as mail_err:
					frappe.log_error(f"Failed to send interview email to {email}: {mail_err}", "st_automation Email")

		frappe.db.commit()
		return success_response(message=f"{round_name} scheduled successfully. Calendar invites sent to {len(interviewer_emails)} interviewers.")

	except Exception as e:
		return error_response(f"Error scheduling round {round_number}: {str(e)}", e)


@frappe.whitelist()
def get_applicant_interviews(applicant_id):
	"""Fetches all scheduled interviews for a specific applicant."""
	try:
		interviews = frappe.get_all(
			"Interview",
			filters={"job_applicant": applicant_id},
			fields=["name", "job_opening", "scheduled_on", "status", "creation"]
		)
		
		# For each interview, we can find the assigned interviewers from Interview Detail
		for iv in interviews:
			details = frappe.get_all("Interview Detail", filters={"parent": iv.name}, fields=["interviewer"])
			iv["interviewers"] = [d.interviewer for d in details]
			
		# Sort by scheduled_on descending
		interviews.sort(key=lambda x: x.scheduled_on or x.creation, reverse=True)
		
		return success_response(interviews)
	except Exception as e:
		return error_response(f"Failed to fetch interviews: {str(e)}", e)


@frappe.whitelist()
def get_my_interviews():
	"""Returns list of upcoming and past interviews for the interviewer."""
	try:
		user = frappe.session.user
		interviews = frappe.get_all(
			"Interview",
			fields=["name", "job_applicant", "job_opening", "scheduled_on", "status"],
			order_by="scheduled_on desc",
			limit=50
		)

		results = []
		for item in interviews:
			app_name = ""
			resume_url = ""
			phone = ""
			email = ""
			if item.get("job_applicant"):
				app_data = frappe.db.get_value(
					"Job Applicant",
					item["job_applicant"],
					["applicant_name", "resume_attachment", "email_id", "phone_number"],
					as_dict=True
				)
				if app_data:
					app_name = app_data.get("applicant_name")
					resume_url = app_data.get("resume_attachment")
					phone = app_data.get("phone_number")
					email = app_data.get("email_id")

			results.append({
				"interview_id": item.name,
				"applicant_id": item.job_applicant,
				"applicant_name": app_name or item.job_applicant,
				"job_title": item.job_opening or "Position",
				"scheduled_on": item.scheduled_on,
				"status": item.status,
				"resume_attachment": resume_url,
				"email": email,
				"phone": phone
			})

		return success_response({"interviews": results})
	except Exception as e:
		return error_response("Error loading interviews", e)


@frappe.whitelist()
def submit_interview_feedback(interview_id, rating, recommendation, comments, scorecard=None):
	"""
	Submits structured interview feedback and moves candidate to 'Interview Completed'.
	"""
	ensure_custom_fields_exist()
	try:
		if not interview_id:
			return error_response("Interview ID is required.")

		interview = frappe.get_doc("Interview", interview_id)
		interview.status = "Completed"
		interview.save(ignore_permissions=True)

		applicant_id = interview.job_applicant
		if applicant_id and frappe.db.exists("Job Applicant", applicant_id):
			app_doc = frappe.get_doc("Job Applicant", applicant_id)
			app_doc.status = "Replied"
			summary = f"Rating: {rating}/5 | Rec: {recommendation} | Notes: {comments}"
			app_doc.interview_rating_summary = summary
			app_doc.add_comment("Comment", f"Interview Feedback: {summary}")
			app_doc.save(ignore_permissions=True)

		# Try creating standard Interview Feedback record if DocType exists
		if frappe.db.exists("DocType", "Interview Feedback"):
			try:
				fb = frappe.new_doc("Interview Feedback")
				fb.interview = interview_id
				fb.interviewer = frappe.session.user
				fb.result = recommendation
				fb.feedback = comments
				fb.flags.ignore_permissions = True
				fb.flags.ignore_mandatory = True
				fb.insert(ignore_permissions=True)
			except Exception as fb_err:
				frappe.log_error(f"Interview feedback creation note: {fb_err}", "st_automation Feedback")

		frappe.db.commit()
		return success_response(message="Feedback submitted successfully!")
	except Exception as e:
		return error_response(f"Error submitting feedback: {str(e)}", e)


@frappe.whitelist()
def record_decision(applicant_id, decision, notes=None, salary_offered=None, designation=None):
	"""
	1-Click Decision Engine:
	- Select: moves to Selected, creates draft Job Offer
	- Bench: tags as Talent Pool / Bench
	- Reject: moves to Rejected, sends polite rejection email
	"""
	ensure_custom_fields_exist()
	try:
		if not frappe.db.exists("Job Applicant", applicant_id):
			return error_response(f"Applicant {applicant_id} does not exist.")

		doc = frappe.get_doc("Job Applicant", applicant_id)

		if decision == "Select":
			doc.status = "Accepted"
			doc.talent_pool_tag = "Shortlisted"
			doc.add_comment("Comment", f"Hiring Decision: SELECTED. {notes or ''}")
			doc.save(ignore_permissions=True)

			# Attempt to create draft Job Offer if DocType exists
			if frappe.db.exists("DocType", "Job Offer"):
				try:
					offer = frappe.new_doc("Job Offer")
					offer.job_applicant = doc.name
					offer.applicant_name = doc.applicant_name
					offer.applicant_email = doc.email_id
					offer.designation = designation or doc.job_title
					offer.offer_date = nowdate()
					offer.status = "Draft"
					offer.flags.ignore_permissions = True
					offer.flags.ignore_mandatory = True
					offer.insert(ignore_permissions=True)
				except Exception as offer_err:
					frappe.log_error(f"Job offer draft note: {offer_err}", "st_automation Offer")

			message = f"{doc.applicant_name} marked as SELECTED and Job Offer drafted!"

		elif decision == "Bench":
			doc.status = "Hold"
			doc.talent_pool_tag = "On Bench"
			doc.add_comment("Comment", f"Hiring Decision: ON BENCH / TALENT POOL. {notes or ''}")
			doc.save(ignore_permissions=True)
			message = f"{doc.applicant_name} moved to Talent Pool / Bench."

		elif decision == "Reject":
			doc.status = "Rejected"
			doc.talent_pool_tag = "Rejected"
			doc.add_comment("Comment", f"Hiring Decision: REJECTED. Reason: {notes or 'Not specified'}")
			doc.save(ignore_permissions=True)

			# Send polite rejection email
			if doc.email_id:
				try:
					subject = f"Update regarding your application for {doc.job_title or 'Position'} — Standard Touch"
					email_body = f"""
					<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
						<p>Dear {doc.applicant_name},</p>
						<p>Thank you for taking the time to speak with us regarding the <strong>{doc.job_title or 'Position'}</strong> role at Standard Touch.</p>
						<p>While we were impressed with your background, we have decided to move forward with another candidate who more closely matches our immediate technical needs for this role.</p>
						<p>We will keep your profile in our talent network for upcoming opportunities that align with your experience.</p>
						<p>We wish you all the best in your career search!</p>
						<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
						<p style="font-size: 12px; color: #94a3b8;">Standard Touch Recruitment Team</p>
					</div>
					"""
					frappe.sendmail(
						recipients=[doc.email_id],
						subject=subject,
						message=email_body,
						now=True
					)
				except Exception as mail_err:
					frappe.log_error(f"Rejection email note: {mail_err}", "st_automation Rejection Email")

			message = f"{doc.applicant_name} marked as REJECTED and polite notification sent."

		else:
			return error_response(f"Invalid decision type: {decision}")

		frappe.db.commit()
		return success_response({
			"applicant_id": applicant_id,
			"decision": decision,
			"status": doc.status
		}, message=message)
	except Exception as e:
		return error_response(f"Error recording decision: {str(e)}", e)


@frappe.whitelist()
def quick_add_applicant(applicant_name, email_id, phone_number=None, job_title=None, notes=None, resume_attachment=None):
	"""
	1-Click fast intake form for adding a candidate directly into the pipeline.
	"""
	ensure_custom_fields_exist()
	try:
		if not applicant_name or not email_id:
			return error_response("Candidate Name and Email are required.")

		doc = frappe.new_doc("Job Applicant")
		doc.applicant_name = applicant_name
		doc.email_id = email_id
		doc.phone_number = phone_number or ""
		doc.job_title = job_title or ""
		doc.status = "Open"
		doc.resume_attachment = resume_attachment or ""
		if notes:
			doc.notes = notes

		doc.insert(ignore_permissions=True)
		frappe.db.commit()

		return success_response({
			"name": doc.name,
			"applicant_name": doc.applicant_name,
			"email_id": doc.email_id,
			"job_title": doc.job_title,
			"status": "Applied"
		}, message=f"Candidate {applicant_name} added to pipeline!")
	except Exception as e:
		return error_response(f"Error adding candidate: {str(e)}", e)


@frappe.whitelist()
def get_job_openings():
	"""Returns all job openings with applicant counts."""
	try:
		openings = frappe.get_all(
			"Job Opening",
			fields=["name", "job_title", "status", "designation", "department", "vacancies", "publish"],
			order_by="creation desc"
		)

		for job in openings:
			job["applicant_count"] = frappe.db.count("Job Applicant", {"job_title": job.job_title or job.name})

		return success_response({"job_openings": openings})
	except Exception as e:
		return error_response("Error loading job openings", e)


@frappe.whitelist()
def toggle_job_opening(job_opening_id, publish):
	"""Toggles publish status of a job opening in 1 click."""
	try:
		doc = frappe.get_doc("Job Opening", job_opening_id)
		doc.publish = 1 if publish else 0
		doc.save(ignore_permissions=True)
		frappe.db.commit()
		return success_response(message=f"Job Opening status updated!")
	except Exception as e:
		return error_response("Error updating job opening", e)


@frappe.whitelist()
def onboard_candidate(applicant_id):
	"""Converts a Job Applicant into an Employee record in ERPNext."""
	try:
		if not frappe.db.exists("Job Applicant", applicant_id):
			return error_response(f"Applicant {applicant_id} does not exist.")

		app_doc = frappe.get_doc("Job Applicant", applicant_id)
		if app_doc.status not in ["Selected", "Accepted"]:
			return error_response("Candidate must be Selected before onboarding.")
			
		# Check if Employee already exists for this email
		existing = frappe.db.get_value("Employee", {"personal_email": app_doc.email_id})
		if existing:
			return error_response(f"Employee {existing} already exists with this email.")

		# Create Employee
		emp = frappe.new_doc("Employee")
		emp.first_name = app_doc.applicant_name
		emp.personal_email = app_doc.email_id
		emp.status = "Active"
		emp.date_of_joining = nowdate()
		
		# Handle Designation Link Field
		if app_doc.job_title:
			if frappe.db.exists("Designation", app_doc.job_title):
				emp.designation = app_doc.job_title
			else:
				try:
					new_desig = frappe.new_doc("Designation")
					new_desig.designation_name = app_doc.job_title
					new_desig.insert(ignore_permissions=True)
					emp.designation = app_doc.job_title
				except Exception:
					pass
		
		# Need default company
		company = frappe.db.get_single_value("Global Defaults", "default_company")
		if not company:
			company = frappe.get_all("Company")[0].name
		emp.company = company
		
		emp.flags.ignore_mandatory = True
		emp.insert(ignore_permissions=True)
		
		frappe.db.commit()
		return success_response({
		    "employee": emp.name,
		    "applicant_id": applicant_id
		}, message=f"Successfully onboarded {app_doc.applicant_name} as Employee {emp.name}!")
	except Exception as e:
		return error_response(f"Failed to onboard candidate: {str(e)}", e)
