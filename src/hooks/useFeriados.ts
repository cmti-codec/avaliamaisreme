import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Feriado {
  id: string;
  data: string;
  descricao: string;
  tipo: "FERIADO" | "PONTO_FACULTATIVO";
  abrangencia: "NACIONAL" | "ESTADUAL" | "MUNICIPAL";
  ano: number;
  compensacao_sabado_id?: string;
  created_at: string;
  created_by?: string;
}

export const useFeriados = (ano?: number) => {
  return useQuery({
    queryKey: ["feriados", ano],
    queryFn: async () => {
      let query = supabase
        .from("feriados")
        .select("*")
        .order("data", { ascending: true });

      if (ano) {
        query = query.eq("ano", ano);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Feriado[];
    },
  });
};

export const useCriarFeriado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Feriado, "id" | "created_at" | "created_by">) => {
      const { data: result, error } = await supabase
        .from("feriados")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast.success("Feriado cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar feriado: " + error.message);
    },
  });
};

export const useAtualizarFeriado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<Feriado> }) => {
      const { data: result, error } = await supabase
        .from("feriados")
        .update(data.updates)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast.success("Feriado atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar feriado: " + error.message);
    },
  });
};

export const useDeletarFeriado = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("feriados")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feriados"] });
      toast.success("Feriado excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir feriado: " + error.message);
    },
  });
};
