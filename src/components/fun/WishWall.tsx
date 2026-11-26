"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useT } from "@/lib/language";

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
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <form onSubmit={submit} className="paper gold-frame flex flex-col gap-4 px-6 py-7" style={{ borderRadius: 2 }}>
        <label className="flex flex-col gap-2">
          <span className="label text-[#6E6A5E]">{t("Your first name")}</span>
          <input
            className="field"
            value={author}
            maxLength={40}
            onChange={(e) => setAuthor(e.target.value)}
            required
          />
        </label>
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
        <div className="flex items-center justify-between gap-4">
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

      <div className="flex flex-col gap-4">
        {wishes.length === 0 ? (
          <p className="font-display text-[1.25rem] italic text-ivory/75">
            {t("No wishes yet. Be the first to write one!")}
          </p>
        ) : (
          wishes.map((w) => (
            <article key={w.id} className="paper px-5 py-4" style={{ borderRadius: 2 }}>
              <p className="font-display text-[1.1rem] italic leading-snug text-[#173D32]">“{w.message}”</p>
              <p className="label mt-3 text-[#B08F4C]">— {w.author}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
