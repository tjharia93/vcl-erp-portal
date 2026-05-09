"""Frappe www handler for the React Portal v2 SPA.

Serves a single Jinja shell that loads the Vite-built bundle from
/assets/vcl_portal/portal_v2/. All sub-paths under /portal-v2/ are routed
to this same page (see website_route_rules in hooks.py); React Router
(BrowserRouter basename="/portal-v2") handles client-side routing.

Auth model:
- /portal-v2 (Landing) and /portal-v2/login are PUBLIC so the brand pages
  can be reached without a Frappe session.
- /portal-v2/management, /portal-v2/sales-manager, /portal-v2/sales-rep all
  require a logged-in user — guests are redirected to Frappe /login. The
  React app calls vcl_portal.api.* + vcl_portal.qbo_api.* via the session
  cookie; if a user somehow reaches these routes without a session, the
  React fallback banner instructs them to sign in.
"""

import frappe

no_cache = 1

_AUTH_PREFIXES = ("/portal-v2/management", "/portal-v2/sales-manager", "/portal-v2/sales-rep")


def get_context(context):
    context.no_cache = 1
    path = (frappe.local.request.path or "").rstrip("/")
    needs_auth = any(path == p or path.startswith(p + "/") for p in _AUTH_PREFIXES)
    if needs_auth and frappe.session.user == "Guest":
        frappe.local.flags.redirect_location = (
            "/login?redirect-to=" + (frappe.local.request.path or "/portal-v2")
        )
        raise frappe.Redirect
    return context
