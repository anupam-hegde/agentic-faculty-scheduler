"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Bot, Sparkles, Workflow, Users } from "lucide-react";
import Link from "next/link";

import CanvasBackground from "@/components/CanvasBackground";

type TimetableData = Record<string, number[]>;

type SessionInfo = {
  id: number;
  subject: string;
  year: number;
  section: string;
};

type ScheduleRow = {
  id: number;
  subject: string;
  section: string;
  professor: string;
};

const SESSION_CATALOG: SessionInfo[] = [
  { id: 1, subject: "Intro to Python", year: 1, section: "A" },
  { id: 2, subject: "Intro to Python", year: 1, section: "B" },
  { id: 3, subject: "Data Structures", year: 2, section: "A" },
  { id: 4, subject: "Data Structures", year: 2, section: "B" },
  { id: 5, subject: "Machine Learning", year: 3, section: "A" },
  { id: 6, subject: "Machine Learning", year: 3, section: "B" },
];

const SESSION_LOOKUP = new Map<number, SessionInfo>(
  SESSION_CATALOG.map((session) => [session.id, session]),
);

export default function Page() {
  const [apiKey, setApiKey] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [selectedProf, setSelectedProf] = useState("Dr. Sharma");
  const [loading, setLoading] = useState(false);
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Initialize from sessionStorage to prevent data loss on tab switch
  useEffect(() => {
    const savedApiKey = sessionStorage.getItem("apan_apiKey");
    if (savedApiKey) setApiKey(savedApiKey);

    const savedPrompt = sessionStorage.getItem("apan_customPrompt");
    if (savedPrompt) setCustomPrompt(savedPrompt);

    const savedProf = sessionStorage.getItem("apan_selectedProf");
    if (savedProf) setSelectedProf(savedProf);

    const savedTimetableData = sessionStorage.getItem("apan_timetableData");
    if (savedTimetableData) {
      try {
        setTimetableData(JSON.parse(savedTimetableData));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save to sessionStorage when values change
  useEffect(() => {
    sessionStorage.setItem("apan_apiKey", apiKey);
  }, [apiKey]);

  useEffect(() => {
    sessionStorage.setItem("apan_customPrompt", customPrompt);
  }, [customPrompt]);

  useEffect(() => {
    sessionStorage.setItem("apan_selectedProf", selectedProf);
  }, [selectedProf]);

  useEffect(() => {
    if (timetableData) {
      sessionStorage.setItem("apan_timetableData", JSON.stringify(timetableData));
    }
  }, [timetableData]);

  const groupedSchedule = useMemo(() => {
    const buckets: Record<number, ScheduleRow[]> = { 1: [], 2: [], 3: [] };

    if (!timetableData) {
      return buckets;
    }

    Object.entries(timetableData).forEach(([professor, sessionIds]) => {
      sessionIds.forEach((sessionId) => {
        const details = SESSION_LOOKUP.get(sessionId);
        if (!details) {
          return;
        }
        buckets[details.year].push({
          id: details.id,
          subject: details.subject,
          section: details.section,
          professor,
        });
      });
    });

    return buckets;
  }, [timetableData]);

  const runNegotiation = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const trimmedPrompt = customPrompt.trim();
      const response = await fetch("http://localhost:8000/api/negotiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey.trim() ? { "X-NVIDIA-API-Key": apiKey.trim() } : {}),
        },
        body: JSON.stringify({
          nvidia_api_key: apiKey.trim(),
          custom_backstories: trimmedPrompt
            ? { [selectedProf]: trimmedPrompt }
            : {},
        }),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload.detail ?? "Negotiation failed.");
      }

      const data = await response.json();
      const parsedTimetable = (data.timetable ?? data) as TimetableData;
      setTimetableData(parsedTimetable);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error.";
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      <CanvasBackground />

      <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_18%_12%,rgba(95,243,255,0.2),transparent_35%),radial-gradient(circle_at_82%_78%,rgba(159,116,255,0.18),transparent_35%)]" />

      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="w-full max-w-6xl rounded-3xl border border-white/20 bg-white/10 shadow-[0_30px_140px_rgba(0,0,0,0.62)] backdrop-blur-md"
        >
          <header className="border-b border-white/15 px-6 py-6 sm:px-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-200/30 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                  <Sparkles className="h-3.5 w-3.5" />
                  Agentic Timetable Intelligence
                </div>
                <h1 className="text-2xl font-semibold sm:text-3xl">Project APAN: Agentic Allocation</h1>
                <p className="mt-2 max-w-3xl text-sm text-white/75">
                  Live multi-agent negotiation engine for university timetable assignment with
                  workload-safe validation.
                </p>
              </div>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/15 w-fit">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors bg-white/10 text-cyan-100 shadow-md"
                >
                  Teacher Portal
                </button>
                <Link
                  href="/hod"
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-white/60 hover:text-white/90 hover:bg-white/5"
                >
                  HOD Dashboard
                </Link>
              </div>
            </div>
          </header>

          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[380px,1fr]">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12, duration: 0.45 }}
              className="rounded-2xl border border-white/15 bg-black/30 p-5"
            >
              <div className="mb-4 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white/80">
                  <Bot className="mx-auto mb-1 h-4 w-4" />
                  3 Agents
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white/80">
                  <Workflow className="mx-auto mb-1 h-4 w-4" />
                  Sequential
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-white/80">
                  <Sparkles className="mx-auto mb-1 h-4 w-4" />
                  Smart Rules
                </div>
              </div>

              <label htmlFor="nvidia-key" className="mb-2 block text-sm font-medium text-white/90">
                NVIDIA API Key
              </label>
              <input
                id="nvidia-key"
                type="password"
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                placeholder="Paste your API key"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-xl border border-white/20 bg-black/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30"
              />

              <div className="mt-4 rounded-2xl border border-white/15 bg-black/30 p-4">
                <h3 className="text-sm font-semibold text-cyan-100">Talk to Your Proxy Agent</h3>
                <p className="mt-1 text-xs text-white/70">
                  Add professor-specific preferences before the swarm starts negotiating.
                </p>

                <label
                  htmlFor="professor-select"
                  className="mt-3 mb-2 block text-xs font-medium tracking-wide text-cyan-100/90"
                >
                  Professor Login
                </label>
                <select
                  id="professor-select"
                  value={selectedProf}
                  onChange={(event) => setSelectedProf(event.target.value)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30"
                >
                  <option value="Dr. Sharma">Dr. Sharma</option>
                  <option value="Dr. Verma">Dr. Verma</option>
                  <option value="Dr. Rao">Dr. Rao</option>
                </select>

                <label
                  htmlFor="agent-intake"
                  className="mt-3 mb-2 block text-xs font-medium tracking-wide text-cyan-100/90"
                >
                  Intake Message
                </label>
                <textarea
                  id="agent-intake"
                  value={customPrompt}
                  onChange={(event) => setCustomPrompt(event.target.value)}
                  placeholder="E.g., I absolutely need to teach Data Structures Section A, and I cannot do morning classes..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/45 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/30"
                />
              </div>

              <button
                type="button"
                onClick={runNegotiation}
                disabled={loading}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-cyan-300/70 ${
                  loading
                    ? "cursor-not-allowed bg-cyan-100/70 text-slate-900"
                    : "animate-pulse bg-gradient-to-r from-cyan-300 to-blue-200 text-slate-950 hover:-translate-y-0.5 hover:from-cyan-200 hover:to-blue-100"
                }`}
              >
                Initialize Swarm Negotiation
              </button>

              {loading && (
                <div className="mt-4 flex items-center gap-3 rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-3 py-2 text-sm text-cyan-100">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-200 border-t-transparent" />
                  <span>AI Agents Debating Preferences...</span>
                </div>
              )}

              {errorMessage && (
                <p className="mt-4 rounded-xl border border-red-300/35 bg-red-900/25 px-3 py-2 text-sm text-red-100">
                  {errorMessage}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.16, duration: 0.45 }}
              className="space-y-4"
            >
              {[1, 2, 3].map((year, idx) => (
                <motion.article
                  key={year}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + idx * 0.07, duration: 0.35 }}
                  className="overflow-hidden rounded-2xl border border-white/15 bg-black/30"
                >
                  <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                    <h2 className="text-lg font-semibold text-white">Year {year}</h2>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-xs text-white/70">
                      {groupedSchedule[year].length} sessions
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-white/5 text-white/70">
                        <tr>
                          <th className="px-4 py-2 font-medium">Section</th>
                          <th className="px-4 py-2 font-medium">Subject</th>
                          <th className="px-4 py-2 font-medium">Assigned To</th>
                          <th className="px-4 py-2 font-medium">Session ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {groupedSchedule[year].length > 0 ? (
                          groupedSchedule[year].map((row) => (
                            <tr
                              key={row.id}
                              className="border-t border-white/10 text-white/90 odd:bg-white/[0.025]"
                            >
                              <td className="px-4 py-2">{row.section}</td>
                              <td className="px-4 py-2">{row.subject}</td>
                              <td className="px-4 py-2">{row.professor}</td>
                              <td className="px-4 py-2">{row.id}</td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-t border-white/10 text-white/55">
                            <td colSpan={4} className="px-4 py-4 text-center">
                              {timetableData
                                ? "No allocation for this year."
                                : "Awaiting negotiation output."}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.article>
              ))}
            </motion.div>
          </div>
        </motion.section>
      </main>
    </div>
  );
}
