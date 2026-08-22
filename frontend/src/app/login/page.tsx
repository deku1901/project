"use client";
import { useState, useEffect } from "react";
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
  const [exaId, setExaId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Morning Energy? ⚡");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Midday Focus? 🧠");
    } else if (hour >= 17 && hour < 22) {
      setGreeting("Evening Drive? 🚀");
    } else {
      setGreeting("Moonlight Chill... 🌌");
    }
  }, []);

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
    <div className="min-h-screen bg-gray-50/50 flex flex-col lg:flex-row font-sans">
      {/* Left Panel — Branding & Assessment Lifecycle */}
      <div className="w-full lg:w-[45%] bg-gradient-to-br from-indigo-900 via-indigo-800 to-violet-950 flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden shrink-0">
        
        {/* Soft background shape glows */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[120%] h-[120%] bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.25),transparent_60%)] blur-3xl" />
          <div className="absolute -bottom-1/4 -left-1/4 w-[120%] h-[120%] bg-[radial-gradient(circle_at_bottom_left,rgba(139,92,246,0.25),transparent_60%)] blur-3xl" />
          <div className="absolute top-1/4 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-10 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2.5s" }} />
        </div>

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3 mb-8 lg:mb-0">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/35">
            <BookOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <span className="text-white text-xl font-extrabold tracking-tight">Exagoal</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 my-auto py-6">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-[11px] font-bold px-3 py-1.5 rounded-full mb-6 backdrop-blur-md border border-white/15">
            <Zap className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            NEP 2020 Aligned Platform
          </div>
          
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight mb-4 tracking-tight">
            Empower Every Learner with <span className="text-indigo-300">Intelligent</span>, Adaptive Exams
          </h1>
          
          <p className="text-indigo-100/90 text-sm sm:text-base leading-relaxed max-w-xl mb-6 font-normal">
            Deliver personalized, secure, and adaptive assessments that measure real understanding—not just memorization. Built to align with NEP 2020 and designed for modern learners.
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2 mb-8">
            {[
              { icon: GraduationCap, label: "AI-driven assessments tailored to each student" },
              { icon: Shield, label: "Advanced proctoring for fair and secure exams" },
              { icon: Zap, label: "Continuously evolving learning insights" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 bg-white/5 border border-white/10 text-indigo-100 text-xs font-semibold px-3.5 py-2.5 rounded-xl backdrop-blur-sm shadow-sm"
              >
                <Icon className="w-3.5 h-3.5 text-indigo-300" />
                {label}
              </div>
            ))}
          </div>

          {/* Assessment Lifecycle Section */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-inner mt-4 hidden sm:block">
            <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-300" /> Assessment Lifecycle
            </h3>
            <div className="relative flex flex-col gap-3">
              {[
                { step: "Capture", desc: "Verified learner evidence" },
                { step: "Understand", desc: "Learner state" },
                { step: "Define", desc: "Institutional objectives" },
                { step: "Create", desc: "Assessment generation" },
                { step: "Validate", desc: "Constraints + quality" },
                { step: "Review", desc: "Faculty approval" },
                { step: "Deliver", desc: "Digital / Physical" },
              ].map(({ step, desc }, idx, arr) => (
                <div key={step} className="flex items-start gap-3 relative group">
                  {idx < arr.length - 1 && (
                    <div className="absolute left-3 top-6 bottom-0 w-[1px] bg-indigo-500/20 -mb-4" />
                  )}
                  <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center text-[10px] font-bold text-white shrink-0 group-hover:border-indigo-400 group-hover:bg-indigo-500/40 transition-all shadow-[0_0_8px_rgba(99,102,241,0.2)]">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                      <span className="text-xs font-extrabold text-white">{step}</span>
                      <span className="text-[10px] text-indigo-200/70 font-medium truncate">{desc}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 mt-8 hidden sm:grid">
          {[
            { value: "20+", label: "Connectors" },
            { value: "NEP 2020", label: "Aligned" },
            { value: "Secure", label: "& Transparent" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">{value}</div>
              <div className="text-indigo-200/80 text-xs font-semibold mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 md:p-16">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shadow-indigo-600/30">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 text-lg font-black tracking-tight">Exagoal</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2 tracking-tight transition-all duration-300">
            {greeting}
          </h2>
          
          <p className="text-gray-500 text-sm mb-8 leading-relaxed font-medium">
            Sign in to continue your personalized learning experience
          </p>

          {/* Portal Toggle */}
          <div className="flex bg-gray-100/80 rounded-2xl p-1.5 mb-8 border border-gray-200/30">
            {(["student", "institute"] as Portal[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPortal(p)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all duration-300 ${
                  portal === p
                    ? "bg-white text-indigo-600 shadow-md ring-1 ring-indigo-500/5"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/40"
                }`}
              >
                <span>{p === "student" ? "🎓" : "🏫"}</span>
                {p === "student" ? "Student" : "Institute"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                {portal === "student" ? "Student ExaID" : "Institute ExaID"}
              </label>
              <input
                type="text"
                required
                value={exaId}
                onChange={(e) => setExaId(e.target.value)}
                placeholder={portal === "student" ? "EXA-XXXXXX-ST" : "EXA-XXXXXX-INST"}
                className="w-full px-4 py-3.5 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold transition-colors">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 pr-12 border border-gray-200 rounded-2xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-2xl transition-all duration-300 mt-6 disabled:opacity-60 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/35 hover:-translate-y-0.5 active:translate-y-0 active:shadow-indigo-600/20"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Start Learning <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Logins & APAAR ID Integration */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Sign in using</p>
            <div className="flex justify-center gap-3">
              {/* Google */}
              <button
                type="button"
                aria-label="Sign in with Google"
                className="flex items-center justify-center w-12 h-12 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95 group"
              >
                <svg className="w-5 h-5 text-gray-400 group-hover:text-gray-700 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.6 1.7l2.4-2.4C17.3 1.5 14.9 1 12.24 1c-5.5 0-10 4.5-10 10s4.5 10 10 10c5.8 0 9.8-4.1 9.8-9.9 0-.6-.1-1.2-.2-1.7h-9.6z" />
                </svg>
              </button>

              {/* Microsoft */}
              <button
                type="button"
                aria-label="Sign in with Microsoft"
                className="flex items-center justify-center w-12 h-12 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 hover:scale-105 active:scale-95 group"
              >
                <svg className="w-4 h-4 text-gray-400 group-hover:text-gray-700 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z" />
                </svg>
              </button>

              {/* APAAR ID */}
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 rounded-2xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-gray-500 hover:text-indigo-600 transition-all duration-300 hover:scale-105 active:scale-95 group shadow-sm"
              >
                <Shield className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                <span className="text-xs font-bold tracking-tight">APAAR ID</span>
              </button>
            </div>
            
            <p className="text-[11px] text-gray-400 mt-5 leading-normal max-w-[280px] mx-auto font-medium">
              Registered via an academic institute? Contact your admin for your ExaID details.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-gray-150" />
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-gray-150" />
          </div>

          {/* Secondary CTA */}
          <button
            onClick={handleGetStarted}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-gray-700 hover:text-indigo-700 font-bold py-3.5 rounded-2xl transition-all duration-300 text-sm shadow-sm"
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

          <p className="text-center text-[10px] text-gray-400 mt-8 font-semibold tracking-wider uppercase">
            © 2026 Exagoal · NEP 2020 Aligned · Built for Bharat
          </p>
        </div>
      </div>
    </div>
  );
}

