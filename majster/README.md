# Majster: website demo for tradespeople

A fully working website for a small trades business, built by Donny Digital as a showcase for cold e-mails to electricians, plumbers, carpenters, tilers and painters. Everything is in Slovak. Every flow works end to end in the browser; nothing is e-mailed or texted and no payment is taken.

One codebase serves five trades. A link can also carry the prospect's own business name, town and phone number, so they open "their" website.

## Personalised links

```
/?remeslo=elektrikar&firma=Novák%20Elektro&mesto=Žilina&tel=0905123456&meno=Peter
```

| Parameter | Short | What it does |
|---|---|---|
| `remeslo` | `r` | `elektrikar`, `instalater`, `stolar`, `obkladac` or `maliar`: services, prices, calculator, photos, colours, FAQ, references |
| `firma` | `f` | business name in the logo, titles, quotes, e-mail address (`info@novak-elektro.sk`) and favicon initials |
| `mesto` | `m` | home town: the service area map, travel costs, emergency arrival times and nearby towns in references and reviews all follow it |
| `tel` | `t` | the phone number; with it, call buttons really dial. Without it the sample number explains itself instead of dialling a stranger |
| `meno` | `o` | owner's first name in the about section and the admin greeting |

The profile is remembered in the browser and the parameters are removed from the address bar. A link with only `?remeslo=…` shows that trade's sample business. The demo badge lets anyone switch between the five trades.

**`/generator`** (not linked anywhere) builds these links for one firm or for a pasted list (from Excel, one firm per line), checks that the town exists, and writes a ready cold e-mail with the link. The list exports to CSV.

## What it shows a tradesperson

- **Online price calculator**: 4–5 jobs per trade with sliders, counters and options (e.g. flat area, wall type, number of circuits; kitchen length and door material; bathroom size and tile format). A live itemised budget from the real price list, urgency surcharge, travel cost from the customer's town, VAT, a price range and duration. Photo upload, then a request with a reference number and a status page that updates as the firm works on it.
- **Booking a site visit** in two-hour arrival windows from a real availability engine (technicians, shifts, other customers, days off, holidays, lead time). The visit page has `.ics` and Google Calendar export, rescheduling and cancellation (free up to 12 h before), and print.
- **24/7 emergency service** (electricians and plumbers): pick what is happening and get safety instructions immediately, a live arrival estimate from distance and time of day, and night and weekend pricing. After reporting, the customer sees a tracking page with the assigned technician, van and a live map. The demo runs faster than real time.
- **Quotes accepted online**: the firm builds an itemised quote in the admin from the calculator lines and sends it. The customer opens a printable A4 quote (PDF via print) and accepts it with a typed signature or declines with a reason. The admin sees the change instantly.
- **Service area checker** with a map drawn from real coordinates of all Slovak municipalities.
- Services with starting prices, a searchable public price list (with or without VAT), references with filters and case-study dialogs, reviews, FAQ, contact form with photos, live open/closed status.
- **Admin** (`/admin`, login pre-filled): KPIs, requests-per-week chart and lead sources; a kanban pipeline (new → visit → quote sent → accepted → in progress → done / lost) with drag and drop, a lead drawer with notes, history and CSV export; a quote builder with a live A4 preview; a weekly team calendar; an emergency dispatch board with an online on/off switch; and a price list editor that the calculator and the public price list follow instantly. Requests made on the website pop up in an open admin tab.
- Cookie consent, privacy page, SEO meta, `schema.org` business data per trade, Open Graph image, 404 page, accessible dialogs and forms, reduced-motion support, a sticky call bar on phones, and layouts down to 360 px.
- A floating **"Ukážka" badge** explains the demo, gives a try-it checklist and a trade switcher, has a "Chcem takýto web" e-mail button, and can reset the data.

## Run it

```bash
cd majster
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check and build to dist/
npm run lint
```

## Deploy (Vercel)

Create another Vercel project from this repository and set **Root Directory** to `majster`. Vercel detects Vite; `vercel.json` rewrites every path to `index.html` so deep links and personalised links work. A subdomain such as `remeselnik.donny-digital.com` reads best in cold e-mails.

## Make it yours or a prospect's

- `src/data/trades/*.ts`: one file per trade with services, price list, calculator jobs (inputs and the formula that turns answers into price-list lines), visit types, emergency issues and safety steps, references, reviews, FAQ, crew and colours.
- `src/config.ts`: office hours, holidays, arrival windows, travel rules, VAT, urgency surcharges and the studio details used in the demo badge (`STUDIO.url` links the badge to the portfolio).
- `src/lib/profile.ts`: how the link parameters become the business shown on the site.
- Fonts and base colours: the `@theme` block in `src/index.css`. The accent colour comes from the trade file.
- Photos: Unsplash photos in `public/images/<trade>/`; sources are in [PHOTOS.md](PHOTOS.md).

## How the demo works

There is no server. `src/lib/store.ts` keeps requests, visits, quotes, emergencies and settings in `localStorage`, one document per trade, and the `storage` event keeps open tabs in sync. Other customers' visits and the days a technician spends on a job are generated deterministically per date (`src/lib/availability.ts`), so the booking page, the home page's "next free slot" and the admin calendar always agree. The admin's history (about 40 requests over three months) is seeded with real calculator estimates. The "Obnoviť" button in the demo badge resets everything.

For a real client the same screens would sit on a small API with a database, transactional e-mail and SMS (Resend, an SMS gateway), and optionally online payments, like the portfolio's own contact form in `../api/contact.ts`.
