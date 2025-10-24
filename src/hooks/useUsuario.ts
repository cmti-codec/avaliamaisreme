import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type PerfilUsuario = 
  | 'ADMIN' 
  | 'GESTOR_SEMED' 
  | 'TECNICO_SEMED' 
  | 'DIRETOR' 
  | 'SECRETARIO' 
  | 'COORDENADOR' 
  | 'PROFESSOR';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: PerfilUsuario;
  escola_id: string | null;
  ativo: boolean;
}

export const useUsuario = () => {
  return useQuery({
    queryKey: ["usuario"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return null;
      }

      const { data, error } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar usuário:", error);
        throw error;
      }

      return data as Usuario | null;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
