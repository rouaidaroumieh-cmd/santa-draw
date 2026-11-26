"use client";

import { useState } from "react";
import { useLang, useT } from "@/lib/language";

interface Question {
  question: string;
  options: string[];
  answer: number;
}

const QUESTIONS: Question[] = [
  {
    question: "Which reindeer has a famously red nose?",
    options: ["Dasher", "Rudolph", "Comet", "Blitzen"],
    answer: 1,
  },
  {
    question: "Which plant with red leaves is a Christmas classic?",
    options: ["Holly", "Mistletoe", "Poinsettia", "Ivy"],
    answer: 2,
  },
  {
    question: "What is the traditional Italian Christmas bread?",
    options: ["Stollen", "Panettone", "Bûche", "Kulich"],
    answer: 1,
  },
  {
    question: "How many doors does a traditional Advent calendar have?",
    options: ["12", "20", "24", "31"],
    answer: 2,
  },
  {
    question: "How many reindeer pull Santa's sleigh in the classic poem?",
    options: ["6", "8", "9", "12"],
    answer: 1,
  },
];

const QUESTIONS_FR: Question[] = [
  {
    question: "Quel renne a un nez rouge célèbre ?",
    options: ["Dasher", "Rudolph", "Comet", "Blitzen"],
    answer: 1,
  },
  {
    question: "Quelle plante aux feuilles rouges est un classique de Noël ?",
    options: ["Houx", "Gui", "Poinsettia", "Lierre"],
    answer: 2,
  },
  {
    question: "Quel est le pain de Noël traditionnel italien ?",
    options: ["Stollen", "Panettone", "Bûche", "Kulich"],
    answer: 1,
  },
  {
    question: "Combien de portes compte un calendrier de l'Avent traditionnel ?",
    options: ["12", "20", "24", "31"],
    answer: 2,
  },
  {
    question: "Combien de rennes tirent le traîneau du Père Noël dans le poème classique ?",
    options: ["6", "8", "9", "12"],
    answer: 1,
  },
];

const BEST_KEY = "santa-quiz-best";

/** A five-question Christmas quiz. The best score stays in this browser. */
export default function Quiz() {
  const lang = useLang();
  const t = useT();
  const questions = lang === "fr" ? QUESTIONS_FR : QUESTIONS;
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [best, setBest] = useState<number | null>(null);

  const current = questions[index];

  const choose = (option: number) => {
    if (picked !== null) return;
    setPicked(option);
    if (option === current.answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (index + 1 < questions.length) {
      setIndex((i) => i + 1);
      setPicked(null);
      return;
    }
    const previous = Number(localStorage.getItem(BEST_KEY) ?? 0);
    const finalScore = score;
    if (finalScore > previous) localStorage.setItem(BEST_KEY, String(finalScore));
    setBest(Math.max(previous, finalScore));
    setFinished(true);
  };

  const restart = () => {
    setIndex(0);
    setPicked(null);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="paper gold-frame mx-auto max-w-[720px] px-6 py-10 text-center" style={{ borderRadius: 2 }}>
        <p className="font-display text-[1.6rem] italic text-[#173D32]">
          {t("You scored {score} out of {total}!", { score, total: questions.length })}
        </p>
        <p className="label mt-3 text-[#6E6A5E]">{t("Best score: {best}", { best: best ?? 0 })}</p>
        <button type="button" className="btn btn-dark mt-7" onClick={restart}>
          {t("Play again")}
        </button>
      </div>
    );
  }

  return (
    <div className="paper gold-frame mx-auto max-w-[720px] px-6 py-8 sm:px-8" style={{ borderRadius: 2 }}>
      <p className="label text-[#B08F4C]">
        {t("Question {number} of {total}", { number: index + 1, total: questions.length })}
      </p>
      <h3 className="mt-3 text-[1.5rem] leading-snug text-[#173D32]">{current.question}</h3>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {current.options.map((option, i) => {
          const isAnswer = picked !== null && i === current.answer;
          const isWrongPick = picked === i && i !== current.answer;
          return (
            <button
              key={option}
              type="button"
              onClick={() => choose(i)}
              disabled={picked !== null}
              className={`border px-4 py-3 text-left text-[0.95rem] transition-colors ${
                isAnswer
                  ? "border-[#245C46] bg-[rgba(36,92,70,0.18)] text-[#173D32]"
                  : isWrongPick
                    ? "border-[#7A1F2B] bg-[rgba(122,31,43,0.12)] text-[#7A1F2B]"
                    : "border-[rgba(23,61,50,0.25)] text-[#173D32] hover:border-[#B08F4C]"
              }`}
              style={{ borderRadius: 2 }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {picked !== null ? (
        <div className="mt-7 flex items-center justify-between gap-4">
          <p className="text-[0.9rem] text-[#3D3A30]">
            {picked === current.answer
              ? t("Correct!")
              : t("Not quite, the answer is {answer}.", { answer: current.options[current.answer] })}
          </p>
          <button type="button" className="btn btn-dark" onClick={next}>
            {index + 1 < questions.length ? t("Next") : t("See my score")}
          </button>
        </div>
      ) : null}
    </div>
  );
}
