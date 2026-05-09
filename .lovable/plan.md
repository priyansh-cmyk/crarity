

# Transfer Employer Pages to New Project

## What You're Taking

Here's everything from the employer side that needs to go to your new project. Since the student flow is already done there, this is purely the employer-facing layer.

## Files to Transfer

### Pages (7 files)
1. **Landing Page** - `Index.tsx` (with links adjusted: "For Employers" link pointing to login/dashboard)
2. **Employer Login** - `Login.tsx` (Google + email auth)
3. **Employer Signup** - `RequestAccess.tsx` (2-step: personal info + company info)
4. **Dashboard** - `Dashboard.tsx` (role cards, candidate counts, delete roles)
5. **Create Role** - `CreateRole.tsx` (role selection, experience level, custom requirements)
6. **Role Detail** - `RoleDetail.tsx` (role settings, candidate pipeline, add candidates)
7. **Schedule Interview** - `ScheduleInterview.tsx` (date/time picker, Google Meet link)
8. **Settings** - `Settings.tsx` (profile, company, hiring preferences)
9. **Reset Password** - `ResetPassword.tsx`

### Components (7 files)
1. **DashboardLayout** - header nav, avatar dropdown, sign out
2. **CandidatesSection** - fetches and lists candidates per role (with mock data fallback)
3. **CandidateListItem** - individual candidate row with score, status dropdown
4. **CandidateDetailSheet** - slide-out panel with full candidate info, test results, notes, interview scheduling
5. **AddCandidatesModal** - single add + CSV import
6. **ProtectedRoute** - auth guard wrapper
7. **Footer, RoleRotator, ProductDemoModal, HowItWorksFlowchart, NavLink** - landing page components

### Shared/Infrastructure (4 files)
1. **AuthContext** - `contexts/AuthContext.tsx` (Google + email sign in/up, sign out, password reset)
2. **URL Validation** - `lib/url-validation.ts`
3. **Landing page assets** - screenshots in `src/assets/`

### Database Tables Needed
These tables power the employer side:
- **profiles** - employer profile (name, company, LinkedIn, hiring prefs)
- **roles** - hiring roles (type, experience level, custom requirements)
- **candidates** - candidate profiles
- **candidate_roles** - links candidates to roles with status
- **test_results** - candidate test scores and responses
- **interview_requests** - scheduled interviews
- **user_roles** - admin/employer role assignments

### Database Functions
- `handle_new_user()` - auto-creates profile on signup
- `update_updated_at_column()` - timestamp trigger
- `has_role()` - checks user role (admin/employer)

## How to Transfer

The most reliable approach: **paste a mega-prompt into your new project** that tells it to recreate all the employer-side functionality. This is better than copying files because:
- Routes need to integrate with your existing student app
- Database tables may already partially exist
- Auth context may need merging with what you already have

### The Mega-Prompt

Here's what to paste into your new project:

---

**Prompt to paste:**

"Add the complete employer-side experience to this project. The student flow already exists. Here's what I need:

**DATABASE (create these tables if they don't exist):**
- `profiles` table: id (uuid, FK to auth.users), email, full_name, company_name, avatar_url, website, team_size, linkedin_url, referral, hiring_roles, actively_hiring, created_at, updated_at. RLS: users can only read/update their own profile.
- `roles` table: id, user_id (uuid), role_type (text), experience_level (text), status (text, default 'open'), is_custom (boolean), custom_requirements (jsonb), created_at, updated_at. RLS: users can CRUD their own roles, anyone can view open roles.
- `candidates` table: id, user_id (uuid, nullable), first_name, last_name, email, phone, city, region, country, resume_url, video_intro_url, availability, work_preference, portfolio_url, languages (text[]), education (jsonb), work_experience (jsonb), created_at, updated_at. RLS: candidates can manage own profile, employers can view candidates in their roles and create candidates.
- `candidate_roles` table: id, candidate_id, role_id, user_id, status (text, default 'New'), employer_notes (text), applied_at, created_at, updated_at. RLS: employers can view/update/insert for their roles, candidates can view/insert their own.
- `test_results` table: id, candidate_id, test_name, score (numeric), max_score (numeric, default 100), task_prompt (text), response (text), details (jsonb), completed_at. RLS: candidates can view/submit their own, employers can view for candidates in their roles.
- `interview_requests` table: id, candidate_role_id, employer_id, scheduled_at, duration_minutes (int, default 30), meeting_title, message, meeting_link, requested_at. RLS: employers can create/view their own.
- `user_roles` table: id, user_id, role (enum: admin, employer, student), created_at. RLS: users can view own, admins can manage all.
- Create `handle_new_user()` trigger function that auto-inserts into profiles on auth.users insert.
- Create `update_updated_at_column()` trigger for updated_at columns.
- Create `has_role(user_id, role)` function for checking user roles.

**AUTH:**
- AuthContext with: signInWithGoogle, signInWithEmail, signUp (with metadata), signOut, resetPassword, updatePassword
- ProtectedRoute component that redirects to /login if not authenticated

**EMPLOYER PAGES:**
1. `/login` - Employer login with Google OAuth + email/password. Back arrow to landing page. Forgot password flow. Redirect to /dashboard if logged in.
2. `/request-access` - 2-step employer signup: Step 1 (name, email, password, LinkedIn, referral), Step 2 (company name, hiring roles, actively hiring status). Uses signUp with metadata.
3. `/reset-password` - Password reset form.
4. `/dashboard` - Shows all roles as cards in a grid. Each card shows: role label, status badge, experience level, candidate count, created date, 'View Pipeline' button. Has 'New Role' button. Empty state with 3-step flow indicator. Delete role with confirmation dialog.
5. `/roles/new` - 3-step role creation: Step 1 (select role type from TA/BD/Creative Strategist/Video Editor + experience level student/fresher), Step 2 (shows industry-standard skills and tests for that role), Step 3 (optional custom requirements questionnaire per role type). Creates role in DB and navigates to role detail.
6. `/roles/:id` - Role detail page with: collapsible role settings bar (skills, tests, custom requirements with edit), CandidatesSection showing all candidates for this role with mock data fallback (4 demo candidates with test results when no real data exists), AddCandidatesModal (single add + CSV import), copy evaluation link button.
7. `/schedule-interview/:candidateRoleId` - Date picker, time slot selection, duration, title, notes. Creates interview_request in DB.
8. `/settings` - Profile settings (name, email disabled, LinkedIn), Company settings (name, website, team size), Hiring preferences (roles, actively hiring status), Notification preferences.

**CANDIDATE VIEWS IN EMPLOYER:**
- CandidateListItem: avatar, name, location, education, availability badge, avg score, status dropdown (New/Reviewing/Shortlisted/Interview Requested/Rejected), applied date
- CandidateDetailSheet: slide-out sheet with full candidate profile, collapsible test results showing task prompt + candidate response + score with progress bar, video intro link, portfolio link, employer notes (auto-save on blur), status dropdown, Schedule Interview button
- CandidatesSection: fetches candidate_roles + candidates + test_results for a role, shows mock demo data when no real candidates exist

**LAYOUT:**
- DashboardLayout: sticky header with 'Evalua' brand, nav links (Dashboard, Create Role, Settings), avatar dropdown with profile info and sign out. Mobile responsive nav.

**LANDING PAGE:**
- Keep the existing landing page but add a 'For Employers' link in the header that goes to /login
- The landing page has: hero with role rotator animation, problem section with stats, How It Works flowchart, FAQ accordion, final CTA

**ROLE DEFINITIONS (hardcoded):**
- TA Intern: Skills [MS Office, Analytical Thinking, Fast-paced Adaptability, Communication], Tests [Excel Proficiency Task, Sourcing Simulation, Communication Assessment]
- BD Intern: Skills [Communication, Market Research, CRM Basics, Negotiation], Tests [Cold Email Writing, Lead Qualification, Pitch Deck Review]  
- Creative Strategist: Skills [Creative Thinking, Brand Strategy, Visual Presentation, Storytelling], Tests [Campaign Brief, Brand Audit, Content Ideation]
- Video Editor: Skills [Video Editing Software, Storytelling, Attention to Detail, Color Theory], Tests [Raw Footage Edit, Color Grading, Pacing Assessment]

Use shadcn/ui components, Tailwind CSS, React Router, TanStack Query, and Supabase client."

---

## Important Notes

- The new project's student data (from `student_profiles` / `student_applications`) will need to be mapped to the `candidates` table so employers can see approved students. You may want to add a step that copies approved student data into the candidates table, or adjust the employer queries to read from student_profiles directly.
- The admin dashboard (`/admin`) already exists in this project -- you said you have it in the new one already, so skip it.
- Make sure the landing page in the new project has both the student entry point AND the "For Employers" link.

