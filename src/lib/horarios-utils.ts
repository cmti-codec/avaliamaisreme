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
  formacoes: string[] | null;
  carga_horaria_contratual: number;
  horas_pl: number;
}

export interface Turma {
  id: string;
  etapa_modalidade: string;
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

// Normalizar etapa/modalidade (remover variações ETI/Campo)
export function normalizarEtapaModalidade(etapa_modalidade: string): string {
  if (!etapa_modalidade) return "";
  
  // Remover "ETI" e "do Campo" para normalizar
  let normalizado = etapa_modalidade
    .replace(/\s*ETI\s*/gi, "")
    .replace(/\s*do\s+Campo\s*/gi, "")
    .trim();
  
  return normalizado;
}

// Verificar se professor é Assistente de Educação Infantil
export function isAssistenteEducacaoInfantil(professorFormacoes: string[] | null): boolean {
  if (!professorFormacoes || professorFormacoes.length === 0) return false;
  
  return professorFormacoes.some((f) => 
    f.toUpperCase().includes("ASSISTENTE") && 
    f.toUpperCase().includes("EDUCAÇÃO INFANTIL")
  );
}

// Validar se professor tem formação para dar aula de componente
export function validarFormacao(
  professorFormacoes: string[] | null,
  componente: string,
  etapa_modalidade: string,
  grupoAno: string
): boolean {
  // Se não há formações cadastradas, NÃO permitir (professor não qualificado)
  if (!professorFormacoes || professorFormacoes.length === 0) {
    return false;
  }

  // Normalizar para comparações
  const componenteNorm = componente.toUpperCase().trim();
  const segmentoNormalizado = normalizarEtapaModalidade(etapa_modalidade);
  
  // Normalizar grupoAno para Title Case (banco retorna MAIÚSCULAS)
  const grupoAnoNorm = grupoAno
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // ATIVIDADES DIVERSAS - apenas Assistentes de Educação Infantil
  if (componenteNorm === "ATIVIDADES DIVERSAS") {
    return isAssistenteEducacaoInfantil(professorFormacoes);
  }

  // Educação Infantil - Grupos 1, 1I, 1II, 2, 3
  if (segmentoNormalizado === "Educação Infantil" &&
      ["Grupo 1", "Grupo 1 I", "Grupo 1 II", "Grupo 2", "Grupo 3"].includes(grupoAnoNorm)) {
    if (componenteNorm === "ATIVIDADES") {
      return professorFormacoes.some((f) => {
        const fNorm = f.toUpperCase();
        return (fNorm.includes("PEDAGOGIA") && fNorm.includes("INFANTIL")) ||
               fNorm.includes("EDUCAÇÃO INFANTIL");
      });
    }
    if (componenteNorm === "EDUCAÇÃO FÍSICA") {
      return professorFormacoes.some((f) => 
        f.toUpperCase().includes("EDUCAÇÃO FÍSICA") || 
        f.toUpperCase().includes("EDUCACAO FISICA")
      );
    }
    if (componenteNorm === "ARTE") {
      return professorFormacoes.some((f) => f.toUpperCase().includes("ARTE"));
    }
    // Para outros componentes em Grupos 1-3, permitir qualquer professor com formação em Ed. Infantil
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return (fNorm.includes("PEDAGOGIA") && fNorm.includes("INFANTIL")) ||
             fNorm.includes("EDUCAÇÃO INFANTIL");
    });
  }

  // Educação Infantil - Grupos 4, 4 EMEI, 4 Escola, 5, 5 EMEI, 5 Escola
  if (segmentoNormalizado === "Educação Infantil" &&
      ["Grupo 4", "Grupo 4 EMEI", "Grupo 4 Escola", "Grupo 5", "Grupo 5 EMEI", "Grupo 5 Escola"].includes(grupoAnoNorm)) {
    if (componenteNorm === "ATIVIDADES") {
      return professorFormacoes.some((f) => {
        const fNorm = f.toUpperCase();
        return (fNorm.includes("PEDAGOGIA") && fNorm.includes("INFANTIL")) ||
               fNorm.includes("EDUCAÇÃO INFANTIL");
      });
    }
    if (componenteNorm === "EDUCAÇÃO FÍSICA") {
      return professorFormacoes.some((f) => 
        f.toUpperCase().includes("EDUCAÇÃO FÍSICA") || 
        f.toUpperCase().includes("EDUCACAO FISICA")
      );
    }
    if (componenteNorm === "ARTE") {
      return professorFormacoes.some((f) => f.toUpperCase().includes("ARTE"));
    }
    // Para outros componentes em Grupos 4-5, permitir qualquer professor com formação em Ed. Infantil
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return (fNorm.includes("PEDAGOGIA") && fNorm.includes("INFANTIL")) ||
             fNorm.includes("EDUCAÇÃO INFANTIL");
    });
  }

  // EF I - Anos Iniciais (componentes polivalentes)
  if (segmentoNormalizado === "Ensino Fundamental I - Anos Iniciais") {
    const componentesPolivalentes = ["MATEMÁTICA", "LÍNGUA PORTUGUESA", "HISTÓRIA", "GEOGRAFIA"];
    
    if (componentesPolivalentes.includes(componenteNorm)) {
      return professorFormacoes.some((f) => {
        const fNorm = f.toUpperCase();
        return (fNorm.includes("PEDAGOGIA") && (fNorm.includes("ANOS INICIAIS") || fNorm.includes("FUNDAMENTAL"))) ||
               fNorm.includes(componenteNorm);
      });
    }

    // Ciências - Pedagogia com Ciências
    if (componenteNorm === "CIÊNCIAS") {
      return professorFormacoes.some((f) => {
        const fNorm = f.toUpperCase();
        return (fNorm.includes("PEDAGOGIA") && fNorm.includes("CIÊNCIAS")) ||
               (fNorm.includes("PEDAGOGIA") && fNorm.includes("CIENCIAS")) ||
               fNorm.includes("CIÊNCIAS") ||
               fNorm.includes("BIOLOGIA");
      });
    }

    // Arte
    if (componenteNorm === "ARTE") {
      return professorFormacoes.some((f) => f.toUpperCase().includes("ARTE"));
    }

    // Educação Física
    if (componenteNorm === "EDUCAÇÃO FÍSICA I" || componenteNorm === "EDUCACAO FISICA I") {
      return professorFormacoes.some((f) => 
        f.toUpperCase().includes("EDUCAÇÃO FÍSICA") || 
        f.toUpperCase().includes("EDUCACAO FISICA")
      );
    }
  }

  // Componentes universais (EF II e EJA)
  
  // Educação Física
  if (componenteNorm.includes("EDUCAÇÃO FÍSICA") || componenteNorm.includes("EDUCACAO FISICA")) {
    return professorFormacoes.some((f) => 
      f.toUpperCase().includes("EDUCAÇÃO FÍSICA") || 
      f.toUpperCase().includes("EDUCACAO FISICA")
    );
  }

  // Arte
  if (componenteNorm === "ARTE") {
    return professorFormacoes.some((f) => f.toUpperCase().includes("ARTE"));
  }

  // Língua Inglesa
  if (componenteNorm.includes("INGLÊS") || componenteNorm.includes("LINGUA INGLESA")) {
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return fNorm.includes("INGLÊS") || 
             fNorm.includes("INGLES") || 
             fNorm.includes("LÍNGUA INGLESA") || 
             fNorm.includes("LETRAS - INGLÊS");
    });
  }

  // Ciências
  if (componenteNorm.includes("CIÊNCIAS") || componenteNorm.includes("CIENCIAS")) {
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return fNorm.includes("CIÊNCIAS") || 
             fNorm.includes("CIENCIAS") || 
             fNorm.includes("BIOLOGIA") || 
             fNorm.includes("FÍSICA") || 
             fNorm.includes("QUÍMICA");
    });
  }

  // História
  if (componenteNorm.includes("HISTÓRIA") || componenteNorm.includes("HISTORIA")) {
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return fNorm.includes("HISTÓRIA") || 
             fNorm.includes("HISTORIA") || 
             fNorm.includes("CIÊNCIAS SOCIAIS");
    });
  }

  // Geografia
  if (componenteNorm.includes("GEOGRAFIA")) {
    return professorFormacoes.some((f) => f.toUpperCase().includes("GEOGRAFIA"));
  }

  // Matemática
  if (componenteNorm.includes("MATEMÁTICA") || 
      componenteNorm.includes("MATEMATICA") ||
      componenteNorm.includes("APLICAÇÕES MATEMÁTICAS") || 
      componenteNorm.includes("APLICACOES MATEMATICAS")) {
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return fNorm.includes("MATEMÁTICA") || fNorm.includes("MATEMATICA");
    });
  }

  // Língua Portuguesa
  if (componenteNorm.includes("LÍNGUA PORTUGUESA") || 
      componenteNorm.includes("LINGUA PORTUGUESA") ||
      componenteNorm.includes("INICIAÇÃO AOS ESTUDOS LITERÁRIOS") || 
      componenteNorm.includes("INICIACAO AOS ESTUDOS LITERARIOS")) {
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return fNorm.includes("PORTUGUÊS") || 
             fNorm.includes("PORTUGUES") ||
             fNorm.includes("LETRAS") || 
             fNorm.includes("LÍNGUA PORTUGUESA");
    });
  }

  // Ensino Religioso
  if (componenteNorm.includes("ENSINO RELIGIOSO")) {
    return professorFormacoes.some((f) => {
      const fNorm = f.toUpperCase();
      return fNorm.includes("TEOLOGIA") || 
             fNorm.includes("CIÊNCIAS DA RELIGIÃO") || 
             fNorm.includes("PEDAGOGIA");
    });
  }

  // Para componentes não mapeados, não permitir por segurança
  // Professores sem formação compatível não devem aparecer como opção
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

// Verificar se componente é polivalente (professor único para vários componentes)
export function isComponentePolivalente(
  componenteNome: string,
  etapa_modalidade: string
): boolean {
  if (!componenteNome || !etapa_modalidade) return false;

  const componente = componenteNome.toUpperCase();
  const segmentoNormalizado = normalizarEtapaModalidade(etapa_modalidade);

  // Educação Infantil: ATIVIDADES é polivalente
  if (segmentoNormalizado === "Educação Infantil" && componente === "ATIVIDADES") {
    return true;
  }

  // Ensino Fundamental I: Língua Portuguesa, Matemática, História e Geografia são polivalentes
  if (segmentoNormalizado === "Ensino Fundamental I - Anos Iniciais") {
    const componentesPolivalentes = [
      "LÍNGUA PORTUGUESA", "LINGUA PORTUGUESA",
      "MATEMÁTICA", "MATEMATICA",
      "HISTÓRIA", "HISTORIA",
      "GEOGRAFIA"
    ];
    return componentesPolivalentes.includes(componente);
  }

  return false;
}

// Validar se professor está travado (unidocência)
export function isProfessorTravado(
  etapa_modalidade: string,
  grupoAno: string,
  componente: string
): boolean {
  const segmentoNormalizado = normalizarEtapaModalidade(etapa_modalidade);
  
  return (
    segmentoNormalizado === "Educação Infantil" &&
    ["Grupo 1", "Grupo 1 I", "Grupo 1 II", "Grupo 2", "Grupo 3"].includes(grupoAno.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')) &&
    componente === "ATIVIDADES"
  );
}

// Validar se um componente é válido para uma etapa/modalidade e grupo/ano
export function isComponenteValidoParaTurma(
  componenteNome: string,
  etapa_modalidade: string,
  grupoAno: string
): boolean {
  if (!componenteNome || !etapa_modalidade) return false;

  const componenteNorm = componenteNome.toUpperCase().trim();
  const segmentoNormalizado = normalizarEtapaModalidade(etapa_modalidade);

  // Educação Infantil - Grupos 1, 1I, 1II, 2, 3
  const grupoAnoNormLocal = grupoAno.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  if (segmentoNormalizado === "Educação Infantil" &&
      ["Grupo 1", "Grupo 1 I", "Grupo 1 II", "Grupo 2", "Grupo 3"].includes(grupoAnoNormLocal)) {
    const componentesValidos = ["ATIVIDADES", "ATIVIDADES DIVERSAS", "EDUCAÇÃO FÍSICA"];
    return componentesValidos.includes(componenteNorm);
  }

  // Educação Infantil - Grupos 4 e 5
  if (segmentoNormalizado === "Educação Infantil" &&
      ["Grupo 4", "Grupo 4 EMEI", "Grupo 4 Escola", "Grupo 5", "Grupo 5 EMEI", "Grupo 5 Escola"].includes(grupoAnoNormLocal)) {
    const componentesValidos = ["ATIVIDADES", "ATIVIDADES DIVERSAS", "EDUCAÇÃO FÍSICA", "ARTE"];
    return componentesValidos.includes(componenteNorm);
  }

  // Para EF I, EF II, EJA - todos os componentes são válidos
  return true;
}

// Obter nível de qualificação do professor para um componente
export function getNivelQualificacao(
  professorFormacoes: string[] | null,
  componente: string,
  etapa_modalidade: string,
  grupoAno: string
): "ideal" | "aceitavel" | "nao_qualificado" {
  if (!validarFormacao(professorFormacoes, componente, etapa_modalidade, grupoAno)) {
    return "nao_qualificado";
  }

  if (!professorFormacoes || professorFormacoes.length === 0) {
    return "aceitavel"; // Sem formação cadastrada
  }

  const componenteNorm = componente.toUpperCase().trim();
  
  // Verificar se tem formação específica exata
  const temFormacaoEspecifica = professorFormacoes.some((f) => {
    const fNorm = f.toUpperCase();
    return fNorm.includes(componenteNorm);
  });

  return temFormacaoEspecifica ? "ideal" : "aceitavel";
}
