# Bakery storefront design direction

## Product
An online catalog for a neighborhood bakery. The primary screen helps customers browse breads, pastries, cakes, and drinks, search products, check availability and prices, and add items to a cart. Customers do not sign in. Orders are picked up daily from 8:00 to 12:00 and paid at pickup. Until the owner provides verified catalog data, mark names and prices as sample content; do not invent brand, address, currency, sourcing, or business policies.

## Art direction
Use the selected **Direction 2: Contemporary Neighborhood Market**. Keep it sunny, airy, approachable, and premium, with natural-light bakery photography, warm cream/oat surfaces, crisp modern sans typography, and small market details used sparingly. Keep the page asymmetrical and easy to scan, with an image-led hero and a varied catalog rhythm. Avoid dark luxury styling, dramatic fashion-editorial styling, generic SaaS layouts, excessive badges, and overly rustic props.

## Color roles
- Page background: warm oat `#F5F0E8`.
- Main surface: soft cream `#FFFCF7`.
- Primary text: deep cocoa `#28231F`.
- Secondary text: muted roast `#766C63`.
- The single accent color: baked terracotta `#A85F43`, reserved for primary actions, selected filters, and small emphasis.
- Borders: warm stone `#E5DDD2`.
Keep saturation restrained. Do not use pure black, neon colors, or additional competing accent colors.

## Typography
Use a distinctive modern sans such as Satoshi, Geist, or Outfit for navigation, body copy, labels, and controls. Use a characterful display face such as Fraunces or Instrument Serif sparingly for the main editorial headline. Strong size contrast, short line lengths, and generous line-height should make the catalog easy to scan.

## Catalog layout
- A slim announcement strip communicates the daily 8:00–12:00 pickup window and pay-at-pickup policy.
- Header includes a compact wordmark, category navigation, search, and a cart count.
- Hero is left-weighted and editorial: concise headline and one clear “Explore the menu” action paired with a large, richly art-directed bakery photograph.
- Catalog has a clear heading, four category filters, and product cards with photo, name, short description, price, and availability.
- Use a varied editorial rhythm: one featured product/card can span more space, while the rest form a calm, aligned catalog grid. Do not make the screen feel like a generic dashboard.
- Out-of-stock items remain visible and clearly marked; their add action is disabled. Adding an available item updates the cart count.
- Keep the path from hero to products direct. No account, checkout, delivery, reviews, or unsupported features.

## Interaction and motion
Use the motion rules in [ANIMATIONS.md](../ANIMATIONS.md): one restrained hero arrival, then motion only for useful state changes and feedback. Do not stagger the catalog on every load or filter, and respect reduced-motion preferences. All controls need visible focus states and at least 44px touch targets.

## Responsive behavior
At desktop widths, preserve the asymmetrical hero and generous margins. At tablet widths, tighten the text and image proportions without losing the hierarchy. Below 768px, stack the hero, keep search and cart easy to reach, allow category filters to scroll horizontally, and collapse the product catalog to a single column or compact two-column layout where cards remain readable. Avoid horizontal page overflow.

## Quality bar
The result should feel like a premium independent bakery’s real storefront: modern, memorable, food-forward, and immediately usable. Maintain strong text contrast and make the menu and cart the clearest actions.
