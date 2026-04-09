"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCw, ShieldCheck, Users, Workflow } from "lucide-react";

import Link from "next/link";
import CanvasBackground from "@/components/CanvasBackground";

type TimetableRow = {
  session_id: number;
  subject_name: string;
  year: number;
  section: string;
  professor_name: string;
};

export default function HODPage() {
  const [timetable, setTimetable] = useState<TimetableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTimetable = useCallback(async (manualRefresh = false) => {
    if (manualRefresh) {
      setRefreshing(true);
    }

    try {
      const response = await fetch("http://localhost:8000/api/timetable");
      if (!response.ok) {
        throw new Error("Failed to fetch timetable");
      }

      const data = await response.json();
      setTimetable(Array.isArray(data) ? data : []);
    } catch {
      setTimetable([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchTimetable();
  }, [fetchTimetable]);

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <CanvasBackground />
      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_14%_16%,rgba(95,243,255,0.18),transparent_36%),radial-gradient(circle_at_84%_76%,rgba(59,130,246,0.16),transparent_36%)]" />

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-8 sm:px-8">
        <section className="rounded-3xl border border-white/10 bg-black/40 p-6 shadow-[0_30px_120px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">
                Administrative Intelligence Layer
              </p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">HOD Command Center</h1>
              <p className="mt-2 text-sm text-white/70">
                Live oversight of AI-driven faculty allocation and compliance health.
              </p>
            </div>

            <div className="flex bg-black/40 p-1 rounded-xl border border-white/15 w-fit">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white/60 hover:text-white/90 hover:bg-white/5"
              >
                Teacher Portal
              </Link>
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-white/10 text-cyan-100 shadow-md"
              >
                HOD Dashboard
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => void fetchTimetable(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-black/30 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-cyan-300/40 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <RotateCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh Live Data
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Total Faculty Active</p>
                <Users className="h-4 w-4 text-cyan-200/90" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">3</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">AI Compliance Status</p>
                <ShieldCheck className="h-4 w-4 text-cyan-200/90" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">100%</p>
              <p className="text-xs text-cyan-100">Optimal</p>
            </article>

            <article className="rounded-2xl border border-white/10 bg-black/30 p-4 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-white/70">Unassigned Sessions</p>
                <Workflow className="h-4 w-4 text-cyan-200/90" />
              </div>
              <p className="mt-3 text-3xl font-semibold text-white">0</p>
            </article>
          </div>

          <section className="mt-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-semibold text-white">Live Master Timetable</h2>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70 backdrop-blur-md">
                {timetable.length} assigned
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-white/65">
                Loading timetable...
              </div>
            ) : timetable.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(
                  timetable.reduce((acc, row) => {
                    const key = `Year ${row.year} - Section ${row.section}`;
                    if (!acc[key]) acc[key] = [];
                    acc[key].push(row);
                    return acc;
                  }, {} as Record<string, typeof timetable>)
                ).map(([groupKey, sessions]) => (
                  <div
                    key={groupKey}
                    className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/30 shadow-lg backdrop-blur-md"
                  >
                    <div className="bg-white/[0.03] border-b border-white/10 px-5 py-3">
                      <h3 className="font-semibold text-cyan-200">{groupKey}</h3>
                    </div>
                    <div className="flex-1 p-5">
                      <ul className="space-y-3">
                        {sessions.map((session) => (
                          <li
                            key={session.session_id}
                            className="group relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] p-4 transition hover:bg-white/[0.06]"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400/30 transition-colors group-hover:bg-cyan-400"></div>
                            <div className="flex flex-col gap-1">
                              <span className="text-sm font-medium text-white/90">
                                {session.subject_name}
                              </span>
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <Users className="h-3 w-3 text-cyan-200/50" />
                                <span>{session.professor_name || "Unassigned"}</span>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/30 p-10 text-center text-white/60">
                No assigned sessions available.
              </div>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
