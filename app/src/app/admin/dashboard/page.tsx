import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { Shield, Scan, Users, AlertTriangle, Activity } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminDashboardPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const serviceClient = createServiceRoleClient();

  // Fetch all users
  const { data: { users } = { users: [] } } = await serviceClient.auth.admin.listUsers();
  
  // Fetch global scans data
  const { data: scans } = await serviceClient
    .from("scans")
    .select("id, security_score, status, created_at, target_url, target_type, user_id")
    .order("created_at", { ascending: false });

  // Fetch all vulnerabilities
  const { count: vulnCount } = await serviceClient
    .from("vulnerabilities")
    .select("*", { count: "exact", head: true });

  const totalUsers = users?.length || 0;
  const totalScans = scans?.length || 0;
  const completedScans = scans?.filter(s => s.status === 'completed') || [];
  const recentScans = scans?.slice(0, 10) || [];
  
  const avgScore = completedScans.length > 0
    ? Math.round(completedScans.reduce((sum, s) => sum + (s.security_score || 0), 0) / completedScans.length)
    : 0;

  const statCards = [
    {
      label: "Total Users",
      value: totalUsers,
      icon: Users,
      color: "#3b82f6" // blue
    },
    {
      label: "Total Scans",
      value: totalScans,
      icon: Scan,
      color: "#8b5cf6" // purple
    },
    {
      label: "Vulnerabilities Found",
      value: vulnCount || 0,
      icon: AlertTriangle,
      color: "#ef4444" // red
    },
    {
      label: "Platform Avg Score",
      value: avgScore,
      icon: Shield,
      color: avgScore >= 80 ? "#10b981" : avgScore >= 60 ? "#f59e0b" : "#ef4444"
    }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">Platform Overview</h1>
        <p className="text-text-secondary">Global statistics across all BugHunter AI activity.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{
                  background: `${stat.color}15`,
                  border: `1px solid ${stat.color}30`,
                }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-3xl font-bold mb-1">{stat.value}</p>
            <p className="text-sm text-text-secondary">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-accent-cyan" />
          Recent Platform Activity
        </h2>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-text-secondary">
            <thead className="text-xs uppercase bg-white/5 text-text-primary border-b border-border">
              <tr>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Score</th>
                <th className="px-4 py-3 text-right">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentScans.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-text-muted">
                    No recent scans found.
                  </td>
                </tr>
              ) : (
                recentScans.map((scan) => (
                  <tr key={scan.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white max-w-[200px] truncate" title={scan.target_url}>
                      {scan.target_url}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded bg-white/5 text-xs">
                        {scan.target_type === "url" ? "Website" : "GitHub Repo"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          scan.status === "completed" ? "bg-severity-low" :
                          scan.status === "failed" ? "bg-severity-critical" :
                          "bg-accent-cyan animate-pulse"
                        }`} />
                        <span className="capitalize">{scan.status}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {scan.status === "completed" ? (
                        <span className={`font-bold ${
                          scan.security_score && scan.security_score >= 80 ? "text-severity-low" :
                          scan.security_score && scan.security_score >= 60 ? "text-severity-medium" : "text-severity-high"
                        }`}>
                          {scan.security_score}/100
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {new Date(scan.created_at).toLocaleString(undefined, { 
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
