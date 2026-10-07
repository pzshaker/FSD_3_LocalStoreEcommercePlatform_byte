# Product requirements

## Product

A complete, public-facing ordering website for an artisan bakery. This is the full intended app, not an MVP or throwaway prototype.

## Customer experience

- Responsive web app for phones and computers.
- Product categories: Bread, Pastries, Cakes, and Drinks.
- Customers browse categories and search product names and descriptions.
- Product cards and details show a photo, name, description, price, and stock status.
- Products are fixed-quantity items; no sizes or configurable variants.
- Guest checkout; no customer account.
- Collect customer name and phone number.
- Pay in person at pickup. No online payment.
- Show confirmation on screen; no SMS or email updates.
- Cart is available only for the current browser session.
- If stock is insufficient at checkout, explain the issue and let the customer update the cart.
- Customer may cancel an order up to six hours before pickup. Cancellation is available only from the confirmation page in the same browser session.

## Pickup and availability

- Pickup is offered every day from 8:00 a.m. to noon.
- Pickup slots are 30 minutes long: 8:00, 8:30, 9:00, and so on through 11:30 a.m.
- Customers may order for today or tomorrow.
- Same-day orders close one hour before the selected pickup slot.
- There is no additional cutoff for next-day orders.
- There is no separate order or item capacity per slot.
- Product stock is the availability limit.
- Bakery-local timezone is Africa/Cairo (confirmed by the owner).

## Owner experience

- One owner account, with email and password. No public staff registration.
- Owner dashboard can create, edit, and archive products.
- Product categories remain fixed.
- Owner uploads product photos.
- Owner can add units to current stock when restocking.
- Owner sees one order queue sorted by pickup time.
- Owner can move orders through New, Ready, and Picked up.
- Customers can cancel eligible orders; cancelled quantities return to stock automatically.
- Keep recent orders visible for 30 days, then archive older orders. Data deletion/retention after archiving has not been decided.

## Visual and deployment direction

- Selected visual style: Stitch Direction 2, Contemporary Neighborhood Market; see [DESIGN.md](../design-variations/DESIGN.md).
- Public demo deployment on a free Vercel subdomain.
- Hosting budget target is free tier.
