import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SabadoLetivo {
  id: string;
  escola_id: string;
  data: string;
  tipo: "REPLICA_DIA_SEMANA" | "EVENTO_GERAL";
  dia_replica?: "SEGUNDA" | "TERCA" | "QUARTA" | "QUINTA" | "SEXTA";
  segmentos?: string[];
  turnos?: string[];
  descricao?: string;
  exige_chamada: boolean;
  created_at: string;
  created_by?: string;
}

export const useSabadosLetivos = (escolaId?: string, ano?: number) => {
  return useQuery({
    queryKey: ["sabados_letivos", escolaId, ano],
    queryFn: async () => {
      let query = supabase
        .from("sabados_letivos")
        .select("*")
        .order("data", { ascending: true });

      if (escolaId) {
        query = query.eq("escola_id", escolaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let result = data as SabadoLetivo[];
      
      if (ano) {
        result = result.filter(s => new Date(s.data).getFullYear() === ano);
      }
      
      return result;
    },
  });
};

export const useCriarSabadoLetivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<SabadoLetivo, "id" | "created_at" | "created_by">) => {
      const { data: result, error } = await supabase
        .from("sabados_letivos")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sabados_letivos"] });
      toast.success("Sábado letivo cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar sábado letivo: " + error.message);
    },
  });
};

export const useAtualizarSabadoLetivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Omit<SabadoLetivo, "id" | "created_at" | "created_by">> }) => {
      const { data: result, error } = await supabase
        .from("sabados_letivos")
        .update(data.updates)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sabados_letivos"] });
      toast.success("Sábado letivo atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar sábado letivo: " + error.message);
    },
  });
};

export const useDeletarSabadoLetivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sabados_letivos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sabados_letivos"] });
      toast.success("Sábado letivo excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir sábado letivo: " + error.message);
    },
  });
};
