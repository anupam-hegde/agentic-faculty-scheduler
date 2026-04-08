"use client";

import { useCallback, useEffect, useState } from "react";
import { RotateCw, ShieldCheck, Users, Workflow } from "lucide-react";

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

          <section className="mt-8 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 sm:px-5">
              <h2 className="text-lg font-semibold text-white">Live Master Timetable</h2>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs text-white/70">
                {timetable.length} assigned
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-white/[0.03] text-white/70">
                  <tr>
                    <th className="px-4 py-3 font-medium sm:px-5">Professor Name</th>
                    <th className="px-4 py-3 font-medium sm:px-5">Subject</th>
                    <th className="px-4 py-3 font-medium sm:px-5">Year</th>
                    <th className="px-4 py-3 font-medium sm:px-5">Section</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="border-t border-white/5">
                      <td colSpan={4} className="px-4 py-6 text-center text-white/65 sm:px-5">
                        Loading timetable...
                      </td>
                    </tr>
                  ) : timetable.length > 0 ? (
                    timetable.map((row) => (
                      <tr
                        key={row.session_id}
                        className="border-t border-white/5 text-white/85 transition hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-medium text-cyan-100 sm:px-5">
                          {row.professor_name}
                        </td>
                        <td className="px-4 py-3 sm:px-5">{row.subject_name}</td>
                        <td className="px-4 py-3 sm:px-5">Year {row.year}</td>
                        <td className="px-4 py-3 sm:px-5">{row.section}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-t border-white/5">
                      <td colSpan={4} className="px-4 py-6 text-center text-white/60 sm:px-5">
                        No assigned sessions available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </section>
      </main>
    </div>
  );
}
