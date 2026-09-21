"use client";

import { useState, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users, BookOpen, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";
import Link from "next/link";

type Lesson = { id: string; title: string; description: string | null; video_url: string | null; order_index: number };
type EnrolledStudent = { id: string; student_id: string; enrolled_at: string; student_name: string; student_email: string; completed_lessons: number; total_lessons: number };

async function fetchCourseManageData(courseId: string, instructorId: string) {
  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description, category, published")
    .eq("id", courseId)
    .eq("instructor_id", instructorId)
    .single();

  if (!course) throw new Error("Course not found or unauthorized");

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id, title, description, video_url, order_index")
    .eq("course_id", courseId)
    .order("order_index", { ascending: true });

  const lessonList = (lessons ?? []) as Lesson[];
  const totalLessons = lessonList.length;

  // Enrolled students with progress
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("id, student_id, enrolled_at")
    .eq("course_id", courseId)
    .order("enrolled_at", { ascending: false });

  const enrollmentList = enrollments ?? [];

  const studentIds = enrollmentList.map((e: { id: string; student_id: string; enrolled_at: string }) => e.student_id);

  let profiles: { id: string; full_name: string | null; email: string | null }[] = [];
  if (studentIds.length > 0) {
    const { data: p } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .in("id", studentIds);
    profiles = p ?? [];
  }

  const lessonIds = lessonList.map((l: Lesson) => l.id);
  let progressData: { student_id: string; lesson_id: string; completed: boolean }[] = [];
  if (lessonIds.length > 0 && studentIds.length > 0) {
    const { data: prog } = await supabase
      .from("lesson_progress")
      .select("student_id, lesson_id, completed")
      .in("lesson_id", lessonIds)
      .in("student_id", studentIds)
      .eq("completed", true);
    progressData = prog ?? [];
  }

  const students: EnrolledStudent[] = enrollmentList.map((e: { id: string; student_id: string; enrolled_at: string }) => {
    const profile = profiles.find((p) => p.id === e.student_id);
    const completed = progressData.filter((prog) => prog.student_id === e.student_id && prog.completed).length;
    return {
      id: e.id,
      student_id: e.student_id,
      enrolled_at: e.enrolled_at,
      student_name: profile?.full_name ?? "Unknown",
      student_email: profile?.email ?? "—",
      completed_lessons: completed,
      total_lessons: totalLessons,
    };
  });

  return { course, lessons: lessonList, students };
}

export default function ManageLessonsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAuthStore();
  const courseId = params.id as string;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"lessons" | "students">("lessons");

  const { data, isLoading, error } = useQuery({
    queryKey: ["manage-course", courseId, userId],
    queryFn: () => fetchCourseManageData(courseId, userId!),
    enabled: !!userId && !!courseId,
  });

  useRealtimeInvalidate("lessons", [["manage-course", courseId, userId]]);
  useRealtimeInvalidate("enrollments", [["manage-course", courseId, userId]]);
  useRealtimeInvalidate("lesson_progress", [["manage-course", courseId, userId]]);

  function startEditing(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setDescription(lesson.description ?? "");
    setVideoUrl(lesson.video_url ?? "");
    setMessage("");
  }

  function resetForm() {
    setEditingLessonId(null);
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setMessage("");
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setMessage("");

    if (editingLessonId) {
      const { error } = await supabase
        .from("lessons")
        .update({ title: title.trim(), description: description.trim() || null, video_url: videoUrl.trim() || null })
        .eq("id", editingLessonId);
      if (error) { setMessage(error.message); }
      else { setMessage("Lesson updated!"); resetForm(); }
    } else {
      const nextOrder = (data?.lessons.length ?? 0) + 1;
      const { error } = await supabase
        .from("lessons")
        .insert({ course_id: courseId, title: title.trim(), description: description.trim() || null, video_url: videoUrl.trim() || null, order_index: nextOrder });
      if (error) { setMessage(error.message); }
      else { setMessage("Lesson added!"); resetForm(); }
    }

    setSaving(false);
    queryClient.invalidateQueries({ queryKey: ["manage-course", courseId, userId] });
  }

  async function deleteLesson(lessonId: string) {
    if (!confirm("Delete this lesson?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    queryClient.invalidateQueries({ queryKey: ["manage-course", courseId, userId] });
  }

  if (isLoading) {
    return (
      <main className="lms-page" style={{ paddingTop: 48 }}>
        <div className="lms-container">
          <div className="lms-skeleton" style={{ height: 14, width: 160, marginBottom: 24 }} />
          <div className="lms-skeleton" style={{ height: 40, width: "50%", marginBottom: 12 }} />
          <div className="lms-skeleton" style={{ height: 200, borderRadius: 16 }} />
        </div>
      </main>
    );
  }

  if (error || !data?.course) {
    return (
      <main className="lms-page" style={{ paddingTop: 48 }}>
        <div className="lms-container">
          <div className="lms-alert lms-alert--error">Course not found.</div>
        </div>
      </main>
    );
  }

  const { course, lessons, students } = data;

  return (
    <main className="lms-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="lms-container">
        <button onClick={() => router.push("/instructor")} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--accent-hover)", marginBottom: 28, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div style={{ marginBottom: 32 }}>
          <p className="lms-page-eyebrow">Instructor</p>
          <h1 className="lms-page-title">Manage Lessons</h1>
          <p style={{ fontSize: 15, color: "var(--text-muted)", marginTop: 8 }}>{course.title}</p>
        </div>

        {/* Add/Edit Lesson Form */}
        <div className="lms-card" style={{ padding: 32, marginBottom: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            {editingLessonId ? "Edit Lesson" : "Add New Lesson"}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
            Fill in the lesson details and paste a YouTube, Vimeo, or direct video URL.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label className="lms-label">Lesson Title *</label>
              <input className="lms-input" type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Introduction to React Hooks" required />
            </div>
            <div>
              <label className="lms-label">Description</label>
              <textarea className="lms-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="What will students learn in this lesson?" rows={4} />
            </div>
            <div>
              <label className="lms-label">Video URL</label>
              <input className="lms-input" type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/..." />
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Supports YouTube, Vimeo, or direct MP4 links.</p>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" disabled={saving} className="lms-btn lms-btn--primary">
                {saving ? "Saving..." : editingLessonId ? "Update Lesson" : "Add Lesson"}
              </button>
              {editingLessonId && (
                <button type="button" onClick={resetForm} className="lms-btn lms-btn--secondary">Cancel</button>
              )}
            </div>

            {message && <div className={`lms-alert ${message.includes("!") ? "lms-alert--success" : "lms-alert--error"}`}>{message}</div>}
          </form>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 20 }}>
          {(["lessons", "students"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="lms-btn"
              style={{
                background: activeTab === tab ? "var(--accent-glow)" : "transparent",
                color: activeTab === tab ? "var(--accent-hover)" : "var(--text-muted)",
                border: activeTab === tab ? "1px solid var(--border-accent)" : "1px solid transparent",
                textTransform: "capitalize",
                gap: 8,
              }}
            >
              {tab === "lessons" ? <BookOpen size={15} /> : <Users size={15} />}
              {tab === "lessons" ? `Lessons (${lessons.length})` : `Students (${students.length})`}
            </button>
          ))}
        </div>

        {/* Lessons Tab */}
        {activeTab === "lessons" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {lessons.length === 0 ? (
              <div className="lms-card" style={{ padding: 48, textAlign: "center" }}>
                <p style={{ color: "var(--text-muted)" }}>No lessons yet. Use the form above to add your first lesson.</p>
              </div>
            ) : lessons.map((lesson, index) => (
              <div key={lesson.id} className="lms-card" style={{ padding: 20 }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 16, flex: 1 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--accent-glow)", color: "var(--accent-hover)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>{lesson.title}</h3>
                      {lesson.description && <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 6 }}>{lesson.description}</p>}
                      {lesson.video_url && (
                        <a href={lesson.video_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "var(--accent-hover)", display: "inline-flex", alignItems: "center", gap: 4 }}>
                          ▶ Preview Video
                        </a>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button className="lms-btn lms-btn--secondary lms-btn--sm" onClick={() => startEditing(lesson)}>Edit</button>
                    <button className="lms-btn lms-btn--danger lms-btn--sm" onClick={() => deleteLesson(lesson.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div>
            {students.length === 0 ? (
              <div className="lms-card" style={{ padding: 48, textAlign: "center" }}>
                <Users size={36} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
                <p style={{ color: "var(--text-muted)" }}>No students enrolled in this course yet.</p>
              </div>
            ) : (
              <div className="lms-table-wrapper">
                <table className="lms-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Student</th>
                      <th>Email</th>
                      <th>Enrolled On</th>
                      <th>Progress</th>
                      <th>Lessons Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => {
                      const pct = s.total_lessons > 0 ? Math.round((s.completed_lessons / s.total_lessons) * 100) : 0;
                      const initials = s.student_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
                      return (
                        <tr key={s.id}>
                          <td style={{ color: "var(--text-muted)", fontSize: 13 }}>{i + 1}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg, var(--accent), #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white", flexShrink: 0 }}>
                                {initials}
                              </div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{s.student_name}</span>
                            </div>
                          </td>
                          <td style={{ fontSize: 13 }}>{s.student_email}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                              <Calendar size={12} />
                              {new Date(s.enrolled_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </div>
                          </td>
                          <td style={{ minWidth: 140 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div className="lms-progress-track" style={{ flex: 1 }}>
                                <div className="lms-progress-fill" style={{ width: `${pct}%` }} />
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 700, color: pct === 100 ? "var(--green)" : "var(--text-secondary)", minWidth: 36 }}>{pct}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`lms-badge ${pct === 100 ? "lms-badge--green" : "lms-badge--accent"}`}>
                              {s.completed_lessons}/{s.total_lessons}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}