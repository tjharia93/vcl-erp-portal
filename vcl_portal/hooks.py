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
]

# Document Events - VCL Messaging email integration
doc_events = {
    "Communication": {
        "after_insert": "vcl_portal.vcl_messaging.email_api.on_communication_insert",
    }
}
