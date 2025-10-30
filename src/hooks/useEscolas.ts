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
  matrizes?: Array<{
    id: string;
    codigo: string;
    nome: string;
    etapa_modalidade: string;
    grupo_ano: string;
    tipo_jornada: string | null;
  }>;
  // Mantido para compatibilidade com código antigo
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

      // Buscar matrizes da nova tabela
      const escolasComMatrizes = await Promise.all(
        (data || []).map(async (escola) => {
          const { data: matrizesData } = await supabase
            .from("escola_matrizes")
            .select(`
              matriz_id,
              matrizes_curriculares(id, codigo, nome, etapa_modalidade, grupo_ano, tipo_jornada)
            `)
            .eq("escola_id", escola.id);

          const matrizes = matrizesData?.map((m: any) => m.matrizes_curriculares) || [];

          return {
            ...escola,
            matrizes,
          } as EscolaComMatriz;
        })
      );

      return escolasComMatrizes;
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

      // Buscar matrizes da nova tabela
      const { data: matrizesData } = await supabase
        .from("escola_matrizes")
        .select(`
          matriz_id,
          matrizes_curriculares(
            id,
            codigo,
            nome,
            etapa_modalidade,
            grupo_ano,
            tipo_jornada,
            total_horas_semanais,
            componentes:matriz_componentes(*)
          )
        `)
        .eq("escola_id", id);

      const matrizes = matrizesData?.map((m: any) => m.matrizes_curriculares) || [];

      return {
        ...data,
        matrizes,
      } as EscolaComMatriz;
    },
    enabled: !!id,
  });
};

export const useAtribuirMatrizes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: {
      escolaId: string;
      matrizesIds: string[];
    }) => {
      // Deletar matrizes antigas
      await supabase
        .from("escola_matrizes")
        .delete()
        .eq("escola_id", dados.escolaId);

      // Inserir novas matrizes
      if (dados.matrizesIds.length > 0) {
        const inserts = dados.matrizesIds.map((matrizId) => ({
          escola_id: dados.escolaId,
          matriz_id: matrizId,
        }));

        const { error } = await supabase
          .from("escola_matrizes")
          .insert(inserts);

        if (error) throw error;
      }

      // Atualizar matriz_curricular_id para compatibilidade (primeira matriz ou null)
      await supabase
        .from("escolas")
        .update({ matriz_curricular_id: dados.matrizesIds[0] || null })
        .eq("id", dados.escolaId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      queryClient.invalidateQueries({ queryKey: ["escola", variables.escolaId] });
      
      const qtd = variables.matrizesIds.length;
      toast({
        title: "✅ Matrizes atribuídas com sucesso!",
        description: qtd === 0 
          ? "Todas as matrizes foram removidas" 
          : `${qtd} matriz(es) atribuída(s) à escola`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atribuir matrizes",
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
    mutationFn: async (dados: {
      escolasIds: string[];
      matrizesIds: string[];
    }) => {
      // Para cada escola, deletar matrizes antigas e inserir novas
      const updates = dados.escolasIds.map(async (escolaId) => {
        // Deletar matrizes antigas
        await supabase
          .from("escola_matrizes")
          .delete()
          .eq("escola_id", escolaId);

        // Inserir novas matrizes
        if (dados.matrizesIds.length > 0) {
          const inserts = dados.matrizesIds.map((matrizId) => ({
            escola_id: escolaId,
            matriz_id: matrizId,
          }));

          await supabase
            .from("escola_matrizes")
            .insert(inserts);
        }

        // Atualizar matriz_curricular_id para compatibilidade
        await supabase
          .from("escolas")
          .update({ matriz_curricular_id: dados.matrizesIds[0] || null })
          .eq("id", escolaId);
      });

      await Promise.all(updates);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["escolas"] });
      
      const qtdMatrizes = variables.matrizesIds.length;
      toast({
        title: "✅ Matrizes atribuídas em lote com sucesso!",
        description: `${qtdMatrizes} matriz(es) atribuída(s) para ${variables.escolasIds.length} escola(s).`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atribuir matrizes em lote",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};
