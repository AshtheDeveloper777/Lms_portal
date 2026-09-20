"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  video_url: string | null;
  order_index: number;
};

export default function CourseDetailsPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      setLoading(true);

      // ==========================================
      // 1. CHECK CURRENT USER
      // ==========================================

      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("================================");
      console.log("DEBUG: CURRENT USER");
      console.log("USER:", user);
      console.log("USER ID:", user?.id);
      console.log("USER EMAIL:", user?.email);
      console.log("================================");

      // ==========================================
      // 2. FETCH COURSE
      // ==========================================

      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(
          "id, title, description, category, thumbnail_url, published"
        )
        .eq("id", courseId)
        .eq("published", true)
        .single();

      if (courseError) {
        console.error("COURSE ERROR:", courseError);
        setMessage("Course not found.");
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // ==========================================
      // 3. FETCH LESSONS
      // ==========================================

      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          "id, title, description, video_url, order_index"
        )
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lessonsError) {
        console.error("LESSONS ERROR:", lessonsError);
      } else {
        setLessons(lessonsData || []);
      }

      // ==========================================
      // 4. CHECK ENROLLMENT
      // ==========================================

      if (user) {
        console.log("Checking enrollment for:");
        console.log("Student ID:", user.id);
        console.log("Course ID:", courseId);

        const {
          data: enrollment,
          error: enrollmentError,
        } = await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();

        console.log("================================");
        console.log("DEBUG: ENROLLMENT RESULT");
        console.log("ENROLLMENT:", enrollment);
        console.log("ENROLLMENT ERROR:", enrollmentError);
        console.log("IS ENROLLED:", !!enrollment);
        console.log("================================");

        if (enrollmentError) {
          console.error(
            "ENROLLMENT CHECK ERROR:",
            enrollmentError
          );

          setIsEnrolled(false);
        } else {
          setIsEnrolled(!!enrollment);
        }
      } else {
        console.log("================================");
        console.log("DEBUG: USER IS NOT LOGGED IN");
        console.log("IS ENROLLED: false");
        console.log("================================");

        setIsEnrolled(false);
      }

      setLoading(false);
    }

    fetchCourse();
  }, [courseId]);

  // ==========================================
  // ENROLL STUDENT
  // ==========================================

  async function handleEnroll() {
    setEnrolling(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      console.log("ENROLL BUTTON USER:", user);

      if (!user) {
        console.log("No user → redirecting to /auth");

        router.push("/auth");
        return;
      }

      const { error } = await supabase
        .from("enrollments")
        .insert({
          student_id: user.id,
          course_id: courseId,
        });

      if (error) {
        console.error("ENROLLMENT ERROR:", error);
        setMessage(error.message);
        return;
      }

      console.log("ENROLLMENT CREATED");

      setIsEnrolled(true);
      setMessage("Successfully enrolled in the course!");
    } catch (error) {
      console.error("UNEXPECTED ERROR:", error);
      setMessage("Something went wrong.");
    } finally {
      setEnrolling(false);
    }
  }

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-slate-400">
            Loading course...
          </p>
        </div>
      </main>
    );
  }

  // ==========================================
  // COURSE NOT FOUND
  // ==========================================

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-10 text-center">
          <h1 className="text-2xl font-bold">
            Course Not Found
          </h1>

          <p className="mt-3 text-slate-400">
            {message || "This course could not be found."}
          </p>

          <Link
            href="/courses"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
          >
            Back to Courses
          </Link>
        </div>
      </main>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-6xl">

        <Link
          href="/courses"
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Courses
        </Link>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">

          {/* Thumbnail */}

          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="h-72 w-full object-cover"
            />
          ) : (
            <div className="flex h-72 w-full items-center justify-center bg-slate-800">
              <span className="text-slate-500">
                No thumbnail available
              </span>
            </div>
          )}

          {/* Course information */}

          <div className="p-8">

            {course.category && (
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-400">
                {course.category}
              </p>
            )}

            <h1 className="mt-2 text-4xl font-bold">
              {course.title}
            </h1>

            <p className="mt-5 max-w-3xl leading-7 text-slate-400">
              {course.description}
            </p>

            {/* Enrollment */}

            <div className="mt-8 flex flex-wrap items-center gap-4">

              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enrolling
                    ? "Enrolling..."
                    : "Enroll Now"}
                </button>
              ) : (
                <>
                  <Link
                    href={`/courses/${course.id}/learn`}
                    className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700"
                  >
                    Start Learning →
                  </Link>

                  <span className="rounded-lg bg-green-500/10 px-4 py-3 text-sm font-medium text-green-400">
                    ✓ Enrolled
                  </span>
                </>
              )}

            </div>

            {message && (
              <p className="mt-4 rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
                {message}
              </p>
            )}

          </div>
        </div>

        {/* Lessons */}

        <section className="mt-8">

          <h2 className="text-2xl font-bold">
            Course Lessons
          </h2>

          <p className="mt-2 text-slate-400">
            {lessons.length} lessons included in this course.
          </p>

          <div className="mt-5 space-y-3">

            {lessons.length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 p-6">
                <p className="text-slate-400">
                  No lessons available yet.
                </p>
              </div>
            ) : (
              lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 p-5"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-sm font-bold text-blue-400">
                    {index + 1}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {lesson.title}
                    </h3>

                    {lesson.description && (
                      <p className="mt-1 text-sm text-slate-400">
                        {lesson.description}
                      </p>
                    )}
                  </div>

                  {isEnrolled && (
                    <span className="text-xs text-slate-500">
                      Lesson {index + 1}
                    </span>
                  )}
                </div>
              ))
            )}

          </div>
        </section>

      </div>
    </main>
  );
}