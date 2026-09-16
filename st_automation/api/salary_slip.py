import frappe

def before_save(doc, method):
	"""
	Removes the Interest component from Salary Slip if its amount is 0.
	This ensures it doesn't show up in the Print Format for 0% interest loans.
	"""
	if hasattr(doc, "deductions") and doc.deductions:
		new_deductions = []
		for d in doc.deductions:
			# If it's an interest component and amount is 0, skip it
			if "Interest" in str(d.salary_component) and d.amount == 0:
				continue
			new_deductions.append(d)
		doc.deductions = new_deductions
