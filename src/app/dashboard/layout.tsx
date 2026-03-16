'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ActiveLocationProvider } from '@/contexts/ActiveLocationContext';
import { DashboardRefreshProvider } from '@/contexts/DashboardRefreshContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Full navigation list (used on mobile)
  const fullNavLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/rabbits', label: 'Rabbits', icon: '🐰' },
    { href: '/dashboard/breeding', label: 'Breeding', icon: '💕' },
    { href: '/dashboard/deaths', label: 'Deaths', icon: '⚠️' },
    { href: '/dashboard/finances', label: 'Finances', icon: '💰' },
    { href: '/dashboard/notes', label: 'Notes', icon: '📝' },
    { href: '/dashboard/locations', label: 'Locations', icon: '📍' },
    { href: '/dashboard/workers', label: 'Workers', icon: '👷' },
    { href: '/dashboard/reports', label: 'Reports', icon: '📄' },
    { href: '/dashboard/profile', label: 'Profile', icon: '👤' },
  ];
  // Desktop should only show the requested subset
  const desktopNavLinks = fullNavLinks.filter(l => ['Dashboard','Notes','Locations','Workers','Reports','Profile'].includes(l.label));

  return (
    <DashboardRefreshProvider>
      <ActiveLocationProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Nav */}
            <div className="flex">
              <Link href="/dashboard" className="flex items-center">
                <span className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  🐰 Smart Rabbit
                </span>
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-2">
                {desktopNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                      pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href))
                        ? 'border-green-600 text-green-600 dark:border-green-400 dark:text-green-400' 
                        : 'border-transparent text-gray-700 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400'
                    }`}
                  >
                    <span className="mr-1.5">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Desktop User Menu */}
            <div className="hidden lg:flex items-center space-x-3">
              <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate max-w-[150px]">
                {session.user?.name || session.user?.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {mobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {fullNavLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href))
                      ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                      : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  <span className="mr-2">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
              
              {/* Mobile User Info & Sign Out */}
              <div className="border-t border-gray-200 dark:border-gray-700 mt-3 pt-3 px-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                    {session.user?.name || session.user?.email}
                  </span>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="ml-2 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>
      
      {/* Main Content - Responsive Padding */}
      <main className="max-w-7xl mx-auto py-4 px-4 sm:py-6 sm:px-6 lg:px-8">
        {children}
      </main>
      </div>
    </ActiveLocationProvider>
    </DashboardRefreshProvider>
  );
}
