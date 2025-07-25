'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useSidebar } from '@/lib/sidebar-context';
import Navbar from '@/components/ui/Navbar';
import Sidebar from '@/components/ui/Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const { collapsed } = useSidebar();
  const router = useRouter();
  
  const isLandingPage = pathname === '/';
  const isAuthPage = pathname === '/login' || pathname === '/signup' || pathname.includes('/forgot-password');
  
  // Redirect to explore page if user is logged in and on home page
  useEffect(() => {
    if (!isLoading && user && pathname === '/') {
      router.push('/explore');
    }
  }, [isLoading, user, pathname, router]);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black">
      {isLandingPage && <Navbar />}
      
      {isLandingPage || isAuthPage ? (
        <main className="min-h-screen">
          {children}
        </main>
      ) : (
        <div className="flex pt-16">
          <Sidebar />
          <main className={`flex-1 transition-all duration-500 ${collapsed ? 'ml-[90px]' : 'ml-[360px]'}`}>
            {children}
          </main>
        </div>
      )}
    </div>
  );
} 