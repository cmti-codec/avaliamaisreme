import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Avaliacao {
  id: string;
  diario_id: string;
  aluno_id: string;
  tipo_avaliacao: string;
  titulo: string;
  data_avaliacao: string;
  nota: number | null;
  nota_maxima: number | null;
  observacao: string | null;
  lancado_por: string | null;
  lancado_em: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AvaliacaoInput {
  diario_id: string;
  aluno_id: string;
  tipo_avaliacao: string;
  titulo: string;
  data_avaliacao: string;
  nota: number | null;
  nota_maxima: number;
  observacao?: string;
}

// Hook para buscar avaliações de um diário
export const useAvaliacoesDoDiario = (diarioId: string | null) => {
  return useQuery({
    queryKey: ["avaliacoes_diario", diarioId],
    queryFn: async () => {
      if (!diarioId) return [];

      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("diario_id", diarioId)
        .order("data_avaliacao", { ascending: false })
        .order("titulo");

      if (error) throw error;
      return data as Avaliacao[];
    },
    enabled: !!diarioId,
  });
};

// Hook para buscar avaliações de um aluno específico
export const useAvaliacoesDoAluno = (diarioId: string | null, alunoId: string | null) => {
  return useQuery({
    queryKey: ["avaliacoes_aluno", diarioId, alunoId],
    queryFn: async () => {
      if (!diarioId || !alunoId) return [];

      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("diario_id", diarioId)
        .eq("aluno_id", alunoId)
        .order("data_avaliacao", { ascending: false });

      if (error) throw error;
      return data as Avaliacao[];
    },
    enabled: !!diarioId && !!alunoId,
  });
};

// Hook para buscar avaliações agrupadas por título (para lançamento em lote)
export const useAvaliacoesAgrupadasPorTitulo = (diarioId: string | null) => {
  return useQuery({
    queryKey: ["avaliacoes_agrupadas", diarioId],
    queryFn: async () => {
      if (!diarioId) return [];

      const { data, error } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("diario_id", diarioId)
        .order("data_avaliacao", { ascending: false })
        .order("titulo");

      if (error) throw error;

      // Agrupar por título da avaliação
      const avaliacoes = data as Avaliacao[];
      const grupos = avaliacoes.reduce((acc, avaliacao) => {
        const chave = `${avaliacao.titulo}|${avaliacao.tipo_avaliacao}|${avaliacao.data_avaliacao}|${avaliacao.nota_maxima}`;
        if (!acc[chave]) {
          acc[chave] = {
            titulo: avaliacao.titulo,
            tipo_avaliacao: avaliacao.tipo_avaliacao,
            data_avaliacao: avaliacao.data_avaliacao,
            nota_maxima: avaliacao.nota_maxima,
            avaliacoes: [],
          };
        }
        acc[chave].avaliacoes.push(avaliacao);
        return acc;
      }, {} as Record<string, any>);

      return Object.values(grupos);
    },
    enabled: !!diarioId,
  });
};

// Hook para salvar/atualizar avaliações (em lote)
export const useSalvarAvaliacoes = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avaliacoes: AvaliacaoInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Adicionar informações de auditoria
      const avaliacoesComAuditoria = avaliacoes.map((avaliacao) => ({
        ...avaliacao,
        lancado_por: user.id,
        lancado_em: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from("avaliacoes")
        .upsert(avaliacoesComAuditoria, {
          onConflict: "diario_id,aluno_id,titulo,data_avaliacao",
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, avaliacoes) => {
      toast.success("Avaliações salvas com sucesso!");
      
      // Invalidar queries relacionadas
      const diarioId = avaliacoes[0]?.diario_id;
      if (diarioId) {
        queryClient.invalidateQueries({ queryKey: ["avaliacoes_diario", diarioId] });
        queryClient.invalidateQueries({ queryKey: ["avaliacoes_agrupadas", diarioId] });
        avaliacoes.forEach((av) => {
          queryClient.invalidateQueries({ 
            queryKey: ["avaliacoes_aluno", diarioId, av.aluno_id] 
          });
        });
      }
    },
    onError: (error) => {
      console.error("Erro ao salvar avaliações:", error);
      toast.error("Erro ao salvar avaliações", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      });
    },
  });
};

// Hook para deletar uma avaliação
export const useDeletarAvaliacao = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avaliacaoId: string) => {
      const { error } = await supabase
        .from("avaliacoes")
        .delete()
        .eq("id", avaliacaoId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Avaliação deletada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["avaliacoes_diario"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes_agrupadas"] });
      queryClient.invalidateQueries({ queryKey: ["avaliacoes_aluno"] });
    },
    onError: (error) => {
      console.error("Erro ao deletar avaliação:", error);
      toast.error("Erro ao deletar avaliação");
    },
  });
};

// Hook para deletar todas avaliações de um título (em lote)
export const useDeletarAvaliacoesPorTitulo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      diario_id, 
      titulo, 
      data_avaliacao 
    }: { 
      diario_id: string; 
      titulo: string; 
      data_avaliacao: string;
    }) => {
      const { error } = await supabase
        .from("avaliacoes")
        .delete()
        .eq("diario_id", diario_id)
        .eq("titulo", titulo)
        .eq("data_avaliacao", data_avaliacao);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success("Avaliação deletada com sucesso!");
      queryClient.invalidateQueries({ 
        queryKey: ["avaliacoes_diario", variables.diario_id] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["avaliacoes_agrupadas", variables.diario_id] 
      });
    },
    onError: (error) => {
      console.error("Erro ao deletar avaliações:", error);
      toast.error("Erro ao deletar avaliações");
    },
  });
};
