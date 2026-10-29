# DeskPilot Console

**The operator console for [DeskPilot](https://github.com/devpayoub/DeskPilot-Backend) — an IT helpdesk agent that investigates real machines and cannot change anything without a human approving it.**

![next](https://img.shields.io/badge/Next.js-16-black)
![react](https://img.shields.io/badge/React-19-61DAFB)
![typescript](https://img.shields.io/badge/TypeScript-strict-3178C6)
![tailwind](https://img.shields.io/badge/Tailwind-v4-06B6D4)

Nine screens over a real API: a ticket queue, a **live agent trace**, an approval inbox with dry-run previews, and an audit log that keeps the refusals.

---

## Contents

- [What this is](#what-this-is)
- [Stack](#stack)
- [Screens](#screens)
- [How it talks to the API](#how-it-talks-to-the-api)
- [Getting started](#getting-started)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Project structure](#project-structure)
- [Design decisions](#design-decisions)
- [Roles and capabilities](#roles-and-capabilities)
- [Conventions](#conventions)

---

## What this is

This is the UI half of DeskPilot. It is an **operator console**, not a marketing site and not a chatbot: it is what a service-desk technician looks at while an agent works.

The API lives in a separate repository. This app is useless without it — every screen is server-rendered from real data, and there are no mocks or fixtures in the app itself.

---

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, React Server Components, Turbopack) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (`radix-nova`) |
| Data | Server Components fetching over `serverFetch`; every table is server-rendered |
| State | URL search params for filters and paging; Zustand only for UI preferences (theme, layout) |
| Tooling | TypeScript strict, Biome (lint + format) |

The template ships TanStack Query, TanStack Table and Recharts. **The screens here use none of them** — data arrives already resolved from the server, tables are composed from the shadcn `Table` primitives, and pagination is a set of links rather than client-side state. They remain in `package.json` because removing a dependency the template's remaining primitives reference is a larger change than it is worth; nothing on these screens depends on them.

---

## Screens

| Screen | Route | What it answers |
|---|---|---|
| **Overview** | `/dashboard/overview` | Auto-resolution rate, open tickets, pending approvals, **blocked actions**, p95 latency, cost per run, latest eval gate |
| **Tickets** | `/dashboard/tickets` | The queue, with the agent's verdict and confidence per row |
| **Ticket detail** | `/dashboard/tickets/[id]` | The reported problem, the diagnosis, and the **live agent trace** — run the agent and watch steps arrive |
| **Approvals** | `/dashboard/approvals` | Each proposed write with its risk class, dry-run preview, argument hash and expiry — approve or reject with a note |
| **Tools** | `/dashboard/tools` | All 17 tools: risk class, whether approval is required, which roles may call it, and an on/off switch |
| **Audit log** | `/dashboard/audit` | Every attempt **including denials**, filterable, with actor, outcome, latency and trace id |
| **Evaluations** | `/dashboard/evals` | Golden-set runs with triage accuracy, tool precision/recall, unsafe-action rate and the gate verdict |
| **Directory** | `/dashboard/directory` | The account tenant: enabled/disabled, lockout state, groups, assigned device |
| **Settings** | `/dashboard/settings` | Kill-switch state and what each state means, SAFE_MODE, the model in use |

---

## How it talks to the API

### No token ever reaches JavaScript

The browser never calls Django. It calls a **BFF route** on this server, which attaches the httpOnly session cookie and forwards the request:

```
Browser ──▶ /api/bff/tickets/  (cookie, same-origin)
                 │
                 ▼  Authorization: Bearer <from cookie>
            http://127.0.0.1:8010/api/v1/tickets/
```

Why this shape:

- **The access token lives in an httpOnly cookie.** An XSS bug cannot exfiltrate a session, because there is no token in `localStorage` or in a readable cookie.
- **The BFF is not an open proxy.** `src/app/api/bff/[...path]/route.ts` checks the first path segment against an allowlist (`tickets`, `runs`, `tools`, `guardrails`, `evals`, `directory`, `stats`) and rejects unsafe segments before building a URL.
- **Refresh happens in the proxy**, not in a Server Component — RSC cannot set cookies, so refreshing there would silently discard the rotated token and log the user out.

### The live trace

The ticket page opens a WebSocket to the API for step-by-step updates. Two details matter:

**The socket is a change signal, not a data channel.** When a message arrives, the component refetches the run over REST and lets that response drive the UI. Merging the socket payload into local state would mean two shapes for the same step — and the moment they drift, the trace starts lying.

**The token is minted per run.** A browser cannot set headers on a WebSocket handshake, so the token rides in the query string where proxies log it. Handing out the *session* token for that would be indefensible. Instead the app calls `POST /runs/{id}/ws-ticket/` and gets a token valid for 60 seconds against that one run.

Polling runs alongside the socket on purpose: the socket needs the API reachable over WebSockets, an unexpired ticket and a same-network browser. Polling needs none of those, so the trace still updates — it just says `polling` instead of `live`.

### Pagination

List endpoints return `{count, next, previous, page, page_size, results}`. The pager is a set of links, so pages are shareable and the back button works.

`serverFetchPage()` handles the one case an API cannot: DRF answers an out-of-range page with `404 Invalid page`, which is correct for an API and wrong for a page — rows get deleted, links go stale, someone types a number into the URL. It retries once at page 1.

---

## Getting started

You need the API running first.

```bash
# terminal 1 — the API (from the backend repository)
cd backend
.venv/Scripts/python -m daphne -b 127.0.0.1 -p 8010 config.asgi:application

# terminal 2 — this app
cp .env.example .env.local
npm install
npm run dev          # http://localhost:3001
```

Sign in with the demo administrator: `admin@deskpilot.test` / `DeskPilot!2026`.

> **Port 3001, not 3000.** 3000 is commonly taken by another local project; `dev` and `start` pin the port so the app never silently hops.

---

## Configuration

Two variables, both server-side. There is deliberately **no** `NEXT_PUBLIC_*` API URL — the browser has no business knowing where the API lives.

| Variable | Example | Purpose |
|---|---|---|
| `API_BASE_URL` | `http://127.0.0.1:8010` | Where the BFF forwards to |
| `APP_URL` | `http://localhost:3001` | Used for absolute links in server code |
| `NEXT_PUBLIC_WS_URL` | `ws://127.0.0.1:8010` | The trace socket. Public, and contains no secret — the token is minted per run |

`src/lib/env.ts` validates these at import time and throws with a readable message rather than failing later with `undefined`.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Development server on `:3001` |
| `npm run build` | Production build |
| `npm run start` | Serve the production build on `:3001` |
| `npm run lint` | Biome lint |
| `npm run format` | Biome format |
| `npm run check` | Biome lint + format check |

> If `npm run build` fails with a delete-guard error while cleaning `.next`, move that directory aside first and rebuild.

---

## Project structure

```
src/
  app/
    (main)/auth/            Sign-in
    (main)/dashboard/       The nine screens, one folder each
      _components/          Shared shell: sidebar, header, switchers
      tickets/[id]/         Ticket detail + live trace
    api/
      auth/                 login, logout, me, refresh
      bff/[...path]/        The single forwarding route
  components/
    ui/                     shadcn primitives — do not edit
    pagination-bar.tsx
    page-header.tsx
  lib/
    api/                    client (browser), server (RSC), errors, DTOs
    auth/                   cookies, session, capabilities
    tenant/                 Workspace guard
  navigation/sidebar/       Navigation definition
  proxy.ts                  Token refresh (Next 16 middleware)
```

Screens keep their components in a co-located `_components/` folder until something is genuinely reused elsewhere.

---

## Design decisions

**Capabilities gate the UI; the API gates the action.** `src/lib/auth/capabilities.ts` maps the four roles to capabilities so the app can hide a button. It is a presentation aid only: every action is re-checked server-side. A drift bug here can hide a control but never grant access.

**`null` is not `0`.** When a run has no price row, cost renders as `unknown`, not `$0.0000`. When the directory backend cannot report lockout state (LDAP without ppolicy), it renders `lockout unknown`, not `unlocked`. A plausible-looking zero silently corrupts every average built on it.

**A denial is a warning, not an error.** A refused tool call is the guardrail working. The audit log colours it amber, and the Overview has a dedicated "blocked actions" panel with a link to `?outcome=denied`. A console that only showed successes would hide the most interesting thing the system does.

**The switch is optimistic, with rollback.** People flip toggles quickly; a spinner per row reads as broken. If the request fails the switch snaps back and the reason appears next to it.

**After a decision, refetch — don't splice state.** Approving an item calls `router.refresh()` so the row disappears because the server no longer returns it, not because we edited an array.

**One synthetic workspace.** The API returns exactly one membership, which keeps the workspace guard and the switcher working without pretending DeskPilot is multi-tenant.

---

## Roles and capabilities

The four roles are the real IT support ladder, not an alphabetical list:

| Role | Can |
|---|---|
| `REQUESTER` | See their own tickets |
| `SERVICE_DESK` | Read tickets, tools, approvals, audit, usage |
| `TECHNICIAN` | Trigger runs, invoke tools, **decide approvals**, read the directory |
| `ADMIN` | Manage tool policies and the kill switch, read evaluations |

A service desk user sees the Approvals screen but no buttons, with an explicit note saying why. A technician sees the buttons — and still gets a `403` if they try to approve a destructive change on a ticket they raised themselves.

---

## Conventions

- TypeScript strict; no `any`.
- Biome: double quotes, semicolons, two-space indent, sorted imports, 120-character lines.
- `src/components/ui/` is vendored shadcn — style around it, don't edit it.
- Pages are Server Components by default; interactivity moves into a named Client Component.
- Semantic theme tokens only, so every screen works in light mode, dark mode and the shipped presets.

---

## Known limitations

1. **The API must be running.** Every screen is server-rendered from live data; there is no offline or mock mode.
2. **Approvals do not appear on their own.** A run only pauses for approval when the agent proposes a write — and the free LLM tier used in development requires a daily check-in, so runs fail with `402` until that is done. The trace reports the provider's message verbatim.
3. **The kill switch is read-only here.** Changing it is a `POST` to the API; the console shows the current state and what it means.
