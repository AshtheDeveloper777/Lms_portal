"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";

import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/auth-store";

const emailSchema = z
  .string()
  .trim()
  .email("Please enter a valid email address.");

export default function AuthPage() {
  const router = useRouter();
  const setRole = useAuthStore((state) => state.setRole);

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    // =========================
    // EMAIL VALIDATION
    // =========================

    const emailResult = emailSchema.safeParse(email);

    if (!emailResult.success) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    const validatedEmail = emailResult.data;

    try {
      // =========================
      // LOGIN
      // =========================

      if (isLogin) {
        const { data, error: loginError } =
          await supabase.auth.signInWithPassword({
            email: validatedEmail,
            password,
          });

        if (loginError) {
          setError(loginError.message);
          setLoading(false);
          return;
        }

        if (!data.user) {
          setError("Login failed.");
          setLoading(false);
          return;
        }

        // =========================
        // GET USER ROLE
        // =========================

        const { data: profile, error: profileError } =
          await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profileError) {
          console.error("PROFILE ERROR:", profileError);
          setError("Could not load your profile.");
          setLoading(false);
          return;
        }

        if (!profile) {
          setError(
            "Your profile was not found. Please contact the administrator."
          );
          setLoading(false);
          return;
        }

        // =========================
        // SAVE ROLE
        // =========================

        setRole(profile.role);

        // =========================
        // REDIRECT
        // =========================

        if (profile.role === "instructor") {
          router.push("/instructor");
        } else {
          router.push("/courses");
        }

        return;
      }

      // =========================
      // SIGN UP
      // =========================

      if (!fullName.trim()) {
        setError("Full name is required.");
        setLoading(false);
        return;
      }

      const { data, error: signupError } =
        await supabase.auth.signUp({
          email: validatedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim(),
            },
          },
        });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError("Signup failed.");
        setLoading(false);
        return;
      }

      setSuccess(
        "Account created successfully. Please check your email to verify your account."
      );

      setIsLogin(true);
      setPassword("");
    } catch (error) {
      console.error("AUTH ERROR:", error);

      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10 text-white">
      <div className="w-full max-w-md">

        {/* Header */}

        <div className="mb-8 text-center">
          <p className="text-sm font-semibold text-blue-400">
            LMS PLATFORM
          </p>

          <h1 className="mt-2 text-4xl font-bold">
            {isLogin
              ? "Welcome back"
              : "Create your account"}
          </h1>

          <p className="mt-3 text-slate-400">
            {isLogin
              ? "Sign in to continue learning."
              : "Join our learning platform today."}
          </p>
        </div>

        {/* Form */}

        <form
          onSubmit={handleSubmit}
          noValidate
          className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900 p-8"
        >

          {/* Full Name */}

          {!isLogin && (
            <div>
              <label className="mb-2 block text-sm font-medium">
                Full name
              </label>

              <input
                type="text"
                value={fullName}
                onChange={(e) =>
                  setFullName(e.target.value)
                }
                placeholder="Enter your full name"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Email */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Password */}

          <div>
            <label className="mb-2 block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              placeholder="Enter your password"
              required
              minLength={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500"
            />
          </div>

          {/* Error */}

          {error && (
            <div className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Success */}

          {success && (
            <div className="rounded-lg border border-green-800 bg-green-950/40 p-4 text-sm text-green-400">
              {success}
            </div>
          )}

          {/* Submit */}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : isLogin
                ? "Login"
                : "Create Account"}
          </button>
        </form>

        {/* Switch Login / Signup */}

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
              setSuccess("");
            }}
            className="text-sm text-slate-400 hover:text-white"
          >
            {isLogin
              ? "Don't have an account? Create one"
              : "Already have an account? Login"}
          </button>
        </div>

      </div>
    </main>
  );
}