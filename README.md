# Bakery ordering app

React + Vite frontend, Express API, MongoDB, and a Vercel deployment configuration. Product/design decisions and the canonical roadmap are indexed in [docs/README.md](docs/README.md).

## BYTE internship task

AVIP 2026 Full Stack Development, Task 3 — Local Store E-commerce Platform. The local folder name "Project 2" identifies the second project being worked on, not BYTE's task number. The public repository is [FSD_3_LocalStoreEcommercePlatform_byte](https://github.com/pzshaker/FSD_3_LocalStoreEcommercePlatform_byte).

BYTE requires product listing/detail screens, product and cart APIs, a session-persisted cart, product image/price/description/stock display, validation and cart feedback, plus a README covering available APIs and sample data and a live demo or screenshots. Phase 1 is complete; these task features and submission evidence remain later roadmap work. See [the implemented API list](docs/backend-api.md#phase-1-implemented-endpoints) and [the implementation roadmap](docs/implementation-plan.md).

## Local setup

Requires Node.js 22.12+ and MongoDB Atlas (or a local MongoDB instance). Atlas must allow your development machine's network access. Phase 2 checkout transactions require a replica set, which Atlas supplies.

1. Run `npm install`.
2. Copy `.env.example` to `.env`. Set `MONGODB_URI`, keeping it private. `MONGODB_DB` defaults to `bakery`.
3. Run `npm run db:check` to verify the connection.
4. Set `OWNER_EMAIL` and a unique `OWNER_PASSWORD` of at least 12 characters in `.env`. Run `npm run owner:setup`, then remove the password from `.env`. Setup refuses to overwrite an existing owner.
5. Run `npm run dev`. Open http://localhost:5173 or http://localhost:5173/owner/login.

The API runs on port 3001; Vite proxies `/api` to it. If you change the API port, update the Vite proxy too. `APP_ORIGIN` must exactly match the frontend origin; state-changing requests require that Origin header. Never prefix secrets with `VITE_`.

`npm run seed:sample` optionally inserts four explicitly labeled sample products into an empty catalog. Sample prices are integer minor units with no confirmed currency. The seed never claims these are real products.

## Checks

- `npm test`: Node's built-in tests with an isolated ephemeral MongoDB server. The first run downloads a MongoDB binary; no Atlas credentials or live data are used.
- `npm run build`: production React build.
- `npm run db:check`: real database connection check; requires your `.env`.

## Current scope

Phase 1 supplies models, database connection, private owner provisioning, secure access, customer session initialization, page shells, and routing. Product/order screens remain clearly labeled placeholders. Ordering and catalog-management endpoints are Phase 2 work.

Owner sessions expire after eight hours and are revocable. Customer cookies are browser-session cookies without a separate ordering-session time limit. Browsers with session restoration can preserve session cookies across restarts. Server customer identity/cart cleanup and confirmation recovery remain product decisions. Sign-in allows five attempts per normalized email in a 15-minute window using shared MongoDB counters; deployment-level abuse protection can complement it.

## Vercel

Import this repository as a Vite project. `vercel.json` routes `/api/*` to the Express export in `api/index.js` and frontend routes to the SPA. Configure private `MONGODB_URI`, `MONGODB_DB`, `APP_ORIGIN` (the exact HTTPS deployment origin), and `NODE_ENV=production`. Provision the owner through the private CLI, never a public registration endpoint. No deployment has been performed; deployed routing and cookies must be verified before launch.

`npm start` serves the API alone. Use `npm run dev` for the local full app. Product image storage and Blob credentials will be introduced with authorized uploads in Phase 2.
