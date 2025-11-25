import { supabase } from "@/integrations/supabase/client";
import { isSaturday, isSunday, isWithinInterval, eachDayOfInterval } from "date-fns";

/**
 * Verifica se uma data é dia letivo
 * Considera: feriados, eventos institucionais que bloqueiam, fins de semana (exceto sábados letivos)
 */
export const isDiaLetivo = async (data: Date, escolaId: string): Promise<boolean> => {
  const dataStr = data.toISOString().split('T')[0];
  const ano = data.getFullYear();

  // Verificar se é fim de semana
  const ehSabado = isSaturday(data);
  const ehDomingo = isSunday(data);

  if (ehDomingo) return false; // Domingos nunca são letivos

  // Se for sábado, verificar se é sábado letivo
  if (ehSabado) {
    const { data: sabadoLetivo } = await supabase
      .from("sabados_letivos")
      .select("*")
      .eq("escola_id", escolaId)
      .eq("data", dataStr)
      .maybeSingle();
    
    return !!sabadoLetivo; // É letivo apenas se houver registro de sábado letivo
  }

  // Verificar feriados
  const { data: feriado } = await supabase
    .from("feriados")
    .select("*")
    .eq("data", dataStr)
    .eq("ano", ano)
    .maybeSingle();

  if (feriado) return false;

  // Verificar eventos institucionais que bloqueiam
  const { data: evento } = await supabase
    .from("eventos_institucionais")
    .select("*")
    .eq("escola_id", escolaId)
    .eq("data", dataStr)
    .eq("bloqueia_letivo", true)
    .maybeSingle();

  if (evento) return false;

  return true; // É dia letivo
};

/**
 * Retorna o bimestre atual baseado na data fornecida (ou hoje se não informada)
 */
export const getBimestreAtual = async (
  escolaId: string,
  anoLetivoId?: string,
  data?: Date
): Promise<{
  id: string;
  numero: number;
  data_inicio: string;
  data_fim: string;
  ano_letivo_id: string;
} | null> => {
  const dataReferencia = data || new Date();
  const dataStr = dataReferencia.toISOString().split('T')[0];

  // Se não foi fornecido ano letivo, buscar o ano letivo ativo
  let anoLetivoIdFinal = anoLetivoId;
  
  if (!anoLetivoIdFinal) {
    const { data: anoLetivo } = await supabase
      .from("anos_letivos")
      .select("id")
      .eq("ativo", true)
      .gte("data_fim", dataStr)
      .lte("data_inicio", dataStr)
      .maybeSingle();
    
    if (!anoLetivo) return null;
    anoLetivoIdFinal = anoLetivo.id;
  }

  // Buscar bimestre que contém a data
  const { data: bimestre } = await supabase
    .from("bimestres")
    .select("*")
    .eq("ano_letivo_id", anoLetivoIdFinal)
    .lte("data_inicio", dataStr)
    .gte("data_fim", dataStr)
    .maybeSingle();

  return bimestre || null;
};

/**
 * Conta quantos dias letivos existem entre duas datas
 */
export const contarDiasLetivos = async (
  inicio: Date,
  fim: Date,
  escolaId: string
): Promise<number> => {
  const todosDias = eachDayOfInterval({ start: inicio, end: fim });
  
  let diasLetivos = 0;
  
  for (const dia of todosDias) {
    const ehLetivo = await isDiaLetivo(dia, escolaId);
    if (ehLetivo) diasLetivos++;
  }
  
  return diasLetivos;
};

/**
 * Verifica se a data está dentro de um bimestre específico
 */
export const isDataNoBimestre = (
  data: Date,
  bimestre: {
    data_inicio: string;
    data_fim: string;
  }
): boolean => {
  return isWithinInterval(data, {
    start: new Date(bimestre.data_inicio),
    end: new Date(bimestre.data_fim),
  });
};

/**
 * Verifica se a edição está bloqueada após o conselho de classe
 * Retorna true se houver um conselho posterior à data e que bloqueia edição
 */
export const isEdicaoBloqueadaPorConselho = async (
  data: Date,
  escolaId: string,
  bimestreId?: string
): Promise<{
  bloqueado: boolean;
  conselho?: {
    data: string;
    descricao: string;
  };
}> => {
  const dataStr = data.toISOString().split('T')[0];

  // Buscar conselhos que bloqueiam edição e são posteriores à data
  let query = supabase
    .from("conselhos_classe")
    .select("data, descricao, bloqueia_edicao_avaliacoes")
    .eq("escola_id", escolaId)
    .eq("bloqueia_edicao_avaliacoes", true)
    .lte("data", dataStr);

  if (bimestreId) {
    query = query.eq("bimestre_id", bimestreId);
  }

  const { data: conselhos } = await query;

  if (conselhos && conselhos.length > 0) {
    // Encontrar o conselho mais recente
    const conselhoMaisRecente = conselhos.sort(
      (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
    )[0];

    return {
      bloqueado: true,
      conselho: conselhoMaisRecente,
    };
  }

  return { bloqueado: false };
};

/**
 * Retorna todos os bimestres de um ano letivo
 */
export const getBimestresDoAno = async (
  anoLetivoId: string
): Promise<Array<{
  id: string;
  numero: number;
  data_inicio: string;
  data_fim: string;
}>> => {
  const { data: bimestres } = await supabase
    .from("bimestres")
    .select("id, numero, data_inicio, data_fim")
    .eq("ano_letivo_id", anoLetivoId)
    .order("numero");

  return bimestres || [];
};
