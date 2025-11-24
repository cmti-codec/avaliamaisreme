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
  pessoa_id?: string;
  escola_id: string | null; // Permite NULL para pool REME
  carga_horaria_contratual?: number;
  horas_pl?: number;
  tipo_vinculo?: 'EFETIVO' | 'CONVOCADO';
}

export const useProfessoresDisponiveis = (
  escolaId: string, 
  anoLetivo: string,
  includeInativos: boolean = false
) => {
  return useQuery({
    queryKey: ["professores-disponiveis", escolaId, anoLetivo, includeInativos],
    queryFn: async () => {
      // Buscar IDs de professores já lotados nesta escola/ano via tabela lotacoes
      const { data: lotados } = await supabase
        .from("lotacoes")
        .select("pessoa_id")
        .eq("escola_saesc", escolaId)
        .eq("ano_letivo", anoLetivo)
        .eq("perfil", "PROFESSOR")
        .eq("ativo", true);

      // Buscar IDs dos professores associados a essas pessoas
      const pessoasLotadas = lotados?.map(l => l.pessoa_id) || [];
      
      // Se houver pessoas lotadas, buscar os usuario_id correspondentes
      let idsLotados: string[] = [];
      if (pessoasLotadas.length > 0) {
        const { data: usuarios } = await supabase
          .from("usuarios")
          .select("id")
          .in("pessoa_id", pessoasLotadas);
        
        const usuariosLotados = usuarios?.map(u => u.id) || [];
        
        // Buscar IDs dos professores lotados
        if (usuariosLotados.length > 0) {
          const { data: professoresLotados } = await supabase
            .from("professores")
            .select("id")
            .in("usuario_id", usuariosLotados);
          
          idsLotados = professoresLotados?.map(p => p.id) || [];
        }
      }

      // Buscar todos professores com pessoa_id (via join)
      let query = supabase
        .from("professores")
        .select(`
          *,
          usuarios!inner(pessoa_id)
        `)
        .order("nome", { ascending: true });

      // Se não incluir inativos, filtrar apenas ativos
      if (!includeInativos) {
        query = query.eq("ativo", true);
      }

      const { data: allProfessores, error } = await query;

      if (error) throw error;

      // Filtrar no cliente os professores já lotados e mapear pessoa_id
      const professoresDisponiveis = idsLotados.length > 0
        ? (allProfessores || []).filter(p => !idsLotados.includes(p.id))
        : (allProfessores || []);

      // Mapear pessoa_id do join
      return professoresDisponiveis.map(p => ({
        ...p,
        pessoa_id: (p as any).usuarios?.pessoa_id
      })) as Professor[];
    },
    enabled: !!escolaId && !!anoLetivo,
  });
};
