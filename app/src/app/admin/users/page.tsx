import { createServiceRoleClient, createServerSupabaseClient } from "@/lib/supabase/server";
import { Users, Mail, Clock, CheckCircle, Shield } from "lucide-react";
import { redirect } from "next/navigation";

export default async function AdminUsersPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.user_metadata?.role !== "admin") {
    redirect("/dashboard");
  }

  const serviceClient = createServiceRoleClient();

  // Fetch all users
  const { data: { users } = { users: [] } } = await serviceClient.auth.admin.listUsers();
  
  // Also fetch scans to count per user
  const { data: scans } = await serviceClient
    .from("scans")
    .select("id, user_id, status");

  const usersWithStats = users?.map(u => {
    const userScans = scans?.filter(s => s.user_id === u.id) || [];
    return {
      ...u,
      scanCount: userScans.length,
      completedScans: userScans.filter(s => s.status === 'completed').length
    };
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <Users className="w-6 h-6 text-accent-cyan" /> User Management
        </h1>
        <p className="text-text-secondary">View and manage registered BugHunter AI users.</p>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-bg-secondary/50">
                <th className="p-4 font-semibold">User</th>
                <th className="p-4 font-semibold">Role</th>
                <th className="p-4 font-semibold">Total Scans</th>
                <th className="p-4 font-semibold">Joined</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {usersWithStats.map((u) => {
                const isAdmin = u.user_metadata?.role === 'admin';
                return (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-accent-cyan/10 flex items-center justify-center border border-accent-cyan/20">
                          <span className="text-accent-cyan font-bold">
                            {(u.user_metadata?.full_name || u.email || "?").charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium">{u.user_metadata?.full_name || "Unknown"}</div>
                          <div className="text-sm text-text-secondary flex items-center gap-1">
                            <Mail className="w-3 h-3" /> {u.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {isAdmin ? (
                        <span className="badge badge-high flex items-center gap-1 w-max">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="badge badge-info w-max">User</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="font-mono">{u.scanCount}</div>
                      <div className="text-xs text-text-secondary">{u.completedScans} completed</div>
                    </td>
                    <td className="p-4 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(u.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-severity-low flex items-center gap-1 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Active
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
