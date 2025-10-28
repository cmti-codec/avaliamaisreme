import { School } from "lucide-react";
import { useUsuario } from "@/hooks/useUsuario";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function AppFooter() {
  const { data: usuario } = useUsuario();
  const { testSchoolId } = useAuth();
  
  // Priorizar testSchoolId (modo teste) sobre usuario.escola_id
  const escolaIdToUse = testSchoolId || usuario?.escola_id;
  
  const { data: escola } = useQuery({
    queryKey: ["escola-footer", escolaIdToUse],
    queryFn: async () => {
      if (!escolaIdToUse) return null;
      
      const { data, error } = await supabase
        .from("escolas")
        .select("nome, codigo_inep")
        .eq("id", escolaIdToUse)
        .maybeSingle();
        
      if (error) throw error;
      return data;
    },
    enabled: !!escolaIdToUse,
  });

  // Admin sem escola: mostrar "Administrador do Sistema"
  const isAdmin = usuario?.roles.includes('ADMIN');
  const showAdminLabel = isAdmin && !escola && !testSchoolId;

  if (!showAdminLabel && !escola) return null;

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="px-6 md:px-8 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <School className="h-4 w-4 text-primary flex-shrink-0" />
          
          {showAdminLabel ? (
            <span className="font-medium text-foreground">Administrador do Sistema</span>
          ) : escola ? (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-foreground">{escola.nome}</span>
              {escola.codigo_inep && (
                <>
                  <span className="text-muted-foreground">│</span>
                  <span>INEP: {escola.codigo_inep}</span>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
