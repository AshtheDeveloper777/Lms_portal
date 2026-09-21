'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GraduationCap, Eye, EyeOff } from 'lucide-react';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const emailSchema = z.string().trim().email('Please enter a valid email address.');

export default function AuthPage() {
  const router = useRouter();
  const { setUser } = useAuthStore();

  const [isLogin, setIsLogin] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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
          setLoading(false);
          return;
        }

        if (!data.user) {
          setError('Login failed. Please check your credentials.');
          setLoading(false);
          return;
        }

        let userRole: 'student' | 'instructor' = 'student';
        let userFullName = data.user.user_metadata?.full_name || email.split('@')[0];

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, full_name')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile) {
            userRole = (profile.role as 'student' | 'instructor') || 'student';
            if (profile.full_name) userFullName = profile.full_name;
          } else {
            const defaultRole = (data.user.user_metadata?.role as 'student' | 'instructor') || 'student';
            await supabase.from('profiles').upsert({
              id: data.user.id,
              full_name: userFullName,
              email: data.user.email,
              role: defaultRole,
            });
            userRole = defaultRole;
          }
        } catch {
          userRole = (data.user.user_metadata?.role as 'student' | 'instructor') || 'student';
        }

        setUser({
          userId: data.user.id,
          fullName: userFullName,
          email: data.user.email ?? null,
          role: userRole,
        });

        router.push(userRole === 'instructor' ? '/instructor' : '/courses');
        return;
      }

      // SIGN UP (Always creates student account; instructors assigned in DB)
      if (!fullName.trim()) {
        setError('Full name is required.');
        setLoading(false);
        return;
      }

      const { data, error: signupError } = await supabase.auth.signUp({
        email: emailResult.data,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            role: 'student',
          },
        },
      });

      if (signupError) {
        setError(signupError.message);
        setLoading(false);
        return;
      }

      if (!data.user) {
        setError('Signup failed.');
        setLoading(false);
        return;
      }

      if (data.session) {
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            full_name: fullName.trim(),
            email: emailResult.data,
            role: 'student',
          });
        } catch {}

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
                onClick={() => {
                  setIsLogin(true);
                  setError('');
                  setSuccess('');
                }}
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
                onClick={() => {
                  setIsLogin(false);
                  setError('');
                  setSuccess('');
                }}
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
