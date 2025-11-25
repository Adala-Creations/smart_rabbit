'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
};

type ConfirmContextType = {
  confirm: (message: string, options?: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export const ConfirmProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<{
    message: string;
    options?: ConfirmOptions;
    resolver?: (value: boolean) => void;
  } | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, options, resolver: resolve });
    });
  }, []);

  const handleConfirm = () => {
    if (state && state.resolver) state.resolver(true);
    setState(null);
  };
  const handleCancel = () => {
    if (state && state.resolver) state.resolver(false);
    setState(null);
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            {state.options?.title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{state.options.title}</h3>
            )}
            <p className="text-gray-700 dark:text-gray-200 mb-4">{state.message}</p>
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">{state.options?.cancelText ?? 'Cancel'}</button>
              <button
                onClick={handleConfirm}
                className={`px-3 py-1 rounded ${state.options?.danger ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
                {state.options?.confirmText ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export const useConfirm = () => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used within ConfirmProvider');
  return ctx.confirm;
};

export default ConfirmProvider;
