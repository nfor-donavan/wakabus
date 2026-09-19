# WakaBus — Deployment Guide

Order matters: MongoDB first (backend needs it to boot), then Git, then the
backend on Render, then the two Vite dashboards (which need the backend's
live URL to talk to).

## 1. MongoDB Atlas (free tier is enough to start)

1. Go to https://www.mongodb.com/cloud/atlas/register and create an account.
2. Create a free "M0" cluster (any region close to you — Frankfurt or Paris
   is closest to Cameroon).
3. **Database Access** (left sidebar) → Add New Database User → set a
   username and password (autogenerate is fine — save it somewhere).
4. **Network Access** (left sidebar) → Add IP Address → **Allow Access From
   Anywhere** (`0.0.0.0/0`). Render's servers don't have a fixed IP, so this
   is the practical option for a project like this.
5. **Database** → Connect → Drivers → copy the connection string. It looks
   like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Edit it: replace `<username>`/`<password>` with your real ones, and add a
   database name before the `?` — e.g. `.../wakabus?retryWrites=true...`.
7. Put that full string in `backend/.env` as `MONGO_URI` (copy
   `backend/.env.example` to `backend/.env` first if you haven't).

## 2. Push the project to GitHub

```bash
cd wakabus
git init
git add .
git commit -m "Initial commit — multi-tenant bus platform"
```

Create an empty repo on GitHub (github.com → New repository — don't
initialize it with a README), then:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

The `.gitignore` files already in each folder keep `node_modules`, `.env`,
and build output out of the repo — your `MONGO_URI` and JWT secrets never
get pushed. **Never remove `.env` from `.gitignore` and commit it.**

## 3. Backend on Render

1. https://render.com → New → **Web Service** → connect your GitHub repo.
2. Settings:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance type**: Free is fine to start.
3. **Environment** tab → add each variable from `backend/.env.example`:
   | Key | Value |
   |---|---|
   | `MONGO_URI` | your full Atlas connection string |
   | `JWT_SECRET` | any long random string (e.g. generate with `openssl rand -hex 32`) |
   | `QR_SIGNING_SECRET` | a different long random string |
   | `PAYMENT_WEBHOOK_SECRET` | matches whatever your Mobile Money gateway signs with |
   | `RESERVATION_HOLD_MINUTES` | `10` |

   Don't set `PORT` — Render sets it automatically and `server.js` already
   reads `process.env.PORT`.
4. Deploy. Once live, your API root is something like
   `https://wakabus-backend.onrender.com`. Test it:
   ```bash
   curl https://wakabus-backend.onrender.com/health
   ```
   should return `{"status":"ok"}`.
5. Seed your first Super Admin. Render's free tier doesn't give you a
   persistent shell, so the easiest path is to run the seed script from your
   own machine, pointed at the live database:
   ```bash
   cd backend
   MONGO_URI="<paste your Atlas URI>" node scripts/seedSuperAdmin.js "Your Name" you@example.com "a-strong-password"
   ```
   (This works because the script reads `MONGO_URI` from the environment —
   your local `.env` also has it, so plain `node scripts/seedSuperAdmin.js ...`
   works too if `.env` already points at Atlas.)
6. Every `git push` to `main` auto-redeploys the backend, since Render
   watches the connected branch.

Free-tier note: Render's free web services spin down after ~15 minutes of
inactivity and take a few seconds to wake up on the next request — fine for
a portfolio/demo, worth upgrading before real passengers depend on it.

## 4. Agency Admin & Super Admin dashboards (Vite → Render Static Site)

Do this for **both** `agency-admin-web` and `super-admin-web` — same steps,
different root directory.

1. Render → New → **Static Site** → same GitHub repo.
2. Settings:
   - **Root Directory**: `agency-admin-web` (repeat later with `super-admin-web`)
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
3. **Environment** tab → add:
   | Key | Value |
   |---|---|
   | `VITE_API_BASE` | `https://wakabus-backend.onrender.com/api` (your Render backend URL + `/api`) |

   Vite bakes environment variables in at *build* time, not runtime — if you
   change `VITE_API_BASE` later, you must trigger a new deploy for it to
   take effect.
4. Deploy. You'll get a URL like
   `https://agency-admin-web.onrender.com` and, separately,
   `https://super-admin-web.onrender.com`.
5. Log in:
   - Super Admin dashboard first, with the account you seeded in step 3.5.
   - Use it to onboard your first transport company — that call also
     creates that company's first `agency_admin` login, which you then use
     to log into the Agency Admin dashboard.

(Vercel or Netlify work identically if you prefer them over Render's static
sites — same three settings: root directory, build command, publish
directory `dist`, plus the `VITE_API_BASE` environment variable.)

## 5. The Expo passenger app

This one isn't "deployed" the same way — it either runs via Expo Go during
development, or gets built into an installable app.

### Quick testing during development (Expo Go)

1. Open `mobile-passenger-app/services/api.js` and set:
   ```js
   const API_BASE = "https://wakabus-backend.onrender.com/api";
   ```
2. `cd mobile-passenger-app && npx expo start`, scan the QR code with Expo
   Go on your phone.

### Installable APK via EAS Build ("preview" profile)

This is what you want for "an app I can just install and open on my
phone" — no Expo Go needed, no Play Store submission needed. `eas.json` is
already set up for it.

1. **Before building**, make sure `services/api.js`'s `API_BASE` points at
   your **live** Render backend URL, not `localhost` and not a placeholder.
   A preview build has no dev server behind it — whatever URL is in the code
   when you build is the URL the installed app will call, permanently,
   until you rebuild.
2. Create a free Expo account at https://expo.dev/signup if you don't have
   one.
3. Install the CLI and log in:
   ```bash
   npm install -g eas-cli
   eas login
   ```
4. From inside `mobile-passenger-app/`, link the project to your Expo
   account (this writes a `projectId` into `app.json` — safe to commit):
   ```bash
   cd mobile-passenger-app
   eas build:configure
   ```
   Choose Android when prompted (iOS needs a paid $99/year Apple Developer
   account for device installs — skip it for now unless you already have
   one).
5. Kick off the build:
   ```bash
   eas build --profile preview --platform android
   ```
   This uploads your project to Expo's build servers and compiles it there
   — takes roughly 10–20 minutes on the free tier. You can close the
   terminal; it keeps building in the cloud.
6. When it finishes, the CLI prints a URL (and a QR code) for the build.
   Open that URL on your phone's browser, or scan the QR code, and tap
   **Install** — Android will ask you to allow installs from this source
   the first time. That's it: a real installed app icon, using
   `assets/app-icon.png`, with no Expo Go wrapper.
7. Anyone else you want to test it can use the same build URL — no need to
   rebuild per person. Rebuild only when you change code or `API_BASE`.

If a build fails, `eas build --profile preview --platform android` prints a
link to the full build log — that's the first place to look; the usual
culprits are a typo in `app.json` or a dependency version mismatch.

### Production release later

When you're ready for the Play Store, the `production` profile in
`eas.json` builds an `.aab` (Play Store's required format) instead of an
`.apk` — `eas build --profile production --platform android`, then
`eas submit` to upload it. Not needed for now.

## Quick checklist, in order

- [ ] MongoDB Atlas cluster created, IP access open, connection string copied
- [ ] `backend/.env` filled in locally, `git push` done (`.env` NOT committed)
- [ ] Backend deployed on Render, env vars set, `/health` returns ok
- [ ] Super Admin seeded against the live database
- [ ] `agency-admin-web` deployed on Render with `VITE_API_BASE` set
- [ ] `super-admin-web` deployed on Render with `VITE_API_BASE` set
- [ ] First transport company onboarded via Super Admin dashboard
- [ ] `mobile-passenger-app/services/api.js` pointed at the live backend
- [ ] `eas build:configure` run, then `eas build --profile preview --platform android`
- [ ] Preview build link opened on phone, APK installed
