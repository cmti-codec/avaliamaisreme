import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Turma {
  id: string;
  turma: string;
  segmento: string;
  grupo_ano: string;
  turno: string | null;
  escola_id: string;
  ativa: boolean;
  matriz_curricular: any;
  created_at: string;
  escola?: {
    id: string;
    nome: string;
    codigo_inep: string | null;
    endereco?: string | null;
    telefone?: string | null;
  };
  alunos?: Array<{ count: number }>;
}

export const useTurmas = () => {
  return useQuery({
    queryKey: ["turmas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("turmas")
        .select(`
          *,
          escola:escolas(id, nome, codigo_inep)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Turma[];
    },
  });
};

export const useTurma = (id: string | null) => {
  return useQuery({
    queryKey: ["turma", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("turmas")
        .select(`
          *,
          escola:escolas(id, nome, codigo_inep, endereco, telefone),
          alunos(count)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Turma;
    },
    enabled: !!id,
  });
};

export const useTurmasPorEscola = (escolaId: string | null) => {
  return useQuery({
    queryKey: ["turmas", "escola", escolaId],
    queryFn: async () => {
      if (!escolaId) return [];

      const { data, error } = await supabase
        .from("turmas")
        .select(`
          *,
          escola:escolas(id, nome, codigo_inep)
        `)
        .eq("escola_id", escolaId)
        .order("turma", { ascending: true });

      if (error) throw error;
      return data as Turma[];
    },
    enabled: !!escolaId,
  });
};
