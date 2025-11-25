'use client';

import { SessionProvider } from 'next-auth/react';
import ToastProvider from './ToastProvider';
import LoadingProvider from './LoadingProvider';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <ToastProvider>{children}</ToastProvider>
      </LoadingProvider>
    </SessionProvider>
  );
}
