import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, Hash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsuario } from "@/hooks/useUsuario";
import { EscolasMatrizesTable } from "@/components/EscolasMatrizes/EscolasMatrizesTable";
import { AtribuirMatrizModal } from "@/components/EscolasMatrizes/AtribuirMatrizModal";
import { AtribuirLoteModal } from "@/components/EscolasMatrizes/AtribuirLoteModal";
import { Skeleton } from "@/components/ui/skeleton";

const EscolasMatrizes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: usuario, isLoading } = useUsuario();
  const [atribuirModalOpen, setAtribuirModalOpen] = useState(false);
  const [loteModalOpen, setLoteModalOpen] = useState(false);
  const [escolaEditId, setEscolaEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!usuario || usuario.perfil !== "admin")) {
      toast({
        title: "Acesso negado",
        description: "Esta área é restrita a administradores",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [usuario, isLoading, navigate, toast]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-96" />
            <Skeleton className="h-5 w-[600px]" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!usuario || usuario.perfil !== "admin") {
    return null;
  }

  const handleEdit = (id: string) => {
    setEscolaEditId(id);
    setAtribuirModalOpen(true);
  };

  const handleCloseAtribuirModal = () => {
    setAtribuirModalOpen(false);
    setEscolaEditId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">
              Atribuir Matrizes às Escolas
            </h1>
            <Badge variant="destructive" className="gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Área Restrita - Somente Administradores
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Defina qual matriz curricular cada escola da rede utilizará. Esta configuração 
            define os componentes e cargas horárias para todas as turmas da escola.
          </p>
        </div>
        <Button 
          onClick={() => setLoteModalOpen(true)} 
          className="gap-2 shrink-0"
          size="lg"
          variant="outline"
        >
          <Hash className="w-4 h-4" />
          Atribuir em Lote
        </Button>
      </div>

      {/* Tabela */}
      <EscolasMatrizesTable onEdit={handleEdit} />

      {/* Modals */}
      <AtribuirMatrizModal
        open={atribuirModalOpen}
        onClose={handleCloseAtribuirModal}
        escolaId={escolaEditId}
      />

      <AtribuirLoteModal
        open={loteModalOpen}
        onClose={() => setLoteModalOpen(false)}
      />
    </div>
  );
};

export default EscolasMatrizes;
