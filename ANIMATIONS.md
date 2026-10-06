# Motion and interaction spec

Status: selected design direction is **Direction 2 — Contemporary Neighborhood Market**. This document defines intended motion for the React storefront and owner screens; it does not imply that motion has already been implemented in the Stitch mockup.

## Motion intent

Motion should make feedback, state changes, and navigation easier to understand. Keep the bakery mood warm and tactile, with one authored first-visit moment on the storefront. Most interactions should respond quickly and quietly. Content and controls must remain usable when animation is unavailable or reduced.

## Timing and easing

| Motion | Duration | Guidance |
| --- | ---: | --- |
| Press and confirmation feedback | 100–150 ms | Immediate, small, and repeatable. |
| Filters, focus, and routine state changes | 140–220 ms | Use a short ease-out; do not delay the updated content. |
| Route or overlay transition | 180–260 ms | Only when it clarifies continuity; exit faster than entry. |
| Storefront hero arrival | 350–500 ms | One time on initial page entry; never block interaction. |

For arrivals, use a calm deceleration such as `cubic-bezier(0.16, 1, 0.3, 1)`. Avoid bounce and elastic easing as defaults.

## Storefront component map

| Component | Intended motion | Guardrails |
| --- | --- | --- |
| Pickup announcement | Remains still. | Keep the pickup window and pay-at-pickup message easy to read. No marquee. |
| Header, links, and search | Brief color/underline state on hover, focus, and selection. | Keep header geometry stable. Do not animate search results on every typed character. |
| Hero photo and batch label | On initial entry, gently settle the image crop from `scale(1.02)` to `scale(1)`; reveal its small freshness label just after. | Headline and CTA remain visible immediately. Do not split or animate individual headline characters. Replay only on a true fresh page entry, not after every filter/search update. |
| Category filters | Transition selected chip color/border; briefly crossfade the result region after the filter is applied. | Do not slide every product across the page or re-run a long stagger. Preserve focus and announce the result count to assistive technology. |
| Product cards | On hover-capable devices, scale only the product image slightly (up to `1.02`). Provide a clear pressed state on touch. | Do not rely on hover to reveal essential content. Keep card geometry stable. Respect keyboard focus. |
| Add-to-cart and cart count | Confirm the button action with a short label/icon state; briefly emphasize the updated count. | Keep the confirmation visible long enough to understand. Announce the cart update through a polite live region. No confetti or flying product image. |
| Sold-out product | Remains visibly unavailable and still. | Disabled action must remain legible; do not suggest it can be added through hover or animation. |
| Loading, empty, and error states | Keep layout stable; use a static skeleton for loading and a quick opacity change for state replacement if needed. | No elaborate spinner, shaking error, or looping shimmer. Keep retry and empty-state actions immediately available. |
| Footer and policy details | Remain still. | Do not add scroll-triggered reveals to informational content. |

## Other screens

- **Product detail:** A short opacity transition is enough when opening or returning. Preserve the selected product and catalog context; use shared-image motion only if it remains smooth and does not delay navigation.
- **Cart:** Update quantity, line totals, and subtotal promptly. Avoid animating row height or moving neighboring rows for routine quantity changes. Removing an item may fade the row before it leaves, unless reduced motion is enabled.
- **Checkout:** Show pickup-slot selection through an immediate selected/focus state. Keep validation beside the relevant field; do not shake invalid fields. Submission feedback must distinguish pending, success, and error without blocking recovery.
- **Confirmation:** A restrained success mark may appear once. Keep order number, pickup details, and cancellation availability readable without motion.
- **Owner screens:** Use short feedback for order status and restock/save results. Do not animate the order queue re-sorting in a way that makes a row hard to follow.

## Accessibility and performance

- Honor `prefers-reduced-motion: reduce`: remove the hero scale/reveal and other nonessential spatial movement; keep content visible and preserve clear color, text, and status feedback.
- Every action must work by keyboard and touch. Do not make hover the only way to expose an action; keep visible focus styles.
- Prefer `transform` and `opacity`. Avoid animating layout properties such as `width`, `height`, `top`, `left`, and margins for routine transitions.
- Reserve image/card space before images load to avoid layout shifts.
- Use CSS transitions for these simple effects. Do not add an animation package unless a later, specific interaction needs capabilities CSS cannot express cleanly.
- No autoplay, parallax, scroll-jacking, perpetual decorative loops, or repeated section/card entrance choreography.

## Review checklist

- Does the movement explain an action, result, or relationship?
- Is the final state clear with motion disabled?
- Does repeated use stay quick, including search and category changes?
- Do keyboard and touch users get equivalent feedback?
- Does the reduced-motion setting remove nonessential movement?
- Does the animation remain smooth without moving surrounding layout?
