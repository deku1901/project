"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Cpu, Brain, FileText, Download, Zap, ChevronRight,
  BarChart3, Clock, CheckCircle2, Sliders, BookOpen,
  ExternalLink, ArrowRight, Upload, Sparkles, Image as ImageIcon,
  Edit3, Trash2, ArrowUp, ArrowDown, RefreshCw, AlertCircle,
  FolderOpen, Layers, Presentation, FileCode2, Printer, Plus, X,
  KeyRound, HelpCircle, Check, Eye, SlidersHorizontal
} from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";
import AiEditModal from "@/components/institute/AiEditModal";
import PlotStudioModal from "@/components/institute/PlotStudioModal";
import { getApiBaseUrl, safeFetchJson } from "@/lib/api";

interface ContextStats {
  total_items: number;
  subject_breakdown: Record<string, number>;
  recent_items: Array<{
    id: number;
    type: string;
    subject: string;
    source_file: string;
    content: string;
  }>;
}

interface QuestionItem {
  id: number;
  exam_id: number;
  q_index: number;
  text: string;
  marks: number;
  image_path?: string | null;
  image_spec_json?: string | null;
  difficulty?: string | null;
  bloom_level?: string | null;
  question_type?: string | null;
  created_at?: string;
}

interface BlueprintConfigSummary {
  id: number;
  name: string;
  exam_profile: string;
  difficulty: { easy: number; medium: number; hard: number };
  bloom_levels: string[];
  question_types: Record<string, number>;
  time_minutes: number;
  max_diagrams: number;
  is_default: boolean;
}

interface ExamItem {
  id: number;
  title: string;
  max_marks: number;
  n_questions: number;
  per_unit_weights_json?: string | null;
  created_at: string;
}

const PIPELINE_STEPS = [
  { step: 1, label: "Context Ingestion & FAISS", icon: BookOpen, desc: "Syllabi, course objectives, and question banks chunked & vectorized into FAISS dense store." },
  { step: 2, label: "Blueprint & Weight Constraints", icon: Sliders, desc: "Configure title, target questions, marks total, and unit percentage weightages." },
  { step: 3, label: "AI Question & Plot Generation", icon: Brain, desc: "Single-pass LLM generates LaTeX questions with embedded executable Matplotlib diagrams." },
  { step: 4, label: "Studio Review & AI Refinement", icon: Sparkles, desc: "Inline math editing, teacher-prompt AI rewrites, and Matplotlib visual design stage." },
  { step: 5, label: "Multi-Format Publication", icon: Download, desc: "One-click export to 16:9 PowerPoint (.pptx), print-ready PDF, Word (.docx), and LaTeX (.tex)." },
];

export default function ExamPage() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"workflow" | "history" | "pipeline">("workflow");

  // API Base
  const apiBaseUrl = getApiBaseUrl();

  // Context / Ingestion State
  const [contextStats, setContextStats] = useState<ContextStats | null>(null);
  const [contextLoading, setContextLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Blueprint / Generation Config
  const [examTitle, setExamTitle] = useState("Advanced Calculus & Differential Equations");
  const [nQuestions, setNQuestions] = useState(4);
  const [maxMarks, setMaxMarks] = useState(100);
  const [unitWeights, setUnitWeights] = useState('{"Calculus & Rates": 35, "Surface Integrals": 35, "Differential Equations": 30}');
  const [includeDiagrams, setIncludeDiagrams] = useState(true);
  const [overrideModel, setOverrideModel] = useState("");
  const [overrideApiKey, setOverrideApiKey] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState<string | null>(null);

  // Trust & Transparency: Blueprint Presets and Post-Gen Transparency Analytics
  const [blueprintConfigs, setBlueprintConfigs] = useState<BlueprintConfigSummary[]>([]);
  const [selectedBlueprintId, setSelectedBlueprintId] = useState<number | null>(null);
  const [latestTransparency, setLatestTransparency] = useState<any>(null);

  // Workspace / Questions State
  const [currentExam, setCurrentExam] = useState<ExamItem | null>(null);
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [editingQId, setEditingQId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [editMarks, setEditMarks] = useState<number>(10);
  const [inlineSaving, setInlineSaving] = useState(false);

  // Modals
  const [aiModalQuestion, setAiModalQuestion] = useState<QuestionItem | null>(null);
  const [plotStudioQuestion, setPlotStudioQuestion] = useState<QuestionItem | null>(null);
  const [imageZoomPath, setImageZoomPath] = useState<string | null>(null);

  // Export State
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  // History State
  const [pastExams, setPastExams] = useState<ExamItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Initial Load
  useEffect(() => {
    fetchContextStats();
    fetchPastExams();
    fetchBlueprintConfigs();
  }, []);

  // ── API: Load Blueprint Configs from Control Hub ───────────────────────
  const fetchBlueprintConfigs = async () => {
    try {
      const res = await safeFetchJson<BlueprintConfigSummary[]>(`${apiBaseUrl}/api/blueprint/configs`);
      if (res.ok && res.data && res.data.length > 0) {
        setBlueprintConfigs(res.data);
        const def = res.data.find((c) => c.is_default) || res.data[0];
        if (def && !selectedBlueprintId) {
          setSelectedBlueprintId(def.id);
        }
      }
    } catch (e) {
      console.error("Error loading blueprint configs:", e);
    }
  };

  // ── API: Context Stats ──────────────────────────────────────────────────
  const fetchContextStats = async () => {
    setContextLoading(true);
    try {
      const res = await safeFetchJson<ContextStats>(`${apiBaseUrl}/api/context/stats`);
      if (res.ok && res.data) {
        setContextStats(res.data);
      }
    } catch (e) {
      console.error("Error fetching context stats:", e);
    } finally {
      setContextLoading(false);
    }
  };

  // ── API: Load Sample Calculus Context ──────────────────────────────────
  const handleLoadSampleContext = async () => {
    setContextLoading(true);
    setUploadStatus({ message: "Loading pre-configured Calculus dataset...", type: "info" });
    try {
      // 1. Fetch sample JSON
      const sampleRes = await safeFetchJson(`${apiBaseUrl}/sample_context.json`);
      if (!sampleRes.ok || !sampleRes.data) {
        throw new Error("Could not fetch sample context dataset.");
      }
      const sampleData = sampleRes.data;

      // 2. Upload to context endpoint
      const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: "application/json" });
      const file = new File([blob], "Calculus_Differential_Equations_Sample.json", { type: "application/json" });

      const formData = new FormData();
      formData.append("files", file);

      const uploadRes = await safeFetchJson(`${apiBaseUrl}/api/context/upload`, {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error(uploadRes.error || "Failed to index sample dataset.");
      }

      setUploadStatus({
        message: `Successfully loaded sample dataset! Indexed ${uploadRes.data?.count || "multiple"} semantic units.`,
        type: "success",
      });
      await fetchContextStats();
    } catch (err: any) {
      setUploadStatus({ message: err.message || "Failed to load sample dataset.", type: "error" });
    } finally {
      setContextLoading(false);
    }
  };

  // ── API: Upload Custom JSON Files ──────────────────────────────────────
  const handleFileUpload = async () => {
    if (selectedFiles.length === 0) return;

    setContextLoading(true);
    setUploadStatus({ message: `Uploading & chunking ${selectedFiles.length} file(s)...`, type: "info" });

    try {
      const formData = new FormData();
      for (const f of selectedFiles) {
        formData.append("files", f);
      }

      const res = await safeFetchJson(`${apiBaseUrl}/api/context/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(res.error || "Failed to upload context files.");
      }

      setUploadStatus({
        message: `Success! ${res.data?.message || `Indexed ${res.data?.count} items.`}`,
        type: "success",
      });
      setSelectedFiles([]);
      await fetchContextStats();
    } catch (err: any) {
      setUploadStatus({ message: err.message || "Error uploading files.", type: "error" });
    } finally {
      setContextLoading(false);
    }
  };

  // ── Drag & Drop Handlers ────────────────────────────────────────────────
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const jsonFiles = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".json") || f.type.includes("json"));
      if (jsonFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...jsonFiles]);
      } else {
        setUploadStatus({ message: "Please drop valid .json files.", type: "error" });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const jsonFiles = Array.from(e.target.files).filter((f) => f.name.endsWith(".json") || f.type.includes("json"));
      setSelectedFiles((prev) => [...prev, ...jsonFiles]);
    }
  };

  // ── API: Generate Exam ──────────────────────────────────────────────────
  const handleGenerateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examTitle.trim()) return;

    setGenerating(true);
    setGenStatus(`Retrieving FAISS semantic context & synthesizing ${nQuestions} questions with AI (this may take 15–45 seconds)...`);

    try {
      const formData = new FormData();
      formData.append("title", examTitle.trim());
      formData.append("n_questions", nQuestions.toString());
      formData.append("max_marks", maxMarks.toString());
      if (unitWeights.trim()) formData.append("per_unit_weights", unitWeights.trim());
      formData.append("include_diagrams", includeDiagrams ? "true" : "false");
      if (overrideModel.trim()) formData.append("model", overrideModel.trim());
      if (overrideApiKey.trim()) formData.append("api_key", overrideApiKey.trim());
      if (selectedBlueprintId) formData.append("blueprint_config_id", selectedBlueprintId.toString());

      const res = await safeFetchJson(`${apiBaseUrl}/api/generate`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok || !res.data?.exam) {
        throw new Error(res.error || "Exam generation failed.");
      }

      setCurrentExam(res.data.exam);
      setQuestions(res.data.questions || []);
      if (res.data.transparency) {
        setLatestTransparency(res.data.transparency);
      }
      setGenStatus(null);
      setActiveStep(3);
      fetchPastExams();
    } catch (err: any) {
      setGenStatus(`Error: ${err.message || "Failed to generate examination."}`);
    } finally {
      setGenerating(false);
    }
  };

  // ── API: Load Past Exams ────────────────────────────────────────────────
  const fetchPastExams = async () => {
    setHistoryLoading(true);
    try {
      const res = await safeFetchJson<ExamItem[]>(`${apiBaseUrl}/api/exams`);
      if (res.ok && res.data) {
        setPastExams(res.data);
      }
    } catch (e) {
      console.error("Error fetching exams history:", e);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleLoadExam = async (examId: number) => {
    try {
      const res = await safeFetchJson(`${apiBaseUrl}/api/exam/${examId}`);
      if (!res.ok || !res.data) throw new Error(res.error || "Failed to load exam.");
      setCurrentExam(res.data.exam);
      setQuestions(res.data.questions);
      setActiveTab("workflow");
      setActiveStep(3);
    } catch (err: any) {
      alert(`Could not load exam: ${err.message}`);
    }
  };

  // ── Inline Question Editing ─────────────────────────────────────────────
  const startInlineEdit = (q: QuestionItem) => {
    setEditingQId(q.id);
    setEditText(q.text);
    setEditMarks(q.marks);
  };

  const cancelInlineEdit = () => {
    setEditingQId(null);
    setEditText("");
  };

  const saveInlineEdit = async (qId: number) => {
    setInlineSaving(true);
    try {
      const formData = new FormData();
      formData.append("question_id", qId.toString());
      formData.append("text", editText);
      formData.append("marks", editMarks.toString());

      const res = await safeFetchJson(`${apiBaseUrl}/api/save_question`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(res.error || "Failed to save question.");

      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, text: editText, marks: editMarks } : q))
      );
      setEditingQId(null);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setInlineSaving(false);
    }
  };

  // ── Reorder Questions ───────────────────────────────────────────────────
  const moveQuestion = (index: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= questions.length) return;

    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Update q_index
    const reindexed = updated.map((q, idx) => ({ ...q, q_index: idx + 1 }));
    setQuestions(reindexed);
  };

  // ── Create New Question ─────────────────────────────────────────────────
  const handleAddNewQuestion = async () => {
    if (!currentExam) return;
    try {
      const formData = new FormData();
      formData.append("exam_id", currentExam.id.toString());
      formData.append("text", "New Question: State and prove the fundamental theorem...");
      formData.append("marks", "10");

      const res = await safeFetchJson(`${apiBaseUrl}/api/question/create`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok || !res.data?.question) throw new Error(res.error || "Failed to add question.");

      setQuestions((prev) => [...prev, res.data.question]);
    } catch (err: any) {
      alert(`Add question failed: ${err.message}`);
    }
  };

  // ── Delete Question ─────────────────────────────────────────────────────
  const handleDeleteQuestion = async (qId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      const res = await safeFetchJson(`${apiBaseUrl}/api/question/${qId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(res.error || "Failed to delete question.");

      setQuestions((prev) => prev.filter((q) => q.id !== qId));
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // ── Remove Image from Question Inline ───────────────────────────────────
  const handleRemoveImageInline = async (qId: number) => {
    try {
      const formData = new FormData();
      formData.append("question_id", qId.toString());

      const res = await safeFetchJson(`${apiBaseUrl}/api/question/remove_image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error(res.error || "Failed to remove diagram.");

      setQuestions((prev) =>
        prev.map((q) => (q.id === qId ? { ...q, image_path: null, image_spec_json: null } : q))
      );
    } catch (err: any) {
      alert(`Remove image failed: ${err.message}`);
    }
  };

  // ── Export Handler ──────────────────────────────────────────────────────
  const handleExport = async (format: string) => {
    if (!currentExam) return;

    if (format === "print") {
      window.print();
      return;
    }

    setExportingFormat(format);
    setExportStatus(`Compiling and downloading .${format} document...`);

    try {
      const formData = new FormData();
      formData.append("exam_id", currentExam.id.toString());
      formData.append("format", format);

      const res = await fetch(`${apiBaseUrl}/api/export`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errMessage = `Export to ${format} failed.`;
        try {
          const text = await res.text();
          const errJson = JSON.parse(text);
          errMessage = errJson.detail || errJson.error || errMessage;
        } catch {}
        throw new Error(errMessage);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const safeTitle = (currentExam.title || "exam").toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      a.download = `exam_${currentExam.id}_${safeTitle}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setExportStatus(`Successfully exported .${format}!`);
      setTimeout(() => setExportStatus(null), 4000);
    } catch (err: any) {
      setExportStatus(`Export error: ${err.message}`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ── Top Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-gray-900 tracking-tight">ExamGen Studio</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
              Autonomous AI
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            FAISS dense context indexing · Single-pass Matplotlib plotting · Multi-format (.pptx, .pdf, .docx, .tex) publication
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* FAISS Index status pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-xl shadow-2xs text-xs font-semibold text-gray-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              FAISS Index:{" "}
              <strong className="text-indigo-600">
                {contextStats ? `${contextStats.total_items} Chunks` : "Ready"}
              </strong>
            </span>
          </div>

          <button
            onClick={handleLoadSampleContext}
            disabled={contextLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all border border-indigo-200"
            title="Load sample Calculus dataset into FAISS"
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Load Sample Data</span>
          </button>
        </div>
      </div>

      {/* ── Main Navigation Bar ────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 pb-2">
        {/* Tab Selector */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
          {[
            { key: "workflow", label: "⚡ Exam Workflow Studio" },
            { key: "history", label: `📋 Exam Archive (${pastExams.length})` },
            { key: "pipeline", label: "🔧 Architecture & Pipeline" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                activeTab === key
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Workflow Stepper Navigation (visible when activeTab === 'workflow') */}
        {activeTab === "workflow" && (
          <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-xl shadow-2xs">
            {[
              { step: 1, label: "1. Ingestion" },
              { step: 2, label: "2. Blueprint" },
              { step: 3, label: "3. Studio" },
              { step: 4, label: "4. Export" },
            ].map(({ step, label }) => (
              <button
                key={step}
                onClick={() => setActiveStep(step)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeStep === step
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 1: WORKFLOW STUDIO                                            */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "workflow" && (
        <div>
          {/* STEP 1: CONTEXT INGESTION */}
          {activeStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left 3 cols: Upload & Dropzone */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                      Knowledge Base
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Course Context & Syllabus Ingestion</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Upload course objectives, textbook topics, and question banks in JSON to index into FAISS dense vector store.
                    </p>
                  </div>
                </div>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? "border-indigo-500 bg-indigo-50/50"
                      : "border-gray-300 hover:border-indigo-400 hover:bg-gray-50/60 bg-gray-50/30"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".json,application/json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Drop JSON course syllabi or click to browse
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Supports Universal JSON schemas, problem sets, and unit outcomes</p>
                  </div>
                </div>

                {/* Selected files preview */}
                {selectedFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>Selected Files ({selectedFiles.length})</span>
                      <button
                        type="button"
                        onClick={() => setSelectedFiles([])}
                        className="text-red-500 hover:underline"
                      >
                        Clear all
                      </button>
                    </div>
                    <div className="max-h-32 overflow-y-auto space-y-1.5">
                      {selectedFiles.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl text-xs border border-gray-200"
                        >
                          <span className="font-medium text-gray-800 truncate">{f.name}</span>
                          <span className="text-gray-400 ml-2">{(f.size / 1024).toFixed(1)} KB</span>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleFileUpload}
                      disabled={contextLoading}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {contextLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Chunking & Vectorizing into FAISS...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload & Index {selectedFiles.length} File(s)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Upload Status Toast */}
                {uploadStatus && (
                  <div
                    className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
                      uploadStatus.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : uploadStatus.type === "error"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : "bg-blue-50 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {uploadStatus.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
                    ) : uploadStatus.type === "error" ? (
                      <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600 mt-0.5" />
                    ) : (
                      <RefreshCw className="w-4 h-4 flex-shrink-0 text-blue-600 animate-spin mt-0.5" />
                    )}
                    <span className="flex-1 font-medium">{uploadStatus.message}</span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleLoadSampleContext}
                    disabled={contextLoading}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Load Pre-configured Calculus Dataset
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStep(2)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <span>Proceed to Blueprint</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Right 2 cols: FAISS Knowledge Base Stats */}
              <div className="lg:col-span-2 space-y-4">
                {/* Stats Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      FAISS Dense Index
                    </h4>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold">
                      {contextStats ? `${contextStats.total_items} Items Indexed` : "Loading..."}
                    </span>
                  </div>

                  {/* Subject Chips */}
                  <div>
                    <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Subject Breakdown:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {contextStats && Object.keys(contextStats.subject_breakdown).length > 0 ? (
                        Object.entries(contextStats.subject_breakdown).map(([subject, count]) => (
                          <span
                            key={subject}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            <span>{subject}</span>
                            <strong className="text-indigo-600">({count})</strong>
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-gray-400 italic">No indexed items yet.</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Items Preview */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Recently Indexed Knowledge
                  </h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {contextStats && contextStats.recent_items.length > 0 ? (
                      contextStats.recent_items.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-700">{item.subject}</span>
                            <span className="text-[10px] text-gray-400 uppercase">{item.type}</span>
                          </div>
                          <p className="text-gray-600 text-[11px] line-clamp-2 leading-relaxed">
                            {item.content}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-gray-400 italic">No recent items to display.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: EXAM BLUEPRINT CONFIGURATION */}
          {activeStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Left 3 cols: Form */}
              <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-200 p-6 space-y-5 shadow-2xs">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                    Exam Configuration
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">Examination Blueprint</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Define the syllabus target, question distribution, marks totals, and visual plot requirements.
                  </p>
                </div>

                <form onSubmit={handleGenerateExam} className="space-y-4">
                  {/* Blueprint Preset Selector */}
                  {blueprintConfigs.length > 0 && (
                    <div className="p-4 bg-slate-900 rounded-2xl text-white space-y-3 shadow-sm border border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                            No-Code Blueprint Profile
                          </span>
                        </div>
                        <a
                          href="/institute/dashboard/control-hub"
                          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 underline underline-offset-2"
                        >
                          Configure in Control Hub ↗
                        </a>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {blueprintConfigs.map((cfg) => {
                          const isSel = selectedBlueprintId === cfg.id;
                          return (
                            <button
                              key={cfg.id}
                              type="button"
                              onClick={() => {
                                setSelectedBlueprintId(cfg.id);
                                if (cfg.exam_profile === "mastery") {
                                  setExamTitle("Mastery Synthesis & Rigorous Mathematical Proofs");
                                  setMaxMarks(120);
                                  setNQuestions(6);
                                } else if (cfg.exam_profile === "advanced") {
                                  setExamTitle("Advanced Analytical Problem Solving Assessment");
                                  setMaxMarks(100);
                                  setNQuestions(5);
                                } else if (cfg.exam_profile === "foundational") {
                                  setExamTitle("Foundational Concepts & Applied Problem Solving");
                                  setMaxMarks(60);
                                  setNQuestions(4);
                                } else {
                                  setExamTitle("Advanced Calculus & Differential Equations");
                                  setMaxMarks(100);
                                  setNQuestions(4);
                                }
                              }}
                              className={`px-3 py-2 rounded-xl text-left border transition-all ${
                                isSel
                                  ? "bg-indigo-600 border-indigo-400 text-white shadow-sm font-bold"
                                  : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800 text-xs"
                              }`}
                            >
                              <div className="text-xs truncate">{cfg.name}</div>
                              <div className="text-[10px] opacity-75 mt-0.5">
                                {cfg.difficulty?.hard ?? 20}% Hard · {cfg.time_minutes}m
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Subject / Title */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Subject / Examination Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="e.g. Advanced Calculus & Differential Equations"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-semibold"
                      required
                    />
                  </div>

                  {/* Questions Count & Total Marks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Number of Questions (1 – 25)
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={25}
                        value={nQuestions}
                        onChange={(e) => setNQuestions(parseInt(e.target.value) || 1)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                        Total Marks (10 – 500)
                      </label>
                      <input
                        type="number"
                        min={10}
                        max={500}
                        value={maxMarks}
                        onChange={(e) => setMaxMarks(parseInt(e.target.value) || 10)}
                        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 font-semibold"
                        required
                      />
                    </div>
                  </div>

                  {/* Unit / Topic Weights */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Unit / Topic Weights (JSON or Syllabus Distribution)
                    </label>
                    <textarea
                      rows={2}
                      value={unitWeights}
                      onChange={(e) => setUnitWeights(e.target.value)}
                      placeholder='{"Calculus & Rates": 35, "Surface Integrals": 35, "Differential Equations": 30}'
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Checkbox: Diagrams */}
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="includeDiagramsCheckbox"
                      checked={includeDiagrams}
                      onChange={(e) => setIncludeDiagrams(e.target.checked)}
                      className="w-4 h-4 mt-0.5 accent-indigo-600"
                    />
                    <label htmlFor="includeDiagramsCheckbox" className="text-xs text-gray-700 cursor-pointer">
                      <strong className="text-gray-900 block font-semibold">Generate Matplotlib Scientific Diagrams & Visuals</strong>
                      AI automatically generates executable Python Matplotlib code for 3D surfaces, 2D vector fields, and waveforms.
                    </label>
                  </div>

                  {/* Collapsible Overrides */}
                  <details className="group border border-gray-200 rounded-xl p-3 text-xs">
                    <summary className="font-bold text-gray-700 cursor-pointer flex items-center justify-between">
                      <span>⚙️ Advanced OpenRouter Model & API Overrides (Optional)</span>
                      <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform text-gray-400" />
                    </summary>
                    <div className="mt-3 space-y-3 pt-3 border-t border-gray-100">
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">
                          Model Identifier Override
                        </label>
                        <input
                          type="text"
                          value={overrideModel}
                          onChange={(e) => setOverrideModel(e.target.value)}
                          placeholder="nvidia/llama-nemotron-rerank-vl-1b-v2:free (Default)"
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">
                          OpenRouter API Key Override
                        </label>
                        <input
                          type="password"
                          value={overrideApiKey}
                          onChange={(e) => setOverrideApiKey(e.target.value)}
                          placeholder="sk-or-v1-..."
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>
                  </details>

                  {/* Status Banner */}
                  {genStatus && (
                    <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 mt-0.5 flex-shrink-0" />
                      <span className="font-medium">{genStatus}</span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setActiveStep(1)}
                      className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                      ← Back to Context
                    </button>

                    <button
                      type="submit"
                      disabled={generating || !examTitle.trim()}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-200 transition-all"
                    >
                      {generating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating Exam with AI...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Generate Examination with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Right 2 cols: Info & Blueprint Card */}
              <div className="lg:col-span-2 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3.5 shadow-2xs">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    AI Exam Pipeline Guarantee
                  </h4>
                  <div className="space-y-3 text-xs text-gray-600">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <p><strong>FAISS Retrieval:</strong> Automatically fetches indexed textbook theorems, learning targets, and formulas.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <p><strong>Strict Mark Summing:</strong> Guaranteed {maxMarks} total marks distributed accurately across {nQuestions} questions.</p>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <p><strong>Single-Pass Visual Engine:</strong> Scientific plots are rendered in milliseconds via local Python/Matplotlib sandbox.</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl text-white space-y-2 shadow-sm">
                  <p className="text-xs font-bold text-indigo-100">💡 Tip for Institute Faculty</p>
                  <p className="text-[11px] leading-relaxed text-white/90">
                    Once generated, questions can be individually refined using secondary teacher AI, reordered, edited inline with full KaTeX math support, and published to PowerPoint, PDF, Word, and LaTeX.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: QUESTION & PLOT STUDIO (WORKSPACE) */}
          {activeStep === 3 && (
            <div className="space-y-5">
              {/* Workspace Topbar */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-lg font-bold text-gray-900 truncate">
                      {currentExam ? currentExam.title : "Exam Paper Workspace"}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                      {questions.reduce((sum, q) => sum + (q.marks || 0), 0)} / {currentExam?.max_marks || maxMarks} Marks
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {questions.length} Questions · KaTeX LaTeX Math · Matplotlib Visualizations
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddNewQuestion}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveStep(4)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    <span>Proceed to Export</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Post-Generation Transparency Banner */}
              {latestTransparency && (
                <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                        Applied Blueprint Transparency Audit
                      </span>
                    </div>
                    <a
                      href="/institute/dashboard/control-hub"
                      className="text-xs font-bold text-indigo-300 hover:text-white flex items-center gap-1.5 px-3 py-1 bg-indigo-900/60 hover:bg-indigo-900 rounded-lg border border-indigo-700/50 transition-colors w-fit"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      <span>Open Full Audit Trail in Control Hub</span>
                      <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Difficulty Distribution</span>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span className="text-emerald-400">{latestTransparency.difficulty_distribution?.easy || 0}% Easy</span> ·
                        <span className="text-amber-400">{latestTransparency.difficulty_distribution?.medium || 0}% Med</span> ·
                        <span className="text-red-400">{latestTransparency.difficulty_distribution?.hard || 0}% Hard</span>
                      </div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Bloom&apos;s Levels</span>
                      <div className="font-bold text-slate-100 truncate">
                        {Object.keys(latestTransparency.bloom_coverage || {}).join(", ") || "Standard"}
                      </div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Diagrams Rendered</span>
                      <div className="font-bold text-slate-100">
                        {latestTransparency.diagram_count || 0} Plot(s) · Matplotlib
                      </div>
                    </div>
                    <div className="bg-slate-800/80 rounded-xl p-2.5 border border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold mb-1">Syllabus Coverage</span>
                      <div className="font-bold text-emerald-400">
                        {latestTransparency.syllabus_coverage_pct || 100}% FAISS Aligned
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Questions List or Empty State */}
              {questions.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center space-y-3">
                  <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mx-auto shadow-2xs">
                    <FileText className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-gray-900">No Exam Loaded in Workspace</h4>
                  <p className="text-xs text-gray-500 max-w-md mx-auto">
                    Go to <strong>Step 2 (Blueprint)</strong> to generate an exam, or load a previously generated exam from the <strong>Exam Archive</strong>.
                  </p>
                  <button
                    onClick={() => setActiveStep(2)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                  >
                    Go to Step 2: Blueprint
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {questions.map((q, idx) => {
                    const isEditing = editingQId === q.id;

                    return (
                      <div
                        key={q.id}
                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs hover:border-indigo-200 transition-all"
                      >
                        {/* Question Header */}
                        <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                              Q{idx + 1}
                            </span>
                            <span className="text-xs font-bold text-gray-700">Question #{idx + 1}</span>
                            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {q.marks} Marks
                            </span>
                            {q.difficulty && (
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                q.difficulty.toLowerCase() === "hard"
                                  ? "bg-red-50 text-red-700 border border-red-200"
                                  : q.difficulty.toLowerCase() === "medium"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}>
                                {q.difficulty}
                              </span>
                            )}
                            {q.bloom_level && (
                              <span className="hidden sm:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                                Bloom: {q.bloom_level}
                              </span>
                            )}
                            {q.question_type && (
                              <span className="hidden md:inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                                {q.question_type}
                              </span>
                            )}
                          </div>

                          {/* Action Toolbar */}
                          <div className="flex items-center gap-1">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              onClick={() => moveQuestion(idx, "up")}
                              disabled={idx === 0}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg disabled:opacity-30 transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveQuestion(idx, "down")}
                              disabled={idx === questions.length - 1}
                              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-lg disabled:opacity-30 transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>

                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            {/* Inline Edit Button */}
                            {!isEditing && (
                              <button
                                type="button"
                                onClick={() => startInlineEdit(q)}
                                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200/60 rounded-lg transition-colors"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>
                            )}

                            {/* AI Refine Button */}
                            <button
                              type="button"
                              onClick={() => setAiModalQuestion(q)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>AI Refine</span>
                            </button>

                            {/* Diagram Studio Button */}
                            <button
                              type="button"
                              onClick={() => setPlotStudioQuestion(q)}
                              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                              <span>{q.image_path ? "Edit Diagram" : "Add Diagram"}</span>
                            </button>

                            <div className="w-px h-4 bg-gray-200 mx-1" />

                            {/* Delete Question */}
                            <button
                              type="button"
                              onClick={() => handleDeleteQuestion(q.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Question"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Question Content */}
                        <div className="p-5 space-y-4">
                          {isEditing ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-3">
                                <div className="flex-1">
                                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                    Question Text (KaTeX LaTeX supported)
                                  </label>
                                  <textarea
                                    rows={4}
                                    value={editText}
                                    onChange={(e) => setEditText(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <div className="w-28">
                                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">
                                    Marks
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    max={100}
                                    value={editMarks}
                                    onChange={(e) => setEditMarks(parseInt(e.target.value) || 1)}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold text-center"
                                  />
                                </div>
                              </div>

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelInlineEdit}
                                  disabled={inlineSaving}
                                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveInlineEdit(q.id)}
                                  disabled={inlineSaving}
                                  className="flex items-center gap-1.5 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold"
                                >
                                  {inlineSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                  <span>Save Changes</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <LatexRenderer text={q.text} className="text-sm font-medium" />
                          )}

                          {/* Attached Diagram / Plot Section */}
                          {q.image_path && (
                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center gap-4">
                              <div
                                onClick={() => setImageZoomPath(q.image_path!)}
                                className="w-36 h-28 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden cursor-zoom-in group relative flex-shrink-0"
                              >
                                <img
                                  src={q.image_path.startsWith("http") || q.image_path.startsWith("/") ? q.image_path : `/${q.image_path}`}
                                  alt={`Diagram for Q${idx + 1}`}
                                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                                  <Eye className="w-4 h-4 mr-1" /> Zoom
                                </div>
                              </div>

                              <div className="flex-1 space-y-1.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-gray-800">Scientific Visualization Attached</span>
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                                    Matplotlib
                                  </span>
                                </div>
                                <p className="text-gray-500 text-[11px]">
                                  This diagram will be automatically rendered in PDF, PowerPoint (.pptx), and Word documents.
                                </p>
                                <div className="flex items-center gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setPlotStudioQuestion(q)}
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                                  >
                                    Edit in Plot Studio →
                                  </button>
                                  <span className="text-gray-300">·</span>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveImageInline(q.id)}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Remove Diagram
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: EXPORT & PUBLISH */}
          {activeStep === 4 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                      Publishing Studio
                    </span>
                    <h3 className="text-lg font-bold text-gray-900 mt-1">Export & Distribute Examination</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Download your exam paper in publication formats or print directly for classroom distribution.
                    </p>
                  </div>
                </div>

                {/* Export Status Toast */}
                {exportStatus && (
                  <div className="mb-4 p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900 flex items-center gap-2">
                    <Download className="w-4 h-4 text-indigo-600 animate-bounce" />
                    <span className="font-semibold">{exportStatus}</span>
                  </div>
                )}

                {/* Export Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {/* PPTX Export Card (Featured) */}
                  <div className="border-2 border-orange-200 bg-gradient-to-b from-orange-50/40 to-white rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
                          <Presentation className="w-5 h-5" />
                        </div>
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold uppercase">
                          16:9 Widescreen
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900">PowerPoint Deck (.pptx)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Publication-quality slides with standard mathematical equations, subject-specific formatting, blueprint tables, embedded diagrams, and examiner marking rubrics.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("pptx")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "pptx" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download PowerPoint (.pptx)</span>
                    </button>
                  </div>

                  {/* PDF Export Card */}
                  <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-2xs">
                        <FileText className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Adobe PDF Document</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Publication-ready PDF with university header, formatted question marks, page numbering, and embedded high-res Matplotlib diagrams.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("pdf")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "pdf" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download PDF</span>
                    </button>
                  </div>

                  {/* Word DOCX Export Card */}
                  <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-2xs">
                        <Layers className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Microsoft Word (.docx)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Fully editable Word document with clean mathematical formulas, styled tables, instructions, and centered plot figures.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("docx")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "docx" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download .DOCX</span>
                    </button>
                  </div>

                  {/* LaTeX Source Export Card */}
                  <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs">
                        <FileCode2 className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">LaTeX Source (.tex)</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Complete LaTeX markup using standard mathematical packages (amsmath, graphicx) ready for Overleaf or local TeX Live.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("tex")}
                      disabled={exportingFormat !== null || !currentExam}
                      className="w-full py-2.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      {exportingFormat === "tex" ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download .TEX</span>
                    </button>
                  </div>

                  {/* Direct Browser Print Card */}
                  <div className="border border-gray-200 bg-white rounded-2xl p-5 space-y-3.5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-shadow">
                    <div className="space-y-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-2xs">
                        <Printer className="w-5 h-5" />
                      </div>
                      <h4 className="text-base font-bold text-gray-900">Direct Browser Print</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Print directly to your local physical printer or save as clean paper exam format via browser print preview.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExport("print")}
                      disabled={!currentExam}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Exam Paper</span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveStep(3)}
                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    ← Back to Question Studio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 2: EXAM ARCHIVE & HISTORY                                     */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "history" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Exam Generation Archive</h3>
              <p className="text-xs text-gray-500">Previously generated exams stored in database</p>
            </div>
            <button
              onClick={fetchPastExams}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
              title="Refresh History"
            >
              <RefreshCw className={`w-4 h-4 ${historyLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {pastExams.length === 0 ? (
            <div className="p-12 text-center text-gray-400 space-y-2">
              <FolderOpen className="w-10 h-10 mx-auto text-gray-300" />
              <p className="text-sm font-semibold">No generated exams found</p>
              <p className="text-xs">Exams generated in the workflow will automatically appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {pastExams.map((exam) => (
                <div
                  key={exam.id}
                  className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/80 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-gray-900">{exam.title}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-indigo-50 text-indigo-700">
                        {exam.max_marks} Marks
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-600">
                        {exam.n_questions} Questions
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Generated on {new Date(exam.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleLoadExam(exam.id)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                    >
                      Open in Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────────── */}
      {/* TAB 3: PIPELINE ARCHITECTURE & GUIDE                              */}
      {/* ───────────────────────────────────────────────────────────────── */}
      {activeTab === "pipeline" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-6 shadow-2xs">
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                Model Architecture
              </span>
              <h3 className="text-lg font-bold text-gray-900 mt-1">Autonomous Exam Generation Pipeline</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                End-to-end overview of data processing, constraint verification, and mathematical rendering.
              </p>
            </div>

            <div className="space-y-4">
              {PIPELINE_STEPS.map(({ step, label, icon: Icon, desc }) => (
                <div key={step} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 font-bold text-xs shadow-2xs">
                      {step}
                    </div>
                    {step < PIPELINE_STEPS.length && <div className="w-0.5 h-8 bg-indigo-100 mt-1" />}
                  </div>
                  <div className="pt-0.5 pb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4 text-indigo-500" />
                      <p className="text-sm font-bold text-gray-900">{label}</p>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-2xs">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600" />
                Dense Vector Context Retrieval
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                ExaGo indexes all uploaded JSON syllabi, textbooks, and past examination papers into a high-dimensional FAISS embedding vector space. During question generation, relevant curriculum objectives and problem sets are semantically retrieved to guide the LLM.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-2 shadow-2xs">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                Single-Pass Matplotlib Visual Engine
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                Rather than generic image searches, the model outputs executable Python code specifications (`image_spec`) executed in an isolated local Matplotlib sandbox. 3D surfaces, 2D vector streams, and damping curves are rendered in milliseconds directly into the exam output.
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
              <p className="text-xs text-indigo-800 leading-relaxed">
                <strong>Publication Ready:</strong> Generated exams are immediately exportable to 16:9 PowerPoint (.pptx), print-ready PDF via ReportLab, Microsoft Word (.docx), and LaTeX (.tex) for academic archiving.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      {/* AI Edit Modal */}
      <AiEditModal
        question={aiModalQuestion}
        isOpen={aiModalQuestion !== null}
        onClose={() => setAiModalQuestion(null)}
        onSuccess={(updated) => {
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setAiModalQuestion(null);
        }}
        modelOverride={overrideModel}
        apiKeyOverride={overrideApiKey}
        apiBaseUrl={apiBaseUrl}
      />

      {/* Plot Studio Modal */}
      <PlotStudioModal
        question={plotStudioQuestion}
        isOpen={plotStudioQuestion !== null}
        onClose={() => setPlotStudioQuestion(null)}
        onSuccess={(updated) => {
          setQuestions((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
          setPlotStudioQuestion(null);
        }}
        modelOverride={overrideModel}
        apiKeyOverride={overrideApiKey}
        apiBaseUrl={apiBaseUrl}
      />

      {/* Image Zoom Modal */}
      {imageZoomPath && (
        <div
          onClick={() => setImageZoomPath(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-sm cursor-zoom-out"
        >
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-2xl p-2 shadow-2xl overflow-hidden">
            <button
              onClick={() => setImageZoomPath(null)}
              className="absolute top-4 right-4 p-2 bg-gray-900/60 text-white rounded-full hover:bg-gray-900 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={imageZoomPath.startsWith("http") || imageZoomPath.startsWith("/") ? imageZoomPath : `/${imageZoomPath}`}
              alt="Diagram Preview"
              className="max-h-[85vh] max-w-full object-contain rounded-xl"
            />
          </div>
        </div>
      )}

      {/* ── Hidden Print Container for Browser Printing ────────────────── */}
      <div className="hidden print:block print:p-8 space-y-6">
        <div className="text-center border-b-2 border-black pb-4">
          <h1 className="text-2xl font-black uppercase tracking-wide">{currentExam?.title || examTitle}</h1>
          <div className="flex justify-between text-sm font-bold mt-2">
            <span>Total Marks: {currentExam?.max_marks || maxMarks}</span>
            <span>Duration: 3 Hours</span>
            <span>No. of Questions: {questions.length}</span>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div key={q.id} className="space-y-3 pb-4 border-b border-gray-300">
              <div className="flex justify-between items-start font-bold">
                <span className="text-base">Q{idx + 1}.</span>
                <span className="text-sm">[{q.marks} Marks]</span>
              </div>
              <LatexRenderer text={q.text} className="text-sm leading-relaxed" />
              {q.image_path && (
                <div className="text-center py-2">
                  <img
                    src={q.image_path.startsWith("http") || q.image_path.startsWith("/") ? q.image_path : `/${q.image_path}`}
                    alt={`Plot for Q${idx + 1}`}
                    className="max-h-64 mx-auto object-contain"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
