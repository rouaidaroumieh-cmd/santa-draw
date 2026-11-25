"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import Avatar from "@/components/Avatar";
import Dialog from "@/components/Dialog";
import { Overline, PageShell } from "@/components/Chrome";
import { CampaignProgress, StatCards } from "@/components/Stats";
import { campaignStats, participantStats, WINNERS_PER_DAY } from "@/lib/draw-engine";
import { formatDateLong, formatDateShort, ordinal } from "@/lib/dates";
import { exportCSV, exportJSON, fileToPhotoDataUrl } from "@/lib/storage";
import {
  applyBackup,
  getBackup,
  login,
  logout,
  regenerateSchedule,
  resetCampaign,
  setParticipantPhoto,
  setSettings,
  startCampaign,
  updateParticipant,
  useCampaign,
  useIsAdmin,
  validateCurrentSchedule,
} from "@/lib/store";

type ResetStep = "closed" | "warning" | "confirm";

export default function AdminPage() {
  const state = useCampaign();
  const isAdmin = useIsAdmin();
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [validation, setValidation] = useState<{ ok: boolean; errors: string[] } | null>(null);
  const [resetStep, setResetStep] = useState<ResetStep>("closed");
  const [resetWord, setResetWord] = useState("");
  const importRef = useRef<HTMLInputElement | null>(null);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const photoTargetRef = useRef<string | null>(null);

  if (!state) {
    return (
      <PageShell current="admin">
        <div className="mx-auto flex min-h-[70vh] max-w-[1240px] items-center justify-center px-5">
          <p className="label label-gold animate-pulse">Opening the administration panel…</p>
        </div>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell current="admin">
        <LoginPanel />
      </PageShell>
    );
  }

  const results = Object.values(state.results).sort((a, b) => a.date.localeCompare(b.date));
  const locked = results.length > 0;
  const stats = campaignStats(state);
  const people = participantStats(state);
  const today = state.today;
  const winnersPerDay = [...state.schedule]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((day) => {
      let status = "Upcoming";
      if (state.results[day.date]) status = "Drawn · locked";
      else if (day.date === today) status = "Today · not drawn yet";
      else if (day.date < today) status = "Not drawn";
      return { date: day.date, count: day.winnerCount, status };
    });
  const totalWinners = winnersPerDay.reduce((sum, row) => sum + row.count, 0);

  const doValidate = async () => {
    const res = await validateCurrentSchedule();
    setValidation(res);
    setNotice({
      tone: res.ok ? "ok" : "error",
      text: res.ok
        ? "Schedule valid: 20 participants, 15 working days, 4 winners per day, 3 selections each."
        : `Schedule invalid: ${res.errors[0]}`,
    });
  };

  const doRegenerate = async () => {
    const res = await regenerateSchedule();
    setNotice({
      tone: res.ok ? "ok" : "error",
      text: res.ok
        ? "A new randomised schedule has been generated and validated."
        : res.error ?? "The schedule could not be regenerated.",
    });
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const text = await file.text();
      const res = await applyBackup(text);
      setNotice({
        tone: res.ok ? "ok" : "error",
        text: res.ok
          ? "Backup restored. The campaign now matches the imported file."
          : `Import rejected: ${res.error}`,
      });
    } catch {
      setNotice({ tone: "error", text: "The file could not be read." });
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  };

  const onPhoto = async (file: File | undefined) => {
    const id = photoTargetRef.current;
    if (!file || !id) return;
    try {
      const dataUrl = await fileToPhotoDataUrl(file);
      await setParticipantPhoto(id, dataUrl);
      setNotice({ tone: "ok", text: "Photo updated." });
    } catch (err) {
      setNotice({ tone: "error", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      if (photoInputRef.current) photoInputRef.current.value = "";
    }
  };

  const doReset = async () => {
    await resetCampaign();
    setResetStep("closed");
    setResetWord("");
    setNotice({ tone: "ok", text: "The campaign has been completely reset. A new schedule is ready." });
  };

  return (
    <PageShell current="admin">
      <section className="border-b border-[rgba(214,181,109,0.22)] bg-[rgba(9,30,24,0.55)]">
        <div className="mx-auto max-w-[1240px] px-5 py-14 sm:py-16">
          <p className="label label-gold">Organiser tools · configuration, backups and campaign control</p>
          <h1
            className="mt-5 text-ivory"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.2rem)", lineHeight: 0.9, letterSpacing: "-0.035em", fontWeight: 300 }}
          >
            Administration
            <span className="block text-gold" style={{ fontWeight: 500 }}>
              Panel
            </span>
          </h1>
          <p className="mt-6 max-w-[620px] font-display text-[1.1rem] italic leading-relaxed text-ivory/80" style={{ fontWeight: 300 }}>
            Everything here is designed to be used without technical knowledge: edit the twenty
            names, load their photos, keep a backup, and let the daily draw look after itself.
          </p>

          {notice ? (
            <p
              role="status"
              className={`mt-7 max-w-[720px] border-l-2 px-5 py-3.5 text-[0.9rem] leading-relaxed ${
                notice.tone === "error"
                  ? "border-[#A33444] bg-[rgba(163,52,68,0.16)] text-ivory"
                  : "border-gold bg-[rgba(214,181,109,0.12)] text-ivory/88"
              }`}
            >
              {notice.text}
            </p>
          ) : null}

          <button type="button" className="btn btn-dark mt-7" onClick={() => void logout()}>
            Log out
          </button>
        </div>
      </section>

      <section className="px-5 py-14">
        <div className="mx-auto flex max-w-[1240px] flex-col gap-14">
          {/* ---- Statistics ------------------------------------------ */}
          <div>
            <Overline>Campaign statistics</Overline>
            <div className="mt-6">
              <StatCards state={state} />
            </div>
            <div className="mt-5">
              <CampaignProgress state={state} />
            </div>
          </div>

          {/* ---- Participants --------------------------------------- */}
          <div>
            <Overline>Participant configuration</Overline>
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <span
                className={`label px-3 py-1.5 ${
                  locked
                    ? "bg-[rgba(163,52,68,0.22)] text-ivory"
                    : "bg-[rgba(214,181,109,0.18)] text-gold"
                }`}
              >
                {locked ? "Locked – campaign in progress" : "Open for editing"}
              </span>
              <p className="text-[0.86rem] text-ivory/60">
                {locked
                  ? "At least one draw has been completed, so names and photos can no longer change."
                  : "Edit the names and upload photographs before the first reveal. JPG, PNG and WebP are supported."}
              </p>
            </div>

            <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {state.participants.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 border border-[rgba(214,181,109,0.22)] bg-[rgba(9,30,24,0.42)] px-4 py-3.5"
                  style={{ borderRadius: 2 }}
                >
                  <Avatar id={p.id} name={p.name} photo={state.photos[p.id]} size={52} />
                  <div className="min-w-0 flex-1">
                    <label className="sr-only" htmlFor={`name-${p.id}`}>
                      Name of participant {i + 1}
                    </label>
                    <input
                      id={`name-${p.id}`}
                      className="field text-[0.92rem]"
                      value={p.name}
                      disabled={locked}
                      onChange={(e) => updateParticipant(p.id, { name: e.target.value })}
                    />
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="label border border-[rgba(214,181,109,0.35)] px-2.5 py-1.5 text-[0.52rem] text-gold transition-colors hover:bg-[rgba(214,181,109,0.14)] disabled:opacity-40"
                        disabled={locked}
                        onClick={() => {
                          photoTargetRef.current = p.id;
                          photoInputRef.current?.click();
                        }}
                      >
                        {state.photos[p.id] ? "Replace photo" : "Add photo"}
                      </button>
                      <span className="tabular label text-[0.52rem] text-ivory/45">
                        {people[i].selected}/3 used
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---- Schedule -------------------------------------------- */}
          <div>
            <Overline>Draw schedule</Overline>
            <div className="paper gold-frame mt-6 px-6 py-7 sm:px-8" style={{ borderRadius: 2 }}>
              <p className="text-[0.92rem] leading-relaxed text-[#4A463C]">
                The complete schedule for all 15 working days is generated up front with the Web
                Crypto API and validated before it becomes active: 20 participants × 3 selections =
                15 days × 4 winners = 60 selections. Future names are never exposed in the interface.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="btn btn-dark" onClick={() => void doValidate()}>
                  Validate schedule
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => void doRegenerate()}
                  disabled={locked}
                >
                  Generate new schedule
                </button>
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={async () => {
                    await startCampaign();
                    setNotice({ tone: "ok", text: "Campaign started. The draw is live." });
                  }}
                  disabled={locked || state.status === "active"}
                >
                  Start the campaign
                </button>
              </div>

              {validation ? (
                <div
                  className={`mt-6 border-l-2 px-5 py-4 ${
                    validation.ok
                      ? "border-[#245C46] bg-[rgba(36,92,70,0.12)] text-[#173D32]"
                      : "border-[#A33444] bg-[rgba(163,52,68,0.1)] text-[#7A1F2B]"
                  }`}
                >
                  <p className="label">
                    {validation.ok ? "Validation passed" : "Validation failed"}
                  </p>
                  <ul className="mt-2 space-y-1 text-[0.85rem]">
                    {(validation.ok
                      ? [
                          "20 participants",
                          "15 eligible working days (weekends excluded)",
                          "4 distinct winners per day",
                          "3 appearances per participant on 3 different dates",
                          "60 total selections",
                        ]
                      : validation.errors
                    ).map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </div>

          {/* ---- Winners per day ------------------------------------- */}
          <div>
            <Overline>Winners per day</Overline>
            <div className="paper gold-frame mt-6 overflow-x-auto px-6 py-7 sm:px-8" style={{ borderRadius: 2 }}>
              <table className="w-full min-w-[520px] border-collapse text-left text-[#173D32]">
                <thead>
                  <tr className="border-b border-[rgba(23,61,50,0.25)]">
                    {["Date", "Winners", "Status"].map((h) => (
                      <th key={h} className="label pb-3 text-[#6E6A5E]">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {winnersPerDay.map((row) => (
                    <tr key={row.date} className="border-b border-[rgba(23,61,50,0.12)]">
                      <td className="py-3 pr-4 text-[0.88rem]">{formatDateLong(row.date)}</td>
                      <td
                        className={`tabular py-3 pr-4 text-[0.88rem] ${
                          row.count === WINNERS_PER_DAY ? "" : "font-bold text-[#7A1F2B]"
                        }`}
                      >
                        {row.count} / {WINNERS_PER_DAY}
                      </td>
                      <td className="py-3 text-[0.82rem] text-[#4A463C]">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="pt-4 text-[0.88rem] font-bold">Total</td>
                    <td className="tabular pt-4 text-[0.88rem] font-bold">{totalWinners} selections</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
              <p className="mt-5 text-[0.8rem] leading-relaxed text-[#6E6A5E]">
                Only the number of winners is shown for upcoming days. Names appear here once a day is drawn.
              </p>
            </div>
          </div>

          {/* ---- Date management ------------------------------------- */}
          <div>
            <Overline>Date management &amp; rehearsal</Overline>
            <div className="mt-6 grid gap-5 lg:grid-cols-2">
              <div className="paper gold-frame px-6 py-7" style={{ borderRadius: 2 }}>
                <p className="label text-[#B08F4C]">Campaign clock</p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-[#4A463C]">
                  By default the application follows the real system date. You may point the clock at
                  another campaign date to rehearse the flow — draws made that way are real and get
                  locked permanently.
                </p>
                <div className="mt-5 flex flex-wrap items-end gap-4">
                  <div>
                    <label className="label block text-[#6E6A5E]" htmlFor="date-mode">
                      Mode
                    </label>
                    <select
                      id="date-mode"
                      className="field mt-2 w-[190px]"
                      value={state.settings.dateMode}
                      onChange={(e) =>
                        setSettings({ dateMode: e.target.value as "auto" | "manual" })
                      }
                    >
                      <option value="auto">Real date (automatic)</option>
                      <option value="manual">Manual campaign date</option>
                    </select>
                  </div>
                  <div>
                    <label className="label block text-[#6E6A5E]" htmlFor="manual-date">
                      Campaign date
                    </label>
                    <input
                      id="manual-date"
                      type="date"
                      min="2026-12-01"
                      max="2026-12-21"
                      className="field mt-2 w-[190px]"
                      value={state.settings.manualDate ?? ""}
                      disabled={state.settings.dateMode !== "manual"}
                      onChange={(e) => setSettings({ manualDate: e.target.value || null })}
                    />
                  </div>
                </div>
                <p className="mt-4 text-[0.78rem] leading-relaxed text-[#6E6A5E]">
                  Weekends, future dates and completed dates are always rejected by the engine, no
                  matter which mode is selected.
                </p>
              </div>

              <div className="paper-dim gold-frame px-6 py-7" style={{ borderRadius: 2 }}>
                <p className="label text-gold">Simulation mode</p>
                <p className="mt-3 text-[0.88rem] leading-relaxed text-ivory/72">
                  On the Home page the machine can be rehearsed at any time. A simulation animates
                  the reels with four random names so you can check the look and timing — the result
                  is clearly marked <em>Simulation · not recorded</em> and is never written to the
                  campaign history.
                </p>
                <Link href="/" className="btn btn-gold mt-6 inline-flex">
                  Open the drawing machine
                </Link>
              </div>
            </div>
          </div>

          {/* ---- Completed draws ------------------------------------- */}
          <div>
            <Overline>Completed draws</Overline>
            {results.length === 0 ? (
              <p className="mt-6 text-[0.92rem] leading-relaxed text-ivory/60">
                No draw has been completed yet. The first reveal will appear here with its full
                history and its permanent lock.
              </p>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[620px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-[rgba(214,181,109,0.3)]">
                      {["Date", "Winners", "Selections", "Locked"].map((h) => (
                        <th key={h} className="label pb-3 text-gold/85">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r) => (
                      <tr
                        key={r.date}
                        className="border-b border-[rgba(214,181,109,0.14)] align-top"
                      >
                        <td className="py-4 pr-4 text-[0.88rem] text-ivory/85">
                          {formatDateShort(r.date)}
                        </td>
                        <td className="py-4 pr-4 text-[0.88rem] text-ivory/85">
                          {r.participantIds
                            .map((id) => state.participants.find((p) => p.id === id)?.name ?? id)
                            .join(", ")}
                        </td>
                        <td className="py-4 pr-4 text-[0.82rem] text-ivory/60">
                          {r.participantIds.map((id) => {
                            const n = Object.values(state.results).filter(
                              (x) => x.date <= r.date && x.participantIds.includes(id),
                            ).length;
                            return `${state.participants.find((p) => p.id === id)?.name ?? id}: ${ordinal(n)}`;
                          }).join(" · ")}
                        </td>
                        <td className="py-4">
                          <span className="label text-[0.52rem] text-gold">Locked</span>
                          <p className="mt-1 text-[0.72rem] text-ivory/45">
                            {new Date(r.revealedAt).toLocaleString("en-GB", {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ---- Backup ---------------------------------------------- */}
          <div>
            <Overline>Backup &amp; export</Overline>
            <div className="paper gold-frame mt-6 px-6 py-7 sm:px-8" style={{ borderRadius: 2 }}>
              <p className="text-[0.92rem] leading-relaxed text-[#4A463C]">
                Everything — names, photos, schedule and results — is stored on the server and shared
                with every visitor. Export a JSON backup after each reveal and keep it somewhere
                safe: it is the only copy you control.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={async () => {
                    const backup = await getBackup();
                    if (backup) exportJSON(backup);
                    else setNotice({ tone: "error", text: "The backup could not be created." });
                  }}
                >
                  Export JSON backup
                </button>
                <button type="button" className="btn btn-dark" onClick={() => exportCSV(state)}>
                  Export results (CSV)
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={() => importRef.current?.click()}
                >
                  Import JSON backup
                </button>
                <button
                  type="button"
                  className="btn btn-dark"
                  onClick={async () => {
                    const backup = await getBackup();
                    if (!backup) return;
                    void navigator.clipboard?.writeText(JSON.stringify(backup, null, 2)).then(
                      () => setNotice({ tone: "ok", text: "Backup JSON copied to the clipboard." }),
                      () =>
                        setNotice({
                          tone: "error",
                          text: "The clipboard is not available in this browser — use Export JSON instead.",
                        }),
                    );
                  }}
                >
                  Copy backup to clipboard
                </button>
              </div>
              <p className="mt-5 text-[0.8rem] leading-relaxed text-[#6E6A5E]">
                Imported files are fully validated before they replace the current campaign: wrong
                file type, invalid schedule, duplicate winners or an exceeded selection budget are
                rejected with a clear error, and nothing is overwritten.
              </p>
            </div>
          </div>

          {/* ---- Reset ----------------------------------------------- */}
          <div>
            <Overline>Danger zone</Overline>
            <div
              className="mt-6 border border-[rgba(163,52,68,0.45)] px-6 py-7 sm:px-8"
              style={{ borderRadius: 2, background: "rgba(122,31,43,0.12)" }}
            >
              <p className="label text-[#F0C9CE]">Full campaign reset</p>
              <p className="mt-3 max-w-[640px] text-[0.92rem] leading-relaxed text-ivory/80">
                This erases <strong>every</strong> result, lock, name, photograph and the current
                schedule. The campaign returns to its initial placeholder state with a brand new
                randomised schedule. There is no ordinary undo for a daily draw — this is the only
                way to start again, and it requires two separate confirmations.
              </p>
              <button
                type="button"
                className="btn btn-danger mt-6"
                onClick={() => setResetStep("warning")}
              >
                Reset the entire campaign
              </button>
            </div>
          </div>

          {/* ---- Guide ----------------------------------------------- */}
          <div>
            <Overline>Quick user guide</Overline>
            <ol className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Edit the 20 employees", "Open ADMIN → Participant configuration, type the real names into the twenty fields. Everything stays editable until the first reveal."],
                ["Upload photos", "Use “Add photo” beside any name (JPG, PNG or WebP). Photos are resized automatically and stored on the server."],
                ["Perform the daily draw", "On HOME press “Reveal today's 4 names”, read the warning, then confirm. The four reels stop one after another and the result is locked forever."],
                ["View the calendar", "CALENDAR shows all 21 days. Click a completed day for the full historical view; weekends are marked “Weekend – no draw”."],
                ["Export backups", "ADMIN → Backup & export. Save the JSON file after every reveal and restore it on another device with “Import JSON backup”."],
                ["Share the link", "Everyone sees the same results. Only you, logged in on this page, can run the daily draw — visitors just watch the names appear."],
              ].map(([title, body]) => (
                <li
                  key={title}
                  className="border-l border-[rgba(214,181,109,0.35)] pl-4"
                >
                  <p className="label text-gold">{title}</p>
                  <p className="mt-2 text-[0.85rem] leading-relaxed text-ivory/65">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ---- Hidden inputs ------------------------------------------ */}
      <input
        ref={importRef}
        type="file"
        accept="application/json"
        className="sr-only"
        aria-label="Import JSON backup"
        onChange={(e) => void onImport(e.target.files?.[0])}
      />
      <input
        ref={photoInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        aria-label="Upload participant photo"
        onChange={(e) => void onPhoto(e.target.files?.[0])}
      />

      {/* ---- Two-step reset ---------------------------------------- */}
      <Dialog
        open={resetStep === "warning"}
        onClose={() => setResetStep("closed")}
        eyebrow="Step 1 of 2 · irreversible"
        title="This will erase the entire campaign"
        tone="burgundy"
        actions={
          <>
            <button type="button" className="btn btn-dark" onClick={() => setResetStep("closed")}>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={() => setResetStep("confirm")}>
              Continue to final confirmation
            </button>
          </>
        }
      >
        <p>
          All {stats.completedSelections} revealed selections, every lock, all twenty names and all
          uploaded photographs will be permanently deleted from this browser. A new randomised
          schedule will be generated.
        </p>
        <p className="mt-4">
          Export a JSON backup first if there is any chance you will need these results again.
        </p>
      </Dialog>

      <Dialog
        open={resetStep === "confirm"}
        onClose={() => {
          setResetStep("closed");
          setResetWord("");
        }}
        eyebrow="Step 2 of 2 · final confirmation"
        title="Type RESET to confirm"
        tone="burgundy"
        actions={
          <>
            <button
              type="button"
              className="btn btn-dark"
              onClick={() => {
                setResetStep("closed");
                setResetWord("");
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={resetWord.trim().toUpperCase() !== "RESET"}
              onClick={() => void doReset()}
            >
              Erase everything permanently
            </button>
          </>
        }
      >
        <label className="label block text-[#6E6A5E]" htmlFor="reset-word">
          Confirmation word
        </label>
        <input
          id="reset-word"
          className="field mt-2"
          value={resetWord}
          placeholder="RESET"
          onChange={(e) => setResetWord(e.target.value)}
        />
        <p className="mt-4">
          There is no undo. Once executed, the campaign restarts from its initial state and the old
          results cannot be recovered without a previously exported backup.
        </p>
      </Dialog>
    </PageShell>
  );
}

function LoginPanel() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const res = await login(password);
    setBusy(false);
    if (res.ok) setPassword("");
    else setError(res.error ?? "Login failed.");
  };

  return (
    <section className="px-5 py-24">
      <form
        onSubmit={(event) => void submit(event)}
        className="paper gold-frame mx-auto max-w-[440px] px-6 py-8"
        style={{ borderRadius: 2 }}
      >
        <p className="label text-[#B08F4C]">Organiser login</p>
        <h1 className="mt-3 text-[1.6rem] leading-tight text-[#173D32]">Administration</h1>
        <p className="mt-3 text-[0.88rem] leading-relaxed text-[#4A463C]">
          Only the organiser can run the daily draw and edit the campaign. Everyone else follows
          the results on the other pages.
        </p>
        <label className="label mt-6 block text-[#6E6A5E]" htmlFor="admin-password">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          autoComplete="current-password"
          className="field mt-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? (
          <p role="alert" className="mt-3 border-l-2 border-[#A33444] px-3 py-2 text-[0.85rem] text-[#7A1F2B]">
            {error}
          </p>
        ) : null}
        <button type="submit" className="btn btn-gold mt-6 w-full" disabled={busy || password.length === 0}>
          {busy ? "Checking…" : "Log in"}
        </button>
      </form>
    </section>
  );
}
