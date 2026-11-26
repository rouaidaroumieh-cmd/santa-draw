"use client";

import { useCallback, useEffect, useState } from "react";
import { Overline } from "@/components/Chrome";
import { moderateWish } from "@/lib/store";

interface Wish {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

/** Organiser only: approve or delete the wishes that visitors left on the Fun page. */
export default function WishModeration() {
  const [pending, setPending] = useState<Wish[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadPending = useCallback(
    () =>
      fetch("/api/wishes", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<{ pending: Wish[] }>) : null))
        .then((data) => {
          if (data) setPending(data.pending);
        })
        .catch(() => undefined),
    [],
  );

  useEffect(() => {
    void loadPending();
  }, [loadPending]);

  const act = async (id: string, action: "approveWish" | "deleteWish") => {
    setBusy(id);
    setError(null);
    const res = await moderateWish(id, action);
    if (!res.ok) setError(res.error ?? "The wish could not be updated.");
    await loadPending();
    setBusy(null);
  };

  return (
    <div>
      <Overline>Christmas wishes</Overline>
      <div className="paper gold-frame mt-6 px-6 py-7 sm:px-8" style={{ borderRadius: 2 }}>
        <p className="text-[0.92rem] leading-relaxed text-[#4A463C]">
          Visitors leave wishes on the Fun page. Nothing is shown publicly until you approve it.
        </p>

        {pending.length === 0 ? (
          <p className="mt-6 text-[0.92rem] text-[#6E6A5E]">No wishes waiting for approval.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {pending.map((w) => (
              <li key={w.id} className="border border-[rgba(23,61,50,0.2)] px-4 py-4" style={{ borderRadius: 2 }}>
                <p className="text-[0.95rem] text-[#173D32]">“{w.message}”</p>
                <p className="label mt-2 text-[#6E6A5E]">— {w.author}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="btn btn-dark"
                    disabled={busy === w.id}
                    onClick={() => void act(w.id, "approveWish")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy === w.id}
                    onClick={() => void act(w.id, "deleteWish")}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {error ? (
          <p role="alert" className="mt-5 text-[0.9rem] text-[#7A1F2B]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
