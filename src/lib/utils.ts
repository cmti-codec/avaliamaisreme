import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Ordena turmas seguindo a sequência pedagógica:
 * 1. Grupos (G1-G5) em ordem alfabética
 * 2. Anos (1º-9º) em ordem numérica e alfabética
 * 3. EJA em ordem de fase e alfabética
 */
export function sortTurmasPedagogica<T extends { grupo_ano: string; turma: string }>(turmas: T[]): T[] {
  return turmas.sort((a, b) => {
    const grupoA = a.grupo_ano.toUpperCase();
    const grupoB = b.grupo_ano.toUpperCase();
    const turmaA = a.turma.toUpperCase();
    const turmaB = b.turma.toUpperCase();

    // Detectar tipo de etapa
    const isGrupoA = grupoA.startsWith('G') || grupoA.includes('GRUPO');
    const isGrupoB = grupoB.startsWith('G') || grupoB.includes('GRUPO');
    const isEjaA = grupoA.includes('EJA') || grupoA.includes('FASE');
    const isEjaB = grupoB.includes('EJA') || grupoB.includes('FASE');
    
    // Grupos vêm primeiro
    if (isGrupoA && !isGrupoB) return -1;
    if (!isGrupoA && isGrupoB) return 1;
    
    // EJA vem por último
    if (isEjaA && !isEjaB) return 1;
    if (!isEjaA && isEjaB) return -1;
    
    // Se ambos são grupos, ordenar por G1-G5 e depois alfabeticamente pela turma
    if (isGrupoA && isGrupoB) {
      const compareGrupo = grupoA.localeCompare(grupoB);
      if (compareGrupo !== 0) return compareGrupo;
      return turmaA.localeCompare(turmaB);
    }
    
    // Se ambos são EJA, ordenar por fase e depois alfabeticamente pela turma
    if (isEjaA && isEjaB) {
      const compareGrupo = grupoA.localeCompare(grupoB);
      if (compareGrupo !== 0) return compareGrupo;
      return turmaA.localeCompare(turmaB);
    }
    
    // Anos regulares (1º-9º) - extrair número e ordenar
    const numeroA = parseInt(grupoA.match(/\d+/)?.[0] || '0');
    const numeroB = parseInt(grupoB.match(/\d+/)?.[0] || '0');
    
    if (numeroA !== numeroB) {
      return numeroA - numeroB;
    }
    
    // Se o ano é igual, ordenar alfabeticamente pela turma
    return turmaA.localeCompare(turmaB);
  });
}
