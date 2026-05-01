import frappe

no_cache = 1


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.throw(frappe._("Please login to access the inbox"), frappe.PermissionError)

    context.no_cache = 1
    context.show_sidebar = False
    return context
