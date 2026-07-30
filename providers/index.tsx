'use client';

import { ThemeProvider } from './ThemeProvider';
import { ToastProvider } from './ToastProvider';
import { ModalProvider } from './ModalProvider';
import { SupabaseProvider } from './SupabaseProvider';
import { AuthProvider } from './AuthProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

/**
 * Root providers wrapper — wraps the entire application.
 *
 * Provider order (outermost → innermost):
 *   ThemeProvider          — dark/light mode
 *   SupabaseProvider       — shared Supabase browser client
 *   AuthProvider           — session, user, role
 *   ModalProvider          — global modal state
 *   ToastProvider          — global toast notifications
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider>
      <SupabaseProvider>
        <AuthProvider>
          <ModalProvider>
            {children}
            <ToastProvider />
          </ModalProvider>
        </AuthProvider>
      </SupabaseProvider>
    </ThemeProvider>
  );
}
