import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("Missing Supabase env vars");
      return new Response(JSON.stringify({ error: "Server misconfiguration" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate caller and role
    const { data: callerUser, error: getUserError } = await adminClient.auth.getUser(token);
    if (getUserError || !callerUser?.user) {
      console.error("getUser error", getUserError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = callerUser.user.id;
    const { data: isAdminData, error: roleError } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "ADMIN")
      .maybeSingle();

    if (roleError) {
      console.error("roleError", roleError);
    }

    if (!isAdminData) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: 5 requests per minute for delete operations
    const rateLimitKey = `admin-delete-user:${callerId}`;
    const oneMinuteAgo = new Date(Date.now() - 60000).toISOString();
    
    // Cleanup expired entries
    await adminClient.from("rate_limits").delete().lt("expires_at", new Date().toISOString());
    
    // Check current rate
    const { data: rateLimitData } = await adminClient
      .from("rate_limits")
      .select("count")
      .eq("key", rateLimitKey)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (rateLimitData && rateLimitData.count >= 5) {
      console.warn(`Rate limit exceeded for user ${callerId}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update or insert rate limit
    if (rateLimitData) {
      await adminClient
        .from("rate_limits")
        .update({ count: rateLimitData.count + 1 })
        .eq("key", rateLimitKey)
        .gte("expires_at", new Date().toISOString());
    } else {
      await adminClient.from("rate_limits").insert({
        key: rateLimitKey,
        count: 1,
        expires_at: new Date(Date.now() + 60000).toISOString(),
      });
    }

    // Parse body
    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean up related records first
    const { error: delRolesError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    if (delRolesError) {
      console.error("Failed to delete user roles", delRolesError);
    }

    const { error: delUsuarioError } = await adminClient
      .from("usuarios")
      .delete()
      .eq("id", userId);
    if (delUsuarioError) {
      console.error("Failed to delete usuario row", delUsuarioError);
    }

    // Delete auth user last (tolerar se já foi deletado)
    const { error: delAuthError } = await adminClient.auth.admin.deleteUser(userId);
    if (delAuthError) {
      // Se o usuário já foi deletado, considerar sucesso
      if (delAuthError.message?.includes('User not found') || delAuthError.status === 404) {
        console.log("Auth user already deleted, continuing...");
      } else {
        console.error("Failed to delete auth user", delAuthError);
        return new Response(JSON.stringify({ error: "Failed to delete auth user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("admin-delete-user error", e);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
