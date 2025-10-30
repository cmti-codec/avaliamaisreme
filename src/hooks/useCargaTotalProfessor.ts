import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CargaProfessor {
  carga_contratual: number;
  carga_alocada: number;
  carga_disponivel: number;
  numero_escolas: number;
  lotacoes_ativas: {
    escola_id: string;
    escola_nome: string;
    horas_aula: number;
    pl: number;
    carga_total: number;
  }[];
}

export const useCargaTotalProfessor = (professorId: string, anoLetivo: string) => {
  return useQuery({
    queryKey: ["carga-total-professor", professorId, anoLetivo],
    queryFn: async () => {
      // Buscar carga contratual do professor
      const { data: professor, error: profError } = await supabase
        .from("professores")
        .select("carga_horaria_contratual")
        .eq("id", professorId)
        .single();

      if (profError) throw profError;

      // Buscar todas as lotações ativas do professor no ano letivo
      const { data: lotacoes, error: lotError } = await supabase
        .from("lotacoes_professores")
        .select(`
          escola_id,
          horas_aula,
          pl,
          carga_total,
          escola:escolas(nome)
        `)
        .eq("professor_id", professorId)
        .eq("ano_letivo", anoLetivo)
        .eq("status", "ATIVO");

      if (lotError) throw lotError;

      const cargaContratual = professor?.carga_horaria_contratual || 40;
      const lotacoesAtivas = (lotacoes || []).map(l => ({
        escola_id: l.escola_id,
        escola_nome: (l.escola as any)?.nome || "Escola desconhecida",
        horas_aula: l.horas_aula || 0,
        pl: l.pl || 0,
        carga_total: l.carga_total || 0,
      }));

      const cargaAlocada = lotacoesAtivas.reduce((sum, l) => sum + l.carga_total, 0);
      const cargaDisponivel = Math.max(0, Math.min(50 - cargaAlocada, cargaContratual - cargaAlocada));

      return {
        carga_contratual: cargaContratual,
        carga_alocada: cargaAlocada,
        carga_disponivel: cargaDisponivel,
        numero_escolas: lotacoesAtivas.length,
        lotacoes_ativas: lotacoesAtivas,
      } as CargaProfessor;
    },
    enabled: !!professorId && !!anoLetivo,
  });
};
