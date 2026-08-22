"use client";
import { useState } from "react";
import {
  Cpu, Brain, FileText, Download, Zap, ChevronRight,
  BarChart3, Clock, CheckCircle2, Sliders, BookOpen,
  ExternalLink, ArrowRight
} from "lucide-react";

const RECENT_EXAMS = [
  { id: 1, title: "B.Tech CSE — Data Structures Mid-Sem", subject: "DSA", students: 120, marks: 50, generated: "Aug 18, 2024", status: "ready" },
  { id: 2, title: "SY CSE — DBMS Internal Assessment", subject: "DBMS", students: 118, marks: 30, generated: "Aug 15, 2024", status: "ready" },
  { id: 3, title: "TY IT — Operating Systems End-Sem", subject: "OS", students: 95, marks: 80, generated: "Aug 10, 2024", status: "review" },
];

const PIPELINE_STEPS = [
  { step: 1, label: "Select Subject & Batch", icon: BookOpen, desc: "Course objectives and student group are loaded from context documents" },
  { step: 2, label: "Configure Difficulty & Marks", icon: Sliders, desc: "Set total marks, difficulty distribution (easy/medium/hard) via soft constraints" },
  { step: 3, label: "AI Generates Questions", icon: Brain, desc: "LLM + Constraint Programming (CP-SAT) generates aligned, curated questions" },
  { step: 4, label: "Review & Edit", icon: FileText, desc: "Faculty can annotate, flag, and edit questions before finalising" },
  { step: 5, label: "Export (PDF / Word / Digital)", icon: Download, desc: "Anti-AI font rendering for digital exams; your institute template for physical papers" },
];

export default function ExamPage() {
  const [tab, setTab] = useState<"generate" | "history" | "pipeline">("generate");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const [config, setConfig] = useState({
    subject: "", batch: "", totalMarks: "50", easy: "30", medium: "50", hard: "20",
    language: "English", includeMedia: true,
  });

  const handleGenerate = () => {
    if (!config.subject) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2500);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Exam Generation</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            AI-powered, Learning State-aware, NEP-aligned exam generation
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="#"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Exam Scheduler
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: "generate", label: "⚡ Generate New Exam" },
          { key: "history", label: "📋 Generated Exams" },
          { key: "pipeline", label: "🔧 How It Works" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Generate Tab */}
      {tab === "generate" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          {/* Config Panel */}
          <div className="col-span-1 lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-500" /> Exam Configuration
            </h3>

            {[
              { key: "subject", label: "Subject / Module", placeholder: "e.g. Data Structures & Algorithms" },
              { key: "batch", label: "Student Batch / Group", placeholder: "e.g. B.Tech CSE SY-A (120 students)" },
              { key: "language", label: "Question Language", placeholder: "English / Marathi / Hindi" },
            ].map(({ key, label, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type="text"
                  value={config[key as keyof typeof config] as string}
                  onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Total Marks</label>
              <input
                type="number"
                value={config.totalMarks}
                onChange={(e) => setConfig((c) => ({ ...c, totalMarks: e.target.value }))}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Difficulty Distribution (%)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { key: "easy", label: "Easy", color: "green" },
                  { key: "medium", label: "Medium", color: "amber" },
                  { key: "hard", label: "Hard", color: "red" },
                ].map(({ key, label, color }) => (
                  <div key={key}>
                    <label className={`text-xs font-semibold ${color === "green" ? "text-green-600" : color === "amber" ? "text-amber-600" : "text-red-500"} block mb-1`}>
                      {label}
                    </label>
                    <input
                      type="number"
                      value={config[key as keyof typeof config] as string}
                      onChange={(e) => setConfig((c) => ({ ...c, [key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-center font-bold"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 py-2 border-t border-gray-100">
              <input
                type="checkbox"
                id="includeMedia"
                checked={config.includeMedia}
                onChange={(e) => setConfig((c) => ({ ...c, includeMedia: e.target.checked }))}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor="includeMedia" className="text-sm font-medium text-gray-700">
                Include visual cues / media in questions (improves comprehension)
              </label>
            </div>

            <button
              onClick={handleGenerate}
              disabled={generating || !config.subject}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating with AI…
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Generate Exam
                </>
              )}
            </button>
          </div>

          {/* Info + Preview */}
          <div className="col-span-1 lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-500" /> AI Pipeline
              </h4>
              <div className="space-y-2.5">
                {[
                  "Course objectives from Context Docs",
                  "Student Learning State (avg. of selected batch)",
                  "Language & difficulty preferences",
                  "CP-SAT constraints (marks sum, question count)",
                  "LLM generates contextual questions",
                  "Anti-AI font for digital exam output",
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {generated && (
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <h4 className="text-sm font-bold text-green-800">Exam Generated!</h4>
                </div>
                <p className="text-xs text-green-700 mb-4">
                  {config.subject || "Subject"} — {config.totalMarks} marks · 25 questions · {config.language}
                </p>
                <div className="flex flex-col gap-2">
                  {[
                    { label: "Download PDF", icon: Download },
                    { label: "Download Word", icon: FileText },
                    { label: "Preview Questions", icon: BarChart3 },
                  ].map(({ label, icon: Icon }) => (
                    <button
                      key={label}
                      className="flex items-center gap-2 text-sm font-semibold text-green-700 hover:text-green-900 hover:bg-green-100 px-3 py-2 rounded-lg transition-colors"
                    >
                      <Icon className="w-3.5 h-3.5" /> {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs text-indigo-700 font-medium">
                💡 <strong>Constraint Programming:</strong> Mark totals, question counts, and type distributions are guaranteed via CP-SAT. The LLM handles creative question generation — the maths is handled by constraints.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {tab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">Recently Generated Exams</span>
          </div>
          <div className="divide-y divide-gray-50">
            {RECENT_EXAMS.map(({ id, title, subject, students, marks, generated: gen, status }) => (
              <div key={id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Cpu className="w-5 h-5 text-indigo-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                  <p className="text-xs text-gray-400">{subject} · {students} students · {marks} marks · Generated {gen}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                  status === "ready" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                }`}>
                  {status === "ready" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                  {status}
                </span>
                <div className="flex gap-1">
                  <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 flex items-center gap-1">
                    <Download className="w-3 h-3" /> PDF
                  </button>
                  <button className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50">
                    Word
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline Tab */}
      {tab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-5">Exam Generation Pipeline</h3>
            <div className="space-y-4">
              {PIPELINE_STEPS.map(({ step, label, icon: Icon, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-sm">
                      {step}
                    </div>
                    {step < PIPELINE_STEPS.length && <div className="w-0.5 h-6 bg-indigo-200 mt-1" />}
                  </div>
                  <div className="pt-1.5 pb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-indigo-500" />
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                    </div>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">Anti-Cheat Architecture</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Digital exams use a specially rendered font derived from open-source noise-diffusion research — questions are human-readable but resistant to AI OCR models (including GPT-4o, Gemini Vision). Combined with standard proctoring (camera, voice detection), this provides robust multi-layer protection.
              </p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h4 className="font-bold text-gray-900 mb-3 text-sm">Physical Paper Generation</h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Upload an existing paper as a template. ExaGo extracts the design layout using Word's Document Object Model (DOM), applies your institute's fonts via Adobe Fonts API, and generates a print-ready PDF matching your institution's branding exactly.
              </p>
            </div>
            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs text-indigo-700">
                <strong>CP-SAT Constraints:</strong> Total marks always sum correctly (hard constraint). Difficulty distribution, question type mix are soft constraints — maximised while respecting hard constraints.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
