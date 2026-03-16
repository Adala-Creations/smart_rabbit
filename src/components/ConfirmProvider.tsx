'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

type ConfirmOptions = {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  typedConfirmation?: {
    expectedValue: string;
    inputLabel?: string;
    helperText?: string;
  };
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
  const [typedValue, setTypedValue] = useState('');
  const typedInputRef = useRef<HTMLInputElement | null>(null);

  const confirm = useCallback((message: string, options?: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ message, options, resolver: resolve });
    });
  }, []);

  useEffect(() => {
    if (!state) {
      setTypedValue('');
      return;
    }

    if (state.options?.typedConfirmation) {
      setTypedValue('');
      const timer = window.setTimeout(() => {
        typedInputRef.current?.focus();
      }, 0);

      return () => window.clearTimeout(timer);
    }

    setTypedValue('');
  }, [state]);

  const typedConfirmationValid = !state?.options?.typedConfirmation || typedValue === state.options.typedConfirmation.expectedValue;

  const handleConfirm = () => {
    if (!typedConfirmationValid) return;
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
            {state.options?.typedConfirmation && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {state.options.typedConfirmation.inputLabel ?? 'Type the confirmation key'}
                </label>
                <input
                  ref={typedInputRef}
                  type="text"
                  value={typedValue}
                  onChange={(e) => setTypedValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  {state.options.typedConfirmation.helperText ?? `Type ${state.options.typedConfirmation.expectedValue} to continue.`}
                </p>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={handleCancel} className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700">{state.options?.cancelText ?? 'Cancel'}</button>
              <button
                onClick={handleConfirm}
                disabled={!typedConfirmationValid}
                className={`px-3 py-1 rounded ${state.options?.danger ? 'bg-red-600 text-white' : 'bg-green-600 text-white'} ${!typedConfirmationValid ? 'opacity-50 cursor-not-allowed' : ''}`}>
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
