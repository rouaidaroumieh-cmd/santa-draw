"use client";

import Link from "next/link";
import { useEffect, type ReactNode } from "react";
import DevToolbar from "@/components/DevToolbar";
import { DEV_MODE } from "@/lib/dev-mode";
import { type Lang } from "@/lib/i18n";
import { setLang, useLang, useT } from "@/lib/language";
import { useSyncError } from "@/lib/store";

export type SectionKey = "home" | "calendar" | "participants" | "fun" | "admin";

const NAV: { key: SectionKey; href: string; label: string }[] = [
  { key: "home", href: "/", label: "Home" },
  { key: "calendar", href: "/calendar", label: "Calendar" },
  { key: "participants", href: "/participants", label: "Participants" },
  { key: "fun", href: "/fun", label: "Fun" },
  { key: "admin", href: "/admin", label: "Admin" },
];

const LANGUAGES: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "fr", label: "FR" },
];

/** Decorative falling snow — deterministic so server and client agree. */
export function Snow({ count = 16 }: { count?: number }) {
  const flakes = Array.from({ length: count }, (_, i) => {
    const seed = (i * 9301 + 49297) % 233280;
    const r = seed / 233280;
    const size = 2 + (i % 4) * 1.4;
    return {
      left: `${(r * 100).toFixed(2)}%`,
      size: `${size}px`,
      duration: `${(13 + (i % 7) * 3.2).toFixed(1)}s`,
      delay: `${(-((i * 2.7) % 16)).toFixed(1)}s`,
      opacity: (0.22 + (i % 5) * 0.11).toFixed(2),
    };
  });
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[5] overflow-hidden">
      {flakes.map((f, i) => (
        <span
          key={i}
          className="snowflake"
          style={{
            left: f.left,
            width: f.size,
            height: f.size,
            animationDuration: f.duration,
            animationDelay: f.delay,
            opacity: f.opacity,
          }}
        />
      ))}
    </div>
  );
}

/** Two-letter switch between English and French. The choice is remembered in this browser. */
export function LanguageToggle() {
  const lang = useLang();
  const t = useT();
  return (
    <div
      role="group"
      aria-label={t("Language")}
      className="flex shrink-0 items-center border border-[rgba(214,181,109,0.4)]"
      style={{ borderRadius: 2 }}
    >
      {LANGUAGES.map((option) => {
        const active = option.code === lang;
        return (
          <button
            key={option.code}
            type="button"
            aria-pressed={active}
            onClick={() => setLang(option.code)}
            className={`label px-2.5 py-2 text-[0.62rem] transition-colors duration-200 ${
              active
                ? "bg-[rgba(214,181,109,0.2)] text-gold"
                : "text-ivory/65 hover:bg-[rgba(214,181,109,0.08)] hover:text-ivory"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function SiteHeader({ current }: { current: SectionKey }) {
  const t = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(214,181,109,0.28)] bg-[rgba(15,43,35,0.92)] backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between md:gap-8 md:py-5">
        <Link href="/" className="group flex items-center gap-3">
          <BrandMark />
          <span className="flex flex-col leading-none">
            <span className="font-display text-[1.15rem] tracking-[-0.01em] text-ivory md:text-[1.35rem]">
              Santa&apos;s Christmas Draw
            </span>
            <span className="label label-gold mt-1 text-[0.58rem] opacity-90">
              {t("23 Days of Christmas Magic")}
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <nav aria-label={t("Main navigation")} className="-mx-1 flex items-center gap-1 overflow-x-auto px-1">
            {NAV.map((item) => {
              const active = item.key === current;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`label whitespace-nowrap rounded-sm px-3 py-2 transition-colors duration-200 ${
                    active
                      ? "bg-[rgba(214,181,109,0.16)] text-gold"
                      : "text-ivory/70 hover:bg-[rgba(214,181,109,0.08)] hover:text-ivory"
                  }`}
                >
                  {t(item.label)}
                  <span
                    className={`mx-auto mt-1 block h-px transition-all duration-300 ${
                      active ? "bg-gold opacity-100" : "bg-gold opacity-0"
                    }`}
                  />
                </Link>
              );
            })}
          </nav>
          <LanguageToggle />
        </div>
      </div>
      <div className="rule" />
    </header>
  );
}

/** Hand-drawn brand mark: a gold star inside a fir-sprig ring. */
export function BrandMark({ size = 38 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="22.2" fill="none" stroke="rgba(214,181,109,0.75)" strokeWidth="1.1" />
      <circle cx="24" cy="24" r="18.4" fill="none" stroke="rgba(214,181,109,0.32)" strokeWidth="0.7" />
      <path
        d="M24 8.5 L27.2 18.4 L37.4 18.6 L29.1 24.7 L32.2 34.6 L24 28.6 L15.8 34.6 L18.9 24.7 L10.6 18.6 L20.8 18.4 Z"
        fill="#D6B56D"
      />
      <path
        d="M24 33 C20 36 17 38.5 13.5 39.5 M24 33 C28 36 31 38.5 34.5 39.5"
        stroke="rgba(214,181,109,0.6)"
        strokeWidth="1.1"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function PageShell({
  current,
  children,
}: {
  current: SectionKey;
  children: ReactNode;
}) {
  const syncError = useSyncError();
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="relative min-h-screen">
      <Snow />
      <SiteHeader current={current} />
      {syncError ? (
        <p
          role="alert"
          className="relative z-10 border-b border-[#A33444] bg-[rgba(163,52,68,0.18)] px-5 py-3 text-center text-[0.85rem] text-ivory"
        >
          {t(syncError)}
        </p>
      ) : null}
      <main className="relative z-10">{children}</main>
      <footer className="relative z-10 mt-20 border-t border-[rgba(214,181,109,0.22)] bg-[rgba(9,30,24,0.7)]">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-3 px-5 py-9 text-center md:flex-row md:items-center md:justify-between md:text-left">
          <p className="label text-ivory/55">
            {t("Santa's Christmas Draw 2026 · 23 days · 17 working days · 60 selections")}
          </p>
          <p className="max-w-md text-[0.82rem] leading-relaxed text-ivory/45">
            {t(
              "Results are stored on the server and shared with everyone. The organiser can export a JSON backup from the Admin panel.",
            )}
          </p>
        </div>
      </footer>
      {DEV_MODE ? <DevToolbar /> : null}
    </div>
  );
}

/** Tracked gold small-caps label sitting on a hairline rule. */
export function Overline({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "stone" }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`label ${tone === "gold" ? "label-gold" : "text-stone"}`}>{children}</span>
      <span className="rule flex-1" />
    </div>
  );
}
