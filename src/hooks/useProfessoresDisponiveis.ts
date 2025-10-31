import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Professor {
  id: string;
  nome: string;
  cpf?: string;
  matricula: string;
  cargo: string;
  funcao_atual?: string;
  email?: string;
  telefone?: string;
  formacoes?: any;
  ativo: boolean;
  usuario_id?: string;
  escola_id: string | null; // Permite NULL para pool REME
  carga_horaria_contratual?: number;
  horas_pl?: number;
  tipo_vinculo?: 'EFETIVO' | 'CONVOCADO';
}

export const useProfessoresDisponiveis = (escolaId: string, anoLetivo: string) => {
  return useQuery({
    queryKey: ["professores-disponiveis", escolaId, anoLetivo],
    queryFn: async () => {
      // Buscar IDs de professores já lotados nesta escola/ano
      const { data: lotados } = await supabase
        .from("lotacoes_professores")
        .select("professor_id")
        .eq("escola_id", escolaId)
        .eq("ano_letivo", anoLetivo);

      const idsLotados = lotados?.map(l => l.professor_id) || [];

      // Buscar todos professores ativos
      const { data: allProfessores, error } = await supabase
        .from("professores")
        .select("*")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;

      // Filtrar no cliente os professores já lotados (mais robusto)
      const professoresDisponiveis = idsLotados.length > 0
        ? (allProfessores || []).filter(p => !idsLotados.includes(p.id))
        : (allProfessores || []);

      return professoresDisponiveis as Professor[];
    },
    enabled: !!escolaId && !!anoLetivo,
  });
};
