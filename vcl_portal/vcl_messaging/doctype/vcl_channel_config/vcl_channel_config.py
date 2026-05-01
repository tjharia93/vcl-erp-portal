import frappe
from frappe.model.document import Document
from frappe.utils import get_url


class VCLChannelConfig(Document):
    def before_save(self):
        if self.channel_type == "WhatsApp":
            self.webhook_url = f"{get_url()}/api/method/vcl_portal.vcl_messaging.api.whatsapp_webhook"
