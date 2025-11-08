import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY env vars");
}

const supabaseAdmin = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Identify caller
    const { data: userData, error: userErr } = await supabaseAdmin.auth.getUser(token);
    if (userErr || !userData?.user) {
      console.error("auth.getUser error", userErr);
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminUserId = userData.user.id;

    // Check ADMIN role
    const { data: roleRows, error: roleErr } = await supabaseAdmin
      .from("user_roles")
      .select("id")
      .eq("user_id", adminUserId)
      .eq("role", "ADMIN")
      .limit(1);

    if (roleErr) {
      console.error("role check error", roleErr);
      return new Response(JSON.stringify({ error: "Failed to verify permissions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!roleRows || roleRows.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden: requires ADMIN role" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Rate limiting: 10 requests per minute
    const rateLimitKey = `admin-create-user:${adminUserId}`;
    
    // Cleanup expired entries
    await supabaseAdmin.from("rate_limits").delete().lt("expires_at", new Date().toISOString());
    
    // Check current rate
    const { data: rateLimitData } = await supabaseAdmin
      .from("rate_limits")
      .select("count")
      .eq("key", rateLimitKey)
      .gte("expires_at", new Date().toISOString())
      .maybeSingle();

    if (rateLimitData && rateLimitData.count >= 10) {
      console.warn(`Rate limit exceeded for user ${adminUserId}`);
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update or insert rate limit
    if (rateLimitData) {
      await supabaseAdmin
        .from("rate_limits")
        .update({ count: rateLimitData.count + 1 })
        .eq("key", rateLimitKey)
        .gte("expires_at", new Date().toISOString());
    } else {
      await supabaseAdmin.from("rate_limits").insert({
        key: rateLimitKey,
        count: 1,
        expires_at: new Date(Date.now() + 60000).toISOString(),
      });
    }

    // Parse body
    const body = await req.json();
    const nome: string = (body?.nome || "").trim();
    const email: string = (body?.email || "").trim();
    const senha: string = body?.senha || "";
    const roles: string[] = Array.isArray(body?.roles) ? body.roles : [];
    const escola_id: string | null = body?.escola_id ?? null;

    if (!nome || !email || !senha || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (senha.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve ter pelo menos 6 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const allowedRoles = new Set([
      "ADMIN",
      "GESTOR_SEMED",
      "TECNICO_SEMED",
      "DIRETOR",
      "SECRETARIO",
      "COORDENADOR",
      "PROFESSOR",
    ]);

    for (const r of roles) {
      if (!allowedRoles.has(r)) {
        return new Response(
          JSON.stringify({ error: `Perfil inválido: ${r}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create user in Auth (auto confirm email)
    const { data: createdUser, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      email_confirm: true,
      user_metadata: { nome },
    });

    if (createErr || !createdUser?.user?.id) {
      const msg = createErr?.message || "Erro ao criar usuário no Auth";
      console.error("auth.admin.createUser error", createErr);
      return new Response(JSON.stringify({ error: msg }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const newUserId = createdUser.user.id;

    try {
      // Insert in usuarios
      const { error: usuarioErr } = await supabaseAdmin
        .from("usuarios")
        .insert({ id: newUserId, nome, email, ativo: true, escola_id });

      if (usuarioErr) {
        throw usuarioErr;
      }

      // Insert roles (com escola_id se fornecido)
      const rolesToInsert = roles.map((role) => ({
        user_id: newUserId,
        role,
        escola_id: escola_id || null,
      }));

      const { error: rolesErr } = await supabaseAdmin
        .from("user_roles")
        .insert(rolesToInsert);

      if (rolesErr) {
        throw rolesErr;
      }

      return new Response(
        JSON.stringify({ success: true, user_id: newUserId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e) {
      console.error("DB insert error, rolling back", e);
      // Cleanup DB and auth user
      try {
        await supabaseAdmin.from("usuarios").delete().eq("id", newUserId);
      } catch (_) {}
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
      } catch (delErr) {
        console.error("Failed to delete auth user on rollback", delErr);
      }
      return new Response(
        JSON.stringify({ error: "Falha ao salvar dados do usuário" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (err) {
    console.error("Unhandled error in admin-create-user", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
