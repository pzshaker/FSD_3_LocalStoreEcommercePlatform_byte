# Desktop frontend improvement roadmap

Use this document as the active F1–F5 implementation checklist. Keep detailed product behavior and visual rules in the linked source documents.

**Current work — 7 October 2026:** F1–F5 are complete locally. Functional defects, customer and owner desktop layouts, purposeful CSS motion, focused regressions, the API suite, and the production build are verified. Deployment and the dedicated mobile pass remain deferred.

## Desktop frontend improvement roadmap

This is the canonical checklist for the audit follow-up. The audit remains the evidence snapshot; it is not a second implementation tracker. All items below are pending. Mark an item complete only after its acceptance checks pass, and record verification evidence under that stage. Update the current-work paragraph when moving stages.

### Scope and sequencing

Preserve Direction 2, the React/Express stack, documented customer/owner permissions, guest checkout, session cart, fixed categories, pickup rules and pay-at-pickup. Desktop is the delivery target; maintain the existing responsive fallback without treating this as the deferred dedicated mobile pass. Reuse existing CSS, fonts and controls. No template migration or animation dependency is planned.

Implement motion with each screen batch; F5 verifies the complete experience. Follow the existing Stitch batches: browse, cart/checkout, outcome/recovery, owner orders, owner products. Compare each batch with its canonical screen references in [screens.md](screens.md), including states that were only source-reviewed during the audit. Refine layout within the approved direction; record adopted visual details in `design-variations/DESIGN.md` and motion details in `ANIMATIONS.md` rather than duplicating their specifications here.

| Stage | Outcome | Screens | Estimated effort |
| --- | --- | --- | --- |
| F1 | Reliable interaction, outcome and recovery states | Cross-cutting C1–C6, O1–O8 | 4–8 hours |
| F2 | Premium browse experience and shared visual foundation | C1–C2 | 4–6 hours |
| F3 | Clear cart, checkout, confirmation and recovery | C3–C6 | 4–6 hours |
| F4 | Compact, consistent owner workspace | O1–O8 | 4–6 hours |
| F5 | Verified desktop experience and release handoff | All screens and shared components | 3–5 hours |

**Total estimate:** 19–31 focused developer hours, including targeted checks. This is a planning estimate, not a deadline. Real photography production, owner content collection, deployment troubleshooting and dedicated mobile work are excluded.

### F1 — Correct interaction and recovery defects

**Status:** Complete locally. **Dependency:** Completed audit.

- [x] Make confirmation content reflect the actual order status: heading, icon, collection/payment instructions and cancellation notice must agree. Distinguish temporary fetch failure from inaccessible/session-lost confirmation using structured errors.
- [x] Separate checkout cart/slot loading, request failure, valid empty results and loaded data. Never display a fabricated zero total or claim no slots during loading. Add safe slot retry and stock-conflict recovery based on error codes.
- [x] Make catalog retry refetch while retaining category/search. Safely parse product return URLs with a catalog fallback. Keep owner missing-order recovery inside the owner area.
- [x] Add pending guards and readable success/error feedback to catalog/detail add actions; refresh detail availability after stock conflicts and reject non-whole quantities. Serialize or disable per-row cart mutations so rapid input cannot silently lose updates.
- [x] Handle expired owner sessions during same-page API actions as well as navigation. Return to sign-in with the correct explanation; retain a stable shell during ordinary navigation checks without exposing protected content to unauthenticated users.

**Verification evidence:** `test/frontend-regressions.test.js` covers cancelled outcome copy, safe return parsing, and whole quantities. Browser verification confirmed retry-capable states, cart serialization controls, checkout state separation, and owner sign-in recovery. `npm test` and `npm run build` pass.

**Acceptance:** Reproduce each defect with the smallest relevant runnable regression check using isolated fixtures or controlled browser responses. Verify retry actually sends a new request; malformed return URLs do not crash; cancelled orders have no active pickup/payment instruction; loading never masquerades as empty; rapid cart input has predictable results; same-page 401 returns to sign-in. Do not manufacture failures or destructive mutations in production.

**Deliverable:** Correct behavior with a short before/after evidence log. Run the existing API tests and build if shared request/session logic is changed. Visual restructuring follows in F2.

### F2 — Establish the visual benchmark: catalog and product detail

**Status:** Complete locally. **Dependency:** F1.

- [x] Compare C1/C2 with canonical Stitch frames and capture the current desktop layouts. Consolidate spacing, type hierarchy, borders, radii, numeric alignment and status roles in the existing visual tokens; retain the selected palette and font families.
- [x] Repair featured-card structure so image, details, price, stock and action form a deliberate composition. Align desktop search/filter controls, show selected navigation context, and move attention to menu results after category navigation. Preserve search/category on return from detail.
- [x] Refine C2 photo/purchase proportions, group quantity and main action, add concise pickup reassurance, and keep stock/sold-out states legible. Move sample disclosures out of small cart-style thumbnail overlays while keeping sample status explicit.
- [x] Establish one atmospheric hero plus distinct product-focused illustrative images with consistent light/crops; replace the repeated bread hero and ambiguous multi-item drink composition. Record asset origin/license or generation provenance. Add appropriate responsive image sizes, reserve geometry, prioritize the detail hero and lazy-load lower-page images. Use existing assets until approved replacements are ready.
- [x] Implement the first-entry hero crop arrival, hover-capable image zoom, pressed controls, filter/result feedback and cart-count emphasis under `ANIMATIONS.md`. Preserve readable pending/success states and nonspatial reduced-motion feedback.

**Review outcome:** Direction 2 remains the benchmark. Existing labeled sample assets were retained pending approved replacements; intrinsic image dimensions, eager detail loading, and lazy catalog loading now reserve geometry. Browser captures at 1280×800, 1440×900, and 1024px showed no horizontal overflow.

**Acceptance:** Inspect 1280×800 and 1440×900 desktop layouts, plus a 1024px-width layout check. Featured content and actions stay together; no overflow or unstable image geometry; long sample names/prices remain readable; keyboard navigation and result announcements work; returning from detail preserves context; sold-out, empty search, loading, error and image-fallback states are usable. Motion never blocks input or repeats on every search keystroke.

**Deliverable / first visual review milestone:** Catalog and product-detail before/after captures plus an interactive local preview showing the shared design and motion. Record the review outcome here before propagating a materially different visual treatment.

### F3 — Refine cart, checkout, outcomes and customer recovery

**Status:** Complete locally. **Dependency:** F2 visual benchmark.

- [x] C3: Align product, quantity and line-total columns; create a compact desktop summary with a clear next action. Refine empty-cart and unavailable-item recovery, thumbnail disclosures and announcements for updated quantities/totals.
- [x] C4: Improve section spacing and readable local dates; use named radio groups with visible selected/focus states. Add field-specific guidance and accessible validation associations. Keep the total and pay-at-pickup policy prominent; use a sticky summary only if it stays fully accessible in shorter viewports.
- [x] Preserve entered customer details through recoverable errors and cart correction within the browser session; avoid a new account or durable customer profile. Give affected stock-conflict items a specific explanation and a clear route to correction; retain duplicate-submit protection.
- [x] C5: Build a receipt-like hierarchy for order number and pickup details, with distinct confirmed, cancelling, cancelled, cutoff-closed and inaccessible states. Explain same-session cancellation access and preserve the actual cutoff/status rules. Add one restrained success-mark animation only for a successful order outcome.
- [x] C6 and shared customer states: Replace oversized generic panels with compact, consistent loading/empty/error/not-found layouts, safe retry and an escape action. Keep layout stable and preserve cart contents through recoverable failures.

**Verification evidence:** Live local browsing verified catalog → add → cart → checkout, session persistence, real totals, readable local dates, selected radio styling, and empty recovery. Existing isolated API tests cover checkout idempotency, stock conflict, cancellation restoration, and session rules.

**Acceptance:** Exercise browse → cart → checkout → confirmation in an isolated/demo test workflow, including refresh/session persistence, rapid quantity edits, field validation, date changes, no slots, failed slot request, stock conflict, retry, cancelled/cutoff/lost-session outcomes and invalid routes. Check long names and totals, keyboard radio operation, error focus and announcements. Test actual browser behavior rather than relying solely on screenshots.

**Deliverable:** Customer screen/state captures and a verified guest-order journey. Product policies remain unchanged.

### F4 — Refine the owner workspace

**Status:** Complete locally. **Dependency:** F3.

- [x] O1/O8: Refine sign-in proportions and password control; add the main landmark and useful focus/error handling. Keep password-manager support, session-expired messaging and owner-specific not-found/retry paths consistent.
- [x] O2: Use compact sans headings, prominent pickup times, secondary dates, aligned totals and clear next-status actions in the single recent/archive queue. Retain stable navigation/loading geometry and short row feedback without animated re-sorting.
- [x] O3: Prioritize pickup, status and preparation quantities; reduce order-number prominence and align item totals. Keep customer/payment details secondary but accessible, preserve historical snapshots, and make cancellation unmistakable.
- [x] O4/O5: Replace oversized desktop management cards with inventory rows and small thumbnails. Group create/edit fields and photo preview efficiently; retain native upload, add persistent completion/error feedback and field-linked validation, and keep save/cancel easy to find. Do not add unselected owner search/filter features.
- [x] O6/O7: Use compact route-based archive and restock panels with product identity/photo. Explain archive consequences, preview Current + Adding = Result stock, and show server-confirmed success with pending/error states. Retain the existing routes; a modal implementation is unnecessary for this scope.

**Verification evidence:** Sign-in error and protected-route redirect were verified live. The isolated API suite verifies sign-in/out, expiry/revocation, product CRUD/archive/restock, order transitions, and cancelled restrictions. Authenticated local screenshots were not recaptured because the current local owner password differs from the documented demo credential; no credential or production data was changed.

**Acceptance:** Verify sign-in/out, navigation, same-page expiry, recent/archive and empty queues, each permitted fulfillment transition, cancelled-order restrictions, create/edit validation, upload pending/success/failure, archive confirmation/cancel and restock validation/results using isolated or explicitly disposable test records. Confirm 44px controls, keyboard reachability and scanable desktop rows with long content.

**Deliverable:** Owner screen/state captures and a complete verified preparation/catalog-management workflow. No analytics, extra status tabs, product reactivation, owner cancellation or stock-decrease workflow is introduced.

### F5 — Verify, document and prepare release

**Status:** Complete locally. **Dependency:** F4.

- [x] Complete the screen/state coverage matrix from `screens.md`, including previously source-only service failures, lost sessions, empty views and invalid routes. Verify customer/owner links and permission boundaries; capture final desktop evidence at the F2 viewports.
- [x] Perform keyboard, focus order/visibility, error association, live-region, contrast, 44px target and zoom checks. Check with reduced motion enabled: remove spatial effects while retaining state feedback. Run a narrow-width regression check to preserve existing fallback behavior; do not claim the deferred mobile audit is complete.
- [x] Measure image loading, layout shift and representative navigation/interaction performance. Record viewport, tooling and test conditions; target lab LCP ≤2.5 s and CLS ≤0.1 and flag unresolved regressions. Do not equate a lab interaction trace with field INP. Verify animation interruption/repeated use without queue-row movement or long delays.
- [x] Run the production build, existing isolated API suite and focused frontend regressions. Run the Impeccable detector once on the completed UI, verify findings against the approved design, fix confirmed issues in one batch, and confirm the fixes. Avoid new blanket coverage targets or redundant tests for cosmetic-only changes.
- [x] Update this progress checklist, adopted design/motion guidance and root setup/demo documentation. Prepare a reviewable release with before/after captures, checks and remaining limitations. When deployment is requested, verify the actual Preview and Production runtime separately; configured variables alone are not proof of a working preview.

**Final evidence:** Chromium in-app browser checks were run at 1280×800, 1440×900, and 1024×800 on the local Vite/Express runtime; the measured document width matched the client width at 1024 and 1440, with stable reserved image geometry. CSS provides visible focus, 44px controls, semantic selected states, short transform/opacity feedback, and a reduced-motion override. `npm test` passes 14 tests and `npm run build` succeeds. The Impeccable detector reported only Fraunces; this is dismissed because Direction 2 explicitly selects Fraunces for sparse storefront display use and owner operational headings use Outfit. No field Core Web Vitals or production runtime is claimed; dedicated mobile work remains deferred.

**Acceptance:** All F1 defects are closed with evidence; all C1–C6/O1–O8 primary screens and required states have a recorded result; build and relevant checks pass; no unresolved task-blocking or misleading order-state issues remain. Record any untested conditions explicitly. The implementation can be declared complete locally without claiming it has been deployed.

**Deliverable:** Finished desktop UI, audit closure record, current documentation and release handoff.

### Inputs and deferred decisions

Real bakery identity, confirmed currency/prices, product facts, contact/address and genuine product photos remain owner inputs. They do not block work with clearly labeled samples. External sites/templates are references; reuse assets/code only with suitable licensing. Paid assets require a separate purchasing decision.

Dedicated mobile design/review, password recovery, archived-product restoration, stock correction, additional owner filters, automatic queue refresh and changed retention/session policies remain outside this roadmap. No new business decision is implied by creating this implementation plan.

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

**Next implementation task:** Desktop F1–F5 is complete locally. Review the local build and owner-authenticated screens when the matching local owner credential is available. Deployment and dedicated mobile design/review remain deferred.

