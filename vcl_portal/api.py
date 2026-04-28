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


# ── Procurement ──────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_purchase_orders(limit=50):
    _require_login()
    if not frappe.has_permission("Purchase Order", "read"):
        return []
    try:
        return frappe.get_all(
            "Purchase Order",
            filters={"docstatus": 1,
                     "status": ["not in", ["Completed", "Closed", "Cancelled"]]},
            fields=["name", "supplier", "transaction_date", "grand_total",
                    "status", "per_received", "schedule_date"],
            order_by="transaction_date desc", limit=int(limit),
        )
    except Exception:
        return []


@frappe.whitelist()
def get_suppliers(search=None, limit=200):
    _require_login()
    if not frappe.has_permission("Supplier", "read"):
        return []
    try:
        rows = frappe.get_all(
            "Supplier", filters={"disabled": 0},
            fields=["name", "supplier_name", "supplier_group", "country",
                    "default_currency"],
            order_by="supplier_name", limit=int(limit),
        )
    except Exception:
        return []
    if search:
        s = (search or "").strip().lower()
        if s:
            rows = [r for r in rows if s in (r.get("supplier_name") or "").lower()
                    or s in (r.get("country") or "").lower()
                    or s in (r.get("supplier_group") or "").lower()]
    return rows


@frappe.whitelist()
def get_pending_grns(limit=50):
    _require_login()
    if not frappe.has_permission("Purchase Order", "read"):
        return []
    try:
        return frappe.db.sql(
            """SELECT name, supplier, transaction_date, grand_total,
                      per_received, status, schedule_date
               FROM `tabPurchase Order`
               WHERE docstatus = 1
                 AND per_received < 100
                 AND status NOT IN ('Completed', 'Closed', 'Cancelled')
               ORDER BY transaction_date DESC LIMIT %s""",
            [int(limit)], as_dict=True,
        )
    except Exception:
        return []


@frappe.whitelist()
def get_imports(limit=30):
    """Custom Importation tracker if installed; otherwise a placeholder."""
    _require_login()
    for dt in ("Importation Tracker", "Import Tracker", "Vcl Importation"):
        if frappe.db.exists("DocType", dt) and frappe.has_permission(dt, "read"):
            try:
                return {"doctype": dt, "rows": frappe.get_all(
                    dt, fields=["*"], order_by="creation desc", limit=int(limit))}
            except Exception:
                pass
    return {"_no_doctype": True,
            "note": "No custom Importation Tracker doctype installed. "
                    "Tracker still in Excel; build a doctype to wire."}


# ── HR ───────────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_employees(search=None, limit=200):
    """HR view of Employees — more fields than the public Directory."""
    _require_login()
    if not frappe.has_permission("Employee", "read"):
        return []
    try:
        rows = frappe.get_all(
            "Employee", filters={"status": "Active"},
            fields=["name", "employee_name", "designation", "department",
                    "branch", "employment_type", "date_of_joining",
                    "company_email", "personal_email", "cell_number"],
            order_by="employee_name", limit=int(limit),
        )
    except Exception:
        return []
    if search:
        s = (search or "").strip().lower()
        if s:
            rows = [r for r in rows if any(
                s in (r.get(f) or "").lower()
                for f in ("employee_name", "designation", "department", "branch",
                          "employment_type")
            )]
    return rows


@frappe.whitelist()
def get_leave_admin(limit=50):
    _require_login()
    out = {"open": [], "active": []}
    if not frappe.has_permission("Leave Application", "read"):
        return out
    try:
        out["open"] = frappe.get_all(
            "Leave Application",
            filters={"status": "Open"},
            fields=["name", "employee_name", "leave_type", "from_date",
                    "to_date", "total_leave_days", "leave_approver", "creation"],
            order_by="from_date desc", limit=int(limit),
        )
    except Exception:
        pass
    try:
        td = today()
        out["active"] = frappe.get_all(
            "Leave Application",
            filters={"status": "Approved", "docstatus": 1,
                     "from_date": ["<=", td], "to_date": [">=", td]},
            fields=["name", "employee_name", "leave_type", "from_date", "to_date"],
            order_by="from_date desc", limit=int(limit),
        )
    except Exception:
        pass
    return out


@frappe.whitelist()
def get_statutory_summary():
    """Statutory deduction totals (PAYE / NSSF / SHIF / Housing) from
    submitted Salary Slips for the current month, summed via Salary Detail."""
    _require_login()
    if not frappe.has_permission("Salary Slip", "read"):
        return {"error": "no permission"}
    out = {}
    td = getdate(today())
    period_start = td.replace(day=1)
    components = {
        "paye": ["PAYE", "Income Tax", "Tax", "P.A.Y.E"],
        "nssf": ["NSSF"],
        "shif": ["SHIF", "NHIF", "S.H.I.F"],
        "housing": ["Housing Levy", "Housing", "AHL"],
    }
    for key, names in components.items():
        try:
            ph = ", ".join(["%s"] * len(names))
            row = frappe.db.sql(
                f"""SELECT COALESCE(SUM(sd.amount), 0)
                    FROM `tabSalary Detail` sd
                    JOIN `tabSalary Slip` ss ON ss.name = sd.parent
                    WHERE ss.docstatus = 1
                      AND sd.parentfield = 'deductions'
                      AND ss.posting_date BETWEEN %s AND %s
                      AND sd.salary_component IN ({ph})""",
                [str(period_start), str(td)] + names,
            )
            out[key] = float(row[0][0] or 0)
        except Exception:
            out[key] = 0.0
    out["period_start"] = str(period_start)
    out["period_end"] = str(td)
    return out


# ── Quality ──────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_quality_inspections(limit=50):
    _require_login()
    if not frappe.db.exists("DocType", "Quality Inspection"):
        return []
    if not frappe.has_permission("Quality Inspection", "read"):
        return []
    try:
        return frappe.get_all(
            "Quality Inspection",
            fields=["name", "reference_type", "reference_name", "status",
                    "inspection_type", "report_date", "item_code"],
            order_by="report_date desc", limit=int(limit),
        )
    except Exception:
        return []


@frappe.whitelist()
def get_product_specs(limit=50):
    _require_login()
    if not frappe.db.exists("DocType", "Customer Product Specification"):
        return {"_no_doctype": True,
                "note": "Customer Product Specification (vcl_job_cards) not installed."}
    if not frappe.has_permission("Customer Product Specification", "read"):
        return []
    try:
        meta = frappe.get_meta("Customer Product Specification")
        fields = ["name", "customer", "creation"]
        for opt in ("product_type", "size_mm", "gsm", "substrate", "colour",
                    "no_of_colours", "plate_status", "plate_code"):
            if meta.has_field(opt):
                fields.append(opt)
        return frappe.get_all(
            "Customer Product Specification",
            fields=fields, order_by="creation desc", limit=int(limit),
        )
    except Exception:
        return []


@frappe.whitelist()
def get_ncr_list(limit=50):
    """Custom NCR doctype if installed; else fall back to Issue (priority=High)."""
    _require_login()
    for dt in ("NCR", "Non Conformance", "Non Conformance Report"):
        if frappe.db.exists("DocType", dt) and frappe.has_permission(dt, "read"):
            try:
                return {"doctype": dt, "rows": frappe.get_all(
                    dt, fields=["name", "creation", "status"],
                    order_by="creation desc", limit=int(limit))}
            except Exception:
                pass
    if frappe.db.exists("DocType", "Issue") and frappe.has_permission("Issue", "read"):
        try:
            return {"doctype": "Issue (fallback)", "rows": frappe.get_all(
                "Issue",
                filters={"status": ["!=", "Closed"], "priority": ["in", ["High", "Urgent"]]},
                fields=["name", "subject", "customer", "status", "priority", "creation"],
                order_by="creation desc", limit=int(limit))}
        except Exception:
            pass
    return {"_no_doctype": True, "note": "No NCR / Issue doctype available."}


# ── Logistics ────────────────────────────────────────────────────────────────

@frappe.whitelist()
def get_vehicles(limit=50):
    _require_login()
    if not frappe.db.exists("DocType", "Vehicle"):
        return {"_no_doctype": True}
    if not frappe.has_permission("Vehicle", "read"):
        return []
    try:
        meta = frappe.get_meta("Vehicle")
        fields = ["name"]
        for opt in ("license_plate", "make", "model", "fuel_type",
                    "last_odometer", "carrying_capacity", "vehicle_value"):
            if meta.has_field(opt):
                fields.append(opt)
        return frappe.get_all("Vehicle", fields=fields, limit=int(limit))
    except Exception:
        return []


@frappe.whitelist()
def get_delivery_schedule(limit=30):
    _require_login()
    if not frappe.has_permission("Delivery Note", "read"):
        return []
    try:
        return frappe.get_all(
            "Delivery Note",
            filters={"docstatus": 1},
            fields=["name", "customer", "posting_date", "status", "grand_total"],
            order_by="posting_date desc", limit=int(limit),
        )
    except Exception:
        return []


@frappe.whitelist()
def get_vehicle_logs(limit=50):
    _require_login()
    if not frappe.db.exists("DocType", "Vehicle Log"):
        return {"_no_doctype": True}
    if not frappe.has_permission("Vehicle Log", "read"):
        return []
    try:
        meta = frappe.get_meta("Vehicle Log")
        fields = ["name"]
        for opt in ("license_plate", "date", "odometer", "fuel_qty",
                    "fuel_price", "price"):
            if meta.has_field(opt):
                fields.append(opt)
        return frappe.get_all("Vehicle Log", fields=fields,
                              order_by="date desc", limit=int(limit))
    except Exception:
        return []


# ── Reports (deep-link list) ─────────────────────────────────────────────────

@frappe.whitelist()
def get_report_links():
    _require_login()
    company = frappe.defaults.get_user_default("Company") or ""
    td = getdate(today())
    mtd_start = td.replace(day=1)
    yr_start = td.replace(month=1, day=1)
    enc = frappe.utils.cstr

    def url(name, **params):
        from urllib.parse import urlencode
        params.setdefault("company", company)
        return "/app/query-report/" + name + "?" + urlencode(params)

    return {
        "Financial": [
            {"label": "Trial Balance", "url": url("Trial Balance",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Profit and Loss", "url": url("Profit and Loss Statement",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Balance Sheet", "url": url("Balance Sheet",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Accounts Receivable", "url": url("Accounts Receivable")},
            {"label": "Accounts Payable", "url": url("Accounts Payable")},
            {"label": "General Ledger", "url": url("General Ledger",
                from_date=str(mtd_start), to_date=str(td))},
        ],
        "Sales": [
            {"label": "Sales Register", "url": url("Sales Register",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Sales Analytics", "url": url("Sales Analytics",
                range="Monthly", from_date=str(yr_start), to_date=str(td))},
            {"label": "Sales Order Trends", "url": url("Sales Order Trends",
                period="Monthly", from_date=str(yr_start), to_date=str(td))},
            {"label": "Customer Acquisition and Loyalty",
                "url": url("Customer Acquisition and Loyalty",
                from_date=str(yr_start), to_date=str(td))},
        ],
        "Purchase": [
            {"label": "Purchase Register", "url": url("Purchase Register",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Purchase Analytics", "url": url("Purchase Analytics",
                range="Monthly", from_date=str(yr_start), to_date=str(td))},
        ],
        "Stock": [
            {"label": "Stock Balance", "url": url("Stock Balance")},
            {"label": "Stock Ledger", "url": url("Stock Ledger",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Stock Ageing", "url": url("Stock Ageing")},
        ],
        "HR": [
            {"label": "Employee Information", "url": url("Employee Information")},
            {"label": "Salary Register", "url": url("Salary Register",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Monthly Attendance Sheet", "url": url("Monthly Attendance Sheet",
                month=td.strftime("%m"), year=td.year)},
        ],
        "Production": [
            {"label": "Job Card Summary", "url": url("Job Card Summary",
                from_date=str(mtd_start), to_date=str(td))},
            {"label": "Production Analytics", "url": url("Production Analytics",
                range="Monthly", from_date=str(yr_start), to_date=str(td))},
            {"label": "BOM Stock Report", "url": url("BOM Stock Report")},
        ],
    }


# ── Stock (used by quality + production sub-pages) ───────────────────────────

@frappe.whitelist()
def get_stock_alerts(limit=30):
    _require_login()
    if not frappe.has_permission("Item", "read"):
        return []
    try:
        return frappe.db.sql(
            """SELECT b.item_code, b.warehouse, b.actual_qty, b.projected_qty,
                      i.reorder_level, i.item_name
               FROM `tabBin` b
               JOIN `tabItem` i ON i.name = b.item_code
               WHERE i.disabled = 0
                 AND i.reorder_level IS NOT NULL AND i.reorder_level > 0
                 AND b.actual_qty <= i.reorder_level
               ORDER BY (i.reorder_level - b.actual_qty) DESC
               LIMIT %s""",
            [int(limit)], as_dict=True,
        )
    except Exception:
        return []


@frappe.whitelist()
def get_sales_collections(limit=30):
    """Customers with outstanding > 30 days; last contact (if any) from
    Collections Follow Up custom doctype (vcl_sales_dashboard)."""
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return []
    scope = _scope()
    cust, params = _customer_filter_sql(scope, "customer")
    try:
        rows = frappe.db.sql(
            f"""SELECT
                    customer,
                    SUM(outstanding_amount) AS outstanding,
                    MAX(DATEDIFF(CURDATE(), posting_date)) AS oldest_age_days,
                    COUNT(*) AS open_invoices
                FROM `tabSales Invoice`
                WHERE docstatus = 1 AND outstanding_amount > 0
                  AND DATEDIFF(CURDATE(), posting_date) > 30
                  {cust}
                GROUP BY customer
                ORDER BY outstanding DESC
                LIMIT %s""",
            params + [int(limit)],
            as_dict=True,
        )
    except Exception:
        rows = []
    # Last follow-up date from custom doctype if available
    if rows and frappe.db.exists("DocType", "Collections Follow Up"):
        names = [r["customer"] for r in rows]
        ph = ", ".join(["%s"] * len(names))
        try:
            fu = frappe.db.sql(
                f"""SELECT customer, MAX(creation) AS last_contact
                    FROM `tabCollections Follow Up`
                    WHERE customer IN ({ph})
                    GROUP BY customer""",
                names, as_dict=True,
            )
            fu_map = {f["customer"]: f["last_contact"] for f in fu}
            for r in rows:
                r["last_contact"] = fu_map.get(r["customer"])
        except Exception:
            pass
    return rows


@frappe.whitelist()
def get_customer_360(customer=None):
    """Per-customer summary: profile, outstanding, MTD revenue, last invoice,
    last payment, last 5 invoices."""
    _require_login()
    if not customer:
        # Return list of allowed customers for the picker
        scope = _scope()
        if scope["is_restricted"]:
            return {"customers": [{"name": c} for c in (scope.get("customers") or [])][:200]}
        try:
            return {"customers": frappe.get_all(
                "Customer",
                filters={"disabled": 0},
                fields=["name", "customer_name"],
                limit=500,
                order_by="customer_name",
            )}
        except Exception:
            return {"customers": []}
    if not frappe.has_permission("Customer", "read", customer):
        return {"error": "no permission for " + customer}
    scope = _scope()
    if scope["is_restricted"] and customer not in (scope.get("customers") or []):
        return {"error": "customer not in your scope"}
    out = {"customer": customer}
    try:
        out["profile"] = frappe.db.get_value(
            "Customer", customer,
            ["customer_name", "territory", "default_currency", "customer_group", "credit_days"],
            as_dict=True,
        ) or {}
    except Exception:
        out["profile"] = {}
    today_d = getdate(today())
    mtd_start = today_d.replace(day=1)
    try:
        out["outstanding"] = float(frappe.db.sql(
            """SELECT COALESCE(SUM(outstanding_amount), 0) FROM `tabSales Invoice`
               WHERE docstatus = 1 AND customer = %s
                 AND status IN ('Unpaid', 'Overdue', 'Partly Paid', 'Submitted')""",
            [customer],
        )[0][0] or 0)
        out["mtd_revenue"] = float(frappe.db.sql(
            """SELECT COALESCE(SUM(grand_total), 0) FROM `tabSales Invoice`
               WHERE docstatus = 1 AND customer = %s
                 AND posting_date BETWEEN %s AND %s""",
            [customer, str(mtd_start), str(today_d)],
        )[0][0] or 0)
    except Exception:
        out["outstanding"] = 0
        out["mtd_revenue"] = 0
    try:
        out["recent_invoices"] = frappe.get_all(
            "Sales Invoice",
            filters={"customer": customer, "docstatus": 1},
            fields=["name", "posting_date", "grand_total", "outstanding_amount", "status"],
            order_by="posting_date desc",
            limit=5,
        )
    except Exception:
        out["recent_invoices"] = []
    try:
        out["recent_payments"] = frappe.get_all(
            "Payment Entry",
            filters={"party_type": "Customer", "party": customer, "docstatus": 1},
            fields=["name", "posting_date", "paid_amount"],
            order_by="posting_date desc",
            limit=5,
        )
    except Exception:
        out["recent_payments"] = []
    return out


@frappe.whitelist()
def get_rep_performance():
    """Per Sales Person target vs actual MTD. Uses custom Sales Target doctype
    if available; otherwise just shows MTD actual."""
    _require_login()
    scope = _scope()
    today_d = getdate(today())
    mtd_start = today_d.replace(day=1)

    # Determine the set of Sales Persons to report on
    if scope["is_restricted"]:
        sales_persons = scope.get("sales_persons") or []
        if not sales_persons:
            return []
    else:
        try:
            sps = frappe.get_all("Sales Person", filters={"enabled": 1},
                                 fields=["name"], limit=200)
            sales_persons = [s["name"] for s in sps]
        except Exception:
            sales_persons = []

    if not sales_persons:
        return []

    out = []
    has_sales_target = frappe.db.exists("DocType", "Sales Target")

    for sp in sales_persons:
        row = {"sales_person": sp}
        # Actual MTD — sum grand_total from Sales Invoice where this Sales Person is on the SI Sales Team
        try:
            actual = frappe.db.sql(
                """SELECT COALESCE(SUM(si.grand_total), 0)
                   FROM `tabSales Invoice` si
                   JOIN `tabSales Team` st ON st.parent = si.name AND st.parenttype = 'Sales Invoice'
                   WHERE si.docstatus = 1
                     AND st.sales_person = %s
                     AND si.posting_date BETWEEN %s AND %s""",
                [sp, str(mtd_start), str(today_d)],
            )[0][0] or 0
            row["actual_mtd"] = float(actual)
        except Exception:
            row["actual_mtd"] = 0
        # Target — use Sales Target doctype if installed
        if has_sales_target:
            try:
                tgt = frappe.db.sql(
                    """SELECT COALESCE(SUM(target_amount), 0)
                       FROM `tabSales Target`
                       WHERE sales_person = %s
                         AND fiscal_year = %s""",
                    [sp, today_d.year],
                )[0][0] or 0
                row["target_period"] = float(tgt)
            except Exception:
                row["target_period"] = None
        else:
            row["target_period"] = None
        row["pct_achieved"] = (
            round(100 * row["actual_mtd"] / row["target_period"], 1)
            if row.get("target_period") else None
        )
        out.append(row)
    out.sort(key=lambda r: r.get("actual_mtd", 0), reverse=True)
    return out


@frappe.whitelist()
def get_sales_manager_view():
    """Cross-rep aggregate. Returns total team MTD + per-rep summary + escalations
    (overdue >60 days). Manager-level view; restricted users get their own scope."""
    _require_login()
    scope = _scope()
    cust, params = _customer_filter_sql(scope, "customer")
    today_d = getdate(today())
    mtd_start = today_d.replace(day=1)
    out = {}
    try:
        out["team_mtd"] = float(frappe.db.sql(
            f"""SELECT COALESCE(SUM(grand_total), 0)
                FROM `tabSales Invoice`
                WHERE docstatus = 1
                  AND posting_date BETWEEN %s AND %s
                  {cust}""",
            [str(mtd_start), str(today_d)] + params,
        )[0][0] or 0)
    except Exception:
        out["team_mtd"] = 0
    try:
        out["pipeline"] = float(frappe.db.sql(
            f"""SELECT COALESCE(SUM(grand_total - advance_paid), 0)
                FROM `tabSales Order`
                WHERE docstatus = 1
                  AND status NOT IN ('Closed', 'Cancelled', 'Completed')
                  {_customer_filter_sql(scope, 'customer')[0]}""",
            params,
        )[0][0] or 0)
    except Exception:
        out["pipeline"] = 0
    try:
        out["escalations"] = int(frappe.db.sql(
            f"""SELECT COUNT(DISTINCT customer)
                FROM `tabSales Invoice`
                WHERE docstatus = 1 AND outstanding_amount > 0
                  AND DATEDIFF(CURDATE(), posting_date) > 60
                  {cust}""",
            params,
        )[0][0] or 0)
    except Exception:
        out["escalations"] = 0
    return out


@frappe.whitelist()
def get_ar_detail(limit=50):
    """AR view: per-customer outstanding + days-since-oldest. Sorted by outstanding."""
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return []
    scope = _scope()
    cust, params = _customer_filter_sql(scope, "customer")
    try:
        return frappe.db.sql(
            f"""SELECT
                    customer,
                    COUNT(*) AS open_invoices,
                    SUM(outstanding_amount) AS outstanding,
                    MAX(DATEDIFF(CURDATE(), posting_date)) AS oldest_age_days,
                    MAX(DATEDIFF(CURDATE(), due_date)) AS oldest_overdue_days
                FROM `tabSales Invoice`
                WHERE docstatus = 1 AND outstanding_amount > 0
                {cust}
                GROUP BY customer
                ORDER BY outstanding DESC
                LIMIT %s""",
            params + [int(limit)], as_dict=True,
        )
    except Exception:
        return []


@frappe.whitelist()
def get_ap_detail(limit=50):
    """AP view: per-supplier outstanding + days-since-oldest."""
    _require_login()
    if not frappe.has_permission("Purchase Invoice", "read"):
        return []
    try:
        return frappe.db.sql(
            """SELECT
                    supplier,
                    COUNT(*) AS open_invoices,
                    SUM(outstanding_amount) AS outstanding,
                    MAX(DATEDIFF(CURDATE(), posting_date)) AS oldest_age_days,
                    MAX(DATEDIFF(CURDATE(), due_date)) AS oldest_overdue_days
                FROM `tabPurchase Invoice`
                WHERE docstatus = 1 AND outstanding_amount > 0
                GROUP BY supplier
                ORDER BY outstanding DESC
                LIMIT %s""",
            [int(limit)], as_dict=True,
        )
    except Exception:
        return []


@frappe.whitelist()
def get_vat_period(period_start=None, period_end=None):
    """VAT input/output for a period. Sums tax-table rows on Sales/Purchase Invoices."""
    _require_login()
    if not frappe.has_permission("Sales Invoice", "read"):
        return {"error": "no permission"}
    today_d = getdate(today())
    if not period_end:
        period_end = today_d
    else:
        period_end = getdate(period_end)
    if not period_start:
        period_start = period_end.replace(day=1)
    else:
        period_start = getdate(period_start)
    out = {"period_start": str(period_start), "period_end": str(period_end)}
    # Output VAT (sales)
    try:
        row = frappe.db.sql(
            """SELECT COALESCE(SUM(stx.tax_amount), 0)
               FROM `tabSales Taxes and Charges` stx
               JOIN `tabSales Invoice` si ON si.name = stx.parent
               WHERE si.docstatus = 1
                 AND si.posting_date BETWEEN %s AND %s""",
            [str(period_start), str(period_end)],
        )
        out["output_vat"] = float(row[0][0] or 0)
    except Exception:
        out["output_vat"] = 0
    # Input VAT (purchases)
    try:
        row = frappe.db.sql(
            """SELECT COALESCE(SUM(ptx.tax_amount), 0)
               FROM `tabPurchase Taxes and Charges` ptx
               JOIN `tabPurchase Invoice` pi ON pi.name = ptx.parent
               WHERE pi.docstatus = 1
                 AND pi.posting_date BETWEEN %s AND %s""",
            [str(period_start), str(period_end)],
        )
        out["input_vat"] = float(row[0][0] or 0)
    except Exception:
        out["input_vat"] = 0
    out["net_vat_payable"] = (out["output_vat"] or 0) - (out["input_vat"] or 0)
    return out


@frappe.whitelist()
def get_payroll_summary(period=None):
    """Most recent Payroll Entry summary with statutory totals."""
    _require_login()
    if not frappe.has_permission("Payroll Entry", "read"):
        return {"error": "no permission"}
    out = {}
    try:
        latest = frappe.get_all(
            "Payroll Entry",
            filters={"docstatus": 1},
            fields=["name", "start_date", "end_date", "posting_date", "status"],
            order_by="posting_date desc",
            limit=1,
        )
        out["latest"] = latest[0] if latest else None
    except Exception:
        out["latest"] = None
    try:
        out["all_count"] = frappe.db.count("Payroll Entry", {"docstatus": 1})
    except Exception:
        out["all_count"] = 0
    try:
        out["pending_count"] = frappe.db.count("Payroll Entry", {"docstatus": 0})
    except Exception:
        out["pending_count"] = 0
    # MTD net pay total
    try:
        today_d = getdate(today())
        mtd_start = today_d.replace(day=1)
        row = frappe.db.sql(
            """SELECT COALESCE(SUM(net_pay), 0)
               FROM `tabSalary Slip`
               WHERE docstatus = 1
                 AND posting_date BETWEEN %s AND %s""",
            [str(mtd_start), str(today_d)],
        )
        out["mtd_net_pay"] = float(row[0][0] or 0)
    except Exception:
        out["mtd_net_pay"] = 0
    return out


@frappe.whitelist()
def get_trial_balance_link():
    """Returns a deep link to ERPNext's standard Trial Balance report."""
    _require_login()
    today_d = getdate(today())
    return {
        "label": "Open Trial Balance in ERPNext",
        "url": "/app/query-report/Trial Balance?company=" + (frappe.defaults.get_user_default("Company") or "")
               + "&from_date=" + str(today_d.replace(day=1))
               + "&to_date=" + str(today_d),
    }


# ── ToDo-backed Pre Audit Actions + Collections ──────────────────────────────
#
# We use the standard ERPNext ToDo doctype for both, with a description prefix
# to distinguish (`[PRE-AUDIT]` and `[COLLECTIONS-FU]`). This means:
#   - both flows show up in users' standard My Tasks queue + Approvals counts
#   - no new doctypes needed, no migrations
#   - assignment / due-date / priority all use Frappe's existing UI
#   - mark-complete = close the ToDo (standard pattern)

_PRE_AUDIT_PREFIX = "[PRE-AUDIT]"
_COLLECTIONS_PREFIX = "[COLLECTIONS-FU]"


@frappe.whitelist()
def get_pre_audit_actions(status=None, limit=100):
    """Return ToDos prefixed [PRE-AUDIT]. Optional status filter (Open/Closed)."""
    _require_login()
    filters = {"description": ["like", _PRE_AUDIT_PREFIX + "%"]}
    if status:
        filters["status"] = status
    try:
        rows = frappe.get_all(
            "ToDo",
            filters=filters,
            fields=["name", "description", "allocated_to", "assigned_by",
                    "date", "priority", "status", "creation"],
            order_by="date asc, creation desc",
            limit=int(limit),
        )
    except Exception as e:
        return {"error": str(e)[:200], "rows": []}
    # Strip the prefix for display
    for r in rows:
        d = (r.get("description") or "").strip()
        if d.startswith(_PRE_AUDIT_PREFIX):
            r["title"] = d[len(_PRE_AUDIT_PREFIX):].strip()
        else:
            r["title"] = d
    return rows


@frappe.whitelist()
def create_pre_audit_action(title, allocated_to=None, due_date=None,
                            priority="Medium", details=None):
    """Create a ToDo prefixed [PRE-AUDIT]. assigned_by = session user."""
    _require_login()
    if not title:
        frappe.throw(_("Title is required"))
    desc = _PRE_AUDIT_PREFIX + " " + title
    if details:
        desc += "\n\n" + details
    doc = frappe.get_doc({
        "doctype": "ToDo",
        "description": desc,
        "allocated_to": allocated_to or frappe.session.user,
        "assigned_by": frappe.session.user,
        "date": due_date or None,
        "priority": priority or "Medium",
        "status": "Open",
    })
    doc.insert(ignore_permissions=False)
    return {"name": doc.name, "url": "/app/todo/" + doc.name}


@frappe.whitelist()
def update_todo_status(name, status):
    """Open ↔ Closed. Used by Pre Audit + Collections pages to mark items done."""
    _require_login()
    if status not in ("Open", "Closed", "Cancelled"):
        frappe.throw(_("Invalid status"))
    doc = frappe.get_doc("ToDo", name)
    doc.status = status
    doc.save()
    return {"name": name, "status": status}


@frappe.whitelist()
def get_collection_followups(customer=None, limit=50):
    """Return ToDos prefixed [COLLECTIONS-FU]. Optional customer filter (matches
    reference_name on the ToDo, since collections ToDos reference Sales Invoice
    or Customer directly)."""
    _require_login()
    filters = {"description": ["like", _COLLECTIONS_PREFIX + "%"], "status": "Open"}
    try:
        rows = frappe.get_all(
            "ToDo",
            filters=filters,
            fields=["name", "description", "allocated_to", "assigned_by",
                    "date", "priority", "status", "creation",
                    "reference_type", "reference_name"],
            order_by="date asc, creation desc",
            limit=int(limit),
        )
    except Exception as e:
        return {"error": str(e)[:200], "rows": []}
    for r in rows:
        d = (r.get("description") or "").strip()
        if d.startswith(_COLLECTIONS_PREFIX):
            r["title"] = d[len(_COLLECTIONS_PREFIX):].strip()
        else:
            r["title"] = d
    if customer:
        rows = [r for r in rows if r.get("reference_name") == customer
                or customer in (r.get("title") or "")]
    return rows


@frappe.whitelist()
def create_collection_followup(customer, action_text, due_date=None,
                               allocated_to=None, priority="Medium",
                               invoice=None):
    """Create a ToDo prefixed [COLLECTIONS-FU] linked to a Customer (or Sales
    Invoice if `invoice` is provided)."""
    _require_login()
    if not customer or not action_text:
        frappe.throw(_("Customer + action are required"))
    desc = _COLLECTIONS_PREFIX + " " + customer + ": " + action_text
    payload = {
        "doctype": "ToDo",
        "description": desc,
        "allocated_to": allocated_to or frappe.session.user,
        "assigned_by": frappe.session.user,
        "date": due_date or None,
        "priority": priority or "Medium",
        "status": "Open",
    }
    if invoice:
        payload["reference_type"] = "Sales Invoice"
        payload["reference_name"] = invoice
    else:
        payload["reference_type"] = "Customer"
        payload["reference_name"] = customer
    doc = frappe.get_doc(payload)
    doc.insert(ignore_permissions=False)
    return {"name": doc.name, "url": "/app/todo/" + doc.name}


# ── Notifications (header bell) ──────────────────────────────────────────────

@frappe.whitelist()
def get_my_notifications(limit=20, unread_only=0):
    """Return Notification Log entries for the session user, newest first."""
    _require_login()
    user = frappe.session.user
    filters = {"for_user": user}
    if int(unread_only or 0):
        filters["read"] = 0
    try:
        rows = frappe.get_all(
            "Notification Log",
            filters=filters,
            fields=["name", "subject", "type", "document_type",
                    "document_name", "read", "creation"],
            order_by="creation desc",
            limit=int(limit),
        )
        unread = frappe.db.count("Notification Log",
                                 {"for_user": user, "read": 0})
        return {"rows": rows, "unread": int(unread)}
    except Exception:
        return {"rows": [], "unread": 0}


@frappe.whitelist()
def mark_notification_read(name=None, all=0):
    """Mark a single Notification Log entry as read, or `all=1` to mark all."""
    _require_login()
    user = frappe.session.user
    if int(all or 0):
        try:
            frappe.db.sql("""UPDATE `tabNotification Log` SET `read` = 1
                             WHERE for_user = %s AND `read` = 0""", [user])
            frappe.db.commit()
            return {"updated": "all"}
        except Exception as e:
            return {"error": str(e)[:200]}
    if not name:
        return {"error": "name or all=1 required"}
    try:
        doc = frappe.get_doc("Notification Log", name)
        if doc.for_user != user:
            return {"error": "not yours"}
        doc.read = 1
        doc.save()
        return {"name": name, "read": 1}
    except Exception as e:
        return {"error": str(e)[:200]}


# ── Automations console ──────────────────────────────────────────────────────

@frappe.whitelist()
def get_automations():
    """Return the registered automations. If a custom 'Automation Run Log'
    doctype exists, augment each entry with its latest run timestamp + status.
    Otherwise, return the hardcoded registry (status fields blank)."""
    _require_login()
    registry = [
        {"key": "qbo_sales_sync",
         "name": "QBO Sales Sync",
         "category": "Finance",
         "schedule": "Nightly 02:00 EAT",
         "source": "cron / TiDB",
         "where": "/opt/vcl/CommandCentre/projects/sales_qbo_tidb_erp/run_nightly.sh",
         "description": "Sales invoices ERPNext → TiDB → QBO. Watches for missing sales_person on customer assignment."},
        {"key": "purchase_qbo_sync",
         "name": "Purchase Invoice Sync",
         "category": "Finance",
         "schedule": "On-demand",
         "source": "cron / TiDB",
         "where": "/opt/vcl/CommandCentre/projects/purchase_erpnext_tidb_qbo/",
         "description": "Purchase invoices ERPNext → TiDB → QBO. Go-live May 2026."},
        {"key": "kra_cuin",
         "name": "KRA CUIN Validation",
         "category": "Compliance",
         "schedule": "On-demand",
         "source": "n8n",
         "where": "n8n workflow kra-cuin-test-001",
         "description": "Validates eTIMS invoice numbers via public iTax checker."},
        {"key": "lpo_intake",
         "name": "VCL LPO Intake Bot",
         "category": "Sales",
         "schedule": "Slack-triggered",
         "source": "n8n + Slack + Claude Vision",
         "where": "n8n vclLpoIntakeBot001 / /opt/vcl/runtime/files/lpo_intake_bot.json",
         "description": "Slack DM photo → Item / CPS / JCL / SO drafts."},
        {"key": "ruling_log",
         "name": "Ruling Log Sync",
         "category": "Production",
         "schedule": "Daily 10:00 EAT",
         "source": "n8n + Zoho REST + Claude Vision + Slack",
         "where": "n8n daily cron",
         "description": "Zoho REST → Claude → CSV → #ruling_department Slack post."},
        {"key": "zoho_mcp",
         "name": "Zoho Mail MCP Server",
         "category": "IT",
         "schedule": "Always-on (SSE on :3030)",
         "source": "Tailscale + custom MCP server",
         "where": "/opt/vcl/zoho-mcp",
         "description": "8 mail tools + folder mgmt + 02:00 cron cleanup."},
        {"key": "vcl_erpnext_bot",
         "name": "VCL ERPNext Telegram Bot",
         "category": "Operations",
         "schedule": "Always-on",
         "source": "n8n + Claude",
         "where": "/opt/vcl/runtime/files/vcl_erpnext_bot.json",
         "description": "Telegram → ERPNext via natural language."},
    ]
    if frappe.db.exists("DocType", "Automation Run Log"):
        try:
            for a in registry:
                last = frappe.get_all(
                    "Automation Run Log",
                    filters={"automation_key": a["key"]},
                    fields=["status", "creation", "duration_seconds", "note"],
                    order_by="creation desc", limit=1,
                )
                if last:
                    a["last_run"] = str(last[0].creation)
                    a["last_status"] = last[0].status
                    a["last_duration"] = last[0].get("duration_seconds")
                    a["last_note"] = last[0].get("note")
        except Exception:
            pass
    return registry


# ── /home stats (lightweight, used by the public home page if we wire it) ────


@frappe.whitelist()
def create_leave_application(leave_type, from_date, to_date, half_day=0,
                             half_day_date=None, description=None):
    """Submit a Leave Application as the session user. Resolves Employee from
    User. Applies basic validation; lets ERPNext validate the rest on insert."""
    _require_login()
    user = frappe.session.user
    employee = _employee_for_session()
    if not employee:
        frappe.throw(_("No Employee record linked to your User account ({0})").format(user))
    if not leave_type:
        frappe.throw(_("Leave type is required"))
    if not from_date or not to_date:
        frappe.throw(_("From date and To date are required"))
    if getdate(to_date) < getdate(from_date):
        frappe.throw(_("To date cannot be before From date"))
    doc = frappe.get_doc({
        "doctype": "Leave Application",
        "employee": employee,
        "leave_type": leave_type,
        "from_date": from_date,
        "to_date": to_date,
        "half_day": int(half_day or 0),
        "half_day_date": half_day_date or None,
        "description": description or "",
        "status": "Open",
    })
    doc.insert(ignore_permissions=False)
    return {"name": doc.name, "status": doc.status,
            "url": "/app/leave-application/" + doc.name}


@frappe.whitelist()
def get_leave_types():
    """List active Leave Types so the Apply form can populate its dropdown."""
    _require_login()
    try:
        return frappe.get_all("Leave Type", fields=["name", "max_days_allowed"],
                              order_by="name", limit=50)
    except Exception:
        return []


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
