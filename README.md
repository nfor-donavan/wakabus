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
