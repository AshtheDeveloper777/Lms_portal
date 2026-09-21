# SKILL EVO — LinkedIn Showcase Post

## Draft Post

---

I just shipped my capstone project from the **Webzenith Solutions full-stack program** — a production-ready Learning Management System called **SKILL EVO**.

Here's what I built:

**For Instructors:**
- Create and publish courses with thumbnails (Supabase Storage)
- Add video lessons via YouTube/Vimeo URLs — auto-detected and embedded
- View a real-time enrolled students table with per-student progress bars

**For Students:**
- Browse and enroll in published courses
- Watch embedded video lessons
- Mark lessons complete using interactive checkboxes
- Track progress across all courses in a dedicated "My Learning" dashboard

**The real-time part was the hardest — and most satisfying.**  
Every enrollment, lesson completion, and course publish instantly reflects across all open browser tabs. No polling. No page refresh. Pure WebSocket-driven UI via Supabase Realtime + React Query cache invalidation.

---

**Tech Stack:**
- TurboRepo monorepo (pnpm workspaces)
- Next.js 16 (App Router + TypeScript)
- Supabase (Auth, PostgreSQL, Storage, Realtime)
- TanStack Query v5 + Zustand
- Zod server-side validation + T3 ENV
- ShadCN UI + Tailwind CSS v4
- Deployed to Vercel with GitHub Actions CI/CD

**GitHub:** [link]  
**Live Demo:** [link]

---

## Architecture Talking Points (for the showcase)

1. **Monorepo structure** — Why TurboRepo? Show the `apps/web` structure and how turbo caches builds.

2. **Supabase RLS** — Show the SQL file. Explain: "Any student can read published courses, but they can only write their own progress rows. Instructors can only manage their own courses."

3. **Real-time bridge** — Show `use-realtime-invalidate.ts`. Explain how Supabase sends a WebSocket event on every DB change, which triggers `queryClient.invalidateQueries()`, which causes a silent re-fetch.

4. **Zod + T3 ENV** — Show `env.ts`. Explain: "If you forget to set `NEXT_PUBLIC_SUPABASE_URL`, you get a clear error at startup, not a cryptic `Cannot read property of undefined` at runtime."

5. **Role-based routing** — Show how `AuthInitializer` syncs the Supabase session to Zustand, and how the Navbar conditionally shows "My Learning" vs "Dashboard" based on role.

---

## Database Schema (dbdiagram.io)

Paste this at https://dbdiagram.io/d to generate the ERD:

```
Table profiles {
  id uuid [pk]
  full_name text
  email text
  role text [note: 'student | instructor']
  created_at timestamptz
}

Table courses {
  id uuid [pk]
  instructor_id uuid [ref: > profiles.id]
  title text
  description text
  category text
  thumbnail_url text
  published boolean
  created_at timestamptz
}

Table lessons {
  id uuid [pk]
  course_id uuid [ref: > courses.id]
  title text
  description text
  video_url text
  order_index integer
  created_at timestamptz
}

Table enrollments {
  id uuid [pk]
  student_id uuid [ref: > profiles.id]
  course_id uuid [ref: > courses.id]
  created_at timestamptz
}

Table lesson_progress {
  id uuid [pk]
  student_id uuid [ref: > profiles.id]
  lesson_id uuid [ref: > lessons.id]
  course_id uuid [ref: > courses.id]
  completed boolean
  completed_at timestamptz
  created_at timestamptz
}
```

---

## Screenshots Checklist (take these before showcase)
- [ ] Homepage / courses list
- [ ] Course detail with "Enroll Now" button
- [ ] Learn page — sidebar with checkboxes + video player
- [ ] Instructor dashboard — stat cards
- [ ] Enrolled students table with progress bars
- [ ] My Learning page — progress cards
- [ ] Profile page
- [ ] Auth page
- [ ] GitHub Actions CI — green checkmark
- [ ] Vercel deployment dashboard