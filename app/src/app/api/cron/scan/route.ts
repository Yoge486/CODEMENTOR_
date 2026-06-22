import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// We use the service role key to bypass RLS for the cron job
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

export async function GET(req: Request) {
  try {
    // --- FIX: Make the CRON_SECRET check unconditional.
    // Previously: `if (process.env.CRON_SECRET && authHeader !== expectedAuth)`
    // This meant the endpoint was wide-open when CRON_SECRET was not set.
    // Now: always reject if the secret is missing from env OR if the token mismatches.
    const cronSecret = process.env.CRON_SECRET;
    const authHeader = req.headers.get("authorization");

    if (!cronSecret) {
      console.error("CRON_SECRET is not configured. Denying cron execution.");
      return NextResponse.json(
        { error: "Unauthorized: cron secret not configured on server." },
        { status: 401 }
      );
    }

    const expectedAuth = `Bearer ${cronSecret}`;
    if (authHeader !== expectedAuth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // --- END FIX ---

    // 2. Fetch pending scheduled scans
    const now = new Date().toISOString();
    const { data: dueScans, error } = await supabase
      .from("scheduled_scans")
      .select("*")
      .eq("is_active", true)
      .lte("next_run", now);

    if (error) {
      throw new Error(`Failed to fetch scheduled scans: ${error.message}`);
    }

    if (!dueScans || dueScans.length === 0) {
      return NextResponse.json({ message: "No scans due for execution." });
    }

    const results = [];

    // 3. Execute Scans
    // Note: In a production environment with many scans, you'd want a proper queue (e.g., Inngest, Upstash QStash).
    // For this demo, we'll execute them sequentially.

    for (const scan of dueScans) {
      try {
        console.log(`[CRON] Triggering ${scan.target_type} scan for ${scan.target_url} (User: ${scan.user_id})`);
        
        // Calculate next run
        const nextRun = new Date();
        if (scan.frequency === "daily") {
          nextRun.setDate(nextRun.getDate() + 1);
        } else {
          nextRun.setDate(nextRun.getDate() + 7);
        }

        // Update DB record
        await supabase
          .from("scheduled_scans")
          .update({
            last_run: now,
            next_run: nextRun.toISOString()
          })
          .eq("id", scan.id);

        results.push({ id: scan.id, status: "triggered" });
      } catch (err) {
        console.error(`Failed to process scheduled scan ${scan.id}:`, err);
        results.push({ id: scan.id, status: "failed" });
      }
    }

    return NextResponse.json({ 
      message: `Processed ${dueScans.length} scheduled scans.`,
      results 
    });

  } catch (error: unknown) {
    console.error("Cron Error:", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
