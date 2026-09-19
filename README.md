# ARMI — AI Relationship & Meeting Intelligence

> Meeting-booking and relationship-intelligence platform, initially built for Comfinity Technologies.

## Quick Start

### 1. Clone & Install
```bash
cd "Booking system/armi"
npm install
```

### 2. Set Environment Variables
Copy `.env.example` to `.env.local` and fill in:
- `DATABASE_URL` — Supabase PostgreSQL connection string
- `DIRECT_URL` — Supabase direct connection (for migrations)
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — Google OAuth credentials
- `ANTHROPIC_API_KEY` — Claude API key from console.anthropic.com
- `RESEND_API_KEY` — Resend email API key
- `NEXT_PUBLIC_APP_URL` — e.g. `https://meeting.comfinity.com`
- `NEXT_PUBLIC_TENANT_SLUG` — `comfinity`
- `ENCRYPTION_KEY` — generate with `openssl rand -hex 32`

### 3. Set up Database (Supabase)
1. Create a project at [supabase.com](https://supabase.com)
2. Copy connection strings to `.env.local`
3. Push schema: `npm run db:push`
4. Seed data: `npx prisma db seed`

### 4. Run Locally
```bash
npm run dev
```
Open http://localhost:3000

---

## Project Structure

```
armi/
├── app/
│   ├── page.tsx                          # Landing — employee cards
│   ├── [employeeSlug]/
│   │   ├── page.tsx                      # Employee + meeting type selection
│   │   └── [meetingTypeSlug]/
│   │       ├── page.tsx                  # Calendar & slot picker (server)
│   │       ├── CalendarClient.tsx        # Calendar UI (client)
│   │       └── questions/
│   │           └── page.tsx              # AI pre-meeting questions
│   ├── confirmation/[bookingId]/
│   │   └── page.tsx                      # Booking confirmed
│   ├── reschedule/[token]/page.tsx       # Rescheduling flow
│   ├── cancel/[token]/page.tsx           # Cancellation flow
│   ├── admin/                            # Admin panel (Sprint 4)
│   └── api/
│       ├── bookings/available-slots/     # GET: time slots
│       ├── bookings/create/              # POST: create booking
│       ├── bookings/reschedule/[token]/  # POST: reschedule
│       ├── bookings/cancel/[token]/      # POST: cancel
│       ├── ai/pre-meeting-questions/     # POST: Claude questions
│       ├── ai/generate-brief/            # POST: Claude brief
│       ├── ai/generate-notes/            # POST: Claude notes
│       └── auth/google/callback/         # Google Calendar OAuth
├── lib/
│   ├── prisma.ts                         # Prisma client singleton
│   ├── ai.ts                             # Claude (Anthropic) integration
│   ├── email.ts                          # Resend email templates
│   ├── google-calendar.ts               # Google Calendar API
│   ├── slots.ts                          # Availability computation
│   ├── encryption.ts                     # AES-256-GCM for tokens
│   └── utils.ts                          # Helpers + timezone list
├── prisma/
│   ├── schema.prisma                     # Full 13-table schema
│   └── seed.ts                           # Dev seed data
└── prisma.config.ts                      # Prisma 7 DB config
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL via Supabase |
| ORM | Prisma 7 |
| Auth | NextAuth.js v5 |
| AI | Anthropic Claude (claude-sonnet-4-5) |
| Email | Resend |
| Calendar | Google Calendar API + Google Meet |
| Hosting | Vercel |
| Styling | Tailwind CSS v4 |

---

## Sprint Plan

| Sprint | Focus | Status |
|---|---|---|
| 1 | Core booking flow (public pages + APIs) | ✅ In Progress |
| 2 | Google Calendar integration | ⏳ Next |
| 3 | AI pre-meeting assistant | ⏳ Upcoming |
| 4 | Admin panel | ⏳ Upcoming |
| 5 | Post-meeting intelligence | ⏳ Upcoming |
| 6 | Reviews, polish, launch | ⏳ Upcoming |

---

## Key Design Decisions

- **Multi-tenant from day 1** — Every DB table has `tenant_id`. Comfinity is tenant #1.
- **Human-in-the-loop AI** — AI generates meeting notes; admin reviews before sending.
- **Graceful degradation** — Calendar failures don't break bookings. AI failures use fallbacks.
- **Google-first** — Google Calendar + Google Meet only (Sprint 1 uses mock availability).

---

## Environment Setup Checklist

- [ ] Supabase project created
- [ ] `DATABASE_URL` set in `.env.local`
- [ ] Schema pushed: `npm run db:push`
- [ ] Seed data loaded: `npx prisma db seed`
- [ ] Google Cloud project created with Calendar API enabled
- [ ] OAuth consent screen configured
- [ ] `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set
- [ ] Anthropic API key obtained
- [ ] Resend account created + domain verified
- [ ] Vercel project connected

---

*Built with ARMI — Comfinity Technologies*
