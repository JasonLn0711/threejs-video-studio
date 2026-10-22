# Sources and claim boundaries

Checked 2026-10-22. This is a conceptual explanation, not a scan of a real website.

- https://wordpress.org/documentation/update-php/ — PHP is configured at hosting/server level; prepare backups and check application/theme/plugin compatibility. This older guide contains obsolete version recommendations: those numbers are not used.
- https://wordpress.org/documentation/article/site-health-screen/ — Tools > Site Health > Info exposes server configuration. Info is read-only, not a PHP-upgrade button.
- https://wordpress.org/about/requirements/ — PHP is a WordPress runtime dependency. Recommended PHP branches are compatibility recommendations, not proof of fixes for a specific CVE.
- https://ubuntu.com/security/notices/USN-8948-1 — vendor-specific package revisions establish security fixes; upstream-looking version numbers alone do not establish vulnerability status.

The application layer groups WordPress core, themes and plugins; their server-side PHP code executes through the shared runtime. JavaScript/browser code and databases are outside this short's explanatory scope. WordPress-core UP TO DATE is illustrative and does not certify themes/plugins. PHP stays PATCH STATUS UNKNOWN even after its version is observed. Host/admin confirmation and checking the running web runtime are required actions, not simulated successful security checks. Managed providers may maintain PHP automatically. No claim that every WordPress site is vulnerable or compromised; no claim that patching proves absence of prior compromise.
