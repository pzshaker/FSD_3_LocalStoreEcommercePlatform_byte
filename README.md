# Bakery ordering app

React + Vite frontend, Express API, MongoDB, and a Vercel deployment configuration. Product/design decisions and the canonical roadmap are indexed in [docs/README.md](docs/README.md).

## BYTE internship task

AVIP 2026 Full Stack Development, Task 3 — Local Store E-commerce Platform. The local folder name "Project 2" identifies the second project being worked on, not BYTE's task number. The public repository is [FSD_3_LocalStoreEcommercePlatform_byte](https://github.com/pzshaker/FSD_3_LocalStoreEcommercePlatform_byte).

BYTE requires product listing/detail screens, product and cart APIs, a session-persisted cart, product image/price/description/stock display, validation and cart feedback, plus a README covering available APIs and sample data and a live demo or screenshots. Phases 1–5 are complete for the desktop milestone. The live demo is at [bakery-ordering-app.vercel.app](https://bakery-ordering-app.vercel.app/); production health, sample catalog, guest checkout/cancellation, owner access, and Vercel Blob photo upload were verified. See [available APIs](docs/backend-api.md) and [the implementation roadmap](docs/implementation-plan.md).

## Local setup

Requires Node.js 22.12+ and MongoDB Atlas (or a local MongoDB instance). Atlas must allow your development machine's network access. Phase 2 checkout transactions require a replica set, which Atlas supplies.

1. Run `npm install`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI`, keeping it private. `MONGODB_DB` defaults to `bakery`. Add `BLOB_READ_WRITE_TOKEN` to enable owner photo uploads locally.
3. Run `npm run db:check` to verify the connection.
4. Set `OWNER_EMAIL` and a unique `OWNER_PASSWORD` of at least 12 characters in `.env`. Run `npm run owner:setup`, then remove the password from `.env`. Setup refuses to overwrite an existing owner.
5. Run `npm run dev`. Open http://localhost:5173 or http://localhost:5173/owner/login.

The API runs on port 3001; Vite proxies `/api` to it. If you change the API port, update the Vite proxy too. `APP_ORIGIN` must exactly match the frontend origin; state-changing requests require that Origin header. The owner confirmed the pickup timezone as Africa/Cairo; `BAKERY_TIMEZONE` optionally overrides it. Never prefix secrets with `VITE_`.

`npm run seed:sample` optionally inserts four explicitly labeled sample products into an empty catalog. Sample photos are illustrative generated images, and sample prices are integer minor units with no confirmed currency. The seed never claims these are real products. Checkout uses MongoDB transactions, so the database must run as a replica set.

## Available APIs and sample data

All routes are documented with request shapes and authorization rules in [docs/backend-api.md](docs/backend-api.md). The main groups are:

| API group | Available routes |
| --- | --- |
| Customer catalog and pickup | `GET /api/products`, `GET /api/products/:id`, `GET /api/pickup-slots` |
| Session cart and orders | `GET /api/cart`, `POST/PATCH/DELETE /api/cart/items`, `POST /api/orders`, `GET /api/orders/:number`, `POST /api/orders/:number/cancel` |
| Owner access | `POST/GET/DELETE /api/owner/session` |
| Owner products and orders | `GET/POST /api/owner/products`, `GET/PATCH /api/owner/products/:id`, `POST .../:id/archive`, `POST .../:id/restock`, `POST /api/owner/product-image-upload`, `GET /api/owner/orders`, `GET /api/owner/orders/:id`, `PATCH /api/owner/orders/:id/status` |
| Health | `GET /api/health` |

`npm run seed:sample` creates one clearly labeled product in each fixed category: Bread, Pastries, Cakes, and Drinks. Each has a placeholder description, price of 100 sample minor units (currency unconfirmed), and stock of 10. Sample photos are illustrative generated category images; they are not verified product photography. The seed only runs against an empty catalog.

**Public demo:** [Open the storefront](https://bakery-ordering-app.vercel.app/). Production uses the isolated `bakery_demo` database; Preview has separate environment variables configured. Four clearly labeled sample products are seeded until the bakery confirms real catalog details. Two synthetic cancelled orders remain from live flow verification; one was marked Ready before the guest cancelled it. Stock was restored for both.

### Quick demo walkthrough

1. Browse the four sample products, filter by category, and add an item to the session cart.
2. Continue as a guest, choose an available pickup slot, place the order, and pay at pickup (no online payment).
3. Use the same browser session to open the confirmation and cancel while eligible; stock is restored.
4. Sign in to the owner area to review orders and manage sample products and images.

### Demo owner login

Open [the owner login](https://bakery-ordering-app.vercel.app/owner/login):

- Email: `owner@example.test`
- Password: `IoHwRjpVK3P0pp7jxJPhAHOjqndGPmAa`

These public demo credentials grant full owner access to the demo database. Anyone who can read this public repository can use them, view submitted demo orders, change sample products and order statuses, and upload images. Do not enter real customer or business data.
## Checks

- `npm test`: Node's built-in tests with an isolated ephemeral MongoDB server. The first run downloads a MongoDB binary; no Atlas credentials or live data are used.
- `npm run build`: production React build.
- `npm run db:check`: real database connection check; requires your `.env`.

## Current scope

Phases 1–2 supply models, database connection, private owner provisioning, secure access, session cart, catalog and order APIs, transactional checkout/cancellation, and owner product/order APIs. Sample catalog records remain clearly labeled until the bakery confirms its details.

Owner sessions expire after eight hours and are revocable. Customer cookies are browser-session cookies without a separate ordering-session time limit. Browsers with session restoration can preserve session cookies across restarts. Server customer identity/cart cleanup and confirmation recovery remain product decisions. Sign-in allows five attempts per normalized email in a 15-minute window using shared MongoDB counters; deployment-level abuse protection can complement it. The owner confirmed there is no additional next-day pickup cutoff.

## Vercel

`vercel.json` configures the Vite build, routes `/api/*` to the Express export in `api/index.js`, and routes frontend paths to the SPA. Production is deployed at the link above. `GET /api/health` returns `{ "status": "ok", "database": "connected" }`; `GET /api/products` returns the four sample listings. Production and Preview have separate `MONGODB_URI` values and `MONGODB_DB=bakery_demo`, plus `APP_ORIGIN`, Blob storage, and `BAKERY_TIMEZONE` configured. The demo owner was provisioned privately; there is no public registration endpoint. The live desktop guest checkout/cancellation, owner sign-in/access control, and a public illustrative-image upload were verified. Preview runtime behavior has not been separately smoke-tested.

`npm start` serves the API alone. Use `npm run dev` for the local full app. Product image uploads use authorized Vercel Blob client tokens; production Blob storage is configured and the public illustrative upload was verified.
