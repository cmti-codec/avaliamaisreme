import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface EventoInstitucional {
  id: string;
  escola_id: string;
  data: string;
  descricao: string;
  tipo: string;
  participantes?: any;
  bloqueia_letivo: boolean;
  observacoes?: string;
  created_at: string;
  created_by?: string;
}

export const useEventosInstitucionais = (escolaId?: string, ano?: number) => {
  return useQuery({
    queryKey: ["eventos_institucionais", escolaId, ano],
    queryFn: async () => {
      let query = supabase
        .from("eventos_institucionais")
        .select("*")
        .order("data", { ascending: true });

      if (escolaId) {
        query = query.eq("escola_id", escolaId);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      let result = data as EventoInstitucional[];
      
      if (ano) {
        result = result.filter(e => new Date(e.data).getFullYear() === ano);
      }
      
      return result;
    },
  });
};

export const useCriarEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<EventoInstitucional, "id" | "created_at" | "created_by">) => {
      const { data: result, error } = await supabase
        .from("eventos_institucionais")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos_institucionais"] });
      toast.success("Evento cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar evento: " + error.message);
    },
  });
};

export const useAtualizarEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<EventoInstitucional> }) => {
      const { data: result, error } = await supabase
        .from("eventos_institucionais")
        .update(data.updates)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos_institucionais"] });
      toast.success("Evento atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar evento: " + error.message);
    },
  });
};

export const useDeletarEvento = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("eventos_institucionais")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["eventos_institucionais"] });
      toast.success("Evento excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir evento: " + error.message);
    },
  });
};
