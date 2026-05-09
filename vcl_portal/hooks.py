app_name = "vcl_portal"
app_title = "VCL Portal"
app_publisher = "Vimit Converters Limited"
app_description = "Public website and employee portal for Vimit Converters Limited"
app_email = "tanuj.haria@vimit.com"
app_license = "MIT"

# Website
home_page = "home"

website_route_rules = [
    {"from_route": "/employee/<path:app_path>", "to_route": "employee"},
    {"from_route": "/uat", "to_route": "uat"},
    {"from_route": "/inbox", "to_route": "inbox"},
    {"from_route": "/inbox/<path:app_path>", "to_route": "inbox"},
    # React Portal v2 SPA — every path under /portal-v2/ resolves to the same
    # Jinja shell; React Router (BrowserRouter basename="/portal-v2") owns
    # client-side routing. Bundle is built from frontend/ into
    # vcl_portal/public/portal_v2/ via `npm run build`.
    {"from_route": "/portal-v2", "to_route": "portal_v2"},
    {"from_route": "/portal-v2/<path:app_path>", "to_route": "portal_v2"},
]

# Document Events - VCL Messaging email integration
doc_events = {
    "Communication": {
        "after_insert": "vcl_portal.vcl_messaging.email_api.on_communication_insert",
    }
}
