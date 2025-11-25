import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AnoLetivo {
  id: string;
  ano: number;
  data_inicio: string;
  data_fim: string;
  ativo: boolean;
  created_at: string;
  created_by?: string;
}

export interface Bimestre {
  id: string;
  ano_letivo_id: string;
  numero: number;
  data_inicio: string;
  data_fim: string;
  created_at: string;
}

export const useAnosLetivos = () => {
  return useQuery({
    queryKey: ["anos_letivos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anos_letivos")
        .select("*")
        .order("ano", { ascending: false });

      if (error) throw error;
      return data as AnoLetivo[];
    },
  });
};

export const useAnoLetivo = (id: string | null) => {
  return useQuery({
    queryKey: ["ano_letivo", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("anos_letivos")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as AnoLetivo;
    },
    enabled: !!id,
  });
};

export const useBimestres = (anoLetivoId: string | null) => {
  return useQuery({
    queryKey: ["bimestres", anoLetivoId],
    queryFn: async () => {
      if (!anoLetivoId) return [];

      const { data, error } = await supabase
        .from("bimestres")
        .select("*")
        .eq("ano_letivo_id", anoLetivoId)
        .order("numero", { ascending: true });

      if (error) throw error;
      return data as Bimestre[];
    },
    enabled: !!anoLetivoId,
  });
};

export const useCriarAnoLetivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      ano: number;
      data_inicio: string;
      data_fim: string;
    }) => {
      const { data: result, error } = await supabase
        .from("anos_letivos")
        .insert(data)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anos_letivos"] });
      toast.success("Ano letivo criado com sucesso! Bimestres foram gerados automaticamente.");
    },
    onError: (error: any) => {
      toast.error("Erro ao criar ano letivo: " + error.message);
    },
  });
};

export const useAtualizarAnoLetivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      updates: {
        ano?: number;
        data_inicio?: string;
        data_fim?: string;
      };
    }) => {
      const { data: result, error } = await supabase
        .from("anos_letivos")
        .update(data.updates)
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anos_letivos"] });
      queryClient.invalidateQueries({ queryKey: ["bimestres"] });
      toast.success("Ano letivo atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar ano letivo: " + error.message);
    },
  });
};

export const useAtualizarBimestre = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      id: string;
      data_inicio: string;
      data_fim: string;
    }) => {
      const { data: result, error } = await supabase
        .from("bimestres")
        .update({
          data_inicio: data.data_inicio,
          data_fim: data.data_fim,
        })
        .eq("id", data.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bimestres"] });
      toast.success("Bimestre atualizado com sucesso!");
    },
    onError: (error: any) => {
      toast.error("Erro ao atualizar bimestre: " + error.message);
    },
  });
};

export const useDesativarAnoLetivo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from("anos_letivos")
        .update({ ativo: false })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["anos_letivos"] });
      toast.success("Ano letivo desativado!");
    },
    onError: (error: any) => {
      toast.error("Erro ao desativar ano letivo: " + error.message);
    },
  });
};
