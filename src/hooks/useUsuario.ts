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
  roles: PerfilUsuario[];
  primaryRole: PerfilUsuario;
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

      // Buscar dados básicos
      const { data: userData, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (userError) {
        console.error("Erro ao buscar usuário:", userError);
        throw userError;
      }

      if (!userData) return null;

      // Buscar roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role, escola_id")
        .eq("user_id", user.id);

      if (rolesError) {
        console.error("Erro ao buscar roles:", rolesError);
        throw rolesError;
      }

      const roles = rolesData?.map(r => r.role as PerfilUsuario) || [];
      const primaryRole = roles[0] || 'PROFESSOR';
      const escola_id = rolesData?.[0]?.escola_id || null;

      return {
        ...userData,
        roles,
        primaryRole,
        escola_id,
      } as Usuario;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
};
