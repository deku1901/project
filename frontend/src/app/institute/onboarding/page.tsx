"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, ArrowLeft, CheckCircle2, Building2, Users,
  Database, BookOpen, Link2, FileText, Cpu
} from "lucide-react";

const STEPS = [
  { id: 1, label: "Institute Details" },
  { id: 2, label: "Admin Setup" },
  { id: 3, label: "ERP Connect" },
  { id: 4, label: "Review" },
];

const ERP_STEPS = [
  { step: 1, title: "Paste your ERP Base URL", desc: "The root URL of your institution's ERP system (e.g., https://erp.mitaoe.ac.in)" },
  { step: 2, title: "Generate API Token in ERP", desc: "In your ERP admin panel, navigate to API Settings → Create Token with read-only student access." },
  { step: 3, title: "Paste Token & Fetch Permissions", desc: "Paste the token here. ExaGo will request only: student list, academic records, and extracurricular data." },
  { step: 4, title: "Confirm & Sync", desc: "Review which data will be synced. Click Confirm to start the initial import — usually takes 2–5 minutes." },
];

export default function InstituteOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [erpExpanded, setErpExpanded] = useState<number | null>(1);

  const [form, setForm] = useState({
    instituteName: "", type: "", affiliation: "", city: "", state: "",
    adminName: "", adminEmail: "", adminPhone: "", adminRole: "",
    erpUrl: "", erpToken: "",
  });
  const updateForm = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const finish = () => router.push("/institute/dashboard");

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <span className="text-gray-900 font-bold text-lg">ExaGo</span>
          <span className="ml-2 text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
            Institute Setup
          </span>
        </div>
        <button onClick={() => router.push("/login")} className="text-sm text-gray-500 hover:text-gray-700">
          Exit
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center py-10 px-4">
        {/* Step Indicator */}
        <div className="w-full max-w-2xl mb-10">
          <div className="flex items-center">
            {STEPS.map((s, i) => (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      step > s.id ? "bg-green-500 text-white" :
                      step === s.id ? "bg-indigo-600 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step > s.id ? <CheckCircle2 className="w-4 h-4" /> : s.id}
                  </div>
                  <span className={`text-xs font-medium ${step === s.id ? "text-indigo-600" : "text-gray-400"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-4 ${step > s.id ? "bg-indigo-500" : "bg-gray-200"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
          </div>
        </div>

        {/* Card */}
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-200 shadow-sm">

          {/* Step 1: Institute Details */}
          {step === 1 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Institute Details</h2>
                  <p className="text-sm text-gray-500">Basic information about your institution</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "instituteName", label: "Institution Name", placeholder: "MIT Academy of Engineering", col: 2 },
                  { key: "type", label: "Type", placeholder: "University / College / School" },
                  { key: "affiliation", label: "Affiliation / Board", placeholder: "Savitribai Phule Pune University" },
                  { key: "city", label: "City", placeholder: "Pune" },
                  { key: "state", label: "State", placeholder: "Maharashtra" },
                ].map(({ key, label, placeholder, col }) => (
                  <div key={key} className={col === 2 ? "col-span-2" : ""}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type="text"
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Admin Setup */}
          {step === 2 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Admin Account</h2>
                  <p className="text-sm text-gray-500">The primary administrator for your institution</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  { key: "adminName", label: "Full Name", placeholder: "Dr. Suresh Sharma" },
                  { key: "adminEmail", label: "Official Email", placeholder: "principal@mitaoe.ac.in", type: "email" },
                  { key: "adminPhone", label: "Phone", placeholder: "+91 98765 43210", type: "tel" },
                  { key: "adminRole", label: "Designation", placeholder: "Principal / HOD / Exam Controller" },
                ].map(({ key, label, placeholder, type = "text" }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                    <input
                      type={type}
                      value={form[key as keyof typeof form]}
                      onChange={(e) => updateForm(key, e.target.value)}
                      placeholder={placeholder}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                ))}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                  <p className="text-xs text-blue-700 font-medium">
                    You can add more admins, teachers, and sub-admins after completing setup from the Institute Dashboard.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: ERP Connect */}
          {step === 3 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                  <Cpu className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">ERP Integration</h2>
                  <p className="text-sm text-gray-500">Skip this if you don't have an ERP system — you can always import data manually</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mb-6 mt-3">
                <Database className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-700">Supported ERP systems: Fedena, TrackAcad, College ERP, custom REST APIs</span>
              </div>

              {/* Step-by-step guide */}
              <div className="space-y-3">
                {ERP_STEPS.map(({ step: s, title, desc }) => (
                  <div key={s} className="border border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setErpExpanded(erpExpanded === s ? null : s)}
                      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        erpExpanded === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-500"
                      }`}>
                        {s}
                      </div>
                      <span className="text-sm font-semibold text-gray-800 text-left flex-1">{title}</span>
                    </button>
                    {erpExpanded === s && (
                      <div className="px-4 pb-4">
                        <p className="text-sm text-gray-500 mb-3 ml-10">{desc}</p>
                        {s === 1 && (
                          <div className="ml-10">
                            <input
                              type="url"
                              value={form.erpUrl}
                              onChange={(e) => updateForm("erpUrl", e.target.value)}
                              placeholder="https://erp.yourinstitute.ac.in"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        )}
                        {s === 3 && (
                          <div className="ml-10">
                            <input
                              type="password"
                              value={form.erpToken}
                              onChange={(e) => updateForm("erpToken", e.target.value)}
                              placeholder="Paste API token here"
                              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-3">
                <button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Link2 className="w-4 h-4" /> Test Connection
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 px-4"
                >
                  Skip for now →
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Review & Activate</h2>
                  <p className="text-sm text-gray-500">Your institute account will be created on activation</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  {
                    title: "Institute Details",
                    items: [
                      { label: "Name", value: form.instituteName || "—" },
                      { label: "Type", value: form.type || "—" },
                      { label: "Location", value: `${form.city || "—"}, ${form.state || "—"}` },
                    ],
                  },
                  {
                    title: "Admin Account",
                    items: [
                      { label: "Admin", value: form.adminName || "—" },
                      { label: "Email", value: form.adminEmail || "—" },
                      { label: "Role", value: form.adminRole || "—" },
                    ],
                  },
                  {
                    title: "ERP Integration",
                    items: [{ label: "Status", value: form.erpUrl ? "Configured" : "Skipped" }],
                  },
                ].map(({ title, items }) => (
                  <div key={title} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
                      <span className="text-xs font-bold text-gray-600 uppercase tracking-wide">{title}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {items.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-gray-500">{label}</span>
                          <span className="text-sm font-medium text-gray-800">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                  <p className="text-sm text-indigo-800 font-medium">
                    🏫 Your institute dashboard will be activated immediately. You can begin adding students, teachers, and course documents right away.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 py-5 border-t border-gray-100">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : router.push("/login")}
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="w-4 h-4" /> {step === 1 ? "Back to Login" : "Previous"}
            </button>
            <div className="text-xs text-gray-400">Step {step} of {STEPS.length}</div>
            {step < STEPS.length ? (
              <button
                onClick={() => setStep(step + 1)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
              >
                <CheckCircle2 className="w-4 h-4" /> Activate Institute
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
