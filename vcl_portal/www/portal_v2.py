"""Frappe www handler for the React Portal v2 SPA.

Serves a single Jinja shell that loads the Vite-built bundle from
/assets/vcl_portal/portal_v2/. All sub-paths under /portal-v2/ are routed
to this same page (see website_route_rules in hooks.py); React Router
(BrowserRouter basename="/portal-v2") handles client-side routing.

This is a prototype shell — auth is intentionally not enforced here so
the Landing and Login views can be reached without a Frappe session.
"""

no_cache = 1


def get_context(context):
    context.no_cache = 1
    return context
