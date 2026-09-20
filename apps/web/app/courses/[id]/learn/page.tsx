"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  title: string;
};

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  order_index: number;
};

type Progress = {
  lesson_id: string;
  completed: boolean;
};

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const [loading, setLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [markingComplete, setMarkingComplete] = useState(false);

  // Fetch course, lessons, enrollment and progress
  useEffect(() => {
    async function loadLearnPage() {
      setLoading(true);

      // Get logged-in user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      // Check enrollment
      const { data: enrollment, error: enrollmentError } =
        await supabase
          .from("enrollments")
          .select("id")
          .eq("student_id", user.id)
          .eq("course_id", courseId)
          .maybeSingle();

      if (enrollmentError) {
        console.error("ENROLLMENT ERROR:", enrollmentError);
        setLoading(false);
        return;
      }

      if (!enrollment) {
        setIsEnrolled(false);
        setLoading(false);
        return;
      }

      setIsEnrolled(true);

      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title")
        .eq("id", courseId)
        .single();

      if (courseError) {
        console.error("COURSE ERROR:", courseError);
      } else {
        setCourse(courseData);
      }

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          "id, course_id, title, description, video_url, order_index"
        )
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lessonsError) {
        console.error("LESSONS ERROR:", lessonsError);
      } else {
        setLessons(lessonsData || []);

        // Select first lesson
        if (lessonsData && lessonsData.length > 0) {
        setSelectedLesson(lessonsData[0] ?? null);        }
      }

      // Fetch student progress
      const { data: progressData, error: progressError } =
        await supabase
          .from("lesson_progress")
          .select("lesson_id, completed")
          .eq("student_id", user.id);

      if (progressError) {
        console.error("PROGRESS ERROR:", progressError);
      } else {
        setProgress(progressData || []);
      }

      setLoading(false);
    }

    loadLearnPage();
  }, [courseId, router]);

  // Check whether selected lesson is completed
  const isCompleted =
    selectedLesson &&
    progress.some(
      (item) =>
        item.lesson_id === selectedLesson.id && item.completed === true
    );

  // Number of completed lessons
  const completedLessons = progress.filter(
    (item) => item.completed === true
  ).length;

  // Calculate percentage
  const progressPercentage =
    lessons.length > 0
      ? Math.round((completedLessons / lessons.length) * 100)
      : 0;

  // Mark lesson as complete
  async function markComplete() {
    if (!selectedLesson) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

    setMarkingComplete(true);

    const { error } = await supabase
      .from("lesson_progress")
      .upsert(
        {
          student_id: user.id,
          lesson_id: selectedLesson.id,
          completed: true,
          completed_at: new Date().toISOString(),
        },
        {
          onConflict: "student_id,lesson_id",
        }
      );

    if (error) {
      console.error("MARK COMPLETE ERROR:", error);
      setMarkingComplete(false);
      return;
    }

    // Update progress immediately in UI
    setProgress((currentProgress) => {
      const existing = currentProgress.find(
        (item) => item.lesson_id === selectedLesson.id
      );

      if (existing) {
        return currentProgress.map((item) =>
          item.lesson_id === selectedLesson.id
            ? { ...item, completed: true }
            : item
        );
      }

      return [
        ...currentProgress,
        {
          lesson_id: selectedLesson.id,
          completed: true,
        },
      ];
    });

    setMarkingComplete(false);
  }

  // Go to next lesson
  function goToNextLesson() {
    if (!selectedLesson) return;

    const currentIndex = lessons.findIndex(
      (lesson) => lesson.id === selectedLesson.id
    );

    if (currentIndex < lessons.length - 1) {
      setSelectedLesson(lessons[currentIndex + 1] ?? null);
    }
  }

  // Go to previous lesson
  function goToPreviousLesson() {
    if (!selectedLesson) return;

    const currentIndex = lessons.findIndex(
      (lesson) => lesson.id === selectedLesson.id
    );

    if (currentIndex > 0) {
      setSelectedLesson(lessons[currentIndex - 1] ?? null);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <p className="text-gray-600">Loading course...</p>
        </div>
      </main>
    );
  }

  if (!isEnrolled) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center shadow">
          <h1 className="text-2xl font-bold text-gray-900">
            Enrollment Required
          </h1>

          <p className="mt-2 text-gray-600">
            You need to enroll in this course before you can start learning.
          </p>

          <button
            onClick={() => router.push(`/courses/${courseId}`)}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Go to Course
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Learning
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900">
            {course?.title}
          </h1>

          {/* Progress */}
          <div className="mt-5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600">
                Course Progress
              </span>

              <span className="text-sm font-bold text-blue-600">
                {progressPercentage}%
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              {completedLessons} / {lessons.length} lessons completed
            </p>
          </div>
        </div>
      </header>

      {/* Main */}
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        {/* Lesson Sidebar */}
        <aside className="rounded-xl border bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-gray-900">
            Course Lessons
          </h2>

          {lessons.length === 0 ? (
            <p className="text-sm text-gray-500">
              No lessons available.
            </p>
          ) : (
            <div className="space-y-2">
              {lessons.map((lesson, index) => {
                const completed = progress.some(
                  (item) =>
                    item.lesson_id === lesson.id &&
                    item.completed === true
                );

                const selected = selectedLesson?.id === lesson.id;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setSelectedLesson(lesson)}
                    className={`w-full rounded-lg border p-3 text-left transition ${
                      selected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700">
                        {index + 1}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {lesson.title}
                        </p>

                        {completed && (
                          <p className="mt-1 text-xs font-medium text-green-600">
                            ✓ Completed
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </aside>

        {/* Lesson Content */}
        <section className="rounded-xl border bg-white p-6 shadow-sm">
          {!selectedLesson ? (
            <div className="py-16 text-center">
              <p className="text-gray-500">
                Select a lesson to start learning.
              </p>
            </div>
          ) : (
            <>
              {/* Lesson title */}
              <div>
                <p className="text-sm font-medium text-blue-600">
                  Lesson {selectedLesson.order_index}
                </p>

                <h2 className="mt-1 text-2xl font-bold text-gray-900">
                  {selectedLesson.title}
                </h2>
              </div>

              {/* Video */}
              {selectedLesson.video_url ? (
                <div className="mt-6">
                  <a
                    href={selectedLesson.video_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    ▶ Watch Lesson Video
                  </a>
                </div>
              ) : (
                <div className="mt-6 rounded-lg bg-gray-100 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    No video available for this lesson.
                  </p>
                </div>
              )}

              {/* Description */}
              {selectedLesson.description && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    About this lesson
                  </h3>

                  <p className="mt-2 whitespace-pre-line text-gray-600">
                    {selectedLesson.description}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-8 flex flex-wrap items-center gap-3 border-t pt-6">
                {/* Previous */}
                <button
                  onClick={goToPreviousLesson}
                  disabled={
                    lessons.findIndex(
                      (lesson) => lesson.id === selectedLesson.id
                    ) === 0
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  ← Previous
                </button>

                {/* Mark Complete */}
                <button
                  onClick={markComplete}
                  disabled={isCompleted || markingComplete}
                  className={`rounded-lg px-5 py-2 font-semibold text-white ${
                    isCompleted
                      ? "cursor-not-allowed bg-green-600"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {markingComplete
                    ? "Saving..."
                    : isCompleted
                      ? "✓ Completed"
                      : "Mark as Complete"}
                </button>

                {/* Next */}
                {lessons.findIndex(
                  (lesson) => lesson.id === selectedLesson.id
                ) <
                  lessons.length - 1 && (
                  <button
                    onClick={goToNextLesson}
                    className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    Next Lesson →
                  </button>
                )}

                {/* Last lesson */}
                {lessons.findIndex(
                  (lesson) => lesson.id === selectedLesson.id
                ) ===
                  lessons.length - 1 &&
                  isCompleted && (
                    <span className="text-sm font-medium text-green-600">
                      🎉 Course completed!
                    </span>
                  )}
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}