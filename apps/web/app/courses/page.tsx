"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Clock, Star } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRealtimeInvalidate } from "@/hooks/use-realtime-invalidate";

type Course = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  thumbnail_url: string | null;
  published: boolean;
  created_at: string;
};

async function fetchCourses(): Promise<Course[]> {
  const { data, error } = await supabase
    .from("courses")
    .select("id, title, description, category, thumbnail_url, published, created_at")
    .eq("published", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export default function CoursesPage() {
  const { data: courses = [], isLoading, error } = useQuery({
    queryKey: ["published-courses"],
    queryFn: fetchCourses,
  });

  // Real-time: invalidate when courses table changes
  useRealtimeInvalidate("courses", [["published-courses"]]);

  if (isLoading) {
    return (
      <main className="lms-page" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="lms-container">
          <div className="lms-page-header">
            <div className="lms-skeleton" style={{ height: 12, width: 140, marginBottom: 12 }} />
            <div className="lms-skeleton" style={{ height: 40, width: 320, marginBottom: 10 }} />
            <div className="lms-skeleton" style={{ height: 16, width: 480 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="lms-card" style={{ overflow: "hidden" }}>
                <div className="lms-skeleton" style={{ height: 190 }} />
                <div style={{ padding: 22 }}>
                  <div className="lms-skeleton" style={{ height: 11, width: 80, marginBottom: 10 }} />
                  <div className="lms-skeleton" style={{ height: 22, width: "85%", marginBottom: 8 }} />
                  <div className="lms-skeleton" style={{ height: 14, width: "100%", marginBottom: 6 }} />
                  <div className="lms-skeleton" style={{ height: 14, width: "75%", marginBottom: 20 }} />
                  <div className="lms-skeleton" style={{ height: 38, width: 130, borderRadius: 10 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="lms-page" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="lms-container">
          <div className="lms-alert lms-alert--error">Failed to load courses. Please refresh the page.</div>
        </div>
      </main>
    );
  }

  return (
    <main className="lms-page" style={{ paddingTop: 48, paddingBottom: 80 }}>
      <div className="lms-container">
        {/* Header */}
        <div className="lms-page-header">
          <p className="lms-page-eyebrow">Explore Courses</p>
          <h1 className="lms-page-title">Learn. Build. Grow.</h1>
          <p className="lms-page-subtitle" style={{ maxWidth: 560 }}>
            Explore practical courses designed to help you build real-world technical skills.
          </p>
        </div>

        {/* Courses */}
        {courses.length === 0 ? (
          <div className="lms-card" style={{ padding: 64, textAlign: "center" }}>
            <BookOpen size={40} style={{ color: "var(--text-muted)", margin: "0 auto 16px" }} />
            <p style={{ color: "var(--text-muted)", fontSize: 15 }}>No published courses available yet. Check back soon!</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {courses.map((course) => (
              <div key={course.id} className="lms-course-card">
                {/* Thumbnail */}
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="lms-course-thumbnail"
                  />
                ) : (
                  <div className="lms-course-thumbnail-placeholder">
                    <BookOpen size={32} />
                  </div>
                )}

                {/* Content */}
                <div className="lms-course-body">
                  {course.category && (
                    <span className="lms-badge lms-badge--accent" style={{ marginBottom: 10 }}>
                      {course.category}
                    </span>
                  )}

                  <h2 style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    marginBottom: 8,
                    lineHeight: 1.3,
                  }}>
                    {course.title}
                  </h2>

                  <p style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    lineHeight: 1.6,
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                    flex: 1,
                    marginBottom: 20,
                  }}>
                    {course.description}
                  </p>

                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                    <Clock size={12} style={{ color: "var(--text-muted)" }} />
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Added {new Date(course.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>

                  <Link
                    href={`/courses/${course.id}`}
                    className="lms-btn lms-btn--primary"
                    style={{ width: "100%", justifyContent: "center" }}
                  >
                    View Course ?
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
