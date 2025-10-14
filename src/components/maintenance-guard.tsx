'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { UserRole } from '@/types/user-role';

interface MaintenanceStatus {
  maintenanceMode: boolean;
  maintenanceMessage: string | null;
  maintenanceScheduledEnd: string | null;
}

/**
 * MaintenanceGuard Component
 * 
 * Client-side component that checks maintenance mode status and redirects
 * non-DEVELOPER users to the maintenance page if maintenance mode is active.
 * 
 * This component runs on the client side to avoid edge runtime issues with Prisma.
 */
export function MaintenanceGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Wait for session to load
    if (status === 'loading') return;

    // Skip check for DEVELOPER role
    if (session?.user?.role === UserRole.DEVELOPER) return;

    // Skip check for maintenance page and auth pages
    const allowedPaths = [
      '/maintenance',
      '/login',
      '/signup',
      '/verify',
      '/forgot-password',
      '/reset-password',
    ];

    if (allowedPaths.some(path => pathname.startsWith(path))) {
      return;
    }

    // Check maintenance status
    const checkMaintenance = async () => {
      try {
        const response = await fetch('/api/system/maintenance/status');
        
        if (response.ok) {
          const data: MaintenanceStatus = await response.json();
          
          if (data.maintenanceMode) {
            // Redirect to maintenance page
            router.push('/maintenance');
          }
        }
      } catch (error) {
        // If maintenance check fails, log error but allow access
        console.error('Error checking maintenance status:', error);
      }
    };

    checkMaintenance();
  }, [session, status, pathname, router]);

  return <>{children}</>;
}

