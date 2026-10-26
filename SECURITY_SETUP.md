# LostLink secure guest reporting

Guest users can submit lost and found reports without accounts. The backend validates report fields, accepts only supported image signatures (JPEG, PNG, GIF, BMP; up to 10 MB and 20 megapixels), applies a per-network limit (12 reports/hour, 20 AI comparisons/hour), rejects identical guest reports from the same network for three minutes, and verifies guest submissions with Cloudflare Turnstile. Contact details stay stored in MongoDB but are omitted from public item responses. Turnstile is bot protection, not contact/identity verification.

## Required configuration

Set these values in the deployment environment; never commit secret values:

- Frontend build: `VITE_API_BASE_URL` points to the Spring Boot API and `VITE_TURNSTILE_SITE_KEY` is the public Turnstile site key.
- Backend: `TURNSTILE_SECRET_KEY` is the private Turnstile secret, `AUTH_TOKEN_SECRET` is a randomly generated secret with at least 32 characters, and `APP_FRONTEND_ORIGIN` is the deployed frontend origin.
- Keep the existing MongoDB and optional `GEMINI_API_KEY` configuration on the backend.
- Claims: guest claim submissions are limited to five per network per hour; backend rate limits are process-local and should be moved to shared storage before multi-instance deployment.
- Email delivery: configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM`, and `SUPPORT_EMAIL` on the backend for contact messages and password resets. Never commit these values. Email-backed features fail closed when delivery is not configured.
- Claim administration: set `LOSTLINK_ADMIN_USER_IDS` to a comma-separated list of trusted registered user IDs. Item owners can manage claims on their authenticated reports; configured administrators can review claims for guest-owned reports.

Add the local development origin to the Turnstile site configuration when testing locally. Rebuild/redeploy the frontend after changing Vite environment values, and restart the backend after changing backend environment values. Guest submissions fail closed when Turnstile is not configured. Use a stable signing secret in deployment; if it is omitted, the backend generates a temporary random secret and all existing login tokens stop working after a restart.

Successful guest reports display a reference and a one-time private tracking key. Save both: the backend stores only a hash of the key, and the status endpoint returns limited status fields after both values are checked. The rate limiter and duplicate cache currently use process memory; use a shared Redis or database-backed limiter before running multiple backend instances. Guest contact details are not verified by email or SMS.

## Verification

- Backend tests: from `lost-link-backend`, run `.\mvnw.cmd test`.
- Frontend build: run `npm run build`.
- Vercel routes: `vercel.json` rewrites SPA paths to `index.html`; deploy the frontend after adding this file and verify direct route loads.
- Password reset/contact: set backend SMTP values above and verify using a test mailbox/account in staging. Reset requests use a generic response for unknown emails; reset tokens are single-use and expire after 30 minutes.
- Claims: add only trusted account IDs to `LOSTLINK_ADMIN_USER_IDS`. Owners can manage claims on authenticated reports. Guest-owned reports require an administrator account for review.
- Test as a guest: submit valid lost and found reports with Turnstile completed; check the reference/key receipt and use both values in “Check a guest report”.
- Test validation/abuse: submit empty or invalid dates/contacts, repeat a report, exceed the per-network limit, and try a non-image or over-10-MB upload.
- Test account reporting: log in, submit a report, and verify the API uses the signed bearer token rather than a browser-supplied user ID.
- Public item responses omit contact and account fields. There are currently no report edit/delete routes; adding those requires explicit owner/admin authorization checks.
- Claims are submitted as proof records and only the authenticated item owner or configured administrator can read or verify them. This app does not send claim OTPs or generate scannable QR codes.
- Notification reads are scoped to the signed-in user; marking a notification read requires that user's bearer token.
- Password-reset links are single-use, expire after 30 minutes, and are stored as hashes. Contact and reset email delivery require SMTP settings above; no email is sent when those settings are missing.
