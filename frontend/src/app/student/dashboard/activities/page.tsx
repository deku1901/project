"use client";
import { useState } from "react";
import { Gamepad2, Brain, Music, Puzzle, BookOpen, Star, Clock, ArrowRight, Zap } from "lucide-react";

type Tab = "suggested" | "mind-games" | "learning";

const ACTIVITIES = [
  {
    id: 1, tab: "suggested",
    title: "Chess Puzzles", category: "Strategy",
    icon: Puzzle, color: "indigo",
    desc: "Recommended based on your chess hobby. Tactical puzzles to sharpen pattern recognition — directly benefits your DSA problem solving.",
    time: "15–20 min", impact: "Logic & Pattern Recognition",
    link: "https://chess.com/puzzles",
  },
  {
    id: 2, tab: "suggested",
    title: "Competitive Coding Sprint",
    category: "Technical",
    icon: Zap, color: "blue",
    desc: "A 30-min LeetCode sprint tailored to your weak areas — arrays and graph problems.",
    time: "30 min", impact: "DSA & Problem Solving",
    link: "https://leetcode.com",
  },
  {
    id: 3, tab: "suggested",
    title: "Open Source Contribution",
    category: "Technical",
    icon: BookOpen, color: "green",
    desc: "Find a good-first-issue on GitHub in a Python repo. Contributes directly to your Learning State GitHub score.",
    time: "1–2 hours", impact: "GitHub Connector + Technical Score",
    link: "https://goodfirstissue.dev",
  },
  {
    id: 4, tab: "mind-games",
    title: "Sudoku Blitz",
    category: "Mind Game",
    icon: Brain, color: "violet",
    desc: "Fast-paced Sudoku to train numerical logic. Not brain rot — builds concentration.",
    time: "10 min", impact: "Cognitive Speed",
    link: "#",
  },
  {
    id: 5, tab: "mind-games",
    title: "Word Association Game",
    category: "Mind Game",
    icon: Star, color: "orange",
    desc: "Build vocabulary across technical and general domains. Good for language-heavy exams.",
    time: "5–10 min", impact: "Vocabulary + Language State",
    link: "#",
  },
  {
    id: 6, tab: "mind-games",
    title: "Memory Matrix",
    category: "Mind Game",
    icon: Puzzle, color: "blue",
    desc: "Short-term memory training. Scientifically linked to better exam recall.",
    time: "5 min", impact: "Working Memory",
    link: "#",
  },
  {
    id: 7, tab: "learning",
    title: "MIT OpenCourseWare — Algorithms",
    category: "Academic",
    icon: BookOpen, color: "indigo",
    desc: "Free MIT lecture on algorithm design. Aligns with your DSA goal and 82% score.",
    time: "45 min", impact: "DSA Knowledge Base",
    link: "https://ocw.mit.edu",
  },
  {
    id: 8, tab: "learning",
    title: "Kaggle Intro to ML Course",
    category: "Academic",
    icon: Brain, color: "green",
    desc: "Hands-on ML basics. Directly addresses your weakest area (45%) — structured and free.",
    time: "2–3 hours", impact: "ML Knowledge Base +20",
    link: "https://kaggle.com/learn",
  },
];

const COLORMAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  green: "bg-green-50 text-green-600 border-green-100",
  violet: "bg-violet-50 text-violet-600 border-violet-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
};

export default function ActivitiesPage() {
  const [tab, setTab] = useState<Tab>("suggested");

  const filtered = ACTIVITIES.filter((a) => a.tab === tab);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Activities</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Curated based on your Learning State — not brain rot, just growth 🌱
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 bg-gray-100 p-1 rounded-xl w-fit max-w-full">
        {([
          { key: "suggested", label: "🎯 Suggested For You" },
          { key: "mind-games", label: "🧩 Mind Games" },
          { key: "learning", label: "📚 Learning Resources" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Info Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
        <Gamepad2 className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-amber-800 font-medium leading-relaxed">
          Every activity you complete contributes to your Learning State. Completing 3+ activities this week unlocks a badge.
        </p>
      </div>

      {/* Activity Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(({ id, title, category, icon: Icon, color, desc, time, impact, link }) => (
          <div key={id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all group flex flex-col">
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${COLORMAP[color]}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                {category}
              </span>
            </div>

            <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-xs text-gray-500 leading-relaxed flex-1">{desc}</p>

            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" /> {time}
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium flex-1">
                <Star className="w-3.5 h-3.5" /> {impact}
              </div>
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 group-hover:gap-1.5 transition-all"
              >
                Start <ArrowRight className="w-3 h-3" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <Music className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No activities in this category yet.</p>
        </div>
      )}
    </div>
  );
}
