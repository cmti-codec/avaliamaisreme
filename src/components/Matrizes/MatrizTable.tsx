import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Pencil, Copy, Trash2, Search } from "lucide-react";
import { useMatrizes } from "@/hooks/useMatrizes";
import { Skeleton } from "@/components/ui/skeleton";
import { MatrizDeleteDialog } from "./MatrizDeleteDialog";
import { MatrizViewDialog } from "./MatrizViewDialog";

interface MatrizTableProps {
  onEdit: (id: string) => void;
}

export const MatrizTable = ({ onEdit }: MatrizTableProps) => {
  const { data: matrizes, isLoading } = useMatrizes();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedMatrizId, setSelectedMatrizId] = useState<string | null>(null);

  const etapasDisponiveis = useMemo(() => {
    if (!matrizes) return [];
    const etapas = new Set(matrizes.map((m) => m.etapa_modalidade));
    return Array.from(etapas).sort();
  }, [matrizes]);

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

  const handleDelete = (id: string) => {
    setSelectedMatrizId(id);
    setDeleteDialogOpen(true);
  };

  const handleView = (id: string) => {
    setSelectedMatrizId(id);
    setViewDialogOpen(true);
  };

  const handleDuplicate = (id: string) => {
    // TODO: Implementar duplicação
    console.log("Duplicar matriz", id);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          {/* Filtros */}
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por código, nome ou etapa..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativa">Ativa</SelectItem>
                <SelectItem value="inativa">Inativa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger className="w-60">
                <SelectValue placeholder="Etapa/Modalidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Etapas</SelectItem>
                {etapasDisponiveis.map((etapa) => (
                  <SelectItem key={etapa} value={etapa}>
                    {etapa}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Etapa/Modalidade</TableHead>
                  <TableHead>Grupo/Ano</TableHead>
                  <TableHead>Jornada</TableHead>
                  <TableHead className="text-center">Total Horas</TableHead>
                  <TableHead className="text-center">Componentes</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMatrizes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground py-12">
                      Nenhuma matriz encontrada
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatrizes.map((matriz) => (
                    <TableRow key={matriz.id}>
                      <TableCell className="font-mono font-medium">
                        {matriz.codigo}
                      </TableCell>
                      <TableCell className="max-w-[300px]">
                        {matriz.nome}
                      </TableCell>
                      <TableCell className="text-sm">
                        {matriz.etapa_modalidade}
                      </TableCell>
                      <TableCell>{matriz.grupo_ano}</TableCell>
                      <TableCell>
                        {matriz.tipo_jornada ? (
                          <Badge variant="outline">
                            {matriz.tipo_jornada}
                          </Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {matriz.total_horas_semanais || "-"}h
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">
                          {matriz.qtd_componentes}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {matriz.ativa ? (
                          <Badge variant="default" className="bg-green-600">
                            ✅ Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Inativa</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(matriz.id)}
                            title="Visualizar"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(matriz.id)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDuplicate(matriz.id)}
                            title="Duplicar"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(matriz.id)}
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <MatrizDeleteDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setSelectedMatrizId(null);
        }}
        matrizId={selectedMatrizId}
      />

      <MatrizViewDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setSelectedMatrizId(null);
        }}
        matrizId={selectedMatrizId}
      />
    </>
  );
};
