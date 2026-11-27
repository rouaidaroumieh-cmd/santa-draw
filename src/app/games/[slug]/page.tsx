"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { PageShell } from "@/components/Chrome";
import ChristmasFactsGame from "@/components/office-games/ChristmasFactsGame";
import GuessMovieGame from "@/components/office-games/GuessMovieGame";
import HoroscopeGame from "@/components/office-games/HoroscopeGame";
import SantaSackGame from "@/components/office-games/SantaSackGame";
import SpinWheelGame from "@/components/office-games/SpinWheelGame";
import { getOfficeGame, isOfficeGameSlug } from "@/lib/office-games/catalog";

export default function OfficeGamePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  if (!isOfficeGameSlug(slug) || !getOfficeGame(slug)) notFound();

  return (
    <PageShell current="games">
      <section className="mx-auto max-w-[860px] px-5 py-12 sm:py-16">
        {slug === "christmas-facts" ? <ChristmasFactsGame /> : null}
        {slug === "horoscope" ? <HoroscopeGame /> : null}
        {slug === "guess-movie" ? <GuessMovieGame /> : null}
        {slug === "santa-sack" ? <SantaSackGame /> : null}
        {slug === "spin-wheel" ? <SpinWheelGame /> : null}
      </section>
    </PageShell>
  );
}
