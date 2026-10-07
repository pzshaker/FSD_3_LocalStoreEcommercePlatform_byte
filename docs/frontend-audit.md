# Desktop frontend audit — 7 October 2026

Status: audit and proposed improvements only; application code and approved product decisions are unchanged.

## Evidence and scope

Reviewed every C1–C6 and O1–O8 implementation in `src/main.jsx` and `src/styles.css`, product/screen requirements, selected Direction 2, and motion specification. Inspected the live storefront, detail, populated cart, checkout, cancelled confirmation, owner sign-in, queue, order detail, products, create/edit, archive, restock, and owner not-found screens. Customer not-found and remaining failure/empty/expiry variants were source-reviewed; not every state was exercised live. No new order, product, stock change, or archive was submitted. One sample item was added to the session cart to inspect checkout. A final sign-out attempt could not complete because the browser connection became unavailable.

Independent assessments: `/root/design_review` assessed design without detector results; `/root/technical_audit` checked implementation. Parent inspected additional owner/customer screens and external references. Retrieved canonical C1, C4, O4 Stitch metadata; full pixel comparison of all canonical frames remains a follow-up. No browser overlays were injected. Mobile, full keyboard/screen-reader testing, measured Core Web Vitals, and frame-rate measurements are outside this desktop pass.

Skills used: design-taste-frontend, Stitch design-taste, UI/UX Pro Max, Impeccable audit/critique/animate guidance. Project-specific design and motion rules override generic skill defaults.

## Verdict

The warm palette, food photography, clear pickup/payment guidance, native controls and restrained styling are a sound foundation. The app currently feels like a coherent working demo. Its largest quality gaps are broken featured-card composition, misleading transitional states, oversized operational layouts, and weak distinction between order outcomes. Improving those will contribute more to perceived quality than adding decorative motion.

Sample identity and unconfirmed business facts are deliberate constraints, not bugs. Keep those labels while improving their hierarchy. Never substitute invented brand names, ingredients, provenance, prices, currency, or policies.

## Screen-by-screen recommendations

| Screen | Finding | Proposed improvement |
| --- | --- | --- |
| C1 Catalog | Featured card grids the wrapping link beside the action, leaving a lone button in a blank column. Search/filter controls form a long vertical stack. Header categories do not visibly mark selection. | Put photo beside a coherent details/price/stock/action block. Align desktop search and filters into a compact menu toolbar. Move attention to menu results after category navigation; retain query context. |
| C2 Product detail | Hero atmosphere image is reused as bread product photography; purchase area has little visual hierarchy. Add has no pending state; conflict leaves stock stale. | Use a dedicated single-product crop, group quantity and main action, include concise pickup reassurance. Show Adding/Added/error states and refresh availability after conflict. Reject fractional quantity before request. |
| C3 Cart | Wide sparse rows and detached subtotal; small photo overlays consume thumbnail space. Quantity updates permit concurrent requests based on stale values. | Use aligned item/quantity/total columns with a compact desktop summary. Keep thumbnail sample disclosure outside the image. Lock or serialize each row's mutation and announce the updated total. Preserve empty-cart recovery. |
| C4 Checkout | Live initial state shows zero total and no pickup times before requests finish. ISO dates and close-packed section headings weaken clarity. Selected choices rely mainly on radio dots. | Separate loading/empty/error/loaded states. Reserve summary/slot geometry. Use readable dates, fieldsets/legends, selected border and fill, better section spacing, field-linked validation, and a visible stock-conflict recovery link based on error code. Consider sticky summary only at widths/heights where it does not obscure content. |
| C5 Confirmation | A cancelled order still shows a success tick, “Order placed,” “We’ll see you at pickup,” and a due-at-pickup amount. This was observed live. | Make the entire page state-driven: confirmed, cancelled, cutoff closed, unavailable. Give pickup date/time and order number a receipt-like hierarchy; remove collection/payment instructions after cancellation. Explain same-session cancellation access before it is lost. |
| C6 Not found/service error | Generic large panels; catalog retry does not actually refetch. All confirmation errors are presented as session loss. | Use compact branded recovery layouts, a working retry, and a clear escape action. Distinguish permanent access loss from temporary service failure. |
| O1 Sign-in | Simple and usable but broad password toggle competes for input width. No main landmark on login. | Keep a compact form, improve password-control proportions, add a main landmark and useful focus handling, retain password-manager support and explicit errors. |
| O2 Order queue | Pickup time is visually secondary to a long date; large serif title consumes operating space. Whole shell disappears for access checks on route changes. | Smaller sans heading, prominent pickup time, secondary date, aligned numbers/status actions, stable shell and row feedback. Preserve one queue and recent/archive views. No invented analytics/status tabs. |
| O3 Order detail | Huge order identifier and equal panels flatten preparation priorities. | Prioritize pickup time, status and next action. Put item quantities in aligned rows; retain immutable item snapshots and cancellation notice. Use compact secondary customer/payment sections. |
| O4 Product management | Large storefront-style image cards make stock and actions harder to compare. | Prefer desktop inventory rows with thumbnail, product, category, price, stock, status and actions. Preserve existing capabilities; extra search/filter features remain a separate product decision. |
| O5 Create/edit | Long single column, small photo preview, generic top-level errors; upload-complete feedback disappears when progress resets. | Group listing fields separately from photo preview, use desktop width better, show persistent upload success/error and linked inline errors, and keep save/cancel easy to locate. Preserve native file selection. |
| O6 Archive | Oversized full-width confirmation without the product photo specified in C/O screen docs. | Compact centered confirmation with thumbnail/name, consequences and clear Keep/Archive actions. Existing route can remain; a modal is optional and must preserve focus/back behavior. |
| O7 Restock | A full page for one field; resulting quantity only appears after success. | Compact stock adjustment panel showing Current + Adding = Result preview, then server-confirmed stock after save. Keep whole-number validation and pending feedback. |
| O8 Owner recovery | Unknown owner route works, but same-page API 401 errors do not consistently return to sign-in. Missing order detail uses customer NotFound. | Centralize expired-session recovery, make all owner recovery links return to the owner area, keep the shell stable, and provide safe retry. |

## Verified issues to fix before visual polish

Severity: P1 = misleading major outcome; P2 = recoverable functional or usability defect. No P0 established.

| Priority | Evidence | Impact / smallest fix |
| --- | --- | --- |
| P1 | `src/main.jsx:88`, live cancelled confirmation | Contradictory success and payment instructions after cancellation. Render heading, icon and amount wording from status. |
| P2 | `src/main.jsx:43`, fetch effect at 35 | Catalog retry only writes identical query values; effect cannot refetch. Add retry state dependency. |
| P2 | `src/main.jsx:73`, 75, 79; live checkout | Loading, failure and genuinely empty slots share `[]`; null cart renders zero. Represent distinct request states and retry. |
| P2 | `src/main.jsx:50`, `.product-card.featured` in `src/styles.css:2`; live catalog | Featured action detached from product details. Correct DOM/grid relationship. |
| P2 | `src/main.jsx:67`, 70 | Rapid cart clicks send absolute quantities from the same render. Serialize or disable per-item controls during requests. |
| P2 | `src/main.jsx:49`, 55, 61 | Add lacks pending feedback; detail stock remains stale after conflict. Guard pending action and refresh current product availability. |
| P2 | `src/main.jsx:99`, 110, 118, 133; `src/api.js:8` | Same-page session expiry only displays errors. Route unauthorized responses through the owner session boundary. |
| P2 | `src/main.jsx:59` | Malformed user-controlled `from` URL can throw during render. Catch parsing errors and fall back to catalog. Source and URL-constructor check, not live failure injection. |
| P2 | `src/main.jsx:119` | Missing owner order uses customer recovery link. Render OwnerNotFound. |
| P2 | `src/main.jsx:86` | Every confirmation fetch error claims session loss. Branch on structured error/status. |

Forms mostly rely on native validation and a general error notice. Preserve native constraints but add field-specific guidance and accessible associations for server validation. A full WCAG audit remains necessary before claiming conformance. Primary cream-on-terracotta text calculates to approximately 4.68:1; that pairing passes normal text contrast. Semantic controls, focus styles, image-space reservation, self-hosted fonts and reduced-motion handling are positive foundations.

The detector returned one warning: Fraunces at `src/styles.css:2`. Dismiss this as a false positive because the approved visual direction explicitly permits Fraunces. Its use across owner headings is a hierarchy recommendation, not a blanket font ban.

## Proposed premium treatment

Keep Direction 2: warm oat/cream, terracotta actions, cocoa text, natural light, and asymmetrical storefront composition. Reserve expressive display type for the storefront; use the existing Outfit face for operational headings and controls. Standardize spacing, radii, borders, numeric alignment and statuses through the existing CSS tokens.

Photography should do more of the visual work. Keep one atmospheric hero; use distinct close-up product images with matched light, neutral backgrounds, camera angle and crop. The drinks image currently shows multiple vessels and bakery food, making the fixed-unit item ambiguous. Illustrative alternatives must remain labeled. Local sample WebPs total roughly 512 KB (individual files 73–204 KB); prioritize responsive sizes, correct image loading priority and measured behavior over indiscriminate compression. Do not lazy-load the main product image by default; retain lazy loading for lower-page cards. Real product photos remain an owner-provided input.

## Motion plan

| Moment | Proposed behavior | Budget |
| --- | --- | --- |
| First storefront arrival | Settle the image crop inside its stable frame; keep headline/action immediately readable | 350–500 ms, first entry |
| Product interaction | Image scale up to 1.02 only on hover-capable pointers; visible keyboard focus and tactile press feedback | 100–180 ms |
| Add to cart | Immediate pending label, clear success label, brief count emphasis and polite announcement | 100–150 ms feedback; success readable around 1.8 s |
| Filters and choices | Selected fill/border, short result crossfade after data arrives; no repeated card choreography | 140–220 ms |
| Confirmation and owner updates | One success-mark appearance; short status change feedback without moving queue rows | 180–260 ms |

Use CSS first. Current CSS has a hero animation, hover-image scale and button color transitions; several documented state transitions remain absent. Keep meaningful text/color feedback under reduced motion while removing spatial movement. No autoplay video, parallax, scroll-jacking, confetti, perpetual loops, or animation library needed for this scope.

## External references reviewed

1. [GAIL’s](https://gails.com/) — live visual inspection: confident food imagery, strong product emphasis and compact header. Borrow hierarchy and photographic specificity; its brand, policies, commerce features and copy do not apply here.
2. [Wheat & Yeast Basic](https://www.framer.com/marketplace/templates/wheat-yeast-basic/) and its live preview — useful editorial food composition. The vendor explicitly excludes cart, ordering, inventory and sold-out behavior, so this is visual inspiration rather than an app replacement. Its autoplay hero is outside this project's motion rules.
3. [Webflow bakery examples](https://webflow.com/made-in-webflow/bakery?cloneable=true) — searched template collection for further composition references; individual templates were not audited or imported. Cloneable/free does not automatically mean unrestricted open-source assets.
4. [Radix Primitives](https://www.radix-ui.com/primitives/docs/overview/introduction) — researched open-source accessibility primitives; optional only if a concrete complex overlay needs them. Existing native controls and CSS cover the current proposed work.

## Execution order and effort

The following is the original audit estimate. The actionable F1–F5 checklist, dependencies, acceptance criteria and current progress now live in [implementation-plan.md](implementation-plan.md#desktop-frontend-improvement-roadmap); update that document rather than this audit snapshot.

These are working estimates for one developer, including targeted verification, not measured task durations.

1. Correct outcome/loading/retry/session/cart defects: 4–8 hours.
2. Refine catalog and detail as the visual benchmark, including illustrative image selection: 4–6 hours.
3. Apply the shared treatment to cart, checkout, confirmation and recovery: 4–6 hours.
4. Compact owner queue, inventory, forms and confirmations: 4–6 hours.
5. Add purposeful motion and complete desktop keyboard/reduced-motion/performance checks: 3–5 hours.

Estimated total: 19–31 focused hours; owner content and photography production are separate. Work in the existing screen-batch order after the functional corrections. Update the canonical design/motion/implementation documents only when recommendations become accepted decisions. Do not create a competing roadmap.

## Review baseline

Independent design heuristic baseline: 25/40, subjective and not an automated accessibility score. System status 2; real-world match 3; control/freedom 3; consistency 3; error prevention 2; recognition 3; efficiency 2; minimalism 2; recovery 2; help 3. Strong foundations with focused usability and hierarchy work required. No overall technical conformance score is assigned without measured performance, complete accessibility testing and the deferred mobile pass.

Recommended first deliverable: corrected catalog and product detail at desktop widths, with before/after captures and the specified motion states, followed by the remaining screen batches.
