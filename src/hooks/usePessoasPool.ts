import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Pessoa {
  id: string;
  cpf: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface LotacaoAtiva {
  lotacao_id: string;
  escola_saesc: string;
  escola_nome: string;
  perfil: string;
  carga_horaria: number | null;
  data_inicio: string;
  data_fim: string | null;
}

export interface PessoaComLotacoes {
  pessoa_id: string;
  usuario_id: string;
  cpf: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  usuario_ativo: boolean;
  lotacoes_ativas: LotacaoAtiva[];
  total_lotacoes_ativas: number;
  carga_horaria_total: number | null;
}

interface FiltrosPessoas {
  status?: 'todos' | 'ativos' | 'inativos';
  lotacao?: 'todos' | 'com_lotacao' | 'sem_lotacao';
  escola_saesc?: string;
  busca?: string;
  perfil: 'PROFESSOR' | 'COORDENADOR';
}

export const usePessoasPool = (filtros: FiltrosPessoas) => {
  const queryClient = useQueryClient();

  const pessoasQuery = useQuery({
    queryKey: ["pessoas-pool", filtros],
    queryFn: async () => {
      // Buscar pessoas com lotações via view usuarios_contextualizados
      let query = supabase
        .from("usuarios_contextualizados")
        .select("*");

      // Filtrar por busca (nome, cpf, email)
      if (filtros.busca && filtros.busca.trim()) {
        const busca = filtros.busca.trim();
        query = query.or(`nome_completo.ilike.%${busca}%,cpf.ilike.%${busca}%,email.ilike.%${busca}%`);
      }

      // Filtrar por status
      if (filtros.status === 'ativos') {
        query = query.eq('usuario_ativo', true);
      } else if (filtros.status === 'inativos') {
        query = query.eq('usuario_ativo', false);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filtrar por lotação no cliente (mais complexo)
      let resultado = data || [];

      // Filtrar por perfil nas lotações
      resultado = resultado.filter(pessoa => {
        const lotacoes = Array.isArray(pessoa.lotacoes_ativas) 
          ? pessoa.lotacoes_ativas 
          : (pessoa.lotacoes_ativas ? JSON.parse(JSON.stringify(pessoa.lotacoes_ativas)) : []);
        return lotacoes.some((l: any) => l.perfil === filtros.perfil);
      });

      // Filtrar por escola
      if (filtros.escola_saesc && filtros.escola_saesc !== 'todos') {
        resultado = resultado.filter(pessoa => {
          const lotacoes = Array.isArray(pessoa.lotacoes_ativas) 
            ? pessoa.lotacoes_ativas 
            : (pessoa.lotacoes_ativas ? JSON.parse(JSON.stringify(pessoa.lotacoes_ativas)) : []);
          return lotacoes.some((l: any) => l.escola_saesc === filtros.escola_saesc);
        });
      }

      // Filtrar por lotação
      if (filtros.lotacao === 'com_lotacao') {
        resultado = resultado.filter(p => p.total_lotacoes_ativas > 0);
      } else if (filtros.lotacao === 'sem_lotacao') {
        resultado = resultado.filter(p => p.total_lotacoes_ativas === 0);
      }

      return resultado.map(r => ({
        ...r,
        lotacoes_ativas: Array.isArray(r.lotacoes_ativas) 
          ? r.lotacoes_ativas 
          : (r.lotacoes_ativas ? JSON.parse(JSON.stringify(r.lotacoes_ativas)) : [])
      })) as PessoaComLotacoes[];
    },
  });

  const criarPessoaMutation = useMutation({
    mutationFn: async (dados: Omit<Pessoa, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from("pessoas")
        .insert(dados)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      toast.success(`✅ ${data.nome_completo} cadastrado(a) com sucesso!`);
    },
    onError: (error: any) => {
      if (error.message?.includes('duplicate')) {
        toast.error("❌ CPF ou email já cadastrado no sistema");
      } else {
        toast.error("❌ Erro ao cadastrar pessoa");
      }
    },
  });

  const atualizarPessoaMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<Pessoa> }) => {
      const { error } = await supabase
        .from("pessoas")
        .update(dados)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      toast.success("✅ Dados atualizados com sucesso!");
    },
    onError: () => {
      toast.error("❌ Erro ao atualizar dados");
    },
  });

  const inativarPessoaMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pessoas")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      toast.success("✅ Pessoa inativada com sucesso!");
    },
    onError: () => {
      toast.error("❌ Erro ao inativar pessoa");
    },
  });

  return {
    pessoas: pessoasQuery.data || [],
    isLoading: pessoasQuery.isLoading,
    criarPessoa: criarPessoaMutation.mutate,
    atualizarPessoa: atualizarPessoaMutation.mutate,
    inativarPessoa: inativarPessoaMutation.mutate,
    isSaving: criarPessoaMutation.isPending || atualizarPessoaMutation.isPending,
  };
};
