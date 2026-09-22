"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Users, Mail, Calendar, CheckCircle, Edit, ArrowRight, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";

export type StudentEnrolledCourse = {
  id: string;
  title: string;
  category: string | null;
  thumbnail_url: string | null;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
};

async function fetchStudentProfile(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, course_id, enrolled_at")
    .eq("student_id", userId);

  const courseIds = (enrollments ?? []).map((e: { id: string; course_id: string; enrolled_at?: string }) => e.course_id);

  let courses: StudentEnrolledCourse[] = [];
  let totalCompleted = 0;
  let overallProgress = 0;

  if (courseIds.length > 0) {
    const { data: c } = await supabase
      .from("courses")
      .select("id, title, category, thumbnail_url")
      .in("id", courseIds);

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, course_id")
      .in("course_id", courseIds);

    const lessonIds = (lessons ?? []).map((l: { id: string; course_id: string }) => l.id);

    const { data: progressRows } = await supabase
      .from("lesson_progress")
      .select("lesson_id, completed")
      .eq("student_id", userId)
      .in("lesson_id", lessonIds.length > 0 ? lessonIds : ["00000000-0000-0000-0000-000000000000"])
      .eq("completed", true);

    const completedSet = new Set((progressRows ?? []).map((p: { lesson_id: string }) => p.lesson_id));
    totalCompleted = completedSet.size;

    courses = (c ?? []).map((course: { id: string; title: string; category: string | null; thumbnail_url: string | null }) => {
      const courseLessons = (lessons ?? []).filter((l: { id: string; course_id: string }) => l.course_id === course.id);
      const total = courseLessons.length;
      const completed = courseLessons.filter((l: { id: string; course_id: string }) => completedSet.has(l.id)).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        thumbnail_url: course.thumbnail_url,
        total_lessons: total,
        completed_lessons: completed,
        progress_pct: pct,
      };
    });

    if (courses.length > 0) {
      const totalPct = courses.reduce((acc, crs) => acc + crs.progress_pct, 0);
      overallProgress = Math.round(totalPct / courses.length);
    }
  }

  return { profile, enrolledCourses: courses, totalCompleted, overallProgress };
}

async function fetchInstructorProfile(userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, category, published, created_at")
    .eq("instructor_id", userId)
    .order("created_at", { ascending: false });

  const courseIds = (courses ?? []).map((c: { id: string }) => c.id);
  let totalStudents = 0;
  const countMap: Record<string, number> = {};

  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds);

    (enrollments ?? []).forEach((e: { course_id: string }) => {
      countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
    });
    totalStudents = enrollments?.length ?? 0;
  }

  const coursesWithCounts = (courses ?? []).map((c: any) => ({
    ...c,
    student_count: countMap[c.id] || 0,
  }));

  return { profile, courses: coursesWithCounts, totalStudents };
}

export default function ProfilePage() {
  const { userId: storeUserId, role: storeRole, fullName: storeFullName, email: storeEmail } = useAuthStore();
  const router = useRouter();

  const [activeUserId, setActiveUserId] = useState<string | null>(storeUserId);
  const [activeRole, setActiveRole] = useState<string | null>(storeRole);
  const [activeName, setActiveName] = useState<string | null>(storeFullName);
  const [activeEmail, setActiveEmail] = useState<string | null>(storeEmail);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      if (storeUserId) {
        setActiveUserId(storeUserId);
        setActiveRole(storeRole);
        setActiveName(storeFullName);
        setActiveEmail(storeEmail);
        setAuthChecked(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setActiveUserId(session.user.id);
          setActiveEmail(session.user.email ?? null);
          setActiveName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Student');
          setActiveRole((session.user.user_metadata?.role as string) || 'student');
        }
      } catch (e) {
        console.error('Session check error in profile:', e);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, [storeUserId, storeRole, storeFullName, storeEmail]);

  useEffect(() => {
    if (authChecked && !activeUserId) {
      router.push("/auth");
    }
  }, [authChecked, activeUserId, router]);

  const isInstructor = activeRole === "instructor";

  const studentQuery = useQuery({
    queryKey: ["profile-student", activeUserId],
    queryFn: () => fetchStudentProfile(activeUserId!),
    enabled: Boolean(activeUserId) && !isInstructor,
  });

  const instructorQuery = useQuery({
    queryKey: ["profile-instructor", activeUserId],
    queryFn: () => fetchInstructorProfile(activeUserId!),
    enabled: Boolean(activeUserId) && isInstructor,
  });

  if (!authChecked || !activeUserId) {
    return (
      <main className="lms-page" style={{ paddingTop: 40, paddingBottom: 80, minHeight: '80vh' }}>
        <div className="lms-container" style={{ maxWidth: 900 }}>
          <div className="lms-skeleton" style={{ height: 160, borderRadius: 20, marginBottom: 28 }} />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="lms-skeleton" style={{ height: 90, borderRadius: 16 }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  const isLoading = isInstructor ? instructorQuery.isLoading : studentQuery.isLoading;
  const displayName = activeName || activeEmail?.split("@")[0] || "Student";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() || "ST";

  return (
    <main className="lms-page" style={{ paddingTop: 40, paddingBottom: 80, minHeight: '80vh' }}>
      <div className="lms-container" style={{ maxWidth: 900 }}>
        {/* Profile Header */}
        <div className="lms-card" style={{ padding: 36, marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            <div className="lms-profile-avatar">{initials}</div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, color: "var(--text-primary)" }}>{displayName}</h1>
                <span className={`lms-role-badge ${isInstructor ? "lms-role-badge--instructor" : "lms-role-badge--student"}`} style={{ padding: "4px 12px", fontSize: 12 }}>
                  {isInstructor ? "Instructor" : "Student"}
                </span>
              </div>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--text-muted)" }}>
                  <Mail size={13} />
                  {activeEmail ?? "No email"}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 14, color: "var(--text-muted)" }}>
                  <Calendar size={13} />
                  {isInstructor ? "Instructor since " : "Student since "}
                  {isInstructor
                    ? instructorQuery.data?.profile?.created_at
                      ? new Date(instructorQuery.data.profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                      : "..."
                    : studentQuery.data?.profile?.created_at
                      ? new Date(studentQuery.data.profile.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
                      : "..."}
                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} className="lms-skeleton" style={{ height: 90, borderRadius: 16 }} />)}
          </div>
        )}

        {/* Student View with Rich Progress in Percentage */}
        {!isLoading && !isInstructor && studentQuery.data && (
          <>
            <div className="lms-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 280px))", marginBottom: 28 }}>
              <div className="lms-stat-card">
                <div className="lms-stat-icon"><BookOpen size={18} /></div>
                <p className="lms-stat-label">Enrolled Courses</p>
                <p className="lms-stat-value">{studentQuery.data.enrolledCourses.length}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                Enrolled Courses & Progress
              </h2>
              <Link href="/my-learning" style={{ fontSize: 13, color: "var(--accent)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                Full Dashboard <ArrowRight size={14} />
              </Link>
            </div>

            {studentQuery.data.enrolledCourses.length === 0 ? (
              <div className="lms-card" style={{ padding: 48, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>You are not enrolled in any courses yet.</p>
                <Link href="/courses" className="lms-btn lms-btn--primary">Explore Courses & Start Learning</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {studentQuery.data.enrolledCourses.map(c => {
                  const pctWidth = String(c.progress_pct) + "%";
                  return (
                    <div
                      key={c.id}
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                        padding: "18px 22px",
                        borderRadius: "var(--radius-lg)",
                        border: "1px solid var(--border)",
                        background: "var(--bg-card)",
                        boxShadow: "var(--shadow-card)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                        {c.thumbnail_url
                          ? <img src={c.thumbnail_url} alt={c.title} style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: 52, height: 52, borderRadius: 10, background: "var(--accent-glow)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><BookOpen size={22} style={{ color: "var(--accent-hover)" }} /></div>
                        }
                        <div style={{ flex: 1, minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            {c.category && (
                              <span style={{ fontSize: 11, fontWeight: 700, color: "var(--accent)", background: "var(--accent-glow)", padding: "2px 8px", borderRadius: 99 }}>
                                {c.category}
                              </span>
                            )}
                            <span style={{ fontSize: 12, fontWeight: 700, color: c.progress_pct === 100 ? "var(--green)" : "var(--accent)" }}>
                              {c.progress_pct}% Complete
                            </span>
                          </div>
                          <p style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>{c.title}</p>
                          <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            {c.completed_lessons} of {c.total_lessons} lessons completed
                          </p>
                        </div>
                        <Link href={`/courses/${c.id}/learn`} className="lms-btn lms-btn--secondary lms-btn--sm">
                          Continue Learning
                        </Link>
                      </div>

                      {/* Visual Progress Bar */}
                      <div style={{ width: "100%", height: 6, borderRadius: 99, background: "var(--border)", overflow: "hidden" }}>
                        <div
                          style={{
                            width: pctWidth,
                            height: "100%",
                            borderRadius: 99,
                            background: c.progress_pct === 100 ? "var(--green)" : "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Instructor View */}
        {!isLoading && isInstructor && instructorQuery.data && (
          <>
            <div className="lms-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", marginBottom: 28 }}>
              <div className="lms-stat-card">
                <div className="lms-stat-icon"><BookOpen size={18} /></div>
                <p className="lms-stat-label">Courses</p>
                <p className="lms-stat-value">{instructorQuery.data.courses.length}</p>
              </div>
              <div className="lms-stat-card">
                <div className="lms-stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><CheckCircle size={18} /></div>
                <p className="lms-stat-label">Published</p>
                <p className="lms-stat-value">{instructorQuery.data.courses.filter((c: { published: boolean }) => c.published).length}</p>
              </div>
              <div className="lms-stat-card">
                <div className="lms-stat-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><Users size={18} /></div>
                <p className="lms-stat-label">Students</p>
                <p className="lms-stat-value">{instructorQuery.data.totalStudents}</p>
              </div>
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16 }}>Your Courses</h2>

            {instructorQuery.data.courses.length === 0 ? (
              <div className="lms-card" style={{ padding: 48, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)", marginBottom: 16 }}>No courses created yet.</p>
                <Link href="/instructor/courses/new" className="lms-btn lms-btn--primary">Create your first course</Link>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {instructorQuery.data.courses.map((c: { id: string; title: string; category: string | null; published: boolean; created_at: string; student_count?: number }) => (
                  <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "14px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{c.title}</p>
                        <span
                          className="lms-badge"
                          style={{
                            background: "var(--purple-bg)",
                            color: "var(--purple)",
                            border: "1px solid var(--purple-border)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: 99,
                          }}
                        >
                          <Users size={11} />
                          {c.student_count ?? 0} {c.student_count === 1 ? "student" : "students"}
                        </span>
                        <span className={`lms-badge ${c.published ? "lms-badge--green" : "lms-badge--yellow"}`}>
                          {c.published ? "Published" : "Draft"}
                        </span>
                      </div>
                      {c.category && <p style={{ fontSize: 12, color: "var(--text-muted)" }}>{c.category}</p>}
                    </div>
                    <Link href={`/instructor/courses/${c.id}`} className="lms-btn lms-btn--secondary lms-btn--sm">
                      <Edit size={13} /> Manage
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
