"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  title: string;
  description: string;
};

type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  order_index: number;
};

export default function ManageLessonsPage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [editingLessonId, setEditingLessonId] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadData();
  }, [courseId]);

  async function loadData() {
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      // Get course
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select("id, title, description")
        .eq("id", courseId)
        .eq("instructor_id", user.id)
        .single();

      if (courseError) {
        console.error("COURSE ERROR MESSAGE:", courseError.message);
        console.error("COURSE ERROR DETAILS:", courseError.details);
        console.error("COURSE ERROR HINT:", courseError.hint);
        console.error("COURSE ERROR CODE:", courseError.code);

        setMessage(courseError.message);
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // Get lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(
          "id, course_id, title, description, video_url, order_index"
        )
        .eq("course_id", courseId)
        .order("order_index", { ascending: true });

      if (lessonsError) {
        console.error("LESSONS ERROR MESSAGE:", lessonsError.message);
        console.error("LESSONS ERROR DETAILS:", lessonsError.details);
        console.error("LESSONS ERROR HINT:", lessonsError.hint);
        console.error("LESSONS ERROR CODE:", lessonsError.code);

        setMessage(lessonsError.message);
        setLoading(false);
        return;
      }

      setLessons(lessonsData || []);
    } catch (error) {
      console.error("LOAD ERROR:", error);
      setMessage("Something went wrong while loading the course.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      // --------------------------------
      // UPDATE LESSON
      // --------------------------------
      if (editingLessonId) {
        const { error } = await supabase
          .from("lessons")
          .update({
            title,
            description: description || null,
            video_url: videoUrl || null,
          })
          .eq("id", editingLessonId)
          .eq("course_id", courseId);

        if (error) {
          console.error("UPDATE ERROR MESSAGE:", error.message);
          console.error("UPDATE ERROR DETAILS:", error.details);
          console.error("UPDATE ERROR HINT:", error.hint);
          console.error("UPDATE ERROR CODE:", error.code);

          setMessage(
            `${error.message} | ${error.details || ""} | ${
              error.hint || ""
            }`
          );

          setSaving(false);
          return;
        }

        setMessage("Lesson updated successfully!");

        resetForm();

        await loadData();

        setSaving(false);
        return;
      }

      // --------------------------------
      // CREATE LESSON
      // --------------------------------

      const nextOrder =
        lessons.length > 0
          ? Math.max(...lessons.map((lesson) => lesson.order_index)) + 1
          : 1;

      const { data, error } = await supabase
        .from("lessons")
        .insert({
          course_id: courseId,
          title,
          description: description || null,
          video_url: videoUrl || null,
          order_index: nextOrder,
        })
        .select()
        .single();

      if (error) {
        console.error("CREATE ERROR MESSAGE:", error.message);
        console.error("CREATE ERROR DETAILS:", error.details);
        console.error("CREATE ERROR HINT:", error.hint);
        console.error("CREATE ERROR CODE:", error.code);

        setMessage(
          `${error.message} | ${error.details || ""} | ${
            error.hint || ""
          }`
        );

        setSaving(false);
        return;
      }

      console.log("CREATED LESSON:", data);

      setMessage("Lesson created successfully!");

      resetForm();

      await loadData();
    } catch (error) {
      console.error("UNEXPECTED ERROR:", error);
      setMessage("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setTitle("");
    setDescription("");
    setVideoUrl("");
    setEditingLessonId(null);
  }

  function startEditing(lesson: Lesson) {
    setEditingLessonId(lesson.id);
    setTitle(lesson.title);
    setDescription(lesson.description || "");
    setVideoUrl(lesson.video_url || "");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteLesson(lessonId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this lesson?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("lessons")
      .delete()
      .eq("id", lessonId)
      .eq("course_id", courseId);

    if (error) {
      console.error("DELETE ERROR MESSAGE:", error.message);
      console.error("DELETE ERROR DETAILS:", error.details);
      console.error("DELETE ERROR HINT:", error.hint);
      console.error("DELETE ERROR CODE:", error.code);

      setMessage(
        `${error.message} | ${error.details || ""} | ${
          error.hint || ""
        }`
      );

      return;
    }

    setMessage("Lesson deleted successfully!");

    await loadData();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-slate-400">Loading course...</p>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold">
            Course Not Found
          </h1>

          <p className="mt-3 text-slate-400">
            {message || "Unable to load this course."}
          </p>

          <button
            onClick={() => router.push("/instructor")}
            className="mt-6 rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <button
          onClick={() => router.push("/instructor")}
          className="mb-6 text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </button>

        {/* Course Header */}
        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-wide text-blue-400">
            Instructor
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Manage Lessons
          </h1>

          <p className="mt-3 text-slate-400">
            {course.title}
          </p>
        </div>

        {/* Lesson Form */}
        <form
          onSubmit={handleSubmit}
          className="mb-10 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >
          <div className="mb-6">
            <h2 className="text-2xl font-bold">
              {editingLessonId
                ? "Edit Lesson"
                : "Add New Lesson"}
            </h2>

            <p className="mt-2 text-sm text-slate-400">
              Add lesson information and an optional video URL.
            </p>
          </div>

          {/* Title */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">
              Lesson Title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Web Development Fundamentals"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div className="mb-5">
            <label className="mb-2 block text-sm font-medium">
              Lesson Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn..."
              rows={5}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Video URL */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium">
              Video URL
            </label>

            <input
              type="url"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />

            <p className="mt-2 text-xs text-slate-500">
              Paste a YouTube or other publicly accessible video URL.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingLessonId
                  ? "Update Lesson"
                  : "Add Lesson"}
            </button>

            {editingLessonId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-slate-700 px-6 py-3 font-semibold hover:bg-slate-800"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Message */}
          {message && (
            <div className="mt-5 rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
              {message}
            </div>
          )}
        </form>

        {/* Lessons */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">
                Course Lessons
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                {lessons.length} lesson
                {lessons.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {lessons.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
              <p className="text-slate-400">
                No lessons added yet.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Use the form above to add your first lesson.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                    {/* Lesson Info */}
                    <div className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-600/10 font-bold text-blue-400">
                        {index + 1}
                      </div>

                      <div>
                        <h3 className="text-lg font-bold">
                          {lesson.title}
                        </h3>

                        {lesson.description && (
                          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                            {lesson.description}
                          </p>
                        )}

                        {lesson.video_url && (
                          <a
                            href={lesson.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-block text-sm font-medium text-blue-400 hover:text-blue-300"
                          >
                            ▶ Watch Video
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 gap-2">
                      <button
                        type="button"
                        onClick={() => startEditing(lesson)}
                        className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteLesson(lesson.id)}
                        className="rounded-lg border border-red-900 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-950"
                      >
                        Delete
                      </button>
                    </div>
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