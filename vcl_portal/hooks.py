app_name = "vcl_portal"
app_title = "VCL Portal"
app_publisher = "Vimit Converters Limited"
app_description = "Public website and employee portal for Vimit Converters Limited"
app_email = "tanuj.haria@vimit.com"
app_license = "MIT"

# Website
website_route_rules = [
    {"from_route": "/employee/<path:app_path>", "to_route": "employee"},
]

# Home page - available at /home-page
# Does not override Frappe default homepage
