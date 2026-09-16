import frappe

def assign_employee_role(doc, method):
	"""
	Automatically assigns the 'Employee' role to the associated User 
	when a new Employee is created or updated with a user_id.
	"""
	if not doc.user_id:
		return

	user_id = doc.user_id
	if not frappe.db.exists("User", user_id):
		return

	user = frappe.get_doc("User", user_id)
	has_role = False
	for role in user.roles:
		if role.role == "Employee":
			has_role = True
			break
			
	if not has_role:
		user.append("roles", {"role": "Employee"})
		user.flags.ignore_permissions = True
		user.save(ignore_permissions=True)
		frappe.db.commit()
