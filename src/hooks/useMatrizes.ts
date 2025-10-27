import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface MatrizCurricular {
  id: string;
  codigo: string;
  nome: string;
  etapa_modalidade: string;
  grupo_ano: string;
  tipo_jornada: "PARCIAL" | "INTEGRAL" | null;
  total_horas_semanais: number | null;
  descricao: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
}

export interface MatrizComponente {
  id: string;
  matriz_id: string;
  componente_nome: string;
  carga_horaria_semanal: number;
  ordem: number;
  grupo_ano: string; // Ano específico dentro da matriz (ex: "1º ANO", "2º ANO")
}

export interface MatrizComComponentes extends MatrizCurricular {
  componentes: MatrizComponente[];
  qtd_componentes: number;
}

export const useMatrizes = () => {
  return useQuery({
    queryKey: ["matrizes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matrizes_curriculares")
        .select(`
          *,
          componentes:matriz_componentes(*)
        `)
        .order("codigo", { ascending: true });

      if (error) throw error;

      return (data || []).map((matriz: any) => ({
        ...matriz,
        componentes: matriz.componentes || [],
        qtd_componentes: matriz.componentes?.length || 0,
      })) as MatrizComComponentes[];
    },
  });
};

export const useMatriz = (id: string | null) => {
  return useQuery({
    queryKey: ["matriz", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("matrizes_curriculares")
        .select(`
          *,
          componentes:matriz_componentes(*)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        ...data,
        componentes: data.componentes || [],
      } as MatrizComComponentes;
    },
    enabled: !!id,
  });
};

export const useCreateMatriz = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: {
      matriz: Omit<MatrizCurricular, "id" | "created_at" | "updated_at">;
      componentes: Array<{ componente_nome: string; carga_horaria_semanal: number; ordem: number; grupo_ano: string }>;
    }) => {
      // Verificar se código já existe
      const { data: existe } = await supabase
        .from("matrizes_curriculares")
        .select("id")
        .eq("codigo", dados.matriz.codigo)
        .maybeSingle();

      if (existe) {
        throw new Error(`Código "${dados.matriz.codigo}" já existe`);
      }

      // Inserir matriz
      const { data: matrizData, error: matrizError } = await supabase
        .from("matrizes_curriculares")
        .insert(dados.matriz)
        .select()
        .single();

      if (matrizError) throw matrizError;

      // Inserir componentes
      if (dados.componentes.length > 0) {
        const componentesComMatrizId = dados.componentes.map((c) => ({
          ...c,
          matriz_id: matrizData.id,
        }));

        const { error: compError } = await supabase
          .from("matriz_componentes")
          .insert(componentesComMatrizId);

        if (compError) throw compError;
      }

      return matrizData;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["matrizes"] });
      toast({
        title: "✅ Matriz criada com sucesso!",
        description: `Matriz ${data.codigo} foi criada.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar matriz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMatriz = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dados: {
      id: string;
      matriz: Partial<MatrizCurricular>;
      componentes?: Array<{ id?: string; componente_nome: string; carga_horaria_semanal: number; ordem: number; grupo_ano: string }>;
    }) => {
      // Atualizar matriz
      const { error: matrizError } = await supabase
        .from("matrizes_curriculares")
        .update(dados.matriz)
        .eq("id", dados.id);

      if (matrizError) throw matrizError;

      // Se componentes foram passados, atualizar
      if (dados.componentes) {
        // Deletar componentes antigos
        await supabase
          .from("matriz_componentes")
          .delete()
          .eq("matriz_id", dados.id);

        // Inserir novos componentes
        if (dados.componentes.length > 0) {
          const componentesComMatrizId = dados.componentes.map((c) => ({
            componente_nome: c.componente_nome,
            carga_horaria_semanal: c.carga_horaria_semanal,
            ordem: c.ordem,
            grupo_ano: c.grupo_ano,
            matriz_id: dados.id,
          }));

          const { error: compError } = await supabase
            .from("matriz_componentes")
            .insert(componentesComMatrizId);

          if (compError) throw compError;
        }
      }

      return dados.id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["matrizes"] });
      toast({
        title: "✅ Matriz atualizada com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar matriz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMatriz = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // Verificar se está sendo usada por alguma escola
      const { data: escolas, error: escolasError } = await supabase
        .from("escolas")
        .select("nome")
        .eq("matriz_curricular_id", id);

      if (escolasError) throw escolasError;

      if (escolas && escolas.length > 0) {
        // Não permitir exclusão, apenas inativar
        const { error } = await supabase
          .from("matrizes_curriculares")
          .update({ ativa: false })
          .eq("id", id);

        if (error) throw error;

        return { inativada: true, escolas };
      }

      // Se não está sendo usada, pode deletar
      const { error } = await supabase
        .from("matrizes_curriculares")
        .delete()
        .eq("id", id);

      if (error) throw error;

      return { inativada: false };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["matrizes"] });
      
      if (result.inativada) {
        toast({
          title: "Matriz inativada",
          description: `A matriz está sendo usada por ${result.escolas?.length} escola(s) e foi inativada.`,
        });
      } else {
        toast({
          title: "✅ Matriz excluída com sucesso!",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao excluir matriz",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useComponentesCurriculares = () => {
  return useQuery({
    queryKey: ["componentes_curriculares"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("componentes_curriculares")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;
      return data || [];
    },
  });
};
