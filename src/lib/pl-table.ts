// Tabela de PLs baseada nas regras da REME (1/3 da carga horária)
export const TABELA_PLS: Record<number, number[]> = {
  1: [1], 2: [1, 2], 3: [1, 2], 4: [2, 3], 5: [2, 3], 6: [3],
  7: [4], 8: [4], 9: [5, 6], 10: [5, 6], 11: [6], 12: [6],
  13: [7], 14: [7], 15: [8], 16: [8], 17: [9], 18: [9],
  19: [10], 20: [11], 21: [11], 22: [12], 23: [12], 24: [13],
  25: [13], 26: [14], 27: [14], 28: [15], 29: [15], 30: [16],
  31: [16], 32: [17], 33: [17]
};

export const getOpcoesPL = (horasAula: number | string): number[] => {
  const ha = typeof horasAula === 'string' ? parseInt(horasAula) : horasAula;
  if (!ha || ha < 1 || ha > 33) return [];
  return TABELA_PLS[ha] || [];
};
