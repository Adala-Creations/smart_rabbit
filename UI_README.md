# Smart Rabbit UI Readme (Mobile Mirror Guide)

This document gives a UI-level map of the current web app so a mobile developer can build a mirror app with the same information architecture and flows.

## 1) Product Areas

- Public/Auth: landing, login, register, forgot password
- Main app (authenticated): dashboard + 10 modules
- Offline behavior: outbox queue, offline notice, background warmup/sync status

## 2) Top-Level Route Map

### Public routes

- `/` Landing: brand intro, CTA to register/login
- `/login` Sign in form
- `/register` Create account form (includes registration key)
- `/forgot-password` 3-step reset flow: email -> secret key -> new password
- `/offline` Offline fallback info screen

### Authenticated routes (inside `/dashboard`)

- `/dashboard` Home stats + alerts/notifications
- `/dashboard/rabbits` Adults and offspring batches management
- `/dashboard/breeding` Mating and birth records
- `/dashboard/deaths` Adult deaths and offspring losses
- `/dashboard/finances` Sales, expenses, debtors, creditors
- `/dashboard/notes` Central notes (general/rabbit/batch)
- `/dashboard/locations` Location -> rabbitry -> cage hierarchy management
- `/dashboard/workers` Worker/user assignment and roles
- `/dashboard/reports` Report export + analysis charts
- `/dashboard/reports/history` Historical trend page
- `/dashboard/outbox` Offline queue monitor and manual sync
- `/dashboard/profile` Profile, password, backup/restore, PWA install

## 3) Primary Navigation Behavior

- Authentication gate: any unauthenticated access to dashboard routes redirects to `/login`.
- Navigation model:
  - Mobile menu shows all dashboard modules.
  - Desktop top nav is reduced (Dashboard, Notes, Locations, Workers, Reports, Outbox, Profile).
- Global shell: every dashboard screen shares the same top bar, sign-out action, and offline indicators.

## 4) Core Screen Inventory (What Mobile Should Mirror)

## Dashboard (`/dashboard`)

- Purpose: farm snapshot + actionable alerts
- Key UI blocks:
  - KPI cards (total rabbits, matings, births, sales, expenses, deaths, health)
  - Notification feed (unread API notifications + dynamic alerts)
- Linked actions: quick jump into rabbits, breeding, deaths, finances, notifications

## Rabbits (`/dashboard/rabbits`)

- Tabs: Parents and Offspring
- Parents area:
  - List with CRUD
  - View details modal (history across matings, births, sales, deaths)
- Offspring area:
  - Batch list (ACTIVE kits or SEXED growers)
  - Add/edit offspring batch
  - Batch health update
  - Sexing modal workflow for ACTIVE -> SEXED distribution
- Notes for mobile:
  - Keep strong filtering and status labels
  - Keep detail modals as full-screen detail pages on small devices

## Breeding (`/dashboard/breeding`)

- Two record groups on one screen:
  - Matings (record/edit/delete/view)
  - Births (record/edit/delete/view)
- Parent selection constrained to ACTIVE rabbits
- Key logic surfaced in UI:
  - Expected kindling date from mating
  - Birth outcomes (total/alive/dead kits)

## Deaths (`/dashboard/deaths`)

- Dual flow on same module:
  - Adult rabbit death records
  - Offspring batch death records (count-based)
- Offline-first mutations supported (queue when offline)
- Mobile suggestion:
  - Keep two segmented tabs: Adult losses and Offspring losses
  - Preserve clear queued/offline feedback

## Finances (`/dashboard/finances`)

- Four data sections:
  - Sales
  - Expenses
  - Debtors
  - Creditors
- Sales supports 3 sale modes:
  - Single rabbit
  - Single offspring batch
  - Multi-batch
- Offline queue support for create/update/delete
- Mobile suggestion:
  - Use section tabs or accordions to avoid long scroll fatigue

## Notes (`/dashboard/notes`)

- Centralized note records with type and subject
- Subject options:
  - Non-specific
  - Rabbit-linked
  - Batch-linked
- Supports deep-link add mode via query (`?action=add`)
- Offline queue support

## Locations (`/dashboard/locations`)

- Hierarchical management flow:
  - Location list
  - Rabbitry list under a location
  - Cage list under a rabbitry
  - Cage detail with rabbit operations
- Active location context affects app data lens
- Current behavior includes practical single-location guard in UI messaging
- Mobile suggestion:
  - Keep breadcrumb-like drill-down or stack navigation

## Workers (`/dashboard/workers`)

- Add/assign workers by email (creates account if needed)
- Assign rabbitry + worker role
- Manage existing users and assignments
- Generated password can appear once when account auto-created
- Offline queue support for destructive/updates

## Reports (`/dashboard/reports` and `/dashboard/reports/history`)

- Export reports (CSV)
- Analysis mode with charts (birth/death/finance/population)
- Date filtering and report type filtering
- History page gives consolidated trend and totals summary

## Outbox (`/dashboard/outbox`)

- Displays queued offline mutations
- Sync now, discard one, discard all
- Shows method, endpoint, attempts, last error
- Also displays offline warmup progress

## Profile (`/dashboard/profile`)

- Update profile name
- Change password
- Account termination
- Backup download and restore upload
- PWA install status and install prompt handling

## 5) End-to-End User Flows (Mobile Parity Targets)

## Flow A: New user to first data

1. Landing -> Register
2. Register success -> auto sign-in -> Dashboard
3. User sets up Location/Rabbitry/Cage
4. User adds first rabbits

## Flow B: Breeding lifecycle

1. Rabbits exist (active buck + doe)
2. Record mating
3. Record birth
4. Create offspring batch from birth in Rabbits module
5. Sex offspring when mature
6. Sell rabbits/batches in Finances

## Flow C: Mortality tracking

1. Record adult death or offspring batch death
2. Dashboard/reports reflect mortality changes
3. Offline mode queues mutations if no network

## Flow D: Offline recovery

1. User performs edits while offline
2. Changes appear in Outbox queue
3. On reconnect, auto sync or manual Sync all
4. Success/failure feedback shown to user

## 6) Shared UI Patterns To Keep in Mobile

- CRUD-heavy forms with inline validation and error banners
- View/edit modals for records (convert to dedicated mobile screens where needed)
- Status chips and badges (health, sale/death states, queue states)
- Toast-style feedback for success/error/info
- Confirmation dialog before destructive actions
- Empty-state messaging on lists
- Loading state before data render

## 7) Role and Access Notes

- Dashboard routes require authenticated session.
- Workers/roles exist and impact management context.
- App supports multi-user collaboration around rabbitries.

## 8) Mobile IA Recommendation (Mirror of Existing Web)

Use this bottom-tab baseline with stack navigation inside each tab:

- Home: Dashboard
- Stock: Rabbits, Breeding, Deaths
- Money: Finances
- Ops: Locations, Workers, Notes
- More: Reports, Outbox, Profile

This keeps feature parity while reducing top-level clutter on small screens.

## 9) Quick Build Checklist for Mobile Dev

- Match route/module parity listed above
- Keep all major create/edit/delete actions present
- Preserve offspring lifecycle and batch-based operations
- Implement offline queue UX equivalent to Outbox
- Keep report export + analysis entry points
- Keep backup/restore entry in profile
