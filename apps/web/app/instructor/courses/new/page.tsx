"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

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
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError("You must be logged in.");
        setLoading(false);
        return;
      }

      let thumbnailUrl: string | null = null;

      if (thumbnail) {
        const fileExt = thumbnail.name.split(".").pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${session.user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("course-thumbnails")
          .upload(filePath, thumbnail);

        if (uploadError) {
          setError(uploadError.message);
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from("course-thumbnails")
          .getPublicUrl(filePath);

        thumbnailUrl = publicUrlData.publicUrl;
      }

      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, description, category, thumbnail_url: thumbnailUrl }),
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.details) {
          setError(Object.values(result.details).flat().join(", "));
        } else {
          setError(result.error || "Failed to create course");
        }
        return;
      }

      router.push("/instructor");
      router.refresh();
    } catch (err) {
      console.error("CREATE COURSE ERROR:", err);
      setError("Something went wrong.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="lms-page-title">Create a New Course</h1>
          <p className="lms-page-subtitle">Add the basic information about your course to get started.</p>
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
                  placeholder="e.g. Complete React Course 2026"
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
                  placeholder="e.g. Web Development, Data Science"
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
                />
              </div>

              <div>
                <label className="lms-label">Course Thumbnail</label>
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={e => setThumbnail(e.target.files?.[0] ?? null)}
                  style={{ background: "var(--bg-input)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
                />
                <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 6 }}>
                  Recommended: 16:9 ratio, JPG/PNG/WebP. Max 5MB.
                </p>
              </div>

              {error && <div className="lms-alert lms-alert--error">{error}</div>}

              <Button
                type="submit"
                disabled={loading}
                style={{ background: "var(--accent)", color: "white", height: 44, fontSize: 15, fontWeight: 600, width: "100%" }}
              >
                {loading ? "Creating Course..." : "Create Course"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}