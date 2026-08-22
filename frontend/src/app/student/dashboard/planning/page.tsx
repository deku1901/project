"use client";
import { useState } from "react";
import {
  CheckSquare, Square, Plus, Target, Calendar,
  Clock, X, TrendingUp, CheckCircle2, AlertCircle
} from "lucide-react";

type Priority = "high" | "medium" | "low";
type Task = { id: number; text: string; done: boolean; priority: Priority; due: string };

const PRIORITY_STYLE: Record<Priority, string> = {
  high: "bg-red-50 text-red-600 border-red-200",
  medium: "bg-amber-50 text-amber-600 border-amber-200",
  low: "bg-green-50 text-green-600 border-green-200",
};

const INITIAL_TASKS: Task[] = [
  { id: 1, text: "Complete DSA Module 4 — Trees & Graphs", done: false, priority: "high", due: "Today" },
  { id: 2, text: "Upload Semester 3 marksheet for verification", done: false, priority: "high", due: "Today" },
  { id: 3, text: "Finish Kaggle ML micro-course Chapter 3", done: true, priority: "medium", due: "Yesterday" },
  { id: 4, text: "Add LeetCode connector to profile", done: false, priority: "medium", due: "This week" },
  { id: 5, text: "Read DBMS notes before Saturday quiz", done: false, priority: "low", due: "Sat, 24 Aug" },
  { id: 6, text: "Solve 5 chess puzzles (mind game streak)", done: true, priority: "low", due: "Yesterday" },
];

const GOALS = [
  { title: "Achieve 90+ Learning State Score", progress: 84, due: "Dec 2024", status: "on-track" },
  { title: "Complete NPTEL Data Science Course", progress: 45, due: "Oct 2024", status: "on-track" },
  { title: "Get 10 GitHub Connectors verified", progress: 30, due: "Nov 2024", status: "at-risk" },
  { title: "Clear 3 institute-level verifications", progress: 67, due: "Sep 2024", status: "on-track" },
];

const UPCOMING = [
  { title: "Semester 4 Exam Schedule", date: "Dec 1–15, 2024", type: "exam" },
  { title: "NPTEL Assignment Deadline", date: "Sep 30, 2024", type: "deadline" },
  { title: "Institute Hackathon", date: "Oct 12, 2024", type: "event" },
  { title: "Learning State Review", date: "Sep 25, 2024", type: "review" },
];

export default function PlanningPage() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_TASKS);
  const [newTask, setNewTask] = useState("");
  const [tab, setTab] = useState<"tasks" | "goals" | "calendar">("tasks");

  const toggleTask = (id: number) =>
    setTasks((t) => t.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));

  const removeTask = (id: number) => setTasks((t) => t.filter((task) => task.id !== id));

  const addTask = () => {
    if (!newTask.trim()) return;
    setTasks((t) => [
      ...t,
      { id: Date.now(), text: newTask, done: false, priority: "medium", due: "This week" },
    ]);
    setNewTask("");
  };

  const pending = tasks.filter((t) => !t.done).length;
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Planning</h2>
          <p className="text-sm text-gray-500 mt-0.5">Your goals, tasks, and upcoming schedule</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-bold text-gray-900">{pending}</div>
            <div className="text-xs text-gray-500">Pending</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center">
            <div className="text-lg font-bold text-green-600">{done}</div>
            <div className="text-xs text-gray-500">Done</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: "tasks", label: "📋 To-Do List" },
          { key: "goals", label: "🎯 Goals" },
          { key: "calendar", label: "📅 Upcoming" },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              tab === key ? "bg-white text-indigo-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tasks Tab */}
      {tab === "tasks" && (
        <div className="space-y-4">
          {/* Add task */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Add a new task…"
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              onClick={addTask}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Task list */}
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {tasks.map(({ id, text, done, priority, due }) => (
              <div key={id} className={`flex items-center gap-3 px-5 py-3.5 ${done ? "opacity-50" : ""}`}>
                <button onClick={() => toggleTask(id)} className="flex-shrink-0">
                  {done ? (
                    <CheckSquare className="w-5 h-5 text-indigo-500" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-300" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-sm font-medium ${
                      done ? "line-through text-gray-400" : "text-gray-800"
                    }`}
                  >
                    {text}
                  </span>
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[priority]}`}>
                  {priority}
                </span>
                <span className="text-xs text-gray-400 flex items-center gap-1 flex-shrink-0">
                  <Clock className="w-3 h-3" /> {due}
                </span>
                <button
                  onClick={() => removeTask(id)}
                  className="flex-shrink-0 p-1 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 text-gray-300 hover:text-red-400" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Goals Tab */}
      {tab === "goals" && (
        <div className="space-y-4">
          {GOALS.map(({ title, progress, due, status }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <Target className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
                  <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  {status === "on-track" ? (
                    <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                      <CheckCircle2 className="w-3 h-3" /> On Track
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      <AlertCircle className="w-3 h-3" /> At Risk
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> {progress}% complete
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Due {due}
                </span>
              </div>

              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    status === "on-track" ? "bg-indigo-500" : "bg-amber-400"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Calendar Tab */}
      {tab === "calendar" && (
        <div className="space-y-3">
          {UPCOMING.map(({ title, date, type }) => (
            <div key={title} className="flex items-center gap-4 bg-white rounded-2xl border border-gray-200 px-5 py-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  type === "exam"
                    ? "bg-red-50 text-red-500"
                    : type === "deadline"
                    ? "bg-amber-50 text-amber-500"
                    : type === "event"
                    ? "bg-indigo-50 text-indigo-500"
                    : "bg-green-50 text-green-500"
                }`}
              >
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-900">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{date}</p>
              </div>
              <span
                className={`text-xs font-bold uppercase px-2.5 py-1 rounded-full ${
                  type === "exam"
                    ? "bg-red-50 text-red-500"
                    : type === "deadline"
                    ? "bg-amber-50 text-amber-600"
                    : type === "event"
                    ? "bg-indigo-50 text-indigo-600"
                    : "bg-green-50 text-green-600"
                }`}
              >
                {type}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
