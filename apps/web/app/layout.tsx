import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import AuthInitializer from '@/components/auth-initializer';
import Navbar from '@/components/navbar';
import { ThemeProvider } from '@/components/theme-provider';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SKILL EVO - LMS Portal',
  description: 'Learn practical skills and build your future. Expert-led courses with real-time progress tracking.',
  keywords: ['LMS', 'online learning', 'courses', 'e-learning'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const rootClass = inter.variable + ' dark';
  return (
    <html lang='en' className={rootClass} suppressHydrationWarning>
      <body className='antialiased'>
        <ThemeProvider>
          <QueryProvider>
            <AuthInitializer>
              <Navbar />
              {children}
            </AuthInitializer>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
