"use client";

import { FormEvent, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    async function loadCourse() {
      const { data } = await supabase
        .from("courses")
        .select("id, title, description, category, thumbnail_url, published")
        .eq("id", courseId)
        .single();

      if (data) {
        setTitle(data.title);
        setDescription(data.description ?? "");
        setCategory(data.category ?? "");
        setPublished(data.published);
      }
      setFetching(false);
    }
    loadCourse();
  }, [courseId]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError("Not authenticated"); setLoading(false); return; }

      let thumbnailUrl: string | undefined;

      if (thumbnailFile) {
        const ext = thumbnailFile.name.split(".").pop();
        const path = `${session.user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(path, thumbnailFile);

        if (uploadError) { setError(uploadError.message); setLoading(false); return; }

        const { data: pub } = supabase.storage.from("course-thumbnails").getPublicUrl(path);
        thumbnailUrl = pub.publicUrl;
      }

      const updates: Partial<Course> & { thumbnail_url?: string } = {
        title,
        description,
        category: category || null,
        published,
      };
      if (thumbnailUrl) updates.thumbnail_url = thumbnailUrl;

      const { error: updateError } = await supabase
        .from("courses")
        .update(updates)
        .eq("id", courseId);

      if (updateError) {
        setError(updateError.message);
      } else {
        setSuccess("Course updated successfully!");
        setTimeout(() => router.push("/instructor"), 1200);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <main className="lms-page" style={{ paddingTop: 40 }}>
        <div className="lms-container" style={{ maxWidth: 700 }}>
          <div className="lms-skeleton" style={{ height: 14, width: 160, marginBottom: 24 }} />
          <div className="lms-skeleton" style={{ height: 40, width: "60%", marginBottom: 12 }} />
          <div className="lms-skeleton" style={{ height: 300, borderRadius: 16 }} />
        </div>
      </main>
    );
  }

  return (
    <main className="lms-page" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <div className="lms-container" style={{ maxWidth: 700 }}>
        <button
          onClick={() => router.push("/instructor")}
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 14, color: "var(--accent-hover)", background: "none", border: "none", cursor: "pointer", marginBottom: 28 }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </button>

        <div style={{ marginBottom: 28 }}>
          <p className="lms-page-eyebrow">Instructor</p>
          <h1 className="lms-page-title">Edit Course</h1>
          <p className="lms-page-subtitle">Update your course details. Changes are saved to the database immediately.</p>
        </div>

        <Card style={{ background: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: "var(--radius-xl)" }}>
          <CardContent style={{ padding: 36 }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 22 }}>

              <div>
                <label className="lms-label">Course Title *</label>
                <Input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Course title"
                  required
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label className="lms-label">Description *</label>
                <Textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe what students will learn..."
                  rows={6}
                  required
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)", resize: "vertical" }}
                />
              </div>

              <div>
                <label className="lms-label">Category</label>
                <Input
                  type="text"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  placeholder="e.g. Web Development"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label className="lms-label">Replace Thumbnail</label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={e => setThumbnailFile(e.target.files?.[0] ?? null)}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                />
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>Leave blank to keep the current thumbnail.</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", background: "var(--bg-surface)" }}>
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={e => setPublished(e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: "var(--accent)", cursor: "pointer" }}
                />
                <label htmlFor="published" style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", cursor: "pointer" }}>
                  Published — make this course visible to students
                </label>
              </div>

              {error && <div className="lms-alert lms-alert--error">{error}</div>}
              {success && <div className="lms-alert lms-alert--success">{success}</div>}

              <Button
                type="submit"
                disabled={loading}
                style={{ background: "var(--accent)", color: "white", height: 44, fontSize: 15, fontWeight: 600, width: "100%" }}
              >
                {loading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}