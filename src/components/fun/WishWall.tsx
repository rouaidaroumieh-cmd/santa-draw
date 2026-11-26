"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useT } from "@/lib/language";
import { useCampaign } from "@/lib/store";

interface Wish {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

const REFRESH_MS = 30000;

/** Visitors leave a Christmas wish. Each one appears on the wall straight away. */
export default function WishWall() {
  const t = useT();
  const state = useCampaign();
  const names = state?.participants.map((p) => p.name) ?? [];
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [author, setAuthor] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const loadWishes = useCallback(
    () =>
      fetch("/api/wishes", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<{ approved: Wish[] }>) : null))
        .then((data) => {
          if (data) setWishes(data.approved);
        })
        .catch(() => undefined),
    [],
  );

  useEffect(() => {
    void loadWishes();
    const timer = setInterval(() => void loadWishes(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [loadWishes]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!author) {
      setNotice({ tone: "error", text: t("Please choose a name from the participant list.") });
      return;
    }
    setSending(true);
    setNotice(null);
    try {
      const res = await fetch("/api/wishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ author, message }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (res.ok) {
        setAuthor("");
        setMessage("");
        setNotice({ tone: "ok", text: t("Thank you! Your wish is on the wall.") });
        void loadWishes();
      } else {
        setNotice({ tone: "error", text: t(data?.error ?? "Your wish could not be sent.") });
      }
    } catch {
      setNotice({ tone: "error", text: t("The server cannot be reached. Check your connection.") });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <form
        onSubmit={submit}
        className="paper gold-frame flex w-full flex-col gap-4 px-6 py-7"
        style={{ borderRadius: 2 }}
      >
        <div className="flex flex-col gap-2">
          <span id="wish-author-label" className="label text-[#6E6A5E]">
            {t("Your first name")}
          </span>
          <div role="radiogroup" aria-labelledby="wish-author-label" className="flex flex-wrap gap-2">
            {names.length === 0 ? (
              <span className="text-[0.85rem] text-[#6E6A5E]">{t("Loading…")}</span>
            ) : (
              names.map((name) => {
                const selected = name === author;
                return (
                  <button
                    key={name}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => setAuthor(name)}
                    className={`border px-3 py-1.5 text-[0.85rem] capitalize transition-colors ${
                      selected
                        ? "border-[#173D32] bg-[#173D32] text-ivory"
                        : "border-[rgba(23,61,50,0.3)] text-[#173D32] hover:border-[#B08F4C]"
                    }`}
                    style={{ borderRadius: 2 }}
                  >
                    {name}
                  </button>
                );
              })
            )}
          </div>
        </div>
        <label className="flex flex-col gap-2">
          <span className="label text-[#6E6A5E]">{t("Your wish ({count}/200)", { count: message.length })}</span>
          <textarea
            className="field min-h-[120px] resize-y"
            value={message}
            maxLength={200}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-[0.82rem] text-[#6E6A5E]">{t("Your wish appears on the wall straight away.")}</p>
          <button type="submit" className="btn btn-dark" disabled={sending}>
            {sending ? t("Sending…") : t("Send my wish")}
          </button>
        </div>
        {notice ? (
          <p role="status" className={`text-[0.9rem] ${notice.tone === "ok" ? "text-[#245C46]" : "text-[#7A1F2B]"}`}>
            {notice.text}
          </p>
        ) : null}
      </form>

      <div className="flex min-h-0 flex-col gap-3">
        {wishes.length === 0 ? (
          <p className="font-display text-[1.25rem] italic text-ivory/75">
            {t("No wishes yet. Be the first to write one!")}
          </p>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-3 px-0.5">
              <p className="label label-gold">
                {t("{count} wishes", { count: wishes.length })}
              </p>
              <p className="text-[0.78rem] text-ivory/55">{t("Newest first")}</p>
            </div>
            <div
              className="wish-scroll gold-frame max-h-[min(68vh,640px)] overflow-y-auto overscroll-contain p-3 sm:p-4"
              style={{ borderRadius: 2 }}
              tabIndex={0}
              aria-label={t("Wish wall")}
            >
              <div className="flex flex-col gap-3">
                {wishes.map((w) => (
                  <article key={w.id} className="paper px-4 py-3.5 sm:px-5 sm:py-4" style={{ borderRadius: 2 }}>
                    <p className="font-display text-[1.05rem] italic leading-snug text-[#173D32]">
                      “{w.message}”
                    </p>
                    <p className="label mt-2.5 text-[#B08F4C]">— {w.author}</p>
                  </article>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
