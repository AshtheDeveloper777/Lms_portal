"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BookOpen, CheckCircle, Users, ArrowLeft } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

type Course = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  thumbnail_url: string | null;
  published: boolean;
};

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  order_index: number;
};

async function fetchCourseData(courseId: string, userId: string | null) {
  const { data: course, error: courseError } = await supabase
    .from("courses")
    .select("id, title, description, category, thumbnail_url, published")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) throw new Error("Course not found");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  let isEnrolled = false;
  if (userId) {
    const { data: enrollment } = await supabase
      .from("enrollments")
      .select("id")
      .eq("student_id", userId)
      .eq("course_id", courseId)
      .maybeSingle();
    isEnrolled = !!enrollment;
  }

  return { course, lessons: lessons ?? [], isEnrolled };
}

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  const { userId } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["course-detail", courseId, userId],
    queryFn: () => fetchCourseData(courseId, userId),
    enabled: !!courseId,
  });

  useRealtimeInvalidate("enrollments", [["course-detail", courseId, userId]]);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); throw new Error("Not authenticated"); }
      const { error } = await supabase.from("enrollments").insert({ student_id: user.id, course_id: courseId });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-detail", courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ["my-learning", userId] });
      router.push("/courses/" + courseId + "/learn");
    },
  });

  if (isLoading) {
    return (
      <main className="lms-page" style={{ paddingTop: 48, paddingBottom: 80 }}>
        <div className="lms-container">
          <div className="lms-skeleton" style={{ height: 14, width: 120, marginBottom: 24 }} />
          <div className="lms-card" style={{ overflow: "hidden" }}>
            <div className="lms-skeleton" style={{ height: 300 }} />
            <div className="lms-course-detail-body">
              <div className="lms-skeleton" style={{ height: 14, width: 100, marginBottom: 14 }} />
              <div className="lms-skeleton" style={{ height: 44, width: "70%", marginBottom: 16 }} />
              <div className="lms-skeleton" style={{ height: 16, width: "95%", marginBottom: 8 }} />
              <div className="lms-skeleton" style={{ height: 16, width: "80%", marginBottom: 32 }} />
              <div className="lms-skeleton" style={{ height: 44, width: 140, borderRadius: 10 }} />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !data?.course) {
    return (
      <main className="lms-page" style={{ paddingTop: 48 }}>
        <div className="lms-container">
          <div className="lms-alert lms-alert--error">Course not found.</div>
          <Link href="/courses" className="lms-btn lms-btn--ghost" style={{ marginTop: 16 }}>
            <ArrowLeft size={14} /> Back to Courses
          </Link>
        </div>
      </main>
    );
  }

  const { course, lessons, isEnrolled } = data;

  return (
    <main className="lms-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="lms-container">
        <Link href="/courses" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--accent-hover)", marginBottom: 28 }}>
          <ArrowLeft size={14} /> Back to Courses
        </Link>

        <div className="lms-card" style={{ overflow: "hidden" }}>
          {course.thumbnail_url ? (
            <img src={course.thumbnail_url} alt={course.title} style={{ width: "100%", height: 320, objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: 320, background: "var(--bg-surface)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <BookOpen size={48} style={{ color: "var(--text-muted)" }} />
            </div>
          )}

          <div style={{ padding: 40 }}>
            {course.category && <span className="lms-badge lms-badge--accent" style={{ marginBottom: 14 }}>{course.category}</span>}
            <h1 className="lms-course-detail-title">{course.title}</h1>
            <p style={{ fontSize: 15, color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 680, marginBottom: 32 }}>{course.description}</p>

            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {!isEnrolled ? (
                !userId ? (
                  <Link href="/auth" className="lms-btn lms-btn--primary lms-btn--lg">Sign in to Enroll</Link>
                ) : (
                  <button className="lms-btn lms-btn--primary lms-btn--lg" onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending}>
                    {enrollMutation.isPending ? "Enrolling..." : "Enroll Now — Free"}
                  </button>
                )
              ) : (
                <>
                  <Link href={`/courses/${course.id}/learn`} className="lms-btn lms-btn--primary lms-btn--lg">Start Learning →</Link>
                  <span className="lms-badge lms-badge--green" style={{ padding: "8px 16px", fontSize: 14, display: "flex", alignItems: "center", gap: 6 }}>
                    <CheckCircle size={14} />Enrolled
                  </span>
                </>
              )}
            </div>

            {enrollMutation.error && <div className="lms-alert lms-alert--error" style={{ marginTop: 16 }}>{(enrollMutation.error as Error).message}</div>}
          </div>
        </div>

        <section style={{ marginTop: 36 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: "var(--text-primary)" }}>Course Curriculum</h2>
            <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 6 }}>{lessons.length} lesson{lessons.length !== 1 ? "s" : ""} in this course</p>
          </div>

          {lessons.length === 0 ? (
            <div className="lms-card" style={{ padding: 32, textAlign: "center" }}>
              <p style={{ color: "var(--text-muted)" }}>No lessons available yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {lessons.map((lesson, index) => (
                <div key={lesson.id} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-card)" }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--accent-glow)", color: "var(--accent-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>
                    {index + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{lesson.title}</p>
                    {lesson.description && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4, lineHeight: 1.5 }}>{lesson.description}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}