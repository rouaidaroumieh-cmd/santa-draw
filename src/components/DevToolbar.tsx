"use client";

import { useState } from "react";
import { formatDateShort, getCalendarDays } from "@/lib/dates";
import {
  devRevealBefore,
  devUndoDraw,
  resetCampaign,
  setSettings,
  useCampaign,
  useIsAdmin,
} from "@/lib/store";

const REAL_DATE = "real";

const smallButton =
  "label border border-[rgba(214,181,109,0.35)] px-2.5 py-1.5 text-[0.55rem] text-gold transition-colors hover:bg-[rgba(214,181,109,0.14)] disabled:opacity-40";

/** Floating test panel. Only rendered when `DEV_MODE` is on (see Chrome.tsx). */
export default function DevToolbar() {
  const state = useCampaign();
  const isAdmin = useIsAdmin();
  const [open, setOpen] = useState(false);

  if (!state) return null;

  const { dateMode, manualDate } = state.settings;
  const today = state.today;
  const selected = dateMode === "manual" && manualDate ? manualDate : REAL_DATE;

  const onDateChange = (value: string) => {
    if (value === REAL_DATE) void setSettings({ dateMode: "auto", manualDate: null });
    else void setSettings({ dateMode: "manual", manualDate: value });
  };

  const onReset = () => {
    if (window.confirm("Reset the DEV sandbox? (the real campaign data is not affected)")) {
      void resetCampaign();
    }
  };

  return (
    <div className="fixed bottom-3 left-3 z-50 max-w-[calc(100vw-1.5rem)] border border-[rgba(214,181,109,0.5)] bg-[rgba(9,30,24,0.96)] px-4 py-3 shadow-lg">
      <div className="flex items-center justify-between gap-4">
        <p className="label text-[0.6rem] text-gold">Dev mode · sandbox data</p>
        <button type="button" className="label text-[0.55rem] text-ivory/60" onClick={() => setOpen(!open)}>
          {open ? "Hide" : "Show"}
        </button>
      </div>

      {open ? (
        <div className="mt-3 flex flex-col gap-3">
          <p className="max-w-[300px] text-[0.72rem] leading-relaxed text-ivory/60">
            Isolated from the real campaign. Today = {today}.
          </p>
          {isAdmin ? (
            <>
              <label className="flex items-center gap-2 text-[0.72rem] text-ivory/80">
                Date
                <select
                  className="field w-[170px] py-1 text-[0.8rem]"
                  value={selected}
                  onChange={(e) => onDateChange(e.target.value)}
                >
                  <option value={REAL_DATE}>Real date</option>
                  {getCalendarDays().map((d) => (
                    <option key={d.date} value={d.date}>
                      {formatDateShort(d.date)}
                      {d.isWeekend ? " (weekend)" : ""}
                      {state.results[d.date] ? " ✓" : ""}
                    </option>
                  ))}
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={smallButton}
                  disabled={!state.results[today]}
                  onClick={() => void devUndoDraw(today)}
                >
                  Undo this day&apos;s draw
                </button>
                <button type="button" className={smallButton} onClick={() => void devRevealBefore(today)}>
                  Fill previous days
                </button>
                <button type="button" className={smallButton} onClick={onReset}>
                  Reset sandbox
                </button>
              </div>
            </>
          ) : (
            <p className="max-w-[300px] text-[0.72rem] leading-relaxed text-ivory/80">
              Log in on the Admin page to use the dev tools.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}
