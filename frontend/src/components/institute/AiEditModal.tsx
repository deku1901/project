"use client";

import React, { useState } from "react";
import { Sparkles, X, Loader2, AlertCircle } from "lucide-react";
import LatexRenderer from "@/components/shared/LatexRenderer";
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

interface AiEditModalProps {
  question: Question | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedQuestion: Question) => void;
  modelOverride?: string;
  apiKeyOverride?: string;
  apiBaseUrl?: string;
}

export default function AiEditModal({
  question,
  isOpen,
  onClose,
  onSuccess,
  modelOverride = "",
  apiKeyOverride = "",
  apiBaseUrl = "",
}: AiEditModalProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !question) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError("Please provide modification instructions.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("question_id", question.id.toString());
      formData.append("edit_prompt", prompt.trim());
      if (modelOverride.trim()) formData.append("model", modelOverride.trim());
      if (apiKeyOverride.trim()) formData.append("api_key", apiKeyOverride.trim());

      const base = apiBaseUrl !== undefined && apiBaseUrl !== null && apiBaseUrl !== "" ? apiBaseUrl : getApiBaseUrl();
      const url = `${base}/api/edit_question`;
      const result = await safeFetchJson(url, {
        method: "POST",
        body: formData,
      });

      if (!result.ok) {
        throw new Error(result.error || "Failed to refine question with AI.");
      }

      const data = result.data;
      if (data.question) {
        onSuccess(data.question);
        setPrompt("");
        onClose();
      } else if (data.text) {
        onSuccess({ ...question, text: data.text });
        setPrompt("");
        onClose();
      } else {
        throw new Error("Unexpected response from AI refinement.");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">AI Question Refinement</h3>
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Current Question preview */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Current Question Text
            </label>
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 text-sm max-h-40 overflow-y-auto">
              <LatexRenderer text={question.text} />
            </div>
          </div>

          {/* Teacher Instruction Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
              Teacher Modification Instruction
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Change point to (3,-1), ask for directional derivative in unit vector format, or increase academic rigor."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-gray-400 resize-none"
              disabled={loading}
              autoFocus
            />
          </div>

          {/* Quick presets */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-gray-400">Quick Prompt Suggestions:</span>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Increase mathematical rigor and formal proof requirement",
                "Split into 2 structured sub-parts (a) and (b)",
                "Change numerical constants for fresh variation",
                "Add step-by-step justification requirement",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setPrompt(suggestion)}
                  className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-600 text-gray-600 px-2.5 py-1 rounded-lg transition-colors text-left"
                >
                  + {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-xs text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-200 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Refining with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Apply AI Refinement</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
