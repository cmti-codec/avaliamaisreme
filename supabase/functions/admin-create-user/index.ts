import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from '../_shared/cors.ts';

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
    console.log("📥 Received body:", JSON.stringify(body, null, 2));
    
    const nome: string = (body?.nome || "").trim();
    const email: string = (body?.email || "").trim();
    const cpf: string = (body?.cpf || "").trim();
    const telefone: string = (body?.telefone || "").trim();
    const senha: string = body?.senha || "";
    const roles: string[] = Array.isArray(body?.roles) ? body.roles : [];
    const escola_id: string | null = body?.escola_id ?? null;

    console.log("📋 Parsed values:", { nome, email, cpf, telefone, senha: senha ? "***" : "(empty)", roles, escola_id });

    if (!nome || !email || !cpf || !senha || roles.length === 0) {
      console.error("❌ Validation failed:", { 
        hasNome: !!nome, 
        hasEmail: !!email, 
        hasCpf: !!cpf, 
        hasSenha: !!senha, 
        rolesCount: roles.length 
      });
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios ausentes: nome, email, CPF, senha e perfis" }),
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
      // 1. Create pessoa record first
      const { data: pessoaData, error: pessoaErr } = await supabaseAdmin
        .from("pessoas")
        .insert({
          cpf,
          nome_completo: nome,
          email,
          telefone: telefone || null,
          ativo: true,
        })
        .select()
        .single();

      if (pessoaErr || !pessoaData) {
        console.error("Error creating pessoa:", pessoaErr);
        throw new Error("Falha ao criar registro de pessoa");
      }

      const pessoaId = pessoaData.id;

      // 2. Create usuario linked to pessoa
      const { error: usuarioErr } = await supabaseAdmin
        .from("usuarios")
        .insert({
          id: newUserId,
          pessoa_id: pessoaId,
          nome,
          email,
          ativo: true,
        });

      if (usuarioErr) {
        console.error("Error creating usuario:", usuarioErr);
        throw usuarioErr;
      }

      // 3. Insert roles
      const rolesToInsert = roles.map((role) => ({
        user_id: newUserId,
        role,
        escola_id: escola_id || null,
      }));

      const { error: rolesErr } = await supabaseAdmin
        .from("user_roles")
        .insert(rolesToInsert);

      if (rolesErr) {
        console.error("Error creating roles:", rolesErr);
        throw rolesErr;
      }

      // 4. Create lotacao if escola_id and relevant role
      if (escola_id && roles.some(r => ['DIRETOR', 'SECRETARIO', 'COORDENADOR', 'PROFESSOR'].includes(r))) {
        // Determine primary profile for lotacao
        const perfilLotacao = roles.includes('DIRETOR') ? 'DIRETOR' :
                              roles.includes('SECRETARIO') ? 'SECRETARIO' :
                              roles.includes('COORDENADOR') ? 'COORDENADOR' :
                              'PROFESSOR';
        
        const { error: lotacaoErr } = await supabaseAdmin
          .from("lotacoes")
          .insert({
            pessoa_id: pessoaId,
            escola_saesc: escola_id,
            perfil: perfilLotacao,
            ano_letivo: new Date().getFullYear().toString(),
            data_inicio: new Date().toISOString().split('T')[0],
            ativo: true,
            status: 'ATIVO'
          });

        if (lotacaoErr) {
          console.warn("⚠️ Lotação não criada:", lotacaoErr);
          // Don't fail user creation, just log warning
        } else {
          console.log("✅ Lotação criada:", { pessoa_id: pessoaId, escola_saesc: escola_id, perfil: perfilLotacao });
        }
      }

      console.log("✅ User created successfully:", { newUserId, pessoaId, roles });

      return new Response(
        JSON.stringify({ ok: true, user_id: newUserId, pessoa_id: pessoaId }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (e: any) {
      console.error("DB insert error, rolling back", e);
      // Cleanup: delete in reverse order
      try {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", newUserId);
      } catch (_) {}
      try {
        await supabaseAdmin.from("usuarios").delete().eq("id", newUserId);
      } catch (_) {}
      try {
        await supabaseAdmin.from("pessoas").delete().eq("email", email);
      } catch (_) {}
      try {
        await supabaseAdmin.auth.admin.deleteUser(newUserId);
      } catch (delErr) {
        console.error("Failed to delete auth user on rollback", delErr);
      }
      
      const errorMsg = e?.message || "Falha ao salvar dados do usuário";
      return new Response(
        JSON.stringify({ ok: false, error: errorMsg }),
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
