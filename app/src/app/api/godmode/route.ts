import { NextResponse } from "next/server";
import { createServerSupabaseClient, createServiceRoleClient } from "@/lib/supabase/server";

export async function POST() {
  try {
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

    // Note: The user might need to log out and log back in, OR we can refresh the session client-side.
    // The middleware checks user_metadata which is refreshed automatically on navigation in some cases,
    // but a session refresh is best handled by the client.
    return NextResponse.json({ success: true, message: "God Mode Activated" });
    
  } catch (error: unknown) {
    console.error("God Mode Error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to activate God Mode" },
      { status: 500 }
    );
  }
}
