'use client';

import { Toaster } from 'sonner';

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      toastOptions={{
        style: {
          fontFamily: 'Inter, system-ui, sans-serif',
          borderRadius: '8px',
        },
        classNames: {
          success: 'bg-white border border-outline-variant',
          error: 'bg-white border border-error',
        },
      }}
    />
  );
}
