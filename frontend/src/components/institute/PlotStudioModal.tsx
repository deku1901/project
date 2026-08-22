"use client";

import React, { useState, useEffect } from "react";
import {
  Image as ImageIcon, X, Sparkles, Code2, FunctionSquare,
  Loader2, AlertCircle, CheckCircle2, Trash2, Eye, Play
} from "lucide-react";
import { getApiBaseUrl, safeFetchJson } from "@/lib/api";

interface Question {
  id: number;
  exam_id: number;
  q_index: number;
  text: string;
  marks: number;
  image_path?: string | null;
  image_spec_json?: string | null;
}

interface PlotStudioModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedQuestion: Question) => void;
  modelOverride?: string;
  apiKeyOverride?: string;
  apiBaseUrl?: string;
}

const CODE_TEMPLATES: Record<string, { label: string; code: string }> = {
  surface_3d: {
    label: "3D Surface Plot (Viridis)",
    code: `x = np.linspace(-3, 3, 50)
y = np.linspace(-3, 3, 50)
X, Y = np.meshgrid(x, y)
Z = np.sin(np.sqrt(X**2 + Y**2))

ax = fig.add_subplot(111, projection='3d')
surf = ax.plot_surface(X, Y, Z, cmap='viridis', edgecolor='none', alpha=0.9)
fig.colorbar(surf, ax=ax, shrink=0.5, aspect=10)
ax.set_title('3D Surface: z = sin(sqrt(x^2 + y^2))')
ax.set_xlabel('X axis')
ax.set_ylabel('Y axis')
ax.set_zlabel('Z axis')`,
  },
  vector_field: {
    label: "2D Vector Field & Streamlines",
    code: `x = np.linspace(-4, 4, 25)
y = np.linspace(-4, 4, 25)
X, Y = np.meshgrid(x, y)
U = -Y / (X**2 + Y**2 + 0.1)
V =  X / (X**2 + Y**2 + 0.1)

ax = fig.add_subplot(111)
ax.quiver(X, Y, U, V, color='royalblue', scale=30)
ax.set_title('Rotational Vector Field F(x,y) = (-y, x)')
ax.set_xlabel('x')
ax.set_ylabel('y')
ax.set_aspect('equal')
ax.grid(True, linestyle='--', alpha=0.5)`,
  },
  damped_oscillator: {
    label: "Damped Harmonic Oscillation",
    code: `t = np.linspace(0, 15, 400)
gamma = 0.3
omega = 2.5
x = np.exp(-gamma * t) * np.cos(omega * t)
env_pos = np.exp(-gamma * t)
env_neg = -np.exp(-gamma * t)

ax = fig.add_subplot(111)
ax.plot(t, x, 'b-', lw=2, label='Displacement x(t)')
ax.plot(t, env_pos, 'r--', alpha=0.7, label='Envelope e^{-γt}')
ax.plot(t, env_neg, 'r--', alpha=0.7)
ax.axhline(0, color='gray', lw=0.5)
ax.set_title('Underdamped Harmonic Oscillator: x(t) = e^{-γt} cos(ωt)')
ax.set_xlabel('Time t (s)')
ax.set_ylabel('Displacement x')
ax.legend(loc='upper right')
ax.grid(True, alpha=0.4)`,
  },
  gaussian_stats: {
    label: "Probability Density & Normal Distribution",
    code: `mu, sigma = 0, 1.0
x = np.linspace(-4, 4, 300)
y = (1 / (sigma * np.sqrt(2 * np.pi))) * np.exp(-0.5 * ((x - mu) / sigma)**2)

ax = fig.add_subplot(111)
ax.plot(x, y, 'purple', lw=2.5, label='Standard Normal N(0, 1)')
ax.fill_between(x, y, color='purple', alpha=0.2)
ax.axvline(mu, color='black', linestyle=':', label='Mean μ=0')
ax.axvline(mu + sigma, color='red', linestyle='--', alpha=0.7, label='μ ± 1σ')
ax.axvline(mu - sigma, color='red', linestyle='--', alpha=0.7)
ax.set_title('Probability Density Function N(μ, σ²)')
ax.set_xlabel('Random Variable X')
ax.set_ylabel('Density f(x)')
ax.legend()
ax.grid(True, alpha=0.3)`,
  },
  bode_plot: {
    label: "Frequency Response / Bode Magnitude",
    code: `w = np.logspace(-1, 3, 500)
w0 = 10.0
zeta = 0.2
# Second order system H(s) = w0^2 / (s^2 + 2*zeta*w0*s + w0^2)
s = 1j * w
H = (w0**2) / (s**2 + 2 * zeta * w0 * s + w0**2)
mag_db = 20 * np.log10(np.abs(H))

ax = fig.add_subplot(111)
ax.semilogx(w, mag_db, 'darkgreen', lw=2)
ax.axvline(w0, color='crimson', linestyle='--', label=f'Resonance w0={w0} rad/s')
ax.set_title('Bode Magnitude Response (2nd-Order Resonant Filter)')
ax.set_xlabel('Frequency ω (rad/s)')
ax.set_ylabel('Magnitude (dB)')
ax.legend()
ax.grid(True, which='both', linestyle=':', alpha=0.6)`,
  },
};

export default function PlotStudioModal({
  question,
  isOpen,
  onClose,
  onSuccess,
  modelOverride = "",
  apiKeyOverride = "",
  apiBaseUrl = "",
}: PlotStudioModalProps) {
  const [tab, setTab] = useState<"ai" | "code" | "math">("ai");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tab 1: AI Prompt
  const [aiPrompt, setAiPrompt] = useState("");

  // Tab 2: Python code
  const [selectedTemplate, setSelectedTemplate] = useState("surface_3d");
  const [pythonCode, setPythonCode] = useState(CODE_TEMPLATES.surface_3d.code);

  // Tab 3: Math formula
  const [mathExpr, setMathExpr] = useState("sin(2*x) * exp(-0.15*x)");
  const [mathXMin, setMathXMin] = useState("-6");
  const [mathXMax, setMathXMax] = useState("6");
  const [mathTitle, setMathTitle] = useState("Waveform Amplitude over Time");

  // Stage state
  const [stagedImagePath, setStagedImagePath] = useState<string | null>(null);
  const [stagedCode, setStagedCode] = useState<string | null>(null);
  const [statusBadge, setStatusBadge] = useState<string>("Ready");

  useEffect(() => {
    if (question) {
      setStagedImagePath(question.image_path || null);
      setStagedCode(question.image_spec_json || null);
      setStatusBadge(question.image_path ? "Existing Diagram Attached" : "Ready");
      setError(null);
    }
  }, [question, isOpen]);

  if (!isOpen || !question) return null;

  const handleTemplateChange = (tmplKey: string) => {
    setSelectedTemplate(tmplKey);
    if (CODE_TEMPLATES[tmplKey]) {
      setPythonCode(CODE_TEMPLATES[tmplKey].code);
    }
  };

  // Generate Plot via AI
  const handleGenerateAi = async () => {
    if (!aiPrompt.trim()) {
      setError("Please describe the diagram or visualization to generate.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusBadge("Generating with AI...");

    try {
      const formData = new FormData();
      formData.append("question_id", question.id.toString());
      formData.append("prompt", aiPrompt.trim());
      if (modelOverride.trim()) formData.append("model", modelOverride.trim());
      if (apiKeyOverride.trim()) formData.append("api_key", apiKeyOverride.trim());

      const base = apiBaseUrl !== undefined && apiBaseUrl !== null && apiBaseUrl !== "" ? apiBaseUrl : getApiBaseUrl();
      const url = `${base}/api/generate_plot`;
      const result = await safeFetchJson(url, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error(result.error || "Failed to generate plot via AI.");
      }

      const data = result.data;
      setStagedImagePath(data.image_path);
      setStagedCode(data.code || null);
      setStatusBadge("✨ Generated with AI");

      if (data.question) {
        onSuccess(data.question);
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate visual plot.");
      setStatusBadge("Error");
    } finally {
      setLoading(false);
    }
  };

  // Run Python Code
  const handleRunCode = async () => {
    if (!pythonCode.trim()) {
      setError("Please write or select Python Matplotlib code.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusBadge("Executing Python Code...");

    try {
      const formData = new FormData();
      formData.append("question_id", question.id.toString());
      formData.append("code", pythonCode.trim());

      const base = apiBaseUrl !== undefined && apiBaseUrl !== null && apiBaseUrl !== "" ? apiBaseUrl : getApiBaseUrl();
      const url = `${base}/api/generate_plot`;
      const result = await safeFetchJson(url, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error(result.error || "Matplotlib execution error.");
      }

      const data = result.data;
      setStagedImagePath(data.image_path);
      setStagedCode(data.code || null);
      setStatusBadge("⚡ Rendered from Code");

      if (data.question) {
        onSuccess(data.question);
      }
    } catch (err: any) {
      setError(err.message || "Matplotlib execution failed.");
      setStatusBadge("Error");
    } finally {
      setLoading(false);
    }
  };

  // Render Math Formula
  const handleRenderMath = async () => {
    if (!mathExpr.trim()) {
      setError("Please enter a mathematical expression.");
      return;
    }

    setLoading(true);
    setError(null);
    setStatusBadge("Rendering Math Formula...");

    try {
      const formData = new FormData();
      formData.append("question_id", question.id.toString());
      formData.append("function_expr", mathExpr.trim());
      formData.append("x_min", (parseFloat(mathXMin) || -10).toString());
      formData.append("x_max", (parseFloat(mathXMax) || 10).toString());
      if (mathTitle.trim()) formData.append("plot_title", mathTitle.trim());

      const base = apiBaseUrl !== undefined && apiBaseUrl !== null && apiBaseUrl !== "" ? apiBaseUrl : getApiBaseUrl();
      const url = `${base}/api/generate_plot`;
      const result = await safeFetchJson(url, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error(result.error || "Failed to render formula.");
      }

      const data = result.data;
      setStagedImagePath(data.image_path);
      setStagedCode(data.code || null);
      setStatusBadge("📐 Rendered Formula");

      if (data.question) {
        onSuccess(data.question);
      }
    } catch (err: any) {
      setError(err.message || "Failed to render formula.");
      setStatusBadge("Error");
    } finally {
      setLoading(false);
    }
  };

  // Remove Diagram from Question
  const handleRemovePlot = async () => {
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("question_id", question.id.toString());

      const base = apiBaseUrl !== undefined && apiBaseUrl !== null && apiBaseUrl !== "" ? apiBaseUrl : getApiBaseUrl();
      const url = `${base}/api/question/remove_image`;
      const result = await safeFetchJson(url, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error(result.error || "Failed to remove image.");
      }

      setStagedImagePath(null);
      setStagedCode(null);
      setStatusBadge("Diagram Removed");

      onSuccess({
        ...question,
        image_path: null,
        image_spec_json: null,
      });
    } catch (err: any) {
      setError(err.message || "Failed to remove image.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50/50 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Matplotlib Visual & Diagram Studio</h3>
              <p className="text-xs text-gray-500">Question #{question.q_index} · {question.marks} Marks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body: Split View (Left: Input tabs, Right: Live Stage) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-100 flex-1 overflow-hidden">
          {/* Left Panel: Generator Controls */}
          <div className="p-5 flex flex-col overflow-y-auto space-y-4">
            {/* Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
              {[
                { key: "ai", label: "AI Prompt", icon: Sparkles },
                { key: "code", label: "Python Code", icon: Code2 },
                { key: "math", label: "Math Formula", icon: FunctionSquare },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTab(key as any)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    tab === key
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab 1: AI Prompt Plotter */}
            {tab === "ai" && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Visual Diagram Description
                  </label>
                  <textarea
                    rows={4}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Create a 3D surface plot of z = x^2 * y + x * y^2 with viridis colormap and labeled axes, showing the point (1,2)."
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none font-mono"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-semibold text-gray-400">Quick Diagram Presets:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: "3D Saddle Surface", text: "Create a 3D hyperbolic paraboloid saddle surface z = x^2 - y^2 with coolwarm colormap." },
                      { label: "2D Vector Field", text: "Plot a 2D rotational vector field F(x,y) = (-y, x) with streamline arrows and title." },
                      { label: "Damped Oscillation", text: "Plot damped sinusoidal oscillation x(t) = exp(-0.2*t)*cos(3*t) with envelope bounds." },
                      { label: "Contour Potential", text: "Plot filled contour lines for potential function V(x,y) = x^2 - y^2 with gradient vector arrows." },
                    ].map(({ label, text }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setAiPrompt(text)}
                        className="text-[11px] bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-2 py-1 rounded-lg transition-colors"
                      >
                        ⚡ {label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleGenerateAi}
                  disabled={loading || !aiPrompt.trim()}
                  className="mt-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Generate Plot via AI
                </button>
              </div>
            )}

            {/* Tab 2: Python Code Editor */}
            {tab === "code" && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Template:
                  </label>
                  <select
                    value={selectedTemplate}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-indigo-500"
                  >
                    {Object.entries(CODE_TEMPLATES).map(([k, v]) => (
                      <option key={k} value={k}>{v.label}</option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={8}
                  value={pythonCode}
                  onChange={(e) => setPythonCode(e.target.value)}
                  spellCheck={false}
                  className="w-full p-3 bg-gray-900 text-green-400 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none flex-1 leading-relaxed"
                  disabled={loading}
                />

                <button
                  type="button"
                  onClick={handleRunCode}
                  disabled={loading || !pythonCode.trim()}
                  className="mt-auto flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-green-400" />}
                  Execute & Render Code
                </button>
              </div>
            )}

            {/* Tab 3: Math Formula */}
            {tab === "math" && (
              <div className="space-y-3 flex-1 flex flex-col">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                    Function Expression y = f(x)
                  </label>
                  <input
                    type="text"
                    value={mathExpr}
                    onChange={(e) => setMathExpr(e.target.value)}
                    placeholder="e.g. sin(2*x) * exp(-0.15*x)"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">X Min</label>
                    <input
                      type="number"
                      value={mathXMin}
                      onChange={(e) => setMathXMin(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">X Max</label>
                    <input
                      type="number"
                      value={mathXMax}
                      onChange={(e) => setMathXMax(e.target.value)}
                      className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-mono"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Plot Title</label>
                  <input
                    type="text"
                    value={mathTitle}
                    onChange={(e) => setMathTitle(e.target.value)}
                    placeholder="e.g. Waveform Amplitude"
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-xl text-xs"
                    disabled={loading}
                  />
                </div>

                <button
                  type="button"
                  onClick={handleRenderMath}
                  disabled={loading || !mathExpr.trim()}
                  className="mt-auto flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition-colors"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FunctionSquare className="w-3.5 h-3.5" />}
                  Render Mathematical Plot
                </button>
              </div>
            )}

            {/* Error display */}
            {error && (
              <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="break-all">{error}</span>
              </div>
            )}
          </div>

          {/* Right Panel: Live Stage Preview */}
          <div className="p-5 flex flex-col bg-gray-50/50 justify-between">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-500" /> Live Plot Stage
              </span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 bg-white border border-gray-200 text-gray-600 rounded-full shadow-2xs">
                {statusBadge}
              </span>
            </div>

            {/* Stage Viewport */}
            <div className="flex-1 min-h-[220px] bg-white rounded-xl border border-gray-200 p-2 flex items-center justify-center overflow-hidden relative shadow-inner">
              {stagedImagePath ? (
                <img
                  src={stagedImagePath.startsWith("http") || stagedImagePath.startsWith("/") ? stagedImagePath : `/${stagedImagePath}`}
                  alt="Rendered Scientific Plot"
                  className="max-h-full max-w-full object-contain rounded-lg transition-transform hover:scale-105 duration-200"
                />
              ) : (
                <div className="text-center p-6 text-gray-400 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto text-gray-300 stroke-[1.5]" />
                  <p className="text-xs font-medium">No diagram generated yet</p>
                  <p className="text-[10px] text-gray-400">Use AI prompt, Python code, or a formula to render a plot.</p>
                </div>
              )}
            </div>

            {/* Stage Footer Controls */}
            <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-gray-200/60">
              {stagedImagePath && (
                <button
                  type="button"
                  onClick={handleRemovePlot}
                  disabled={loading}
                  className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl transition-colors font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Plot
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="ml-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 rounded-xl transition-colors shadow-2xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
