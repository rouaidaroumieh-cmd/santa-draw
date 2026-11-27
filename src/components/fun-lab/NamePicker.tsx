"use client";

import { useT } from "@/lib/language";
import { DEMO_PARTICIPANTS } from "./demoData";

/** Compact name chips reused by every Fun Lab demo that needs a voter identity. */
export default function NamePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (name: string) => void;
  label?: string;
}) {
  const t = useT();
  return (
    <div className="flex flex-col gap-2">
      <span className="label text-[#6E6A5E]">{label ?? t("I am…")}</span>
      <div className="flex flex-wrap gap-2">
        {DEMO_PARTICIPANTS.map((p) => {
          const selected = p.name === value;
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onChange(p.name)}
              className={`border px-2.5 py-1 text-[0.8rem] capitalize transition-colors ${
                selected
                  ? "border-[#173D32] bg-[#173D32] text-ivory"
                  : "border-[rgba(23,61,50,0.3)] text-[#173D32] hover:border-[#B08F4C]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {p.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
