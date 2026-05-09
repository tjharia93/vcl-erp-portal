"""QBO read-side stubs for the React Portal v2.

Today QBO data flows OUT of ERPNext (sales/purchase invoice nightly sync to
QBO via TiDB — see vcl_portal.api.get_automations). There is no live read
endpoint into QBO. These methods return an honest `connected: false`
response so the Management dashboard can render a "QBO sync pending" state
instead of fabricating side-by-side numbers.

When the QBO read bridge is wired (OAuth + cached snapshot), swap the
returns here for real data — the React side already handles the data shape.
"""

import frappe


_QBO_NOT_CONNECTED_NOTE = (
    "QBO live read not yet wired. Sync runs nightly ERPNext → TiDB → QBO; "
    "the inverse direction (QBO → portal) requires QBO OAuth + a snapshot table."
)


def _require_login():
    if frappe.session.user == "Guest":
        frappe.throw("Login required", frappe.PermissionError)


@frappe.whitelist()
def get_qbo_cash_position():
    """Return the QBO cash position for the Cash Position card.

    Shape: { connected: bool, value: float|None, as_of: str|None, note: str }
    """
    _require_login()
    return {
        "connected": False,
        "value": None,
        "as_of": None,
        "note": _QBO_NOT_CONNECTED_NOTE,
    }


@frappe.whitelist()
def get_qbo_ar_total():
    """Return the QBO AR outstanding total for the AR Ageing card."""
    _require_login()
    return {
        "connected": False,
        "total": None,
        "as_of": None,
        "note": _QBO_NOT_CONNECTED_NOTE,
    }
