# SKILL EVO — LMS Portal

A production-ready **Learning Management System** built as a Webzenith Solutions capstone project. Instructors can create and publish courses with video lessons; students can enroll, watch embedded videos, and track their progress — all with real-time updates across every browser tab.

---

## Live Demo

> Deploy to Vercel: connect this repo, set root directory to `apps/web`, add env vars.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | TurboRepo + pnpm workspaces |
| Framework | Next.js 16 (App Router) + TypeScript |
| Backend | Supabase (Auth, PostgreSQL, Storage, Realtime) |
| Server Validation | Zod + T3 ENV (`@t3-oss/env-nextjs`) |
| Data Fetching | TanStack Query v5 (with real-time cache invalidation) |
| State Management | Zustand (auth store: userId, fullName, email, role) |
| UI Components | ShadCN UI (Button, Card, Input, Textarea, Avatar, Badge) |
| Styling | Tailwind CSS v4 + custom premium dark design system |
| Deployment | Vercel (monorepo config) |
| CI/CD | GitHub Actions (type-check → lint → build) |

---

## Architecture

```
LMS portal/                          # TurboRepo monorepo root
├── apps/
│   └── web/                         # Next.js 16 application
│       ├── app/                     # App Router pages
│       │   ├── auth/                # Login / Register
│       │   ├── courses/             # Course listing
│       │   │   └── [id]/            # Course detail + enroll
│       │   │       └── learn/       # Lesson player with checkboxes
│       │   ├── instructor/          # Instructor dashboard
│       │   │   └── courses/[id]/    # Manage lessons + enrolled students table
│       │   ├── my-learning/         # Student progress dashboard
│       │   └── profile/             # User profile (student + instructor views)
│       ├── components/
│       │   ├── ui/                  # ShadCN UI primitives
│       │   ├── navbar.tsx           # Sticky nav with user name + role badge
│       │   ├── video-player.tsx     # YouTube/Vimeo/MP4 auto-detect player
│       │   └── auth-initializer.tsx # Supabase session -> Zustand sync
│       ├── hooks/
│       │   └── use-realtime-invalidate.ts  # Realtime -> React Query bridge
│       └── store/
│           └── auth-store.ts        # Zustand store (userId, role, fullName, email)
├── supabase/
│   └── migrations/
│       └── 001_schema_and_rls.sql   # Full schema + RLS policies
├── .github/workflows/ci.yml         # GitHub Actions CI pipeline
└── vercel.json                      # Vercel monorepo deployment config
```

---

## Database Schema

```
profiles         id, full_name, email, role, created_at
courses          id, instructor_id, title, description, category, thumbnail_url, published
lessons          id, course_id, title, description, video_url, order_index
enrollments      id, student_id, course_id, created_at
lesson_progress  id, student_id, lesson_id, course_id, completed, completed_at
```

All tables have **Row Level Security** enabled. See [`supabase/migrations/001_schema_and_rls.sql`](./supabase/migrations/001_schema_and_rls.sql) for the full policy definitions.

---

## Key Features

### For Instructors
- Create, edit, publish/unpublish, and delete courses
- Upload course thumbnail images to Supabase Storage
- Add/edit/delete video lessons (YouTube, Vimeo, or direct MP4 URLs)
- **Enrolled students table** — see every student's name, email, enrollment date, and real-time progress percentage

### For Students
- Browse published courses and enroll for free
- Watch embedded lesson videos (YouTube/Vimeo iframes auto-detected)
- **Checkbox completion** — click the circle next to any lesson to mark it complete
- Course progress bar updates instantly
- **My Learning dashboard** — all enrolled courses with progress bars in one view

### Real-time Updates
Every data mutation (enrollment, lesson completion, course publish) is reflected instantly across all open browser tabs using **Supabase Realtime** + **React Query cache invalidation** via `useRealtimeInvalidate`.

---

## Local Setup

### Prerequisites
- Node.js >= 24
- pnpm >= 11

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd "LMS portal"
pnpm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/migrations/001_schema_and_rls.sql`
3. In **Authentication → URL Configuration**, add `http://localhost:3000` to allowed redirect URLs
4. Enable **Realtime** on the `courses`, `lessons`, `enrollments`, and `lesson_progress` tables

### 3. Environment Variables

Create `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Create a Test Instructor

After signing up via the UI (which creates a `student` role by default), promote a user to instructor by running in the Supabase SQL Editor:

```sql
update public.profiles set role = 'instructor' where email = 'your@email.com';
```

### 5. Run

```bash
pnpm dev
# App runs at http://localhost:3000
```

---

## Deployment (Vercel)

1. Push this repo to GitHub
2. Import the project into Vercel
3. **Important:** Set **Root Directory** to `apps/web` (or use the provided `vercel.json`)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

### CI Secrets (GitHub)

Add these to `Settings → Secrets → Actions`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `TURBO_TOKEN` *(optional — for Turborepo Remote Cache)*
- `TURBO_TEAM` *(optional)*

---

## CI Pipeline

Every push and PR triggers:

```
1. pnpm check-types   → TypeScript type checking
2. pnpm lint          → ESLint code quality
3. pnpm build         → Production build verification
```

---

## Design Decisions

**Why Supabase Realtime instead of polling?**  
Polling creates unnecessary load and lag. Supabase Realtime uses WebSocket-based `postgres_changes` events, so the UI updates in milliseconds without any extra API calls.

**Why Zustand for auth state?**  
React Context re-renders the entire tree on every auth change. Zustand gives us fine-grained subscriptions — only the components that read `userId`, `fullName`, or `role` will re-render.

**Why T3 ENV?**  
`@t3-oss/env-nextjs` validates environment variables at build time using Zod, so you get a clear error at startup instead of a cryptic runtime failure.

**Why TanStack Query with `staleTime: 0`?**  
Combined with `useRealtimeInvalidate`, this ensures that any DB change triggers an immediate re-fetch, keeping the UI perfectly in sync without manual polling.

---

## License

MIT