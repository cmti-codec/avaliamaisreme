import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CargaHoraria {
  id: string;
  componente_nome: string;
  etapa_modalidade: string;
  grupo_ano: string;
  carga_horaria_semanal: number;
  created_at: string;
}

export const useCargasHorarias = () => {
  return useQuery({
    queryKey: ["cargas-horarias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cargas_horarias_componentes")
        .select("*")
        .order("componente_nome");

      if (error) throw error;
      return data as CargaHoraria[];
    },
  });
};

// Helper para buscar carga específica
export const getCargaHoraria = (
  cargas: CargaHoraria[] | undefined,
  componenteNome: string,
  etapaModalidade: string,
  grupoAno: string
): number | null => {
  if (!cargas) return null;
  
  const carga = cargas.find(
    c => 
      c.componente_nome === componenteNome &&
      c.etapa_modalidade === etapaModalidade &&
      c.grupo_ano === grupoAno
  );
  
  return carga ? carga.carga_horaria_semanal : null;
};
