'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { GraduationCap, BookOpen, User, LogOut, ChevronDown, Layers, Sun, Moon } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/components/theme-provider';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, role, fullName, email, clearUser } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safe click-outside listener that does NOT interfere with click events inside the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleNav = (href: string) => {
    setDropdownOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    await supabase.auth.signOut();
    clearUser();
    router.push('/auth');
  };

  const isLoggedIn = Boolean(userId || role);
  const isInstructor = role === 'instructor';
  const displayName = fullName || (email ? email.split('@')[0] : 'User') || 'User';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const coursesActiveClass = 'lms-navbar-link' + (pathname && pathname.startsWith('/courses') && !pathname.includes('/learn') ? ' lms-navbar-link--active' : '');
  const myLearningActiveClass = 'lms-navbar-link' + (pathname === '/my-learning' ? ' lms-navbar-link--active' : '');
  const instructorActiveClass = 'lms-navbar-link' + (pathname && pathname.startsWith('/instructor') ? ' lms-navbar-link--active' : '');
  const roleBadgeClass = 'lms-role-badge ' + (isInstructor ? 'lms-role-badge--instructor' : 'lms-role-badge--student');
  const chevronClass = 'lms-chevron' + (dropdownOpen ? ' lms-chevron--open' : '');

  if (!isClient) return null;

  return (
    <nav className='lms-navbar'>
      <div className='lms-navbar-inner'>
        <Link href='/' className='lms-navbar-logo'>
          <div className='lms-navbar-logo-icon'>
            <GraduationCap size={18} />
          </div>
          <span className='lms-navbar-logo-text'>
            SKILL<span className='lms-navbar-logo-accent'>EVO</span>
          </span>
        </Link>

        <div className='lms-navbar-links'>
          <Link href='/courses' className={coursesActiveClass}>
            <BookOpen size={15} />
            Courses
          </Link>

          {isLoggedIn && !isInstructor && (
            <Link href='/my-learning' className={myLearningActiveClass}>
              <Layers size={15} />
              My Learning
            </Link>
          )}

          {isInstructor && (
            <Link href='/instructor' className={instructorActiveClass}>
              <Layers size={15} />
              Dashboard
            </Link>
          )}
        </div>

        <div className='lms-navbar-right' style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggleTheme}
            aria-label='Toggle theme'
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              transition: 'all 0.2s ease',
            }}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? (
              <Sun size={17} style={{ color: '#f59e0b' }} />
            ) : (
              <Moon size={17} style={{ color: 'var(--accent)' }} />
            )}
          </button>

          {!isLoggedIn ? (
            <>
              <Link href='/auth' className='lms-navbar-link'>
                Login
              </Link>
              <Link href='/auth' className='lms-btn lms-btn--primary lms-btn--sm'>
                Get Started
              </Link>
            </>
          ) : (
            <div ref={menuRef} className='lms-user-menu' style={{ position: 'relative' }}>
              <button
                type='button'
                className='lms-user-trigger'
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className='lms-user-avatar'>{initials}</div>
                <div className='lms-user-info'>
                  <span className='lms-user-name'>{displayName}</span>
                  <span className={roleBadgeClass}>
                    {isInstructor ? 'Instructor' : 'Student'}
                  </span>
                </div>
                <ChevronDown size={14} className={chevronClass} />
              </button>

              {dropdownOpen && (
                <div className='lms-dropdown' style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 1000 }}>
                  <button
                    type='button'
                    className='lms-dropdown-item'
                    onClick={() => handleNav('/profile')}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <User size={14} />
                    My Profile
                  </button>
                  {!isInstructor && (
                    <button
                      type='button'
                      className='lms-dropdown-item'
                      onClick={() => handleNav('/my-learning')}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Layers size={14} />
                      My Learning
                    </button>
                  )}
                  {isInstructor && (
                    <button
                      type='button'
                      className='lms-dropdown-item'
                      onClick={() => handleNav('/instructor/courses/new')}
                      style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      <Layers size={14} />
                      + Create Course
                    </button>
                  )}
                  <div className='lms-dropdown-divider' />
                  <button
                    type='button'
                    className='lms-dropdown-item lms-dropdown-item--danger'
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <LogOut size={14} />
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
