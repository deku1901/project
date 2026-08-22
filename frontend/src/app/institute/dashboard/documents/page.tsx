"use client";
import { useState } from "react";
import {
  Upload, FileText, BookOpen, Target, Calendar,
  CheckCircle2, Clock, Trash2, Eye, Plus
} from "lucide-react";

type DocCategory = "mission-vision" | "course-objectives" | "exam-structure" | "calendar" | "guidelines";

const CATEGORIES: { key: DocCategory; label: string; icon: React.ElementType; color: string; desc: string }[] = [
  { key: "mission-vision", label: "Mission & Vision", icon: Target, color: "indigo", desc: "Institute goals and overall philosophy — aligned to NEP 2020" },
  { key: "course-objectives", label: "Course Objectives (CO)", icon: BookOpen, color: "blue", desc: "Subject-wise course outcomes and program objectives" },
  { key: "exam-structure", label: "Exam Structure", icon: FileText, color: "violet", desc: "Paper patterns, mark distribution, question types" },
  { key: "calendar", label: "Academic Calendar", icon: Calendar, color: "green", desc: "Schedule, exam dates, events, deadlines" },
  { key: "guidelines", label: "General Guidelines", icon: CheckCircle2, color: "orange", desc: "Institute policies, rubrics, evaluation norms" },
];

const DOCS = [
  { id: 1, name: "Institute Mission & Vision 2024.pdf", category: "mission-vision" as DocCategory, uploaded: "Aug 15, 2024", size: "245 KB", status: "processed" },
  { id: 2, name: "B.Tech CSE Course Objectives Sem 3.pdf", category: "course-objectives" as DocCategory, uploaded: "Aug 10, 2024", size: "1.2 MB", status: "processed" },
  { id: 3, name: "SPPU Exam Pattern 2024-25.pdf", category: "exam-structure" as DocCategory, uploaded: "Aug 8, 2024", size: "380 KB", status: "processed" },
  { id: 4, name: "Academic Calendar AY 2024-25.pdf", category: "calendar" as DocCategory, uploaded: "Jul 30, 2024", size: "520 KB", status: "processing" },
  { id: 5, name: "Evaluation Guidelines and Rubrics.docx", category: "guidelines" as DocCategory, uploaded: "Aug 1, 2024", size: "92 KB", status: "processed" },
];

const COLORMAP: Record<string, string> = {
  indigo: "bg-indigo-50 text-indigo-600",
  blue: "bg-blue-50 text-blue-600",
  violet: "bg-violet-50 text-violet-600",
  green: "bg-green-50 text-green-600",
  orange: "bg-orange-50 text-orange-600",
};

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<DocCategory | "all">("all");
  const [docs, setDocs] = useState(DOCS);

  const filtered = selectedCategory === "all" ? docs : docs.filter((d) => d.category === selectedCategory);
  const removeDoc = (id: number) => setDocs((d) => d.filter((doc) => doc.id !== id));
  const addMockDoc = (cat: DocCategory) =>
    setDocs((d) => [
      ...d,
      {
        id: Date.now(), name: `New Document (${cat}).pdf`, category: cat,
        uploaded: "Just now", size: "—", status: "processing",
      },
    ]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Context Documents</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          Upload institute context — all documents are OCR-processed and fed into the exam generation engine
        </p>
      </div>

      {/* NEP Banner */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-start gap-3">
        <BookOpen className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-indigo-800">
          <strong>NEP 2020 Aligned:</strong> ExaGo uses Course Outcomes (COs), Program Outcomes (POs), and Bloom's Taxonomy levels from your uploaded documents to generate contextually relevant, competency-mapped examinations.
        </p>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-5 gap-3">
        {CATEGORIES.map(({ key, label, icon: Icon, color, desc }) => {
          const count = docs.filter((d) => d.category === key).length;
          return (
            <div
              key={key}
              className={`border rounded-xl p-4 cursor-pointer transition-all ${
                selectedCategory === key
                  ? "border-indigo-300 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
              onClick={() => setSelectedCategory(selectedCategory === key ? "all" : key)}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${COLORMAP[color]}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="text-xs font-bold text-gray-900 mb-1">{label}</div>
              <div className="text-[10px] text-gray-400 mb-2 leading-tight">{desc}</div>
              <div className="text-lg font-bold text-gray-900">{count}</div>
              <div className="text-[10px] text-gray-400">documents</div>
            </div>
          );
        })}
      </div>

      {/* Upload Zone + Document List */}
      <div className="grid grid-cols-5 gap-5">
        {/* Upload Zone */}
        <div className="col-span-2 space-y-3">
          <div
            onClick={() => addMockDoc(selectedCategory !== "all" ? selectedCategory : "course-objectives")}
            className="border-2 border-dashed border-gray-300 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-all"
          >
            <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
              <Upload className="w-5 h-5 text-gray-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-700">Upload Document</p>
              <p className="text-xs text-gray-400 mt-1">PDF, DOCX, JPG, PNG<br />OCR will extract and index content</p>
            </div>
          </div>

          {/* Category quick upload */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Quick Upload By Category</p>
            <div className="space-y-1.5">
              {CATEGORIES.map(({ key, label, icon: Icon, color }) => (
                <button
                  key={key}
                  onClick={() => addMockDoc(key)}
                  className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-600 font-medium transition-colors"
                >
                  <div className={`w-6 h-6 rounded-md flex items-center justify-center ${COLORMAP[color]}`}>
                    <Icon className="w-3 h-3" />
                  </div>
                  {label}
                  <Plus className="w-3 h-3 ml-auto text-gray-300" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Document List */}
        <div className="col-span-3 bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
            <span className="text-sm font-bold text-gray-900">
              {selectedCategory === "all" ? "All Documents" : CATEGORIES.find((c) => c.key === selectedCategory)?.label}
            </span>
            <span className="text-xs text-gray-400">{filtered.length} files</span>
          </div>
          <div className="divide-y divide-gray-50">
            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No documents in this category</p>
              </div>
            )}
            {filtered.map(({ id, name, category, uploaded, size, status }) => {
              const cat = CATEGORIES.find((c) => c.key === category);
              return (
                <div key={id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cat ? COLORMAP[cat.color] : "bg-gray-100 text-gray-400"}`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                    <p className="text-xs text-gray-400">{uploaded} · {size}</p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                      status === "processed" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    {status === "processed" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                    {status}
                  </span>
                  <div className="flex gap-1">
                    <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                    </button>
                    <button onClick={() => removeDoc(id)} className="p-1.5 hover:bg-red-50 rounded-lg">
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
