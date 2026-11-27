"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Overline } from "@/components/Chrome";
import { useT } from "@/lib/language";
import type { FunLabPublicResults } from "@/lib/fun-lab-games";

/** Live Fun Lab vote widgets on the home page (short previews). */
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

  const elfPodium = results?.elfVote.ranked.slice(0, 3) ?? [];
  const memoryTop = results?.memoryMatch.leaders.slice(0, 5) ?? [];
  const guessTop = results?.guessElf.leaders.slice(0, 5) ?? [];
  const movieTop = results?.officeMovie.leaders.slice(0, 5) ?? [];
  const sackTop = results?.officeSack.leaders.slice(0, 5) ?? [];
  const wheelTop = results?.officeWheel.leaders.slice(0, 5) ?? [];
  const horoscopeRoster = results?.officeHoroscope.roster.slice(0, 8) ?? [];
  const factsReady =
    results && results.officeFacts.facts.some((q) => q.ranked.length > 0);
  const mostLikelyReady =
    results && results.mostLikely.questions.some((q) => q.ranked.length > 0);

  const scoreBoard = (
    title: string,
    subtitle: string,
    leaders: { name: string; photo: string; value: number }[],
    formatValue: (v: number) => string,
    players: number,
  ) => (
    <article className="paper gold-frame flex flex-col gap-4 px-5 py-6" style={{ borderRadius: 2 }}>
      <div>
        <p className="label text-[#B08F4C]">{title}</p>
        <h3 className="mt-2 text-[1.4rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
          {subtitle}
        </h3>
      </div>
      {leaders.length === 0 ? (
        <p className="text-[0.9rem] text-[#6E6A5E]">{t("No scores yet.")}</p>
      ) : (
        <ol className="flex flex-col gap-3">
          {leaders.map((row, i) => (
            <li key={row.name} className="flex items-center gap-3 text-[#173D32]">
              <span className="label w-7 text-[#B08F4C]">#{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={row.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
              <span className="capitalize">{row.name}</span>
              <span className="ml-auto text-[0.85rem] text-[#6E6A5E]">{formatValue(row.value)}</span>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-auto pt-2 text-[0.78rem] text-[#6E6A5E]">
        {t("{count} players", { count: players })}
      </p>
    </article>
  );

  return (
    <section id="fun-lab-results" className="px-5 pt-20 sm:pt-24">
      <div className="mx-auto max-w-[1240px]">
        <Overline>{t("Fun Lab results")}</Overline>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <p className="max-w-[560px] font-display text-[1.25rem] italic leading-relaxed text-ivory/90">
            {t("Live tallies from the Fun Lab votes — unlock with your PIN to take part.")}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/fun-lab/results" className="btn btn-ghost">
              {t("See all results")}
            </Link>
            <Link href="/games" className="btn btn-ghost">
              {t("Games")}
            </Link>
            <Link href="/fun-lab" className="btn btn-gold">
              {t("Open Fun Lab")}
            </Link>
          </div>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-2">
          <article className="paper gold-frame flex flex-col gap-4 px-5 py-6" style={{ borderRadius: 2 }}>
            <div>
              <p className="label text-[#B08F4C]">{t("Poll of the day")}</p>
              <h3 className="mt-2 text-[1.4rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
                {t("What should we bring to the office Christmas break?")}
              </h3>
            </div>
            {!results || results.poll.total === 0 ? (
              <p className="text-[0.9rem] text-[#6E6A5E]">{t("No votes yet.")}</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {results.poll.options.map((opt) => (
                  <li key={opt.id}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-[0.95rem] text-[#173D32]">
                      <span style={{ fontWeight: 500 }}>{t(opt.labelKey)}</span>
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
              <h3 className="mt-2 text-[1.4rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
                {t("Who has the best elf look?")}
              </h3>
            </div>
            {elfPodium.length === 0 ? (
              <p className="text-[0.9rem] text-[#6E6A5E]">{t("No votes yet.")}</p>
            ) : (
              <ol className="flex flex-col gap-3">
                {elfPodium.map((p, i) => (
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
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {scoreBoard(
            t("Memory match"),
            t("Fewest moves"),
            memoryTop,
            (v) => t("{count} moves", { count: v }),
            results?.memoryMatch.total ?? 0,
          )}
          {scoreBoard(
            t("Who is this elf?"),
            t("Best blur scores"),
            guessTop,
            (v) => `${v}/${results?.guessElf.max ?? 10}`,
            results?.guessElf.total ?? 0,
          )}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {scoreBoard(
            t("Guess the Christmas movie"),
            t("Best movie scores"),
            movieTop,
            (v) => `${v}/${results?.officeMovie.max ?? 7}`,
            results?.officeMovie.total ?? 0,
          )}
          {scoreBoard(
            t("Guess what's in Santa's sack"),
            t("Best sack scores"),
            sackTop,
            (v) => `${v}/${results?.officeSack.max ?? 20}`,
            results?.officeSack.total ?? 0,
          )}
          {scoreBoard(
            t("Spin the Christmas wheel"),
            t("Most challenges cleared"),
            wheelTop,
            (v) => t("{count} challenges", { count: v }),
            results?.officeWheel.total ?? 0,
          )}
          <article className="paper gold-frame flex flex-col gap-4 px-5 py-6" style={{ borderRadius: 2 }}>
            <div>
              <p className="label text-[#B08F4C]">{t("Christmas horoscope")}</p>
              <h3 className="mt-2 text-[1.4rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
                {t("Your Christmas characters")}
              </h3>
            </div>
            {horoscopeRoster.length === 0 ? (
              <p className="text-[0.9rem] text-[#6E6A5E]">{t("No scores yet.")}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {horoscopeRoster.map((row) => (
                  <li key={row.name} className="flex items-center gap-3 text-[#173D32]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={row.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                    <span className="min-w-0 flex-1 capitalize" style={{ fontWeight: 500 }}>
                      {row.name}
                    </span>
                    <span className="ml-auto text-right text-[0.85rem] text-[#6E6A5E]">
                      {t(row.titleKey)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-auto pt-2 text-[0.78rem] text-[#6E6A5E]">
              {t("{count} players", { count: results?.officeHoroscope.total ?? 0 })}
            </p>
          </article>
        </div>

        <article className="paper gold-frame mt-5 px-5 py-6" style={{ borderRadius: 2 }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label text-[#B08F4C]">{t("Who’s behind the Christmas fact?")}</p>
              <h3 className="mt-2 text-[1.45rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
                {t("Top guesses for each fact")}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[#4A463C]">
                {t("Only finished ballots count on the home page.")}
              </p>
            </div>
            <p className="text-[0.85rem] text-[#6E6A5E]">
              {t("{count} ballots", { count: results?.officeFacts.total ?? 0 })}
            </p>
          </div>

          {!factsReady ? (
            <p className="mt-5 text-[0.95rem] text-[#4A463C]">{t("No votes yet.")}</p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {results!.officeFacts.facts.map((q) => {
                const podium = q.ranked.slice(0, 3);
                return (
                  <li
                    key={q.id}
                    className="flex flex-col border border-[rgba(23,61,50,0.12)] px-3.5 py-3.5"
                    style={{ borderRadius: 2 }}
                  >
                    <p
                      className="min-h-[3.2rem] text-[0.92rem] leading-snug text-[#173D32]"
                      style={{ fontWeight: 500 }}
                    >
                      “{q.fact}”
                    </p>
                    {podium.length > 0 ? (
                      <ol className="mt-3 flex flex-col gap-2">
                        {podium.map((person, i) => (
                          <li key={person.name} className="flex items-center gap-2 text-[#173D32]">
                            <span className="label w-5 shrink-0 text-[#B08F4C]">#{i + 1}</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={person.photo}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate capitalize text-[0.88rem]" style={{ fontWeight: 600 }}>
                                {person.name}
                              </p>
                              <p className="text-[0.78rem] text-[#4A463C]">
                                {t("{count} votes", { count: person.count })}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-3 text-[0.9rem] text-[#4A463C]">{t("No votes yet.")}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>

        <article className="paper gold-frame mt-5 px-5 py-6" style={{ borderRadius: 2 }}>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="label text-[#B08F4C]">{t("Most likely to…")}</p>
              <h3 className="mt-2 text-[1.45rem] leading-snug text-[#173D32]" style={{ fontWeight: 600 }}>
                {t("Top 3 for each question")}
              </h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[#4A463C]">
                {t("Only finished ballots count on the home page.")}
              </p>
            </div>
          </div>

          {!mostLikelyReady ? (
            <p className="mt-5 text-[0.95rem] text-[#4A463C]">{t("No votes yet.")}</p>
          ) : (
            <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {results!.mostLikely.questions.map((q) => {
                const podium = q.ranked.slice(0, 3);
                return (
                  <li
                    key={q.id}
                    className="flex flex-col border border-[rgba(23,61,50,0.12)] px-3.5 py-3.5"
                    style={{ borderRadius: 2 }}
                  >
                    <p
                      className="min-h-[3.2rem] text-[0.92rem] leading-snug text-[#173D32]"
                      style={{ fontWeight: 500 }}
                    >
                      {t(q.labelKey)}
                    </p>
                    {podium.length > 0 ? (
                      <ol className="mt-3 flex flex-col gap-2">
                        {podium.map((person, i) => (
                          <li key={person.name} className="flex items-center gap-2 text-[#173D32]">
                            <span className="label w-5 shrink-0 text-[#B08F4C]">#{i + 1}</span>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={person.photo}
                              alt=""
                              className="h-8 w-8 shrink-0 rounded-full object-cover"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="truncate capitalize text-[0.88rem]" style={{ fontWeight: 600 }}>
                                {person.name}
                              </p>
                              <p className="text-[0.78rem] text-[#4A463C]">
                                {t("{count} votes", { count: person.count })}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="mt-3 text-[0.9rem] text-[#4A463C]">{t("No votes yet.")}</p>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </article>
      </div>
    </section>
  );
}
