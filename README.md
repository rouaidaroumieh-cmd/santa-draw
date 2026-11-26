# 🎄 Santa's Christmas Draw 2026

**23 days of Christmas magic** — a complete, production-quality Christmas lucky-draw web
application for a company office. Twenty employees, seventeen working days, three or four names revealed
every morning from a magical Christmas drawing machine, and every result locked forever.

---

## 1. What the application does

| Area | What you get |
| --- | --- |
| **Home** *(public)* | The statistic cards, the campaign progress bar, today's names once revealed and the "Today's Christmas Picks" presentation. Read-only: no draw button |
| **Calendar** *(public)* | The 23-day Advent calendar (30 November – 22 December 2026) with weekend tiles, sealed future days and clickable historical days |
| **Participants** *(public)* | The 20 employee profiles with photo, selection progress, three gift-stars and the remaining chances. Read-only |
| **Admin** *(password)* | The only place to **run the daily draw** (drawing machine and rehearsal) and to **enter the participants** (names and photos). Also schedule generation and validation, campaign start, completed draws history, CSV + JSON export, validated JSON import, date/rehearsal controls and a two-step full reset |

### The non-negotiable draw rules (implemented and validated in code)

* 20 participants × 3 selections = **60 selections**
* 17 working days (Mon–Fri, 30 Nov – 22 Dec 2026) with a planned number of winners per day
  (9 days × 4 + 8 days × 3 = **60 selections**). The plan lives in `DRAW_PLAN` in `src/lib/dates.ts`.
* Each participant appears **exactly 3 times, on 3 different dates**
* Never twice on the same day, never on a weekend, never in the future
* Completed employees are automatically excluded from future selections
* The complete schedule is generated **before** the first draw and validated before it becomes active

Draw days: 30 Nov; 1, 2, 3, 4, 7, 8, 9, 10, 11, 14, 15, 16, 17, 18, 21 and 22 December 2026.
Winners per day: 4 on 30/11, 1/12, 2/12, 7/12, 8/12, 9/12, 11/12, 14/12 and 22/12; 3 on 3/12, 4/12,
10/12, 15/12, 16/12, 17/12, 18/12 and 21/12.
Weekends (5, 6, 12, 13, 19 and 20 December) are displayed as **“Weekend – no draw”**.

---

## 2. Running it locally

The campaign is stored on the server (PostgreSQL), so everybody who opens the site sees the same
draws. Only the organiser, who logs in on the **Admin** page with a password, can run the draw and
edit the campaign; everyone else is read-only and the page refreshes itself every ~10 seconds.

### Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | yes | PostgreSQL connection string |
| `ADMIN_PASSWORD` | yes | The organiser password (also signs the session cookie) |
| `CAMPAIGN_TIMEZONE` | no | IANA time zone used for "today" (default `UTC`, e.g. `Europe/Paris`) |
| `NEXT_PUBLIC_DEV_MODE` | no | `true` only for local testing (see below). **Never set it in production.** |

Copy `.env.example` to `.env.local` and adjust it.

### First start

```bash
npm install
docker-compose up -d db     # local PostgreSQL 16 on 127.0.0.1:5432 (or use any Postgres)
npm run db:push             # creates the tables
npm run dev                 # http://localhost:3000
```

Production build: `npm run build && npm start` (the build does not need the database).

### Dev mode (rehearsing the whole campaign)

```bash
npm run dev:test
```

This uses a separate **sandbox** campaign (`dev` instead of `main`) and shows a toolbar to pick any
"today" in the campaign window, undo a day's draw, fill the previous days, or reset the sandbox. The
real campaign data is never touched, and the dev actions answer `404` when the variable is not set.

---

## 3. Deploying (Vercel + Neon, free tiers)

1. Create a free PostgreSQL database on [Neon](https://neon.tech) and copy its connection string.
2. Create the tables once from your machine:
   `DATABASE_URL="<neon url>" npx drizzle-kit push`
3. Import the repository in [Vercel](https://vercel.com) and add the environment variables
   `DATABASE_URL`, `ADMIN_PASSWORD` (a long, unique password) and `CAMPAIGN_TIMEZONE`.
4. Deploy, open the site, log in on **Admin**, replace the placeholder names, then start the
   campaign. Share the link: visitors can watch but cannot draw or edit.

Any host that runs Node.js plus a PostgreSQL database works the same way. The site is served over
HTTPS by these hosts, which also makes the session cookie `secure`.

> Keep a copy of **Admin → Export JSON backup** after every reveal. A backup made with an older,
> browser-only version of the app can still be imported.

---

## 4. User guide

### Editing the 20 employees
1. Open **ADMIN → Participant configuration**.
2. Type the real names into the twenty fields (the placeholder names are `Participant 01 … 20`).
3. Everything stays editable until the first draw is completed — after that the configuration locks
   automatically to protect the results.

### Uploading photos
* Log in on **Admin**, then click **Add photo** next to any name. Visitors cannot upload photos.
* JPG, PNG and WebP are accepted. Images are cropped to a square, resized to 512 px and compressed
  automatically.
* Photos are stored on the server, shown to everyone and included in JSON backups. Only the
  organiser can change them, and only before the first draw.

### Performing the daily draw
0. Log in on **ADMIN** (visitors see "Waiting for the organiser's reveal" instead of the button).
1. Open **HOME**. The banner tells you whether today is ready, completed, a weekend or still ahead.
2. Press **🎄 Reveal today's names** (the number shown is the planned number for the day).
3. Read the confirmation — *“Are you ready to reveal today's Christmas names?”* — and press
   **CONFIRM DRAW** (or **CANCEL**).
4. The reels slow down one after another and the names appear with a gold sparkle.
5. The result is saved immediately and the day is marked **DRAW COMPLETED – RESULTS LOCKED**.

A draw can never be executed twice: the server records it in a single database transaction (one
row per day), so double clicks, two browsers or a refresh cannot create a second draw. The winners
come from the pre-validated schedule and are committed *before* the animation starts — the
animation is purely cosmetic. Visitors see the result at the next refresh, without the animation.

If today is not an eligible day, the same button becomes a **rehearsal**: it animates the machine
with random names marked *Simulation · not recorded*. Nothing simulated is ever written to the
campaign history.

### Viewing the calendar
Open **CALENDAR**. Working days show their status, completed days show their winners with photos
and a lock icon, future days stay sealed with *“A Christmas surprise is waiting…”*, and weekends are
shown as resting days. Click any completed day to open the full historical view.

### Exporting backups
* **Admin → Export JSON backup** — the complete campaign (names, photos, schedule, results, locks).
* **Admin → Export results (CSV)** — a spreadsheet of every date, winner, selection number and the
  remaining chances at that time.
* **Admin → Import JSON backup** — restores a previous backup. The file is fully validated first and
  an invalid file is rejected with a clear error, never overwriting completed draws.

### Starting over
**Admin → Danger zone → Reset the entire campaign**. Two confirmations are required (the second one
asks you to type `RESET`). This erases every result, lock, name, photo and the current schedule.
There is deliberately **no ordinary undo** for a daily draw.

---

## 5. How the draw works

```
randomness   Web Crypto API  →  unbiased rejection-sampled integers
generation   weighted greedy dealing with restart-on-dead-end,
             preferring participants who did not appear on the previous day
validation   validateSchedule() — 20 ids, 17 eligible dates, the planned winners per day,
             3 per participant on 3 distinct dates, 60 total, no weekends
reveal       POST /api/draw → lock the campaign row, re-validate (eligible day, not
             already drawn, selection rules) and insert the result atomically
             [ animation in the organiser's browser ]
```

Recovery: the result is saved by the server before the animation, so closing the browser mid-way
loses nothing — the day is already drawn and locked.

---

## 6. Technical architecture

* **Framework:** Next.js (App Router) with TypeScript and Tailwind CSS — all product logic is
  framework-agnostic and lives in `src/lib/`.
* **Storage:** PostgreSQL through Drizzle ORM (`src/db/`): one campaign row (settings, participants,
  schedule), one row per drawn day, one row per photo.
* **API:** route handlers in `src/app/api/` (`campaign`, `draw`, `admin`, `session`, `photos`,
  `health`). The public state never contains the names of future days. Mutations require the admin
  session cookie (HMAC-signed, `httpOnly`, 12 h) and a JSON content type.
* **Files:** `src/lib/dates.ts` (campaign calendar), `random.ts` (Web Crypto randomness),
  `draw-engine.ts` (generation + validation + statistics), `backup.ts` (backup format and
  validation), `storage.ts` (browser downloads, CSV), `store.ts` (client store synced with the
  API), `src/server/` (auth, HTTP helpers, campaign operations).
* **UI:** `src/components/` — the drawing machine, avatars (SVG monogram fallback), dialogs,
  statistics and the page chrome; `src/app/` — Home, Calendar, Participants, Admin.
* **Accessibility:** keyboard-navigable dialogs with focus restore, labelled controls, status
  messages with `role="status"`, progressbar semantics, and every status carried by text as well as
  colour. `prefers-reduced-motion` disables the reels, the snow and the confetti.
* **Responsive:** tested layouts for desktop, laptop, tablet and phone (the reels become a 2×2
  grid on small screens).

## 7. Mathematical tests included in the engine

`validateSchedule()` rejects any schedule that breaks: participant count, day count, the eligible
date list, weekends, duplicate dates, duplicate winners on a day, the 3-appearances-per-participant
rule or the 60-selection total. `validateSelection()` re-checks every reveal immediately before it
is written to the database.

---

*This is a small office entertainment project: the protection it offers is integrity of the draw
rules, a single organiser password and clear backups — not bank-grade security.*
