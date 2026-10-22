# Deployment, backups, and monitoring

## Suggested hosting

- Next.js website: Vercel, or the `apps/web` Docker image behind any Node host.
- Express API: Render, a VPS, or the `apps/api` Docker image.
- Database: MongoDB Atlas.

Set `API_URL` on the website to the public API origin if the two hosts differ. In that case set `COOKIE_SECURE=true`, `CORS_ORIGINS` to the website origin, and serve both over HTTPS. Same-site cookies are simpler if a reverse proxy serves the website and `/api` on one host. The Next rewrite is the local-development shape of that proxy.

## Production environment

Copy `.env.example`. Replace `SESSION_SECRET` with at least 32 random characters. The API refuses to boot in production with the development secret. Use a least-privilege MongoDB user that can read and write only the TMSAMPARK database.

Create the first administrator on the server:

```bash
npm run create-admin -- --email you@company.com --password "a-long-unique-password1" --name "Operations"
```

Do not commit that password. Do not leave `ADMIN_PASSWORD` in a shell history on a shared machine if you can avoid it.

Run `npm run seed` only for the initial catalogue. Then replace sample fees in the admin service editor and set `feeIsSample` off when the price is a real quote.

## Docker

`docker compose up --build` starts MongoDB, the API, and the website. Point `MONGODB_URI` at `mongodb://mongo:27017/tmsampark` inside Compose. The API stores uploads in the `tmsampark_storage` volume when `STORAGE_PATH=/data/storage`.

## Backups

- Enable Atlas continuous backup or a daily `mongodump` of the application database.
- Keep dumps encrypted and outside the application server.
- If you use local disk storage, back up the storage volume with the database. A database restore without the files makes document records unreadable.
- Restore drill: load a dump into a separate database, point a staging API at it, and open one order, one invoice, and one document download.
- Retention is a business decision. A starting point is 30 daily backups and 12 monthly backups.

## Logging and monitoring

The API logs JSON through pino. Cookies, passwords, and tokens are redacted. Do not add enquiry message bodies or document bytes to logs.

Watch:

- `GET /api/v1/health` for process uptime
- `GET /api/v1/ready` for MongoDB
- 5xx rate and request id `x-request-id`
- disk use on the private storage volume
- failed login spikes (accounts lock for 15 minutes after 8 failures)

Ship logs to the host's log drain. Alert when readiness fails for more than two minutes or when the 5xx rate rises.

## Before launch

- Replace sample fees.
- Put real contact details in settings.
- Have counsel replace the draft policies and tick "legally reviewed" only after that.
- Add testimonials only with permission.
- Configure Razorpay test mode, then live keys, and point the webhook to `https://YOUR_API/api/v1/payments/webhook/razorpay`.
- Confirm SMTP before promising email updates.
