"use client";
import { useState } from "react";
import {
  Brain, CheckCircle2, Clock, TrendingUp, AlertCircle,
  Star, BookOpen, Code2, Award, Globe, Zap, BarChart3,
  FileText, Link2
} from "lucide-react";

const KNOWLEDGE_AREAS = [
  { name: "Data Structures & Algorithms", level: 82, status: "verified" },
  { name: "Object Oriented Programming", level: 75, status: "verified" },
  { name: "Database Management (SQL)", level: 68, status: "claimed" },
  { name: "Operating Systems", level: 60, status: "claimed" },
  { name: "Web Development", level: 88, status: "verified" },
  { name: "Machine Learning Basics", level: 45, status: "claimed" },
  { name: "Computer Networks", level: 55, status: "claimed" },
  { name: "Mathematics & Probability", level: 70, status: "verified" },
];

const TIMELINE = [
  { date: "Aug 2024", event: "GitHub connector synced — 320 contributions", type: "connector" },
  { date: "Jul 2024", event: "NPTEL Python Certificate uploaded & verified", type: "verified" },
  { date: "Jun 2024", event: "SY Semester 3 results added (CGPA 8.7)", type: "academic" },
  { date: "May 2024", event: "Hackathon finalist — MITAOE TechFest", type: "achievement" },
  { date: "Mar 2024", event: "Learning State initialised", type: "milestone" },
];

const FACTS = [
  { label: "Verified Facts", value: 12, color: "green" },
  { label: "Claimed Facts", value: 8, color: "orange" },
  { label: "Pending Review", value: 3, color: "blue" },
];

export default function LearningStatePage() {
  const [tab, setTab] = useState<"overview" | "knowledge" | "timeline" | "export">("overview");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Your Learning State</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            A living AI model of your academic profile — updated in real-time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-green-50 text-green-700 font-semibold px-3 py-1.5 rounded-full border border-green-200 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            Live
          </span>
          <button className="flex items-center gap-2 text-sm font-semibold text-gray-700 border border-gray-200 hover:border-indigo-300 hover:text-indigo-700 px-4 py-2 rounded-xl transition-all">
            <FileText className="w-4 h-4" /> Export State
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["overview", "knowledge", "timeline", "export"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 capitalize ${
              tab === t ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === "overview" && (
        <div className="space-y-5">
          {/* Score + Brain viz placeholder */}
          <div className="grid grid-cols-3 gap-5">
            <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">State Score</h3>
                <span className="text-xs text-gray-400">Updated 2h ago</span>
              </div>
              {/* Brain visualisation placeholder */}
              <div className="h-48 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-xl border border-indigo-100 flex flex-col items-center justify-center gap-3">
                <Brain className="w-16 h-16 text-indigo-300" strokeWidth={1} />
                <div className="text-center">
                  <div className="text-4xl font-bold text-indigo-600">84</div>
                  <div className="text-sm text-gray-500">out of 100</div>
                </div>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-medium">
                  🚀 3D Brain Visualisation coming soon
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {FACTS.map(({ label, value, color }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-200 p-4">
                  <div className={`text-2xl font-bold ${color === "green" ? "text-green-600" : color === "orange" ? "text-orange-500" : "text-blue-600"}`}>
                    {value}
                  </div>
                  <div className="text-sm text-gray-500 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Dimensions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4">Profile Dimensions</h3>
            <div className="grid grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: "Academic", score: 84, color: "indigo" },
                { icon: Code2, label: "Technical", score: 72, color: "blue" },
                { icon: Award, label: "Extra-curricular", score: 68, color: "violet" },
                { icon: Globe, label: "Language", score: 90, color: "green" },
              ].map(({ icon: Icon, label, score, color }) => (
                <div key={label} className="text-center">
                  <div className={`w-12 h-12 rounded-xl mx-auto flex items-center justify-center mb-2 ${
                    color === "indigo" ? "bg-indigo-50 text-indigo-600" :
                    color === "blue" ? "bg-blue-50 text-blue-600" :
                    color === "violet" ? "bg-violet-50 text-violet-600" :
                    "bg-green-50 text-green-600"
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="text-lg font-bold text-gray-900">{score}</div>
                  <div className="text-xs text-gray-500">{label}</div>
                  <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        color === "indigo" ? "bg-indigo-500" :
                        color === "blue" ? "bg-blue-500" :
                        color === "violet" ? "bg-violet-500" :
                        "bg-green-500"
                      }`}
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Knowledge Tab */}
      {tab === "knowledge" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">Knowledge Base</h3>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-green-600 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Verified
              </span>
              <span className="flex items-center gap-1.5 text-orange-500 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Claimed
              </span>
            </div>
          </div>
          <div className="space-y-4">
            {KNOWLEDGE_AREAS.map(({ name, level, status }) => (
              <div key={name} className="flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-800 truncate pr-2">{name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        status === "verified"
                          ? "bg-green-50 text-green-600"
                          : "bg-orange-50 text-orange-500"
                      }`}>
                        {status}
                      </span>
                      <span className="text-sm font-bold text-gray-900 w-8 text-right">{level}</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        status === "verified" ? "bg-indigo-500" : "bg-orange-400"
                      }`}
                      style={{ width: `${level}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline Tab */}
      {tab === "timeline" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-5">Learning State Timeline</h3>
          <div className="relative">
            <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-100" />
            <div className="space-y-5">
              {TIMELINE.map(({ date, event, type }) => (
                <div key={event} className="flex gap-4 relative">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                    type === "verified" ? "bg-green-100 text-green-600" :
                    type === "connector" ? "bg-blue-100 text-blue-600" :
                    type === "academic" ? "bg-indigo-100 text-indigo-600" :
                    type === "achievement" ? "bg-yellow-100 text-yellow-600" :
                    "bg-gray-100 text-gray-500"
                  }`}>
                    {type === "verified" ? <CheckCircle2 className="w-4 h-4" /> :
                     type === "connector" ? <Link2 className="w-4 h-4" /> :
                     type === "achievement" ? <Star className="w-4 h-4" /> :
                     type === "academic" ? <BookOpen className="w-4 h-4" /> :
                     <Zap className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 pt-1.5">
                    <p className="text-sm font-medium text-gray-800">{event}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Export Tab */}
      {tab === "export" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="font-bold text-gray-900 mb-2">Export Your Learning State</h3>
          <p className="text-sm text-gray-500 mb-6">
            Your full Learning State (raw data) is ~400–500 MB. A compressed, human-readable export is available immediately.
            The full export will be emailed to you.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Compressed Summary", desc: "JSON — shareable, AI-readable format", icon: BarChart3, btn: "Download Now" },
              { label: "Full Raw Export", desc: "Complete data — email delivery (~10 min)", icon: FileText, btn: "Request Export" },
            ].map(({ label, desc, icon: Icon, btn }) => (
              <div key={label} className="border border-gray-200 rounded-xl p-5">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h4 className="font-semibold text-gray-900 text-sm mb-1">{label}</h4>
                <p className="text-xs text-gray-400 mb-4">{desc}</p>
                <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors">
                  {btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
