"use client";

import { useState, type FormEvent } from "react";
import { useT } from "@/lib/language";
import { FUN_LAB_ROSTER } from "@/lib/fun-lab-roster";
import { useFunLab } from "./FunLabContext";

/** Unlock Fun Lab with a stable per-person PIN. */
export default function FunLabLogin() {
  const t = useT();
  const { login, error } = useFunLab();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name) {
      setLocalError(t("Choose your name first."));
      return;
    }
    if (!/^\d{4}$/.test(pin.trim())) {
      setLocalError(t("PIN must be 4 digits."));
      return;
    }
    setLocalError(null);
    setBusy(true);
    await login(name, pin.trim());
    setBusy(false);
  };

  return (
    <form
      onSubmit={submit}
      className="paper gold-frame mx-auto flex w-full max-w-[560px] flex-col gap-5 px-6 py-8"
      style={{ borderRadius: 2 }}
    >
      <div>
        <p className="label text-[#B08F4C]">{t("Unlock Fun Lab")}</p>
        <h3 className="mt-2 text-[1.4rem] leading-snug text-[#173D32]">
          {t("Your name + your personal PIN")}
        </h3>
        <p className="mt-2 text-[0.9rem] leading-relaxed text-[#6E6A5E]">
          {t(
            "Each colleague has one fixed 4-digit PIN for the whole campaign. Ask the organiser if you do not have yours yet.",
          )}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="label text-[#6E6A5E]">{t("I am…")}</span>
        <div className="flex flex-wrap gap-2">
          {FUN_LAB_ROSTER.map((p) => {
            const selected = p.name === name;
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => setName(p.name)}
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

      <label className="flex flex-col gap-2">
        <span className="label text-[#6E6A5E]">{t("PIN (4 digits)")}</span>
        <input
          className="field max-w-[180px] tracking-[0.35em]"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="••••"
          required
        />
      </label>

      {(localError || error) && (
        <p role="alert" className="text-[0.9rem] text-[#7A1F2B]">
          {t(localError || error || "")}
        </p>
      )}

      <button type="submit" className="btn btn-dark self-start" disabled={busy}>
        {busy ? t("Checking…") : t("Enter Fun Lab")}
      </button>
    </form>
  );
}
