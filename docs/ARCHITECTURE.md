# Architecture

TMSAMPARK is an npm workspaces monorepo.

## Request path

The browser talks to Next.js on port 3000. Next rewrites `/api/*` to the Express app. Server-rendered pages call `API_URL` directly. Session cookies are HTTP-only. Mutating authenticated requests must repeat the readable CSRF cookie in `X-CSRF-Token`.

Public form posts are not cookie-authenticated. They are rate limited, validated with Zod, require a consent checkbox, and drop submissions that fill the honeypot.

## Layers

- Routes wire middleware and controllers.
- Controllers validate HTTP input and choose the status code.
- Services hold enquiry, order, payment, storage, and notification rules.
- Mongoose models own indexes and persistence.

## Access control

Staff roles are super admin, operations manager, support agent, and content editor. Permissions live in `@tmsampark/shared`. A customer token never receives a staff permission. Every customer read or download compares `customerId` on the record with the session. A mismatch is a 404.

Integration secrets stay in environment variables. The settings screen reports whether email, Razorpay, SMS, S3, and malware scanning are configured. It does not display secret values.

## Money

Amounts are integer paise. GST is calculated on professional fees and add-ons. Government fees are added outside that tax base and described on the package.

## Documents

`STORAGE_DRIVER=local` writes under `apps/api/storage`, which is gitignored. `STORAGE_DRIVER=s3` uses a private object and can return a short-lived signed URL. File type is checked from the bytes, not only the browser's MIME type.

## Orders and applications

Creating an order also creates an application with the same reference number (`TMS-YEAR-XXXXXX`) and a document checklist copied from the service. Status changes append a timeline entry. Customer-visible notes can trigger an in-app notification and an email only when SMTP accepts the message.
