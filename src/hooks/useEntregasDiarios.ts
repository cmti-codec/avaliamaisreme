import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EntregaDiarios {
  id: string;
  escola_id: string;
  ano_letivo_id: string;
  bimestre_id: string;
  data: string;
  descricao?: string;
  turmas_ids?: string[];
  segmentos?: string[];
  professores_entregaram: Array<{ professor_id: string; data_entrega: string }>;
  created_at: string;
  created_by?: string;
}

export const useEntregasDiarios = (escolaId?: string, anoLetivoId?: string) => {
  return useQuery({
    queryKey: ["entregas_diarios", escolaId, anoLetivoId],
    queryFn: async () => {
      let query = supabase
        .from("entregas_diarios")
        .select("*")
        .order("data", { ascending: true });

      if (escolaId) {
        query = query.eq("escola_id", escolaId);
      }
      
      if (anoLetivoId) {
        query = query.eq("ano_letivo_id", anoLetivoId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as EntregaDiarios[];
    },
  });
};

export const useCriarEntregaDiarios = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<EntregaDiarios, "id" | "created_at" | "created_by" | "professores_entregaram">) => {
      const { data: result, error } = await supabase
        .from("entregas_diarios")
        .insert({ ...data, professores_entregaram: [] })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas_diarios"] });
      toast.success("Entrega de diários cadastrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar entrega: " + error.message);
    },
  });
};

export const useRegistrarEntrega = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; professor_id: string }) => {
      // Buscar registro atual
      const { data: current, error: fetchError } = await supabase
        .from("entregas_diarios")
        .select("professores_entregaram")
        .eq("id", data.id)
        .single();

      if (fetchError) throw fetchError;

      const professoresEntregaram = Array.isArray(current.professores_entregaram) 
        ? [...current.professores_entregaram]
        : [];
      
      professoresEntregaram.push({
        professor_id: data.professor_id,
        data_entrega: new Date().toISOString(),
      });

      const { data: result, error } = await supabase
        .from("entregas_diarios")
        .update({ professores_entregaram: professoresEntregaram })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas_diarios"] });
      toast.success("Entrega registrada com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao registrar entrega: " + error.message);
    },
  });
};

export const useDeletarEntregaDiarios = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("entregas_diarios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["entregas_diarios"] });
      toast.success("Entrega de diários excluída!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir entrega: " + error.message);
    },
  });
};
