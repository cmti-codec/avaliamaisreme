import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import { corsHeaders } from '../_shared/cors.ts'

interface CleanupStats {
  lotacoesDeleted: number;
  userRolesDeleted: number;
  usuariosDeleted: number;
  pessoasDeleted: number;
  authUsersDeleted: number;
  errors: string[];
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const stats: CleanupStats = {
      lotacoesDeleted: 0,
      userRolesDeleted: 0,
      usuariosDeleted: 0,
      pessoasDeleted: 0,
      authUsersDeleted: 0,
      errors: []
    };

    console.log('🧹 Iniciando limpeza de usuários de teste...');

    // 1. Buscar todos os usuários de teste
    const { data: testUsers, error: fetchError } = await supabase
      .from('usuarios')
      .select('id, email, pessoa_id')
      .like('email', '%@tempmail.lovable.dev');

    if (fetchError) {
      throw new Error(`Erro ao buscar usuários: ${fetchError.message}`);
    }

    if (!testUsers || testUsers.length === 0) {
      console.log('✅ Nenhum usuário de teste encontrado');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Nenhum usuário de teste encontrado',
          stats 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📋 Encontrados ${testUsers.length} usuários de teste`);

    const userIds = testUsers.map(u => u.id);
    const pessoaIds = testUsers.map(u => u.pessoa_id).filter(Boolean);

    // 2. Deletar lotações
    if (pessoaIds.length > 0) {
      const { error: lotacoesError, count: lotacoesCount } = await supabase
        .from('lotacoes')
        .delete({ count: 'exact' })
        .in('pessoa_id', pessoaIds);

      if (lotacoesError) {
        stats.errors.push(`Lotações: ${lotacoesError.message}`);
      } else {
        stats.lotacoesDeleted = lotacoesCount || 0;
        console.log(`✅ Deletadas ${stats.lotacoesDeleted} lotações`);
      }
    }

    // 3. Deletar user_roles
    const { error: rolesError, count: rolesCount } = await supabase
      .from('user_roles')
      .delete({ count: 'exact' })
      .in('user_id', userIds);

    if (rolesError) {
      stats.errors.push(`User roles: ${rolesError.message}`);
    } else {
      stats.userRolesDeleted = rolesCount || 0;
      console.log(`✅ Deletados ${stats.userRolesDeleted} user_roles`);
    }

    // 4. Deletar usuarios
    const { error: usuariosError, count: usuariosCount } = await supabase
      .from('usuarios')
      .delete({ count: 'exact' })
      .in('id', userIds);

    if (usuariosError) {
      stats.errors.push(`Usuários: ${usuariosError.message}`);
    } else {
      stats.usuariosDeleted = usuariosCount || 0;
      console.log(`✅ Deletados ${stats.usuariosDeleted} usuários`);
    }

    // 5. Deletar pessoas órfãs (que não têm mais usuários)
    if (pessoaIds.length > 0) {
      // Buscar quais pessoa_ids ainda têm usuários
      const { data: usuariosRestantes } = await supabase
        .from('usuarios')
        .select('pessoa_id')
        .in('pessoa_id', pessoaIds)
        .not('pessoa_id', 'is', null);

      const pessoaIdsComUsuarios = new Set(
        (usuariosRestantes || []).map(u => u.pessoa_id).filter(Boolean)
      );

      const pessoaIdsOrfas = pessoaIds.filter(id => !pessoaIdsComUsuarios.has(id));

      if (pessoaIdsOrfas.length > 0) {
        const { error: pessoasError, count: pessoasCount } = await supabase
          .from('pessoas')
          .delete({ count: 'exact' })
          .in('id', pessoaIdsOrfas);

        if (pessoasError) {
          stats.errors.push(`Pessoas: ${pessoasError.message}`);
        } else {
          stats.pessoasDeleted = pessoasCount || 0;
          console.log(`✅ Deletadas ${stats.pessoasDeleted} pessoas órfãs`);
        }
      }
    }

    // 6. Deletar da tabela auth.users (usando admin API)
    for (const user of testUsers) {
      try {
        const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
        if (authError) {
          stats.errors.push(`Auth user ${user.email}: ${authError.message}`);
        } else {
          stats.authUsersDeleted++;
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        stats.errors.push(`Auth user ${user.email}: ${errorMessage}`);
      }
    }

    console.log(`✅ Deletados ${stats.authUsersDeleted} usuários do auth`);

    const summary = {
      success: true,
      message: `Limpeza concluída: ${stats.usuariosDeleted} usuários removidos`,
      stats,
      details: {
        usuariosProcessados: testUsers.length,
        lotacoes: stats.lotacoesDeleted,
        roles: stats.userRolesDeleted,
        usuarios: stats.usuariosDeleted,
        pessoas: stats.pessoasDeleted,
        authUsers: stats.authUsersDeleted,
        erros: stats.errors.length
      }
    };

    console.log('🎉 Limpeza concluída:', summary);

    return new Response(
      JSON.stringify(summary),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Erro na limpeza:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
