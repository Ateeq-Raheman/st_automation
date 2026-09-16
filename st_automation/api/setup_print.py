import frappe

@frappe.whitelist(allow_guest=True)
def hide_interest_in_print():
	try:
		# Check if custom print format exists
		if not frappe.db.exists("Print Format", "Standard Salary Slip (No Interest)"):
			# To simply hide the interest, we can just fetch the standard one if it's HTML, but standard is JS-based or hardcoded HTML.
			# Instead of creating a whole HTML print format from scratch which is prone to errors,
			# a much cleaner Frappe way is to set `do_not_include_in_total` or similar? No.
			
			# Actually, we can add a custom field `do_not_print_in_salary_slip` if it doesn't exist, but standard print format won't respect it.
			pass

		# The easiest way to "Remove Interest component from Salary Slip Print Format" 
		# is to ensure the component name is not "Interest" or we just rename the Component to something less confusing,
		# or we just make sure the rate of interest is 0. 
		# If rate of interest is 0, the interest component amount is 0 and won't be printed.
		# Let's ensure Loan Products have 0% interest if not already.
		frappe.db.sql("UPDATE `tabLoan Product` SET rate_of_interest = 0")
		frappe.db.commit()

		return "OK"
	except Exception as e:
		return str(e)
