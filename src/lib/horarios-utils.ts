// Utilitários para gestão de horários

export const CORES_COMPONENTES: Record<string, string> = {
  "MATEMÁTICA": "#2ECC71",
  "LÍNGUA PORTUGUESA": "#F1C40F",
  "HISTÓRIA": "#3498DB",
  "GEOGRAFIA": "#9B59B6",
  "CIÊNCIAS": "#7E48A0",
  "ARTE": "#E91E63",
  "EDUCAÇÃO FÍSICA": "#95A5A6",
  "ATIVIDADES": "#E74C3C",
  "ATIVIDADES DIVERSAS": "#F39C12",
  "INGLÊS": "#1ABC9C",
  "APLICAÇÕES MATEMÁTICAS": "#16A085",
};

export interface HorarioSlot {
  dia_semana: string;
  tempo: number;
  componente: string;
  professor_id: string | null;
}

export interface Professor {
  id: string;
  nome: string;
  formacoes: string[];
  carga_horaria_contratual: number;
  horas_pl: number;
}

export interface Turma {
  id: string;
  segmento: string;
  grupo_ano: string;
  turma: string;
  turno: string;
  matriz_curricular: Record<string, number>;
}

export const DIAS_SEMANA = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta"];

export const TURNOS_TEMPOS: Record<string, number[]> = {
  MATUTINO: [1, 2, 3, 4],
  VESPERTINO: [5, 6, 7, 8],
  NOTURNO: [5, 6, 7, 8],
  INTEGRAL: [1, 2, 3, 4, 5, 6, 7, 8],
};

// Normalizar tempos para detecção de conflitos
export function normalizarTempo(turno: string, tempo: number): { turno: string; tempo: number } {
  if (turno === "INTEGRAL") {
    if (tempo <= 4) {
      return { turno: "MATUTINO", tempo };
    } else {
      return { turno: "VESPERTINO", tempo: tempo - 4 };
    }
  }
  return { turno, tempo };
}

// Validar se professor tem formação para dar aula de componente
export function validarFormacao(
  professorFormacoes: string[],
  componente: string,
  segmento: string,
  grupoAno: string
): boolean {
  // Ed. Infantil G1-3 com ATIVIDADES requer "Pedagogia - Ed. Infantil"
  if (segmento === "Ed. Infantil" && ["Grupo 1", "Grupo 2", "Grupo 3"].includes(grupoAno)) {
    if (componente === "ATIVIDADES") {
      return professorFormacoes.includes("Pedagogia - Ed. Infantil");
    }
  }

  // EF I - Anos Iniciais
  if (segmento === "1º ao 5º - EF I") {
    const componentesCamposMat = ["MATEMÁTICA", "LÍNGUA PORTUGUESA", "HISTÓRIA", "GEOGRAFIA"];
    if (componentesCamposMat.includes(componente)) {
      return professorFormacoes.includes("Pedagogia - Anos Iniciais");
    }
    if (componente === "CIÊNCIAS") {
      return professorFormacoes.includes("Pedagogia - Ciências");
    }
  }

  // Componentes universais
  const universais = ["ARTE", "EDUCAÇÃO FÍSICA", "INGLÊS"];
  if (universais.includes(componente)) {
    return professorFormacoes.some((f) => f.includes(componente));
  }

  // EF II e EJA: match direto
  if (["6º ao 9º - EF II", "EJA"].includes(segmento)) {
    return professorFormacoes.some((f) => f.includes(componente));
  }

  return false;
}

// Detectar conflitos de professor
export function detectarConflitos(
  horarios: Record<string, HorarioSlot>,
  turmaAtual: Turma
): { dia: string; tempo: number }[] {
  const conflitos: { dia: string; tempo: number }[] = [];
  const professorSlots: Record<string, Set<string>> = {};

  Object.entries(horarios).forEach(([key, slot]) => {
    if (!slot.professor_id) return;

    const normalizado = normalizarTempo(turmaAtual.turno, slot.tempo);
    const slotKey = `${slot.professor_id}_${slot.dia_semana}_${normalizado.turno}_${normalizado.tempo}`;

    if (!professorSlots[slot.professor_id]) {
      professorSlots[slot.professor_id] = new Set();
    }

    if (professorSlots[slot.professor_id].has(slotKey)) {
      conflitos.push({ dia: slot.dia_semana, tempo: slot.tempo });
    } else {
      professorSlots[slot.professor_id].add(slotKey);
    }
  });

  return conflitos;
}

// Calcular quota de componente
export function calcularQuota(
  horarios: Record<string, HorarioSlot>,
  componente: string,
  quotaTotal: number
): { atual: number; total: number; percentual: number } {
  const atual = Object.values(horarios).filter(
    (slot) => slot.componente === componente
  ).length;

  const percentual = quotaTotal > 0 ? (atual / quotaTotal) * 100 : 0;

  return { atual, total: quotaTotal, percentual };
}

// Gerar sigla de componente
export function gerarSigla(nomeComponente: string): string {
  const mapa: Record<string, string> = {
    "MATEMÁTICA": "MAT",
    "LÍNGUA PORTUGUESA": "POR",
    "HISTÓRIA": "HIS",
    "GEOGRAFIA": "GEO",
    "CIÊNCIAS": "CIE",
    "ARTE": "ART",
    "EDUCAÇÃO FÍSICA": "EDF",
    "ATIVIDADES": "ATV",
    "ATIVIDADES DIVERSAS": "ATD",
    "INGLÊS": "ING",
    "APLICAÇÕES MATEMÁTICAS": "APM",
  };

  return mapa[nomeComponente] || nomeComponente.substring(0, 3).toUpperCase();
}

// Validar se professor está travado (unidocência)
export function isProfessorTravado(
  segmento: string,
  grupoAno: string,
  componente: string
): boolean {
  return (
    segmento === "Ed. Infantil" &&
    ["Grupo 1", "Grupo 2", "Grupo 3"].includes(grupoAno) &&
    componente === "ATIVIDADES"
  );
}
