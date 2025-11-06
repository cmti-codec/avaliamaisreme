import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface NovaLotacao {
  pessoa_id: string;
  escola_saesc: string;
  perfil: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'SECRETARIO';
  carga_horaria?: number;
  data_inicio: string;
  observacoes?: string;
}

export interface Lotacao {
  id: string;
  pessoa_id: string;
  escola_saesc: string;
  perfil: string;
  data_inicio: string;
  data_fim: string | null;
  carga_horaria: number | null;
  observacoes: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useLotacoesGestao = (pessoaId?: string) => {
  const queryClient = useQueryClient();

  const lotacoesQuery = useQuery({
    queryKey: ["lotacoes-gestao", pessoaId],
    queryFn: async () => {
      if (!pessoaId) return [];

      const { data, error } = await supabase
        .from("lotacoes")
        .select(`
          *,
          escola:escolas!inner(nome, saesc)
        `)
        .eq("pessoa_id", pessoaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!pessoaId,
  });

  const criarLotacaoMutation = useMutation({
    mutationFn: async (dados: NovaLotacao) => {
      // Validar carga horária se for professor
      if (dados.perfil === 'PROFESSOR' && (!dados.carga_horaria || dados.carga_horaria <= 0)) {
        throw new Error("Carga horária obrigatória para professores");
      }

      // Validar que não seja professor com carga > 60h
      if (dados.perfil === 'PROFESSOR' && dados.carga_horaria && dados.carga_horaria > 60) {
        throw new Error("Carga horária não pode exceder 60h");
      }

      const { data, error } = await supabase
        .from("lotacoes")
        .insert({
          ...dados,
          ativo: true,
        })
        .select(`
          *,
          escola:escolas!inner(nome)
        `)
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      
      const escolaNome = data.escola?.nome || "escola selecionada";
      const carga = data.carga_horaria ? `com ${data.carga_horaria}h/semana` : "";
      toast.success(`✅ Lotação criada em ${escolaNome} ${carga}`);
    },
    onError: (error: any) => {
      toast.error(`❌ ${error.message || "Erro ao criar lotação"}`);
    },
  });

  const atualizarLotacaoMutation = useMutation({
    mutationFn: async ({ id, dados }: { id: string; dados: Partial<Lotacao> }) => {
      const { error } = await supabase
        .from("lotacoes")
        .update(dados)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      toast.success("✅ Lotação atualizada!");
    },
    onError: () => {
      toast.error("❌ Erro ao atualizar lotação");
    },
  });

  const encerrarLotacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lotacoes")
        .update({
          ativo: false,
          data_fim: new Date().toISOString().split('T')[0],
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes-gestao"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      toast.success("✅ Lotação encerrada!");
    },
    onError: () => {
      toast.error("❌ Erro ao encerrar lotação");
    },
  });

  return {
    lotacoes: lotacoesQuery.data || [],
    isLoading: lotacoesQuery.isLoading,
    criarLotacao: criarLotacaoMutation.mutate,
    atualizarLotacao: atualizarLotacaoMutation.mutate,
    encerrarLotacao: encerrarLotacaoMutation.mutate,
    isSaving: criarLotacaoMutation.isPending || atualizarLotacaoMutation.isPending,
  };
};
