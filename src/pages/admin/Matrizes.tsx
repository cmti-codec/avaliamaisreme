import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ShieldAlert } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsuario } from "@/hooks/useUsuario";
import { MatrizTable } from "@/components/Matrizes/MatrizTable";
import { MatrizModal } from "@/components/Matrizes/MatrizModal";
import { Skeleton } from "@/components/ui/skeleton";

const Matrizes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: usuario, isLoading } = useUsuario();
  const [modalOpen, setModalOpen] = useState(false);
  const [matrizEditId, setMatrizEditId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && (!usuario || !usuario.roles.includes("ADMIN"))) {
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
          <Skeleton className="h-10 w-32" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </div>
    );
  }

  if (!usuario || !usuario.roles.includes("ADMIN")) {
    return null;
  }

  const handleEdit = (id: string) => {
    setMatrizEditId(id);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setMatrizEditId(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-foreground">
              Gestão de Matrizes Curriculares
            </h1>
            <Badge variant="destructive" className="gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              Área Restrita - Somente Administradores
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-3xl">
            Defina as matrizes curriculares (conjuntos de componentes + cargas horárias) 
            para toda a rede. Apenas administradores podem gerenciar matrizes.
          </p>
        </div>
        <Button 
          onClick={() => setModalOpen(true)} 
          className="gap-2 shrink-0"
          size="lg"
        >
          <Plus className="w-4 h-4" />
          Nova Matriz
        </Button>
      </div>

      {/* Tabela */}
      <MatrizTable onEdit={handleEdit} />

      {/* Modal */}
      <MatrizModal
        open={modalOpen}
        onClose={handleCloseModal}
        matrizId={matrizEditId}
      />
    </div>
  );
};

export default Matrizes;
