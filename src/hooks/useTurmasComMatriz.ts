import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TurmaComMatriz {
  turma_id: string;
  saesc: string;
  etapa_modalidade: string;
  grupo_ano: string;
  turma: string;
  turno: string;
  nome_escola: string;
  matriz_id: string | null;
  matriz_codigo: string | null;
  matriz_nome: string | null;
  total_horas_semanais: number | null;
  componentes: Record<string, { carga: number; ordem: number }> | null;
}

export const useTurmaComMatriz = (turmaId: string | null) => {
  return useQuery({
    queryKey: ["turma_com_matriz", turmaId],
    queryFn: async () => {
      if (!turmaId) return null;

      const { data, error } = await supabase
        .from("turmas_com_matriz")
        .select("*")
        .eq("turma_id", turmaId)
        .maybeSingle();

      if (error) throw error;
      return data as TurmaComMatriz | null;
    },
    enabled: !!turmaId,
  });
};
