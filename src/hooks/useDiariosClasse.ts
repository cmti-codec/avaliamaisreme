import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DiarioClasse {
  id: string;
  turma_id: string;
  professor_id: string;
  componente_curricular: string;
  ano_letivo: string;
  ativo: boolean;
  turma?: {
    id: string;
    turma: string;
    etapa_modalidade: string;
    grupo_ano: string;
    turno: string;
  };
}

export interface DiarioComHorarios extends DiarioClasse {
  horarios: {
    dia_semana: string;
    tempo: number;
  }[];
}

// Hook para buscar diários do professor logado
export const useDiariosDoUsuario = () => {
  return useQuery({
    queryKey: ["diarios_usuario"],
    queryFn: async () => {
      // Buscar professor_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: professor, error: profError } = await supabase
        .from("professores")
        .select("id")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (profError) throw profError;
      if (!professor) return [];

      // Buscar diários com informações da turma
      const { data, error } = await supabase
        .from("diarios_classe")
        .select(`
          *,
          turma:turmas(
            id,
            turma,
            etapa_modalidade,
            grupo_ano,
            turno
          )
        `)
        .eq("professor_id", professor.id)
        .eq("ativo", true)
        .order("componente_curricular");

      if (error) throw error;
      return data as DiarioClasse[];
    },
  });
};

// Hook para buscar diários com horários disponíveis
export const useDiariosComHorarios = () => {
  return useQuery({
    queryKey: ["diarios_com_horarios"],
    queryFn: async () => {
      // Buscar professor_id do usuário logado
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data: professor, error: profError } = await supabase
        .from("professores")
        .select("id")
        .eq("usuario_id", user.id)
        .maybeSingle();

      if (profError) throw profError;
      if (!professor) return [];

      // Buscar diários
      const { data: diarios, error: diariosError } = await supabase
        .from("diarios_classe")
        .select(`
          *,
          turma:turmas(
            id,
            turma,
            etapa_modalidade,
            grupo_ano,
            turno
          )
        `)
        .eq("professor_id", professor.id)
        .eq("ativo", true);

      if (diariosError) throw diariosError;
      if (!diarios) return [];

      // Para cada diário, buscar seus horários
      const diariosComHorarios = await Promise.all(
        diarios.map(async (diario) => {
          const { data: horarios, error: horariosError } = await supabase
            .from("horarios")
            .select("dia_semana, tempo")
            .eq("turma_id", diario.turma_id)
            .eq("professor_id", professor.id)
            .eq("componente_curricular", diario.componente_curricular)
            .order("dia_semana")
            .order("tempo");

          if (horariosError) throw horariosError;

          return {
            ...diario,
            horarios: horarios || [],
          } as DiarioComHorarios;
        })
      );

      return diariosComHorarios;
    },
  });
};

// Hook para buscar alunos de uma turma
export const useAlunosDaTurma = (turmaId: string | null) => {
  return useQuery({
    queryKey: ["alunos_turma", turmaId],
    queryFn: async () => {
      if (!turmaId) return [];

      const { data, error } = await supabase
        .from("alunos")
        .select("*")
        .eq("turma_id", turmaId)
        .eq("ativo", true)
        .order("nomalu");

      if (error) throw error;
      return data;
    },
    enabled: !!turmaId,
  });
};
