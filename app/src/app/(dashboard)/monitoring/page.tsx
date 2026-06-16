"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Plus,
  Trash2,
  Clock,
  Globe,
  Github,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  RefreshCw
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

interface ScanHistoryEntry {
  id: string;
  security_score: number;
  created_at: string;
}

interface ScheduledScan {
  id: string;
  target_url: string;
  target_type: "url" | "github_repo";
  frequency: "daily" | "weekly";
  last_run: string | null;
  next_run: string;
  is_active: boolean;
  history?: ScanHistoryEntry[];
  latestScore?: number | null;
}

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

export default function MonitoringPage() {
  const [monitors, setMonitors] = useState<ScheduledScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const supabase = createClient();

  // Form State
  const [targetUrl, setTargetUrl] = useState("");
  const [targetType, setTargetType] = useState<"url" | "github_repo">("url");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");

  const fetchMonitors = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: monitorsData } = await supabase
      .from("scheduled_scans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (monitorsData) {
      const { data: scansData } = await supabase
        .from("scans")
        .select("id, target_url, security_score, created_at, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const monitorsWithHistory = monitorsData.map((monitor: any) => {
        const history = scansData
          ?.filter((s) => s.target_url === monitor.target_url && s.status === 'completed')
          .slice(0, 10)
          .reverse() || [];
        
        const latestScore = history.length > 0 ? history[history.length - 1].security_score : null;

        return {
          ...monitor,
          history,
          latestScore
        };
      });

      setMonitors(monitorsWithHistory);
    }
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMonitors();
    }, 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const nextRun = new Date();
    if (frequency === "daily") {
      nextRun.setDate(nextRun.getDate() + 1);
    } else {
      nextRun.setDate(nextRun.getDate() + 7);
    }

    const { error } = await supabase.from("scheduled_scans").insert({
      user_id: user.id,
      target_url: targetUrl,
      target_type: targetType,
      frequency,
      next_run: nextRun.toISOString(),
      is_active: true,
    });

    if (error) {
      alert("Failed to add monitor");
    } else {
      setIsAdding(false);
      setTargetUrl("");
      fetchMonitors();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this monitor?")) return;
    await supabase.from("scheduled_scans").delete().eq("id", id);
    fetchMonitors();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from("scheduled_scans")
      .update({ is_active: !currentStatus })
      .eq("id", id);
      
    if (!error) {
      fetchMonitors();
    }
  };

  const [runningScans, setRunningScans] = useState<Record<string, boolean>>({});

  const handleRunNow = async (monitor: ScheduledScan) => {
    setRunningScans(prev => ({ ...prev, [monitor.id]: true }));
    try {
      const endpoint = monitor.target_type === "url" ? "/api/scan" : "/api/scan/github";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: monitor.target_url }),
      });

      if (response.ok) {
        await supabase
          .from("scheduled_scans")
          .update({ last_run: new Date().toISOString() })
          .eq("id", monitor.id);
          
        fetchMonitors();
      } else {
        alert("Scan failed to run.");
      }
    } catch (e) {
      alert("Error triggering scan.");
    } finally {
      setRunningScans(prev => ({ ...prev, [monitor.id]: false }));
    }
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={stagger}
      className="max-w-6xl mx-auto space-y-8"
    >
      <motion.div variants={fadeUp} className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Activity className="w-8 h-8 text-accent-cyan" /> Real-Time Monitoring
          </h1>
          <p className="text-text-secondary">
            Schedule automated scans to continuously monitor your assets for vulnerabilities.
          </p>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Monitor
        </button>
      </motion.div>

      {/* Add Monitor Form */}
      {isAdding && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          onSubmit={handleAddMonitor}
          className="glass-card p-6 border-accent-cyan/30 overflow-hidden"
        >
          <h2 className="text-lg font-semibold mb-4">Create New Monitor</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-text-secondary mb-1">Target URL or Repo</label>
              <div className="relative">
                {targetType === "url" ? (
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                ) : (
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                )}
                <input
                  type="url"
                  required
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder={targetType === "url" ? "Enter website URL" : "Enter GitHub repository URL"}
                  className="input-field !pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Type</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value as "url" | "github_repo")}
                className="input-field appearance-none"
              >
                <option value="url">Website URL</option>
                <option value="github_repo">GitHub Repo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as "daily" | "weekly")}
                className="input-field appearance-none"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex gap-3 justify-end">
            <button type="button" onClick={() => setIsAdding(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Save Monitor
            </button>
          </div>
        </motion.form>
      )}

      {/* Monitors List */}
      <motion.div variants={fadeUp} className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
             <div className="w-8 h-8 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
          </div>
        ) : monitors.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium">No active monitors</h3>
            <p className="text-text-secondary mt-2">
              Set up a monitor to scan your assets automatically on a schedule.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Target</th>
                  <th>Trend (Last 10)</th>
                  <th>Frequency</th>
                  <th>Last Run</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {monitors.map((m) => {
                  const chartData = {
                    labels: m.history?.map((h) => new Date(h.created_at).toLocaleDateString()) || [],
                    datasets: [
                      {
                        data: m.history?.map((h) => h.security_score) || [],
                        borderColor: '#00f5d4',
                        backgroundColor: 'rgba(0, 245, 212, 0.1)',
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        fill: true,
                        tension: 0.4,
                      },
                    ],
                  };

                  const chartOptions = {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false }, tooltip: { enabled: true } },
                    scales: {
                      x: { display: false },
                      y: { display: false, min: 0, max: 100 },
                    },
                  };

                  return (
                  <tr key={m.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {m.target_type === "url" ? (
                           <Globe className="w-4 h-4 text-text-muted" />
                        ) : (
                           <Github className="w-4 h-4 text-text-muted" />
                        )}
                        <div className="flex flex-col">
                           <span className="font-medium truncate max-w-[200px]">{m.target_url}</span>
                           {m.latestScore !== undefined && m.latestScore !== null && (
                             <span className="text-xs text-text-secondary mt-0.5">
                               Latest Score: <strong className={m.latestScore >= 90 ? "text-severity-low" : m.latestScore >= 70 ? "text-severity-medium" : "text-severity-critical"}>{m.latestScore}</strong>
                             </span>
                           )}
                        </div>
                      </div>
                    </td>
                    <td className="w-32 h-12">
                      {m.history && m.history.length > 1 ? (
                        <Line data={chartData} options={chartOptions as any} />
                      ) : (
                        <span className="text-xs text-text-muted italic">Not enough data</span>
                      )}
                    </td>
                    <td>
                      <span className="capitalize text-sm">{m.frequency}</span>
                    </td>
                    <td className="text-sm text-text-secondary">
                      {m.last_run ? new Date(m.last_run).toLocaleDateString() : "Never"}
                      <div className="text-xs text-text-muted mt-0.5">Next: {new Date(m.next_run).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <button 
                        onClick={() => handleToggleActive(m.id, m.is_active)}
                        className={`badge ${m.is_active ? 'badge-low' : 'badge-medium'} flex items-center gap-1 w-fit cursor-pointer hover:opacity-80 transition-opacity`}
                        title={m.is_active ? "Click to Pause" : "Click to Resume"}
                      >
                        {m.is_active ? (
                          <><CheckCircle className="w-3 h-3" /> Active</>
                        ) : (
                          <><AlertTriangle className="w-3 h-3" /> Paused</>
                        )}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleRunNow(m)}
                          disabled={runningScans[m.id]}
                          className="p-2 text-text-muted hover:text-accent-cyan transition-colors rounded-lg hover:bg-accent-cyan/10 disabled:opacity-50"
                          title="Run Scan Now"
                        >
                          <RefreshCw className={`w-4 h-4 ${runningScans[m.id] ? "animate-spin text-accent-cyan" : ""}`} />
                        </button>
                        <button
                          onClick={() => handleToggleActive(m.id, m.is_active)}
                          className="p-2 text-text-muted hover:text-white transition-colors rounded-lg hover:bg-white/10"
                          title={m.is_active ? "Pause Monitor" : "Resume Monitor"}
                        >
                          {m.is_active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="p-2 text-text-muted hover:text-severity-critical transition-colors rounded-lg hover:bg-severity-critical/10"
                          title="Delete Monitor"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
