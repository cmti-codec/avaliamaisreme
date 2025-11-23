import { supabase } from "@/integrations/supabase/client";

export interface EventoSobreposto {
  tipo: string;
  data: string;
  descricao: string;
  id: string;
}

/**
 * Verifica se há sobreposição de eventos na data especificada
 * Retorna lista de eventos que ocupam aquela data
 */
export const verificarSobreposicao = async (
  data: string,
  escolaId: string,
  eventoId?: string, // Para excluir o próprio evento ao editar
  tipoEvento?: string
): Promise<{
  temSobreposicao: boolean;
  eventos: EventoSobreposto[];
}> => {
  const eventos: EventoSobreposto[] = [];
  const ano = new Date(data).getFullYear();

  // Verificar feriados
  const { data: feriados } = await supabase
    .from("feriados")
    .select("id, data, descricao, tipo")
    .eq("data", data)
    .eq("ano", ano);

  if (feriados && feriados.length > 0) {
    feriados.forEach((f) => {
      if (f.id !== eventoId) {
        eventos.push({
          tipo: "FERIADO",
          data: f.data,
          descricao: `${f.tipo}: ${f.descricao}`,
          id: f.id,
        });
      }
    });
  }

  // Verificar sábados letivos
  const { data: sabados } = await supabase
    .from("sabados_letivos")
    .select("id, data, descricao, tipo")
    .eq("data", data)
    .eq("escola_id", escolaId);

  if (sabados && sabados.length > 0) {
    sabados.forEach((s) => {
      if (s.id !== eventoId) {
        eventos.push({
          tipo: "SABADO_LETIVO",
          data: s.data,
          descricao: s.descricao || `Sábado Letivo - ${s.tipo}`,
          id: s.id,
        });
      }
    });
  }

  // Verificar eventos institucionais
  const { data: eventosInst } = await supabase
    .from("eventos_institucionais")
    .select("id, data, descricao, tipo")
    .eq("data", data)
    .eq("escola_id", escolaId);

  if (eventosInst && eventosInst.length > 0) {
    eventosInst.forEach((e) => {
      if (e.id !== eventoId) {
        eventos.push({
          tipo: "EVENTO_INSTITUCIONAL",
          data: e.data,
          descricao: `${e.tipo}: ${e.descricao}`,
          id: e.id,
        });
      }
    });
  }

  // Verificar conselhos de classe
  const { data: conselhos } = await supabase
    .from("conselhos_classe")
    .select("id, data, descricao")
    .eq("data", data)
    .eq("escola_id", escolaId);

  if (conselhos && conselhos.length > 0) {
    conselhos.forEach((c) => {
      if (c.id !== eventoId) {
        eventos.push({
          tipo: "CONSELHO",
          data: c.data,
          descricao: `Conselho de Classe${c.descricao ? `: ${c.descricao}` : ""}`,
          id: c.id,
        });
      }
    });
  }

  return {
    temSobreposicao: eventos.length > 0,
    eventos,
  };
};

/**
 * Retorna um texto amigável explicando quais eventos estão sobrepostos
 */
export const formatarMensagemSobreposicao = (eventos: EventoSobreposto[]): string => {
  if (eventos.length === 0) return "";
  
  const tiposMap: Record<string, string> = {
    FERIADO: "Feriado",
    SABADO_LETIVO: "Sábado Letivo",
    EVENTO_INSTITUCIONAL: "Evento Institucional",
    CONSELHO: "Conselho de Classe",
  };

  return eventos
    .map((e) => `• ${tiposMap[e.tipo] || e.tipo}: ${e.descricao}`)
    .join("\n");
};
