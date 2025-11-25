'use client';

import { SessionProvider } from 'next-auth/react';
import ToastProvider from './ToastProvider';
import LoadingProvider from './LoadingProvider';
import ConfirmProvider from './ConfirmProvider';

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <LoadingProvider>
        <ToastProvider>
          <ConfirmProvider>{children}</ConfirmProvider>
        </ToastProvider>
      </LoadingProvider>
    </SessionProvider>
  );
}
