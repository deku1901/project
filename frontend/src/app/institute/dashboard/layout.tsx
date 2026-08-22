"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, FileText,
  Cpu, Settings, LogOut, Bell, ChevronRight, Building2, Menu, X,
  SlidersHorizontal
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/institute/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/institute/dashboard/students", icon: GraduationCap, label: "Students" },
  { href: "/institute/dashboard/teachers", icon: Users, label: "Teachers" },
  { href: "/institute/dashboard/documents", icon: FileText, label: "Context Documents" },
  { href: "/institute/dashboard/exam", icon: Cpu, label: "Exam Generation" },
  { href: "/institute/dashboard/control-hub", icon: SlidersHorizontal, label: "Control Hub" },
  { href: "/institute/dashboard/settings", icon: Settings, label: "Settings" },
];

export default function InstituteDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifCount] = useState(5);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on path change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const currentPage = NAV_ITEMS.find((n) => n.href === pathname)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar Overlay backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-gray-900/40 z-30 lg:hidden transition-opacity duration-300"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`w-64 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col fixed top-0 left-0 h-full z-40 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-gray-900 font-bold text-base">ExaGo</span>
              <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wide">Institute</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Institute card */}
        <div className="mx-3 mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">MIT AOE</p>
              <p className="text-xs text-gray-500 truncate">Dr. Suresh Sharma · Admin</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Management</p>
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3">
          <button
            onClick={() => {
              setSidebarOpen(false);
              router.push("/login");
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-gray-500" />
            </button>
            <div>
              <h1 className="text-base font-bold text-gray-900">{currentPage}</h1>
              <p className="text-xs text-gray-400" suppressHydrationWarning>
                MIT Academy of Engineering · {new Date().toLocaleDateString("en-IN", {
                  weekday: "long", day: "numeric", month: "long", year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors">
              <Bell className="w-4 h-4 text-gray-500" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {notifCount}
                </span>
              )}
            </button>
            <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              SS
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 overflow-y-auto min-w-0">{children}</main>
      </div>
    </div>
  );
}
