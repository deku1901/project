"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal, Shield, History, Sparkles, Save, RotateCcw,
  ChevronDown, ChevronRight, Eye, CheckCircle2, AlertCircle,
  BarChart3, Brain, Cpu, Gauge, Clock, Target, Layers,
  Zap, BookOpen, GraduationCap, Award, TrendingUp, Settings2,
  Info, RefreshCw, ExternalLink, ArrowRight, X
} from "lucide-react";
import { getApiBaseUrl, safeFetchJson } from "@/lib/api";

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface BlueprintConfig {
  id?: number;
  name: string;
  exam_profile: string;
  difficulty: { easy: number; medium: number; hard: number };
  bloom_levels: string[];
  question_types: { [key: string]: number };
  nep_alignment: { [key: string]: boolean };
  guardrails: { [key: string]: any };
  llm_model: string | null;
  llm_temperature: number;
  llm_max_tokens: number;
  llm_top_p: number;
  max_diagrams: number;
  time_minutes: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

interface GenerationLogEntry {
  id: number;
  exam_id: number;
  exam_title?: string;
  config_snapshot: any;
  transparency: any;
  model_used: string;
  tokens_consumed: number;
  generation_duration_ms: number;
  faiss_retrieval_count: number;
  syllabus_coverage_pct: number;
  created_at: string;
}

const ALL_BLOOM_LEVELS = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];

const PROFILE_DESCRIPTIONS: Record<string, string> = {
  foundational: "Core recall & definitions, basic problem-solving (Easy 50% · Med 40% · Hard 10%)",
  university: "Standard undergraduate, balanced derivations & analysis (Easy 30% · Med 50% · Hard 20%)",
  advanced: "Rigorous analytical problem-solving & multi-step synthesis (Easy 15% · Med 50% · Hard 35%)",
  mastery: "Research-grade proofs, deep synthesis & creative reasoning (Easy 5% · Med 35% · Hard 60%)",
};

const PROFILE_COLORS: Record<string, string> = {
  foundational: "from-emerald-500 to-teal-600",
  university: "from-blue-500 to-indigo-600",
  advanced: "from-indigo-500 to-purple-600",
  mastery: "from-purple-500 to-pink-600",
};

const PROFILE_LABELS: Record<string, string> = {
  foundational: "Foundational",
  university: "Standard (Undergraduate)",
  advanced: "Advanced Analytical",
  mastery: "Mastery (Expert)",
};

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function ControlHubPage() {
  const apiBaseUrl = getApiBaseUrl();
  const [activeTab, setActiveTab] = useState<"configure" | "transparency" | "history">("configure");

  // Blueprint configs
  const [configs, setConfigs] = useState<BlueprintConfig[]>([]);
  const [activeConfig, setActiveConfig] = useState<BlueprintConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Generation logs
  const [genLogs, setGenLogs] = useState<GenerationLogEntry[]>([]);
  const [selectedLog, setSelectedLog] = useState<GenerationLogEntry | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Fetch all configs & logs on mount ─────────────────────────
  useEffect(() => {
    fetchConfigs();
    fetchGenerationLogs();
  }, []);

  const fetchConfigs = async () => {
    const res = await safeFetchJson<BlueprintConfig[]>(`${apiBaseUrl}/api/blueprint/configs`);
    if (res.ok && res.data) {
      setConfigs(res.data);
      const def = res.data.find((c) => c.is_default) || res.data[0];
      if (def && !activeConfig) setActiveConfig({ ...def });
    }
  };

  const fetchGenerationLogs = async () => {
    setLogsLoading(true);
    const res = await safeFetchJson<GenerationLogEntry[]>(`${apiBaseUrl}/api/generation-logs`);
    if (res.ok && res.data) {
      setGenLogs(res.data);
      if (res.data.length > 0 && !selectedLog) {
        setSelectedLog(res.data[0]);
      }
    }
    setLogsLoading(false);
  };

  // ── Save / Update Config ──────────────────────────────────────
  const handleSaveConfig = async () => {
    if (!activeConfig) return;
    setSaving(true);
    setSaveStatus(null);
    try {
      const res = await safeFetchJson(`${apiBaseUrl}/api/blueprint/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeConfig),
      });
      if (res.ok) {
        setSaveStatus("Configuration saved & activated across all student models!");
        if (typeof window !== "undefined") {
          localStorage.setItem("exagoal_active_blueprint", JSON.stringify(activeConfig));
          window.dispatchEvent(new Event("blueprint_updated"));
        }
        fetchConfigs();
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus(`Error: ${res.error}`);
      }
    } catch (err: any) {
      setSaveStatus(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // ── Helper to update active config fields ─────────────────────
  const updateConfig = useCallback((path: string, value: any) => {
    setActiveConfig((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      const keys = path.split(".");
      let obj: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        obj[keys[i]] = { ...obj[keys[i]] };
        obj = obj[keys[i]];
      }
      obj[keys[keys.length - 1]] = value;
      return updated;
    });
  }, []);

  // ── Load preset profile ───────────────────────────────────────
  const loadPreset = (config: BlueprintConfig) => {
    setActiveConfig({ ...config });
  };

  // ── Difficulty slider handler (ensures sum = 100) ─────────────
  const handleDifficultyChange = (key: "easy" | "medium" | "hard", val: number) => {
    if (!activeConfig) return;
    const diff = { ...activeConfig.difficulty };
    diff[key] = val;

    // Auto-balance other two
    const otherKeys = (["easy", "medium", "hard"] as const).filter((k) => k !== key);
    const remaining = 100 - val;
    const otherTotal = diff[otherKeys[0]] + diff[otherKeys[1]];

    if (otherTotal === 0) {
      diff[otherKeys[0]] = Math.round(remaining / 2);
      diff[otherKeys[1]] = remaining - diff[otherKeys[0]];
    } else {
      diff[otherKeys[0]] = Math.round((diff[otherKeys[0]] / otherTotal) * remaining);
      diff[otherKeys[1]] = remaining - diff[otherKeys[0]];
    }
    updateConfig("difficulty", diff);
  };

  // ── Question type slider handler ──────────────────────────────
  const handleQTypeChange = (key: string, val: number) => {
    if (!activeConfig) return;
    const qt = { ...activeConfig.question_types };
    qt[key] = val;

    const otherKeys = Object.keys(qt).filter((k) => k !== key);
    const remaining = 100 - val;
    const otherTotal = otherKeys.reduce((sum, k) => sum + qt[k], 0);

    if (otherTotal === 0) {
      const each = Math.round(remaining / otherKeys.length);
      otherKeys.forEach((k, i) => {
        qt[k] = i === otherKeys.length - 1 ? remaining - each * (otherKeys.length - 1) : each;
      });
    } else {
      let acc = 0;
      otherKeys.forEach((k, i) => {
        if (i === otherKeys.length - 1) {
          qt[k] = remaining - acc;
        } else {
          qt[k] = Math.round((qt[k] / otherTotal) * remaining);
          acc += qt[k];
        }
      });
    }
    updateConfig("question_types", qt);
  };

  // ── Bloom toggle ──────────────────────────────────────────────
  const toggleBloom = (level: string) => {
    if (!activeConfig) return;
    const current = [...activeConfig.bloom_levels];
    if (current.includes(level)) {
      if (current.length > 1) updateConfig("bloom_levels", current.filter((l) => l !== level));
    } else {
      updateConfig("bloom_levels", [...current, level]);
    }
  };

  if (!activeConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-5 h-5 animate-spin text-indigo-500 mr-2" />
        <span className="text-sm text-gray-500">Loading Control Hub...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* ── Hero Header ────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 rounded-2xl p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent" />
        <div className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-300" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">Control Hub</h1>
                  <p className="text-xs text-indigo-300/80 font-medium">Trust & Transparency · No-Code Configuration</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 max-w-xl mt-2">
                Configure every dimension of exam generation through visual controls. No JSON. No code.
                Every change is observable, auditable, and transparent.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Config
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation ─────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-1 bg-gray-100 p-1 rounded-xl">
        {[
          { key: "configure", label: "Blueprint Configuration", icon: SlidersHorizontal },
          { key: "transparency", label: "Transparency Report", icon: Eye },
          { key: "history", label: `Generation History (${genLogs.length})`, icon: History },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === key
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB 1: BLUEPRINT CONFIGURATION
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "configure" && (
        <div className="space-y-6">
          {/* Exam Profile Selector */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-500" />
              Exam Profile
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {(["foundational", "university", "advanced", "mastery"] as const).map((profile) => {
                const isActive = activeConfig.exam_profile === profile;
                const preset = configs.find((c) => c.exam_profile === profile);
                return (
                  <button
                    key={profile}
                    onClick={() => {
                      updateConfig("exam_profile", profile);
                      if (preset) loadPreset(preset);
                    }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-left group ${
                      isActive
                        ? "border-indigo-500 bg-indigo-50 shadow-md shadow-indigo-100"
                        : "border-gray-200 hover:border-indigo-300 hover:shadow-sm"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${PROFILE_COLORS[profile]} flex items-center justify-center mb-2`}>
                      <GraduationCap className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">{PROFILE_LABELS[profile]}</div>
                    <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">{PROFILE_DESCRIPTIONS[profile]}</div>
                    {isActive && (
                      <div className="absolute top-2 right-2">
                        <CheckCircle2 className="w-4 h-4 text-indigo-600" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-500" />
              Difficulty Distribution
            </h3>
            <div className="space-y-5">
              {(["easy", "medium", "hard"] as const).map((level) => {
                const val = activeConfig.difficulty[level];
                const colorMap = { easy: "bg-emerald-500", medium: "bg-amber-500", hard: "bg-red-500" };
                const labelMap = { easy: "Easy", medium: "Medium", hard: "Hard" };
                return (
                  <div key={level}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${colorMap[level]}`} />
                        <span className="text-sm font-semibold text-gray-700">{labelMap[level]}</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 tabular-nums">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val}
                      onChange={(e) => handleDifficultyChange(level, parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      style={{
                        background: `linear-gradient(to right, ${level === "easy" ? "#10b981" : level === "medium" ? "#f59e0b" : "#ef4444"} ${val}%, #e5e7eb ${val}%)`,
                      }}
                    />
                  </div>
                );
              })}
              {/* Visual bar */}
              <div className="flex rounded-lg overflow-hidden h-3 mt-2">
                <div className="bg-emerald-500 transition-all" style={{ width: `${activeConfig.difficulty.easy}%` }} />
                <div className="bg-amber-500 transition-all" style={{ width: `${activeConfig.difficulty.medium}%` }} />
                <div className="bg-red-500 transition-all" style={{ width: `${activeConfig.difficulty.hard}%` }} />
              </div>
            </div>
          </div>

          {/* Bloom's Taxonomy */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-indigo-500" />
              Bloom&apos;s Taxonomy Levels
            </h3>
            <div className="flex flex-wrap gap-2">
              {ALL_BLOOM_LEVELS.map((level, idx) => {
                const isActive = activeConfig.bloom_levels.includes(level);
                const intensity = Math.round(((idx + 1) / ALL_BLOOM_LEVELS.length) * 100);
                return (
                  <button
                    key={level}
                    onClick={() => toggleBloom(level)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 border ${
                      isActive
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                        : "bg-gray-50 text-gray-600 border-gray-200 hover:border-indigo-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {isActive && <CheckCircle2 className="w-3.5 h-3.5" />}
                      {level}
                      <span className={`text-[10px] ${isActive ? "text-indigo-200" : "text-gray-400"}`}>L{idx + 1}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
              <Info className="w-3 h-3" />
              Selected levels guide the AI to target specific cognitive demand in questions.
            </p>
          </div>

          {/* Question Type Distribution */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Question Type Distribution
            </h3>
            <div className="space-y-4">
              {Object.entries(activeConfig.question_types).map(([key, val]) => {
                const labelMap: Record<string, string> = { mcq: "Multiple Choice (MCQ)", numerical: "Numerical Answer", subjective: "Subjective / Long Answer", proof: "Proof / Derivation" };
                const colorMap: Record<string, string> = { mcq: "#6366f1", numerical: "#8b5cf6", subjective: "#a855f7", proof: "#c084fc" };
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-semibold text-gray-700">{labelMap[key] || key}</span>
                      <span className="text-sm font-bold text-gray-900 tabular-nums">{val}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={val}
                      onChange={(e) => handleQTypeChange(key, parseInt(e.target.value))}
                      className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                      style={{
                        background: `linear-gradient(to right, ${colorMap[key] || "#6366f1"} ${val}%, #e5e7eb ${val}%)`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* NEP Alignment Toggles */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Award className="w-4 h-4 text-indigo-500" />
              NEP Alignment & Compliance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "co_mapping", label: "Course Objective (CO) Mapping", desc: "Align questions to declared course objectives" },
                { key: "po_mapping", label: "Program Outcome (PO) Mapping", desc: "Map to institutional program outcomes" },
                { key: "cross_disciplinary", label: "Cross-Disciplinary Integration", desc: "Include cross-subject analytical questions" },
                { key: "formative", label: "Formative Assessment Mode", desc: "Lighter difficulty with diagnostic focus" },
              ].map(({ key, label, desc }) => {
                const isOn = activeConfig.nep_alignment[key] ?? false;
                return (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                    <button
                      onClick={() => updateConfig(`nep_alignment.${key}`, !isOn)}
                      className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-all duration-200 mt-0.5 ${
                        isOn ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isOn ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Guardrails */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-500" />
              Generation Guardrails
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: "no_duplicate_topics", label: "No Duplicate Topics", desc: "Prevents questions covering the same concept" },
                { key: "balance_marks", label: "Balance Marks Distribution", desc: "Keeps marks ±5% across question types" },
                { key: "require_diagram", label: "Require Visual Diagram", desc: "Ensures at least one Matplotlib diagram" },
              ].map(({ key, label, desc }) => {
                const isOn = activeConfig.guardrails[key] ?? false;
                return (
                  <div key={key} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                    <button
                      onClick={() => updateConfig(`guardrails.${key}`, !isOn)}
                      className={`w-11 h-6 rounded-full relative flex-shrink-0 transition-all duration-200 mt-0.5 ${
                        isOn ? "bg-indigo-600" : "bg-gray-200"
                      }`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${isOn ? "left-[22px]" : "left-0.5"}`} />
                    </button>
                    <div>
                      <div className="text-sm font-semibold text-gray-800">{label}</div>
                      <div className="text-[11px] text-gray-400 mt-0.5">{desc}</div>
                    </div>
                  </div>
                );
              })}
              {/* Min hard questions: numeric input */}
              <div className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:border-indigo-200 transition-colors">
                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">Min Hard Questions</div>
                  <div className="text-[11px] text-gray-400 mt-0.5">Minimum number of hard-difficulty questions required</div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={20}
                  value={activeConfig.guardrails.min_hard_questions ?? 1}
                  onChange={(e) => updateConfig("guardrails.min_hard_questions", parseInt(e.target.value) || 0)}
                  className="w-16 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Time & Diagrams */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-500" />
                Time Allocation
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={30}
                  max={360}
                  step={15}
                  value={activeConfig.time_minutes}
                  onChange={(e) => updateConfig("time_minutes", parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                  style={{ background: `linear-gradient(to right, #6366f1 ${((activeConfig.time_minutes - 30) / 330) * 100}%, #e5e7eb ${((activeConfig.time_minutes - 30) / 330) * 100}%)` }}
                />
                <span className="text-lg font-bold text-gray-900 tabular-nums w-20 text-center">{activeConfig.time_minutes} min</span>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                Max Diagrams
              </h3>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={10}
                  value={activeConfig.max_diagrams}
                  onChange={(e) => updateConfig("max_diagrams", parseInt(e.target.value))}
                  className="flex-1 h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                  style={{ background: `linear-gradient(to right, #6366f1 ${(activeConfig.max_diagrams / 10) * 100}%, #e5e7eb ${(activeConfig.max_diagrams / 10) * 100}%)` }}
                />
                <span className="text-lg font-bold text-gray-900 tabular-nums w-16 text-center">{activeConfig.max_diagrams}</span>
              </div>
            </div>
          </div>

          {/* Advanced LLM Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              onClick={() => setAdvancedOpen(!advancedOpen)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">Advanced LLM Parameters</span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
            </button>
            {advancedOpen && (
              <div className="px-6 pb-6 space-y-5 border-t border-gray-100 pt-4">
                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">Temperature</span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">{activeConfig.llm_temperature.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(activeConfig.llm_temperature * 100)}
                    onChange={(e) => updateConfig("llm_temperature", parseInt(e.target.value) / 100)}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    style={{ background: `linear-gradient(to right, #6366f1 ${activeConfig.llm_temperature * 100}%, #e5e7eb ${activeConfig.llm_temperature * 100}%)` }}
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>Deterministic (0.0)</span>
                    <span>Creative (1.0)</span>
                  </div>
                </div>
                {/* Top-P */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">Top-P (Nucleus Sampling)</span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">{activeConfig.llm_top_p.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(activeConfig.llm_top_p * 100)}
                    onChange={(e) => updateConfig("llm_top_p", parseInt(e.target.value) / 100)}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    style={{ background: `linear-gradient(to right, #8b5cf6 ${activeConfig.llm_top_p * 100}%, #e5e7eb ${activeConfig.llm_top_p * 100}%)` }}
                  />
                </div>
                {/* Max Tokens */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-700">Max Tokens</span>
                    <span className="text-sm font-bold text-gray-900 tabular-nums">{activeConfig.llm_max_tokens.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min={1000}
                    max={8000}
                    step={500}
                    value={activeConfig.llm_max_tokens}
                    onChange={(e) => updateConfig("llm_max_tokens", parseInt(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-600"
                    style={{ background: `linear-gradient(to right, #6366f1 ${((activeConfig.llm_max_tokens - 1000) / 7000) * 100}%, #e5e7eb ${((activeConfig.llm_max_tokens - 1000) / 7000) * 100}%)` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Save Bar */}
          <div className="sticky bottom-4 z-10">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-gray-200 shadow-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${activeConfig.is_default ? "bg-emerald-500" : "bg-amber-500"}`} />
                <span className="text-sm font-semibold text-gray-700">
                  Editing: <strong className="text-gray-900">{activeConfig.name}</strong>
                </span>
                {saveStatus && (
                  <span className={`text-xs font-medium ${saveStatus.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>
                    {saveStatus}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const def = configs.find((c) => c.is_default) || configs[0];
                    if (def) loadPreset(def);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Saving..." : "Save Configuration"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 2: TRANSPARENCY REPORT
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "transparency" && (
        <div className="space-y-6">
          {selectedLog && selectedLog.transparency ? (
            <>
              {/* Summary Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-4 h-4 text-indigo-500" />
                    Generation Transparency Report
                  </h3>
                  <span className="text-xs text-gray-400">
                    {new Date(selectedLog.created_at).toLocaleString("en-IN")}
                  </span>
                </div>

                {/* Config Applied Banner */}
                {selectedLog.config_snapshot && (
                  <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-5">
                    <div className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-2">Configuration Applied</div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <div className="text-[11px] text-indigo-500 font-medium">Profile</div>
                        <div className="text-sm font-bold text-indigo-900">{PROFILE_LABELS[selectedLog.config_snapshot.exam_profile] || selectedLog.config_snapshot.exam_profile}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-indigo-500 font-medium">Temperature</div>
                        <div className="text-sm font-bold text-indigo-900">{selectedLog.config_snapshot.llm_temperature}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-indigo-500 font-medium">Bloom Levels</div>
                        <div className="text-sm font-bold text-indigo-900">{selectedLog.config_snapshot.bloom_levels?.join(", ") || "—"}</div>
                      </div>
                      <div>
                        <div className="text-[11px] text-indigo-500 font-medium">Max Diagrams</div>
                        <div className="text-sm font-bold text-indigo-900">{selectedLog.config_snapshot.max_diagrams}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats row */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
                  {[
                    { label: "Questions Generated", value: selectedLog.transparency.questions_generated, icon: Layers },
                    { label: "Marks Accuracy", value: `${100 - selectedLog.transparency.marks_deviation_pct}%`, icon: Target },
                    { label: "Diagrams", value: selectedLog.transparency.diagram_count, icon: Sparkles },
                    { label: "FAISS Chunks", value: selectedLog.transparency.faiss_chunks_retrieved || selectedLog.faiss_retrieval_count, icon: BookOpen },
                    { label: "Gen Time", value: `${(selectedLog.generation_duration_ms / 1000).toFixed(1)}s`, icon: Clock },
                  ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="bg-gray-50 rounded-xl p-3 text-center">
                      <Icon className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-gray-900">{value}</div>
                      <div className="text-[10px] text-gray-500 font-medium">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Difficulty Breakdown */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Difficulty Breakdown</h4>
                  <div className="space-y-2">
                    {Object.entries(selectedLog.transparency.difficulty_distribution || {}).map(([level, pct]) => {
                      const colorMap: Record<string, string> = { easy: "bg-emerald-500", medium: "bg-amber-500", hard: "bg-red-500" };
                      // Get configured values for comparison
                      const configuredPct = selectedLog.config_snapshot?.difficulty?.[level];
                      return (
                        <div key={level} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-600 w-16 capitalize">{level}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-4 relative overflow-hidden">
                            <div
                              className={`${colorMap[level] || "bg-indigo-500"} h-full rounded-full transition-all duration-500`}
                              style={{ width: `${pct as number}%` }}
                            />
                            {configuredPct !== undefined && (
                              <div
                                className="absolute top-0 h-full border-r-2 border-dashed border-gray-400"
                                style={{ left: `${configuredPct}%` }}
                                title={`Configured: ${configuredPct}%`}
                              />
                            )}
                          </div>
                          <span className="text-xs font-bold text-gray-900 tabular-nums w-10 text-right">{pct as number}%</span>
                          {configuredPct !== undefined && (
                            <span className="text-[10px] text-gray-400 w-16 text-right">cfg: {configuredPct}%</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Bloom Coverage */}
                {selectedLog.transparency.bloom_coverage && Object.keys(selectedLog.transparency.bloom_coverage).length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bloom&apos;s Taxonomy Coverage</h4>
                    <div className="flex flex-wrap gap-2">
                      {ALL_BLOOM_LEVELS.map((level) => {
                        const pct = selectedLog.transparency.bloom_coverage[level] || 0;
                        const isTargeted = selectedLog.config_snapshot?.bloom_levels?.includes(level);
                        return (
                          <div
                            key={level}
                            className={`px-3 py-2 rounded-xl text-center border transition-all ${
                              pct > 0
                                ? "bg-indigo-50 border-indigo-200"
                                : isTargeted
                                ? "bg-red-50 border-red-200"
                                : "bg-gray-50 border-gray-200"
                            }`}
                          >
                            <div className="text-[11px] font-semibold text-gray-600">{level}</div>
                            <div className={`text-sm font-bold ${pct > 0 ? "text-indigo-700" : "text-gray-300"}`}>{pct}%</div>
                            {isTargeted && <div className="text-[9px] text-indigo-500 font-medium">targeted</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Question Type Distribution */}
                {selectedLog.transparency.question_type_distribution && (
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Question Type Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(selectedLog.transparency.question_type_distribution).map(([type, pct]) => (
                        <div key={type} className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-gray-600 w-24 capitalize">{type}</span>
                          <div className="flex-1 bg-gray-100 rounded-full h-3">
                            <div
                              className="bg-purple-500 h-full rounded-full transition-all duration-500"
                              style={{ width: `${pct as number}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-900 tabular-nums w-10 text-right">{pct as number}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <Eye className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 mb-1">No Transparency Report Yet</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Generate an exam using a blueprint configuration from the Exam Studio to see a full transparency analysis here.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB 3: GENERATION HISTORY
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="space-y-4">
          {genLogs.length > 0 ? (
            <>
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-4 h-4 text-indigo-500" />
                    Generation Audit Trail
                  </h3>
                  <button
                    onClick={fetchGenerationLogs}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${logsLoading ? "animate-spin" : ""}`} />
                    Refresh
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {genLogs.map((log) => {
                    const isSelected = selectedLog?.id === log.id;
                    const profile = log.config_snapshot?.exam_profile;
                    return (
                      <button
                        key={log.id}
                        onClick={() => {
                          setSelectedLog(log);
                          setActiveTab("transparency");
                        }}
                        className={`w-full px-6 py-4 text-left hover:bg-indigo-50/50 transition-colors flex items-center gap-4 ${
                          isSelected ? "bg-indigo-50" : ""
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${PROFILE_COLORS[profile] || "from-gray-400 to-gray-500"} flex items-center justify-center flex-shrink-0`}>
                          <Cpu className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">
                            {log.exam_title || `Exam #${log.exam_id}`}
                          </div>
                          <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                            <span>{new Date(log.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                            <span>·</span>
                            <span>{PROFILE_LABELS[profile] || "Custom"}</span>
                            <span>·</span>
                            <span>{(log.generation_duration_ms / 1000).toFixed(1)}s</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold text-gray-900">{log.transparency?.questions_generated || "—"} Qs</div>
                            <div className="text-[10px] text-gray-400">{log.syllabus_coverage_pct}% coverage</div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
              <History className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-900 mb-1">No Generation History</h3>
              <p className="text-sm text-gray-500 max-w-sm mx-auto">
                Each exam generated through the system is logged here with full config snapshots and transparency analytics.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
