'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser, setInitialized } = useAuthStore();

  useEffect(() => {
    async function init() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user) {
          let role: 'student' | 'instructor' =
            (user.user_metadata?.role as 'student' | 'instructor') || 'student';
          let fullName =
            user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';

          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role, full_name')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.role) role = profile.role as 'student' | 'instructor';
            if (profile?.full_name) fullName = profile.full_name;
          } catch {}

          setUser({
            userId: user.id,
            fullName,
            email: user.email ?? null,
            role,
          });
        } else {
          setInitialized(true);
        }
      } catch (e) {
        console.error('Auth initialization error:', e);
        setInitialized(true);
      }
    }

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        clearUser();
        return;
      }

      if (session.user) {
        let role: 'student' | 'instructor' =
          (session.user.user_metadata?.role as 'student' | 'instructor') || 'student';
        let fullName =
          session.user.user_metadata?.full_name ||
          session.user.email?.split('@')[0] ||
          'User';

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile?.role) role = profile.role as 'student' | 'instructor';
          if (profile?.full_name) fullName = profile.full_name;
        } catch {}

        setUser({
          userId: session.user.id,
          fullName,
          email: session.user.email ?? null,
          role,
        });
      } else {
        setInitialized(true);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [setUser, clearUser, setInitialized]);

  return <>{children}</>;
}
