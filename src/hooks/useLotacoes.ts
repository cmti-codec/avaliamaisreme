import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lotacao {
  id: string;
  professor_id: string;
  escola_id: string;
  ano_letivo: string;
  horas_aula: number | null;
  pl: number | null;
  carga_total: number | null;
  status: 'ATIVO' | 'INATIVO';
  created_at: string;
  professor?: {
    nome: string;
    matricula: string;
    email?: string;
    telefone?: string;
    formacoes?: any;
    funcao_atual?: string;
    tipo_vinculo?: string;
    carga_horaria_contratual?: number;
  };
}

export const useLotacoes = (escolaId: string, anoLetivo: string) => {
  const queryClient = useQueryClient();

  const lotacoesQuery = useQuery({
    queryKey: ["lotacoes", escolaId, anoLetivo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lotacoes_professores")
        .select(`
          *,
          professor:professores(
            nome, 
            matricula, 
            email, 
            telefone, 
            formacoes, 
            funcao_atual,
            tipo_vinculo,
            carga_horaria_contratual
          )
        `)
        .eq("escola_id", escolaId)
        .eq("ano_letivo", anoLetivo)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Lotacao[];
    },
    enabled: !!escolaId && !!anoLetivo,
  });

  const criarLotacaoMutation = useMutation({
    mutationFn: async (dados: {
      professor_id: string;
      escola_id: string;
      ano_letivo: string;
    }) => {
      // Validação: verificar se não existe professor duplicado
      const { data: professorData, error: profError } = await supabase
        .from("professores")
        .select("id, nome")
        .eq("id", dados.professor_id)
        .single();

      if (profError) throw new Error("Professor não encontrado");

      // Verificar se existe outro professor com o mesmo nome (case insensitive)
      const { data: duplicatas, error: dupError } = await supabase
        .from("professores")
        .select("id, nome, ativo, usuario_id")
        .ilike("nome", professorData.nome)
        .neq("id", dados.professor_id);

      if (!dupError && duplicatas && duplicatas.length > 0) {
        throw new Error(`⚠️ Detectado professor duplicado: "${professorData.nome}". Contate o administrador para resolver.`);
      }

      const { data, error } = await supabase
        .from("lotacoes_professores")
        .insert({
          ...dados,
          status: 'ATIVO'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Professor lotado com sucesso!");
    },
    onError: (error: any) => {
      const msg = error.message || "";
      if (msg.includes('excede')) {
        toast.error("❌ Carga horária excede o limite de 50h na rede!");
      } else if (msg.includes('duplicate') || msg.includes('duplicado')) {
        toast.error(msg.includes('Detectado') ? msg : "Este professor já está lotado nesta escola/ano.");
      } else {
        toast.error(msg || "Erro ao lotar professor");
      }
    },
  });

  const atualizarCargaMutation = useMutation({
    mutationFn: async ({ 
      id, 
      horas_aula, 
      pl 
    }: { 
      id: string; 
      horas_aula: number; 
      pl: number;
    }) => {
      const { error } = await supabase
        .from("lotacoes_professores")
        .update({ horas_aula, pl })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Carga horária atualizada!");
    },
    onError: (error: any) => {
      const msg = error.message || "";
      if (msg.includes('excede')) {
        toast.error("❌ Carga horária excede o limite de 50h na rede!");
      } else {
        toast.error("Erro ao atualizar carga");
      }
    },
  });

  const removerLotacaoMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("lotacoes_professores")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      toast.success("Lotação removida!");
    },
    onError: () => {
      toast.error("Erro ao remover lotação");
    },
  });

  return {
    lotacoes: lotacoesQuery.data || [],
    isLoading: lotacoesQuery.isLoading,
    criarLotacao: criarLotacaoMutation.mutate,
    atualizarCarga: atualizarCargaMutation.mutate,
    removerLotacao: removerLotacaoMutation.mutate,
    isSaving: criarLotacaoMutation.isPending || atualizarCargaMutation.isPending,
  };
};
