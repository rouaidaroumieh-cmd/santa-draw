"use client";

import Avatar from "@/components/Avatar";
import { Overline, PageShell } from "@/components/Chrome";
import { CampaignProgress } from "@/components/Stats";
import { SELECTIONS_PER_PARTICIPANT, participantStats } from "@/lib/draw-engine";
import { formatDateShort, ordinal } from "@/lib/dates";
import { useLang, useT } from "@/lib/language";
import { useCampaign } from "@/lib/store";

/** Public, read-only list. Names and photos are edited in the organiser's Admin section. */
export default function ParticipantsPage() {
  const state = useCampaign();
  const lang = useLang();
  const t = useT();

  if (!state) {
    return (
      <PageShell current="participants">
        <div className="mx-auto flex min-h-[70vh] max-w-[1240px] items-center justify-center px-5">
          <p className="label label-gold animate-pulse">{t("Gathering the participants…")}</p>
        </div>
      </PageShell>
    );
  }

  const stats = participantStats(state);
  const editable = Object.keys(state.results).length === 0;

  return (
    <PageShell current="participants">
      <section className="relative isolate overflow-hidden border-b border-[rgba(214,181,109,0.22)]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(90% 120% at 12% 0%, rgba(36,92,70,0.85) 0%, rgba(15,43,35,0.9) 55%, #0d2620 100%)",
          }}
        />
        <div className="relative mx-auto max-w-[1240px] px-5 py-16 sm:py-20">
          <p className="label label-gold">{t("Twenty colleagues · three chances each")}</p>
          <h1
            className="mt-5 text-ivory"
            style={{ fontSize: "clamp(2.6rem, 7.6vw, 5.8rem)", lineHeight: 0.9, letterSpacing: "-0.035em", fontWeight: 300 }}
          >
            {t("Meet our Christmas")}
            <span className="block text-gold" style={{ fontWeight: 500 }}>
              {t("Participants")}
            </span>
          </h1>
          <p className="mt-6 max-w-[560px] font-display text-[1.15rem] italic leading-relaxed text-ivory/80" style={{ fontWeight: 300 }}>
            {t(
              "Every person appears exactly three times, on three different working days. The three stars light up as each selection is revealed.",
            )}
          </p>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto max-w-[1240px]">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
            <div>
              <Overline>{t("The list")}</Overline>
              <p className="mt-4 text-[0.9rem] leading-relaxed text-ivory/65">
                {editable
                  ? t(
                      "Names and photographs can still be edited by the organiser — the configuration locks as soon as the first draw is completed.",
                    )
                  : t(
                      "Configuration is locked: at least one draw has been completed, so names and photographs can no longer change.",
                    )}
              </p>

              <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {stats.map((p, i) => (
                  <article
                    key={p.id}
                    className="paper gold-frame lift flex flex-col px-5 py-6"
                    style={{ borderRadius: 2 }}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar id={p.id} name={p.name} photo={state.photos[p.id]} size={72} />
                      <div className="min-w-0 flex-1">
                        <h2 className="font-display text-[1.22rem] font-medium leading-tight text-[#173D32]">
                          {p.name}
                        </h2>
                        <p className="mt-1 text-[0.74rem] leading-snug text-[#4A463C]">{p.role}</p>
                        <p
                          className={`label mt-2 inline-block px-2 py-1 text-[0.58rem] ${
                            p.completed
                              ? "bg-[#D6B56D] text-[#2A2113]"
                              : "border border-[rgba(122,31,43,0.45)] text-[#7A1F2B]"
                          }`}
                        >
                          {p.completed ? t("Completed") : t("Active")}
                        </p>
                      </div>
                    </div>

                    <div className="rule-solid mt-5 pt-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="label text-[#5C4A1F]">
                          {t("Selections:")}{" "}
                          <span className="tabular font-semibold text-[#173D32]">{p.selected}/3</span>
                        </p>
                        <p className="label text-[#4A463C]">
                          {t("Remaining:")}{" "}
                          <span className="tabular font-semibold text-[#173D32]">{p.remaining}</span>
                        </p>
                      </div>

                      {/* three gift-stars */}
                      <div className="mt-3 flex items-center gap-2">
                        {Array.from({ length: SELECTIONS_PER_PARTICIPANT }, (_, s) => {
                          const lit = s < p.selected;
                          return (
                            <svg key={s} width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
                              <path
                                d="M12 2.6 L14.2 8.6 L20.6 8.8 L15.6 12.6 L17.4 18.8 L12 15.1 L6.6 18.8 L8.4 12.6 L3.4 8.8 L9.8 8.6 Z"
                                fill={lit ? "#D6B56D" : "none"}
                                stroke={lit ? "#8A6F35" : "#5C574C"}
                                strokeWidth="1.25"
                              />
                            </svg>
                          );
                        })}
                        <span className="label ml-auto text-[0.58rem] text-[#4A463C]">
                          {p.completed ? t("All three revealed") : t("{count} left", { count: p.remaining })}
                        </span>
                      </div>

                      {/* progress */}
                      <div className="mt-3 h-[7px] w-full overflow-hidden rounded-full bg-[rgba(74,70,60,0.22)]">
                        <div
                          className="h-full rounded-full transition-[width] duration-500"
                          style={{
                            width: `${(p.selected / SELECTIONS_PER_PARTICIPANT) * 100}%`,
                            background:
                              p.completed
                                ? "linear-gradient(90deg,#8A6F35,#D6B56D)"
                                : "linear-gradient(90deg,#7A1F2B,#A33444)",
                          }}
                        />
                      </div>

                      <p className="mt-3 text-[0.78rem] leading-relaxed text-[#3D3A32]">
                        {p.dates.length === 0
                          ? t("No selection revealed yet.")
                          : t("Revealed on {dates}", {
                              dates: p.dates.map((d) => formatDateShort(d, lang)).join(" · "),
                            })}
                      </p>
                      <p className="sr-only">
                        {t("Selection {ordinal} of {total}", {
                          ordinal: ordinal(p.selected, lang),
                          total: SELECTIONS_PER_PARTICIPANT,
                        })}
                      </p>
                    </div>

                    <span className="label mt-3 text-[0.58rem] text-[#4A463C]">
                      {t("Entry {number} of 20", { number: String(i + 1).padStart(2, "0") })}
                    </span>
                  </article>
                ))}
              </div>
            </div>

            <aside className="lg:sticky lg:top-28">
              <CampaignProgress state={state} />
              <div className="paper gold-frame mt-5 px-6 py-6" style={{ borderRadius: 2 }}>
                <p className="label text-[#B08F4C]">{t("How the three chances work")}</p>
                <ol className="mt-4 space-y-3 text-[0.85rem] leading-relaxed text-[#3D3A30]">
                  <li>{t("1 · Each person is placed in the schedule exactly three times.")}</li>
                  <li>{t("2 · The three dates are always different working days.")}</li>
                  <li>{t("3 · Once the third star is lit, the person is excluded from future draws.")}</li>
                  <li>{t("4 · Counts are recalculated from the saved results after every reveal.")}</li>
                </ol>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
