"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Overline, PageShell } from "@/components/Chrome";
import type { FunLabPublicResults, VoteTally } from "@/lib/fun-lab-games";
import { useT } from "@/lib/language";

function RankedPeople({
  rows,
  total,
  empty,
}: {
  rows: VoteTally[];
  total: number;
  empty: string;
}) {
  const t = useT();
  if (rows.length === 0) {
    return <p className="mt-5 text-[0.95rem] text-ivory/55">{empty}</p>;
  }
  return (
    <ol className="mt-5 flex flex-col gap-3">
      {rows.map((person, i) => (
        <li
          key={person.name}
          className="paper gold-frame flex items-center gap-4 px-5 py-4"
          style={{ borderRadius: 2 }}
        >
          <span className="label w-8 shrink-0 text-[#B08F4C]">#{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={person.photo}
            alt=""
            className="h-12 w-12 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p
              className="truncate capitalize text-[1.1rem] text-[#173D32]"
              style={{ fontWeight: 600 }}
            >
              {person.name}
            </p>
            <p className="mt-0.5 text-[0.88rem] text-[#4A463C]">
              {t("{count} votes", { count: person.count })}
              {total > 0 ? ` · ${Math.round((person.count / total) * 100)}%` : null}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function ResultBlock({
  id,
  overline,
  title,
  meta,
  children,
}: {
  id: string;
  overline: string;
  title: string;
  meta?: string;
  children: ReactNode;
}) {
  return (
    <article id={id} className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Overline>{overline}</Overline>
          <h2 className="mt-3 text-[1.45rem] leading-snug text-ivory" style={{ fontWeight: 600 }}>
            {title}
          </h2>
        </div>
        {meta ? <p className="text-[0.85rem] text-ivory/60">{meta}</p> : null}
      </div>
      {children}
    </article>
  );
}

/** Full Fun Lab results for every questionnaire / vote / scoreboard. */
export default function FunLabResultsPage() {
  const t = useT();
  const [results, setResults] = useState<FunLabPublicResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/fun-lab/results", { cache: "no-store" })
      .then((res) => (res.ok ? (res.json() as Promise<{ results: FunLabPublicResults }>) : null))
      .then((data) => {
        if (!cancelled && data?.results) setResults(data.results);
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PageShell current="fun">
      <section className="relative isolate overflow-hidden border-b border-[rgba(214,181,109,0.22)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 12% 0%, rgba(36,92,70,0.85) 0%, rgba(15,43,35,0.9) 55%, #0d2620 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[860px] px-5 py-14 sm:py-16">
          <Link
            href="/#fun-lab-results"
            className="label label-gold transition-opacity hover:opacity-80"
          >
            ← {t("Back to home")}
          </Link>
          <p className="label label-gold mt-6">{t("Fun Lab")}</p>
          <h1 className="mt-4 text-[clamp(2rem,5.5vw,3.6rem)] leading-[1.02] text-ivory">
            {t("All results")}
            <span className="block text-gold">{t("Every questionnaire")}</span>
          </h1>
          <p className="mt-4 max-w-[560px] font-display text-[1.1rem] italic leading-relaxed text-ivory/80">
            {t("Full rankings for every Fun Lab vote and scoreboard.")}
          </p>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto max-w-[860px]">
          {loading || !results ? (
            <p className="font-display text-[1.2rem] italic text-ivory/70">{t("Loading…")}</p>
          ) : (
            <div className="flex flex-col gap-14">
              <ResultBlock
                id="poll"
                overline={t("Poll of the day")}
                title={t("What should we bring to the office Christmas break?")}
                meta={t("{count} votes so far", { count: results.poll.total })}
              >
                {results.poll.total === 0 ? (
                  <p className="mt-5 text-[0.95rem] text-ivory/55">{t("No votes yet.")}</p>
                ) : (
                  <ul className="mt-5 flex flex-col gap-3">
                    {results.poll.options.map((opt) => (
                      <li
                        key={opt.id}
                        className="paper gold-frame px-5 py-4"
                        style={{ borderRadius: 2 }}
                      >
                        <div className="mb-2 flex items-center justify-between gap-2 text-[#173D32]">
                          <span style={{ fontWeight: 600 }}>{t(opt.labelKey)}</span>
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
              </ResultBlock>

              <ResultBlock
                id="elf-vote"
                overline={t("Elf costume vote")}
                title={t("Who has the best elf look?")}
                meta={t("{count} votes so far", { count: results.elfVote.total })}
              >
                <RankedPeople
                  rows={results.elfVote.ranked}
                  total={results.elfVote.total}
                  empty={t("No votes yet.")}
                />
              </ResultBlock>

              <ResultBlock
                id="memory-match"
                overline={t("Memory match")}
                title={t("Fewest moves")}
                meta={t("{count} players", { count: results.memoryMatch.total })}
              >
                {results.memoryMatch.leaders.length === 0 ? (
                  <p className="mt-5 text-[0.95rem] text-ivory/55">{t("No scores yet.")}</p>
                ) : (
                  <ol className="mt-5 flex flex-col gap-3">
                    {results.memoryMatch.leaders.map((row, i) => (
                      <li
                        key={row.name}
                        className="paper gold-frame flex items-center gap-4 px-5 py-4"
                        style={{ borderRadius: 2 }}
                      >
                        <span className="label w-8 shrink-0 text-[#B08F4C]">#{i + 1}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.photo}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                        <span className="min-w-0 flex-1 capitalize text-[1.1rem] text-[#173D32]" style={{ fontWeight: 600 }}>
                          {row.name}
                        </span>
                        <span className="text-[0.9rem] text-[#4A463C]">
                          {t("{count} moves", { count: row.value })}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </ResultBlock>

              <ResultBlock
                id="guess-elf"
                overline={t("Who is this elf?")}
                title={t("Best blur scores")}
                meta={t("{count} players", { count: results.guessElf.total })}
              >
                {results.guessElf.leaders.length === 0 ? (
                  <p className="mt-5 text-[0.95rem] text-ivory/55">{t("No scores yet.")}</p>
                ) : (
                  <ol className="mt-5 flex flex-col gap-3">
                    {results.guessElf.leaders.map((row, i) => (
                      <li
                        key={row.name}
                        className="paper gold-frame flex items-center gap-4 px-5 py-4"
                        style={{ borderRadius: 2 }}
                      >
                        <span className="label w-8 shrink-0 text-[#B08F4C]">#{i + 1}</span>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={row.photo}
                          alt=""
                          className="h-12 w-12 shrink-0 rounded-full object-cover"
                        />
                        <span className="min-w-0 flex-1 capitalize text-[1.1rem] text-[#173D32]" style={{ fontWeight: 600 }}>
                          {row.name}
                        </span>
                        <span className="text-[0.9rem] text-[#4A463C]">
                          {row.value}/{results.guessElf.max}
                        </span>
                      </li>
                    ))}
                  </ol>
                )}
              </ResultBlock>

              <div id="most-likely" className="scroll-mt-28">
                <Overline>{t("Most likely to…")}</Overline>
                <h2 className="mt-3 text-[1.55rem] leading-snug text-ivory" style={{ fontWeight: 600 }}>
                  {t("Full questionnaire")}
                </h2>
                <p className="mt-2 text-[0.95rem] text-ivory/60">
                  {t("Only finished ballots count on the home page.")}
                </p>

                <div className="mt-8 flex flex-col gap-12">
                  {results.mostLikely.questions.map((q, qi) => (
                    <article key={q.id} id={`most-likely-${q.id}`} className="scroll-mt-28">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div>
                          <p className="label text-gold">{t("Question {n}", { n: qi + 1 })}</p>
                          <h3
                            className="mt-2 text-[1.25rem] leading-snug text-ivory"
                            style={{ fontWeight: 600 }}
                          >
                            {t(q.labelKey)}
                          </h3>
                        </div>
                        <p className="text-[0.85rem] text-ivory/60">
                          {t("{count} votes so far", { count: q.total })}
                        </p>
                      </div>
                      <RankedPeople
                        rows={q.ranked}
                        total={q.total}
                        empty={t("No votes yet.")}
                      />
                    </article>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link href="/" className="btn btn-ghost">
                  {t("Back to home")}
                </Link>
                <Link href="/fun-lab" className="btn btn-gold">
                  {t("Open Fun Lab")}
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>
    </PageShell>
  );
}
