"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";

import Modal from "./Modal";

const ConfirmContext = createContext(null);

/**
 * Replaces window.confirm() across the dashboards.
 *
 * The native dialog cannot be styled, blocks the whole browser thread, and is stripped by some
 * embedded webviews — which meant a destructive action could silently proceed. This provides a
 * promise-based confirm backed by the accessible Modal, so it also gets a focus trap, Escape
 * handling and focus restoration.
 *
 *   const confirm = useConfirm();
 *   if (await confirm({ title: "Delete?", danger: true })) { ... }
 */
export function ConfirmProvider({ children }) {
  const [state, setState] = useState(null);
  const [isBusy, setIsBusy] = useState(false);
  const resolver = useRef(null);
  const confirmButtonRef = useRef(null);

  const confirm = useCallback((options) => {
    setState({
      title: "Are you sure?",
      message: "",
      confirmLabel: "Confirm",
      cancelLabel: "Cancel",
      danger: false,
      ...options,
    });
    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = useCallback((result) => {
    resolver.current?.(result);
    resolver.current = null;
    setState(null);
    setIsBusy(false);
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <Modal
        isOpen={Boolean(state)}
        onClose={() => !isBusy && settle(false)}
        title={state?.title}
        initialFocusRef={confirmButtonRef}
      >
        {state && (
          <div>
            <div className="flex gap-3">
              {state.danger && (
                <div className="h-10 w-10 flex-shrink-0 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="h-5 w-5 text-red-500" aria-hidden="true" />
                </div>
              )}
              {state.message && <p className="text-gray-600">{state.message}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => settle(false)}
                disabled={isBusy}
                className="px-4 py-2 rounded-lg border border-gray-300 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                {state.cancelLabel}
              </button>
              <button
                ref={confirmButtonRef}
                type="button"
                onClick={() => { setIsBusy(true); settle(true); }}
                disabled={isBusy}
                className={`px-4 py-2 rounded-lg font-medium text-white disabled:opacity-60 flex items-center gap-2 ${
                  state.danger ? "bg-red-600 hover:bg-red-700" : "bg-primary-500 hover:bg-primary-600"
                }`}
              >
                {isBusy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {state.confirmLabel}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </ConfirmContext.Provider>
  );
}

// The provider and its hook live together by design; this only costs HMR granularity.
// eslint-disable-next-line react-refresh/only-export-components
export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context.confirm;
}
