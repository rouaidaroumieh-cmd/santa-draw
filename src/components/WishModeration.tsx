"use client";

import { useCallback, useEffect, useState } from "react";
import { Overline } from "@/components/Chrome";
import { removeWish } from "@/lib/store";

interface Wish {
  id: string;
  author: string;
  message: string;
  createdAt: string;
}

/** Organiser only: remove a wish from the Fun page if it should not stay there. */
export default function WishModeration() {
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
  }, [loadWishes]);

  const remove = async (id: string) => {
    setBusy(id);
    setError(null);
    const res = await removeWish(id);
    if (!res.ok) setError(res.error ?? "The wish could not be removed.");
    await loadWishes();
    setBusy(null);
  };

  return (
    <div>
      <Overline>Christmas wishes</Overline>
      <div className="paper gold-frame mt-6 px-6 py-7 sm:px-8" style={{ borderRadius: 2 }}>
        <p className="text-[0.92rem] leading-relaxed text-[#4A463C]">
          Wishes appear on the Fun page as soon as they are sent. Remove any that should not stay there.
        </p>

        {wishes.length === 0 ? (
          <p className="mt-6 text-[0.92rem] text-[#6E6A5E]">No wishes yet.</p>
        ) : (
          <ul className="mt-6 space-y-3">
            {wishes.map((w) => (
              <li key={w.id} className="border border-[rgba(23,61,50,0.2)] px-4 py-4" style={{ borderRadius: 2 }}>
                <p className="text-[0.95rem] text-[#173D32]">“{w.message}”</p>
                <p className="label mt-2 text-[#6E6A5E]">— {w.author}</p>
                <div className="mt-4">
                  <button
                    type="button"
                    className="btn btn-danger"
                    disabled={busy === w.id}
                    onClick={() => void remove(w.id)}
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
