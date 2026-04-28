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
]
