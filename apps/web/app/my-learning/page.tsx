'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Play, CheckCircle, ArrowRight, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';

export type EnrolledCourse = {
  enrollmentId: string;
  courseId: string;
  title: string;
  description: string;
  category: string | null;
  thumbnail_url: string | null;
  enrolled_at: string;
  total_lessons: number;
  completed_lessons: number;
  progress_pct: number;
};

async function fetchMyLearning(userId: string): Promise<{ courses: EnrolledCourse[]; availableCourses: any[] }> {
  try {
    const { data: enrollments, error: enrollError } = await supabase
      .from('enrollments')
      .select('id, course_id, enrolled_at')
      .eq('student_id', userId)
      .order('enrolled_at', { ascending: false });

    // Fetch published courses for recommendations if needed
    const { data: allCourses } = await supabase
      .from('courses')
      .select('id, title, description, category, thumbnail_url')
      .eq('published', true);

    if (enrollError || !enrollments || enrollments.length === 0) {
      return { courses: [], availableCourses: allCourses ?? [] };
    }

    const courseIds = enrollments.map((e: { id: string; course_id: string; enrolled_at: string }) => e.course_id);

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, description, category, thumbnail_url')
      .in('id', courseIds);

    const { data: lessons } = await supabase
      .from('lessons')
      .select('id, course_id')
      .in('course_id', courseIds);

    const lessonIds = (lessons ?? []).map((l: { id: string; course_id: string }) => l.id);
    const { data: progress } = await supabase
      .from('lesson_progress')
      .select('lesson_id, completed')
      .eq('student_id', userId)
      .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000'])
      .eq('completed', true);

    const completedSet = new Set((progress ?? []).map((p: { lesson_id: string; completed: boolean }) => p.lesson_id));

    const enrolledCourses = enrollments.map((e: { id: string; course_id: string; enrolled_at: string }) => {
      const course = (courses ?? []).find((c: { id: string; title: string; description: string; category: string | null; thumbnail_url: string | null }) => c.id === e.course_id);
      const courseLessons = (lessons ?? []).filter((l: { id: string; course_id: string }) => l.course_id === e.course_id);
      const total = courseLessons.length;
      const completed = courseLessons.filter((l: { id: string; course_id: string }) => completedSet.has(l.id)).length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        enrollmentId: e.id,
        courseId: e.course_id,
        title: course?.title ?? 'Enrolled Course',
        description: course?.description ?? '',
        category: course?.category ?? null,
        thumbnail_url: course?.thumbnail_url ?? null,
        enrolled_at: e.enrolled_at,
        total_lessons: total,
        completed_lessons: completed,
        progress_pct: pct,
      };
    });

    return { courses: enrolledCourses, availableCourses: allCourses ?? [] };
  } catch (err) {
    console.error('Error fetching enrolled courses:', err);
    return { courses: [], availableCourses: [] };
  }
}

export default function MyLearningPage() {
  const router = useRouter();
  const { userId: storeUserId } = useAuthStore();

  const [activeUserId, setActiveUserId] = useState<string | null>(storeUserId);
  const [authChecked, setAuthChecked] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'in_progress' | 'completed'>('all');

  useEffect(() => {
    async function checkAuth() {
      if (storeUserId) {
        setActiveUserId(storeUserId);
        setAuthChecked(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setActiveUserId(session.user.id);
        }
      } catch (e) {
        console.error('Session check error in my-learning:', e);
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuth();
  }, [storeUserId]);

  const { data, isLoading } = useQuery({
    queryKey: ['my-learning', activeUserId],
    queryFn: () => fetchMyLearning(activeUserId!),
    enabled: Boolean(activeUserId),
  });

  useRealtimeInvalidate('enrollments', [['my-learning', activeUserId]]);
  useRealtimeInvalidate('lesson_progress', [['my-learning', activeUserId]]);

  const courses = data?.courses ?? [];
  const availableCourses = data?.availableCourses ?? [];

  const filteredCourses = courses.filter((c) => {
    if (filterTab === 'in_progress') return c.progress_pct < 100;
    if (filterTab === 'completed') return c.progress_pct === 100;
    return true;
  });

  if (!authChecked || (isLoading && Boolean(activeUserId))) {
    return (
      <main
        className='lms-page'
        style={{
          paddingTop: 40,
          paddingBottom: 80,
          minHeight: 'calc(100vh - 60px)',
          background: 'var(--bg-base)',
        }}
      >
        <div className='lms-container'>
          <div className='lms-skeleton' style={{ height: 28, width: 140, marginBottom: 16, borderRadius: 8 }} />
          <div className='lms-skeleton' style={{ height: 44, width: 320, marginBottom: 32, borderRadius: 12 }} />
          <div className='lms-course-grid'>
            {[1, 2, 3].map((i) => (
              <div key={i} className='lms-skeleton' style={{ height: 320, borderRadius: 16 }} />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (!activeUserId) {
    return (
      <main
        className='lms-page'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
          background: 'var(--bg-base)',
        }}
      >
        <div style={{ textAlign: 'center', maxWidth: 440, padding: 32 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'var(--accent-glow)',
              color: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <BookOpen size={30} />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12 }}>
            Sign in to view your learning
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
            Track your enrolled courses, lesson progress, and watch history across all your devices.
          </p>
          <Link href='/auth' className='lms-btn lms-btn--primary lms-btn--lg'>
            Sign In to Continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className='lms-page'
      style={{
        paddingTop: 40,
        paddingBottom: 80,
        minHeight: 'calc(100vh - 60px)',
        background: 'var(--bg-base)',
      }}
    >
      <div className='lms-container'>
        <div className='lms-page-header' style={{ marginBottom: 32 }}>
          <p
            className='lms-page-eyebrow'
            style={{
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--accent)',
              letterSpacing: '0.08em',
              marginBottom: 6,
            }}
          >
            My Learning
          </p>
          <h1
            className='lms-page-title'
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              marginBottom: 8,
            }}
          >
            Your Enrolled Courses
          </h1>
          <p className='lms-page-subtitle' style={{ fontSize: 15, color: 'var(--text-secondary)' }}>
            Track your progress and continue learning where you left off.
          </p>
        </div>

        {courses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-xl)',
                padding: '48px 24px',
                textAlign: 'center',
                boxShadow: 'var(--shadow-card)',
                maxWidth: 600,
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: 'var(--accent-glow)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 18px',
                }}
              >
                <BookOpen size={28} />
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                No enrolled courses yet
              </h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 14, maxWidth: 440, margin: '0 auto 24px' }}>
                You have not enrolled in any courses yet. Choose a course below to start learning immediately!
              </p>
              <Link href='/courses' className='lms-btn lms-btn--primary'>
                Browse All Courses
                <ArrowRight size={16} />
              </Link>
            </div>

            {/* Quick Explore Section if not enrolled in any */}
            {availableCourses.length > 0 && (
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                  Available Courses to Start Learning
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: 20,
                  }}
                >
                  {availableCourses.slice(0, 3).map((ac: any) => (
                    <div
                      key={ac.id}
                      style={{
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 18,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {ac.category && (
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', background: 'var(--accent-glow)', padding: '2px 8px', borderRadius: 99 }}>
                            {ac.category}
                          </span>
                        )}
                        <h4 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginTop: 8, marginBottom: 6 }}>
                          {ac.title}
                        </h4>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 16 }}>
                          {ac.description?.slice(0, 80)}...
                        </p>
                      </div>
                      <Link href={'/courses/' + ac.id} className='lms-btn lms-btn--secondary lms-btn--sm'>
                        Enroll Now <ArrowRight size={13} />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Active Study Filter Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 28,
                paddingBottom: 16,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type='button'
                  onClick={() => setFilterTab('all')}
                  className={`lms-btn lms-btn--sm ${filterTab === 'all' ? 'lms-btn--primary' : 'lms-btn--secondary'}`}
                >
                  All Courses ({courses.length})
                </button>
                <button
                  type='button'
                  onClick={() => setFilterTab('in_progress')}
                  className={`lms-btn lms-btn--sm ${filterTab === 'in_progress' ? 'lms-btn--primary' : 'lms-btn--secondary'}`}
                >
                  In Progress ({courses.filter(c => c.progress_pct < 100).length})
                </button>
                <button
                  type='button'
                  onClick={() => setFilterTab('completed')}
                  className={`lms-btn lms-btn--sm ${filterTab === 'completed' ? 'lms-btn--primary' : 'lms-btn--secondary'}`}
                >
                  Completed ({courses.filter(c => c.progress_pct === 100).length})
                </button>
              </div>

              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Showing {filteredCourses.length} of {courses.length} enrolled
              </span>
            </div>

            {/* Courses Grid with Progress Percentage */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: 24,
              }}
            >
              {filteredCourses.map((course) => {
                const learnHref = '/courses/' + course.courseId + '/learn';
                const pctWidth = String(course.progress_pct) + '%';

                return (
                  <div
                    key={course.enrollmentId}
                    style={{
                      background: 'var(--bg-card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: 'var(--shadow-card)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {course.thumbnail_url ? (
                      <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        style={{
                          width: '100%',
                          height: 180,
                          objectFit: 'cover',
                          borderBottom: '1px solid var(--border)',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: 180,
                          background: 'var(--bg-surface)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          borderBottom: '1px solid var(--border)',
                        }}
                      >
                        <BookOpen size={36} />
                      </div>
                    )}

                    <div
                      style={{
                        padding: 22,
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        {course.category && (
                          <span
                            style={{
                              display: 'inline-block',
                              fontSize: 11,
                              fontWeight: 700,
                              color: 'var(--accent)',
                              background: 'var(--accent-glow)',
                              padding: '3px 10px',
                              borderRadius: 99,
                              marginBottom: 10,
                            }}
                          >
                            {course.category}
                          </span>
                        )}

                        <h2
                          style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            marginBottom: 14,
                            lineHeight: 1.35,
                          }}
                        >
                          {course.title}
                        </h2>

                        {/* Progress Bar & Percentage */}
                        <div style={{ marginBottom: 18 }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              marginBottom: 6,
                            }}
                          >
                            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                              {course.completed_lessons}/{course.total_lessons} lessons completed
                            </span>
                            <span
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color:
                                  course.progress_pct === 100
                                    ? 'var(--green)'
                                    : 'var(--accent)',
                              }}
                            >
                              {course.progress_pct}%
                            </span>
                          </div>
                          <div
                            style={{
                              height: 8,
                              borderRadius: 99,
                              background: 'var(--border)',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: pctWidth,
                                height: '100%',
                                borderRadius: 99,
                                background:
                                  course.progress_pct === 100
                                    ? 'var(--green)'
                                    : 'linear-gradient(90deg, var(--accent), var(--accent-hover))',
                                transition: 'width 0.4s ease',
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <Link
                        href={learnHref}
                        className='lms-btn lms-btn--primary'
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          fontSize: 13,
                        }}
                      >
                        <Play size={14} />
                        {course.progress_pct === 100
                          ? 'Review Course'
                          : course.progress_pct > 0
                            ? 'Continue Learning'
                            : 'Start Learning'}
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
