"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Course = {
  id: string;
  title: string;
  description: string;
  category: string | null;
  published: boolean;
  created_at: string;
};

export default function InstructorDashboard() {
  const router = useRouter();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  async function fetchCourses() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Not logged in
      if (!user) {
        router.push("/auth");
        return;
      }

      // Get user's role
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.error("PROFILE ERROR:", profileError);
        setLoading(false);
        return;
      }

      // Only instructors can access this dashboard
      if (profile.role !== "instructor") {
        router.push("/auth");
        return;
      }

      // Get instructor's courses
      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, title, description, category, published, created_at"
        )
        .eq("instructor_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("COURSES ERROR:", error);
        return;
      }

      setCourses(data || []);
    } catch (error) {
      console.error("UNEXPECTED ERROR:", error);
    } finally {
      setLoading(false);
    }
  }

  async function togglePublish(
    courseId: string,
    currentStatus: boolean
  ) {
    const { error } = await supabase
      .from("courses")
      .update({
        published: !currentStatus,
      })
      .eq("id", courseId);

    if (error) {
      console.error("PUBLISH ERROR:", error);
      return;
    }

    await fetchCourses();
  }

  async function deleteCourse(courseId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this course?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      console.error("DELETE COURSE ERROR:", error);
      return;
    }

    await fetchCourses();
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <section className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <p className="text-sm font-medium text-blue-400">
              INSTRUCTOR DASHBOARD
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Manage your courses
            </h1>

            <p className="mt-3 text-slate-400">
              Create and manage your courses and lessons.
            </p>
          </div>

          <Link
            href="/instructor/courses/new"
            className="rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
          >
            + Create Course
          </Link>
        </div>

        {/* Stats */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2">

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Total Courses
            </p>

            <p className="mt-2 text-3xl font-bold">
              {courses.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              Published Courses
            </p>

            <p className="mt-2 text-3xl font-bold">
              {courses.filter((course) => course.published).length}
            </p>
          </div>

        </div>

        {/* Courses */}
        <div>
          <h2 className="mb-6 text-2xl font-bold">
            Your Courses
          </h2>

          {loading ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-slate-400">
              Loading courses...
            </div>
          ) : courses.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">

              <p className="text-slate-400">
                You haven't created any courses yet.
              </p>

              <Link
                href="/instructor/courses/new"
                className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700"
              >
                Create your first course
              </Link>

            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">

              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
                >

                  {/* Course Header */}
                  <div className="mb-4 flex items-start justify-between gap-4">

                    <div>
                      <h3 className="text-xl font-bold">
                        {course.title}
                      </h3>

                      {course.category && (
                        <p className="mt-1 text-sm text-blue-400">
                          {course.category}
                        </p>
                      )}
                    </div>

                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        course.published
                          ? "bg-green-500/10 text-green-400"
                          : "bg-yellow-500/10 text-yellow-400"
                      }`}
                    >
                      {course.published
                        ? "Published"
                        : "Draft"}
                    </span>

                  </div>

                  {/* Description */}
                  <p className="mb-6 line-clamp-3 text-sm leading-6 text-slate-400">
                    {course.description}
                  </p>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3">

                    {/* Manage Lessons */}
                    <Link
                      href={`/instructor/courses/${course.id}`}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold hover:bg-blue-700"
                    >
                      Manage Lessons
                    </Link>

                    {/* Publish / Unpublish */}
                    <button
                      type="button"
                      onClick={() =>
                        togglePublish(
                          course.id,
                          course.published
                        )
                      }
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold hover:bg-slate-800"
                    >
                      {course.published
                        ? "Unpublish"
                        : "Publish"}
                    </button>

                    {/* Edit Course */}
                    <Link
                      href={`/instructor/courses/${course.id}/edit`}
                      className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800"
                    >
                      Edit Course
                    </Link>

                    {/* Delete Course */}
                    <button
                      type="button"
                      onClick={() => deleteCourse(course.id)}
                      className="rounded-lg border border-red-700 px-4 py-2 text-sm font-semibold text-red-400 hover:bg-red-900/20"
                    >
                      Delete Course
                    </button>

                  </div>
                </div>
              ))}

            </div>
          )}
        </div>

      </section>
    </main>
  );
}