# Aurelia beauty atelier (demo)

A fully working website for a fictional multi-service beauty salon in Bratislava (hair, colour, nails, lashes and brows, skin, massage, make-up), built by Donny Digital as a showcase for beauty clients. Everything is in Slovak. Every flow works end to end in the browser; payments are simulated and no e-mails or SMS are sent.

## What it shows a salon owner

- **Smart online booking**: several services in one visit, each with a specialist of your choice or "anyone available". Prices follow the specialist's level (Junior −15 %, Senior, Art director +20 %) and hair length. A real availability engine respects shifts, opening hours, holidays, days off, other clients, clean-up time after pedicures and massages, and a 2-hour lead time. It offers a "nearest free time" shortcut, busy and full days, a waitlist for full days, combo discounts, deposits for long services (simulated card payment), a patch-test question for colour and lashes, a confirmation with QR code, `.ics` and Google Calendar, and a manage page to reschedule, cancel (free up to 24 h, deposit policy after) or edit the note.
- **Client account with loyalty**: sign-up bonus, 1 point per euro, double points in the birthday month, Rose / Gold / Platinum tiers with automatic discounts, rewards exchanged for codes used at checkout, referral codes (friend gets 10 €, referrer 100 points), visit history with the stylist's notes (colour formula), "book again", smart reminders ("your roots are due"), profile with favourite specialist and care notes, GDPR data export and account deletion.
- **Service and price list** with search, variants, level-based price ranges, combo offers, and an "add to visit" basket that follows the visitor around the site.
- **Team** pages with each specialist's live next free time, a profile with their prices, portfolio, reviews and bookable time slots.
- **Gallery** with filters and a lightbox; "I want this look" books the person who did it.
- **Loyalty page** with an interactive points calculator.
- **Admin** (`/admin`): KPIs, a 14-day revenue chart and team utilisation; a day calendar with a column per specialist, appointment details and status changes, phone bookings and blocked time by clicking an empty slot; a client list (CRM) with tags, search, history, loyalty points and CSV export; live price, duration and "bookable online" editing; days off per specialist; waitlist and messages. A booking made on the site pops up in an open admin tab.
- Live open/closed status, holiday hours, cookie consent, privacy page, SEO meta, `schema.org/BeautySalon` data, Open Graph image, 404 page, accessible dialogs and forms, reduced-motion support, responsive down to 360 px.
- A floating **"Ukážka" badge** explains the demo, gives a try-it checklist, the demo login and a "Chcem takýto web" e-mail button.

Demo account: `zuzana.kovacova@example.com` / `ukazka2026` (Gold member with a year of history). Referral code `ZUZANA10` gives a new client 10 € off. The test card button fills `4242 4242 4242 4242`. The admin login is pre-filled.

## Run it

```bash
cd aurelia
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
npm run lint
```

## Deploy (Vercel)

Create another Vercel project from this repository and set **Root Directory** to `aurelia`. Vercel detects Vite; `vercel.json` rewrites every path to `index.html` so deep links work. A subdomain such as `salon.donny-digital.com` reads best in cold e-mails.

## Make it yours or a prospect's

- `src/config.ts`: name, address, phone, e-mail, opening hours, holidays, booking rules (lead time, deposit, cancellation window), loyalty rules, tiers and rewards, and the studio details used in the demo badge.
- `src/data/services.ts`: categories, services, variants, prices, durations, deposits, patch tests, pairings and combo discounts.
- `src/data/team.ts`: specialists, levels and price multipliers, skills, weekly shifts, bios.
- `src/data/content.ts`: reviews, FAQ, gallery and brands.
- Colours and fonts: the `@theme` block in `src/index.css`.
- Photos: Unsplash photos in `public/images/`; sources and how to swap them are in [PHOTOS.md](PHOTOS.md).

## How the demo works

There is no server. `src/lib/store.ts` keeps appointments, accounts, admin changes and messages in `localStorage`, and the `storage` event keeps open tabs in sync. Other clients' appointments are generated deterministically per day and specialist (`src/lib/availability.ts`), so the salon looks busy and the public booking, team pages and admin always agree on what is free. The demo client's history is placed into real free slots by the same engine. The "Obnoviť" button in the demo badge resets everything.

For a real client the same screens would sit on a booking API, a payment gateway (GoPay, Stripe, Global Payments), SMS reminders and transactional e-mail (Resend), like the portfolio's own contact form in `../api/contact.ts`.
