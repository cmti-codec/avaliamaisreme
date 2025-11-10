import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Lotacao {
  id: string;
  pessoa_id: string;
  escola_saesc: string;
  ano_letivo: string;
  horas_aula: number | null;
  pl: number | null;
  carga_total: number | null;
  status: string;
  created_at: string;
  pessoa?: {
    nome_completo: string;
    cpf: string;
    email: string;
    telefone?: string;
  };
  professor?: {
    matricula: string;
    formacoes?: any;
    funcao_atual?: string;
    tipo_vinculo?: string;
    carga_horaria_contratual?: number;
  };
}

export const useLotacoes = (escolaSaesc: string, anoLetivo: string) => {
  const queryClient = useQueryClient();

  const lotacoesQuery = useQuery({
    queryKey: ["lotacoes", escolaSaesc, anoLetivo],
    queryFn: async () => {
      // Buscar lotações de professores
      const { data, error } = await supabase
        .from("lotacoes")
        .select(`
          *,
          pessoa:pessoas!inner(nome_completo, cpf, email, telefone)
        `)
        .eq("escola_saesc", escolaSaesc)
        .eq("perfil", "PROFESSOR")
        .eq("ano_letivo", anoLetivo)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Buscar dados adicionais de professores
      const pessoaIds = data?.map(l => l.pessoa_id) || [];
      let professoresMap = new Map();

      if (pessoaIds.length > 0) {
        // Buscar dados de professores via usuarios
        const { data: usuariosData } = await supabase
          .from("usuarios")
          .select("pessoa_id, id")
          .in("pessoa_id", pessoaIds);

        if (usuariosData && usuariosData.length > 0) {
          const usuarioIds = usuariosData.map(u => u.id);
          const { data: professoresData } = await supabase
            .from("professores")
            .select("usuario_id, matricula, formacoes, funcao_atual, tipo_vinculo, carga_horaria_contratual")
            .in("usuario_id", usuarioIds);

          if (professoresData) {
            // Mapear usuario_id → pessoa_id → dados professor
            const usuarioMap = new Map(usuariosData.map(u => [u.id, u.pessoa_id]));
            professoresData.forEach(p => {
              const pessoa_id = usuarioMap.get(p.usuario_id);
              if (pessoa_id) {
                professoresMap.set(pessoa_id, p);
              }
            });
          }
        }
      }

      return (data || []).map(l => ({
        ...l,
        pessoa: l.pessoa,
        professor: professoresMap.get(l.pessoa_id) || null,
      })) as Lotacao[];
    },
    enabled: !!escolaSaesc && !!anoLetivo,
  });

  const criarLotacaoMutation = useMutation({
    mutationFn: async (dados: {
      pessoa_id: string;
      escola_saesc: string;
      ano_letivo: string;
    }) => {
      // Validação: verificar pessoa existe
      const { data: pessoaData, error: pessoaError } = await supabase
        .from("pessoas")
        .select("id, nome_completo")
        .eq("id", dados.pessoa_id)
        .single();

      if (pessoaError) throw new Error("Pessoa não encontrada");

      const { data, error } = await supabase
        .from("lotacoes")
        .insert({
          pessoa_id: dados.pessoa_id,
          escola_saesc: dados.escola_saesc,
          perfil: 'PROFESSOR',
          ano_letivo: dados.ano_letivo,
          status: 'ATIVO',
          ativo: true,
          data_inicio: new Date().toISOString().split('T')[0],
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
        .from("lotacoes")
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
        .from("lotacoes")
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