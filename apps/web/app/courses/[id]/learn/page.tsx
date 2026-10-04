'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LearnRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  useEffect(() => {
    async function redirect() {
      if (!courseId) return;
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true })
        .limit(1);

      if (lessons && lessons.length > 0) {
        router.replace('/courses/' + courseId + '/' + lessons[0].id);
      } else {
        router.replace('/courses/' + courseId);
      }
    }
    redirect();
  }, [courseId, router]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'var(--text-muted)',
        fontSize: 14,
      }}
    >
      Loading lesson...
    </div>
  );
}
