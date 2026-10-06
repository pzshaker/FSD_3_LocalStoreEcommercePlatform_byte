# Project instructions

- Reply to the user in English.
- Read `docs/product-requirements.md`, `docs/screens.md`, `docs/technical-architecture.md`, and `docs/implementation-plan.md` before product or implementation changes.
- Treat `docs/product-requirements.md` and `docs/screens.md` as the source of truth for behavior. Treat `docs/technical-architecture.md` as the selected stack direction.
- The user selected Stitch Direction 2: Contemporary Neighborhood Market. Follow `design-variations/DESIGN.md` for visuals and `ANIMATIONS.md` for motion. Do not revive the rejected directions unless asked.
- Do not invent the bakery name, address, currency, prices, product facts, sourcing claims, or business policies. Use clearly labeled sample content until the owner confirms those details.
- Keep customer and owner routes, states, and permissions aligned with the screen specification. Preserve guest checkout, session-scoped cart, fixed categories, daily 8:00–12:00 pickup, and pay-at-pickup.
- Build for the documented React and Express stack. Prefer existing dependencies and CSS transitions for simple motion; do not add an animation library without a concrete need.
- Keep the interface responsive and keyboard-operable, use semantic controls and visible focus, maintain 44px minimum touch targets, and honor reduced-motion preferences.
- Use the Stitch design-taste and UI/UX Pro Max skills for visual/interaction design, Impeccable `animate` for motion work, and frontend-patterns for React implementation when relevant.
- Update the source documents when the user changes a product or design decision; avoid duplicating their full contents in new docs.

## New-session handoff

- Start with `docs/README.md` for the document index, then read the required source documents above. Read `docs/backend-api.md` before API work.
- The canonical five-phase roadmap and progress checklist are in `docs/implementation-plan.md`. Follow its phase order and update completed items and current state as work progresses.
- Phase 1 is complete: foundation, isolated checks, actual Atlas connection, and dummy owner sign-in/sign-out are verified. Dummy owner credentials remain in ignored `.env` and must be replaced before production. Next is Phase 2; consult the roadmap and root README for current progress and setup.
- Desktop is the current delivery priority. Mobile design and dedicated mobile implementation/review are deferred until the user resumes them.
- `docs/screens.md` contains the Stitch project link and canonical screen IDs. Use those references rather than legacy/draft screens. Use `design-variations/DESIGN.md` and `ANIMATIONS.md` for visual and motion guidance.
