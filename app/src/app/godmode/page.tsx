"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldAlert, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function GodModePage() {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState<"initiating" | "upgrading" | "success" | "error">("initiating");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const activateGodMode = async () => {
      try {
        // 1. Initial delay for effect
        await new Promise(r => setTimeout(r, 1000));
        setStatus("upgrading");

        // 2. Call the secret API
        const res = await fetch("/api/godmode", { method: "POST" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to activate God Mode");
        }

        // 3. Force a session refresh to pull down the new user_metadata.role
        await supabase.auth.refreshSession();

        // 4. Success state
        setStatus("success");
        await new Promise(r => setTimeout(r, 1500));

        // 5. Redirect to Admin Dashboard
        router.push("/admin/dashboard");
        router.refresh();

      } catch (err: unknown) {
        setStatus("error");
        setErrorMsg((err as Error).message || "An unknown error occurred.");
      }
    };

    activateGodMode();
  }, [router, supabase.auth]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-primary text-text-primary p-4 relative overflow-hidden">
      {/* Background Matrix/Hacker Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none flex flex-col overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="text-accent-cyan font-mono text-xs whitespace-nowrap"
            initial={{ x: Math.random() * -1000 }}
            animate={{ x: Math.random() * 1000 }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {Array.from({ length: 50 })
              .map(() => Math.random().toString(36).substring(2, 8))
              .join(" ")}
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card p-8 max-w-md w-full relative z-10 border-severity-high/30 shadow-2xl shadow-severity-high/20 text-center"
      >
        <div className="flex justify-center mb-6 relative">
          <motion.div
            animate={{ rotate: status === "upgrading" ? 360 : 0 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-t-2 border-severity-high opacity-50"
          />
          <div className="w-20 h-20 rounded-full bg-severity-high/10 flex items-center justify-center border border-severity-high/30 relative">
            {status === "success" ? (
              <CheckCircle2 className="w-10 h-10 text-severity-high" />
            ) : status === "error" ? (
              <ShieldAlert className="w-10 h-10 text-severity-critical" />
            ) : (
              <ShieldAlert className="w-10 h-10 text-severity-high animate-pulse" />
            )}
          </div>
        </div>

        <h1 className="text-3xl font-bold mb-2 tracking-tight">
          {status === "initiating" && "Initiating..."}
          {status === "upgrading" && "Bypassing Mainframe..."}
          {status === "success" && "God Mode Activated"}
          {status === "error" && "Access Denied"}
        </h1>

        <div className="h-12 flex items-center justify-center">
          {status === "initiating" && (
            <p className="text-text-secondary text-sm">Preparing to elevate privileges.</p>
          )}
          {status === "upgrading" && (
            <div className="flex items-center gap-2 text-severity-high text-sm font-mono">
              <Loader2 className="w-4 h-4 animate-spin" />
              Injecting admin role payload...
            </div>
          )}
          {status === "success" && (
            <p className="text-severity-high text-sm font-mono">
              Redirecting to Admin Dashboard...
            </p>
          )}
          {status === "error" && (
            <p className="text-severity-critical text-sm">{errorMsg}</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
