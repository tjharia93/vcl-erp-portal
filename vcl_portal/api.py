"""Whitelisted API endpoints used by the v4 /uat portal.

Each method is callable via `/api/method/vcl_portal.api.<name>`. Auth is enforced
via Frappe session — Guest is rejected before any data is returned. Where a
DocType might not be installed (e.g. custom Job Card variants from vcl_job_cards),
the method degrades gracefully rather than throwing.
"""

import frappe
from frappe import _


def _require_login():
    if frappe.session.user == "Guest":
        frappe.throw(_("Login required"), frappe.PermissionError)


def _employee_for_session():
    return frappe.db.get_value("Employee", {"user_id": frappe.session.user}, "name")


@frappe.whitelist()
def get_my_profile():
    """Return the session user's User + Employee record (limited fields)."""
    _require_login()
    user = frappe.session.user
    user_doc = frappe.db.get_value(
        "User", user, ["full_name", "first_name", "email", "user_image"], as_dict=True
    ) or {}
    employee = frappe.db.get_value(
        "Employee",
        {"user_id": user},
        ["name", "employee_name", "designation", "department", "branch", "company",
         "date_of_joining", "employment_type", "employee_image", "company_email"],
        as_dict=True,
    ) or {}
    return {"user": user, "user_doc": user_doc, "employee": employee}


@frappe.whitelist()
def get_my_leave_balance():
    """Return Leave Allocations for the session user's Employee, current year."""
    _require_login()
    employee = _employee_for_session()
    if not employee:
        return []
    try:
        return frappe.get_all(
            "Leave Allocation",
            filters={"employee": employee, "docstatus": 1},
            fields=["leave_type", "total_leaves_allocated", "leaves_taken", "from_date", "to_date"],
            order_by="from_date desc",
            limit=20,
        )
    except Exception:
        return []


@frappe.whitelist()
def get_my_payslips(limit=3):
    """Return the most recent submitted Salary Slips for the session user."""
    _require_login()
    employee = _employee_for_session()
    if not employee:
        return []
    try:
        return frappe.get_all(
            "Salary Slip",
            filters={"employee": employee, "docstatus": 1},
            fields=["name", "posting_date", "net_pay", "start_date", "end_date"],
            order_by="posting_date desc",
            limit=int(limit),
        )
    except Exception:
        return []


@frappe.whitelist()
def get_my_recent_activity(limit=5):
    """Recent Notification Log + ToDo entries owned by the session user."""
    _require_login()
    user = frappe.session.user
    out = []
    try:
        for n in frappe.get_all(
            "Notification Log",
            filters={"for_user": user},
            fields=["subject", "creation", "type"],
            order_by="creation desc",
            limit=int(limit),
        ):
            out.append({"when": n.get("creation"), "what": n.get("subject"), "kind": n.get("type") or "Notification"})
    except Exception:
        pass
    try:
        for t in frappe.get_all(
            "ToDo",
            filters={"owner": user, "status": "Open"},
            fields=["description", "modified"],
            order_by="modified desc",
            limit=int(limit),
        ):
            out.append({"when": t.get("modified"), "what": t.get("description"), "kind": "Task"})
    except Exception:
        pass
    out.sort(key=lambda x: x.get("when") or "", reverse=True)
    return out[: int(limit)]


@frappe.whitelist()
def get_directory(search=None, limit=200):
    """Return active Employees with public-safe fields. Optional `search` filters
    by name/designation/department (case-insensitive)."""
    _require_login()
    try:
        rows = frappe.get_all(
            "Employee",
            filters={"status": "Active"},
            fields=["name", "employee_name", "designation", "department", "company_email", "image"],
            order_by="employee_name asc",
            limit=int(limit),
        )
    except Exception:
        return []
    if search:
        s = (search or "").strip().lower()
        if s:
            rows = [
                r for r in rows
                if s in (r.get("employee_name") or "").lower()
                or s in (r.get("designation") or "").lower()
                or s in (r.get("department") or "").lower()
            ]
    return rows


@frappe.whitelist()
def get_open_sales_invoices(limit=100):
    """Sales Invoices that are draft or submitted+unpaid/overdue. Scoped by
    standard ERPNext permission_query (Sales User sees only their territory etc.)."""
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return []
    try:
        # Submitted + still owing
        submitted = frappe.get_all(
            "Sales Invoice",
            filters={
                "docstatus": 1,
                "status": ["in", ["Unpaid", "Overdue", "Partly Paid", "Submitted"]],
            },
            fields=["name", "customer", "grand_total", "outstanding_amount",
                    "posting_date", "due_date", "status"],
            order_by="posting_date desc",
            limit=int(limit),
        )
        # Drafts (not yet submitted)
        drafts = frappe.get_all(
            "Sales Invoice",
            filters={"docstatus": 0},
            fields=["name", "customer", "grand_total", "outstanding_amount",
                    "posting_date", "due_date", "status"],
            order_by="modified desc",
            limit=int(limit),
        )
        return {"submitted": submitted, "drafts": drafts}
    except Exception as e:
        return {"error": str(e), "submitted": [], "drafts": []}


@frappe.whitelist()
def get_open_job_cards(limit=100):
    """Open Job Cards across ERPNext core + VCL custom variants
    (Job Card Label / Computer Paper / Carton from vcl_job_cards).
    Degrades gracefully if a DocType isn't installed."""
    _require_login()
    candidates = ["Job Card", "Job Card Label", "Job Card Computer Paper", "Job Card Carton"]
    out = []
    for dt in candidates:
        if not frappe.db.exists("DocType", dt):
            continue
        if not frappe.has_permission(dt, "read"):
            continue
        try:
            # Try common fields; fall back if some are missing
            fields = ["name", "status", "creation", "modified"]
            meta = frappe.get_meta(dt)
            for opt in ("customer", "customer_name", "for_quantity", "actual_start_date",
                        "workstation", "production_item"):
                if meta.has_field(opt):
                    fields.append(opt)
            rows = frappe.get_all(
                dt,
                filters={"status": ["!=", "Completed"]} if meta.has_field("status") else {},
                fields=fields,
                order_by="creation desc",
                limit=int(limit),
            )
            for r in rows:
                r["_doctype"] = dt
            out.extend(rows)
        except Exception:
            continue
    out.sort(key=lambda r: r.get("creation") or "", reverse=True)
    return out[: int(limit)]
