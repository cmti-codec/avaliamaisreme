import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ConselhoClasse {
  id: string;
  escola_id: string;
  ano_letivo_id: string;
  bimestre_id: string;
  data: string;
  descricao?: string;
  turmas_ids?: string[];
  segmentos?: string[];
  bloqueia_edicao_avaliacoes: boolean;
  created_at: string;
  created_by?: string;
}

export const useConselhos = (escolaId?: string, anoLetivoId?: string) => {
  return useQuery({
    queryKey: ["conselhos_classe", escolaId, anoLetivoId],
    queryFn: async () => {
      let query = supabase
        .from("conselhos_classe")
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
      return data as ConselhoClasse[];
    },
  });
};

export const useCriarConselho = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ConselhoClasse, "id" | "created_at" | "created_by">) => {
      const { data: result, error } = await supabase
        .from("conselhos_classe")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conselhos_classe"] });
      toast.success("Conselho de classe cadastrado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao cadastrar conselho: " + error.message);
    },
  });
};

export const useAtualizarConselho = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; updates: Partial<ConselhoClasse> }) => {
      const { data: result, error } = await supabase
        .from("conselhos_classe")
        .update(data.updates)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conselhos_classe"] });
      toast.success("Conselho atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar conselho: " + error.message);
    },
  });
};

export const useDeletarConselho = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("conselhos_classe")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conselhos_classe"] });
      toast.success("Conselho excluído!");
    },
    onError: (error: any) => {
      toast.error("Erro ao excluir conselho: " + error.message);
    },
  });
};
