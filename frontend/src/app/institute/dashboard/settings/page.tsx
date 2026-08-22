"use client";
import { useState } from "react";
import {
  Database, Link2, CheckCircle2, Shield, Bell,
  Cpu, RefreshCw, Trash2, Key, Globe, Users
} from "lucide-react";

const ERP_STEPS = [
  { n: 1, label: "Paste your ERP Base URL", input: "url" },
  { n: 2, label: "Generate API Token in ERP Admin → API Settings" },
  { n: 3, label: "Paste token & grant read permissions", input: "token" },
  { n: 4, label: "Confirm & sync student data" },
];

export default function SettingsPage() {
  const [erpConnected, setErpConnected] = useState(false);
  const [erpUrl, setErpUrl] = useState("");
  const [erpToken, setErpToken] = useState("");
  const [expandERP, setExpandERP] = useState(false);

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Settings</h2>
        <p className="text-sm text-gray-500 mt-0.5">Manage institute preferences, ERP integration, and access control</p>
      </div>

      {/* Institute Details */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-500" /> Institute Profile
        </h3>
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Institute Name", value: "MIT Academy of Engineering" },
            { label: "Type", value: "University / Autonomous" },
            { label: "Affiliation", value: "Savitribai Phule Pune University" },
            { label: "City, State", value: "Pune, Maharashtra" },
            { label: "ExaGo Plan", value: "Pro — NEP Compliant" },
            { label: "Account Since", value: "August 2024" },
          ].map(({ label, value }) => (
            <div key={label}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <input
                defaultValue={value}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          ))}
        </div>
        <button className="mt-4 text-sm font-semibold text-indigo-600 hover:text-indigo-800 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-4 py-2 rounded-xl transition-colors">
          Save Changes
        </button>
      </div>

      {/* ERP Integration */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Database className="w-4 h-4 text-indigo-500" /> ERP Integration
          </h3>
          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
              erpConnected ? "bg-green-50 text-green-700 border border-green-200" : "bg-gray-100 text-gray-400"
            }`}
          >
            {erpConnected ? "Connected" : "Not Connected"}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Connect your institution's existing ERP to auto-import student records, academic data, and extracurricular tracking.
          Supported: Fedena, TrackAcad, College ERP, custom REST APIs.
        </p>

        <button
          onClick={() => setExpandERP(!expandERP)}
          className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 mb-4"
        >
          <Link2 className="w-4 h-4" />
          {erpConnected ? "Manage ERP Connection" : "Connect ERP System"}
        </button>

        {expandERP && (
          <div className="space-y-3 border border-gray-100 rounded-xl p-4">
            {ERP_STEPS.map(({ n, label, input }) => (
              <div key={n} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">{n}</div>
                  <span className="text-sm font-medium text-gray-800">{label}</span>
                </div>
                {input === "url" && (
                  <input
                    type="url"
                    value={erpUrl}
                    onChange={(e) => setErpUrl(e.target.value)}
                    placeholder="https://erp.yourinstitute.ac.in"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm ml-8 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    style={{ width: "calc(100% - 2rem)" }}
                  />
                )}
                {input === "token" && (
                  <input
                    type="password"
                    value={erpToken}
                    onChange={(e) => setErpToken(e.target.value)}
                    placeholder="Paste API token"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setErpConnected(true)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" /> Test & Connect
              </button>
              {erpConnected && (
                <button
                  onClick={() => setErpConnected(false)}
                  className="flex items-center gap-2 text-sm font-medium text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Disconnect
                </button>
              )}
            </div>
          </div>
        )}

        {erpConnected && (
          <div className="flex items-center gap-2 mt-3 text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            ERP connected — Last synced: Today 8:30 AM · 1,248 students
            <button className="ml-auto flex items-center gap-1 font-semibold hover:text-green-900">
              <RefreshCw className="w-3 h-3" /> Sync Now
            </button>
          </div>
        )}
      </div>

      {/* Access Control */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4 text-indigo-500" /> Access Control
        </h3>
        <div className="space-y-3">
          {[
            { label: "Student can edit their own profile", enabled: true },
            { label: "Teachers can upload course documents", enabled: true },
            { label: "Teachers can generate exam drafts", enabled: false },
            { label: "Sub-admins can verify student data", enabled: true },
            { label: "Student input window (global)", enabled: true },
          ].map(({ label, enabled }, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{label}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${enabled ? "bg-indigo-500" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${enabled ? "left-5" : "left-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4 text-indigo-500" /> Notification Preferences
        </h3>
        <div className="space-y-3">
          {[
            { label: "New student onboarding requests", enabled: true },
            { label: "Verification queue updates", enabled: true },
            { label: "ERP sync alerts", enabled: false },
            { label: "Exam generated successfully", enabled: true },
          ].map(({ label, enabled }, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{label}</span>
              <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-all ${enabled ? "bg-indigo-500" : "bg-gray-200"}`}>
                <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm ${enabled ? "left-5" : "left-0.5"}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
