import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LotacaoAtiva {
  lotacao_id: string;
  escola_saesc: string;
  escola_nome: string;
  data_inicio: string;
}

export interface DiretorSecretario {
  pessoa_id: string;
  usuario_id: string;
  cpf: string;
  nome_completo: string;
  email: string;
  lotacao_atual: LotacaoAtiva | null;
}

interface TransferenciaData {
  pessoa_id: string;
  escola_atual_saesc: string;
  nova_escola_saesc: string;
  data_transferencia: string;
  motivo?: string;
}

export const useGestoresEscolares = (perfil: 'DIRETOR' | 'SECRETARIO' | 'COORDENADOR') => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["gestores-escolares", perfil],
    queryFn: async () => {
      // Buscar pessoas com lotações via view usuarios_contextualizados
      const { data, error } = await supabase
        .from("usuarios_contextualizados")
        .select("*");

      if (error) throw error;

      // Filtrar por perfil nas lotações
      const resultado = (data || [])
        .filter(pessoa => {
          const lotacoes = Array.isArray(pessoa.lotacoes_ativas) 
            ? pessoa.lotacoes_ativas 
            : [];
          return lotacoes.some((l: any) => l.perfil === perfil);
        })
        .map(p => {
          const lotacoes = Array.isArray(p.lotacoes_ativas) 
            ? p.lotacoes_ativas 
            : [];
          const lotacaoAtual = lotacoes.find((l: any) => l.perfil === perfil) as any;
          
          return {
            pessoa_id: p.pessoa_id as string,
            usuario_id: p.usuario_id as string,
            cpf: p.cpf as string,
            nome_completo: p.nome_completo as string,
            email: p.email as string,
            lotacao_atual: lotacaoAtual ? {
              lotacao_id: String(lotacaoAtual.lotacao_id),
              escola_saesc: String(lotacaoAtual.escola_saesc),
              escola_nome: String(lotacaoAtual.escola_nome),
              data_inicio: String(lotacaoAtual.data_inicio),
            } : null,
          } as DiretorSecretario;
        });

      return resultado;
    },
  });

  const transferirMutation = useMutation({
    mutationFn: async (dados: TransferenciaData) => {
      // Validar nova escola existe
      const { data: escola, error: escolaError } = await supabase
        .from("escolas")
        .select("nome")
        .eq("saesc", dados.nova_escola_saesc)
        .maybeSingle();

      if (escolaError) throw escolaError;
      if (!escola) throw new Error("Escola não encontrada");

      // Criar nova lotação (trigger do banco encerra a anterior automaticamente)
      const { data: novaLotacao, error: lotacaoError } = await supabase
        .from("lotacoes")
        .insert({
          pessoa_id: dados.pessoa_id,
          escola_saesc: dados.nova_escola_saesc,
          perfil,
          data_inicio: dados.data_transferencia,
          observacoes: dados.motivo || null,
          ativo: true,
        })
        .select(`
          *,
          escolas!inner(nome)
        `)
        .single();

      if (lotacaoError) throw lotacaoError;

      return { novaLotacao, escolaNome: escola.nome };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["gestores-escolares"] });
      
      const cargo = perfil === 'DIRETOR' ? 'Diretor(a)' : perfil === 'SECRETARIO' ? 'Secretário(a)' : 'Coordenador(a)';
      toast.success(`✅ ${cargo} transferido(a) para ${data.escolaNome}`);
    },
    onError: (error: any) => {
      toast.error(`❌ Erro ao transferir: ${error.message}`);
    },
  });

  const lotarMutation = useMutation({
    mutationFn: async ({ pessoa_id, escola_saesc, data_inicio, observacoes }: {
      pessoa_id: string;
      escola_saesc: string;
      data_inicio: string;
      observacoes?: string;
    }) => {
      const { data, error } = await supabase
        .from("lotacoes")
        .insert({
          pessoa_id,
          escola_saesc,
          perfil,
          data_inicio,
          observacoes: observacoes || null,
          ativo: true,
        })
        .select(`
          *,
          escolas!inner(nome)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["gestores-escolares"] });
      
      const escolaNome = data.escolas?.nome || "escola";
      const cargo = perfil === 'DIRETOR' ? 'Diretor(a)' : perfil === 'SECRETARIO' ? 'Secretário(a)' : 'Coordenador(a)';
      toast.success(`✅ ${cargo} lotado(a) em ${escolaNome}`);
    },
    onError: (error: any) => {
      toast.error(`❌ Erro ao lotar: ${error.message}`);
    },
  });

  return {
    pessoas: query.data || [],
    isLoading: query.isLoading,
    transferir: transferirMutation.mutate,
    lotar: lotarMutation.mutate,
    isTransferindo: transferirMutation.isPending || lotarMutation.isPending,
  };
};
