"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Overline } from "@/components/Chrome";
import { useT } from "@/lib/language";

interface Wish {
  id: string;
  author: string;
  message: string;
}

const PREVIEW_COUNT = 3;

/** A few recent wishes on the home page, with a link to the full wall on Fun. */
export default function WishPreview() {
  const t = useT();
  const [wishes, setWishes] = useState<Wish[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/wishes", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ approved: Wish[] }>) : null))
      .then((data) => {
        if (!cancelled && data) setWishes(data.approved.slice(0, PREVIEW_COUNT));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-5 pt-20 pb-4 sm:pt-24">
      <div className="mx-auto max-w-[1240px]">
        <Overline>{t("Wish wall")}</Overline>

        <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(220px,280px)] lg:items-stretch">
          <div className="flex flex-col gap-3">
            {wishes.length === 0 ? (
              <div className="paper-dim gold-frame px-6 py-10 text-center" style={{ borderRadius: 2 }}>
                <p className="font-display text-[1.35rem] italic leading-snug text-[#173D32]">
                  {t("No wishes yet. Be the first to write one!")}
                </p>
              </div>
            ) : (
              wishes.map((w) => (
                <article key={w.id} className="paper px-5 py-4" style={{ borderRadius: 2 }}>
                  <p className="font-display text-[1.05rem] italic leading-snug text-[#173D32]">“{w.message}”</p>
                  <p className="label mt-3 text-[#B08F4C]">— {w.author}</p>
                </article>
              ))
            )}
          </div>

          <aside className="paper gold-frame flex flex-col justify-between gap-5 px-6 py-7" style={{ borderRadius: 2 }}>
            <div>
              <p className="label text-[#B08F4C]">{t("From the office")}</p>
              <h3 className="mt-3 text-[1.45rem] leading-[1.08] text-[#173D32]" style={{ fontWeight: 400 }}>
                {t("Leave a Christmas wish")}
              </h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-[#4A463C]">
                {t("Read every wish — and add your own — in the Wishes section.")}
              </p>
            </div>
            <Link href="/wishes#wish-wall" className="btn btn-dark self-start">
              {t("See the wish wall")}
            </Link>
          </aside>
        </div>
      </div>
    </section>
  );
}
