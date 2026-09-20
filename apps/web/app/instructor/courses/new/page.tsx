"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnail, setThumbnail] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");

    try {
      // Get logged-in user's session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in.");
        return;
      }

      let thumbnailUrl: string | null = null;

      // Upload thumbnail if selected
      if (thumbnail) {
        const fileExt = thumbnail.name.split(".").pop();

        const fileName = `${crypto.randomUUID()}.${fileExt}`;

        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(filePath, thumbnail);

        if (uploadError) {
          console.error("THUMBNAIL UPLOAD ERROR:", uploadError);
          setError(uploadError.message);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("course-thumbnails")
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrlData.publicUrl;
      }

      // Send course data to SERVER API
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          title,
          description,
          category,
          thumbnail_url: thumbnailUrl,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          const messages = Object.values(result.details)
            .flat()
            .join(", ");

          setError(messages);
        } else {
          setError(result.error || "Failed to create course");
        }

        return;
      }

      // Course successfully created
      router.push("/instructor");
      router.refresh();
    } catch (error) {
      console.error("CREATE COURSE ERROR:", error);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <p className="text-sm font-medium text-blue-400">
            INSTRUCTOR
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            Create a new course
          </h1>

          <p className="mt-3 text-slate-400">
            Add the basic information about your course.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >
          {/* Course Title */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Course title
            </label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete React Course"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Description
            </label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn..."
              rows={6}
              className="w-full resize-none rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="mb-2 block text-sm font-medium">
              Category
            </label>

            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Web Development"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Thumbnail */}
          <div>
            <label
              htmlFor="thumbnail"
              className="mb-2 block text-sm font-medium"
            >
              Course Thumbnail
            </label>

            <input
              id="thumbnail"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) =>
                setThumbnail(e.target.files?.[0] ?? null)
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300"
            />

            <p className="mt-2 text-xs text-slate-500">
              Recommended: professional 16:9 course image.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Creating Course..." : "Create Course"}
          </button>
        </form>
      </div>
    </main>
  );
}