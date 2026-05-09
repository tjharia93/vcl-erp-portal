"""Controller for the VCL QBO Snapshot Single DocType.

The snapshot is a tiny single-row record updated by the existing
ERPNext-TiDB-QBO nightly cron in CommandCentre and read by the Portal v2
React app via vcl_portal.qbo_api.*. Keeping it as a Single keeps the
update path idempotent (overwrite, no deduplication needed).
"""

from frappe.model.document import Document


class VCLQBOSnapshot(Document):
    pass
