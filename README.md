# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

# Crarity — Product Status Report

_Generated: 2026-04-26_

Legend: ✅ Working · 🚧 Partial · ❌ Missing

---

## 1. Assessment Flow — Academic Counselor

Base route: `/assessment/academic-counselor`

### Pages (registered in `src/App.tsx`)

| Route | Page | Status |
|---|---|---|
| `/assessment/academic-counselor` | `AcademicCounselorAssessment.tsx` (intake / landing) | ✅ |
| `/assessment/academic-counselor/about` | `AcademicCounselorAbout.tsx` | ✅ |
| `/assessment/academic-counselor/start` | `AcademicCounselorStart.tsx` | ✅ |
| `/assessment/academic-counselor/game-1` | `AcademicCounselorGame1.tsx` | ✅ |
| `/assessment/academic-counselor/game-2` | `AcademicCounselorGame2.tsx` | ✅ |
| `/assessment/academic-counselor/game-3` | `AcademicCounselorGame3.tsx` | ✅ |
| `/assessment/academic-counselor/game-4` | `AcademicCounselorGame4.tsx` | ✅ |
| `/assessment/academic-counselor/results` | `AcademicCounselorResults.tsx` | ✅ |

All routes are **public** (no `ProtectedRoute` wrapper) — candidates can take the assessment without auth.

### Per-game behavior

#### Game 1 — Lead Prioritization (`selection`, max 10)
- ✅ Page exists.
- On submit: reads `assessment_sessions.scores`, merges in `game1: { selected, correct, correct_count, score, max_score, submitted_at, time_taken_seconds, auto_submitted }`, then `update({ scores: merged, current_step: "game-2" })`.
- AI scoring: ❌ Not used (deterministic comparison against a fixed correct set).
- Navigation: `fadeNavigate("/assessment/academic-counselor/game-2?session=…")`.

#### Game 2 — Course Knowledge MCQ (`mcq`, max 10)
- ✅ Page exists.
- On submit: merges `game2: { answers, correct_answers, total_questions, total_score, time_viewed, timestamp }` into `scores`, sets `current_step: "game-3"`.
- AI scoring: 🚧 Edge function `score-counselor-answer` exists (Lovable AI Gateway, `google/gemini-3-flash-preview` with tool calling), but the page itself currently uses **deterministic MCQ scoring** based on answer keys (no live invoke of the function in the submit path observed).
- Navigation: `fadeNavigate("/assessment/academic-counselor/game-3?session=…")`.

#### Game 3 — Voice Pitch (`voice`, max 10)
- ✅ Page exists.
- Flow:
  1. Records audio in browser.
  2. Calls edge function `transcribe-pitch` (✅ Lovable AI Gateway, `google/gemini-2.5-flash` multimodal).
  3. Calls edge function `score-counselor-pitch` (✅ Lovable AI Gateway with tool calling, 5-rubric scoring: `opening_context`, `price_handling`, `urgency`, `cta`, `tone`).
  4. Merges `game3: { transcript, audio_duration, rubric_scores, total_score, feedback, timestamp }` into `scores`, sets `current_step: "game-4"`.
- Audio storage: ❌ Audio is only sent to the transcription function — **never persisted** (no storage bucket).
- Navigation: `fadeNavigate("/assessment/academic-counselor/game-4?session=…")`.

#### Game 4 — Refund Response (`text`, max 10)
- ✅ Page exists.
- On submit: invokes edge function `score-counselor-refund` (✅ Lovable AI Gateway, 5-rubric scoring: `empathy`, `policy_communication`, `alternatives`, `threat_handling`, `professionalism`). On failure, falls back to a zeroed score object.
- Merges `game4: { response_text, response_length, rubric_scores, total_score, feedback, time_taken, auto_submitted, timestamp }` into `scores`.
- Sets session `completed: true`, `status: "completed"`, updates `total_score` (sum of all 4 games).
- Navigation: `fadeNavigate("/assessment/academic-counselor/results?session=…")`.

#### After Game 4 → Results
- ✅ `AcademicCounselorResults.tsx` reads the session by id and renders per-game breakdown + total.
- "Submitted" state: ✅ Implicit (session row has `completed = true`, `status = "completed"`).

### Assessment data shape (real example from DB)

```jsonc
{
  "filters": { "experience": "exp_lt6" },
  "game1": { "score": 4, "correct": [...], "selected": [...], "max_score": 10, "correct_count": 1, "submitted_at": "...", "time_taken_seconds": 4, "auto_submitted": false },
  "game2": { "answers": [1,2,1,2], "total_score": 4, "correct_answers": 1, "total_questions": 4, "time_viewed": 15, "timestamp": "..." },
  "game3": { "transcript": "...", "audio_duration": 6, "rubric_scores": { "opening_context":0, "price_handling":0, "urgency":0, "cta":0, "tone":0 }, "total_score": 0, "feedback": "...", "filter": {...}, "timestamp": "..." },
  "game4": { "response_text": "...", "response_length": 1, "rubric_scores": { "empathy":0, "policy_communication":0, "alternatives":0, "threat_handling":0, "professionalism":0 }, "total_score": 0, "feedback": "...", "time_taken": 2, "auto_submitted": false, "timestamp": "..." }
}
```

---

## 2. Supabase Integration

### Tables

| Table | Purpose | RLS |
|---|---|---|
| `assessment_sessions` | Candidate assessment progress + scores | ✅ Public read/write/insert (anon + authenticated) |
| `candidates` | Candidate profile records | ✅ Per-user + employer-via-role visibility |
| `candidate_roles` | Junction: candidate ↔ employer role (status, notes) | ✅ Per-employer + per-candidate |
| `roles` | Employer-defined roles | ✅ Per-user + public-read of `open` roles |
| `interview_requests` | Scheduled interviews | ✅ Per-employer |
| `test_results` | Per-test score rows (separate from assessment_sessions) | ✅ Per-candidate + employer-via-role |
| `profiles` | Employer/user profile | ✅ Per-user |
| `user_roles` | RBAC (`admin`, `student`, `employer`) | ✅ Admin manage + self-view |

### `assessment_sessions` schema

| Column | Type | Nullable | Default |
|---|---|---|---|
| `id` | uuid | no | `gen_random_uuid()` |
| `name` | text | yes | — |
| `phone` | text | yes | — |
| `email` | text | yes | — |
| `city` | text | yes | — |
| `current_step` | text | no | `'game-1'` |
| `scores` | jsonb | no | `'{}'` |
| `created_at` | timestamptz | no | `now()` |
| `updated_at` | timestamptz | no | `now()` |
| `total_score` | int | no | `0` |
| `completed` | bool | no | `false` |
| `role_type` | text | no | `'academic_counselor'` |
| `status` | text | no | `'in_progress'` |

### Sample row (most recent)

```
id           = 00000000-0000-4000-8000-00000debe900
role_type    = academic_counselor
current_step = game-3
total_score  = 0
completed    = true
status       = completed
created_at   = 2026-04-23 11:24:17 UTC
```

### Foreign keys

Inspected via the generated types file (`src/integrations/supabase/types.ts`):

- `candidate_roles.candidate_id` → `candidates.id`
- `candidate_roles.role_id` → `roles.id`
- `interview_requests.candidate_role_id` → `candidate_roles.id`
- `test_results.candidate_id` → `candidates.id`
- ❌ `assessment_sessions` has **no** FK to `candidates` or `roles` — sessions are orphaned from the employer/candidate graph.

### Storage buckets

❌ **None configured.** Voice pitches in Game 3 are sent to the transcription edge function but never persisted — there is no audio archive for employer playback.

---

## 3. Employer Platform

| Route | Status | Notes |
|---|---|---|
| `/dashboard` | ✅ | Real `Dashboard.tsx` |
| `/roles` | ✅ | `Roles.tsx` |
| `/roles/new` | ✅ | `RolesNew.tsx` (3-step creation) |
| `/roles/archived` | 🚧 | `ComingSoon` placeholder |
| `/candidates` | 🚧 | `ComingSoon` placeholder ("All candidates") |
| `/candidates/shortlisted` | 🚧 | `ComingSoon` |
| `/candidates/invited` | 🚧 | `ComingSoon` |
| `/candidates/:id` | ❌ | No detail route registered |
| `/interviews`, `/interviews/completed` | 🚧 | `ComingSoon` |
| `/settings` | ✅ | `Settings.tsx` |
| `/settings/notifications` | 🚧 | `ComingSoon` |

- Employer ↔ candidate assessment link: ❌ **Missing.** `assessment_sessions` carries no `role_id` / `candidate_id`, so employers cannot pull a list of candidates who completed their role's assessment from the employer-facing app. The admin tool (`/admin`) is the only place assessments surface today.
- Employer-facing candidate profile page: ❌ Not implemented (only admin detail view exists at `/admin/candidate/:id`).

---

## 4. Auth Status

- **Email/password:** ✅ Implemented in `AuthContext` and `Login.tsx`.
- **Google OAuth:** ✅ Wired through `lovable.auth.signInWithOAuth("google", …)` in `Login.tsx`. Provider must be enabled in Lovable Cloud auth settings — code path is in place.
- **Login page (`/login`):** ✅ Exists, supports email + Google.
- **Onboarding (`/onboarding`):** ✅ 2-step employer signup.
- **Route protection:** ✅ `ProtectedRoute` wraps all employer routes (`/dashboard`, `/roles*`, `/candidates*`, `/interviews*`, `/settings*`). Assessment routes are intentionally public.
- **Admin protection:** ✅ `AdminProtectedRoute` (cookie/local check via `isAdminAuthed`) wraps `/admin/*`. ⚠️ This is a client-side check (`src/lib/admin-auth.ts`) — server-side admin gating relies on the `user_roles` + `has_role()` RLS pattern, which is **not currently used to gate admin pages**.
- **Debug bypass:** ✅ Works on dev hosts (`localhost`, `*.lovable.app`, `*.lovableproject.com`) via `window.__DEV_BYPASS_AUTH__` and `localStorage.debug_bypass_auth`. Disabled in production builds.

---

## 5. Outstanding Issues

### TODO/FIXME comments
- ✅ None found in `src/` or `supabase/functions/` (clean).

### Error-handling gaps
- 🚧 **Game 4 silent fallback:** if `score-counselor-refund` fails, the page writes a zeroed score object with no user-visible error — candidate sees "0" without explanation.
- 🚧 **No retry / no surfaced error** on `transcribe-pitch` or `score-counselor-pitch` failures in Game 3 beyond console logs.
- 🚧 **Score merge race:** Games read `scores`, merge in JS, then `update` — concurrent writes (e.g. double submit) could clobber a sibling key. No row-level locking or `jsonb_set` patch.
- 🚧 **Anon RLS on `assessment_sessions`:** policies allow `anon` to SELECT/UPDATE *any* row. Anyone with a session id can mutate/read another candidate's assessment.
- 🚧 **Admin auth is client-side only** (`isAdminAuthed`). Not enforced by RLS on protected reads.

### Incomplete features / placeholders
- ❌ `/candidates`, `/candidates/shortlisted`, `/candidates/invited` — `ComingSoon` only.
- ❌ `/candidates/:id` employer detail page — not registered.
- ❌ `/interviews`, `/interviews/completed` — `ComingSoon`.
- ❌ `/roles/archived`, `/settings/notifications` — `ComingSoon`.
- ❌ No link from `roles` ↔ `assessment_sessions` (no `role_id` on sessions). Employers can't see who took the assessment for their posted role.
- ❌ No audio storage bucket — pitch recordings are lost after transcription.
- ❌ Game 2 has an AI scoring edge function (`score-counselor-answer`) that the page does not currently invoke; either wire it up or delete the function.
- ❌ MCQ/keys for Game 2 are hard-coded in the client (answer leakage risk).
- 🚧 `assessment_sessions` cannot be DELETE'd (no policy) — no cleanup path for abandoned sessions.

---

## Summary

| Area | Status |
|---|---|
| Candidate assessment flow (4 games + results) | ✅ End-to-end functional |
| AI scoring (Lovable AI Gateway / Gemini) | ✅ Game 3 + Game 4 · 🚧 Game 2 unused · ❌ Game 1 N/A |
| Voice pitch transcription | ✅ Working (no archival) |
| Employer dashboard, roles, settings | ✅ |
| Employer candidate views & interview scheduling | ❌ Mostly placeholders |
| Assessment ↔ Employer linkage | ❌ Not modelled |
| Auth (email + Google) | ✅ |
| Admin tooling | ✅ Functional, ⚠️ client-side gate only |
| Audio storage | ❌ |
