'use client';

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  GraduationCap,
  BookOpen,
  User,
  LogOut,
  ChevronDown,
  Layers,
  Sun,
  Moon,
  Menu,
  X,
  PlusCircle,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth-store';
import { useTheme } from '@/components/theme-provider';

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { userId, role, fullName, email, clearUser } = useAuthStore();
  const { theme, toggleTheme } = useTheme();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Safe click and touch outside listeners
  useEffect(() => {
    function handleOutsideInteraction(event: MouseEvent | TouchEvent) {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        setMobileNavOpen(false);
      }
    }

    if (dropdownOpen || mobileNavOpen) {
      document.addEventListener('mousedown', handleOutsideInteraction);
      document.addEventListener('touchstart', handleOutsideInteraction, { passive: true });
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
    };
  }, [dropdownOpen, mobileNavOpen]);

  // Close menus on page navigation
  useEffect(() => {
    setDropdownOpen(false);
    setMobileNavOpen(false);
  }, [pathname]);

  const handleNav = (href: string) => {
    setDropdownOpen(false);
    setMobileNavOpen(false);
    router.push(href);
  };

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileNavOpen(false);
    await supabase.auth.signOut();
    clearUser();
    router.push('/auth?mode=login');
  };

  const isLoggedIn = Boolean(userId || role);
  const isInstructor = role === 'instructor';
  const displayName = fullName || (email ? email.split('@')[0] : 'User') || 'User';
  const displayEmail = email || '';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const coursesActiveClass =
    'lms-navbar-link' +
    (pathname && pathname.startsWith('/courses') && !pathname.includes('/learn')
      ? ' lms-navbar-link--active'
      : '');
  const myLearningActiveClass =
    'lms-navbar-link' + (pathname === '/my-learning' ? ' lms-navbar-link--active' : '');
  const instructorActiveClass =
    'lms-navbar-link' + (pathname && pathname.startsWith('/instructor') ? ' lms-navbar-link--active' : '');
  const profileActiveClass =
    'lms-dropdown-item' + (pathname === '/profile' ? ' lms-navbar-link--active' : '');
  const roleBadgeClass =
    'lms-role-badge ' + (isInstructor ? 'lms-role-badge--instructor' : 'lms-role-badge--student');
  const chevronClass = 'lms-chevron' + (dropdownOpen ? ' lms-chevron--open' : '');

  if (!isClient) return null;

  return (
    <nav className="lms-navbar">
      <div className="lms-navbar-inner">
        {/* Brand Logo */}
        <Link href="/" className="lms-navbar-logo">
          <div className="lms-navbar-logo-icon">
            <GraduationCap size={18} />
          </div>
          <span className="lms-navbar-logo-text">
            SKILL<span className="lms-navbar-logo-accent">EVO</span>
          </span>
        </Link>

        {/* Desktop Navigation Links (hidden on mobile) */}
        <div className="lms-navbar-links">
          <Link href="/courses" className={coursesActiveClass}>
            <BookOpen size={15} />
            Courses
          </Link>

          {isLoggedIn && !isInstructor && (
            <Link href="/my-learning" className={myLearningActiveClass}>
              <Layers size={15} />
              My Learning
            </Link>
          )}

          {isInstructor && (
            <Link href="/instructor" className={instructorActiveClass}>
              <Layers size={15} />
              Dashboard
            </Link>
          )}
        </div>

        {/* Navbar Right Actions */}
        <div className="lms-navbar-right" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
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
              flexShrink: 0,
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
              {/* Desktop Auth Links */}
              <div className="lms-desktop-auth" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Link href="/auth?mode=login" className="lms-navbar-link">
                  Login
                </Link>
                <Link href="/auth?mode=signup" className="lms-btn lms-btn--primary lms-btn--sm">
                  Get Started
                </Link>
              </div>

              {/* Mobile Hamburger Button for Guest */}
              <div ref={mobileMenuRef} className="lms-mobile-auth-wrapper" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setMobileNavOpen(!mobileNavOpen)}
                  aria-label="Toggle navigation menu"
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
                    color: 'var(--text-primary)',
                  }}
                  className="lms-mobile-menu-trigger"
                >
                  {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
                </button>

                {mobileNavOpen && (
                  <div
                    className="lms-dropdown lms-mobile-guest-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 240,
                      zIndex: 1000,
                      padding: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                    }}
                  >
                    <button
                      type="button"
                      className="lms-dropdown-item"
                      onClick={() => handleNav('/courses')}
                      style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    >
                      <BookOpen size={16} />
                      Browse Courses
                    </button>
                    <div className="lms-dropdown-divider" />
                    <button
                      type="button"
                      className="lms-dropdown-item"
                      onClick={() => handleNav('/auth?mode=login')}
                      style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className="lms-btn lms-btn--primary lms-btn--sm"
                      onClick={() => handleNav('/auth?mode=signup')}
                      style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
                    >
                      Get Started (Sign Up)
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Logged-In User Menu Bar (Responsive for Mobile and Desktop) */
            <div ref={menuRef} className="lms-user-menu" style={{ position: 'relative' }}>
              <button
                type="button"
                className="lms-user-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-label="Open user menu"
                aria-expanded={dropdownOpen}
              >
                <div className="lms-user-avatar">{initials}</div>
                <div className="lms-user-info">
                  <span className="lms-user-name">{displayName}</span>
                  <span className={roleBadgeClass}>
                    {isInstructor ? 'Instructor' : 'Student'}
                  </span>
                </div>
                <ChevronDown size={14} className={chevronClass} />
              </button>

              {dropdownOpen && (
                <div
                  className="lms-dropdown"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: 260,
                    maxWidth: 'calc(100vw - 20px)',
                    zIndex: 1000,
                  }}
                >
                  {/* User Profile Card Header in Dropdown */}
                  <div className="lms-dropdown-header" style={{ padding: '8px 12px 10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="lms-user-avatar" style={{ width: 34, height: 34, fontSize: 13 }}>
                        {initials}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {displayName}
                        </span>
                        {displayEmail && (
                          <span
                            style={{
                              fontSize: 11,
                              color: 'var(--text-muted)',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                            }}
                          >
                            {displayEmail}
                          </span>
                        )}
                        <span
                          className={roleBadgeClass}
                          style={{ marginTop: 4, width: 'fit-content', fontSize: 9 }}
                        >
                          {isInstructor ? 'Instructor' : 'Student'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="lms-dropdown-divider" />

                  {/* Navigation Links for Mobile & Desktop */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* Courses link accessible everywhere */}
                    <button
                      type="button"
                      className="lms-dropdown-item"
                      onClick={() => handleNav('/courses')}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: pathname === '/courses' ? 700 : 500,
                      }}
                    >
                      <BookOpen size={15} />
                      Browse Courses
                    </button>

                    {/* Student My Learning */}
                    {!isInstructor && (
                      <button
                        type="button"
                        className="lms-dropdown-item"
                        onClick={() => handleNav('/my-learning')}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          cursor: 'pointer',
                          fontWeight: pathname === '/my-learning' ? 700 : 500,
                        }}
                      >
                        <Layers size={15} />
                        My Learning
                      </button>
                    )}

                    {/* Instructor Dashboard */}
                    {isInstructor && (
                      <>
                        <button
                          type="button"
                          className="lms-dropdown-item"
                          onClick={() => handleNav('/instructor')}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                            fontWeight: pathname === '/instructor' ? 700 : 500,
                          }}
                        >
                          <Layers size={15} />
                          Instructor Dashboard
                        </button>
                        <button
                          type="button"
                          className="lms-dropdown-item"
                          onClick={() => handleNav('/instructor/courses/new')}
                          style={{
                            width: '100%',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                        >
                          <PlusCircle size={15} />
                          + Create New Course
                        </button>
                      </>
                    )}

                    {/* My Profile */}
                    <button
                      type="button"
                      className={profileActiveClass}
                      onClick={() => handleNav('/profile')}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontWeight: pathname === '/profile' ? 700 : 500,
                      }}
                    >
                      <User size={15} />
                      My Profile
                    </button>
                  </div>

                  <div className="lms-dropdown-divider" />

                  {/* Sign out */}
                  <button
                    type="button"
                    className="lms-dropdown-item lms-dropdown-item--danger"
                    onClick={handleLogout}
                    style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                  >
                    <LogOut size={15} />
                    Sign Out
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
