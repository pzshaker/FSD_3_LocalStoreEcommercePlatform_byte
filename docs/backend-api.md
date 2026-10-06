# Backend API draft

Route names and request/response shapes below are proposed for planning. They are not yet a locked contract. All routes use JSON unless they upload an image.

## Phase 1 implemented endpoints

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/health | Database readiness; 503 when unavailable. |
| GET | /api/customer/session | Initialize/reuse a customer browser-session cookie. |
| POST | /api/owner/session | Validate credentials and issue an eight-hour owner session. |
| GET | /api/owner/session | Read the authenticated owner identity; 401 without a valid session. |
| DELETE | /api/owner/session | Revoke the authenticated session and clear its cookie. |

Other endpoints below remain Phase 2 proposals. Errors use `{ "error": { "code": "STABLE_CODE", "message": "Readable message" } }`. All state-changing API calls require an Origin header matching `APP_ORIGIN`. Session credentials are random opaque tokens; only hashes are stored. Sign-in is limited to five attempts per normalized email in 15 minutes with MongoDB counters. Owner provisioning is a private CLI command, not an API. Customer cookies have no Expires/Max-Age; server-side customer record cleanup remains undecided. The Vercel deployment configuration is prepared but has not been verified on a deployment.

## Customer routes

| Method | Route | Purpose |
| --- | --- | --- |
| GET | /api/products | List active products; optional category and search filters. |
| GET | /api/products/:productId | Get one active product. |
| GET | /api/cart | Read the current browser-session cart. |
| POST | /api/cart/items | Add a product and quantity to the cart. |
| PATCH | /api/cart/items/:productId | Set the cart quantity for a product. |
| DELETE | /api/cart/items/:productId | Remove a product from the cart. |
| POST | /api/orders | Validate pickup, customer details, and stock; create an order. |
| POST | /api/orders/:orderId/cancel | Cancel an eligible order from its browser session. |

The order confirmation response should include the order number, pickup time, item/price summary, total due at pickup, and cancellation cutoff.

## Owner routes

| Method | Route | Purpose |
| --- | --- | --- |
| POST | /api/owner/session | Sign in with the configured owner email and password. |
| DELETE | /api/owner/session | Sign out and revoke the owner session. |
| GET | /api/owner/orders | List the single pickup-time-sorted queue. |
| PATCH | /api/owner/orders/:orderId/status | Advance an order to Ready or Picked up. |
| POST | /api/owner/products | Create a product. |
| PATCH | /api/owner/products/:productId | Edit product fields. |
| POST | /api/owner/products/:productId/archive | Archive a product without removing order history. |
| POST | /api/owner/products/:productId/restock | Add a positive quantity to current stock. |
| POST | /api/owner/product-image-upload | Authorize a product image upload to Vercel Blob. |

Every owner route requires a valid owner session. There is no public owner registration route.

## Validation and errors

Validate all input on the server, including required customer fields, allowed categories, positive integer quantities, nonnegative stock, valid prices, product existence, and pickup time.

Use consistent JSON errors with a stable code and readable message. Return appropriate HTTP status codes for invalid input, unauthenticated owner requests, missing records, unavailable stock, and requests that conflict with the current order state.

## Business rules

- Customer orders contain name, phone, cart contents, and a valid pickup slot.
- Accept today and tomorrow only.
- Pickup every day 8:00 a.m.–noon in 30-minute slots; no per-slot capacity limit.
- Same-day checkout closes one hour before pickup.
- Reject checkout when any line exceeds current available stock.
- Decrement stock at successful checkout; restore stock once for eligible cancellation.
- Cancellation cutoff is six hours before pickup.
- Order statuses: New, Ready, Picked up, and Cancelled.
- Archive orders from the active dashboard after 30 days; archival retention is still undecided.
- Pay at pickup; the API records the amount due and does not process payment.

## Security and reliability

- Hash owner passwords with a modern password-hashing algorithm.
- Use secure, HTTP-only, same-site cookies for browser-session and owner-session credentials.
- Rate-limit owner sign-in and validate all uploaded image types and sizes.
- Keep secrets in environment variables, never in source control.
- Make checkout and cancellation atomic to prevent overselling or duplicate stock restoration.

