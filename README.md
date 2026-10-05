# evita-frontend

**EVITA**: the Tier I field app ELPREMAR engineers use on site for asset inspection, testing and measurements, and maintenance. It is one of the three OLIVINE frontends (EVITA, EMMS-E, OCC), all served by the same backend API.

Built with React 19, Vite, TypeScript, Tailwind CSS v4 and shadcn/ui, on the same stack and colour tokens as [occ-frontend](https://github.com/ghostshreyash/occ-frontend). It runs on mock data until the API is connected; places to connect it are marked `TODO`.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build to dist/
npm run lint
```

`vercel.json` is set up for Vercel: it rewrites every route to `index.html` so deep links work on refresh.

## Target devices

EVITA is built for two 11-inch Android tablets, running Chrome:

| Device | Notes |
|---|---|
| Lenovo ThinkTab X11 (8 GB / 256 GB / 5G) | |
| Samsung Galaxy Tab S9 FE (5G, 8 GB / 256 GB) | Install the app from **Chrome**, not Samsung Internet |

Both give the browser roughly **1280×800 CSS px in landscape** and **800×1280 in portrait**. Design and check every screen at those two sizes. How the app is tuned for them:

- **Readable at arm's length.** The root font size stays at 16px (OCC shrinks to 13–14px for desktop density). Body text is 14–16px, nothing under 12px.
- **Touch targets of 44px or more.** shadcn primitives are resized in `src/components/ui`: buttons `h-11` by default, inputs and selects `h-11`, checkboxes 20px with a larger label hit area, sidebar items 48px, OTP boxes 56px. Keep new controls at least this size.
- **Landscape and portrait.** Landscape opens with the full sidebar. Portrait opens with a 72px icon rail, and side panels move under the main content. Rotating the tablet resets the sidebar to the default for the new orientation (`src/layouts/app-layout.tsx`).
- **On-screen keyboard.** `interactive-widget=resizes-content` in `index.html` shrinks the layout instead of covering it, so the focused field stays visible.
- **No accidental data loss.** Pull-to-refresh is disabled (`overscroll-behavior`), there is no double-tap zoom delay, and a long-press doesn't select button text (`src/index.css`).
- **Installable.** `public/manifest.webmanifest` lets the app be added to the home screen and opened full screen. Offline caching (service worker, IndexedDB outbox) is not added yet.
- **Connection state.** The sidebar shows Online / Offline from the browser at all times.

## Screens

| Route | Screen | Status |
|---|---|---|
| `/login` | Sign in, step 1: username and password | Built |
| `/login/verify` | Sign in, step 2: one-time code (SMS first, e-mail and voice fallback) | Built |
| `/forgot-password` → `/forgot-password/verify` → `/reset-password` | Password reset | Built |
| `/account-recovery` | Recovery when the mobile and e-mail are both unreachable | Built |
| `/` | Dashboard: counters, today's tasks, asset categories, quick actions, notifications | Built |
| `/my-tasks` | My Tasks: inspections and maintenance together, with Today / Upcoming / Overdue / Completed views | Built |
| `/my-tasks/:id` | Task: Start, record readings / observations / evidence (inspection) or the INSTA CLEAN work (maintenance), submit | Built |
| `/testing-measurements` | My Tasks, inspections only | Built |
| `/maintenance-activities` | My Tasks, maintenance only | Built |
| `/assets` | Assets (being built separately; reads `?category=` from the dashboard tiles and `?asset=` from a QR scan) | Placeholder |
| `/reports` | Reports | Placeholder |

Shared panels, opened from the dashboard, the top bar and the task screen: Scan Asset QR, Report an Issue (raises a support ticket, source "EVITA"), SOP / Manual, Safety First and Notifications.

### How work moves

EVITA writes to the same inspection and maintenance records OCC reads (`src/data/*-store.ts`, copied from occ-frontend with the field-side changes added):

- **Inspection:** Approved → **Start** → In Progress → **Submit** → Completed, with a field estimate of the health score.
- **Maintenance:** In Progress → **Submit for Approval** → Pending For Approval → OCC approves or sends it back → **Rework** → resubmit.

Field changes are kept on the tablet across a refresh (`src/data/persist.ts`) until the API and offline sync exist.

There is no Register screen. ELPREMAR accounts are created by OLIVINE in the OCC console (ELPREMAR onboarding), never requested from a tablet.

Demo sign-in: any password and any 6-digit code are accepted. The username picks the person: `suresh.kumar` (the default), `amit.sharma` or `ramesh.patil`.

## Where this came from

The EVITA screens were first built inside occ-frontend, which served all three brands from one deployment chosen by hostname. They were moved here as a standalone app:

| occ-frontend | here |
|---|---|
| `src/config/brands.ts` (`evita` entry) | `src/config/brand.ts` |
| `evitaNavigation` in `src/config/navigation.ts`, under `/evita/*` | `src/config/navigation.ts`, at the root |
| `src/pages/evita/dashboard.tsx` | `src/pages/dashboard.tsx`, resized for tablets |
| `src/pages/auth/*`, `src/components/auth/*` (three brands) | EVITA-only versions |
| OCC top bar | EVITA top bar and sidebar profile, as in the EVITA mockup |

These files are copied as-is and should be kept in step with occ-frontend until they move into the shared `@olivine/ui` package and the generated API client:

- `src/index.css`: colour tokens
- `src/lib/status.ts`, `src/lib/validation.ts`
- `src/data/master-data.ts`: shared vocabularies
- `src/data/mock.ts`, `src/data/occ-tables.ts`, `src/data/elpremar-data.ts`: mock data, so EVITA shows the same tasks OCC assigned

## Authentication

Everything under the app shell is behind `RequireAuth`. The OTP is **not** implemented in this repository: codes are issued and verified by AWS (Cognito, SNS, SES). Each placeholder in `src/lib/auth/auth-service.ts` is marked `TODO(aws)`. Sessions live in `sessionStorage`, or in `localStorage` when "Remember me" is ticked.

## Theming

All colours are CSS variables in `src/index.css`, exposed as Tailwind classes. Use tokens, never hex values: `brand-navy`, `brand-gold`, `healthy` / `attention` / `critical` / `offline`, `success` / `warning` / `info` / `neutral` / `highlight`, `sidebar-*`, `topbar`. Use `src/lib/status.ts` for anything status-related.

## Before production

- Replace the Pexels photograph behind the sign-in (`photoUrl` in `src/config/brand.ts`) with OLIVINE's own licensed image on its own CDN.
- Connect `src/lib/auth/auth-service.ts` to AWS Cognito. Until then every credential is accepted.
- Add the service worker and offline outbox (`vite-plugin-pwa`, Dexie) before field use, as set out in the tech-stack document.
- Warn before Logout while records are still waiting to sync (`TODO` in `src/components/layout/topbar.tsx`).
