import frappe

no_cache = 1


def get_context(context):
    """Redirect every request under /employee* to the v4 portal at /uat.

    Old /employee was the v3-era card-grid landing. v4 is now /uat. Keep this
    redirect so any bookmarks / links to /employee land in the right place.
    """
    target = "/uat"
    # Preserve any path under /employee/* (e.g. /employee/sales) — though the
    # SPA at /uat doesn't currently route by path, this lets us extend later.
    requested = (frappe.local.request.path or "/employee").rstrip("/")
    if requested != "/employee" and requested.startswith("/employee/"):
        # Keep just the subpath as a hash so the SPA can pick it up
        target = "/uat#" + requested.split("/employee/", 1)[1]
    if frappe.session.user == "Guest":
        target = "/login?redirect-to=" + target
    frappe.local.flags.redirect_location = target
    raise frappe.Redirect
