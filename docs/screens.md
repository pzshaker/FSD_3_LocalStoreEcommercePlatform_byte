# Screen specification

This document defines the complete planned screen set for the customer storefront and owner dashboard. It records agreed behavior and labels proposed UI details that still need review. The selected visual direction is documented in `design-variations/DESIGN.md`.

## Stitch design batches

Design and review these batches in order. Each batch is a reviewable group of related screens; finish it before moving to the next. The current pass is desktop-first. Create the mobile-responsive pass after the desktop screens are reviewed.

| Batch | Flow | Screens | Stitch design coverage |
| --- | --- | --- | --- |
| Patch 1 | Customer browse | C1 Product catalog, C2 Product detail | Generated desktop screens; C1 canonical cleanup and C2 detail. |
| Patch 2 | Customer cart and checkout | C3 Cart, C4 Guest checkout | Generated desktop screens; cart includes populated and empty states; checkout starts with unselected date/slot choices. |
| Patch 3 | Customer outcome and recovery | C5 Order confirmation, C6 Not found and service error | Generated desktop confirmation, 404, and recoverable service-error screens. |
| Patch 4 | Owner order workflow | O1 Owner sign-in, O2 Order queue, O3 Order detail, O8 Owner not-found and session-expired states | Generated desktop screens; queue includes populated and empty states; session expiry returns to sign-in with a notice. |
| Patch 5 | Owner product and stock workflow | O4 Product management, O5 Create/edit product, O6 Archive confirmation, O7 Restock | Generated desktop screens; O5 has separate create/edit states. |

Each route has a primary screen design. Separate frames are used for states that materially change the layout or available action; field-level validation and transient loading feedback follow the shared patterns in `ANIMATIONS.md` and this specification. Mobile-responsive designs remain a later pass.

### Stitch screen references

Project: [Lune Bakery — Direction 2](https://stitch.withgoogle.com/projects/15872982554875679932). Screen IDs below identify the canonical designs in the project.

| Patch | Canonical screen IDs |
| --- | --- |
| 1 — Customer browse | C1 catalog cleanup `5589179ef6ca4e8b8a4d4ab0381a13b6`; C2 product detail `0970a442284f4270a6b2c0c56b810180` |
| 2 — Cart and checkout | C3 cart `0c381719b3304d6c9083761d66ca8dcc`; C4 checkout `dad8d9e0ca0843eb9404bd413a6a224d` |
| 3 — Outcome and recovery | C5 confirmation `b460297318d9496891986afc32f41a45`; C6 not found `8662f3f008894e89ae27cb1c6df05386`; C6 service error `9f83edffb726422c9ada9150f8561390` |
| 4 — Owner orders | O1 sign-in `4a40a002f51f49059da5a2c5001345b5`; O2 queue `5814e7d31e9d4be2989b77d8931e1469`; O2 empty `9823b7e2e39d41749e1e6f42a33c10a8`; O3 detail `cadfb31166ed45339646331dec588bdd`; O8 not found `10d3466212bd470780127dbb4dc19837`; O8 session expired `1d924b21aaf84782853147e7a8656721` |
| 5 — Owner products and stock | O4 products `eb655eb12f8d4c558e99d73867dfe597`; O5 create `33d7541fb55d45da8fa17ea3793741eb`; O5 edit `6d8e4a20826743edb806190e081a941b`; O6 archive `54f48f8da3df4c0ea4a3ab1a5c946878`; O7 restock `a74a349eceef4119813392f5ee274a64` |

Older catalog `145b70502d664b759b36d25e1e90e28b` is a legacy seed screen; use the C1 cleanup ID above. Stitch's connected tools currently provide no per-screen deletion operation, so legacy/draft resources remain in the project. Mobile is intentionally deferred.

Use `design-variations/DESIGN.md` and `ANIMATIONS.md` for the selected Stitch direction and motion. Keep screen behavior grounded in this document and `docs/product-requirements.md`. Use clearly marked placeholders for unconfirmed brand, catalog, price, currency, address, and policy details.

## Product-wide interaction rules

- Responsive layouts must work on phone and desktop.
- Customer screens do not require sign-in.
- Owner routes require the owner session; unauthenticated visitors go to the owner sign-in screen.
- Preserve the customer cart only for the current browser session.
- Show clear loading, empty, success, validation, and service-error states.
- Use keyboard-operable controls, visible focus, semantic headings, and accessible form labels.
- Display prices in the bakery's local currency; currency selection/format is not yet specified.
- Use bakery-local time for pickup dates and times. The owner confirmed Africa/Cairo.
- Visual direction is selected as Stitch Direction 2, Contemporary Neighborhood Market; see [DESIGN.md](../design-variations/DESIGN.md) and [ANIMATIONS.md](../ANIMATIONS.md). Bakery name/logo, confirmed currency, address, contact details, and verified product facts remain undecided.

## Customer navigation

Proposed global header:

- Bakery logo/name links to the product catalog.
- Category navigation: Bread, Pastries, Cakes, Drinks.
- Search products by name and description.
- Cart link with item count.

Proposed footer:

- Pickup hours: daily, 8:00 a.m. to noon.
- Payment note: pay at pickup.
- Address, phone, and social links are not defined yet; omit until provided.

### C1. Product catalog — /

Purpose: browse the bakery's active products.

Content:

- Category controls for Bread, Pastries, Cakes, and Drinks.
- Search field covering product names and descriptions.
- Product cards with photo, name, short description, price, and stock status.
- Add-to-cart action for available products.
- Sold-out products remain visible with a sold-out label and unavailable add action.

Interactions:

- Selecting a category filters the catalog.
- Search and category selection can be combined.
- Selecting a product opens its detail screen.
- Adding an item updates the cart badge and gives immediate feedback.

States:

- Loading catalog.
- Catalog loaded with products.
- No products in the selected category.
- No search matches.
- Catalog request failed with retry action.

### C2. Product detail — /products/:productId

Purpose: show the complete selected product and let the customer choose quantity.

Content:

- Product photo, name, description, price, category, and stock status.
- Quantity selector for fixed units; no size or variant selector.
- Add-to-cart action.

States and behavior:

- Quantity must be a positive whole number.
- Sold-out item has a disabled add action.
- If stock changed since the screen loaded, report the current availability and prevent adding an invalid quantity.
- Provide a path back to the catalog and preserve the current search/category where practical.

### C3. Cart — /cart

Purpose: review and edit the session cart before checkout.

Content:

- Cart item photo, name, unit price, quantity, and line total.
- Quantity controls and remove action.
- Order subtotal/total due at pickup.
- Continue shopping and proceed to checkout actions.
- Empty-cart message and link back to the catalog.

Behavior:

- Cart is scoped to the current browser session.
- Refreshing within the session retains its cart.
- Show validation if an item is no longer available or its stock is below the requested quantity.
- Do not reserve stock merely because an item is in the cart.

### C4. Guest checkout — /checkout

Purpose: collect customer details and pickup choice, then submit the order.

Sections:

1. Customer name and phone number.
2. Pickup date: today or tomorrow.
3. Available 30-minute pickup slot from 8:00 a.m. through 11:30 a.m.
4. Order summary with quantities, prices, and total.
5. Pay-at-pickup notice.
6. Place order action.

Behavior:

- No customer account or email field.
- For same-day pickup, a slot closes one hour before its start time.
- There is no per-slot capacity limit.
- There is no additional cutoff for next-day slots; display the full set of backend-confirmed slots.
- Validate required fields and phone input before submission.
- Recheck all product stock when submitting.
- On stock conflict, keep the customer on checkout, identify affected products, refresh availability, and let them update the cart.
- Prevent accidental duplicate submissions while checkout is processing.

States:

- No available pickup slots for the selected date.
- Invalid or missing customer details.
- Cart became empty or invalid.
- Stock conflict.
- Order submission in progress.
- Server/network error with a safe retry path.

### C5. Order confirmation — /orders/:orderNumber/confirmation

Purpose: confirm the submitted order and present its pickup details.

Content:

- Success heading and order number.
- Customer name and phone.
- Pickup date/time.
- Ordered item summary and total due at pickup.
- Pay-at-pickup reminder.
- Cancellation deadline and cancel action while eligible.
- Link back to the catalog.

Behavior:

- This confirmation page is the only customer order access screen currently planned.
- The customer may cancel only in the same browser session and before the six-hour cutoff.
- After cancellation, show a cancellation confirmation and explain that item stock has been restored.
- After the cutoff, hide/disable cancellation and show that cancellation is closed.
- If the browser session is lost, session-only cancellation is unavailable.

States:

- Order confirmed and cancellable.
- Cancellation request in progress.
- Cancellation succeeded.
- Cancellation cutoff passed.
- Order already cancelled or no longer cancellable.
- Confirmation cannot be loaded for this browser session.

### C6. Not found and service error

Purpose: handle invalid routes and unexpected failures without dead ends.

- Not-found screen links to the catalog.
- Service-error screen explains that the request failed and offers retry.
- Keep cart contents available during recoverable errors.

## Owner navigation

Proposed owner area navigation:

- Orders
- Products
- Sign out

Owner routes are separate from customer navigation. No customer account links or public owner registration are shown.

### O1. Owner sign-in — /owner/login

Purpose: authenticate the single bakery owner.

Content:

- Email and password fields.
- Sign-in action.
- Clear invalid-credentials and server-error feedback.

Behavior:

- No public sign-up.
- Password is masked by default, with an accessible show/hide control.
- Successful sign-in redirects to the order queue.
- Password recovery flow is not defined yet; do not imply one is available until its process is chosen.

States:

- Submitting credentials.
- Invalid credentials.
- Required field or format error.
- Rate-limited sign-in.
- Service unavailable.

### O2. Owner order queue — /owner/orders

Purpose: monitor and fulfill incoming orders.

Content:

- One queue sorted by pickup time.
- Each order row shows order number, customer name, phone, pickup time, item count, total due, and status.
- Status labels: New, Ready, Picked up, Cancelled.
- Orders older than 30 days move out of the recent queue to an archived view.
- No status tabs, slot-capacity controls, or analytics were selected.

Interactions:

- Select an order to open its details.
- Advance an active order from New to Ready, then Ready to Picked up.
- Do not offer an owner cancellation action; customer cancellation is governed by the customer cutoff.

States:

- Loading queue.
- No active orders.
- Queue populated.
- Queue refresh failed.
- Status update pending/succeeded/failed.
- Archived orders view; retention after archiving is undecided.

### O3. Owner order detail — /owner/orders/:orderId

Purpose: give the owner the full information needed to prepare and hand off an order.

Content:

- Order number, status, pickup date/time.
- Customer name and phone.
- Product names, quantities, item prices, and total.
- Payment method note: pay at pickup.
- Status action appropriate to the current state.
- Cancellation marker if customer cancelled.

Behavior:

- Preserve order item/price snapshots, even if a product changes later.
- Status can advance New → Ready → Picked up.
- Cancelled orders cannot be advanced.
- Reflect customer cancellations and restored stock.

### O4. Product management — /owner/products

Purpose: manage the bakery's catalog.

Content:

- Product list with photo, name, category, price, stock count, and active/archived status.
- Create product action.
- Edit and archive actions.
- Restock action that adds a quantity to current stock.
- Fixed categories: Bread, Pastries, Cakes, Drinks.

States:

- Loading products.
- Empty catalog with create-product action.
- Active and archived product rows.
- Search/filter behavior for the owner list is not yet specified.
- Restock pending/succeeded/failed.

### O5. Create/edit product — /owner/products/new and /owner/products/:productId/edit

Purpose: add a product or edit its listing.

Fields:

- Product name.
- Description.
- Fixed category selection.
- Price.
- Product photo upload.
- Initial stock quantity on creation.

Behavior:

- Validate required fields, positive price, nonnegative whole-number stock, supported image type, and upload size.
- Category options cannot be created or renamed by the owner.
- Save/cancel actions.
- Editing does not rewrite details in existing orders.
- Photo upload progress, completion, and error states must be visible.

### O6. Archive product confirmation

Purpose: prevent accidental removal from sale.

Content:

- Product name/photo and a clear statement that archiving hides it from the customer catalog.
- Confirm archive and cancel actions.

Behavior:

- Archived products remain referenced by past orders.
- Archived products cannot be added to carts.
- Re-activation behavior has not been specified; decide whether archived products can be restored.

### O7. Restock dialog or screen

Purpose: increase available stock when new items are prepared.

Content:

- Product name and current stock count.
- Quantity to add.
- Confirm and cancel actions.

Behavior:

- Quantity must be a positive whole number.
- Show the resulting stock after success.
- A stock decrease/correction workflow has not been selected.

### O8. Owner not-found and session-expired states

- Unknown owner routes show a not-found view with a link to Orders.
- Expired sessions return the owner to sign-in with a brief session-expired message.
- Failed API requests show retry where safe.
- Sign-out clears the owner session and returns to sign-in.

## End-to-end screen flows

### Customer order

Catalog → Product detail → Cart → Guest checkout → Order confirmation → optional session-only cancellation.

### Owner fulfillment

Owner sign-in → Order queue → Order detail → Ready → Picked up.

### Owner catalog management

Owner sign-in → Products → Create/edit product → Upload photo → Save.

Owner sign-in → Products → Restock.

Owner sign-in → Products → Archive confirmation → Product archived.

## Decisions still needed

- Bakery brand/name, address, phone, currency, logo, and verified catalog content.
- Bakery timezone confirmed as Africa/Cairo.
- No additional next-day ordering cutoff.
- Define password recovery for the owner.
- Decide whether archived products can be restored.
- Decide owner product-list search/filter behavior.
- Decide whether the owner needs stock decrease/correction controls.
- Decide archived-order retention and whether customers may reopen a confirmation after closing the browser.
- Decide whether the owner queue refreshes automatically or manually.
