# WakaBus — Multi-Tenant Inter-City Bus Booking Platform

Built from the original system spec, with the five gaps we discussed solved
in the code (not just described). App icon (`assets/app-icon.png`) is wired
into the Expo app's icon, splash screen, adaptive icon, and web favicon, and
used again on the booking screen header.

**Deploying this for real?** See `DEPLOYMENT.md` for the full walkthrough:
MongoDB Atlas → GitHub → Render (backend) → Render Static Sites (both
dashboards) → pointing the Expo app at your live backend.

## Folder structure

```
wakabus/
├── assets/
│   └── app-icon.png              ← your uploaded icon, used throughout
├── backend/                      ← Node.js/Express + MongoDB API (the core)
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── models/
│   │   ├── plugins/tenantScope.js
│   │   ├── Tenant.js  Agent.js  Bus.js  Route.js  Schedule.js  Booking.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── superAdminController.js
│   │   ├── agencyController.js
│   │   ├── passengerController.js
│   │   └── paymentController.js
│   ├── routes/
│   ├── scripts/seedSuperAdmin.js ← one-time script to create the first Super Admin login
│   ├── utils/
│   │   ├── crypto.js             ← AES-256-GCM for national ID numbers
│   │   ├── qrTicket.js           ← HMAC-signed offline-verifiable QR
│   │   └── manifestPdf.js        ← PDFKit checkpoint manifest
│   ├── jobs/reservationExpiry.js ← releases abandoned seat holds
│   ├── server.js
│   └── .env.example
├── mobile-passenger-app/         ← Full Expo passenger app (not just a starter)
│   ├── app.json                  ← icon/splash/favicon wired to its own assets/app-icon.png
│   ├── assets/app-icon.png
│   ├── App.js                    ← navigation stack tying every screen together
│   ├── services/
│   │   ├── api.js                ← fetch wrapper (cross-tenant search, reserve, ticket, status)
│   │   ├── ticketStorage.js      ← offline ticket cache (AsyncStorage)
│   │   └── qrVerifyOffline.js    ← driver/gate-agent offline validation
│   └── screens/
│       ├── SearchScreen.js       ← pick departure/destination/date
│       ├── ResultsScreen.js      ← every company running that route, cheapest/soonest sorted
│       ├── SeatSelectionScreen.js← tap-to-pick seat grid, taken seats greyed out
│       ├── BookingScreen.js      ← passenger details → reserve → poll payment status
│       ├── TicketScreen.js       ← fetches ticket, renders QR, caches it offline immediately
│       └── MyTicketsScreen.js    ← reads straight from AsyncStorage, works with zero signal
├── agency-admin-web/              ← React/Vite dashboard for agency staff
│   ├── public/app-icon.png        ← favicon
│   └── src/
│       ├── api.js                 ← fetch wrapper (JWT from localStorage)
│       ├── App.jsx                ← sidebar nav shell
│       └── pages/
│           ├── Login.jsx
│           ├── SchedulesTab.jsx   ← create schedules, change status, download manifest PDF
│           ├── BookingsTab.jsx    ← view passengers per schedule, cancel/refund
│           ├── BusesTab.jsx       ← register/view fleet
│           └── RoutesTab.jsx      ← create/view routes
└── super-admin-web/                ← React/Vite platform control panel
    ├── public/app-icon.png
    └── src/
        ├── api.js
        ├── App.jsx
        └── pages/
            ├── Login.jsx
            ├── TenantsTab.jsx      ← onboard companies, suspend/reactivate, set commission
            └── RevenueTab.jsx      ← platform-wide paid-booking counts by company
```

## The five gaps, and how they're solved

1. **Seats vanishing on abandoned payments.**
   `passengerController.reserveSeat` still does the atomic
   `findOneAndUpdate($pull)` from the original spec, but instead of stopping
   there, it creates a `Booking` with `paymentStatus: "Pending"` and a
   `holdExpiresAt` timestamp (`RESERVATION_HOLD_MINUTES`, default 10).
   `jobs/reservationExpiry.js` runs every minute, finds lapsed holds, marks
   them `Expired`, and pushes the seat back into `Schedule.availableSeats`.
   A failed payment webhook also releases the seat immediately rather than
   waiting for the sweep.

2. **Tenant isolation enforced structurally, not just by schema.**
   `models/plugins/tenantScope.js` hooks every find/update/delete query on
   tenant-scoped models and **throws** if `tenantId` isn't in the filter —
   so a future bug that forgets to scope a query fails loudly in dev instead
   of silently leaking another company's data. `middleware/auth.js` also
   pulls `tenantId` out of the verified JWT, never from the request body, so
   an agency admin's token can only ever touch their own tenant. Legitimate
   cross-tenant reads (Super Admin only) opt in explicitly with
   `.setOptions({ skipTenantScope: true })`.

3. **National ID numbers encrypted at rest.**
   `utils/crypto.js` does AES-256-GCM. `Booking.setPassengerIdCard()` encrypts
   on the way in; `booking.getDecryptedIdCard()` is the only decryption path,
   called exclusively inside `getManifest` — the one place the law requires
   the raw number to appear (on a printed checkpoint manifest), never in a
   general API response.

4. **Cancellation/refund path.**
   `Booking` now has `cancelledAt`, `cancelledBy`, `refundReference`, and a
   `Cancelled`/`Refunded` payment status. `agencyController.cancelBooking`
   handles it and releases the seat back to inventory.

5. **Offline boarding validation.**
   Two layers: the counter app downloads a lightweight manifest
   (`GET /api/agency/schedules/:id/manifest-json`, no ID numbers included)
   before departure while it still has signal, and caches it —
   `qrVerifyOffline.js` checks scanned tickets against that cache with zero
   network calls. For a ticket sold too late to make the cached manifest,
   the QR also carries an HMAC signature (`utils/qrTicket.js`) as a fallback.
   **Read the security note in `qrVerifyOffline.js`** — don't ship your real
   signing secret inside the mobile app bundle in production.

## Packages / waybill (courier service)

Many agencies run passenger seats and package courier (colis) through the
same terminals and buses — this is a parallel system riding alongside
bookings, not bolted onto them:

- **Register** a package in the Agency Admin's **Packages** tab: sender,
  recipient, description, fee, and which schedule it's travelling on. This
  generates a tracking code (e.g. `FX-COL-4821`) and a 4-digit pickup code,
  the latter never shown to staff — it's only ever revealed to the recipient
  by SMS once the package arrives.
- **Status moves in one direction**, one step at a time: `Received_At_Origin`
  → `Loaded_On_Bus` → `Arrived_At_Destination` → `Collected`. The first three
  are plain status updates (each one fires a mock SMS to the recipient — see
  `backend/utils/mockSms.js`, a placeholder until a real gateway is wired
  in). `Collected` is different: it's **only** reachable through
  `POST /verify-pickup`, which checks the pickup code against what's stored
  (encrypted) — that's what stops someone collecting a parcel that isn't
  theirs. Five wrong attempts locks the package; an agency admin unlocks it
  from the Packages tab.
- The **Bookings** tab now shows a split view for any selected schedule —
  passengers on the left, packages on that same trip on the right — so a
  terminal agent sees the whole manifest for a bus run in one place.
- The **mobile app** has a staff-only mode, reached through a small "Staff
  login" link at the bottom of the passenger search screen (deliberately
  understated — passengers aren't meant to notice it). Counter agents and
  agency admins log in with the same credentials as the web dashboard, then
  get a camera scanner: point it at a package's tracking code, and it shows
  the package's details with one button to advance its status, or (once
  arrived) a field to type the pickup code and hand it over — all from the
  terminal floor, no laptop needed.

This needs `expo-camera`, which wasn't in the project before — after pulling
this update, run `npx expo install expo-camera` inside `mobile-passenger-app`
rather than trusting the version already written into `package.json`, so Expo
can correct it to match your exact installed SDK version.

## Counter ticket sales

The Agency Admin's **Counter sales** tab is how agents sell to walk-in customers:

- Pick a trip, tap a seat on the bus-shaped seat map (driver cab, door, 3+2 packs, blocked
  seats hatched), enter the passenger's name, ID card number and phone, choose **Cash** or
  **Mobile Money** (the agent confirms the payment and can note the transaction reference),
  and press **Sell ticket**.
- The sale uses the same atomic seat claim as the passenger app, so a counter sale and an app
  booking can never take the same seat. The booking is created already **Paid**, with source
  `Counter`, and the seat disappears from the app instantly.
- **Print ticket** opens a one-page PDF (A6) with the trip, seat, fare and a signed QR code.
  The QR is the same signed payload as an app ticket, so it validates the same way. The
  passenger's ID number is never printed on the ticket.
- Endpoints: `POST /api/agency/counter-sales`, `GET /api/agency/bookings/:id/ticket-pdf`.
  This adds one backend dependency, `qrcode` (Render installs it on the next deploy).

## Staff accounts, roles and the sales report

- **Cashiers use the Agency Admin portal.** They log in with their own account (role
  `counter_agent`), sell tickets in **Counter sales**, and also see Schedules (view, block
  seats, change status), Bookings, Packages, Rentals and their own **Sales report**.
  Fleet, Routes and Staff are hidden from them, and the server refuses those actions anyway.
- The **agency admin** adds and removes staff in the **Staff** tab: create an account with an
  email and password (min. 8 characters), reset a password, or deactivate someone. Deactivation
  takes effect immediately. The server checks the account on every request, so a signed-in
  cashier is locked out straight away instead of staying valid until their session expires.
- Every counter sale records **who sold it**. The **Sales report** shows tickets, total, cash
  and Mobile Money for a day or date range. A cashier sees only their own sales; the admin sees
  everyone, can filter by cashier, and can download a CSV for end-of-day cash checks. Counter
  sales made before this update appear as "Before tracking started".
- Endpoints: `GET/POST /api/agency/staff`, `PATCH /api/agency/staff/:id` (admin only),
  `GET /api/agency/reports/sales`.

## Creating trips in bulk

Trips are created ahead of time by the admin, not by cashiers on the day. In **Schedules**, the
**Create trips for several days** card takes a bus, a route, departure times (for example
`06:00, 08:30, 14:00`), a first day, a number of days (up to 31) and the weekdays to run. It
creates every trip at once and skips any that already exist, so it is safe to re-run weekly.
Departure times are built in the browser's time zone, and times already in the past are skipped.
Endpoint: `POST /api/agency/schedules/bulk` (admin only).

## Manifest PDF

The checkpoint manifest is now a proper bilingual (English/French) A4 document: company header
and manifest reference, a trip summary (route, departure, bus, passengers / capacity, parcels),
a numbered passenger table (seat, name, phone, ID card, ticket, bags), a **parcels** section for
anything loaded on that trip (the pickup code is never included), signature boxes for agent,
driver and checkpoint, and a footer with page numbers and a confidentiality notice on every page.

## Branding (Nexus Tech Labs)

- Brand constants and asset paths are centralised: `src/branding.js` in each dashboard and
  `utils/branding.js` in the app. Assets were generated from the supplied logo
  (`public/nexus-logo.png`, `public/nexus-emblem.png`, `public/favicon.png`; the app has
  `assets/nexus-logo.png`, `nexus-emblem.png`, `nexus-splash.png`; the backend uses
  `assets/nexus-emblem.png` in PDFs). Only the faint off-white background was normalised to pure
  white; the artwork itself is untouched.
- **Dashboards:** full logo and slogan on the login screen, emblem in the header, a branded
  start-up loader (once per browser session, plus a reusable `BrandLoader` component), a subtle
  "Powered by Nexus Tech Labs" footer, a Nexus favicon and page title. The logo always sits on a
  white tile so it stays legible in dark mode.
- **App:** the native splash uses the Nexus emblem on white (`app.json`), followed by an in-app
  `BrandPreloader` (fade-in, gentle pulse, spinner) while the saved theme and language load, and a
  small "Powered by" line on the search screen. The launcher icon is still the WakaBus bus icon,
  because that is the product passengers look for; swap `icon` in `app.json` if you prefer the emblem.
- The slogan is kept in English in both languages because it is the official wording.

## Languages

English and French now cover the dashboards **and** the passenger app. The app starts in the
phone's language, has an EN/FR switch in the header on every screen, and remembers the choice.
Messages that come from the server (for example "Seat already taken") are still in English.

## First things to do

- Wire `paymentController.js` to your actual gateway (Campay/Smobilpay) —
  the webhook signature check is generic HMAC; match it to your gateway's
  actual scheme.
- Add an SMS provider call where the `TODO` sits in `paymentController.js`.
- The passenger app's `handleReserve` in `BookingScreen.js` has a `TODO`
  where you plug in your Mobile Money gateway's SDK/USSD trigger, using the
  returned `bookingId` as the payment reference.

## Running the backend

```bash
cd backend
cp .env.example .env   # fill in MongoDB URI, JWT secret, etc.
npm install
npm run dev
```

## The passenger app, end to end

`mobile-passenger-app` is now a complete flow, not just a wiring example:

**Search** (cross-tenant, `GET /api/passenger/search-companies`) → **Results**
(every company running that route, sorted by departure time) → **Seat
Selection** (tap-to-pick grid, taken seats greyed out from `availableSeats`)
→ **Booking** (passenger details → atomic reserve → poll for payment
confirmation) → **Ticket** (fetches the signed QR ticket and immediately
caches it offline) → and **My Tickets** at any time, which reads straight
from `AsyncStorage` so it works with zero signal.

The cross-tenant search (`searchAcrossCompanies` in `passengerController.js`)
is a deliberate, explicit exception to tenant scoping — schedules and prices
are meant to be publicly comparable across companies, unlike bookings or
manifests, which stay strictly isolated per tenant.

Before running it, open `services/api.js` and set `API_BASE` to your
deployed backend (or your machine's LAN IP for local dev — a physical phone
can't reach `localhost`).

## Running the passenger app

```bash
cd mobile-passenger-app
npm install
npx expo start
```

## Running the Agency Admin dashboard

```bash
cd agency-admin-web
npm install
npm run dev   # http://localhost:5173
```
Log in with the `agency_admin` (or `counter_agent`) account created either
by Super Admin's "Onboard a new transport company" form, or manually in
MongoDB.

## Running the Super Admin dashboard

```bash
cd super-admin-web
npm install
npm run dev   # http://localhost:5174
```
Before your first login, create a Super Admin account (no public signup
route exists for this role, by design):
```bash
cd backend
node scripts/seedSuperAdmin.js "Your Name" you@example.com "a-strong-password"
```

Both dashboards default to `http://localhost:5000/api` as the backend URL.
To point them at a deployed backend, create a `.env` file in each with:
```
VITE_API_BASE=https://your-backend.onrender.com/api
```
