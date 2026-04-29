import frappe

no_cache = 1


# Role tier mapping — keep aligned with v4 plan (Notion: PRJ-8 → v4 — Full Hierarchy Plan).
# These flags are used by the template to gate sidebar items + section visibility.
_ROLE_GROUPS = {
    "is_admin": {"System Manager", "Administrator"},
    "is_cfo": {"System Manager", "Accounts Manager"},
    "is_finance_mgr": {"Accounts Manager"},
    "is_finance": {"Accounts User", "Accounts Manager"},
    "is_sales_mgr": {"Sales Manager"},
    "is_sales": {"Sales User", "Sales Manager"},
    "is_hr_mgr": {"HR Manager"},
    "is_hr": {"HR User", "HR Manager"},
    "is_production_mgr": {"Manufacturing Manager"},
    "is_production": {"Manufacturing User", "Manufacturing Manager"},
    "is_procurement_mgr": {"Purchase Manager"},
    "is_procurement": {"Purchase User", "Purchase Manager"},
    "is_quality": {"Quality Manager", "Quality User"},
    "is_logistics": {"Logistics", "Logistics Manager"},
}


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

    user_roles = set(frappe.get_roles(frappe.session.user) or [])
    roles = {flag: bool(user_roles & required) for flag, required in _ROLE_GROUPS.items()}
    # Convenience aggregate flags used in the sidebar
    roles["is_manager"] = any(
        roles[k] for k in ("is_finance_mgr", "is_sales_mgr", "is_hr_mgr",
                           "is_production_mgr", "is_procurement_mgr")
    )
    roles["any_desk"] = any(
        roles[k] for k in ("is_finance", "is_sales", "is_hr", "is_production",
                           "is_procurement", "is_quality", "is_logistics")
    )

    primary_role = "Employee"
    for label, flag in (("System Manager", "is_admin"), ("Finance Manager", "is_finance_mgr"),
                        ("Sales Manager", "is_sales_mgr"), ("HR Manager", "is_hr_mgr"),
                        ("Production Manager", "is_production_mgr"),
                        ("Procurement Manager", "is_procurement_mgr"),
                        ("Finance", "is_finance"), ("Sales", "is_sales"),
                        ("HR", "is_hr"), ("Production", "is_production"),
                        ("Procurement", "is_procurement"), ("Quality", "is_quality"),
                        ("Logistics", "is_logistics")):
        if roles.get(flag):
            primary_role = label
            break

    context.full_name = full_name
    context.first_name = first_name
    context.user_initials = "".join(w[0].upper() for w in full_name.split()[:2]) or "U"
    context.user_email = frappe.session.user
    context.roles = roles
    context.primary_role = primary_role
    context.csrf_token = frappe.sessions.get_csrf_token()

    # Current Fiscal Year — Round 5 feedback: dashboard hardcoded "FY 2025".
    # Prefer ERPNext's user default; fall back to the active Fiscal Year doc;
    # finally the calendar year.
    fy = None
    try:
        fy = frappe.defaults.get_user_default("fiscal_year")
    except Exception:
        pass
    if not fy:
        try:
            today = frappe.utils.today()
            rows = frappe.get_all(
                "Fiscal Year",
                filters={"year_start_date": ["<=", today], "year_end_date": [">=", today]},
                fields=["name"], limit=1,
            )
            if rows:
                fy = rows[0].get("name")
        except Exception:
            pass
    if not fy:
        try:
            fy = "FY " + str(frappe.utils.getdate(frappe.utils.today()).year)
        except Exception:
            fy = ""
    context.current_fy = fy
