import frappe
from frappe.model.document import Document

class StaffFeedback(Document):
	def validate(self):
		if not self.feedback_type:
			self.feedback_type = "General Feedback"
		if not self.rating:
			self.rating = 5
		if not self.status:
			self.status = "Open"
		if not self.date:
			self.date = frappe.utils.today()
