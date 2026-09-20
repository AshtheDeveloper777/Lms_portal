"use client";

import { FormEvent, useEffect, useState } from "react";
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

export default function EditCoursePage() {
  const params = useParams();
  const router = useRouter();

  const courseId = params.id as string;

  const [course, setCourse] = useState<Course | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchCourse() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("courses")
        .select(
          "id, title, description, category, thumbnail_url, published"
        )
        .eq("id", courseId)
        .eq("instructor_id", user.id)
        .single();

      if (error) {
        console.error("COURSE ERROR:", error);
        setMessage("Course not found.");
        setLoading(false);
        return;
      }

      setCourse(data);

      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category || "");

      setLoading(false);
    }

    fetchCourse();
  }, [courseId, router]);

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

      let thumbnailUrl = course?.thumbnail_url || null;

      // Upload new thumbnail only if user selected one
      if (thumbnail) {
        const fileExt = thumbnail.name.split(".").pop();

        const fileName = `${user.id}/${courseId}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(fileName, thumbnail);

        if (uploadError) {
          console.error("THUMBNAIL UPLOAD ERROR:", uploadError);
          setMessage(uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("course-thumbnails")
          .getPublicUrl(fileName);

        thumbnailUrl = publicUrlData.publicUrl;
      }

      const { error } = await supabase
        .from("courses")
        .update({
          title,
          description,
          category,
          thumbnail_url: thumbnailUrl,
        })
        .eq("id", courseId)
        .eq("instructor_id", user.id);

      if (error) {
        console.error("UPDATE COURSE ERROR:", error);
        setMessage(error.message);
        return;
      }

      setMessage("Course updated successfully!");

      setCourse((current) =>
        current
          ? {
              ...current,
              title,
              description,
              category,
              thumbnail_url: thumbnailUrl,
            }
          : current
      );

      setThumbnail(null);
    } catch (error) {
      console.error("UNEXPECTED ERROR:", error);
      setMessage("Something went wrong while updating the course.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl">
          <p className="text-slate-400">Loading course...</p>
        </div>
      </main>
    );
  }

  if (!course) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-3xl rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <h1 className="text-2xl font-bold">Course Not Found</h1>

          <p className="mt-3 text-slate-400">
            {message || "This course could not be found."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => router.push("/instructor")}
          className="mb-6 text-sm text-blue-400 hover:text-blue-300"
        >
          ← Back to Dashboard
        </button>

        <div className="mb-8">
          <p className="text-sm font-medium text-blue-400">
            INSTRUCTOR
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Edit Course
          </h1>

          <p className="mt-3 text-slate-400">
            Update your course information.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >
          <div>
            <label className="mb-2 block text-sm font-medium">
              Course title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={6}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Category
            </label>

            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">
              Course thumbnail
            </label>

            {course.thumbnail_url && (
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="mb-4 h-48 w-full rounded-lg object-cover"
              />
            )}

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) =>
                setThumbnail(e.target.files?.[0] || null)
              }
              className="block w-full text-sm text-slate-400"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>

          {message && (
            <p className="rounded-lg bg-slate-800 p-4 text-sm text-slate-300">
              {message}
            </p>
          )}
        </form>
      </div>
    </main>
  );
}