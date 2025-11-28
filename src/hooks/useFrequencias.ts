import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Frequencia {
  id: string;
  diario_id: string;
  aluno_id: string;
  data_aula: string;
  tempo: number;
  presente: boolean;
  justificativa?: string;
  observacao?: string;
  lancado_em?: string;
  lancado_por?: string;
}

export interface FrequenciaInput {
  diario_id: string;
  aluno_id: string;
  data_aula: string;
  tempo: number;
  presente: boolean;
  justificativa?: string;
  observacao?: string;
}

// Hook para buscar frequências de uma aula específica (diário + data + tempo)
export const useFrequenciasDaAula = (
  diarioId: string | null,
  dataAula: string | null,
  tempo: number | null
) => {
  return useQuery({
    queryKey: ["frequencias_aula", diarioId, dataAula, tempo],
    queryFn: async () => {
      if (!diarioId || !dataAula || tempo === null) return [];

      const { data, error } = await supabase
        .from("frequencias")
        .select("*")
        .eq("diario_id", diarioId)
        .eq("data_aula", dataAula)
        .eq("tempo", tempo)
        .order("aluno_id");

      if (error) throw error;
      return data as Frequencia[];
    },
    enabled: !!diarioId && !!dataAula && tempo !== null,
  });
};

// Hook para buscar frequências de um aluno em um diário
export const useFrequenciasDoAluno = (
  diarioId: string | null,
  alunoId: string | null
) => {
  return useQuery({
    queryKey: ["frequencias_aluno", diarioId, alunoId],
    queryFn: async () => {
      if (!diarioId || !alunoId) return [];

      const { data, error } = await supabase
        .from("frequencias")
        .select("*")
        .eq("diario_id", diarioId)
        .eq("aluno_id", alunoId)
        .order("data_aula", { ascending: false });

      if (error) throw error;
      return data as Frequencia[];
    },
    enabled: !!diarioId && !!alunoId,
  });
};

// Hook para salvar/atualizar frequências (lançamento em lote)
export const useSalvarFrequencias = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frequencias: FrequenciaInput[]) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Preparar dados com lancado_por
      const frequenciasComUsuario = frequencias.map((f) => ({
        ...f,
        lancado_por: user.id,
        lancado_em: new Date().toISOString(),
      }));

      // Usar upsert para inserir ou atualizar
      // A chave única é: (diario_id, aluno_id, data_aula, tempo)
      const { data, error } = await supabase
        .from("frequencias")
        .upsert(frequenciasComUsuario, {
          onConflict: "diario_id,aluno_id,data_aula,tempo",
        })
        .select();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidar queries relacionadas
      const diarioId = variables[0]?.diario_id;
      const dataAula = variables[0]?.data_aula;
      const tempo = variables[0]?.tempo;

      queryClient.invalidateQueries({
        queryKey: ["frequencias_aula", diarioId, dataAula, tempo],
      });

      variables.forEach((freq) => {
        queryClient.invalidateQueries({
          queryKey: ["frequencias_aluno", diarioId, freq.aluno_id],
        });
      });

      toast.success("Frequências salvas com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao salvar frequências:", error);
      toast.error("Erro ao salvar frequências", {
        description: error.message || "Tente novamente",
      });
    },
  });
};

// Hook para deletar uma frequência
export const useDeletarFrequencia = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (frequenciaId: string) => {
      const { error } = await supabase
        .from("frequencias")
        .delete()
        .eq("id", frequenciaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["frequencias_aula"] });
      queryClient.invalidateQueries({ queryKey: ["frequencias_aluno"] });
      toast.success("Frequência removida com sucesso!");
    },
    onError: (error: any) => {
      console.error("Erro ao deletar frequência:", error);
      toast.error("Erro ao deletar frequência", {
        description: error.message || "Tente novamente",
      });
    },
  });
};
