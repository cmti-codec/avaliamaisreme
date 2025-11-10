import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CargaProfessor {
  carga_contratual: number;
  carga_alocada: number;
  carga_disponivel: number;
  numero_escolas: number;
  lotacoes_ativas: {
    escola_saesc: string;
    escola_nome: string;
    horas_aula: number;
    pl: number;
    carga_total: number;
  }[];
}

export const useCargaTotalProfessor = (pessoaId: string, anoLetivo: string) => {
  return useQuery({
    queryKey: ["carga-total-professor", pessoaId, anoLetivo],
    queryFn: async () => {
      // Buscar usuário e professor para pegar carga contratual
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("id")
        .eq("pessoa_id", pessoaId)
        .maybeSingle();

      let cargaContratual = 40; // Padrão

      if (usuarioData) {
        const { data: professorData } = await supabase
          .from("professores")
          .select("carga_horaria_contratual")
          .eq("usuario_id", usuarioData.id)
          .maybeSingle();

        if (professorData?.carga_horaria_contratual) {
          cargaContratual = professorData.carga_horaria_contratual;
        }
      }

      // Buscar todas as lotações ativas do professor no ano letivo
      const { data: lotacoes, error: lotError } = await supabase
        .from("lotacoes")
        .select("escola_saesc, horas_aula, pl, carga_total")
        .eq("pessoa_id", pessoaId)
        .eq("perfil", "PROFESSOR")
        .eq("ano_letivo", anoLetivo)
        .eq("ativo", true);

      if (lotError) throw lotError;

      // Buscar nomes das escolas
      const escolasSaesc = [...new Set(lotacoes?.map(l => l.escola_saesc) || [])];
      const { data: escolasData } = await supabase
        .from("escolas")
        .select("saesc, nome")
        .in("saesc", escolasSaesc);

      const escolasMap = new Map(
        escolasData?.map(e => [e.saesc.toString(), e.nome]) || []
      );

      const lotacoesAtivas = (lotacoes || []).map(l => ({
        escola_saesc: l.escola_saesc,
        escola_nome: escolasMap.get(l.escola_saesc) || "Escola desconhecida",
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
    enabled: !!pessoaId && !!anoLetivo,
  });
};