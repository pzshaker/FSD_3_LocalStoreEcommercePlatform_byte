# Project roadmap — five phases

Build the complete bakery ordering app in five phases, backend first. Group related API, screen, state, and motion work together so each phase produces a working result. Use this document as the implementation checklist; keep detailed behavior in the linked source documents.

**Current state:** Phases 1–4 are implemented and reviewed; Phase 5 deployment is in progress. Phase 2 delivers catalog, session cart, pickup availability, transactional and idempotent checkout/cancellation, owner product/order APIs, and authorized Vercel Blob upload tokens. Phase 3 delivers the customer catalog-to-cancellation journey with error recovery and accessible desktop UI. Phase 4 delivers protected owner access, order fulfillment, product editing/archive/restock, and upload UI with configuration-error recovery. All 11 isolated API/security/transaction checks and the production build pass. Browser checks covered customer checkout/cancellation and owner catalog/order flows on an isolated replica set. A successful photo upload and public production flows still require production Blob, database, origin, owner, and deployment configuration. Vercel project `bakery-ordering-app` is now linked; no deployment has run. Preview settings were pulled, but the local Vercel CLI build fails in this Windows runner with `spawn cmd.exe ENOENT`; `npm run build` passes. Cloud deployment is unverified. Atlas connectivity and local owner provisioning were verified during Phase 1. Dummy owner credentials remain in ignored `.env` and must be replaced before production. Desktop is the current priority; mobile design/review remains deferred.

## Phase 1 — Foundation and secure access

- [x] Set up React and Express in one repository with local development commands and Vercel-compatible routing.
- [x] Connect MongoDB, configure environment variables, and define products, carts, orders, and owner/session models with fixed categories and integer money values. Actual Atlas connectivity verified with `npm run db:check`; credentials remain in ignored `.env`.
- [x] Implement private owner setup, password hashing, sign-in/sign-out, expiring secure cookies, authorization, and sign-in rate limiting.
- [x] Establish shared validation and API errors, customer browser-session identity, and clearly labeled sample data.
- [x] Set up the selected visual tokens, customer/owner page shells, routing, and reusable basic controls.

**Done when:** the app runs locally, the database connects, and owner access works with protected routes. Shared styling and page navigation are ready for screen implementation.

## Phase 2 — Complete product and order APIs

- [x] Implement catalog listing/detail, category/search filters, browser-session cart operations, and available pickup slots.
- [x] Implement guest checkout with server validation, immutable order snapshots, atomic stock decrement, and idempotency for safe retries.
- [x] Implement session-authorized confirmation access and cancellation with the six-hour cutoff and stock restoration exactly once.
- [x] Implement owner product create/edit/archive, authorized photo uploads, and restock; preserve references from existing orders.
- [x] Implement owner order queue/detail, New → Ready → Picked up transitions, and recent/archived views after 30 days. Complete the API draft with the read endpoints needed by these screens.

**Done when:** sample products can be managed, an order can be placed and fulfilled, and eligible cancellation restores stock. Targeted checks cover concurrent checkout, duplicate submission, cancellation retries, authorization, and pickup cutoffs. **Verified:** all above flows have isolated replica-set API coverage, including a two-customer last-unit race, owner authorization/status transitions, same-session confirmation, duplicate checkout/cancellation, and stock restoration.

**Resolve before locking ordering behavior:** confirm bakery timezone and the next-day cutoff. Keep unconfirmed brand/catalog details as placeholders. Do not invent an extra next-day cutoff. Archive older orders without deleting them while retention remains undecided.

## Phase 3 — Complete customer experience

- [x] Build catalog and product detail with real APIs: category/search behavior, stock display, quantities, and add-to-cart feedback.
- [x] Build cart and guest checkout with pickup selection, server totals, stock-conflict recovery, and duplicate-submit protection.
- [x] Build confirmation and cancellation, including eligibility, completed cancellation, cutoff, and lost-session states.
- [x] Finish all customer loading, empty, validation, not-found, and service-error states.
- [x] Apply the customer motion guidance, keyboard interaction, visible focus, and reduced-motion support during screen implementation.

**Screens:** C1–C6; Stitch design patches 1–3.

**Done when:** a customer can browse → add items → check out → view confirmation → cancel an eligible order using the desktop interface, with safe recovery from failures. **Verified:** customer checkout, cancellation and stock restoration, retry/conflict handling, sample image fallbacks, category/search empty states, session cart persistence, and confirmation loss behavior were reviewed; 11 API checks and the production build pass. Browser checks exercised the full customer path and owner integration in the shared app.

## Phase 4 — Complete owner experience

- [x] Build sign-in/sign-out, protected navigation, and expired-session recovery.
- [x] Build the pickup-time order queue, empty and archived views, order details, and status actions.
- [x] Build product management and create/edit forms with photo upload progress and validation.
- [x] Build archive confirmation and restock with accurate resulting stock and clear save/error feedback.
- [x] Complete owner loading, empty, not-found, and failure states; apply restrained motion and accessible controls.

**Screens:** O1–O8; Stitch design patches 4–5.

**Done when:** the owner can manage catalog photos/stock and fulfill a customer order entirely through the interface. Cancelled orders cannot advance, and product edits leave historical order details intact. **Verified:** protected owner navigation/session expiry, create/edit/archive/restock, order queue/detail/status actions, sample snapshot preservation, empty/archived states, and cross-surface order integration were browser checked. All interactive targets meet 44px and desktop pages have no horizontal overflow. Photo input validation and missing-Blob recovery were verified; a successful upload awaits production storage configuration.

## Phase 5 — Connect, polish, and launch

- [ ] Check the complete customer/owner journey together, including stock conflicts, retries, session expiry, archived products, and cutoff boundaries.
- [ ] Compare desktop screens with canonical Stitch designs; finish missing states, motion, keyboard access, image loading, and performance issues.
- [ ] Replace sample data with confirmed brand, currency, product information, photos, and contact details where supplied; confirm live ordering policy settings.
- [ ] Configure production secrets, MongoDB, image storage, and Vercel deployment; verify the deployed ordering and owner flows.
- [ ] Finish setup/API documentation and a short demo walkthrough; record any remaining decisions explicitly.

**Remaining inputs:** configure a production MongoDB replica-set URI and isolated database, Vercel Blob token, exact deployment `APP_ORIGIN`, production owner credentials, and confirm the bakery timezone and next-day cutoff policy. Keep all unconfirmed catalog and identity details labeled as samples.

**Done when:** the complete desktop app works on its public Vercel URL and the important ordering/security checks pass. Mobile remains a separate follow-up after this desktop milestone; the eventual responsive requirement still applies.

## Keep delivery simple

- Work in phase order; finish a usable flow before beginning the next phase.
- Add motion and routine states while building each screen rather than creating separate polish phases.
- Reuse shared controls and existing dependencies. Prefer CSS for the specified motion.
- Implement the agreed features. Unselected password recovery, product reactivation, stock decrease, extra owner filters, and automatic queue refresh require later decisions.
- Update this checklist and the API draft as implementation settles; avoid maintaining a second roadmap.

## Source documents

| Document | Use it for |
| --- | --- |
| [Product requirements](product-requirements.md) and [screens](screens.md) | Behavior, routes, states, and canonical Stitch screen references. |
| [Technical architecture](technical-architecture.md) and [API draft](backend-api.md) | Stack, persistence, security, stock consistency, and endpoints. |
| [Selected direction](../design-variations/DESIGN.md) and [motion guide](../ANIMATIONS.md) | Visual styling and interaction motion. |
| [Project instructions](../AGENTS.md) | Rules for future implementation work. |

**Next implementation task:** Phase 5 — deployment preparation and desktop production verification. Setup commands are in the root `README.md`. Replace the dummy owner login and configure production storage before launch.

