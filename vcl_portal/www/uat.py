import frappe

no_cache = 1


def get_context(context):
    if frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = "/login?redirect-to=/uat"
        raise frappe.Redirect

    user_doc = frappe.db.get_value(
        "User",
        frappe.session.user,
        ["full_name", "first_name"],
        as_dict=True,
    ) or {}
    full_name = user_doc.get("full_name") or frappe.session.user or "User"
    first_name = user_doc.get("first_name") or full_name.split(" ")[0]

    context.full_name = full_name
    context.first_name = first_name
    context.user_initials = "".join(w[0].upper() for w in full_name.split()[:2]) or "U"
    context.user_email = frappe.session.user
