"use client";

import { useT } from "@/lib/language";

/**
 * Employee photo. Falls back to an SVG monogram medallion (gold ring on a
 * tinted ground) until a real photograph has been uploaded — never a broken
 * image, never a generic stock silhouette.
 */
const GROUNDS = ["#245C46", "#7A1F2B", "#B08F4C", "#1C4A3B", "#8E3A2E", "#3E6B54"];

function hashIndex(id: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  id,
  name,
  photo,
  size = 96,
  ring = true,
  className = "",
}: {
  id: string;
  name: string;
  photo?: string | null;
  size?: number;
  ring?: boolean;
  className?: string;
}) {
  const t = useT();
  const ground = GROUNDS[hashIndex(id, GROUNDS.length)];

  if (photo) {
    return (
      <div
        className={`relative overflow-hidden rounded-full ${className}`}
        style={{
          width: size,
          height: size,
          boxShadow: ring
            ? "0 0 0 1px rgba(214,181,109,0.75), 0 0 0 5px rgba(214,181,109,0.16), 0 18px 30px -18px rgba(0,0,0,0.8)"
            : undefined,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photo}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          style={{ objectPosition: "50% 46%" }}
        />
      </div>
    );
  }

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={t("{name} — placeholder portrait", { name })}
      className={className}
    >
      <defs>
        <radialGradient id={`g-${id}`} cx="38%" cy="30%" r="78%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.28)" />
          <stop offset="60%" stopColor="rgba(255,255,255,0.04)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.32)" />
        </radialGradient>
      </defs>
      <circle cx="50" cy="50" r="50" fill={ground} />
      <circle cx="50" cy="50" r="50" fill={`url(#g-${id})`} />
      <circle
        cx="50"
        cy="50"
        r="46"
        fill="none"
        stroke="rgba(214,181,109,0.85)"
        strokeWidth={ring ? 1.6 : 0}
      />
      <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(214,181,109,0.35)" strokeWidth="0.8" />
      <text
        x="50"
        y="50"
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F8F3E9"
        fontFamily="Poppins, Georgia, serif"
        fontSize="34"
        fontWeight="400"
        letterSpacing="1"
      >
        {initialsOf(name)}
      </text>
    </svg>
  );
}
