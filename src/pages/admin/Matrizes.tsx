import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, ShieldAlert, Search, FileText, CheckCircle2, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUsuario } from "@/hooks/useUsuario";
import { useMatrizes } from "@/hooks/useMatrizes";
import { MatrizCard } from "@/components/Matrizes/MatrizCard";
import { MatrizModal } from "@/components/Matrizes/MatrizModal";
import { MatrizDeleteDialog } from "@/components/Matrizes/MatrizDeleteDialog";
import { MatrizViewDialog } from "@/components/Matrizes/MatrizViewDialog";
import { ComponentesDialog } from "@/components/Matrizes/ComponentesDialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Matrizes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: usuario, isLoading: isLoadingUser } = useUsuario();
  const { data: matrizes, isLoading: isLoadingMatrizes } = useMatrizes();
  
  const [modalOpen, setModalOpen] = useState(false);
  const [matrizEditId, setMatrizEditId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMatrizId, setSelectedMatrizId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [componentesDialogOpen, setComponentesDialogOpen] = useState(false);

  const isLoading = isLoadingUser || isLoadingMatrizes;

  // Estatísticas
  const stats = useMemo(() => {
    if (!matrizes) return { total: 0, ativas: 0, inativas: 0 };
    return {
      total: matrizes.length,
      ativas: matrizes.filter(m => m.ativa).length,
      inativas: matrizes.filter(m => !m.ativa).length,
    };
  }, [matrizes]);

  // Etapas disponíveis para filtro
  const etapasDisponiveis = useMemo(() => {
    if (!matrizes) return [];
    const etapas = new Set(matrizes.map((m) => m.etapa_modalidade));
    return Array.from(etapas).sort();
  }, [matrizes]);

  // Filtrar matrizes
  const filteredMatrizes = useMemo(() => {
    if (!matrizes) return [];

    return matrizes.filter((matriz) => {
      const matchSearch =
        search === "" ||
        matriz.codigo.toLowerCase().includes(search.toLowerCase()) ||
        matriz.nome.toLowerCase().includes(search.toLowerCase()) ||
        matriz.etapa_modalidade.toLowerCase().includes(search.toLowerCase());

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "ativa" && matriz.ativa) ||
        (statusFilter === "inativa" && !matriz.ativa);

      const matchEtapa =
        etapaFilter === "all" || matriz.etapa_modalidade === etapaFilter;

      return matchSearch && matchStatus && matchEtapa;
    });
  }, [matrizes, search, statusFilter, etapaFilter]);

  useEffect(() => {
    if (!isLoadingUser && (!usuario || !usuario.roles.includes("ADMIN"))) {
      toast({
        title: "Acesso negado",
        description: "Esta área é restrita a administradores",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [usuario, isLoadingUser, navigate, toast]);

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

  const handleView = (id: string) => {
    setSelectedMatrizId(id);
    setViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setSelectedMatrizId(id);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = (id: string) => {
    // TODO: Implementar duplicação
    console.log("Duplicar matriz", id);
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
        <div className="flex gap-2 shrink-0">
          <Button 
            onClick={() => setComponentesDialogOpen(true)} 
            variant="outline"
            className="gap-2"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Componentes
          </Button>
          <Button 
            onClick={() => setModalOpen(true)} 
            className="gap-2"
            size="lg"
          >
            <Plus className="w-4 h-4" />
            Nova Matriz
          </Button>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-primary">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total de Matrizes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.ativas}</p>
                <p className="text-sm text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <XCircle className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-3xl font-bold text-muted-foreground">{stats.inativas}</p>
                <p className="text-sm text-muted-foreground">Inativas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar matriz..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Todas as etapas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as etapas</SelectItem>
                {etapasDisponiveis.map((etapa) => (
                  <SelectItem key={etapa} value={etapa}>
                    {etapa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Grid de Cards */}
      {filteredMatrizes.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Nenhuma matriz encontrada
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatrizes.map((matriz) => (
            <MatrizCard
              key={matriz.id}
              matriz={matriz}
              onView={handleView}
              onEdit={handleEdit}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <MatrizModal
        open={modalOpen}
        onClose={handleCloseModal}
        matrizId={matrizEditId}
      />

      <MatrizViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedMatrizId(null);
        }}
        matrizId={selectedMatrizId}
      />

      <MatrizDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedMatrizId(null);
        }}
        matrizId={selectedMatrizId}
      />

      <ComponentesDialog
        open={componentesDialogOpen}
        onClose={() => setComponentesDialogOpen(false)}
      />
    </div>
  );
};

export default Matrizes;
