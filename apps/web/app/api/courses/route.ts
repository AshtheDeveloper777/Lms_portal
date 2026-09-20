import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { courseSchema } from "@/lib/validations/course";

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Server-side Zod validation
    const result = courseSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: result.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("courses")
      .insert({
        instructor_id: user.id,
        title: result.data.title,
        description: result.data.description,
        category: result.data.category,
        thumbnail_url: result.data.thumbnail_url ?? null,
      })
      .select()
      .single();

    if (error) {
      console.error("COURSE INSERT ERROR:", error);

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { course: data },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE COURSE ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}