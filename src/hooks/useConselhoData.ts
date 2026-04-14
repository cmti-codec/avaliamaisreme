import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FrequenciaConsolidada {
  aluno_id: string;
  aluno_nome: string;
  componentes: Record<string, {
    total_aulas: number;
    presencas: number;
    faltas: number;
    percentual: number;
  }>;
}

export interface NotaConsolidada {
  aluno_id: string;
  aluno_nome: string;
  componentes: Record<string, {
    avaliacoes: { titulo: string; nota: number | null; nota_maxima: number }[];
    media: number | null;
  }>;
}

export interface StatusProfessor {
  professor_id: string;
  professor_nome: string;
  componente: string;
  tem_frequencias: boolean;
  tem_avaliacoes: boolean;
  total_aulas_lancadas: number;
  total_avaliacoes: number;
}

export interface ConselhoData {
  frequencias: FrequenciaConsolidada[];
  notas: NotaConsolidada[];
  statusProfessores: StatusProfessor[];
  componentes: string[];
  conselhoExistente: any | null;
}

export const useConselhoData = (
  escolaId: string | null,
  turmaId: string | null,
  bimestreId: string | null,
  bimestreInicio: string | null,
  bimestreFim: string | null
) => {
  return useQuery({
    queryKey: ["conselho_data", escolaId, turmaId, bimestreId],
    queryFn: async (): Promise<ConselhoData> => {
      if (!escolaId || !turmaId || !bimestreId || !bimestreInicio || !bimestreFim) {
        return { frequencias: [], notas: [], statusProfessores: [], componentes: [], conselhoExistente: null };
      }

      // 1. Buscar diários da turma
      const { data: diarios, error: diariosErr } = await supabase
        .from("diarios_classe")
        .select("id, professor_id, componente_curricular, turno_diario, tipo_diario")
        .eq("turma_id", turmaId)
        .eq("ativo", true)
        .eq("tipo_diario", "REGULAR");

      if (diariosErr) throw diariosErr;
      if (!diarios || diarios.length === 0) {
        return { frequencias: [], notas: [], statusProfessores: [], componentes: [], conselhoExistente: null };
      }

      const diarioIds = diarios.map(d => d.id);
      const componentesSet = new Set(diarios.map(d => d.componente_curricular));
      const componentes = Array.from(componentesSet).sort();

      // 2. Buscar alunos da turma
      const { data: alunos, error: alunosErr } = await supabase
        .from("alunos")
        .select("id, nomalu")
        .eq("turma_id", turmaId)
        .eq("ativo", true)
        .order("nomalu");

      if (alunosErr) throw alunosErr;
      if (!alunos || alunos.length === 0) {
        return { frequencias: [], notas: [], statusProfessores: [], componentes, conselhoExistente: null };
      }

      // 3. Buscar frequências do bimestre
      const { data: freqs, error: freqsErr } = await supabase
        .from("frequencias")
        .select("aluno_id, diario_id, presente")
        .in("diario_id", diarioIds)
        .gte("data_aula", bimestreInicio)
        .lte("data_aula", bimestreFim);

      if (freqsErr) throw freqsErr;

      // 4. Buscar avaliações do bimestre
      const { data: avaliacoes, error: avalsErr } = await supabase
        .from("avaliacoes")
        .select("aluno_id, diario_id, titulo, nota, nota_maxima, data_avaliacao")
        .in("diario_id", diarioIds)
        .gte("data_avaliacao", bimestreInicio)
        .lte("data_avaliacao", bimestreFim);

      if (avalsErr) throw avalsErr;

      // 5. Buscar nomes dos professores
      const profIds = [...new Set(diarios.map(d => d.professor_id))];
      const { data: profs } = await supabase
        .from("professores")
        .select("id, nome")
        .in("id", profIds);

      const profMap = new Map(profs?.map(p => [p.id, p.nome]) || []);

      // 6. Mapear diario_id -> componente
      const diarioComponenteMap = new Map(diarios.map(d => [d.id, d.componente_curricular]));
      const diarioProfMap = new Map(diarios.map(d => [d.id, d.professor_id]));

      // 7. Consolidar frequências
      const frequenciasConsolidadas: FrequenciaConsolidada[] = alunos.map(aluno => {
        const comps: FrequenciaConsolidada["componentes"] = {};
        for (const comp of componentes) {
          const diariosDaComp = diarios.filter(d => d.componente_curricular === comp).map(d => d.id);
          const freqsAluno = (freqs || []).filter(f => f.aluno_id === aluno.id && diariosDaComp.includes(f.diario_id));
          const presencas = freqsAluno.filter(f => f.presente).length;
          const faltas = freqsAluno.filter(f => !f.presente).length;
          const total = presencas + faltas;
          comps[comp] = {
            total_aulas: total,
            presencas,
            faltas,
            percentual: total > 0 ? Math.round((presencas / total) * 100) : 0,
          };
        }
        return { aluno_id: aluno.id, aluno_nome: aluno.nomalu, componentes: comps };
      });

      // 8. Consolidar notas
      const notasConsolidadas: NotaConsolidada[] = alunos.map(aluno => {
        const comps: NotaConsolidada["componentes"] = {};
        for (const comp of componentes) {
          const diariosDaComp = diarios.filter(d => d.componente_curricular === comp).map(d => d.id);
          const avalsAluno = (avaliacoes || []).filter(a => a.aluno_id === aluno.id && diariosDaComp.includes(a.diario_id));
          const notasValidas = avalsAluno.filter(a => a.nota !== null);
          const media = notasValidas.length > 0
            ? Math.round((notasValidas.reduce((s, a) => s + (a.nota || 0), 0) / notasValidas.length) * 10) / 10
            : null;
          comps[comp] = {
            avaliacoes: avalsAluno.map(a => ({ titulo: a.titulo, nota: a.nota, nota_maxima: a.nota_maxima || 10 })),
            media,
          };
        }
        return { aluno_id: aluno.id, aluno_nome: aluno.nomalu, componentes: comps };
      });

      // 9. Status dos professores
      const statusProfessores: StatusProfessor[] = diarios.map(d => {
        const freqsProf = (freqs || []).filter(f => f.diario_id === d.id);
        const avalsProf = (avaliacoes || []).filter(a => a.diario_id === d.id);
        return {
          professor_id: d.professor_id,
          professor_nome: profMap.get(d.professor_id) || "Desconhecido",
          componente: d.componente_curricular,
          tem_frequencias: freqsProf.length > 0,
          tem_avaliacoes: avalsProf.length > 0,
          total_aulas_lancadas: freqsProf.length,
          total_avaliacoes: avalsProf.length,
        };
      });

      // 10. Conselho existente
      const { data: conselho } = await supabase
        .from("conselhos_classe")
        .select("*")
        .eq("escola_id", escolaId)
        .eq("bimestre_id", bimestreId)
        .maybeSingle();

      return {
        frequencias: frequenciasConsolidadas,
        notas: notasConsolidadas,
        statusProfessores,
        componentes,
        conselhoExistente: conselho,
      };
    },
    enabled: !!escolaId && !!turmaId && !!bimestreId && !!bimestreInicio && !!bimestreFim,
  });
};

export const useRealizarConselho = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      escola_id: string;
      ano_letivo_id: string;
      bimestre_id: string;
      turmas_ids: string[];
      bloqueia_edicao: boolean;
    }) => {
      const { data, error } = await supabase
        .from("conselhos_classe")
        .insert({
          escola_id: params.escola_id,
          ano_letivo_id: params.ano_letivo_id,
          bimestre_id: params.bimestre_id,
          data: new Date().toISOString().split("T")[0],
          bloqueia_edicao_avaliacoes: params.bloqueia_edicao,
          turmas_ids: params.turmas_ids,
          descricao: `Conselho de classe realizado em ${new Date().toLocaleDateString("pt-BR")}`,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conselho_data"] });
      toast.success("Conselho de classe realizado com sucesso! Edições bloqueadas para este bimestre.");
    },
    onError: (error: any) => {
      toast.error("Erro ao realizar conselho: " + error.message);
    },
  });
};
