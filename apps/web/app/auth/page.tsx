'use client';

import { FormEvent, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const emailSchema = z.string().trim().email('Please enter a valid email address.');

function AuthForm() {
  const router = useRouter();
  const { setUser } = useAuthStore();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get('mode') || searchParams.get('tab');

  const [isLogin, setIsLogin] = useState(modeParam !== 'signup');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (modeParam === 'signup') {
      setIsLogin(false);
    } else if (modeParam === 'login') {
      setIsLogin(true);
    }
  }, [modeParam]);

  const switchTab = (toLogin: boolean) => {
    setIsLogin(toLogin);
    setError('');
    setSuccess('');
    const newUrl = toLogin ? '/auth?mode=login' : '/auth?mode=signup';
    window.history.replaceState(null, '', newUrl);
  };

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: emailResult.data,
          password,
        });

        if (loginError) {
          setError(loginError.message);
          return;
        }

        if (!data.user) {
          setError('Could not sign in with these credentials.');
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', data.user.id)
          .single();

        const userRole = (profile?.role || (data.user.user_metadata?.role as string) || 'student') as
          | 'student'
          | 'instructor';

        setUser({
          userId: data.user.id,
          fullName: profile?.full_name || (data.user.user_metadata?.full_name as string) || '',
          email: data.user.email || emailResult.data,
          role: userRole,
        });

        if (userRole === 'instructor') {
          router.push('/instructor');
        } else {
          router.push('/courses');
        }
        return;
      }

      if (!fullName.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: emailResult.data,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'student',
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session && data.user) {
        setUser({
          userId: data.user.id,
          fullName: fullName.trim(),
          email: emailResult.data,
          role: 'student',
        });

        router.push('/courses');
        return;
      }

      setSuccess('Account created! Check your email to verify, then sign in.');
      setIsLogin(true);
      setPassword('');
    } catch (err: any) {
      console.error('AUTH ERROR:', err);
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 60px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        background: 'var(--bg-base)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, var(--accent), #8b5cf6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 24px var(--accent-glow)',
          }}
        >
          <GraduationCap size={22} style={{ color: 'white' }} />
        </div>
        <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)' }}>
          SKILL<span style={{ color: 'var(--accent)' }}>EVO</span>
        </span>
      </div>

      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.03em',
            }}
          >
            {isLogin ? 'Welcome back' : 'Create Student Account'}
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6 }}>
            {isLogin
              ? 'Sign in to access your courses and track your progress.'
              : 'Join SKILL EVO to start learning today.'}
          </p>
        </div>

        <Card
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <CardContent style={{ padding: '28px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 4,
                padding: 4,
                background: 'var(--bg-base)',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 24,
                border: '1px solid var(--border)',
              }}
            >
              <button
                type='button'
                onClick={() => switchTab(true)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: isLogin ? 'var(--bg-card)' : 'transparent',
                  color: isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: isLogin ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign In
              </button>
              <button
                type='button'
                onClick={() => switchTab(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: !isLogin ? 'var(--bg-card)' : 'transparent',
                  color: !isLogin ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: !isLogin ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {!isLogin && (
                <div>
                  <label className='lms-label'>Full Name</label>
                  <Input
                    type='text'
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder='e.g. John Doe'
                    required
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                    }}
                  />
                </div>
              )}

              <div>
                <label className='lms-label'>Email Address</label>
                <Input
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder='you@example.com'
                  required
                  style={{
                    background: 'var(--bg-input)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className='lms-label'>Password</label>
                </div>
                <div style={{ position: 'relative' }}>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='At least 6 characters'
                    required
                    minLength={6}
                    style={{
                      background: 'var(--bg-input)',
                      border: '1px solid var(--border)',
                      color: 'var(--text-primary)',
                      paddingRight: 44,
                    }}
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 12,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && <div className='lms-alert lms-alert--error'>{error}</div>}
              {success && <div className='lms-alert lms-alert--success'>{success}</div>}

              <Button
                type='submit'
                disabled={loading}
                style={{
                  width: '100%',
                  background: 'var(--accent)',
                  color: 'white',
                  height: 44,
                  fontSize: 15,
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: 'calc(100vh - 60px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          Loading...
        </div>
      }
    >
      <AuthForm />
    </Suspense>
  );
}
