"use client";

import { useCallback, useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

/** Everything focusable inside the dialog, in tab order. */
const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * The single accessible modal for the whole app.
 *
 * RestaurantDashboard used to carry its own inline copy; both lacked a focus trap, an Escape
 * handler, dialog semantics and focus restoration, which made them unusable with a keyboard or
 * a screen reader.
 *
 * Behaviour: renders in a portal, labels itself via aria-labelledby, moves focus in on open,
 * keeps Tab inside, closes on Escape or backdrop click, locks background scroll, and returns
 * focus to whatever opened it.
 */
export default function Modal({ isOpen, onClose, title, children, initialFocusRef }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);
  const titleId = useId();

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose?.();
        return;
      }
      if (event.key !== "Tab") return;

      const nodes = dialogRef.current?.querySelectorAll(FOCUSABLE);
      if (!nodes || nodes.length === 0) {
        event.preventDefault();
        return;
      }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];

      // Wrap at both ends so focus can never escape to the page behind.
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocused.current = document.activeElement;

    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    // Focus the caller's choice, else the first focusable, else the dialog itself.
    const target =
      initialFocusRef?.current ||
      dialogRef.current?.querySelector(FOCUSABLE) ||
      dialogRef.current;
    target?.focus?.();

    return () => {
      document.body.style.overflow = overflow;
      // Return focus where the user left it.
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, initialFocusRef]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      // Clicking the backdrop closes; clicks inside the panel must not bubble up to it.
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        onKeyDown={handleKeyDown}
        className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-in-up focus:outline-none"
      >
        <div className="flex justify-between items-center p-6 pb-4">
          {title ? (
            <h2 id={titleId} className="text-xl font-semibold">
              {title}
            </h2>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-2 hover:bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <X className="h-5 w-5 text-gray-500" aria-hidden="true" />
          </button>
        </div>
        <div className="px-6 pb-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
