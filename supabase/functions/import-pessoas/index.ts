import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { corsHeaders } from '../_shared/cors.ts';

interface PessoaImport {
  cpf: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  perfil: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'SECRETARIO';
  escola_saesc?: string;
  carga_horaria?: number;
}

interface ImportResult {
  success: number;
  errors: Array<{
    linha: number;
    cpf: string;
    erro: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
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

    // Verificar autenticação
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Não autorizado');
    }

    const { pessoas }: { pessoas: PessoaImport[] } = await req.json();
    
    if (!pessoas || !Array.isArray(pessoas) || pessoas.length === 0) {
      throw new Error('Nenhuma pessoa para importar');
    }

    console.log(`📥 Iniciando importação de ${pessoas.length} pessoas`);

    const result: ImportResult = {
      success: 0,
      errors: []
    };

    // Processar em lotes de 50 para não sobrecarregar
    const batchSize = 50;
    for (let i = 0; i < pessoas.length; i += batchSize) {
      const batch = pessoas.slice(i, i + batchSize);
      
      for (let j = 0; j < batch.length; j++) {
        const pessoa = batch[j];
        const linha = i + j + 2; // +2 porque linha 1 é header e array começa em 0
        
        try {
          // 1. Verificar se CPF já existe
          const { data: existingPessoa } = await supabase
            .from('pessoas')
            .select('id, cpf')
            .eq('cpf', pessoa.cpf)
            .maybeSingle();

          let pessoaId: string;

          if (existingPessoa) {
            console.log(`⚠️ Pessoa já existe: ${pessoa.cpf}`);
            result.errors.push({
              linha,
              cpf: pessoa.cpf,
              erro: 'CPF já cadastrado'
            });
            continue;
          }

          // 2. Criar pessoa
          const { data: novaPessoa, error: pessoaError } = await supabase
            .from('pessoas')
            .insert({
              cpf: pessoa.cpf,
              nome_completo: pessoa.nome_completo,
              email: pessoa.email,
              telefone: pessoa.telefone || null,
              data_nascimento: pessoa.data_nascimento || null,
              ativo: true
            })
            .select()
            .single();

          if (pessoaError || !novaPessoa) {
            throw new Error(`Erro ao criar pessoa: ${pessoaError?.message || 'Desconhecido'}`);
          }

          pessoaId = novaPessoa.id;
          console.log(`✅ Pessoa criada: ${pessoa.cpf}`);

          // 3. Verificar se usuário já existe no auth
          const { data: existingUser } = await supabase.auth.admin.listUsers();
          const userExists = existingUser.users.find(u => u.email === pessoa.email);

          let userId: string;

          if (userExists) {
            userId = userExists.id;
            console.log(`ℹ️ Usuário auth já existe: ${pessoa.email}`);
            
            // Atualizar usuario com pessoa_id
            await supabase
              .from('usuarios')
              .update({ pessoa_id: pessoaId })
              .eq('id', userId);
          } else {
            // 4. Criar usuário no auth.users com senha temporária
            const tempPassword = `Temp@${Math.random().toString(36).substring(2, 10)}`;
            
            const { data: newAuthUser, error: authError } = await supabase.auth.admin.createUser({
              email: pessoa.email,
              password: tempPassword,
              email_confirm: true // Auto-confirmar email
            });

            if (authError || !newAuthUser.user) {
              throw new Error(`Erro ao criar auth: ${authError?.message || 'Desconhecido'}`);
            }

            userId = newAuthUser.user.id;
            console.log(`✅ Usuário auth criado: ${pessoa.email}`);

            // 5. Criar registro em usuarios
            const { error: usuarioError } = await supabase
              .from('usuarios')
              .insert({
                id: userId,
                nome: pessoa.nome_completo,
                email: pessoa.email,
                pessoa_id: pessoaId,
                ativo: true
              });

            if (usuarioError) {
              throw new Error(`Erro ao criar usuário: ${usuarioError.message}`);
            }
          }

          // 6. Criar role
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: pessoa.perfil,
              escola_id: pessoa.escola_saesc || null
            });

          if (roleError) {
            // Se role já existe, apenas logar warning
            console.warn(`⚠️ Role pode já existir: ${roleError.message}`);
          } else {
            console.log(`✅ Role criada: ${pessoa.perfil}`);
          }

          // 7. Criar lotação (se escola fornecida)
          if (pessoa.escola_saesc) {
            const { error: lotacaoError } = await supabase
              .from('lotacoes')
              .insert({
                pessoa_id: pessoaId,
                escola_saesc: pessoa.escola_saesc,
                perfil: pessoa.perfil,
                carga_horaria: pessoa.carga_horaria || null,
                data_inicio: new Date().toISOString().split('T')[0],
                ativo: true,
                ano_letivo: new Date().getFullYear().toString()
              });

            if (lotacaoError) {
              console.warn(`⚠️ Erro ao criar lotação: ${lotacaoError.message}`);
            } else {
              console.log(`✅ Lotação criada em ${pessoa.escola_saesc}`);
            }
          }

          result.success++;

        } catch (error: any) {
          console.error(`❌ Erro linha ${linha}:`, error);
          result.errors.push({
            linha,
            cpf: pessoa.cpf,
            erro: error.message || 'Erro desconhecido'
          });
        }
      }

      // Pequeno delay entre lotes
      if (i + batchSize < pessoas.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`✅ Importação concluída: ${result.success} sucessos, ${result.errors.length} erros`);

    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error: any) {
    console.error('❌ Erro na importação:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
