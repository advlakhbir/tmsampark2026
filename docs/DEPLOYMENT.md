# Deployment, backups, and monitoring

## Deploy the website to Vercel and the API to Render

The repository is an npm workspaces monorepo. The website is in `frontend` and the API is in `backend`. Deploy the Next.js app from `frontend`. The Render API build must run from the repository root so it can build `packages/shared`.

### 1. Prepare MongoDB Atlas

Create a production database and a database user with access only to that database. Copy the Atlas connection string for `MONGODB_URI`, replacing its username, password, and database name as needed. Configure Atlas Network Access to allow connections from Render. If you cannot use fixed Render egress IPs, Atlas may require an allow-from-anywhere (`0.0.0.0/0`) rule; use a strong database password and least-privilege database user.

### 2. Deploy the API on Render

Create a **Web Service** from the Git repository, using the repository root as its root directory and the **Node** runtime. Set:

| Setting | Value |
| --- | --- |
| Build command | `npm ci --include=dev && npm run build -w @tmsampark/shared && npm run build -w @tmsampark/api` |
| Start command | `npm run start -w @tmsampark/api` |
| Health check path | `/api/v1/health` |

Set these environment variables in Render:

| Variable | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your production Atlas connection string |
| `SESSION_SECRET` | A unique random secret of at least 32 characters |
| `FRONTEND_URL` | Your Vercel production website origin, e.g. `https://www.example.com` |
| `CORS_ORIGINS` | The exact Vercel production origin, e.g. `https://www.example.com` |
| `COOKIE_SECURE` | `true` |

Render supplies `PORT`; do not hard-code it. Add any integration variables (SMTP, Razorpay, SMS, or malware scanning) only when those integrations are configured.

The API writes uploaded customer documents to local storage by default. Render's local filesystem is ephemeral, so configure S3-compatible storage (`STORAGE_DRIVER=s3` and the `S3_*` variables) before accepting uploads, or attach a Render persistent disk and set `STORAGE_PATH` to its mount path. Do not rely on the default local path for production documents.

After deployment, note the Render service URL, such as `https://tmsampark-api.onrender.com`. Check `https://<render-service>.onrender.com/api/v1/health` and `/api/v1/ready`.

### 3. Deploy the website on Vercel

Import the same Git repository as a Vercel project. Set the **Root Directory** to `frontend` and keep the Next.js framework preset. Enable including files outside the root directory if Vercel offers that option, because the app imports the shared workspace package. Use this build command:

```sh
cd .. && npm run build -w @tmsampark/shared && npm run build -w @tmsampark/web
```

Set these Vercel environment variables for Production (and Preview too if you want preview deployments to call the API):

| Variable | Value |
| --- | --- |
| `API_URL` | The Render service origin, e.g. `https://tmsampark-api.onrender.com` (no trailing slash) |
| `NEXT_PUBLIC_SITE_URL` | The canonical website origin, e.g. `https://www.example.com` |

`API_URL` is used by the Next.js rewrite, server-rendered pages, and redirect middleware. Set it before the first production build and redeploy after changing it. The browser calls `/api` on the Vercel domain; Next.js forwards those requests to Render, keeping the session cookies on the website origin.

### 4. Finish production setup

1. Add your custom domain in Vercel and use that exact HTTPS origin for `FRONTEND_URL` and `CORS_ORIGINS` in Render. If you use Vercel preview URLs, add the specific preview origin to `CORS_ORIGINS` when needed; entries are comma-separated and matched exactly.
2. In the Render Shell, run `npm run seed` once if you want the sample catalogue, then create the first administrator with `npm run create-admin -- --email you@company.com --password "a-long-unique-password1" --name "Operations"`. Do not store that password in the repository or service environment.
3. Check `https://<render-service>.onrender.com/api/v1/ready`, sign in through the deployed website, and verify an authenticated action and document upload/download before launch.
4. Configure the optional integrations and production legal/contact content described below.

## Other hosting options

- Next.js website: Vercel, or the `frontend` Docker image behind any Node host.
- Express API: Render, a VPS, or the `backend` Docker image.
- Database: MongoDB Atlas.

For a different split-host setup, serve both hosts over HTTPS, set `COOKIE_SECURE=true`, set `CORS_ORIGINS` to the exact website origin, and point the website's `API_URL` at the public API origin. The Next rewrite proxies browser `/api/*` requests to the API.

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
