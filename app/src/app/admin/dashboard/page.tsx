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
    .select("id, security_score, status, created_at");

  // Fetch all vulnerabilities
  const { count: vulnCount } = await serviceClient
    .from("vulnerabilities")
    .select("*", { count: "exact", head: true });

  const totalUsers = users?.length || 0;
  const totalScans = scans?.length || 0;
  const completedScans = scans?.filter(s => s.status === 'completed') || [];
  
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
        <p className="text-text-secondary mb-4">
          Detailed activity logs and charts will be displayed here in a future update.
        </p>
      </div>
    </div>
  );
}
