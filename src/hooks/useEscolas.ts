import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Escola {
  id: string;
  nome: string;
  codigo_inep: string | null;
  codigo_saesc: string | null;
  saesc: string | null;
  tipo: string | null;
  localidade: string | null;
  regiao: string | null;
  endereco: string | null;
  telefone: string | null;
  email: string | null;
  matriz_curricular_id: string | null;
  ativa: boolean;
  created_at: string;
}

export interface EscolaComMatriz extends Escola {
  matriz?: {
    id: string;
    codigo: string;
    nome: string;
    etapa_modalidade: string;
  } | null;
}

export const useEscolas = () => {
  return useQuery({
    queryKey: ["escolas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escolas")
        .select(`
          *,
          matriz:matrizes_curriculares(id, codigo, nome, etapa_modalidade)
        `)
        .order("nome", { ascending: true });

      if (error) throw error;

      return (data || []).map((escola: any) => ({
        ...escola,
        matriz: escola.matriz || null,
      })) as EscolaComMatriz[];
    },
  });
};

export const useEscola = (id: string | null) => {
  return useQuery({
    queryKey: ["escola", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("escolas")
        .select(`
          *,
          matriz:matrizes_curriculares(
            id, 
            codigo, 
            nome, 
            etapa_modalidade,
            componentes:matriz_componentes(
              componente_nome,
              carga_horaria_semanal,
              ordem
            )
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EscolaComMatriz;
    },
    enabled: !!id,
  });
};

export const useAtribuirMatriz = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: { escolaId: string; matrizId: string | null }) => {
      const { error } = await supabase
        .from("escolas")
        .update({ matriz_curricular_id: dados.matrizId })
        .eq("id", dados.escolaId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast({
        title: "✅ Matriz atribuída com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atribuir matriz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useAtribuirMatrizEmLote = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: { escolasIds: string[]; matrizId: string }) => {
      // Usar transaction para garantir atomicidade
      const promises = dados.escolasIds.map((id) =>
        supabase
          .from("escolas")
          .update({ matriz_curricular_id: dados.matrizId })
          .eq("id", id)
      );

      const results = await Promise.all(promises);
      
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`Falha ao atribuir ${errors.length} escolas`);
      }

      return results.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      toast({
        title: `✅ Matriz atribuída para ${count} escolas com sucesso!`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na atribuição em lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
