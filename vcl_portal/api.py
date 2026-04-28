"""Whitelisted API endpoints used by the v4 /uat portal.

Each method is callable via `/api/method/vcl_portal.api.<name>`. Auth is enforced
via Frappe session — Guest is rejected before any data is returned. Where a
DocType might not be installed (e.g. custom Job Card variants from vcl_job_cards),
the method degrades gracefully rather than throwing.

User → Customer scoping reuses the canonical helpers from vcl_sales_dashboard
(see Customer Sales Rep Assignment doctype). This avoids forking the rep
assignment logic across two apps.
"""

import frappe
from frappe import _
from frappe.utils import today, getdate, formatdate

# Reuse the canonical scope logic from vcl_sales_dashboard so we never fork
# the User → Sales Person → Customer chain. Falls back to "restricted with no
# customers" if vcl_sales_dashboard isn't installed.
try:
    from vcl_sales_dashboard.api.collections_utils import (
        get_user_scope as _sd_get_user_scope,
        get_customers_for_scope as _sd_get_customers_for_scope,
    )
    _SCOPE_HELPERS_AVAILABLE = True
except Exception:
    _SCOPE_HELPERS_AVAILABLE = False


def _require_login():
    if frappe.session.user == "Guest":
        frappe.throw(_("Login required"), frappe.PermissionError)


def _scope():
    """Return {is_restricted, sales_persons, customers, user, role}.

    `customers` is None for unrestricted (= no filter) or a list (possibly empty)
    for restricted users. Empty list = "Sales User with no permitted Sales Persons"
    = no data should be returned.
    """
    if _SCOPE_HELPERS_AVAILABLE:
        scope = _sd_get_user_scope()
        if scope.get("is_restricted"):
            scope["customers"] = _sd_get_customers_for_scope(scope) or []
        else:
            scope["customers"] = None
        return scope
    # Fallback: no helper available, treat everyone as restricted with no data
    # except System Manager (who sees everything).
    user = frappe.session.user
    roles = frappe.get_roles(user)
    if "System Manager" in roles or "Administrator" in roles:
        return {"is_restricted": False, "sales_persons": [], "customers": None,
                "user": user, "role": "System Manager"}
    return {"is_restricted": True, "sales_persons": [], "customers": [],
            "user": user, "role": "Limited"}


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
    """Sales Invoices that are draft or submitted+unpaid/overdue.
    Scoped via Customer Sales Rep Assignment for restricted users.
    """
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return {"submitted": [], "drafts": [], "scope": _scope_summary()}
    scope = _scope()
    submitted_filters = {
        "docstatus": 1,
        "status": ["in", ["Unpaid", "Overdue", "Partly Paid", "Submitted"]],
    }
    drafts_filters = {"docstatus": 0}
    if scope["is_restricted"]:
        if not scope["customers"]:
            return {"submitted": [], "drafts": [], "scope": _scope_summary(scope)}
        submitted_filters["customer"] = ["in", scope["customers"]]
        drafts_filters["customer"] = ["in", scope["customers"]]
    try:
        submitted = frappe.get_all(
            "Sales Invoice",
            filters=submitted_filters,
            fields=["name", "customer", "grand_total", "outstanding_amount",
                    "posting_date", "due_date", "status"],
            order_by="posting_date desc",
            limit=int(limit),
        )
        drafts = frappe.get_all(
            "Sales Invoice",
            filters=drafts_filters,
            fields=["name", "customer", "grand_total", "outstanding_amount",
                    "posting_date", "due_date", "status"],
            order_by="modified desc",
            limit=int(limit),
        )
        return {"submitted": submitted, "drafts": drafts, "scope": _scope_summary(scope)}
    except Exception as e:
        return {"error": str(e), "submitted": [], "drafts": [], "scope": _scope_summary(scope)}


def _scope_summary(scope=None):
    s = scope or _scope()
    return {
        "user": s["user"],
        "role": s["role"],
        "is_restricted": s["is_restricted"],
        "sales_persons_count": len(s.get("sales_persons") or []),
        "customers_count": (len(s["customers"]) if s.get("customers") is not None else None),
    }


@frappe.whitelist()
def get_user_scope():
    """Return the current user's scope info for the UI to display
    (e.g. 'Viewing as Joan Mwangi · Sales User · 23 customers')."""
    _require_login()
    return _scope_summary()


@frappe.whitelist()
def get_my_day():
    """Composite stat-strip data for the dashboard home page."""
    _require_login()
    user = frappe.session.user
    scope = _scope()
    out = {"user": user, "role": scope["role"]}

    # My Tasks (ToDo)
    try:
        out["my_tasks"] = frappe.db.count("ToDo", {"owner": user, "status": "Open"})
    except Exception:
        out["my_tasks"] = 0

    # Approvals waiting on me
    waiting = 0
    try:
        waiting += frappe.db.count("Leave Application",
                                   {"leave_approver": user, "status": "Open"})
    except Exception:
        pass
    try:
        # Workflow Action assigned to me (still pending)
        waiting += frappe.db.count("Workflow Action",
                                   {"user": user, "status": "Open"})
    except Exception:
        pass
    out["approvals_waiting"] = waiting

    # Open Sales Invoices for my scope
    try:
        si_filters = {"docstatus": 1,
                      "status": ["in", ["Unpaid", "Overdue", "Partly Paid", "Submitted"]]}
        if scope["is_restricted"]:
            if scope["customers"]:
                si_filters["customer"] = ["in", scope["customers"]]
            else:
                out["open_sales_invoices"] = 0
                si_filters = None
        if si_filters:
            out["open_sales_invoices"] = frappe.db.count("Sales Invoice", si_filters)
    except Exception:
        out["open_sales_invoices"] = 0

    # Open Job Cards (across variants where status field exists)
    open_jc = 0
    for dt in ("Job Card", "Job Card Label", "Job Card Computer Paper", "Job Card Carton"):
        if not frappe.db.exists("DocType", dt):
            continue
        if not frappe.has_permission(dt, "read"):
            continue
        try:
            open_jc += frappe.db.count(dt, {"status": ["!=", "Completed"]})
        except Exception:
            try:
                open_jc += frappe.db.count(dt)
            except Exception:
                pass
    out["open_job_cards"] = open_jc

    # VAT Filing — KRA monthly VAT return is due on the 20th
    today_d = getdate(today())
    if today_d.day <= 20:
        next_due = today_d.replace(day=20)
    else:
        if today_d.month == 12:
            next_due = today_d.replace(year=today_d.year + 1, month=1, day=20)
        else:
            next_due = today_d.replace(month=today_d.month + 1, day=20)
    out["vat_due_in_days"] = (next_due - today_d).days
    out["vat_due_label"] = formatdate(next_due, "d MMM")

    return out


def _customer_filter_sql(scope, field="customer"):
    """Return (where_fragment, params) to apply Customer Sales Rep Assignment scope to raw SQL.
    Empty fragment for unrestricted users; '1=0' fragment if user has zero assigned customers."""
    if not scope.get("is_restricted"):
        return "", []
    customers = scope.get("customers") or []
    if not customers:
        return "AND 1=0", []
    ph = ", ".join(["%s"] * len(customers))
    return f"AND {field} IN ({ph})", list(customers)


@frappe.whitelist()
def get_sales_kpis():
    """Sales Desk top stat strip: MTD revenue, open SOs, overdue AR, customer count."""
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return {"error": "no permission"}
    scope = _scope()
    out = {}
    today_d = getdate(today())
    mtd_start = today_d.replace(day=1)
    cust_si, p_si = _customer_filter_sql(scope, "customer")

    # MTD Revenue from submitted Sales Invoices
    try:
        row = frappe.db.sql(
            f"""SELECT COALESCE(SUM(grand_total), 0)
                FROM `tabSales Invoice`
                WHERE docstatus = 1
                  AND posting_date >= %s AND posting_date <= %s
                  {cust_si}""",
            [str(mtd_start), str(today_d)] + p_si,
        )
        out["mtd_revenue"] = float(row[0][0] or 0)
    except Exception as e:
        out["mtd_revenue"] = 0.0
        out["_rev_error"] = str(e)[:200]

    # Open Sales Orders count
    try:
        cust_so, p_so = _customer_filter_sql(scope, "customer")
        row = frappe.db.sql(
            f"""SELECT COUNT(*) FROM `tabSales Order`
                WHERE docstatus = 1
                  AND status NOT IN ('Completed', 'Closed', 'Cancelled')
                  {cust_so}""",
            p_so,
        )
        out["open_sos"] = int(row[0][0] or 0)
    except Exception:
        out["open_sos"] = 0

    # Overdue AR (outstanding past due date)
    try:
        cust_ar, p_ar = _customer_filter_sql(scope, "customer")
        row = frappe.db.sql(
            f"""SELECT COALESCE(SUM(outstanding_amount), 0)
                FROM `tabSales Invoice`
                WHERE docstatus = 1
                  AND status IN ('Unpaid', 'Overdue', 'Partly Paid', 'Submitted')
                  AND due_date < CURDATE()
                  {cust_ar}""",
            p_ar,
        )
        out["overdue_ar"] = float(row[0][0] or 0)
    except Exception:
        out["overdue_ar"] = 0.0

    # Active customer count (in scope)
    if scope["is_restricted"]:
        out["customers"] = len(scope.get("customers") or [])
    else:
        try:
            out["customers"] = frappe.db.count("Customer", {"disabled": 0})
        except Exception:
            out["customers"] = 0

    return out


@frappe.whitelist()
def get_sales_ageing(limit=25):
    """Per-customer outstanding broken into 0-30 / 31-60 / 61-90 / 90+ buckets
    based on posting_date age. Scoped via Customer Sales Rep Assignment."""
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return []
    scope = _scope()
    cust, params = _customer_filter_sql(scope, "customer")
    try:
        rows = frappe.db.sql(
            f"""SELECT
                    customer,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), posting_date) BETWEEN 0 AND 30
                             THEN outstanding_amount ELSE 0 END) AS b_0_30,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), posting_date) BETWEEN 31 AND 60
                             THEN outstanding_amount ELSE 0 END) AS b_31_60,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), posting_date) BETWEEN 61 AND 90
                             THEN outstanding_amount ELSE 0 END) AS b_61_90,
                    SUM(CASE WHEN DATEDIFF(CURDATE(), posting_date) > 90
                             THEN outstanding_amount ELSE 0 END) AS b_90_plus,
                    SUM(outstanding_amount) AS total
                FROM `tabSales Invoice`
                WHERE docstatus = 1 AND outstanding_amount > 0
                {cust}
                GROUP BY customer
                HAVING total > 0
                ORDER BY total DESC
                LIMIT %s""",
            params + [int(limit)],
            as_dict=True,
        )
        return rows
    except Exception as e:
        return [{"_error": str(e)[:200]}]


@frappe.whitelist()
def get_approval_queue(limit=50):
    """Items waiting on the session user across Leave + Workflow."""
    _require_login()
    user = frappe.session.user
    out = []

    # Leave Applications where I'm the approver
    try:
        for la in frappe.get_all(
            "Leave Application",
            filters={"leave_approver": user, "status": "Open"},
            fields=["name", "employee_name", "from_date", "to_date", "leave_type",
                    "total_leave_days", "creation"],
            order_by="creation asc",
            limit=int(limit),
        ):
            out.append({
                "doctype": "Leave Application",
                "name": la.name,
                "title": (la.employee_name or "") + " — " + (la.leave_type or ""),
                "subtitle": str(la.total_leave_days or 0) + " day(s) · "
                            + str(la.from_date) + " → " + str(la.to_date),
                "raised": str(la.creation)[:10],
                "url": "/app/leave-application/" + la.name,
            })
    except Exception:
        pass

    # Workflow Actions assigned to me (any DocType)
    try:
        for wa in frappe.get_all(
            "Workflow Action",
            filters={"user": user, "status": "Open"},
            fields=["name", "reference_doctype", "reference_name", "creation"],
            order_by="creation asc",
            limit=int(limit),
        ):
            out.append({
                "doctype": wa.reference_doctype,
                "name": wa.reference_name,
                "title": (wa.reference_doctype or "") + " · " + (wa.reference_name or ""),
                "subtitle": "Workflow approval",
                "raised": str(wa.creation)[:10],
                "url": "/app/" + (wa.reference_doctype or "").lower().replace(" ", "-")
                       + "/" + (wa.reference_name or ""),
            })
    except Exception:
        pass

    out.sort(key=lambda x: x.get("raised") or "")
    return out


@frappe.whitelist()
def get_hr_kpis():
    """HR Desk top stat strip. Gated on Employee read."""
    _require_login()
    if not frappe.has_permission("Employee", "read"):
        return {"error": "no permission"}
    out = {}
    try:
        out["total"] = frappe.db.count("Employee", {"status": "Active"})
    except Exception:
        out["total"] = 0
    try:
        # Permanent vs casual via employment_type contains 'Permanent'
        out["permanent"] = frappe.db.count(
            "Employee", {"status": "Active", "employment_type": ["like", "%ermanent%"]}
        )
    except Exception:
        out["permanent"] = 0
    out["casual"] = max(0, (out.get("total") or 0) - (out.get("permanent") or 0))

    # On leave today
    try:
        td = today()
        row = frappe.db.sql(
            """SELECT COUNT(DISTINCT employee) FROM `tabLeave Application`
               WHERE status = 'Approved' AND docstatus = 1
                 AND from_date <= %s AND to_date >= %s""",
            [td, td],
        )
        out["on_leave_today"] = int(row[0][0] or 0)
    except Exception:
        out["on_leave_today"] = 0

    return out


@frappe.whitelist()
def get_procurement_kpis():
    """Procurement Desk top stat strip. Gated on Purchase Order read."""
    _require_login()
    if not frappe.has_permission("Purchase Order", "read"):
        return {"error": "no permission"}
    out = {}
    try:
        out["open_pos"] = frappe.db.count(
            "Purchase Order",
            {"docstatus": 1, "status": ["not in", ["Completed", "Closed", "Cancelled"]]},
        )
    except Exception:
        out["open_pos"] = 0
    # POs not fully received
    try:
        row = frappe.db.sql(
            """SELECT COUNT(*) FROM `tabPurchase Order`
               WHERE docstatus = 1
                 AND per_received < 100
                 AND status NOT IN ('Completed', 'Closed', 'Cancelled')"""
        )
        out["pending_grns"] = int(row[0][0] or 0)
    except Exception:
        out["pending_grns"] = 0
    try:
        out["suppliers"] = frappe.db.count("Supplier", {"disabled": 0})
    except Exception:
        out["suppliers"] = 0
    out["imports_in_transit"] = None
    return out


@frappe.whitelist()
def get_finance_kpis():
    """Finance Desk top stat strip: Total AR, Total AP, Cash Balance, VAT Payable."""
    _require_login()
    out = {}
    scope = _scope()

    # Total AR — Sales Invoice outstanding sum, scoped
    try:
        if scope["is_restricted"]:
            if not scope["customers"]:
                out["total_ar"] = 0.0
            else:
                ph = ", ".join(["%s"] * len(scope["customers"]))
                row = frappe.db.sql(f"""
                    SELECT COALESCE(SUM(outstanding_amount), 0)
                    FROM `tabSales Invoice`
                    WHERE docstatus = 1
                      AND status IN ('Unpaid', 'Overdue', 'Partly Paid', 'Submitted')
                      AND customer IN ({ph})
                """, scope["customers"])
                out["total_ar"] = float(row[0][0] or 0)
        else:
            row = frappe.db.sql("""
                SELECT COALESCE(SUM(outstanding_amount), 0)
                FROM `tabSales Invoice`
                WHERE docstatus = 1
                  AND status IN ('Unpaid', 'Overdue', 'Partly Paid', 'Submitted')
            """)
            out["total_ar"] = float(row[0][0] or 0)
    except Exception as e:
        out["total_ar"] = 0.0
        out["_ar_error"] = str(e)[:200]

    # Total AP — Purchase Invoice outstanding sum (no scope filter — finance role gates this)
    try:
        if not frappe.has_permission("Purchase Invoice", "read"):
            out["total_ap"] = None
        else:
            row = frappe.db.sql("""
                SELECT COALESCE(SUM(outstanding_amount), 0)
                FROM `tabPurchase Invoice`
                WHERE docstatus = 1
                  AND status IN ('Unpaid', 'Overdue', 'Partly Paid')
            """)
            out["total_ap"] = float(row[0][0] or 0)
    except Exception as e:
        out["total_ap"] = None
        out["_ap_error"] = str(e)[:200]

    # Cash Balance — sum across Bank accounts via GL Entry
    try:
        if not frappe.has_permission("Account", "read"):
            out["cash_balance"] = None
        else:
            row = frappe.db.sql("""
                SELECT COALESCE(SUM(gl.debit - gl.credit), 0)
                FROM `tabGL Entry` gl
                JOIN `tabAccount` a ON a.name = gl.account
                WHERE a.account_type = 'Bank'
                  AND gl.is_cancelled = 0
            """)
            out["cash_balance"] = float(row[0][0] or 0)
    except Exception as e:
        out["cash_balance"] = None
        out["_cash_error"] = str(e)[:200]

    # VAT Payable — placeholder (needs VAT account identification per the
    # VAT recon workflow). Returns None so the UI shows "—" rather than 0.
    out["vat_payable"] = None
    out["vat_payable_note"] = "Wiring deferred to Phase A.2 (needs VAT account mapping)"

    return out


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
