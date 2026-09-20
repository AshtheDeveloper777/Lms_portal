"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Users,
} from "lucide-react";

import LogoutButton from "@/components/logout-button";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setIsLoggedIn(!!user);
    }

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
              <GraduationCap className="h-5 w-5" />
            </div>

            <span className="text-xl font-bold">
              SKILL<span className="text-blue-500">EVO</span>
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center gap-8">

            <Link
              href="/courses"
              className="text-sm text-slate-300 transition hover:text-white"
            >
              Courses
            </Link>

            {!isLoggedIn ? (
              <>
                <Link
                  href="/auth"
                  className="text-sm text-slate-300 transition hover:text-white"
                >
                  Login
                </Link>

                <Link
                  href="/auth"
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <LogoutButton />
            )}

          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:py-32">
          <div className="max-w-4xl">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm text-blue-400">
              <PlayCircle className="h-4 w-4" />
              Learn. Build. Grow.
            </div>

            <h1 className="text-5xl font-bold leading-tight tracking-tight md:text-7xl">
              Build skills that
              <span className="block text-blue-500">
                build your future.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400 md:text-xl">
              Learn practical skills from expert instructors through
              structured courses, hands-on lessons, and project-based
              learning.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/courses"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 font-semibold transition hover:bg-blue-700"
              >
                Browse Courses
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href="/auth"
                className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-7 py-3.5 font-semibold text-slate-200 transition hover:bg-slate-900"
              >
                Get Started
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-slate-800 bg-slate-900/50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 divide-y divide-slate-800 px-6 md:grid-cols-3 md:divide-x md:divide-y-0">

          <div className="flex items-center gap-4 py-8 md:px-8">
            <BookOpen className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">25+</p>
              <p className="text-sm text-slate-400">Lessons</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-8 md:px-8">
            <Users className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">Expert</p>
              <p className="text-sm text-slate-400">Instructors</p>
            </div>
          </div>

          <div className="flex items-center gap-4 py-8 md:px-8">
            <GraduationCap className="h-8 w-8 text-blue-500" />
            <div>
              <p className="text-2xl font-bold">Project</p>
              <p className="text-sm text-slate-400">
                Based Learning
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-6 py-24">
        <div className="max-w-2xl">

          <p className="text-sm font-semibold uppercase tracking-wider text-blue-500">
            Why SKILL EVO?
          </p>

          <h2 className="mt-3 text-3xl font-bold md:text-4xl">
            Everything you need to keep learning.
          </h2>

          <p className="mt-4 text-slate-400">
            A simple learning experience designed to help you
            learn consistently and track your progress.
          </p>

        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">

          <FeatureCard
            icon={<BookOpen className="h-6 w-6" />}
            title="Structured Courses"
            description="Follow carefully organized courses with lessons designed to build your skills step by step."
          />

          <FeatureCard
            icon={<CheckCircle2 className="h-6 w-6" />}
            title="Track Your Progress"
            description="Mark lessons as completed and keep track of how much of each course you have finished."
          />

          <FeatureCard
            icon={<Users className="h-6 w-6" />}
            title="Learn From Instructors"
            description="Access courses created by instructors and learn through practical, project-focused content."
          />

        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-24">
        <div className="rounded-3xl border border-slate-800 bg-slate-900 px-8 py-16 text-center md:px-16">

          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to start learning?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-slate-400">
            Explore our courses and start building practical
            skills today.
          </p>

          <Link
            href="/courses"
            className="mt-8 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 font-semibold transition hover:bg-blue-700"
          >
            Explore Courses
            <ArrowRight className="h-5 w-5" />
          </Link>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">

          <p>© 2026 SKILL EVO. All rights reserved.</p>

          <div className="flex gap-6">
            <Link
              href="/courses"
              className="transition hover:text-white"
            >
              Courses
            </Link>

            {!isLoggedIn && (
              <Link
                href="/auth"
                className="transition hover:text-white"
              >
                Login
              </Link>
            )}
          </div>

        </div>
      </footer>

    </main>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-7 transition hover:border-slate-700">

      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
        {icon}
      </div>

      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-3 leading-7 text-slate-400">
        {description}
      </p>

    </div>
  );
}