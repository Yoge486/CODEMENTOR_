import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { Scan, Clock, ExternalLink, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

function ScoreColor(score: number | null) {
  if (score === null) return "#64748b";
  if (score >= 90) return "#00e676";
  if (score >= 70) return "#ffc400";
  return "#ff1744";
}

function ScoreLabel(score: number | null) {
  if (score === null) return "N/A";
  if (score >= 90) return "Secure";
  if (score >= 70) return "Medium";
  return "High Risk";
}

export default async function AdminScansPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const serviceClient = createServiceRoleClient();

  // Fetch all scans with a join on users isn't strictly possible via a simple join if users are in auth.users,
  // so we'll fetch scans and users separately and map them.
  const { data: scans } = await serviceClient
    .from("scans")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100); // Admin view limits to 100 recent for performance

  const { data: { users } = { users: [] } } = await serviceClient.auth.admin.listUsers();
  
  const userMap = new Map(users?.map(u => [u.id, u]) || []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Scan className="w-6 h-6 text-accent-purple" /> Global Scan History
        </h1>
        <p className="text-text-secondary">Review recent scans performed across the entire platform.</p>
      </div>

      <div className="glass-card overflow-hidden">
        {(!scans || scans.length === 0) ? (
          <div className="p-12 text-center">
            <ShieldAlert className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Scans Found</h3>
            <p className="text-text-secondary">There are no scans recorded in the system yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-bg-secondary/50">
                  <th className="p-4 font-semibold">Target URL</th>
                  <th className="p-4 font-semibold">User</th>
                  <th className="p-4 font-semibold">Score</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Date</th>
                  <th className="p-4 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {scans.map((scan) => {
                  const scanUser = userMap.get(scan.user_id);
                  const userName = scanUser?.user_metadata?.full_name || scanUser?.email || "Unknown User";
                  
                  return (
                    <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <ExternalLink className="w-4 h-4 text-text-muted flex-shrink-0" />
                          <span className="truncate max-w-[250px] font-medium" title={scan.target_url}>
                            {scan.target_url}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-text-secondary">{userName}</span>
                      </td>
                      <td className="p-4">
                        <span
                          className="font-bold font-mono text-lg"
                          style={{ color: ScoreColor(scan.security_score) }}
                        >
                          {scan.security_score ?? "—"}
                        </span>
                        <span
                          className="text-xs ml-2 font-medium"
                          style={{ color: ScoreColor(scan.security_score) }}
                        >
                          {ScoreLabel(scan.security_score)}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`badge ${
                            scan.status === "completed"
                              ? "badge-low"
                              : scan.status === "failed"
                                ? "badge-critical"
                                : "badge-info"
                          }`}
                        >
                          {scan.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-text-secondary text-sm">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(scan.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/history/${scan.id}`}
                          className="text-accent-cyan text-sm hover:underline font-medium"
                        >
                          View Report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
