# External integrations

The application runs without these. Nothing is marked delivered unless the provider accepts it.

| Integration | Variables | Behaviour when unset |
| --- | --- | --- |
| MongoDB | `MONGODB_URI` | API readiness fails. Use local Docker or Atlas. |
| Email | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Password resets and status mail are stored as skipped. In development only, a reset token can be returned so you can test without SMTP. |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | Checkout reports `configured: false`. Manual reconciled payments can still be recorded by staff. Webhook signatures fail closed. |
| SMS | `SMS_PROVIDER` (URL), `SMS_API_KEY`, `SMS_SENDER_ID` | SMS is not sent. |
| Object storage | `STORAGE_DRIVER=s3` plus bucket, region, and keys | Local private disk is used. |
| Malware scan | `MALWARE_SCAN_URL`, `MALWARE_SCAN_TOKEN` | Uploads are stored as `not_scanned`. If a scanner is configured and errors, the upload is rejected. |

Razorpay webhook URL: `POST /api/v1/payments/webhook/razorpay`.

The SMS adapter posts JSON `{ to, sender, body }` to `SMS_PROVIDER`. Point it at your provider’s gateway or a small adapter you control. A failed response is `sms_failed`, not success.
