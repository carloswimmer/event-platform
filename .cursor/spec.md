# Event Registration Platform — Tutorial Specification

> **Purpose:** Hands-on tutorial to remember **Redux**, **Express**, and **MongoDB** by building a full-stack app in an **Nx monorepo** with **layered Express**, **Mongoose repositories**, and **domain use-cases** — not an in-memory kata port.

> **Reference (`./refer/`):** Defines **business rules** and **acceptance scenarios** only. See [`.cursor/plan.md`](./plan.md) for architecture (routes → controllers → services → repositories; domain ports + use-cases).

---

## 1. Learning outcomes

After completing the tutorial, you should be able to:

| Area | Skills |
|------|--------|
| **Nx** | Generate apps/libs, share types, run affected tests, wire project graph |
| **React** | Container/presentational split, forms, optimistic UI patterns |
| **Redux** | Slices, selectors, normalized state, devtools |
| **RTK Query** | API slices, cache tags, invalidation, loading/error states |
| **Express** | REST routing, validation middleware, error mapping |
| **MongoDB** | Schemas, indexes, transactions where needed |
| **ORM** | Model definitions, queries, migrations/seed scripts |
| **Tailwind** | Layout, responsive admin dashboard, accessible forms |

---

## 2. Tech stack

| Layer | Choice | Notes |
|-------|--------|-------|
| Monorepo | **Nx** (latest stable) | `pnpm` or `npm` workspaces |
| Frontend app | **React** + **Vite** (via `@nx/react`) | `apps/web` |
| State | **Redux Toolkit** | `libs/store` or colocated in `apps/web` |
| Server state | **RTK Query** (`@reduxjs/toolkit/query/react`) | Replaces ad-hoc `fetch` + manual cache |
| Styling | **Tailwind CSS** | PostCSS in `apps/web` |
| API | **Express** + **TypeScript** | `apps/api` |
| Database | **MongoDB** (local Docker or Atlas) | Connection via env |
| ORM | **Mongoose** (recommended) | Native MongoDB ODM; alternative: **Prisma** with MongoDB provider |
| Shared types | **TypeScript lib** | `libs/shared-types` — enums + DTOs from domain |
| Tests | **Vitest** (frontend/libs), **Jest** or **Vitest** (api) | Port `./refer/event-system.test.ts` scenarios to API integration tests |

---

## 3. Nx workspace layout

```
event-platform/
├── apps/
│   ├── web/                 # React + Redux + RTK Query + Tailwind
│   └── api/                 # Express layers + Mongoose repositories
│       └── src/             # routes, controllers, services, repositories, models
├── libs/
│   ├── shared-types/        # Skill, EventType, API contracts, result codes
│   ├── domain/              # Validators, use-cases, repository ports (no Mongoose)
│   └── ui/                  # Optional shared Tailwind components
├── docker-compose.yml       # MongoDB for local dev
└── .env.example
```

**Nx targets (minimum):**

- `nx serve web` — dev UI on e.g. `:4200`
- `nx serve api` — API on e.g. `:3333`
- `nx test api` — integration tests mirroring `./refer/event-system.test.ts`
- `nx test web` — component + slice tests
- `nx affected -t test` — CI-style runs

**Project boundaries:**

- `libs/shared-types` must not import from `apps/*`.
- Domain rules live in `libs/domain` use-cases (pure TS, repository ports); `apps/api` services orchestrate persistence — **do not duplicate business rules in routes or UI**.
- **Do not** ship the kata `EventSystem` in-memory arrays as production storage.
- RTK Query endpoints consume the same DTOs as the API returns.

---

## 4. Domain model (from `./refer/event-system.ts`)

### 4.1 Enumerations

```ts
type Skill = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
type EventType = "WORKSHOP" | "WEBINAR" | "CONFERENCE";
```

### 4.2 Entities

| Entity | Fields | Persistence notes |
|--------|--------|-------------------|
| **Event** | `id`, `type`, `capacity`, `skill?`, `participantIds[]` | `participantIds` can be embedded or separate `Registration` collection; waitlist must preserve order |
| **Participant** | `id`, `email`, `skill?` | Unique index on `email` (tutorial extension) |
| **WaitlistEntry** | `eventId`, `participantId`, `position` or `createdAt` | FIFO: use `createdAt` ascending or explicit `position` |

**ID generation (reference):** In-memory code uses `Date.now().toString()`. In MongoDB use `ObjectId` or UUID; API must return stable string ids.

### 4.3 Return codes (API contract)

All mutating operations use the same semantic codes as the reference class:

| Code | Meaning |
|------|---------|
| `1` | Success |
| `0` | Waitlisted (registration only) |
| `-1` | Validation / not found / business rule failure |

**HTTP mapping (recommended):**

| Code | HTTP | Body shape |
|------|------|------------|
| `1` | `200` / `201` | `{ result: 1, data?: T }` |
| `0` | `200` | `{ result: 0, data?: T }` |
| `-1` | `400` or `404` | `{ result: -1, error?: string }` |

Tutorial should keep `result` in JSON so frontend logic matches the kata tests.

---

## 5. Functional requirements

Derived from `./refer/event-system.ts` and `./refer/event-system.test.ts`. Each item must have **API integration test** coverage equivalent to the reference tests.

### 5.1 `addEvent(type, capacity, skill?)`

| Rule | Expected |
|------|----------|
| Invalid `type` (not WORKSHOP \| WEBINAR \| CONFERENCE) | `-1`, no event created |
| `capacity <= 0` | `-1` |
| **WORKSHOP** without `skill` | `-1` |
| **WORKSHOP** with invalid skill (e.g. `EXPERT`) | `-1` |
| **WORKSHOP** with valid skill | `1`, event stored with `skill` |
| **WEBINAR** / **CONFERENCE** without skill | `1`, `skill` undefined |
| Skill provided for non-WORKSHOP but invalid enum | `-1` |
| Skill provided for non-WORKSHOP and valid enum | `1` (optional skill stored or ignored per product choice; reference allows valid skill on any type if `validateSkill` passes) |

**Reference `validateSkill` logic:**

- Non-WORKSHOP + no skill → valid.
- Any type + valid skill enum → valid.
- WORKSHOP without skill → invalid.

### 5.2 `addParticipant(email, skill?)`

| Rule | Expected |
|------|----------|
| Missing / empty `email` | `-1` |
| Invalid `skill` when provided | `-1` |
| Email only | `1`, participant without `skill` |
| Email + valid skill | `1`, participant with `skill` |

### 5.3 `registerParticipant(participantId, eventId)`

| Rule | Expected |
|------|----------|
| Unknown event or participant | `-1` |
| Already registered for event | `-1` |
| Already on waitlist for same event | `-1` |
| **CONFERENCE** | Email must contain `@business.org` OR `@company.com`; else `-1` |
| **WORKSHOP** | `participant.skill` must equal `event.skill`; else `-1` |
| **WEBINAR** | Any participant with valid email registration path | `1` when capacity available |
| At capacity | Add to waitlist, return `0`; registered list unchanged |
| Waitlist ordering | **FIFO per event** (first waitlisted promoted first) |

### 5.4 `cancelRegistration(participantId, eventId)`

| Rule | Expected |
|------|----------|
| Unknown event | `-1` |
| Not registered and not on waitlist | `-1` |
| On waitlist only | Remove from waitlist, return `1`; no promotion |
| Registered | Remove from event; **promote first waitlisted** (FIFO) via same rules as `registerParticipant`; return `1` |

**Promotion edge cases to test:**

- Promoted user must pass CONFERENCE email / WORKSHOP skill rules (re-use `registerParticipant` internally as reference does).
- If promotion fails rules, tutorial should define behavior (reference recursively calls `registerParticipant` — document failure handling).

---

## 6. REST API surface (Express)

Base path: `/api/v1`

| Method | Path | Maps to |
|--------|------|---------|
| `POST` | `/events` | `addEvent` |
| `GET` | `/events` | List events (tutorial UI) |
| `GET` | `/events/:id` | Event detail + registrations count |
| `POST` | `/participants` | `addParticipant` |
| `GET` | `/participants` | List (admin) |
| `POST` | `/events/:eventId/registrations` | `registerParticipant` body: `{ participantId }` |
| `DELETE` | `/events/:eventId/registrations/:participantId` | `cancelRegistration` |
| `GET` | `/events/:eventId/waitlist` | Ordered waitlist (admin) |

**Validation middleware:** `zod` or `express-validator` aligned with `libs/shared-types`.

**ORM layer:** Mongoose schemas for `Event`, `Participant`, `WaitlistEntry` with indexes:

- `WaitlistEntry`: compound `{ eventId: 1, createdAt: 1 }`
- `Participant`: unique `{ email: 1 }`

---

## 7. Redux + RTK Query architecture

### 7.1 Redux store structure

```ts
// Illustrative shape — normalize in tutorial
{
  ui: { /* modals, selectedEventId */ },
  // Server state lives in RTK Query cache — avoid duplicating events/participants in manual slices unless needed for optimistic updates
}
```

### 7.2 RTK Query API slice (`eventApi`)

| Endpoint | Type | Tags |
|----------|------|------|
| `getEvents` | query | `['Event']` |
| `getEventById` | query | `['Event', id]` |
| `createEvent` | mutation | invalidates `Event` |
| `getParticipants` | query | `['Participant']` |
| `createParticipant` | mutation | invalidates `Participant` |
| `registerForEvent` | mutation | invalidates `Event`, `Waitlist` |
| `cancelRegistration` | mutation | invalidates `Event`, `Waitlist` |
| `getWaitlist` | query | `['Waitlist', eventId]` |

**Tutorial exercises:**

1. Show loading/error UI from `isLoading` / `isError` hooks.
2. Map `result: -1` from API to toast or inline form errors without throwing in RTK Query (custom `transformResponse` or error handling in `queryFn`).
3. Use `optimisticUpdate` optionally on cancel/register (advanced step).

### 7.3 Redux slices (minimal)

- `uiSlice`: selected event, filters (type, skill), sidebar state.
- Avoid storing full server lists in a manual `eventsSlice` if RTK Query cache is sufficient.

---

## 8. React UI (Tailwind)

### 8.1 Pages / views

| View | Features |
|------|----------|
| **Dashboard** | Cards: total events, participants, waitlist depth |
| **Events** | Table: type, capacity, filled, skill; create event form |
| **Event detail** | Register participant dropdown; show registered + waitlist; cancel buttons |
| **Participants** | Create participant; skill badge |

### 8.2 UX requirements

- Display API `result` codes in dev-friendly way (success / waitlisted / error).
- **Waitlisted (`0`):** distinct yellow banner — “Added to waitlist”.
- **CONFERENCE:** helper text for allowed domains.
- **WORKSHOP:** filter participants by matching skill in UI (still enforce server-side).
- Responsive layout (`md:grid`, mobile stack).
- Accessible forms: labels, `aria-invalid`, focus rings (`focus:ring-2`).

### 8.3 Tailwind conventions

- Use `@apply` sparingly; prefer utility classes in components.
- Shared `libs/ui` optional: `Button`, `Badge`, `DataTable` with variant props.

---

## 9. Non-functional requirements

| Category | Requirement |
|----------|-------------|
| **Type safety** | End-to-end types from `libs/shared-types`; no `any` in API handlers |
| **Test parity** | Every `describe` block in `./refer/event-system.test.ts` has an API-level equivalent |
| **Idempotency** | Duplicate register returns `-1` (not double waitlist entries) |
| **Concurrency** | Document: use MongoDB transaction or `findOneAndUpdate` with capacity check for register-at-capacity (tutorial “stretch goal”) |
| **Security** | No auth in v1; CORS enabled for `web` origin only |
| **Config** | `MONGODB_URI`, `PORT`, `CORS_ORIGIN` via `.env` |
| **Observability** | Request logging middleware; structured error handler |
| **Dev experience** | Single `docker compose up` for Mongo; README with `nx` commands |
| **Performance** | Indexes on `eventId`, `email`; paginate list endpoints (stretch) |

---

## 10. Tutorial phases (suggested order)

### Phase 0 — Scaffold

- `npx create-nx-workspace@latest` with React app + Node/Express app.
- Add `libs/shared-types`, Docker MongoDB, Tailwind to `web`.

### Phase 1 — Domain (validators, ports, use-cases)

- Extract validators from `./refer/event-system.ts`; implement use-cases that call repository **ports** (no in-memory app database).
- Unit-test use-cases with **fake repositories** in `domain/src/testing/`; scenarios mirror `./refer/event-system.test.ts`.

### Phase 2 — API + ORM

- Mongoose models + repository implementations of domain ports.
- Express: routes → controllers → application services → use-cases.
- Supertest integration tests against test MongoDB; scenarios from refer tests (real ObjectIds, no fake timers).

### Phase 3 — RTK Query + Redux

- Configure store in `apps/web`.
- Implement `eventApi` slice; connect pages to hooks.

### Phase 4 — UI polish

- Tailwind dashboard; waitlist and result-code feedback.
- Optional: Redux DevTools + RTK Query devtools.

### Phase 5 — Stretch goals

- Auth (JWT), email uniqueness, pagination, OpenAPI spec, e2e with Playwright (`@nx/playwright`).

---

## 11. Acceptance criteria checklist

Use this when the tutorial is “done”:

- [ ] Nx workspace serves `web` and `api` concurrently.
- [ ] MongoDB persists events, participants, waitlist FIFO order.
- [ ] All **§5** rules enforced server-side; UI cannot bypass them.
- [ ] API tests cover: invalid types, capacity, WORKSHOP skill, CONFERENCE email, waitlist `0`, duplicate register, FIFO waitlist, cancel from waitlist, cancel with FIFO promotion.
- [ ] RTK Query fetches and mutates with cache invalidation.
- [ ] Redux DevTools shows `ui` slice updates.
- [ ] Tailwind UI shows create/register/cancel flows with clear feedback for `1`, `0`, `-1`.
- [ ] Layered API (routes/controllers/services/repositories); domain use-cases + ports; no production `EventSystem` arrays.
- [ ] Mongoose repositories implement ports; handlers do not embed business rules.

---

## 12. Mapping reference tests → API tests

| Reference test (`./refer/event-system.test.ts`) | API test name (suggested) |
|----------------------------------------|---------------------------|
| `addEvent > rejects invalid event type` | `POST /events` invalid type → 400, result -1 |
| `addEvent > rejects non-positive capacity` | capacity 0, -3 |
| `addEvent > requires valid skill for WORKSHOP` | missing skill, EXPERT, BEGINNER ok |
| `addEvent > allows WEBINAR without skill` | no skill field |
| `addEvent > allows CONFERENCE without skill` | |
| `addEvent > rejects invalid skill when provided for non-WORKSHOP` | WEBINAR + NOPE |
| `addParticipant > rejects missing email` | |
| `addParticipant > rejects invalid skill` | |
| `addParticipant > creates participant with email only` | |
| `addParticipant > creates participant with email and skill` | |
| `registerParticipant > rejects unknown event or participant` | |
| `registerParticipant > rejects duplicate registration` | |
| `registerParticipant > rejects when already on waitlist` | |
| `registerParticipant > CONFERENCE requires allowed email domain` | |
| `registerParticipant > WORKSHOP requires matching skill` | |
| `registerParticipant > WEBINAR allows any email` | |
| `registerParticipant > waitlists when at capacity` | result 0 + waitlist doc |
| `registerParticipant > waitlist is FIFO` | order [pB, pC] |
| `cancelRegistration > rejects unknown event` | |
| `cancelRegistration > rejects when not registered` | |
| `cancelRegistration > removes from waitlist only` | |
| `cancelRegistration > promotes first waitlisted (FIFO)` | pA cancel → pB registered |

---

## 13. Commands cheat sheet (for README generation)

```bash
# Workspace
npx create-nx-workspace@latest event-platform --preset=apps

# Generate
nx g @nx/react:app web
nx g @nx/node:application api
nx g @nx/js:lib shared-types
nx g @nx/js:lib domain

# Dev
docker compose up -d
nx serve api
nx serve web

# Verify
nx test api
nx test domain
```

---

## 14. References in this repo

| File | Role |
|------|------|
| `./refer/event-system.ts` | Business rules reference (not architecture to copy) |
| `./refer/event-system.test.ts` | Acceptance scenarios for domain + API tests |
| `plan.md` | Tutorial steps and Express layering |
| `spec.md` | This document (NFRs, API surface, rules) |

**Rule disputes:** match `./refer/`. **Architecture:** match `plan.md`.
