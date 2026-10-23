# TMSAMPARK

TMSAMPARK is a private legal and business-compliance services platform. The public site explains services, the API stores enquiries and applications in MongoDB, staff work in `/admin`, and customers see only their own orders, documents, and tickets.

This is not a government website. Sample professional fees are labelled and are not included in search schema until an administrator turns the sample flag off.

## Applications

- `frontend` — Next.js App Router site, admin workspace, and customer portal
- `backend` — Express REST API under `/api/v1`
- `packages/shared` — roles, statuses, money helpers, and Zod form schemas

## Local setup

Requirements: Node.js 20 or newer. MongoDB is easiest through Docker.

```bash
docker compose up mongo -d
copy .env.example .env
npm install
npm run seed
npm run create-admin -- --email you@company.com --password "ChangeThisPass1" --name "Your Name"
npm run dev
```

- Site: http://localhost:3000
- API: http://localhost:4000
- API docs: http://localhost:4000/api/docs

The API starts with development defaults if `.env` is missing. Do not use those defaults in production. There is no built-in administrator password.

On Windows PowerShell, create the env file with `Copy-Item .env.example .env`.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | API and website together |
| `npm run build` | Shared package, API, and Next.js production build |
| `npm test` | API workflow tests and website SEO unit test |
| `npm run lint` | Typecheck the API and lint the website |
| `npm run seed` | Insert sample categories, services, guides, and FAQs if missing |
| `npm run create-admin` | Create the first staff user |

Re-running the seed does not overwrite services you have edited.

## Decisions

- Passwords use bcrypt via `bcryptjs` so Windows installs do not need a native compiler.
- Sessions are random tokens in an HTTP-only cookie. The browser also sends `X-CSRF-Token`.
- The website proxies `/api` to the API, so the cookie stays on one origin in local development.
- Razorpay, SMTP, SMS, S3, and malware scanning stay off until their environment variables are set. The API does not report those sends as successful when they are not configured.
- Payment success in the browser is accepted only after the server checks the Razorpay signature. Webhooks are signature-checked and idempotent.
- Card numbers and CVV are never stored.
- Customer documents stay outside the public web folder. Downloads check the signed-in customer or a staff permission and write an audit log.
- Testimonials can be published only when a staff member confirms they are authorised. The seed does not invent any.
- Verified homepage metrics appear only when each metric has a source note.
- Policy pages stay `noindex` until settings mark them legally reviewed.
- Sample fees are omitted from Service structured data.

## Tests

The API suite covers registration, permissions, published versus draft services, enquiry validation and the honeypot, lead assignment, order creation, customer isolation, document download denial, payment signature checks, webhook idempotency, and blog publishing. That suite is the end-to-end workflow:

1. A visitor submits a service enquiry.
2. The lead is visible to an administrator.
3. The lead is assigned to a staff member.
4. An order is created for the customer.
5. The customer opens the application.
6. The customer uploads a requested document.
7. Staff update the status.
8. The customer sees the new status.

`npm test` uses MongoDB at `TEST_MONGODB_URI` when that variable is set. Otherwise the API suite starts an in-memory MongoDB server, which downloads a database binary on first run. A local server is enough:

```powershell
$env:TEST_MONGODB_URI = "mongodb://127.0.0.1:27017/tmsampark-test"
npm test
```

## Further reading

- [Architecture](docs/ARCHITECTURE.md)
- [Deployment, backups, and monitoring](docs/DEPLOYMENT.md)
- [Technical SEO checklist](docs/SEO-CHECKLIST.md)
- [Keyword map](docs/KEYWORD-MAPPING.md)
- [Integrations still external](docs/INTEGRATIONS.md)
