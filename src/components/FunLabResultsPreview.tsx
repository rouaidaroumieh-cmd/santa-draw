"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Overline } from "@/components/Chrome";
import { useT } from "@/lib/language";
import type { FunLabPublicResults } from "@/lib/fun-lab-games";

/** Live Fun Lab vote widgets on the home page. */
export default function FunLabResultsPreview() {
  const t = useT();
  const [results, setResults] = useState<FunLabPublicResults | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/fun-lab/results", { cache: "no-store" })
        .then((res) => (res.ok ? (res.json() as Promise<{ results: FunLabPublicResults }>) : null))
        .then((data) => {
          if (!cancelled && data?.results) setResults(data.results);
        })
        .catch(() => undefined);

    void load();
    const timer = setInterval(() => void load(), 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  return (
    <section className="px-5 pt-20 sm:pt-24">
      <div className="mx-auto max-w-[1240px]">
        <Overline>{t("Fun Lab results")}</Overline>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-[560px] font-display text-[1.15rem] italic leading-relaxed text-ivory/75">
            {t("Live tallies from the Fun Lab votes — unlock with your PIN to take part.")}
          </p>
          <Link href="/fun-lab" className="btn btn-gold">
            {t("Open Fun Lab")}
          </Link>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          <article className="paper gold-frame flex flex-col gap-4 px-5 py-6" style={{ borderRadius: 2 }}>
            <div>
              <p className="label text-[#B08F4C]">{t("Poll of the day")}</p>
              <h3 className="mt-2 text-[1.2rem] leading-snug text-[#173D32]">
                {t("What should we bring to the office Christmas break?")}
              </h3>
            </div>
            {!results || results.poll.total === 0 ? (
              <p className="text-[0.9rem] text-[#6E6A5E]">{t("No votes yet.")}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {results.poll.options.map((opt) => (
                  <li key={opt.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[0.85rem] text-[#173D32]">
                      <span>{t(opt.labelKey)}</span>
                      <span className="label text-[#B08F4C]">
                        {opt.count} · {opt.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[rgba(23,61,50,0.12)]">
                      <div
                        className="h-full rounded-full bg-[#B08F4C]"
                        style={{ width: `${opt.pct}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-auto pt-2 text-[0.78rem] text-[#6E6A5E]">
              {t("{count} votes so far", { count: results?.poll.total ?? 0 })}
            </p>
          </article>

          <article className="paper gold-frame flex flex-col gap-4 px-5 py-6" style={{ borderRadius: 2 }}>
            <div>
              <p className="label text-[#B08F4C]">{t("Elf costume vote")}</p>
              <h3 className="mt-2 text-[1.2rem] leading-snug text-[#173D32]">
                {t("Who has the best elf look?")}
              </h3>
            </div>
            {!results || results.elfVote.podium.length === 0 ? (
              <p className="text-[0.9rem] text-[#6E6A5E]">{t("No votes yet.")}</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {results.elfVote.podium.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-3 text-[#173D32]">
                    <span className="label w-7 text-[#B08F4C]">#{i + 1}</span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <span className="capitalize">{p.name}</span>
                    <span className="ml-auto text-[0.85rem] text-[#6E6A5E]">
                      {t("{count} votes", { count: p.count })}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-auto pt-2 text-[0.78rem] text-[#6E6A5E]">
              {t("{count} votes so far", { count: results?.elfVote.total ?? 0 })}
            </p>
          </article>

          <article className="paper gold-frame flex flex-col gap-4 px-5 py-6" style={{ borderRadius: 2 }}>
            <div>
              <p className="label text-[#B08F4C]">{t("Most likely to…")}</p>
              <h3 className="mt-2 text-[1.2rem] leading-snug text-[#173D32]">
                {t("Current leaders")}
              </h3>
            </div>
            {!results || results.mostLikely.questions.every((q) => !q.leader) ? (
              <p className="text-[0.9rem] text-[#6E6A5E]">{t("No votes yet.")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {results.mostLikely.questions.map((q) => (
                  <li
                    key={q.id}
                    className="border-t border-[rgba(23,61,50,0.12)] pt-3 first:border-t-0 first:pt-0"
                  >
                    <p className="text-[0.8rem] leading-snug text-[#6E6A5E]">{t(q.labelKey)}</p>
                    {q.leader ? (
                      <div className="mt-2 flex items-center gap-2.5 text-[#173D32]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={q.leader.photo}
                          alt=""
                          className="h-9 w-9 rounded-full object-cover"
                        />
                        <span className="capitalize">{q.leader.name}</span>
                        <span className="ml-auto text-[0.8rem] text-[#6E6A5E]">
                          {t("{count} votes", { count: q.leader.count })}
                        </span>
                      </div>
                    ) : (
                      <p className="mt-1 text-[0.85rem] text-[#6E6A5E]">{t("No votes yet.")}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
    </section>
  );
}
