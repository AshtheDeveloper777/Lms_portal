"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, BookOpen, Users, TrendingUp, Eye } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

type Course = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  published: boolean;
  created_at: string;
  student_count: number;
};

async function fetchInstructorData(userId: string) {
  const { data: courses, error } = await supabase
    .from("courses")
    .select("id, title, description, category, published, created_at")
    .eq("instructor_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const courseIds = (courses ?? []).map((c: { id: string }) => c.id);

  let totalEnrollments = 0;
  const countMap: Record<string, number> = {};

  if (courseIds.length > 0) {
    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("course_id")
      .in("course_id", courseIds);

    (enrollments ?? []).forEach((e: { course_id: string }) => {
      countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
    });
    totalEnrollments = enrollments?.length ?? 0;
  }

  const coursesWithCounts: Course[] = (courses ?? []).map((c: any) => ({
    ...c,
    student_count: countMap[c.id] || 0,
  }));

  return { courses: coursesWithCounts, totalEnrollments };
}

export default function InstructorDashboard() {
  const router = useRouter();
  const { userId, role } = useAuthStore();

  useEffect(() => {
    if (role !== null && role !== "instructor") {
      router.push("/auth");
    }
  }, [role, router]);

  const { data, isLoading } = useQuery({
    queryKey: ["instructor-dashboard", userId],
    queryFn: () => fetchInstructorData(userId!),
    enabled: !!userId && role === "instructor",
  });

  useRealtimeInvalidate("courses", [["instructor-dashboard", userId]]);
  useRealtimeInvalidate("enrollments", [["instructor-dashboard", userId]]);

  const courses = data?.courses ?? [];
  const totalEnrollments = data?.totalEnrollments ?? 0;
  const publishedCount = courses.filter((c: Course) => c.published).length;

  async function togglePublish(courseId: string, current: boolean) {
    await supabase.from("courses").update({ published: !current }).eq("id", courseId);
    // realtime will invalidate automatically
  }

  async function deleteCourse(courseId: string) {
    if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return;
    await supabase.from("courses").delete().eq("id", courseId);
  }

  if (!userId || role !== "instructor") {
    return (
      <main className="lms-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
        <p style={{ color: "var(--text-muted)" }}>Loading...</p>
      </main>
    );
  }

  return (
    <main className="lms-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="lms-container">
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, marginBottom: 36, flexWrap: "wrap" }}>
          <div>
            <p className="lms-page-eyebrow">Instructor Dashboard</p>
            <h1 className="lms-page-title">Manage Your Courses</h1>
            <p className="lms-page-subtitle">Create, edit, and track your course performance.</p>
          </div>
          <Link href="/instructor/courses/new" className="lms-btn lms-btn--primary">
            <Plus size={16} /> Create Course
          </Link>
        </div>

        {/* Stats */}
        <div className="lms-stat-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", marginBottom: 40 }}>
          <div className="lms-stat-card">
            <div className="lms-stat-icon"><BookOpen size={20} /></div>
            <p className="lms-stat-label">Total Courses</p>
            <p className="lms-stat-value">{courses.length}</p>
          </div>
          <div className="lms-stat-card">
            <div className="lms-stat-icon" style={{ background: "var(--green-bg)", color: "var(--green)" }}><Eye size={20} /></div>
            <p className="lms-stat-label">Published</p>
            <p className="lms-stat-value">{publishedCount}</p>
          </div>
          <div className="lms-stat-card">
            <div className="lms-stat-icon" style={{ background: "var(--purple-bg)", color: "var(--purple)" }}><Users size={20} /></div>
            <p className="lms-stat-label">Total Students</p>
            <p className="lms-stat-value">{totalEnrollments}</p>
          </div>
          <div className="lms-stat-card">
            <div className="lms-stat-icon" style={{ background: "var(--yellow-bg)", color: "var(--yellow)" }}><TrendingUp size={20} /></div>
            <p className="lms-stat-label">Drafts</p>
            <p className="lms-stat-value">{courses.length - publishedCount}</p>
          </div>
        </div>

        {/* Courses */}
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>Your Courses</h2>
        </div>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {[1,2].map(i => (
              <div key={i} className="lms-card" style={{ padding: 24 }}>
                <div className="lms-skeleton" style={{ height: 22, width: "70%", marginBottom: 12 }} />
                <div className="lms-skeleton" style={{ height: 14, width: "100%", marginBottom: 8 }} />
                <div className="lms-skeleton" style={{ height: 14, width: "80%", marginBottom: 24 }} />
                <div style={{ display: "flex", gap: 8 }}>
                  {[1,2,3].map(j => <div key={j} className="lms-skeleton" style={{ height: 36, width: 90, borderRadius: 10 }} />)}
                </div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <div className="lms-card" style={{ padding: 64, textAlign: "center" }}>
            <BookOpen size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", marginBottom: 20 }}>You have not created any courses yet.</p>
            <Link href="/instructor/courses/new" className="lms-btn lms-btn--primary">Create your first course</Link>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 20 }}>
            {courses.map((course: Course) => (
              <div key={course.id} className="lms-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>{course.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span
                        className="lms-badge"
                        style={{
                          background: "var(--purple-bg)",
                          color: "var(--purple)",
                          border: "1px solid var(--purple-border)",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          fontSize: 12,
                          fontWeight: 700,
                          padding: "3px 10px",
                          borderRadius: 99,
                        }}
                      >
                        <Users size={12} />
                        {course.student_count} {course.student_count === 1 ? "student" : "students"}
                      </span>
                      {course.category && <span className="lms-badge lms-badge--accent">{course.category}</span>}
                    </div>
                  </div>
                  <span className={`lms-badge ${course.published ? "lms-badge--green" : "lms-badge--yellow"}`}>
                    {course.published ? "Live" : "Draft"}
                  </span>
                </div>

                <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 20, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {course.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <Link href={`/instructor/courses/${course.id}`} className="lms-btn lms-btn--primary lms-btn--sm">
                    Manage Lessons
                  </Link>
                  <button
                    className="lms-btn lms-btn--secondary lms-btn--sm"
                    onClick={() => togglePublish(course.id, course.published)}
                  >
                    {course.published ? "Unpublish" : "Publish"}
                  </button>
                  <Link href={`/instructor/courses/${course.id}/edit`} className="lms-btn lms-btn--secondary lms-btn--sm">
                    Edit
                  </Link>
                  <button
                    className="lms-btn lms-btn--danger lms-btn--sm"
                    onClick={() => deleteCourse(course.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
