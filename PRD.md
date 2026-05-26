# Rhank — Product Requirements Document (PRD)

**Last updated:** 2026-05-26

## 1. Summary

Rhank is a lightweight, shareable leaderboard / competition platform built with Next.js and Supabase. Users create "Rhanks" (leaderboards) that accept either numeric entries (score) or token balances. Features include: public/embed leaderboards, member management, token transactions, entry moderation, webhooks, email digests, and scheduled resets.

## 2. Problem Statement

Teams, communities, and local groups need a simple, minimal way to run leaderboards or point systems without building bespoke tooling. Rhank provides an opinionated, easy-to-share leaderboard with token support, embed code, and automation hooks.

## 3. Target Users

- Community moderators running recurring leaderboards
- Small teams rewarding members with tokens/points
- Event organizers wanting public leaderboards and embeds
- Developers who want webhooks and an API to integrate with other systems

## 4. Goals / Success Metrics

- Core: Create, join, and submit to a Rhank in < 3 steps
- Adoption: X weekly active Rhanks in first 3 months
- Engagement: At least 30% of followers receive weekly digests (email deliverability via Resend)
- Reliability: 99% uptime for API endpoints and digest cron

## 5. Core Features

- Rhank creation & settings
  - Create public Rhanks (title, description, unit, type: `score` or `token`, join mode, reset schedule)
  - File: [app/api/rhanks/route.ts](app/api/rhanks/route.ts)

- Public leaderboard & embed
  - Public page and embeddable iframe snippet
  - Files: [app/embed/[slug]/page.tsx](app/embed/[slug]/page.tsx), [components/EmbedSnippet.tsx](components/EmbedSnippet.tsx)

- Entries (score type)
  - Submit entries, optional moderation workflow
  - Files: [app/api/rhanks/[slug]/entries/route.ts](app/api/rhanks/[slug]/entries/route.ts)

- Members & token economy (token type)
  - Join, owner-add members, award/deduct tokens, token transactions
  - Files: [app/api/rhanks/[slug]/members/route.ts](app/api/rhanks/[slug]/members/route.ts), [app/api/rhanks/[slug]/tokens/route.ts](app/api/rhanks/[slug]/tokens/route.ts)

- Invitations & join modes
  - Invite tokens, open/request/invite modes
  - Files: [app/api/rhanks/[slug]/invite/route.ts](app/api/rhanks/[slug]/invite/route.ts)

- Moderation & approvals
  - Owner can approve/reject pending entries and members
  - Files: [app/api/rhanks/[slug]/entries/[entryId]/route.ts](app/api/rhanks/[slug]/entries/[entryId]/route.ts), [app/api/rhanks/[slug]/members/[memberId]/route.ts](app/api/rhanks/[slug]/members/[memberId]/route.ts)

- Webhooks
  - Owner-configurable webhooks for events (`entry.created`, `member.joined`, `member.approved`) and HMAC signing
  - Files: [lib/fireWebhooks.ts](lib/fireWebhooks.ts), [app/api/rhanks/[slug]/webhooks/route.ts](app/api/rhanks/[slug]/webhooks/route.ts)

- Digest emails & notifications
  - Cron-driven weekly digests built with Resend; protectable by `CRON_SECRET`
  - Files: [app/api/cron/digest/route.ts](app/api/cron/digest/route.ts), [app/api/notify/route.ts](app/api/notify/route.ts)

- Scheduled resets
  - Weekly/monthly resets for rhanks (entries deletion or token resets)
  - Files: [app/api/cron/reset/route.ts](app/api/cron/reset/route.ts)

- Admin / Owner actions
  - Claiming ownerless Rhanks, deleting Rhanks (clean cascade), managing webhooks
  - Files: [app/api/rhanks/[slug]/route.ts](app/api/rhanks/[slug]/route.ts), [app/api/rhanks/[slug]/webhooks/[webhookId]/route.ts](app/api/rhanks/[slug]/webhooks/[webhookId]/route.ts)

## 6. Technical Architecture

- Frontend: Next.js 13 (App Router) + React components in `/components`
  - Entry points: [app/page.tsx](app/page.tsx), multiple `app/*/page.tsx` routes

- Backend: Next.js serverless route handlers in `app/api/*` backed by Supabase (client + service role for admin tasks)
  - Supabase client usage: [lib/supabase.ts](lib/supabase.ts)
  - Admin (service role) usage where needed: createClient in API routes

- Database: Supabase/Postgres with migrations in `supabase/migrations/` (see files `001_entry_reactions.sql`, `002_follows.sql`, etc.)

- Email: Resend service used for digests and notify list
  - Protected by environment keys: `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`

- Security
  - Public and admin flows separated: public anon keys used on client (`NEXT_PUBLIC_SUPABASE_ANON_KEY`), service-role key used server-side (`SUPABASE_SERVICE_ROLE_KEY`)
  - Cron endpoints verify `CRON_SECRET` header or query param
  - Webhooks signed with HMAC using stored secret (see `lib/fireWebhooks.ts`)

- Deploy: Vercel-ready (`vercel.json`) using environment variables for secrets

## 7. Data Model (high level)

Reference types in [lib/supabase.ts](lib/supabase.ts). Key tables:
- `rhanks` — meta for leaderboards (slug, settings, owner id, type, invites, reset schedule)
- `entries` — score submissions (value, proof_url, status)
- `members` — token members and balances
- `token_transactions` — ledger of token awards/deductions
- `webhooks` — webhook endpoints, secret, active flag, events
- `rhank_follows` — follower relationships (used for digests)

Database migrations live in [supabase/migrations/](supabase/migrations/).

## 8. APIs (public summary)

- Create Rhank: `POST /api/rhanks` — authenticated
- Rhank details & management: `GET|PATCH|DELETE /api/rhanks/:slug` — read public, writes require ownership
- Entries: `POST /api/rhanks/:slug/entries` — create; moderation via PATCH
- Members: `GET|POST /api/rhanks/:slug/members` — join, owner-add
- Tokens: `POST|GET /api/rhanks/:slug/tokens` — award/deduct and list transactions
- Webhooks management: `GET|POST /api/rhanks/:slug/webhooks` (owner only)
- Digest cron: `GET /api/cron/digest?secret=...` (cron only)

(See actual route implementations under `app/api/*`)

## 9. UX / User Flows (condensed)

- Create a Rhank: user signs up → new rhank form → slug generated → owner lands on Rhank page
- Join Rhank: user clicks Join → depending on `join_mode` becomes `active` or `pending` → owner approves pending
- Submit entry: participant posts value → if moderation enabled, entry is `pending` → owner approves → entry shows on leaderboard
- Award tokens: owner posts token transaction → `token_transactions` recorded → member `balance` updated
- Webhooks: owner configures endpoint → events posted with HMAC signature
- Embed: owner clicks Embed → copy iframe snippet from [components/EmbedSnippet.tsx](components/EmbedSnippet.tsx)

## 10. Non-functional Requirements

- Security: Do not expose service role keys to client; webhooks use HMAC; cron endpoints require secret
- Performance: paginate leaderboard queries (limit + ordering); digest job batches per rhank
- Reliability: retry on email/webhook failures (current implementation sends fire-and-forget)
- Privacy: remove PII from webhook payloads unless owner explicitly requires it

## 11. Monitoring & Metrics

- Track API errors and status codes for critical endpoints (entries, tokens, rhank creation)
- Email deliverability (Resend) and bounce rates
- Webhook delivery success/failure rate and latency

## 12. Milestones & Roadmap (proposed)

- M1 (now): Stabilize core flows (create, join, submit, approve, embed) — current implementation largely complete
- M2 (2–4 weeks): Add admin UI for audits, webhook retry queue, and basic analytics
- M3 (1–2 months): Improve moderation workflows (attachments, bulk approvals), expand digest personalization
- M4 (2–3 months): Teams & grouping improvements, rate limits, paid-tier feature gating

## 13. Risks & Mitigations

- Risk: Webhook abuse or secret leakage — Mitigate: rotate webhook secrets, provide webhook test tools, rate-limit webhook deliveries
- Risk: Email deliverability failures — Mitigate: monitor Resend metrics, handle retries and fallback
- Risk: Data loss on resets — Mitigate: provide soft-delete/export endpoint and admin confirmation step

## 14. Open Questions

- What are target KPIs for early adopters (numbers for adoption/engagement)?
- Should webhooks include more context by default, or be minimal and opt-in for extra fields?
- Are there plans for SSO or organization-level access (teams) beyond single-owner Rhanks?

## 15. Next Steps

- Review PRD and confirm priority features
- Add missing API docs or OpenAPI spec for public consumption
- Implement monitoring, webhook retry queue, and admin audit UI

---

References (key implementation files):
- [lib/supabase.ts](lib/supabase.ts)
- [lib/fireWebhooks.ts](lib/fireWebhooks.ts)
- [app/api/rhanks/route.ts](app/api/rhanks/route.ts)
- [app/api/cron/digest/route.ts](app/api/cron/digest/route.ts)
- [supabase/migrations/](supabase/migrations/)

