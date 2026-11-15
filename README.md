# CELEBRATE · Tukusanyukidde

Every event service. One platform. One grand total.

A phone-first React app with a Node (Express) API, built from the eight-screen wireframe:
Welcome → Home → Browse → Service → Details → Total → Pay → Receipt.

## Run it

```sh
npm install
npm run dev
```

Open http://localhost:5174. The API runs on http://localhost:3001 and Vite forwards `/api` to it.

For a production-style run, one Node server serves both the API and the built app:

```sh
npm run build
npm start
```

Then open http://localhost:3001.

```sh
npm test
```

checks the pricing rules, including that the wireframe's sample plan adds up to UGX 16,995,000.

## Two front ends, one API

| | Phone app | Website |
| --- | --- | --- |
| Folder | `src/` | `site/` |
| Look | App-style screens from the wireframe | Editorial, gallery-style pages for wide screens (also works on phones) |
| Develop | `npm run dev` → http://localhost:5174 | `npm run dev:site` → http://localhost:5175 |
| Build and serve | `npm run build && npm start` | `npm run build:site && npm run start:site` |

Both do the same things: browse and search services, build a plan, enter event details, see the grand total, pay, get a receipt, and follow bookings. The website reuses the phone app's API client and plan logic (`src/api.js`, `src/plan.jsx`, `src/format.js`). On the website, the event details and the grand total share one page, and the total updates as you type.

## Layout

| Path | What it holds |
| --- | --- |
| `server/index.js` | API routes; serves `dist/` when it exists |
| `server/data.js` | Sample catalogue: categories, services, districts, payment methods |
| `server/pricing.js` | Quantities, labour, transport, 3% platform fee, grand total |
| `src/screens/` | One file per screen |
| `src/components/ui.jsx` | Shared pieces: pattern strip, logo, bottom navigation, plan bar |
| `src/plan.jsx` | The customer's plan and event details, kept in the browser |
| `src/styles.css` | Colours and all styling |
| `site/src/pages/` | The website's pages |
| `site/src/components.jsx` | The website's header, footer, service card, plan summary and picture stand-ins |
| `site/src/styles.css` | The website's styling |

## API

| Route | Purpose |
| --- | --- |
| `GET /api/meta` | Event types, districts, categories, payment methods |
| `GET /api/services?category=&q=&filter=` | Browse and search; `filter` is `under500k`, `top` or `offers` |
| `GET /api/services/:id` | One service |
| `GET /api/offers` | Offers this week |
| `POST /api/quote` | `{ event, items }` → line items and grand total |
| `POST /api/bookings` | `{ event, items, payment, customer }` → booking with receipt number |
| `GET /api/bookings`, `GET /api/bookings/:id` | Bookings |
| `GET /api/bookings/:id/receipt` | Downloadable e-receipt (text) |

## Not real yet

- **Payments.** No money moves. `POST /api/bookings` checks the details and records the booking; a payment provider still has to be connected there.
- **Catalogue and photos.** Vendors, prices, ratings and reviews in `server/data.js` are sample data, and photos are patterned stand-ins.
- **Storage.** Bookings are held in memory and are lost when the server restarts.
- **Accounts.** "Log in" only remembers a name on the device. Vendor sign-up is a holding page.

## Hosting on Netlify

`netlify.toml` builds the website (`site/`) and runs the API as a Netlify Function
(`netlify/functions/api.js`), so connecting the repository to Netlify is enough; no settings
need to be entered by hand. Bookings are kept in the function's memory, so they can vanish
between requests on Netlify until a database is added.
