'use client';

import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Users,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'var(--bg-base)',
        color: 'var(--text-primary)',
        transition: 'background-color 0.2s ease, color 0.2s ease',
      }}
    >
      {/* Hero Section */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 24px 70px' }}>
        <div className='lms-container'>
          <div style={{ maxWidth: 840, margin: '0 auto', textAlign: 'center' }}>
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 16px',
                borderRadius: 99,
                border: '1px solid var(--border-accent)',
                background: 'var(--accent-glow)',
                color: 'var(--accent)',
                fontSize: 13,
                fontWeight: 600,
                marginBottom: 24,
              }}
            >
              <Sparkles size={15} />
              Learn. Build. Grow.
            </div>

            <h1
              style={{
                fontSize: 'clamp(38px, 6vw, 64px)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.15,
                color: 'var(--text-primary)',
                marginBottom: 20,
              }}
            >
              Build practical skills that{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                build your future.
              </span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(16px, 2vw, 19px)',
                lineHeight: 1.6,
                color: 'var(--text-secondary)',
                maxWidth: 680,
                margin: '0 auto 36px',
              }}
            >
              Learn modern software development from expert-led courses with real educational videos,
              interactive checkboxes, and real-time progress tracking.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: 'flex',
                gap: 16,
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href='/courses'
                className='lms-btn lms-btn--primary'
                style={{
                  padding: '14px 28px',
                  fontSize: 16,
                  fontWeight: 600,
                  boxShadow: '0 4px 24px var(--accent-glow)',
                }}
              >
                Browse All Courses
                <ArrowRight size={18} />
              </Link>
              <Link
                href='/auth'
                className='lms-btn lms-btn--secondary'
                style={{ padding: '14px 28px', fontSize: 16, fontWeight: 600 }}
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section
        style={{
          borderTop: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          padding: '40px 24px',
        }}
      >
        <div className='lms-container'>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 32,
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-glow)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <BookOpen size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  25+
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Interactive Lessons
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--green-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green)',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  100%
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Real-time Tracking
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--purple-bg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--purple)',
                }}
              >
                <GraduationCap size={24} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Project
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
                  Based Learning
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{ padding: '90px 24px' }}>
        <div className='lms-container'>
          <div style={{ maxWidth: 640, marginBottom: 50 }}>
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--accent)',
                marginBottom: 8,
              }}
            >
              Why SKILL EVO?
            </p>
            <h2
              style={{
                fontSize: 'clamp(28px, 4vw, 38px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
                lineHeight: 1.2,
                marginBottom: 12,
              }}
            >
              Everything you need to master new tech.
            </h2>
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              A clean, modern learning platform built for fast progress and zero distractions.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: 24,
            }}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <BookOpen size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Real HD Educational Videos
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Every lesson features real, top-tier instructional videos with full-screen theater mode and playback controls.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--green-bg)',
                  color: 'var(--green)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Automatic Watch Tracking
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Lessons automatically mark as completed when you finish watching the video, updating your progress across all devices.
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: 32,
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--purple-bg)',
                  color: 'var(--purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 20,
                }}
              >
                <Users size={24} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                Instant Realtime Sync
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Powered by Supabase Realtime and React Query  see your enrolled courses, checkboxes, and stats update live without refreshing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section style={{ padding: '0 24px 80px' }}>
        <div className='lms-container'>
          <div
            style={{
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              padding: '64px 32px',
              textAlign: 'center',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <h2
              style={{
                fontSize: 'clamp(26px, 3.5vw, 36px)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 14,
              }}
            >
              Ready to accelerate your learning?
            </h2>
            <p
              style={{
                fontSize: 16,
                color: 'var(--text-secondary)',
                maxWidth: 540,
                margin: '0 auto 28px',
                lineHeight: 1.6,
              }}
            >
              Explore our curriculum of Web Development, React, Next.js, Python/DSA, and SQL.
            </p>
            <Link
              href='/courses'
              className='lms-btn lms-btn--primary'
              style={{ padding: '14px 28px', fontSize: 15, fontWeight: 600 }}
            >
              Start Exploring Courses
              <ArrowRight size={17} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-surface)',
          padding: '24px',
        }}
      >
        <div
          className='lms-container'
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <p style={{ fontSize: 13, color: 'var(--text-muted)', margin: 0 }}>
            © 2026 SKILL EVO. All rights reserved.
          </p>
          <div style={{ display: 'flex', gap: 20 }}>
            <Link href='/courses' style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Courses
            </Link>
            <Link href='/auth' style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              Sign In
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
