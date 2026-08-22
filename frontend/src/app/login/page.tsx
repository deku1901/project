"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  BookOpen,
  Zap,
  Shield,
} from "lucide-react";

type Portal = "student" | "institute";

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      if (portal === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/institute/dashboard");
      }
    }, 1000);
  };

  const handleGetStarted = () => {
    if (portal === "student") router.push("/student/onboarding");
    else router.push("/institute/onboarding");
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Panel — Branding */}
      <div className="hidden lg:flex w-[45%] bg-indigo-600 flex-col justify-between p-12 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-white rounded-full translate-y-24 -translate-x-24" />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-white text-xl font-bold tracking-tight">ExaGo</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 text-white text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <Zap className="w-3 h-3" />
            NEP 2020 Aligned Platform
          </div>
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Intelligent Exams,<br />
            Built for <span className="text-indigo-200">Every</span> Learner
          </h1>
          <p className="text-indigo-100 text-base leading-relaxed max-w-sm">
            ExaGo uses AI and a living Learning State to curate, validate, and
            deliver exams that actually reflect who your students are — not just
            what they scored last semester.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mt-8">
            {[
              { icon: GraduationCap, label: "Personalised Assessment" },
              { icon: Shield, label: "Anti-Cheat Engine" },
              { icon: Zap, label: "Adaptive AI" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-white/15 text-white text-xs font-medium px-3 py-2 rounded-lg"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/20 pt-8">
          {[
            { value: "20+", label: "Connectors" },
            { value: "NEP", label: "Compliant" },
            { value: "100%", label: "Open Source" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-white">{value}</div>
              <div className="text-indigo-200 text-xs">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 text-lg font-bold">ExaGo</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Welcome back</h2>
          <p className="text-gray-500 text-sm mb-8">Sign in to your account to continue</p>

          {/* Portal Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-1 mb-8">
            {(["student", "institute"] as Portal[]).map((p) => (
              <button
                key={p}
                onClick={() => setPortal(p)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  portal === p
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "student" ? (
                  <GraduationCap className="w-4 h-4" />
                ) : (
                  <Building2 className="w-4 h-4" />
                )}
                {p === "student" ? "Student" : "Institute"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {portal === "student" ? "Student Email" : "Institute Admin Email"}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={portal === "student" ? "you@college.edu" : "admin@institute.edu"}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <div className="flex justify-end mt-1.5">
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 mt-2 disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-xs text-gray-400 font-medium">OR</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Register */}
          <button
            onClick={handleGetStarted}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700 font-semibold py-3 rounded-xl transition-all duration-200 text-sm"
          >
            {portal === "student" ? (
              <>
                <GraduationCap className="w-4 h-4" />
                Create Student Account
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                Register Your Institute
              </>
            )}
          </button>

          <p className="text-center text-xs text-gray-400 mt-8">
            © 2026 ExaGo · NEP 2020 Aligned · Built for Bharat
          </p>
        </div>
      </div>
    </div>
  );
}
