import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Aluno {
  id: string;
  numalu: string;
  nomalu: string;
  nummtr: string | null;
  datmtr: string | null;
  saesc: string;
  turma_id: string | null;
  sigeta: string;
  trmcla: string;
  sigtur: string;
  desoca: string | null;
  sioca: string | null;
  dtomtrc: string | null;
  ativo: boolean;
  created_at: string;
  escola?: {
    id: string;
    nome: string;
    codigo_inep: string | null;
  };
  turma?: {
    id: string;
    turma: string;
    grupo_ano: string;
    turno: string | null;
    etapa_modalidade: string;
  };
}

const PAGE_SIZE = 1000;

const fetchInChunks = async (escolaId?: string | null): Promise<Aluno[]> => {
  const allData: Aluno[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("alunos")
      .select(`
        *,
        escola:escolas!alunos_saesc_fkey(id, nome, codigo_inep),
        turma:turmas!alunos_turma_id_fkey(id, turma, grupo_ano, turno, etapa_modalidade)
      `)
      .range(offset, offset + PAGE_SIZE - 1)
      .order("nomalu", { ascending: true });

    if (escolaId) {
      query = query.eq("saesc", escolaId);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (data && data.length > 0) {
      allData.push(...(data as Aluno[]));
      offset += PAGE_SIZE;
      hasMore = data.length === PAGE_SIZE;
    } else {
      hasMore = false;
    }
  }

  return allData;
};

export const useAlunos = () => {
  return useQuery({
    queryKey: ["alunos"],
    queryFn: async () => {
      return await fetchInChunks();
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useAlunosPorEscola = (escolaId: string | null) => {
  return useQuery({
    queryKey: ["alunos", "escola", escolaId],
    queryFn: async () => {
      if (!escolaId) return [];
      return await fetchInChunks(escolaId);
    },
    enabled: !!escolaId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};

export const useAluno = (id: string | null) => {
  return useQuery({
    queryKey: ["aluno", id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("alunos")
        .select(`
          *,
          escola:escolas!alunos_saesc_fkey(id, nome, codigo_inep),
          turma:turmas!alunos_turma_id_fkey(id, turma, grupo_ano, turno, etapa_modalidade)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as Aluno;
    },
    enabled: !!id,
  });
};
