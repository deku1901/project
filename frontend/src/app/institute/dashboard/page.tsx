import {
  GraduationCap, Users, CheckCircle2, AlertCircle, Clock,
  TrendingUp, FileText, Cpu, ArrowRight, Database, Zap,
  SlidersHorizontal
} from "lucide-react";
import Link from "next/link";

const STATS = [
  { label: "Total Students", value: "1,248", change: "+12 this week", icon: GraduationCap, color: "indigo" },
  { label: "Verified Data Points", value: "8,432", change: "92% accuracy", icon: CheckCircle2, color: "green" },
  { label: "Pending Verifications", value: "34", change: "Action needed", icon: AlertCircle, color: "amber" },
  { label: "Active Teachers", value: "86", change: "Across 24 subjects", icon: Users, color: "blue" },
];

const RECENT_ACTIVITY = [
  { text: "Jayesh Patil submitted Learning State profile", time: "2h ago", type: "student" },
  { text: "Prof. Sharma uploaded DSA course objectives", time: "3h ago", type: "doc" },
  { text: "14 marksheets pending verification", time: "4h ago", type: "verify" },
  { text: "Batch CS-SY-A: Input window opened", time: "Yesterday", type: "access" },
  { text: "ERP sync completed — 120 students imported", time: "Yesterday", type: "erp" },
];

const COLORMAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  green: "bg-green-50 text-green-600",
  amber: "bg-amber-50 text-amber-600",
  blue: "bg-blue-50 text-blue-600",
};

export default function InstituteDashboardHome() {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-2xl p-6 text-white">
        <p className="text-indigo-200 text-sm font-medium mb-1">Institute Dashboard</p>
        <h2 className="text-2xl font-bold mb-1">Welcome, Dr. Sharma</h2>
        <p className="text-indigo-100 text-sm max-w-lg">
          34 student data points are pending verification. 3 exam generation requests are queued.
        </p>
        <div className="flex flex-wrap gap-3 mt-4">
          <Link
            href="/institute/dashboard/control-hub"
            className="flex items-center gap-2 bg-white text-indigo-700 hover:bg-indigo-50 text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-sm"
          >
            <SlidersHorizontal className="w-4 h-4 text-indigo-600" /> Control Hub (No-Code Config)
          </Link>
          <Link
            href="/institute/dashboard/exam"
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <Cpu className="w-4 h-4" /> Generate Exam
          </Link>
          <Link
            href="/institute/dashboard/students"
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white text-sm font-medium px-4 py-2 rounded-xl transition-all"
          >
            <CheckCircle2 className="w-4 h-4" /> Verifications
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(({ label, value, change, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${COLORMAP[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-gray-900">{value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{label}</div>
            <div className="text-xs text-gray-400 font-medium mt-1">{change}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
            <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="space-y-3">
            {RECENT_ACTIVITY.map(({ text, time, type }) => (
              <div key={text} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    type === "student" ? "bg-indigo-50 text-indigo-500" :
                    type === "doc" ? "bg-blue-50 text-blue-500" :
                    type === "verify" ? "bg-amber-50 text-amber-500" :
                    type === "erp" ? "bg-green-50 text-green-500" :
                    "bg-gray-100 text-gray-400"
                  }`}
                >
                  {type === "student" ? <GraduationCap className="w-4 h-4" /> :
                   type === "doc" ? <FileText className="w-4 h-4" /> :
                   type === "verify" ? <AlertCircle className="w-4 h-4" /> :
                   type === "erp" ? <Database className="w-4 h-4" /> :
                   <Zap className="w-4 h-4" />}
                </div>
                <span className="text-sm text-gray-700 flex-1">{text}</span>
                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" /> {time}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: "Control Hub (No-Code Blueprint)", href: "/institute/dashboard/control-hub", icon: SlidersHorizontal },
                { label: "Generate New Exam", href: "/institute/dashboard/exam", icon: Cpu },
                { label: "Upload Course Document", href: "/institute/dashboard/documents", icon: FileText },
                { label: "Bulk Import Students", href: "/institute/dashboard/students", icon: GraduationCap },
                { label: "Add Teacher", href: "/institute/dashboard/teachers", icon: Users },
              ].map(({ label, href, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-all group"
                >
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                  {label}
                  <ArrowRight className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Learning State Health
            </h3>
            <div className="space-y-2.5">
              {[
                { label: "Avg State Score", value: "72 / 100" },
                { label: "Fully Onboarded", value: "1,140 students" },
                { label: "Connector Avg", value: "4.2 per student" },
                { label: "Data Coverage", value: "91%" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-gray-400">{label}</span>
                  <span className="font-semibold text-gray-700">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
