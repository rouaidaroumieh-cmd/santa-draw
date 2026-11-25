"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Modal dialog used for the draw confirmation and for the historical day view.
 * Escape closes it, focus is moved inside on open and restored on close.
 */
export default function Dialog({
  open,
  title,
  eyebrow,
  children,
  actions,
  onClose,
  tone = "ivory",
}: {
  open: boolean;
  title: string;
  eyebrow?: string;
  children?: ReactNode;
  actions: ReactNode;
  onClose: () => void;
  tone?: "ivory" | "burgundy";
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    const node = panelRef.current;
    const focusable = node?.querySelector<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])",
    );
    (focusable ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      restoreRef.current?.focus?.();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto p-3 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Close dialog"
        onClick={onClose}
        className="fixed inset-0 cursor-default bg-[rgba(6,20,16,0.78)] backdrop-blur-sm"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`rise relative z-10 w-full max-w-[560px] ${tone === "burgundy" ? "paper-dim" : "paper"} gold-frame`}
        style={{ borderRadius: 2 }}
      >
        <div className="px-6 pt-7 pb-5 sm:px-9 sm:pt-9">
          {eyebrow ? (
            <p className="label text-[#B08F4C]">
              {eyebrow}
            </p>
          ) : null}
          <h2
            className="mt-3 text-[1.75rem] leading-[1.05] text-[#173D32] sm:text-[2.15rem]"
            style={{ fontWeight: 400 }}
          >
            {title}
          </h2>
          <div className="rule-solid mt-5 pt-5 text-[0.95rem] leading-relaxed text-[#4A463C]">
            {children}
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-[rgba(110,106,94,0.22)] px-6 py-5 sm:flex-row sm:justify-end sm:px-9">
          {actions}
        </div>
      </div>
    </div>
  );
}
