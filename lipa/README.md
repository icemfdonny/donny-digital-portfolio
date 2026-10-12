# Lipa – kuchyňa & vínny bar (demo)

A fully working website for a fictional Bratislava restaurant, built by Donny Digital as a showcase for gastro clients. Everything is in Slovak. Every flow works end to end in the browser; payments are simulated and nothing is e-mailed.

## What it shows a restaurant owner

- **Live opening status** everywhere ("Teraz otvorené · kuchyňa do 22:00"), holiday hours, next opening time.
- **Daily lunch menu (obedové menu)** that changes automatically every week, with today highlighted and a weekend notice.
- **Menu with the 14 EU allergens**, diet filters (vegetarian, vegan, gluten-free, spicy), allergen exclusion, search, dish details with a sommelier's wine pairing.
- **Wine list** of Slovak wines by type, glass and bottle prices.
- **Table reservations**: party size, calendar with busy and full days, time slots with live availability, seating areas (interior, seasonal terrace, wine bar, chef's table with deposit), occasion and accessibility options, validation, confirmation with QR code, `.ics` and Google Calendar, a manage page to edit the note or cancel.
- **Online ordering**: pickup or delivery, delivery zones by postcode with fees and minimums, free delivery threshold, dish options (steak doneness, sauces, extras), packaging fee, promo codes and gift-voucher balance at checkout, scheduled orders when the kitchen is closed, simulated card payment.
- **Live order tracking** with a progress timeline and a courier map. The demo timeline runs sped up.
- **Events** with tickets, seats left, sold-out waitlist, and a **private event enquiry** with a live price estimate.
- **Gift vouchers**: value or experience, four designs, personal message, delivery now, on a date or by post, printable voucher with QR code, balance checker. Voucher codes work in the online shop.
- **Admin** (`/admin`): today's KPIs and arrivals chart, reservation book with status changes and phone bookings, a live order board (changes appear instantly on the guest's tracking page in another tab), sold-out switches, weekly lunch editor, enquiries, vouchers, tickets and messages.
- Cookie consent, privacy page, SEO meta and `schema.org/Restaurant` data, Open Graph image, 404 page, accessible dialogs and forms, reduced-motion support, responsive down to 360 px.
- A floating **"Ukážka" badge** explains the demo, gives a try-it checklist, demo codes and a "Chcem takýto web" e-mail button.

Demo codes: `LIPA10` (10 % off food from 20 €), `VITAJTE` (free delivery), vouchers `LIPA-DEMO-0050` and `LIPA-DEMO-0100`. The test card button fills `4242 4242 4242 4242`.

## Run it

```bash
cd lipa
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
npm run lint
```

## Deploy (Vercel)

Create a second Vercel project from this repository and set **Root Directory** to `lipa`. Vercel detects Vite; `vercel.json` rewrites every path to `index.html` so deep links work. A subdomain such as `lipa.donny-digital.com` reads best in cold e-mails.

## Make it yours or a prospect's

- `src/config.ts`: name, address, phone, e-mail, opening hours, holidays, lunch hours, ordering rules, promo codes, and the studio details used in the demo badge (`STUDIO.url` links the badge to the portfolio).
- `src/data/`: menu (`menu.ts`), lunch pools (`lunch.ts`), wines and drinks (`drinks.ts`), events (`events.ts`), reviews, team, suppliers, spaces, delivery zones and voucher options (`content.ts`), photo slots (`photos.ts`).
- Colours and fonts: the `@theme` block in `src/index.css`.
- Photos: Unsplash photos in `public/images/`; sources and how to swap them are in [PHOTOS.md](PHOTOS.md).

## How the demo works

There is no server. `src/lib/store.ts` keeps bookings, orders, vouchers and settings in `localStorage`, and the `storage` event keeps open tabs in sync. Other guests' bookings and earlier orders are generated deterministically per date (`src/lib/availability.ts`, `src/pages/admin/adminData.ts`), so availability and the admin always agree and the restaurant looks busy. The "Obnoviť" button in the demo badge resets everything.

For a real client the same screens would sit on a booking API, a payment gateway (GoPay, Stripe, Global Payments) and transactional e-mail (Resend), like the portfolio's own contact form in `../api/contact.ts`.
