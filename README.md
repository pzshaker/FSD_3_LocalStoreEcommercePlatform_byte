# Bakery ordering app

Artisan bakery ordering app built with React, Vite, Express, MongoDB, and Vercel.

- [Live demo](https://bakery-ordering-app.vercel.app/)
- [Product documentation](docs/README.md)
- [API reference](docs/backend-api.md)
- [Implementation roadmap](docs/implementation-plan.md)

## Features

- Product browsing, search, stock status, and session cart
- Guest checkout with daily 8:00 a.m.–12:00 p.m. pickup
- Pay at pickup and session-only eligible cancellation
- Owner order, product, stock, archive, and image management
- Clearly labeled sample content until real bakery details are confirmed

## Local setup

Requires Node.js 22.12+ and MongoDB running as a replica set.

1. Run `npm install`.
2. Copy `.env.example` to `.env` and set `MONGODB_URI`.
3. Run `npm run db:check`.
4. Set `OWNER_EMAIL` and `OWNER_PASSWORD`, run `npm run owner:setup`, then remove the password from `.env`.
5. Optionally run `npm run seed:sample` for four labeled sample products.
6. Run `npm run dev`, then open [localhost:5173](http://localhost:5173).

Add `BLOB_READ_WRITE_TOKEN` to enable local product-image uploads. Never expose secrets through `VITE_` variables.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run the frontend and API locally |
| `npm test` | Run isolated tests |
| `npm run build` | Create the production frontend build |
| `npm run db:check` | Verify the configured database connection |
| `npm run seed:sample` | Seed an empty catalog with labeled samples |
| `npm start` | Run the API only |

## Demo owner

- URL: [Owner sign-in](https://bakery-ordering-app.vercel.app/owner/login)
- Email: `owner@example.test`
- Password: `IoHwRjpVK3P0pp7jxJPhAHOjqndGPmAa`

The credentials provide full access to public demo data. Do not enter real customer or business information.

## Notes

- Fixed categories: Bread, Pastries, Cakes, and Drinks.
- Prices and currency in sample data are not confirmed business information.
- Pickup times use `Africa/Cairo` unless `BAKERY_TIMEZONE` overrides it.
- Dedicated mobile design/review remains deferred.
