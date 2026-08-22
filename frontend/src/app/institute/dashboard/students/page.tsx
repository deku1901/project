"use client";
import { useState } from "react";
import {
  Search, Plus, Upload, CheckCircle2, AlertCircle,
  Clock, Filter, Download, Eye, MoreHorizontal,
  GraduationCap, Trash2, ChevronDown, Toggle
} from "lucide-react";

type VerifyStatus = "verified" | "pending" | "unverified";

const STUDENTS = [
  { id: 1, name: "Jayesh Patil", rollNo: "CS2401", course: "B.Tech CSE", year: "SY", stateScore: 84, status: "verified" as VerifyStatus, joined: "Aug 2024" },
  { id: 2, name: "Priya Deshmukh", rollNo: "CS2402", course: "B.Tech CSE", year: "SY", stateScore: 78, status: "verified" as VerifyStatus, joined: "Aug 2024" },
  { id: 3, name: "Rahul Kulkarni", rollNo: "CS2403", course: "B.Tech CSE", year: "SY", stateScore: 62, status: "pending" as VerifyStatus, joined: "Aug 2024" },
  { id: 4, name: "Sneha Joshi", rollNo: "CS2404", course: "B.Tech CSE", year: "SY", stateScore: 90, status: "verified" as VerifyStatus, joined: "Aug 2024" },
  { id: 5, name: "Amol Shinde", rollNo: "CS2405", course: "B.Tech CSE", year: "SY", stateScore: 55, status: "unverified" as VerifyStatus, joined: "Aug 2024" },
  { id: 6, name: "Kavya Rao", rollNo: "CS2406", course: "B.Tech CSE", year: "TY", stateScore: 71, status: "pending" as VerifyStatus, joined: "Jul 2023" },
  { id: 7, name: "Rohan Mehta", rollNo: "CS2407", course: "B.Tech IT", year: "FY", stateScore: 45, status: "unverified" as VerifyStatus, joined: "Aug 2024" },
];

const STATUS_STYLE: Record<VerifyStatus, string> = {
  verified: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  unverified: "bg-gray-100 text-gray-500 border-gray-200",
};

const STATUS_ICON: Record<VerifyStatus, React.ElementType> = {
  verified: CheckCircle2,
  pending: Clock,
  unverified: AlertCircle,
};

export default function StudentsPage() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | VerifyStatus>("all");
  const [inputWindowOpen, setInputWindowOpen] = useState(true);
  const [tab, setTab] = useState<"list" | "add" | "bulk">("list");

  const filtered = STUDENTS.filter((s) => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNo.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filterStatus === "all" || s.status === filterStatus;
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Student Management</h2>
          <p className="text-sm text-gray-500 mt-0.5">{STUDENTS.length} students enrolled · {STUDENTS.filter(s => s.status === "pending").length} pending verification</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Input Window Toggle */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${inputWindowOpen ? "bg-green-50 border-green-200 text-green-700" : "bg-gray-100 border-gray-200 text-gray-500"}`}>
            <div className={`w-2 h-2 rounded-full ${inputWindowOpen ? "bg-green-500" : "bg-gray-400"}`} />
            <span>Student Input {inputWindowOpen ? "Open" : "Closed"}</span>
            <button
              onClick={() => setInputWindowOpen(!inputWindowOpen)}
              className={`ml-1 w-8 h-4 rounded-full relative transition-all ${inputWindowOpen ? "bg-green-400" : "bg-gray-300"}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${inputWindowOpen ? "left-4" : "left-0.5"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: "list", label: "Student List" },
          { key: "add", label: "+ Add Student" },
          { key: "bulk", label: "⬆ Bulk Import" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Student List */}
      {tab === "list" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          {/* Filters */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name or roll no…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div className="flex gap-1 bg-gray-50 p-0.5 rounded-lg border border-gray-200">
              {(["all", "verified", "pending", "unverified"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterStatus(f)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${filterStatus === f ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500"}`}
                >
                  {f}
                </button>
              ))}
            </div>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 border border-gray-200 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Student</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Roll No</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Course</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">State Score</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Verification</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(({ id, name, rollNo, course, year, stateScore, status }) => {
                  const Icon = STATUS_ICON[status];
                  return (
                    <tr key={id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                            {name.split(" ").map((n) => n[0]).join("")}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{name}</p>
                            <p className="text-xs text-gray-400">{year}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{rollNo}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{course}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-16">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${stateScore}%` }} />
                          </div>
                          <span className="text-sm font-bold text-gray-900">{stateScore}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${STATUS_STYLE[status]}`}>
                          <Icon className="w-3 h-3" /> {status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1">
                          <button className="p-1.5 hover:bg-indigo-50 rounded-lg transition-colors" title="View profile">
                            <Eye className="w-3.5 h-3.5 text-gray-400 hover:text-indigo-600" />
                          </button>
                          {status !== "verified" && (
                            <button className="p-1.5 hover:bg-green-50 rounded-lg transition-colors" title="Verify">
                              <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 hover:text-green-600" />
                            </button>
                          )}
                          <button className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                            <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-gray-400">
                <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No students found</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student */}
      {tab === "add" && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
          <h3 className="font-bold text-gray-900 mb-4">Add Student Manually</h3>
          <div className="space-y-3">
            {[
              { label: "Full Name", placeholder: "Jayesh Patil" },
              { label: "Roll Number", placeholder: "CS2401" },
              { label: "Email", placeholder: "jayesh@college.edu" },
              { label: "Course", placeholder: "B.Tech Computer Engineering" },
              { label: "Year", placeholder: "2nd Year (SY)" },
            ].map(({ label, placeholder }) => (
              <div key={label}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            ))}
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors mt-2 flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> Add Student
            </button>
          </div>
        </div>
      )}

      {/* Bulk Import */}
      {tab === "bulk" && (
        <div className="space-y-4 max-w-lg">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-2">Bulk Import via Excel / CSV</h3>
            <p className="text-sm text-gray-500 mb-4">
              Download the template, fill in student data, and upload the file. OCR is supported for scanned sheets.
            </p>
            <div className="flex gap-3 mb-5">
              <button className="flex items-center gap-2 text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
                <Download className="w-4 h-4" /> Download Template
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 hover:border-indigo-400 rounded-xl p-10 text-center cursor-pointer transition-colors hover:bg-indigo-50/30">
              <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-600">Click to upload .xlsx or .csv</p>
              <p className="text-xs text-gray-400 mt-1">Max 5MB · Up to 2000 rows</p>
            </div>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-800 font-medium">
              ⚠️ You can also connect your ERP system for automatic imports from the Institute Settings page.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
