import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    // --- FIX: Require a server-side secret to prevent any logged-in user from
    // self-escalating to admin. The secret must be set as GODMODE_SECRET in the
    // server environment and passed in the request body by the authorized caller.
    const godmodeSecret = process.env.GODMODE_SECRET;
    if (!godmodeSecret) {
      console.error("GODMODE_SECRET is not configured on the server.");
      return NextResponse.json(
        { error: "God Mode is disabled: server configuration missing." },
        { status: 403 }
      );
    }

    let body: { secret?: string } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    if (!body.secret || body.secret !== godmodeSecret) {
      return NextResponse.json(
        { error: "Forbidden: invalid or missing God Mode secret." },
        { status: 403 }
      );
    }
    // --- END FIX ---

    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Use service role to bypass RLS and update user metadata securely
    const serviceClient = createServiceRoleClient();
    
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(
      user.id,
      { user_metadata: { ...user.user_metadata, role: "admin" } }
    );

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({ success: true, message: "God Mode Activated" });
    
  } catch (error: unknown) {
    console.error("God Mode Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to activate God Mode" },
      { status: 500 }
    );
  }
}
