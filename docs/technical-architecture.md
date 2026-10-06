# Technical architecture

## Selected stack

- Frontend: React.
- Backend: Node.js with Express, written in JavaScript.
- App hosting: Vercel.
- Database: MongoDB Atlas, connected through the Vercel Marketplace.
- Product image storage: Vercel Blob.
- Deployment target: public Vercel subdomain on the free tier.

Vercel supports Express as a Function. MongoDB Atlas remains a provider-hosted database even when it is provisioned and connected from the Vercel dashboard. Blob stores product image files. See [Express on Vercel](https://vercel.com/docs/frameworks/backend/express) and [Vercel storage](https://vercel.com/docs/storage).

## Proposed application shape

Phase 1 implements this shape with Vite and React Router on the frontend, Express 5 and Mongoose models on the backend, and `api/index.js` as the Vercel Function export. `vite.config.js` proxies local API calls; `vercel.json` separates API and SPA routes. Database connectivity is verified both in isolated tests and against the configured Atlas cluster. Private credentials remain in ignored `.env`. Owner passwords use Node's built-in scrypt, and session token hashes are stored in MongoDB. See the root `README.md` for local setup.

- React serves the storefront and owner dashboard.
- Express serves the JSON API as a Vercel Function.
- MongoDB stores products, browser-session carts, owner credentials/sessions, and orders.
- Vercel Blob stores uploaded product photos; MongoDB stores their URLs.
- Keep secrets and connection strings in deployment environment variables.

## Proposed data collections

These are an initial schema proposal, not a final database contract.

### products

Fields: name, description, category, price in integer cents, image URL, stock quantity, active/archived state, created and updated timestamps.

Allowed categories: Bread, Pastries, Cakes, Drinks.

### carts

Fields: browser session identifier, product IDs and quantities, expiration timestamp.

Use a session-scoped cookie so the cart ends with the browser session. The server-side cart is a proposed fit for the selected backend cart API; this storage detail was not explicitly chosen.

### orders

Fields: order number, customer name, phone, pickup timestamp, status, immutable item snapshots (product name, unit price, quantity), total in cents, cancellation timestamp, archive timestamp, creation timestamp.

Item snapshots preserve the original order details when a product is later changed or archived.

### owners and sessions

Store the owner's email and a strong password hash. Do not store plaintext passwords or expose public registration. Use revocable, expiring owner sessions in secure HTTP-only cookies.

## Important consistency rules

- Checkout must recheck stock against current database values.
- Create the order and decrement all item stock as one transaction. If any item is unavailable, make no stock changes and create no order.
- Use a unique checkout idempotency key so a retried request cannot create a duplicate order.
- Cancellation must check eligibility, mark the order cancelled, and restore its quantities exactly once in one transaction.
- Product archival hides it from the storefront while preserving order references.
- Store prices as integer cents to avoid floating point rounding errors.
- Use bakery-local time for pickup-slot validation and cancellation cutoffs.

## Open technical questions

- Confirm the bakery timezone if it is not Africa/Cairo.
- Decide the cutoff rule for next-day orders; only the same-day one-hour cutoff was chosen.
- Decide how long archived orders and expired cart records are retained.
- Decide whether the owner needs stock correction/decrease controls in addition to adding restock quantities.
- Confirm whether Vercel Blob upload should use a server-authorized upload flow.

