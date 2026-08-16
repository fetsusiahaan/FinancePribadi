import { useEffect, useId, useRef } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children }) {
  const panelRef = useRef(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return undefined;

    // Simpan elemen pemicu supaya fokus keyboard bisa dikembalikan saat modal ditutup.
    const trigger = document.activeElement;
    const panel = panelRef.current;
    panel?.querySelector(FOCUSABLE)?.focus();

    function onKey(e) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;

      // Jebak Tab di dalam panel supaya fokus tidak lolos ke konten di belakang overlay.
      const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      if (trigger instanceof HTMLElement) trigger.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm motion-safe:animate-[fadeIn_150ms_ease-out]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full sm:max-w-md max-h-[90dvh] overflow-y-auto bg-surface-container-lowest dark:bg-dark-surface-container-lowest rounded-t-2xl sm:rounded-2xl shadow-xl border border-outline-variant/40 dark:border-dark-outline-variant/40 motion-safe:animate-[sheetIn_220ms_cubic-bezier(0.2,0,0,1)] sm:motion-safe:animate-[dialogIn_200ms_cubic-bezier(0.2,0,0,1)]"
      >
        <div className="sticky top-0 z-10 bg-surface-container-lowest dark:bg-dark-surface-container-lowest flex items-center justify-between gap-sm px-md py-sm border-b border-outline-variant/40 dark:border-dark-outline-variant/40">
          <h2 id={titleId} className="font-semibold text-on-background dark:text-dark-on-background">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="w-11 h-11 -mr-2 shrink-0 flex items-center justify-center rounded-lg cursor-pointer text-on-surface-variant dark:text-dark-on-surface-variant hover:bg-surface-container dark:hover:bg-dark-surface-container focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-colors"
          >
            <span className="material-symbols-outlined" aria-hidden="true">
              close
            </span>
          </button>
        </div>
        <div className="p-md">{children}</div>
      </div>
    </div>
  );
}
