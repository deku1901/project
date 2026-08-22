"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  GraduationCap,
  Building2,
  Eye,
  EyeOff,
  ArrowRight,
  Zap,
} from "lucide-react";

type Portal = "student" | "institute";

const HEADLINE_ROTATION = [
  {
    line1: "Curated for Learners,",
    line2: "Aligned for Institutions.",
  },
  {
    line1: "Validated for Learners,",
    line2: "Standardized for Institutions.",
  },
  {
    line1: "Transparent for Learners,",
    line2: "Accountable for Institutions.",
  },
];

const USPS = [
  {
    title: "Dynamic Learner State",
    detail: "Academic + extracurricular learning profile that continuously evolves.",
  },
  {
    title: "End-to-End Exam Pipeline",
    detail: "From course objectives to AI-assisted questions to final institutional PDF.",
  },
  {
    title: "Multi-Source Intelligence",
    detail: "Connects ERP, LinkedIn, social, and other learner data sources.",
  },
  {
    title: "Claim-to-Verified Data",
    detail: "Separates student claims from institution/mentor-verified achievements.",
  },
  {
    title: "Institution-Ready Infrastructure",
    detail: "Complete dashboards, workflows, tracking, integrations, and deployment for institutes.",
  },
  {
    title: "Intelligent Exam Curation",
    detail: "Uses the learner state + verified data to personalize assessment.",
  },
];

const LIFECYCLE_STEPS = [
  {
    step: "1",
    name: "Capture",
    sub: "Verified evidence",
    detail: "Ingests verified coursework, code, assignments, and test outcomes across courses.",
  },
  {
    step: "2",
    name: "Understand",
    sub: "Learner state",
    detail: "Builds dynamic cognitive profiles, tracking understanding depth and prerequisite mastery.",
  },
  {
    step: "3",
    name: "Define",
    sub: "Objectives",
    detail: "Maps assessment criteria, curriculum standards, and NEP 2020 competency frameworks.",
  },
  {
    step: "4",
    name: "Create",
    sub: "AI Generation",
    detail: "Generates contextual, multi-tier AI questions & verified answer keys.",
  },
  {
    step: "5",
    name: "Validate",
    sub: "Quality & rules",
    detail: "Verifies difficulty curves, anti-bias constraints, and curriculum compliance.",
  },
  {
    step: "6",
    name: "Review",
    sub: "Faculty approval",
    detail: "Enables faculty oversight, collaborative moderation, and instant approvals.",
  },
  {
    step: "7",
    name: "Deliver",
    sub: "Digital / Physical",
    detail: "Secure omnichannel deployment across proctored digital exams or OMR.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [portal, setPortal] = useState<Portal>("student");
  const [exaId, setExaId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("Welcome Back");

  // Mouse position for subtle parallax floating shapes
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Typewriter Animation State
  const [headlineIndex, setHeadlineIndex] = useState(0);
  const [typedLine1, setTypedLine1] = useState(HEADLINE_ROTATION[0].line1);
  const [typedLine2, setTypedLine2] = useState(HEADLINE_ROTATION[0].line2);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Morning Energy");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Midday Focus");
    } else if (hour >= 17 && hour < 22) {
      setGreeting("Evening Drive");
    } else {
      setGreeting("Moonlight Flow");
    }
  }, []);

  // Typewriter effect loop
  useEffect(() => {
    const currentSet = HEADLINE_ROTATION[headlineIndex];
    const full1 = currentSet.line1;
    const full2 = currentSet.line2;

    let char1 = 0;
    let char2 = 0;
    setTypedLine1("");
    setTypedLine2("");

    const typeTimer = setInterval(() => {
      if (char1 < full1.length) {
        char1++;
        setTypedLine1(full1.slice(0, char1));
      } else if (char2 < full2.length) {
        char2++;
        setTypedLine2(full2.slice(0, char2));
      } else {
        clearInterval(typeTimer);

        // Pause for 12 seconds before transitioning to next set
        pauseTimer = setTimeout(() => {
          let erase2 = full2.length;
          const eraseTimer = setInterval(() => {
            if (erase2 > 0) {
              erase2 -= 3;
              setTypedLine2(full2.slice(0, Math.max(0, erase2)));
            } else {
              clearInterval(eraseTimer);
              setHeadlineIndex((prev) => (prev + 1) % HEADLINE_ROTATION.length);
            }
          }, 25);
        }, 12000);
      }
    }, 40);

    let pauseTimer: NodeJS.Timeout;

    return () => {
      clearInterval(typeTimer);
      clearTimeout(pauseTimer);
    };
  }, [headlineIndex]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 24;
    setMousePos({ x, y });
  };

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
    <div className="min-h-screen lg:h-screen lg:max-h-screen lg:overflow-hidden bg-slate-50 flex flex-col lg:flex-row font-poppins">

      {/* Left Panel — Branding, Typewriter Headline, 6 USPs & Assessment Lifecycle */}
      <div
        onMouseMove={handleMouseMove}
        className="w-full lg:w-[50%] xl:w-[48%] bg-gradient-to-br from-[#1e1b4b] via-[#2e1065] to-[#1e1b4b] flex flex-col justify-start p-6 lg:p-7 xl:p-8 relative overflow-hidden shrink-0 space-y-3.5"
      >

        {/* Ambient Animated Background Glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="absolute -bottom-24 -left-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDuration: "6s" }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px] opacity-40" />
        </div>

        {/* Interactive Floating Glassmorphism Geometric Shapes */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none transition-transform duration-500 ease-out z-0"
          style={{
            transform: `translate3d(${mousePos.x}px, ${mousePos.y}px, 0)`,
          }}
        >
          {/* Glass Cube/Card */}
          <div
            className="absolute top-12 right-12 w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/20 backdrop-blur-md shadow-xl rotate-12 animate-pulse"
            style={{ animationDuration: "8s" }}
          />
          {/* Glass Ring */}
          <div className="absolute bottom-28 left-6 w-24 h-24 rounded-full border border-indigo-400/20 bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 backdrop-blur-md" />
          {/* Glass Diamond */}
          <div className="absolute top-1/3 right-1/4 w-12 h-12 rounded-xl bg-white/[0.03] border border-white/15 backdrop-blur-sm rotate-45" />
          {/* Subtle Ambient Pill */}
          <div className="absolute bottom-6 right-12 w-28 h-8 rounded-full bg-indigo-300/[0.04] border border-white/10 backdrop-blur-sm -rotate-6" />
        </div>

        {/* Header / Logo (Enlarged PNG without redundant text) */}
        <div className="relative z-10 flex items-center">
          <Image
            src="/exagoal.png"
            alt="Exagoal Logo"
            width={240}
            height={64}
            className="h-11 sm:h-12 xl:h-14 w-auto object-contain"
            priority
          />
        </div>

        {/* Hero Section with Typewriter Headline */}
        <div className="relative z-10 space-y-2">
          <div className="min-h-[64px] sm:min-h-[72px] flex flex-col justify-center">
            <h1
              className="text-2xl xl:text-3xl font-bold text-white leading-tight tracking-tight"
              suppressHydrationWarning
            >
              <span>{typedLine1}</span>
              <br />
              <span className="text-indigo-300">{typedLine2}</span>
              <span className="inline-block w-1.5 h-6 ml-1 bg-indigo-400 animate-pulse align-middle" />
            </h1>
          </div>

          <p className="text-indigo-100/80 text-xs xl:text-[13px] leading-relaxed max-w-xl font-normal">
            Deliver personalized, secure, and adaptive assessments that measure real understanding—not just memorization. Built to align with NEP 2020 and designed for modern learners.
          </p>

          {/* 6 USPs Grid (3 Rows x 2 Columns) with Interactive Hover Tooltips */}
          <div className="grid grid-cols-2 gap-2 pt-1 relative z-30">
            {USPS.map((usp) => (
              <div key={usp.title} className="group relative">
                <div className="bg-white/[0.07] hover:bg-white/[0.14] border border-white/15 hover:border-indigo-400/50 rounded-xl px-3 py-2 text-left transition-all duration-200 cursor-pointer backdrop-blur-sm shadow-sm flex items-center justify-between">
                  <span className="text-xs font-semibold text-indigo-100 group-hover:text-white transition-colors leading-snug">
                    {usp.title}
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400/70 group-hover:bg-indigo-300 transition-colors shrink-0 ml-1.5" />
                </div>

                {/* Floating Tooltip with Extra Information */}
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2.5 rounded-xl bg-slate-950/95 border border-indigo-500/30 backdrop-blur-xl shadow-2xl text-[11px] text-indigo-100 leading-relaxed opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 transform group-hover:-translate-y-1">
                  <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    {usp.title}
                  </div>
                  <p className="text-slate-300 text-[10.5px] leading-snug">{usp.detail}</p>
                  <div className="absolute top-full left-6 -mt-1 border-4 border-transparent border-t-slate-950/95" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Connected Assessment Lifecycle Flowchart (Slightly Distinguished Glass Container) */}
        <div className="relative z-20 bg-indigo-950/40 border border-indigo-400/25 rounded-2xl p-3.5 backdrop-blur-xl shadow-xl shadow-indigo-950/40 ring-1 ring-white/10">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-indigo-200 tracking-wider uppercase flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400" />
              Assessment Lifecycle Flow
            </span>
            <span className="text-[11px] text-indigo-300/80 font-medium">Continuous Closed Loop</span>
          </div>

          {/* Flowchart Diagram */}
          <div className="space-y-2">
            {/* Row 1: Steps 1 -> 4 */}
            <div className="grid grid-cols-4 gap-2 items-stretch">
              {LIFECYCLE_STEPS.slice(0, 4).map((item, idx) => (
                <div key={item.name} className="relative group">
                  <div className="h-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/15 hover:border-indigo-400/60 rounded-xl p-2 transition-all duration-200 flex flex-col justify-between text-left shadow-sm cursor-pointer hover:shadow-indigo-500/20 hover:shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/40 text-indigo-100 text-xs font-bold flex items-center justify-center shadow-inner">
                        {item.step}
                      </span>
                      {idx < 3 && (
                        <svg
                          className="w-4 h-4 text-indigo-300 drop-shadow-[0_0_6px_rgba(165,180,252,0.6)]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14M12 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{item.name}</div>
                      <div className="text-[10px] text-indigo-200/80 leading-tight mt-0.5">{item.sub}</div>
                    </div>
                  </div>

                  {/* Hover Tooltip Box */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-2.5 rounded-xl bg-slate-950/95 border border-indigo-400/30 backdrop-blur-xl shadow-2xl text-[10.5px] leading-snug opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 transform group-hover:-translate-y-1">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-indigo-500/50 text-[10px] flex items-center justify-center text-white">
                        {item.step}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <p className="text-indigo-200/90 font-normal">{item.detail}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950/95" />
                  </div>
                </div>
              ))}
            </div>

            {/* Prominent Downstream Connector */}
            <div className="flex justify-end pr-8 py-0.5">
              <div className="flex items-center gap-1.5 text-[10px] text-indigo-300 font-bold uppercase tracking-wider bg-indigo-900/40 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                <span>Downstream Pipeline</span>
                <svg
                  className="w-3.5 h-3.5 text-indigo-300 animate-bounce"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 5v14M19 12l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Row 2: Steps 7 <- 6 <- 5 */}
            <div className="grid grid-cols-3 gap-2.5 items-stretch">
              {[LIFECYCLE_STEPS[6], LIFECYCLE_STEPS[5], LIFECYCLE_STEPS[4]].map((item, idx) => (
                <div key={item.name} className="relative group">
                  <div className="h-full bg-white/[0.07] hover:bg-white/[0.15] border border-white/15 hover:border-indigo-400/60 rounded-xl p-2 transition-all duration-200 flex flex-col justify-between text-left shadow-sm cursor-pointer hover:shadow-indigo-500/20 hover:shadow-md">
                    <div className="flex items-center justify-between mb-1">
                      <span className="w-5 h-5 rounded-full bg-violet-500/40 text-violet-100 text-xs font-bold flex items-center justify-center shadow-inner">
                        {item.step}
                      </span>
                      {idx < 2 && (
                        <svg
                          className="w-4 h-4 text-violet-300 drop-shadow-[0_0_6px_rgba(196,181,253,0.6)]"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M19 12H5M12 19l-7-7 7-7" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white leading-tight">{item.name}</div>
                      <div className="text-[10px] text-indigo-200/80 leading-tight mt-0.5">{item.sub}</div>
                    </div>
                  </div>

                  {/* Hover Tooltip Box */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-52 p-2.5 rounded-xl bg-slate-950/95 border border-indigo-400/30 backdrop-blur-xl shadow-2xl text-[10.5px] leading-snug opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-200 z-50 transform group-hover:-translate-y-1">
                    <div className="font-bold text-white mb-0.5 flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded-full bg-violet-500/50 text-[10px] flex items-center justify-center text-white">
                        {item.step}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <p className="text-indigo-200/90 font-normal">{item.detail}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950/95" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Row in Distinct Rounded Boxes */}
        <div className="relative z-10 grid grid-cols-3 gap-3 pt-0.5">
          {[
            { value: "20+", label: "Connectors" },
            { value: "NEP 2020", label: "Aligned" },
            { value: "Secure", label: "Transparent" },
          ].map(({ value, label }) => (
            <div
              key={label}
              className="bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 rounded-2xl p-2.5 text-center transition-all duration-200 backdrop-blur-md shadow-sm"
            >
              <div className="text-lg xl:text-xl font-bold text-white tracking-tight leading-tight">{value}</div>
              <div className="text-indigo-200/85 text-xs font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel — Enlarged High-Conversion Auth Card */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto lg:overflow-hidden">
        <div className="w-full max-w-[460px] bg-white rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-200/70 border border-slate-100 flex flex-col justify-center">

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center mb-5">
            <Image
              src="/exagoal.png"
              alt="Exagoal Logo"
              width={200}
              height={50}
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Heading */}
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1.5 tracking-tight" suppressHydrationWarning>
            {greeting}
          </h2>

          <p className="text-slate-500 text-xs sm:text-sm mb-6 font-normal">
            Sign in to continue your personalized learning experience
          </p>

          {/* Portal Toggle */}
          <div className="flex bg-slate-100/90 rounded-2xl p-1 mb-6 border border-slate-200/60">
            {(["student", "institute"] as Portal[]).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPortal(p)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${portal === p
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60 font-bold"
                  : "text-slate-500 hover:text-slate-800"
                  }`}
              >
                {p === "student" ? (
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                ) : (
                  <Building2 className="w-4 h-4 text-indigo-600" />
                )}
                <span>{p === "student" ? "Student" : "Institute"}</span>
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                {portal === "student" ? "Student ExaID" : "Institute ExaID"}
              </label>
              <input
                type="text"
                required
                value={exaId}
                onChange={(e) => setExaId(e.target.value)}
                placeholder={portal === "student" ? "EXA-XXXXXX-ST" : "EXA-XXXXXX-INST"}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">Password</label>
                <button type="button" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
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
                  className="w-full px-4 py-3 pr-11 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 mt-2 disabled:opacity-60 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 text-sm"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{portal === "student" ? "Start Learning" : "Access Console"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Social Logins & Integration Section */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-center">
            {portal === "student" ? (
              <>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-3">Sign in using</p>
                <div className="flex justify-center items-center gap-3">
                  {/* Google */}
                  <button
                    type="button"
                    aria-label="Sign in with Google"
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm p-2"
                  >
                    <Image
                      src="/google.png"
                      alt="Google"
                      width={20}
                      height={20}
                      className="object-contain w-full h-full"
                    />
                  </button>

                  {/* Microsoft */}
                  <button
                    type="button"
                    aria-label="Sign in with Microsoft"
                    className="flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm p-2"
                  >
                    <Image
                      src="/microsoft.png"
                      alt="Microsoft"
                      width={20}
                      height={20}
                      className="object-contain w-full h-full"
                    />
                  </button>

                  {/* APAAR ID */}
                  <button
                    type="button"
                    aria-label="Sign in with APAAR ID"
                    className="flex items-center justify-center h-10 px-3.5 rounded-xl border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/40 transition-all duration-200 hover:scale-105 active:scale-95 shadow-sm"
                  >
                    <Image
                      src="/apaar-black.png"
                      alt="APAAR"
                      width={84}
                      height={28}
                      className="h-5 sm:h-6 w-auto object-contain"
                    />
                  </button>
                </div>

                <p className="text-[11px] text-slate-400 mt-3 leading-normal max-w-[320px] mx-auto font-medium">
                  Registered via an academic institute? Contact your admin for your ExaID.
                </p>
              </>
            ) : (
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">Institutional Integration</p>
                <button
                  type="button"
                  className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-700 font-semibold transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] shadow-sm text-sm"
                >
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  <span>Connect to ERP</span>
                </button>
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2.5 my-3.5">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">OR</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Secondary CTA */}
          <button
            onClick={handleGetStarted}
            className="w-full flex items-center justify-center gap-2 border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-slate-700 hover:text-indigo-700 font-semibold py-3 rounded-xl transition-all duration-200 text-xs sm:text-sm shadow-sm"
          >
            {portal === "student" ? (
              <>
                <GraduationCap className="w-4 h-4" />
                <span>Create Student Account</span>
              </>
            ) : (
              <>
                <Building2 className="w-4 h-4" />
                <span>Register Your Institute</span>
              </>
            )}
          </button>

          <p className="text-center text-[10px] text-slate-400 mt-4 font-medium tracking-wide">
            © 2026 Exagoal · NEP 2020 Aligned · Built for Bharat
          </p>
        </div>
      </div>
    </div>
  );
}
