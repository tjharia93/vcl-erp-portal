"""QBO read-side bridge for the React Portal v2.

Architecture (Option 1 of the QBO wiring plan):

    QBO  --(OAuth)-->  CommandCentre nightly cron  --(REST)-->  Frappe
                       /opt/vcl/CommandCentre/projects/         this method
                       sales_qbo_tidb_erp/run_nightly.sh
                                                                       |
                                                                       v
                                                       VCL QBO Snapshot (Single)
                                                                       |
                                                                       v
    React Portal v2  <--(get_qbo_*)--                       this module reads it

The cron continues to own the QBO OAuth handshake (the credentials live in
CommandCentre, not Frappe). At the end of its run it POSTs the latest cash
balance and AR total into the VCL QBO Snapshot Single via the whitelisted
update_qbo_snapshot method below, authenticated with a Frappe API key/secret.

The React app reads via get_qbo_cash_position / get_qbo_ar_total, which
return connected:false (with a "stale" or "not yet synced" note) when the
snapshot is empty or older than `stale_after_hours`.

When sub-day freshness is needed, layer Option 2 (Frappe-native scheduled
poll) on top — the snapshot DocType is shared between both paths.
"""

from datetime import datetime, timedelta

import frappe
from frappe.utils import get_datetime, now_datetime


_SNAPSHOT_DT = "VCL QBO Snapshot"
_DEFAULT_STALE_HOURS = 26


def _require_login():
    if frappe.session.user == "Guest":
        frappe.throw("Login required", frappe.PermissionError)


def _load_snapshot():
    """Return the Single doc; the row is auto-created on first access."""
    return frappe.get_single(_SNAPSHOT_DT)


def _is_stale(as_of, stale_after_hours):
    if not as_of:
        return True
    threshold = now_datetime() - timedelta(hours=int(stale_after_hours or _DEFAULT_STALE_HOURS))
    return get_datetime(as_of) < threshold


def _format_stale_note(as_of, stale_after_hours):
    if not as_of:
        return "QBO snapshot has never been populated; nightly cron has not run yet."
    return (
        f"QBO snapshot last updated {as_of} — exceeds the "
        f"{stale_after_hours or _DEFAULT_STALE_HOURS}h staleness threshold. "
        "Check the CommandCentre nightly cron."
    )


@frappe.whitelist()
def get_qbo_cash_position():
    """Return the QBO cash position for the Cash Position card.

    Shape: { connected, value, as_of, note, realm_id, company }
    """
    _require_login()
    snap = _load_snapshot()
    stale = _is_stale(snap.as_of, snap.stale_after_hours)
    if stale or snap.cash_balance in (None, 0):
        return {
            "connected": False,
            "value": None,
            "as_of": str(snap.as_of) if snap.as_of else None,
            "note": _format_stale_note(snap.as_of, snap.stale_after_hours),
            "realm_id": snap.qbo_realm_id,
            "company": snap.qbo_company_name,
        }
    return {
        "connected": True,
        "value": float(snap.cash_balance or 0),
        "as_of": str(snap.as_of),
        "note": None,
        "realm_id": snap.qbo_realm_id,
        "company": snap.qbo_company_name,
    }


@frappe.whitelist()
def get_qbo_ar_total():
    """Return the QBO AR outstanding total for the AR Ageing card."""
    _require_login()
    snap = _load_snapshot()
    stale = _is_stale(snap.as_of, snap.stale_after_hours)
    if stale or snap.ar_total in (None, 0):
        return {
            "connected": False,
            "total": None,
            "as_of": str(snap.as_of) if snap.as_of else None,
            "note": _format_stale_note(snap.as_of, snap.stale_after_hours),
            "realm_id": snap.qbo_realm_id,
        }
    return {
        "connected": True,
        "total": float(snap.ar_total or 0),
        "as_of": str(snap.as_of),
        "note": None,
        "realm_id": snap.qbo_realm_id,
    }


@frappe.whitelist()
def update_qbo_snapshot(
    cash_balance=None,
    ar_total=None,
    as_of=None,
    qbo_realm_id=None,
    qbo_company_name=None,
    last_sync_status="success",
    last_sync_note=None,
):
    """Cron-facing write endpoint. Overwrites the VCL QBO Snapshot Single.

    Auth: requires either System Manager or Accounts Manager (so the cron
    must hit this with an API key/secret tied to a service user holding one
    of those roles). All body fields are optional; partial updates leave
    other fields untouched.
    """
    _require_login()
    if not (
        "System Manager" in frappe.get_roles()
        or "Accounts Manager" in frappe.get_roles()
    ):
        frappe.throw("Insufficient role to update QBO snapshot", frappe.PermissionError)

    snap = _load_snapshot()
    if cash_balance is not None:
        snap.cash_balance = float(cash_balance)
    if ar_total is not None:
        snap.ar_total = float(ar_total)
    if as_of is not None:
        snap.as_of = as_of
    else:
        snap.as_of = now_datetime()
    if qbo_realm_id is not None:
        snap.qbo_realm_id = qbo_realm_id
    if qbo_company_name is not None:
        snap.qbo_company_name = qbo_company_name
    if last_sync_status:
        snap.last_sync_status = last_sync_status
    if last_sync_note is not None:
        snap.last_sync_note = last_sync_note
    snap.save(ignore_permissions=True)
    frappe.db.commit()
    return {
        "ok": True,
        "as_of": str(snap.as_of),
        "cash_balance": float(snap.cash_balance or 0),
        "ar_total": float(snap.ar_total or 0),
    }
