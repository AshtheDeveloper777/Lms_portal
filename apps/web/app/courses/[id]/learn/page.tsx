'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, ArrowLeft, CheckCircle2, Sparkles, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useRealtimeInvalidate } from '@/hooks/use-realtime-invalidate';
import VideoPlayer from '@/components/video-player';
import Link from 'next/link';

type Lesson = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  order_index: number;
};

type ProgressItem = {
  lesson_id: string;
  completed: boolean;
};

async function fetchLearnData(courseId: string, userId: string) {
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment)
    return {
      isEnrolled: false,
      course: null,
      lessons: [] as Lesson[],
      progress: [] as ProgressItem[],
    };

  const { data: course } = await supabase
    .from('courses')
    .select('id, title, description')
    .eq('id', courseId)
    .maybeSingle();

  const { data: lessons } = await supabase
    .from('lessons')
    .select('id, title, description, video_url, order_index')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  const lessonIds = (lessons ?? []).map((l: Lesson) => l.id);

  const { data: progress } = await supabase
    .from('lesson_progress')
    .select('lesson_id, completed')
    .eq('student_id', userId)
    .in('lesson_id', lessonIds.length > 0 ? lessonIds : ['00000000-0000-0000-0000-000000000000']);

  return {
    isEnrolled: true,
    course,
    lessons: (lessons ?? []) as Lesson[],
    progress: (progress ?? []) as ProgressItem[],
  };
}

async function toggleLessonCompletion(
  userId: string,
  lessonId: string,
  courseId: string,
  currentlyCompleted: boolean
) {
  if (currentlyCompleted) {
    await supabase
      .from('lesson_progress')
      .delete()
      .eq('student_id', userId)
      .eq('lesson_id', lessonId);
  } else {
    await supabase.from('lesson_progress').upsert(
      {
        student_id: userId,
        lesson_id: lessonId,
        course_id: courseId,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_id' }
    );
  }
}

export default function LearnPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const courseId = params.id as string;
  const { userId, isInitialized } = useAuthStore();

  const [selectedLessonId, setSelectedLessonId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['learn', courseId, userId],
    queryFn: () => fetchLearnData(courseId, userId!),
    enabled: !!userId && !!courseId,
  });

  useEffect(() => {
    if (data?.isEnrolled && data.lessons.length > 0 && !selectedLessonId) {
      setSelectedLessonId(data.lessons[0]?.id ?? null);
    }
  }, [data, selectedLessonId]);

  const studentFilter = userId ? ('student_id=eq.' + userId) : undefined;
  useRealtimeInvalidate(
    'lesson_progress',
    [['learn', courseId, userId]],
    ['*'],
    studentFilter
  );

  const toggleMutation = useMutation({
    mutationFn: async ({
      lessonId,
      currentlyCompleted,
    }: {
      lessonId: string;
      currentlyCompleted: boolean;
    }) => {
      if (!userId) throw new Error('Not logged in');
      await toggleLessonCompletion(userId, lessonId, courseId, currentlyCompleted);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['learn', courseId, userId] });
      queryClient.invalidateQueries({ queryKey: ['my-learning', userId] });
      queryClient.invalidateQueries({ queryKey: ['manage-course', courseId] });

      if (!variables.currentlyCompleted) {
        setToastMessage('?? Lesson Completed! Your progress has been updated.');
        setTimeout(() => setToastMessage(null), 5000);
      }
    },
  });

  if (!isInitialized || isLoading) {
    return (
      <main className='lms-page'>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '80vh',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <div
              className='lms-skeleton'
              style={{ width: 48, height: 48, borderRadius: '50%' }}
            />
            <div className='lms-skeleton' style={{ width: 200, height: 14 }} />
            <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>Loading course...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main
        className='lms-page'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            Sign in to access this course
          </h2>
          <Link href='/auth' className='lms-btn lms-btn--primary'>
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  if (!data?.isEnrolled) {
    return (
      <main
        className='lms-page'
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '80vh',
        }}
      >
        <div
          className='lms-card'
          style={{ padding: 48, textAlign: 'center', maxWidth: 420 }}
        >
          <h2
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: 12,
            }}
          >
            Not enrolled
          </h2>
          <p
            style={{
              fontSize: 14,
              color: 'var(--text-muted)',
              marginBottom: 24,
            }}
          >
            You need to enroll in this course before you can start learning.
          </p>
          <button
            className='lms-btn lms-btn--primary'
            onClick={() => router.push('/courses/' + courseId)}
          >
            Go to Course
          </button>
        </div>
      </main>
    );
  }

  const { course, lessons, progress } = data;
  const completedSet = new Set(
    progress.filter((p) => p.completed).map((p) => p.lesson_id)
  );
  const completedCount = completedSet.size;
  const total = lessons.length;
  const progressPct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  const selectedLesson: Lesson | null =
    lessons.find((l) => l.id === selectedLessonId) ?? lessons[0] ?? null;
  const selectedIndex = selectedLesson
    ? lessons.findIndex((l) => l.id === selectedLesson.id)
    : -1;
  const isCompleted = selectedLesson ? completedSet.has(selectedLesson.id) : false;

  function goNext() {
    if (selectedIndex >= 0 && selectedIndex < lessons.length - 1) {
      const next = lessons[selectedIndex + 1];
      if (next) setSelectedLessonId(next.id);
    }
  }

  function goPrev() {
    if (selectedIndex > 0) {
      const prev = lessons[selectedIndex - 1];
      if (prev) setSelectedLessonId(prev.id);
    }
  }

  const handleAutoWatched = () => {
    if (selectedLesson && !isCompleted && !toggleMutation.isPending) {
      toggleMutation.mutate({
        lessonId: selectedLesson.id,
        currentlyCompleted: false,
      });
    }
  };

  const courseOverviewLink = '/courses/' + courseId;
  const progressFillWidth = String(progressPct) + '%';
  const lessonOrderDisplay = selectedLesson
    ? 'Lesson ' + String(selectedLesson.order_index) + ' of ' + String(lessons.length)
    : '';

  return (
    <main className='lms-page' style={{ position: 'relative' }}>
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: 76,
            right: 24,
            zIndex: 1000,
            background: 'var(--bg-card)',
            border: '1.5px solid var(--green)',
            color: 'var(--text-primary)',
            padding: '12px 18px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'dropdownIn 0.2s ease',
          }}
        >
          <Sparkles size={18} style={{ color: 'var(--green)' }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        </div>
      )}

      <div
        style={{
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          padding: '12px 0',
          position: 'sticky',
          top: 60,
          zIndex: 40,
        }}
      >
        <div className='lms-container'>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 24,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <Link
                href={courseOverviewLink}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-base)',
                  color: 'var(--text-secondary)',
                }}
                title='Back to Course Overview'
              >
                <ArrowLeft size={16} />
              </Link>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                  }}
                >
                  Learning Mode
                </p>
                <h1
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    margin: 0,
                  }}
                >
                  {course?.title}
                </h1>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                minWidth: 240,
              }}
            >
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    {completedCount} of {total} lessons ({progressPct}%)
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: progressPct === 100 ? 'var(--green)' : 'var(--accent)',
                    }}
                  >
                    {progressPct === 100 ? 'Completed!' : (String(progressPct) + '%')}
                  </span>
                </div>
                <div
                  style={{
                    height: 6,
                    borderRadius: 99,
                    background: 'var(--border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: progressFillWidth,
                      background:
                        progressPct === 100
                          ? 'var(--green)'
                          : 'linear-gradient(90deg, var(--accent), #8b5cf6)',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className='lms-learn-layout'
      >
        <aside
          className='lms-learn-sidebar'
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              paddingLeft: 4,
            }}
          >
            <p
              style={{
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--text-muted)',
              }}
            >
              Course Curriculum
            </p>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--accent)',
                background: 'var(--bg-card)',
                padding: '2px 8px',
                borderRadius: 99,
                border: '1px solid var(--border)',
              }}
            >
              {lessons.length} lessons
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {lessons.map((lesson, index) => {
              const completed = completedSet.has(lesson.id);
              const active = selectedLessonId === lesson.id;

              return (
                <div
                  key={lesson.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 8px',
                    borderRadius: 'var(--radius-md)',
                    background: active ? 'var(--bg-card)' : 'transparent',
                    border: '1px solid ' + (active ? 'var(--border-accent)' : 'transparent'),
                    transition: 'all 0.15s ease',
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMutation.mutate({
                        lessonId: lesson.id,
                        currentlyCompleted: completed,
                      });
                    }}
                    disabled={toggleMutation.isPending}
                    title={
                      completed
                        ? 'Completed - Click to unmark'
                        : 'Click to mark complete'
                    }
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '2px solid ' + (completed ? 'var(--green)' : 'var(--border-hover)'),
                      background: completed ? 'var(--green-bg)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {completed && (
                      <CheckCircle2
                        size={15}
                        style={{ color: 'var(--green)' }}
                      />
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedLessonId(lesson.id)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      padding: 0,
                    }}
                  >
                    <span
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: '50%',
                        background: active
                          ? 'var(--accent)'
                          : 'var(--bg-base)',
                        color: active ? 'white' : 'var(--text-muted)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        flexShrink: 0,
                        border: '1px solid var(--border)',
                      }}
                    >
                      {index + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: active ? 600 : 500,
                        color: active
                          ? 'var(--text-primary)'
                          : 'var(--text-secondary)',
                        lineHeight: 1.4,
                      }}
                    >
                      {lesson.title}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        </aside>

        <section className='lms-learn-content'>
          {!selectedLesson ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
              }}
            >
              <p style={{ color: 'var(--text-muted)' }}>
                Select a lesson to start learning.
              </p>
            </div>
          ) : (
            <div style={{ maxWidth: 960, margin: '0 auto' }}>
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 12,
                    color: 'var(--accent)',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 6,
                  }}
                >
                  {lessonOrderDisplay}
                </p>
                <h2
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {selectedLesson.title}
                </h2>
              </div>

              <VideoPlayer
                url={selectedLesson.video_url}
                title={selectedLesson.title}
                isCompleted={isCompleted}
                onComplete={handleAutoWatched}
              />

              {selectedLesson.description && (
                <div
                  style={{
                    marginTop: 24,
                    padding: '22px 24px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      marginBottom: 8,
                    }}
                  >
                    Lesson Overview
                  </h3>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {selectedLesson.description}
                  </p>
                </div>
              )}

              <div
                style={{
                  marginTop: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  paddingTop: 20,
                  borderTop: '1px solid var(--border)',
                  flexWrap: 'wrap',
                }}
              >
                <button
                  className='lms-btn lms-btn--secondary'
                  onClick={goPrev}
                  disabled={selectedIndex <= 0}
                  style={{
                    opacity: selectedIndex <= 0 ? 0.5 : 1,
                    cursor: selectedIndex <= 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Previous Lesson
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <button
                    className='lms-btn'
                    style={
                      isCompleted
                        ? {
                            background: 'var(--green-bg)',
                            color: 'var(--green)',
                            border: '1px solid var(--green-border)',
                          }
                        : {
                            background: 'var(--accent)',
                            color: 'white',
                            boxShadow: '0 0 20px var(--accent-glow)',
                          }
                    }
                    onClick={() =>
                      toggleMutation.mutate({
                        lessonId: selectedLesson.id,
                        currentlyCompleted: isCompleted,
                      })
                    }
                    disabled={toggleMutation.isPending}
                  >
                    {toggleMutation.isPending
                      ? 'Saving...'
                      : isCompleted
                      ? 'Completed (Click to Undo)'
                      : 'Mark as Completed'}
                  </button>

                  {selectedIndex >= 0 && selectedIndex < lessons.length - 1 && (
                    <button className='lms-btn lms-btn--primary' onClick={goNext}>
                      Next Lesson <ChevronRight size={15} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
