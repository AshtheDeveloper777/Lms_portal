"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
  console.log("COURSES: query started");

  const { data, error } = await supabase
    .from("courses")
    .select(
      "id, title, description, category, thumbnail_url, published, created_at"
    )
    .eq("published", true)
    .order("created_at", { ascending: false });

  console.log("COURSES: query finished");
  console.log("COURSES DATA:", data);
  console.log("COURSES ERROR MESSAGE:", error?.message);
  console.log("COURSES ERROR DETAILS:", error);

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export default function CoursesPage() {
  const {
    data: courses = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["published-courses"],
    queryFn: fetchCourses,
  });

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-slate-400">Loading courses...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg border border-red-800 bg-red-950/30 p-4 text-red-400">
            Failed to load courses.
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm font-medium text-blue-400">
            EXPLORE COURSES
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Learn. Build. Grow.
          </h1>

          <p className="mt-3 max-w-2xl text-slate-400">
            Explore practical courses designed to help you build
            real-world technical skills.
          </p>
        </div>

        {/* Courses */}
        {courses.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-8 text-center">
            <p className="text-slate-400">
              No published courses available.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 transition hover:-translate-y-1 hover:border-slate-700"
              >
                {/* Thumbnail */}
                {course.thumbnail_url ? (
                  <img
                    src={course.thumbnail_url}
                    alt={course.title}
                    className="h-48 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-48 items-center justify-center bg-slate-800">
                    <span className="text-slate-500">
                      No thumbnail
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {course.category && (
                    <p className="text-sm font-medium text-blue-400">
                      {course.category}
                    </p>
                  )}

                  <h2 className="mt-2 text-xl font-bold">
                    {course.title}
                  </h2>

                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">
                    {course.description}
                  </p>

                  <Link
                    href={`/courses/${course.id}`}
                    className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold hover:bg-blue-700"
                  >
                    View Course →
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