import frappe
from frappe.utils import nowdate, getdate, formatdate
from st_automation.api.utils import (
	success_response, error_response, get_hr_manager_emails
)
from st_automation.api.recruitment import _resolve_designation, _get_default_company

RESPONSIBILITY_PRESETS = {
	"ERP Developer / Engineer": [
		"Analyzing business requirements and translating them into technical specifications for ERP systems",
		"Designing and developing ERP modules or customizing existing modules to meet specific business needs",
		"Creating and maintaining technical documentation related to ERP systems, such as user manuals, technical specifications, and test plans.",
		"Testing and debugging ERP systems to ensure they are functioning correctly",
		"Working with cross-functional teams to integrate ERP systems with other business systems, such as CRM and SCM systems",
		"Providing technical support and troubleshooting for ERP systems to end-users"
	],
	"Frontend / Web Developer": [
		"Building responsive, high-performance web applications using modern React and JavaScript frameworks",
		"Translating UI/UX wireframes and designs into robust, reusable, and pixel-perfect component libraries",
		"Integrating RESTful APIs and real-time backend services seamlessly into frontend interfaces",
		"Optimizing web applications for maximum speed, scalability, cross-browser compatibility, and responsiveness",
		"Collaborating with backend developers and designers to improve user journey and overall product usability",
		"Writing clean, maintainable, modular code and participating in technical code reviews"
	],
	"Backend / Python Developer": [
		"Architecting, designing, and maintaining robust backend services, APIs, and business workflows in Python/Frappe",
		"Designing performant database schemas, writing optimized SQL queries, and managing data migrations",
		"Implementing secure authentication, role-based access control, and webhook integrations with external platforms",
		"Diagnosing backend performance bottlenecks, server issues, and optimizing background workers and queues",
		"Writing automated unit tests, integration tests, and maintaining technical API documentation",
		"Collaborating with frontend engineers and product teams to deliver scalable feature releases"
	],
	"QA / Software Test Engineer": [
		"Developing comprehensive test plans, detailed test cases, and quality acceptance criteria for software releases",
		"Executing functional, integration, regression, performance, and cross-browser test suites",
		"Identifying, documenting, tracking, and verifying software defects and edge-case bugs in issue trackers",
		"Building and maintaining automated testing scripts and CI/CD automated test pipelines",
		"Collaborating with software developers to reproduce complex issues and validate bug fixes before deployment",
		"Ensuring release stability, security compliance, and exceptional end-user experience across all modules"
	],
	"Business Analyst / Functional Consultant": [
		"Engaging with business stakeholders and department heads to gather, analyze, and document operational workflows",
		"Translating complex business processes into structured functional specifications and user stories",
		"Configuring ERPNext modules, standard workflows, custom fields, and role permissions to meet operational needs",
		"Conducting user acceptance testing (UAT) sessions, user walkthroughs, and end-user training programs",
		"Creating intuitive user guides, process flowcharts, and system administration manuals",
		"Continuously identifying process improvement opportunities and optimizing day-to-day software usage"
	],
	"HR Executive / Operations Associate": [
		"Managing end-to-end recruitment lifecycle including job postings, screening, candidate coordination, and interview rounds",
		"Preparing employment proposals, standard offer letters, contracts, and coordinating candidate onboarding",
		"Maintaining confidential employee records, attendance, leave balances, and lifecycle changes in HRMS",
		"Assisting in monthly payroll processing, incentive calculations, loan disbursements, and salary slip releases",
		"Conducting employee engagement initiatives, onboarding orientations, and exit clearance processes",
		"Ensuring HR compliance with company policies, statutory regulations, and addressing employee queries"
	],
	"Sales / Business Development Executive": [
		"Identifying potential client leads, conducting outbound prospecting, and qualifying business opportunities",
		"Demonstrating software solutions and presenting technical capabilities to prospective clients",
		"Preparing tailored commercial proposals, pricing quotes, and negotiating contract agreements",
		"Maintaining accurate pipeline records, client communication logs, and sales stages within the CRM",
		"Achieving monthly and quarterly revenue targets through proactive relationship building and follow-ups",
		"Coordinating with the delivery and technical teams to ensure smooth client handovers post-sale"
	],
	"Digital Marketing Specialist": [
		"Planning and executing multi-channel digital campaigns across SEO, Google Ads, LinkedIn, and social media",
		"Producing engaging content, case studies, blog articles, and email newsletters to build brand authority",
		"Tracking marketing analytics, website traffic, lead conversions, and campaign ROI using web analytics tools",
		"Managing website content, landing pages, and search engine optimization (SEO) best practices",
		"Conducting A/B testing on ad creatives, copy, and audience targeting to optimize customer acquisition costs",
		"Collaborating with sales and design teams to align marketing messaging with customer acquisition objectives"
	]
}

DEFAULT_RESPONSIBILITIES = RESPONSIBILITY_PRESETS["ERP Developer / Engineer"]


import json

PRESETS_KEY = "st_responsibility_presets"

def _load_stored_presets():
	"""Loads presets from DB defaults or fallback to built-in presets."""
	try:
		stored = frappe.db.get_default(PRESETS_KEY)
		if stored:
			data = json.loads(stored)
			if isinstance(data, dict) and data:
				merged = dict(RESPONSIBILITY_PRESETS)
				merged.update(data)
				return merged
	except Exception as e:
		frappe.logger().error(f"Error loading responsibility presets: {e}")
	return dict(RESPONSIBILITY_PRESETS)


def _save_stored_presets(presets_dict):
	"""Saves presets safely using frappe.db.set_default."""
	val = json.dumps(presets_dict)
	frappe.db.set_default(PRESETS_KEY, val)
	frappe.db.commit()


@frappe.whitelist()
def get_responsibility_presets():
	"""Returns all available responsibility role templates for offer letter generation."""
	presets = _load_stored_presets()
	return success_response(presets)


@frappe.whitelist()
def save_responsibility_preset(role_name, responsibilities):
	"""Creates or updates a role responsibility preset directly from the UI."""
	if not role_name or not str(role_name).strip():
		return error_response("Role name is required")
	
	role_name = str(role_name).strip()
	
	# Parse responsibilities if passed as string or list
	if isinstance(responsibilities, str):
		items = [r.strip() for r in responsibilities.split("\n") if r.strip()]
	elif isinstance(responsibilities, list):
		items = [str(r).strip() for r in responsibilities if str(r).strip()]
	else:
		items = []
		
	if not items:
		return error_response("At least one responsibility item is required")
		
	current = _load_stored_presets()
	current[role_name] = items
	_save_stored_presets(current)
	
	return success_response({"role_name": role_name, "presets": current}, f"Preset for '{role_name}' saved successfully!")


@frappe.whitelist()
def delete_responsibility_preset(role_name):
	"""Deletes a customized role responsibility preset."""
	if not role_name:
		return error_response("Role name is required")
		
	role_name = str(role_name).strip()
	current = _load_stored_presets()
	if role_name in current:
		del current[role_name]
		_save_stored_presets(current)
		return success_response({"presets": current}, f"Preset '{role_name}' removed successfully")
	return error_response(f"Preset '{role_name}' not found")


@frappe.whitelist()
def get_offer_letters(company=None):
	"""
	Returns offer letters.
	If current user is HR/System Manager, returns all offer letters.
	If current user is an Employee, returns only their own offer letter.
	"""
	try:
		user = frappe.session.user
		roles = set(frappe.get_roles(user))
		is_hr = (user == "Administrator" or bool(roles & {"System Manager", "HR Manager", "HR User", "Payroll Manager"}))

		filters = {}
		if company:
			filters["company"] = company

		if not is_hr:
			# Employee access only to their own offer letter
			emp = frappe.db.get_value("Employee", {"user_id": user}, ["name", "personal_email", "company_email"], as_dict=True)
			if not emp:
				return success_response({"offers": []})
			
			candidate_emails = [e for e in [emp.personal_email, emp.company_email] if e]
			or_filters = []
			if emp.name:
				or_filters.append(["employee", "=", emp.name])
			if candidate_emails:
				or_filters.append(["applicant_email", "in", candidate_emails])
			
			if not or_filters:
				return success_response({"offers": []})
			
			offers = frappe.get_all(
				"Job Offer",
				filters=filters,
				or_filters=or_filters,
				fields=[
					"name", "job_applicant", "applicant_name", "applicant_email",
					"status", "offer_date", "designation", "company",
					"training_duration", "training_stipend", "salary_range",
					"contract_duration", "reporting_manager", "hr_signatory_name",
					"employee", "creation"
				],
				order_by="creation desc"
			)
			return success_response({"offers": offers, "is_hr": False})

		# HR View: All offers
		offers = frappe.get_all(
			"Job Offer",
			filters=filters,
			fields=[
				"name", "job_applicant", "applicant_name", "applicant_email",
				"status", "offer_date", "designation", "company",
				"training_duration", "training_stipend", "salary_range",
				"contract_duration", "reporting_manager", "hr_signatory_name",
				"employee", "creation"
			],
			order_by="creation desc"
		)
		return success_response({"offers": offers, "is_hr": True})

	except Exception as e:
		return error_response(f"Error fetching offer letters: {str(e)}", e)


@frappe.whitelist()
def get_offer_letter_detail(offer_name):
	"""Returns full details and formatted HTML preview of the StandardTouch Offer Letter."""
	try:
		if not frappe.db.exists("Job Offer", offer_name):
			return error_response("Offer Letter not found.")

		doc = frappe.get_doc("Job Offer", offer_name)
		user = frappe.session.user
		roles = set(frappe.get_roles(user))
		is_hr = (user == "Administrator" or bool(roles & {"System Manager", "HR Manager", "HR User", "Payroll Manager"}))

		if not is_hr:
			emp = frappe.db.get_value("Employee", {"user_id": user}, ["name", "personal_email", "company_email"], as_dict=True)
			if not emp or (doc.employee != emp.name and doc.applicant_email not in [emp.personal_email, emp.company_email]):
				frappe.throw("You do not have permission to view this Offer Letter.", frappe.PermissionError)

		html = render_standardtouch_offer_letter_html(doc)
		return success_response({
			"offer": doc.as_dict(),
			"html": html
		})
	except Exception as e:
		return error_response(f"Error fetching offer details: {str(e)}", e)


@frappe.whitelist()
def create_or_update_offer_letter(
	applicant_id=None,
	candidate_name=None,
	email=None,
	designation=None,
	offer_date=None,
	salary_range=None,
	training_stipend=None,
	training_duration=None,
	contract_duration=None,
	reporting_manager=None,
	hr_signatory_name=None,
	responsibilities=None,
	offer_name=None
):
	"""HR generates or updates a formalized StandardTouch Offer Letter."""
	try:
		user = frappe.session.user
		roles = set(frappe.get_roles(user))
		if user != "Administrator" and not (roles & {"System Manager", "HR Manager", "HR User", "Payroll Manager"}):
			frappe.throw("Permission denied: Only HR can generate offer letters.", frappe.PermissionError)

		if not offer_name and email:
			# If an existing non-cancelled offer exists for this email, update it
			existing_offer_name = frappe.db.get_value("Job Offer", {"applicant_email": email, "docstatus": ["!=", 2]}, "name")
			if existing_offer_name:
				offer_name = existing_offer_name

		if offer_name and frappe.db.exists("Job Offer", offer_name):
			offer = frappe.get_doc("Job Offer", offer_name)
		else:
			offer = frappe.new_doc("Job Offer")
			offer.status = "Awaiting Response"

		if applicant_id:
			offer.job_applicant = applicant_id
			app_doc = frappe.get_doc("Job Applicant", applicant_id)
			offer.applicant_name = candidate_name or app_doc.applicant_name
			offer.applicant_email = email or app_doc.email_id
			offer.candidate_name = offer.applicant_name
		else:
			offer.applicant_name = candidate_name
			offer.applicant_email = email
			offer.candidate_name = candidate_name

			# HRMS JobOffer.validate enforces: frappe.db.exists("Job Offer", {"job_applicant": self.job_applicant})
			# If job_applicant is None, it queries {"job_applicant": None} and collides with any other offer with None.
			# Therefore, find or create a Job Applicant for this candidate.
			existing_applicant = None
			if email:
				existing_applicant = frappe.db.get_value("Job Applicant", {"email_id": email}, "name")

			if not existing_applicant:
				new_app = frappe.new_doc("Job Applicant")
				new_app.applicant_name = candidate_name or "Applicant"
				new_app.email_id = email or f"applicant_{frappe.generate_hash(length=8)}@standardtouch.com"
				new_app.job_title = designation or "Position"
				new_app.status = "Accepted"
				new_app.flags.ignore_permissions = True
				new_app.flags.ignore_mandatory = True
				new_app.insert(ignore_permissions=True)
				existing_applicant = new_app.name

			offer.job_applicant = existing_applicant

		offer.offer_date = offer_date or nowdate()
		offer.designation = _resolve_designation(designation)
		offer.company = _get_default_company()

		offer.training_duration = training_duration or "6 months"
		offer.training_stipend = training_stipend or "INR 5,000/month"
		offer.salary_range = salary_range or "INR 10,000 - 15,000/month"
		offer.contract_duration = contract_duration or "24 Months + 6 months of Training"
		offer.reporting_manager = reporting_manager or "Mr. Abdul Nasir Mauzam Ali"
		offer.hr_signatory_name = hr_signatory_name or "Muzammil Siddiqui"

		if responsibilities:
			if isinstance(responsibilities, list):
				offer.responsibilities_text = "\n".join(responsibilities)
			else:
				offer.responsibilities_text = str(responsibilities)
		elif not offer.responsibilities_text:
			offer.responsibilities_text = "\n".join(DEFAULT_RESPONSIBILITIES)

		# If employee already exists with this email, link it
		if offer.applicant_email:
			emp = frappe.db.get_value("Employee", {"personal_email": offer.applicant_email}, "name")
			if emp:
				offer.employee = emp

		offer.flags.ignore_permissions = True
		offer.flags.ignore_mandatory = True
		offer.save(ignore_permissions=True)
		frappe.db.commit()

		return success_response({
			"offer_name": offer.name,
			"applicant_name": offer.applicant_name,
			"status": offer.status
		}, message=f"Offer letter {offer.name} saved successfully!")

	except Exception as e:
		return error_response(f"Error saving offer letter: {str(e)}", e)


@frappe.whitelist()
def send_standardtouch_offer_letter(offer_name):
	"""Sends the generated StandardTouch Offer Letter to the candidate via email with HR in CC."""
	try:
		if not frappe.db.exists("Job Offer", offer_name):
			return error_response("Offer letter not found.")

		offer = frappe.get_doc("Job Offer", offer_name)
		if not offer.applicant_email:
			return error_response("Candidate email is required to send offer letter.")

		# Render HTML
		html_content = render_standardtouch_offer_letter_html(offer)
		
		# Generate PDF
		try:
			from frappe.utils.pdf import get_pdf
			pdf_data = get_pdf(html_content)
			attachments = [{
				"fname": f"Offer_Letter_{offer.applicant_name.replace(' ', '_')}.pdf",
				"fcontent": pdf_data
			}]
		except Exception as pdf_err:
			frappe.log_error(title="st_automation Offer PDF Gen", message=f"PDF generation error: {pdf_err}")
			attachments = []

		subject = f"Offer of Employment — {offer.designation or 'Position'} at Standard Touch"
		email_body = f"""
		<div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
			<h2 style="color: #ef4444; margin-top: 0;">Standard Touch e-Solutions</h2>
			<p>Dear {offer.applicant_name},</p>
			<p>Congratulations! We are pleased to formally offer you the position of <strong>{offer.designation or 'Position'}</strong> at Standard Touch e-Solutions.</p>
			<p>Please find attached your detailed <strong>Offer Letter and Employment Terms</strong> covering training, salary, responsibilities, leave policy, and conditions.</p>
			<div style="background-color: #f8fafc; border-left: 4px solid #ef4444; padding: 14px; margin: 20px 0;">
				<p style="margin: 0; font-size: 13px; font-weight: bold; color: #b91c1c;">Offer Letter Validity: 3 days from the date of this email.</p>
			</div>
			<p>Kindly review the document and reply directly to this email with your confirmation of acceptance.</p>
			<p>We are very excited about the prospect of having you join our team!</p>
			<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
			<p style="font-size: 12px; color: #94a3b8;">Standard Touch Recruitment & HR Operations Team</p>
		</div>
		"""

		frappe.sendmail(
			recipients=[offer.applicant_email],
			cc=get_hr_manager_emails(),
			subject=subject,
			message=email_body,
			attachments=attachments,
			reference_doctype="Job Offer",
			reference_name=offer.name,
			now=True
		)

		offer.status = "Awaiting Response"
		offer.save(ignore_permissions=True)
		frappe.db.commit()

		return success_response(message=f"Offer letter successfully sent to {offer.applicant_email}!")

	except Exception as e:
		return error_response(f"Error sending offer letter: {str(e)}", e)


@frappe.whitelist()
def update_offer_status(offer_name, status):
	"""Allows HR to manually update offer letter status (e.g. Accepted, Rejected, Awaiting Response)."""
	try:
		user = frappe.session.user
		roles = set(frappe.get_roles(user))
		if user != "Administrator" and not (roles & {"System Manager", "HR Manager", "HR User", "Payroll Manager"}):
			frappe.throw("Permission denied: Only HR can change offer status.", frappe.PermissionError)

		if not frappe.db.exists("Job Offer", offer_name):
			return error_response("Offer letter not found.")

		if status not in ["Awaiting Response", "Accepted", "Rejected"]:
			return error_response(f"Invalid status: {status}. Must be 'Awaiting Response', 'Accepted', or 'Rejected'.")

		offer = frappe.get_doc("Job Offer", offer_name)
		offer.status = status
		offer.flags.ignore_permissions = True
		offer.save(ignore_permissions=True)
		frappe.db.commit()

		return success_response({
			"offer_name": offer.name,
			"status": offer.status
		}, message=f"Offer letter {offer.name} status updated to {status}!")
	except Exception as e:
		return error_response(f"Error updating offer status: {str(e)}", e)


def render_standardtouch_offer_letter_html(offer):
	"""Renders the exact 5-page StandardTouch Offer Letter as clean HTML/CSS for printing and PDF generation."""
	date_str = formatdate(offer.offer_date, "dd/MM/yyyy") if offer.offer_date else nowdate()
	
	# Responsibilities
	resp_lines = [r.strip() for r in (offer.responsibilities_text or "").split("\n") if r.strip()]
	if not resp_lines:
		resp_lines = DEFAULT_RESPONSIBILITIES

	resp_items = "".join([f"<li style='margin-bottom: 8px;'>{r}</li>" for r in resp_lines])

	html = f"""
	<!DOCTYPE html>
	<html>
	<head>
		<meta charset="utf-8">
		<title>Offer Letter - {offer.applicant_name}</title>
		<style>
			@page {{
				size: A4 portrait;
				margin: 15mm 18mm 15mm 18mm;
			}}
			* {{
				box-sizing: border-box;
				-webkit-print-color-adjust: exact;
				print-color-adjust: exact;
			}}
			html, body {{
				margin: 0;
				padding: 0;
				background-color: #ffffff;
				font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
				color: #111827;
				line-height: 1.45;
				font-size: 13px;
			}}
			.page {{
				page-break-after: always;
				break-after: page;
				box-sizing: border-box;
				height: 255mm;
				max-height: 255mm;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
				overflow: hidden;
			}}
			.page:last-child {{
				page-break-after: avoid !important;
				break-after: avoid !important;
			}}
			@media print {{
				@page {{
					size: A4 portrait;
					margin: 12mm 15mm 12mm 15mm;
				}}
				html, body {{
					padding: 0;
					margin: 0;
					background: #fff;
				}}
				.page {{
					height: 255mm;
					max-height: 255mm;
					page-break-after: always !important;
					break-after: page !important;
					overflow: hidden;
				}}
				.page:last-child {{
					page-break-after: avoid !important;
					break-after: avoid !important;
				}}
			}}
			.header {{
				text-align: center;
				border-bottom: 2px solid #ef4444;
				padding-bottom: 8px;
				margin-bottom: 14px;
			}}
			.brand-title {{
				font-size: 28px;
				font-weight: 900;
				color: #ef4444;
				letter-spacing: -0.5px;
				margin: 0;
			}}
			.brand-sub {{
				font-size: 15px;
				font-weight: bold;
				font-style: italic;
				color: #6b7280;
				margin: 0;
			}}
			.msme {{
				text-align: right;
				font-size: 10px;
				color: #4b5563;
				margin-top: 2px;
			}}
			.doc-title {{
				text-align: center;
				font-size: 18px;
				font-weight: bold;
				text-decoration: underline;
				letter-spacing: 1px;
				margin: 14px 0;
			}}
			.section-title {{
				font-size: 15px;
				font-weight: bold;
				text-decoration: underline;
				margin: 14px 0 10px;
			}}
			.table-props {{
				width: 100%;
				border-collapse: collapse;
				margin: 12px 0;
			}}
			.table-props td {{
				padding: 6px 4px;
				vertical-align: top;
			}}
			.bullet-td {{
				width: 20px;
				font-weight: bold;
			}}
			.label-td {{
				width: 240px;
				color: #1f2937;
			}}
			.val-td {{
				font-weight: 600;
				color: #111827;
			}}
			.footer {{
				display: flex;
				justify-content: space-between;
				font-size: 10.5px;
				color: #6b7280;
				border-top: 1px solid #e5e7eb;
				padding-top: 6px;
				margin-top: 16px;
			}}
			ol, ul {{
				padding-left: 22px;
				margin: 10px 0;
			}}
			li {{
				margin-bottom: 6px;
			}}
		</style>
	</head>
	<body>

		<!-- PAGE 1: PROPOSAL & TRAINING -->
		<div class="page">
			<div>
				<div class="header">
					<h1 class="brand-title">StandardTouch</h1>
					<p class="brand-sub">e-Solutions</p>
					<div class="msme">MSME Registration Number: KR15D0001383</div>
				</div>

				<div class="doc-title">OFFER LETTER</div>

				<p style="margin: 6px 0;"><strong>Date:</strong> {date_str}</p>
				<p style="margin: 6px 0; font-size: 15px;"><strong>Employment Proposal for:</strong> {offer.applicant_name}</p>
				<p style="margin: 6px 0; font-size: 15px;"><strong>Position:</strong> {offer.designation or 'Team Member'}</p>

				<div style="background-color: #f9fafb; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0;">
					<p style="margin: 0; font-size: 16px; font-weight: bold; text-decoration: underline;">
						Salary - {offer.salary_range} (After {offer.training_duration} of training)
					</p>
					<p style="margin: 4px 0 0; font-size: 13px; color: #4b5563;">Salary Variable (Depending on performance)</p>
				</div>

				<div class="section-title">Training:</div>

				<table class="table-props">
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Training Cost</td>
						<td class="val-td">Rs. 2,00,000/- (<span style="background-color: #fef08a; padding: 1px 4px;">Provided FREE of Cost</span>)</td>
					</tr>
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Travel allowance during Training</td>
						<td class="val-td">{offer.training_stipend}</td>
					</tr>
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Training Duration</td>
						<td class="val-td">{offer.training_duration}</td>
					</tr>
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Holidays & Leaves</td>
						<td class="val-td">Refer 3rd page</td>
					</tr>
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Contract</td>
						<td class="val-td">{offer.contract_duration}</td>
					</tr>
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Offer letter Validity</td>
						<td class="val-td">3 days from the above date.</td>
					</tr>
					<tr>
						<td class="bullet-td">▪</td>
						<td class="label-td">Performance Review</td>
						<td class="val-td">Refer 4th page</td>
					</tr>
				</table>
			</div>

			<div class="footer">
				<span>Standard Touch Confidential</span>
				<span>Offer Letter (Page 1 of 5)</span>
			</div>
		</div>

		<!-- PAGE 2: RESPONSIBILITIES -->
		<div class="page">
			<div>
				<div class="header">
					<h1 class="brand-title">StandardTouch</h1>
					<p class="brand-sub">e-Solutions</p>
					<div class="msme">MSME Registration Number: KR15D0001383</div>
				</div>

				<div class="doc-title">Responsibilities</div>

				<ol style="margin-top: 24px; line-height: 1.7;">
					{resp_items}
				</ol>

				<div style="margin-top: 40px; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
					<p style="margin: 0; font-size: 15px; font-weight: bold;">
						Reporting to: <span style="color: #ef4444;">{offer.reporting_manager}</span>
					</p>
				</div>
			</div>

			<div class="footer">
				<span>Standard Touch Confidential</span>
				<span>Offer Letter (Page 2 of 5)</span>
			</div>
		</div>

		<!-- PAGE 3: TERMS & CONDITIONS -->
		<div class="page">
			<div>
				<div class="header">
					<h1 class="brand-title">StandardTouch</h1>
					<p class="brand-sub">e-Solutions</p>
					<div class="msme">MSME Registration Number: KR15D0001383</div>
				</div>

				<div class="doc-title">Terms and Conditions</div>

				<table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
					<tr>
						<td style="width: 160px; font-weight: bold; padding: 14px 8px; vertical-align: top;">Increment</td>
						<td style="padding: 14px 8px;">Increment is based on performance.</td>
					</tr>
					<tr>
						<td style="width: 160px; font-weight: bold; padding: 14px 8px; vertical-align: top;">Work Timings</td>
						<td style="padding: 14px 8px; font-style: italic; font-weight: 600;">Mon-Sat: 9:30 AM - 6:30 PM (1-hour break included)</td>
					</tr>
					<tr>
						<td style="width: 160px; font-weight: bold; padding: 14px 8px; vertical-align: top;">Privacy</td>
						<td style="padding: 14px 8px;">All business secrets and know-how should be kept confidential.</td>
					</tr>
					<tr>
						<td style="width: 160px; font-weight: bold; padding: 14px 8px; vertical-align: top;">Company Assets</td>
						<td style="padding: 14px 8px;">All Company Assets (Themes/Plugins/Associated software) belonging to Standard Touch may not be used for any non-company purposes.</td>
					</tr>
					<tr>
						<td style="width: 160px; font-weight: bold; padding: 14px 8px; vertical-align: top;">Salary</td>
						<td style="padding: 14px 8px;">Not to be disclosed to team members in the Company.</td>
					</tr>
				</table>
			</div>

			<div class="footer">
				<span>Standard Touch Confidential</span>
				<span>Offer Letter (Page 3 of 5)</span>
			</div>
		</div>

		<!-- PAGE 4: HOLIDAYS & LEAVES -->
		<div class="page">
			<div>
				<div class="header">
					<h1 class="brand-title">StandardTouch</h1>
					<p class="brand-sub">e-Solutions</p>
					<div class="msme">MSME Registration Number: KR15D0001383</div>
				</div>

				<div class="section-title">Structure of HOLIDAYS & LEAVES:</div>
				
				<p><strong>National holidays(Fixed): 4 days</strong></p>
				<ul>
					<li>26th January - Republic day</li>
					<li>1st May - Labour day</li>
					<li>15th August - Independence day</li>
					<li>2nd October - Gandhi Jayanti</li>
				</ul>

				<p><strong>Festival holidays(Of Choice) - 4 days</strong></p>
				<p><strong>Paid leaves(Vacation + Sick Leaves) - 20 days</strong></p>

				<div style="background-color: #fef08a; padding: 6px 12px; font-weight: bold; display: inline-block; margin: 10px 0;">
					Total Holidays - 28 days/year
				</div>

				<div class="section-title">Terms & Conditions for Holidays & Leaves:</div>
				<ul>
					<li>Festival holidays to be taken during the holiday season only.</li>
					<li>Additional leave merging with festival holidays to be applied <strong>at least 15 days</strong> prior to festival holidays.</li>
					<li>Leaves for 2 days or more to be applied <strong>at least 10 days</strong> prior to the due date.</li>
					<li>Only emergency leaves will be allowed in training period.</li>
					<li>Leaves are subjected to approval.</li>
					<li>Unused paid leaves will be reimbursed on a pro-rata basis.</li>
					<li>Unpaid leaves subject to approval will lead to a deduction in salary on pro-rata basis.</li>
				</ul>

				<div class="section-title">Work From Home (WFH) Policy:</div>
				<ul>
					<li>To WFH, it's necessary to obtain approval from HR, only informing is not sufficient.</li>
					<li>For WFH permission, please ensure to call HR directly, as requests via WhatsApp or email may not be considered.</li>
					<li>If WFH is not authorized, personnel are expected to be present at the office. Non-compliance will be recorded as leave.</li>
					<li>Please note, that there is a limit of two work-from-home days per month; requests beyond this may not be accommodated.</li>
				</ul>
			</div>

			<div class="footer">
				<span>Standard Touch Confidential</span>
				<span>Offer Letter (Page 4 of 5)</span>
			</div>
		</div>

		<!-- PAGE 5: CONTRACT CONDITIONS & SIGNATURES -->
		<div class="page">
			<div>
				<div class="header">
					<h1 class="brand-title">StandardTouch</h1>
					<p class="brand-sub">e-Solutions</p>
					<div class="msme">MSME Registration Number: KR15D0001383</div>
				</div>

				<div class="section-title">Terms & Conditions:</div>
				<ol style="line-height: 1.6;">
					<li>2 tests will be held, first after 3 months of training & another after 6 months of training, failing to pass any of the tests will result in termination of employment.</li>
					<li>The latest degree certificate should be submitted & will remain with the company for the entire duration of the contract.</li>
					<li>At the time of formally resigning from service, serving the 60 days <strong>"Notice Period"</strong> is mandatory.</li>
					<li>Experience letter shall not be issued in case:
						<br>a. The notice period is not served.
						<br>b. If he/she is fired.
						<br>c. If the contract period is not served.
					</li>
					<li>Company reserves the right to terminate the contract if indiscipline or lack of performance is exhibited by the employee.</li>
					<li>Company reserves the right to modify the Terms & Conditions at any time, at its sole discretion.</li>
					<li>Salary shall be paid on the last working day from the day of acceptance of resignation.</li>
					<li>Only emergency leaves allowed during training period.</li>
					<li>No leaves shall be taken in the notice period, except under special circumstances - this may lead to an extension of the notice period.</li>
					<li>In case the contract is breached:
						<br>a. An experience letter shall not be issued.
						<br>b. The employee is liable to pay training cost to the company.
					</li>
				</ol>

				<!-- Signatures Area -->
				<div style="margin-top: 50px; display: flex; justify-content: space-between; align-items: flex-end; padding: 0 20px;">
					<div style="text-align: left;">
						<div style="height: 40px; border-bottom: 1px solid #111827; width: 180px; margin-bottom: 8px;"></div>
						<p style="margin: 0; font-weight: bold; font-size: 15px;">{offer.hr_signatory_name}</p>
						<p style="margin: 2px 0 0; color: #4b5563; font-size: 13px;">Human Resource Manager</p>
					</div>

					<div style="text-align: right;">
						<div style="height: 40px; border-bottom: 1px solid #111827; width: 180px; margin-bottom: 8px; margin-left: auto;"></div>
						<p style="margin: 0; font-weight: bold; font-size: 15px;">{offer.applicant_name}</p>
						<p style="margin: 2px 0 0; color: #4b5563; font-size: 13px;">Read & Signed</p>
					</div>
				</div>
			</div>

			<div class="footer">
				<span>Standard Touch Confidential</span>
				<span>Offer Letter (Page 5 of 5)</span>
			</div>
		</div>

	</body>
	</html>
	"""
	return html
