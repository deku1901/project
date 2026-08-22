"use client";
import {
  Brain, TrendingUp, BookOpen, Target, ArrowRight,
  CheckCircle2, Clock, Zap, Award, GitBranch, Share2,
  Code2, Globe
} from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "Learning State Score", value: "84 / 100", change: "+6 this week", icon: Brain, color: "indigo" },
  { label: "Verified Credentials", value: "12", change: "3 pending", icon: Award, color: "green" },
  { label: "Completed Goals", value: "8 / 15", change: "53% on track", icon: Target, color: "blue" },
  { label: "Streak", value: "14 days", change: "Personal best!", icon: Zap, color: "orange" },
];

const RECENT = [
  { title: "GitHub commit activity synced", time: "2h ago", type: "connector" },
  { title: "Python DSA module completed", time: "Yesterday", type: "academic" },
  { title: "Hackathon certificate uploaded", time: "2 days ago", type: "document" },
  { title: "Institute verified your marksheet", time: "3 days ago", type: "verified" },
];

const CONNECTORS = [
  { id: "github", label: "GitHub", icon: GitBranch, connected: true },
  { id: "linkedin", label: "LinkedIn", icon: Share2, connected: true },
  { id: "leetcode", label: "LeetCode", icon: Code2, connected: false },
  { id: "portfolio", label: "Portfolio", icon: Globe, connected: false },
];

const COLORMAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  green: "bg-green-50 text-green-600 border-green-100",
  blue: "bg-blue-50 text-blue-600 border-blue-100",
  orange: "bg-orange-50 text-orange-600 border-orange-100",
};

export default function StudentDashboardHome() {
  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm font-medium mb-1">Welcome back 👋</p>
        <h2 className="text-2xl font-bold mb-1">Good morning, Jayesh!</h2>
        <p className="text-indigo-100 text-sm max-w-lg">
          Your Learning State was last updated 2 hours ago. You have 3 goals due this week and 2 new activity suggestions.
        </p>
        <div className="flex gap-3 mt-4">
          <Link
            href="/student/dashboard/learning-state"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <Brain className="w-4 h-4" /> View Learning State
          </Link>
          <Link
            href="/student/dashboard/planning"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <Target className="w-4 h-4" /> My Goals
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border mb-3 ${COLORMAP[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            <div className="text-xs text-green-600 font-medium mt-1">{change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
            <button className="text-xs text-indigo-600 font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {RECENT.map(({ title, time, type }) => (
              <div key={title} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    type === "connector"
                      ? "bg-blue-50 text-blue-500"
                      : type === "academic"
                      ? "bg-indigo-50 text-indigo-500"
                      : type === "document"
                      ? "bg-orange-50 text-orange-500"
                      : "bg-green-50 text-green-500"
                  }`}
                >
                  {type === "verified" ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : type === "connector" ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <BookOpen className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{title}</p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Connectors status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Connectors</h3>
            <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
              {CONNECTORS.filter((c) => c.connected).length}/{CONNECTORS.length}
            </span>
          </div>
          <div className="space-y-2.5">
            {CONNECTORS.map(({ id, label, icon: Icon, connected }) => (
              <div key={id} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <span className="text-sm text-gray-700 flex-1">{label}</span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    connected
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-gray-400"
                  }`}
                >
                  {connected ? "Connected" : "Connect"}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link
              href="/student/dashboard/learning-state"
              className="text-xs text-indigo-600 font-medium flex items-center gap-1 hover:underline"
            >
              <TrendingUp className="w-3 h-3" /> View Learning State impact
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            href: "/student/dashboard/learning-state",
            icon: Brain,
            title: "Learning State",
            desc: "View your AI-powered academic profile",
            color: "indigo",
          },
          {
            href: "/student/dashboard/guru",
            icon: Zap,
            title: "Ask AI Guru",
            desc: "Get guidance, study plans, and advice",
            color: "violet",
          },
          {
            href: "/student/dashboard/activities",
            icon: BookOpen,
            title: "Activities",
            desc: "Explore hobby-based learning activities",
            color: "blue",
          },
        ].map(({ href, icon: Icon, title, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all group"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                color === "indigo"
                  ? "bg-indigo-50 text-indigo-600"
                  : color === "violet"
                  ? "bg-violet-50 text-violet-600"
                  : "bg-blue-50 text-blue-600"
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-gray-900 mb-1">{title}</h4>
            <p className="text-xs text-gray-500">{desc}</p>
            <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 mt-3 group-hover:gap-2 transition-all">
              Open <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
