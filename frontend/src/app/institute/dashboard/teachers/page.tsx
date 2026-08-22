"use client";
import { useState } from "react";
import { Plus, BookOpen, Mail, Phone, Shield, Trash2, Edit2 } from "lucide-react";

const TEACHERS = [
  { id: 1, name: "Prof. Anil Sharma", subject: "Data Structures & Algorithms", email: "sharma@mitaoe.ac.in", phone: "+91 98765 00001", role: "Subject Head", docsUploaded: 4 },
  { id: 2, name: "Dr. Meena Kulkarni", subject: "Database Management Systems", email: "mkulkarni@mitaoe.ac.in", phone: "+91 98765 00002", role: "Faculty", docsUploaded: 2 },
  { id: 3, name: "Prof. Raj Joshi", subject: "Operating Systems", email: "rjoshi@mitaoe.ac.in", phone: "+91 98765 00003", role: "Faculty", docsUploaded: 1 },
  { id: 4, name: "Dr. Sunita Patil", subject: "Machine Learning", email: "spatil@mitaoe.ac.in", phone: "+91 98765 00004", role: "HOD", docsUploaded: 6 },
  { id: 5, name: "Prof. Vikram Desai", subject: "Computer Networks", email: "vdesai@mitaoe.ac.in", phone: "+91 98765 00005", role: "Faculty", docsUploaded: 2 },
];

const ROLE_STYLE: Record<string, string> = {
  HOD: "bg-indigo-50 text-indigo-600 border-indigo-200",
  "Subject Head": "bg-violet-50 text-violet-600 border-violet-200",
  Faculty: "bg-gray-100 text-gray-500 border-gray-200",
};

export default function TeachersPage() {
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
          <p className="text-sm text-gray-500 mt-0.5">{TEACHERS.length} faculty members · Manage subjects and permissions</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Teacher
        </button>
      </div>

      {/* Add Form (collapsible) */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 max-w-lg">
          <h3 className="font-bold text-gray-900 mb-4">Add New Teacher</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Full Name", placeholder: "Prof. Anil Sharma", col: 2 },
              { label: "Email", placeholder: "faculty@institute.edu" },
              { label: "Phone", placeholder: "+91 98765 43210" },
              { label: "Subject", placeholder: "Data Structures" },
              { label: "Role", placeholder: "HOD / Subject Head / Faculty" },
            ].map(({ label, placeholder, col }) => (
              <div key={label} className={col === 2 ? "col-span-2" : ""}>
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  placeholder={placeholder}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-4">
            <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2 rounded-xl transition-colors">
              Add Teacher
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Teacher Cards */}
      <div className="grid grid-cols-2 gap-4">
        {TEACHERS.map(({ id, name, subject, email, phone, role, docsUploaded }) => (
          <div key={id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-indigo-200 hover:shadow-sm transition-all">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ROLE_STYLE[role] || ROLE_STYLE.Faculty}`}>
                    {role}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-1.5 hover:bg-gray-100 rounded-lg">
                  <Edit2 className="w-3.5 h-3.5 text-gray-400" />
                </button>
                <button className="p-1.5 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
              <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
              <span className="font-medium text-gray-700">{subject}</span>
            </div>

            <div className="space-y-1 mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Mail className="w-3 h-3" /> {email}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Phone className="w-3 h-3" /> {phone}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <BookOpen className="w-3 h-3" />
                <span>{docsUploaded} course documents uploaded</span>
              </div>
              <button className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                <Shield className="w-3 h-3" /> Permissions
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
