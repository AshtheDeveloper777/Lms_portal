import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          response = NextResponse.next({
            request,
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Check whether the user is logged in
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not logged in → Auth page
  if (!user) {
    return NextResponse.redirect(
      new URL("/auth", request.url)
    );
  }

  // Get user's role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  // Profile missing → Auth page
  if (!profile) {
    return NextResponse.redirect(
      new URL("/auth", request.url)
    );
  }

  // Student trying to access instructor pages → Auth page
  if (profile.role !== "instructor") {
    return NextResponse.redirect(
      new URL("/auth", request.url)
    );
  }

  // Instructor → allow request
  return response;
}

export const config = {
  matcher: ["/instructor/:path*"],
};