import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Clock, Pencil, Check, X } from "lucide-react";
import { useCargasHorarias, useUpdateCargaHoraria } from "@/hooks/useCargasHorarias";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CargasHorariasDialogProps {
  open: boolean;
  onClose: () => void;
}

export function CargasHorariasDialog({ open, onClose }: CargasHorariasDialogProps) {
  const [search, setSearch] = useState("");
  const [etapaFilter, setEtapaFilter] = useState<string>("all");
  const [anoFilter, setAnoFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  const { data: cargas, isLoading } = useCargasHorarias();
  const updateMutation = useUpdateCargaHoraria();

  // Filtros únicos
  const etapasDisponiveis = useMemo(() => {
    if (!cargas) return [];
    const etapas = new Set(cargas.map((c) => c.etapa_modalidade));
    return Array.from(etapas).sort();
  }, [cargas]);

  const anosDisponiveis = useMemo(() => {
    if (!cargas) return [];
    const anos = new Set(cargas.map((c) => c.grupo_ano));
    return Array.from(anos).sort();
  }, [cargas]);

  // Filtrar cargas
  const filteredCargas = useMemo(() => {
    if (!cargas) return [];

    return cargas.filter((carga) => {
      const matchSearch =
        search === "" ||
        carga.componente_nome.toLowerCase().includes(search.toLowerCase()) ||
        carga.etapa_modalidade.toLowerCase().includes(search.toLowerCase()) ||
        carga.grupo_ano.toLowerCase().includes(search.toLowerCase());

      const matchEtapa =
        etapaFilter === "all" || carga.etapa_modalidade === etapaFilter;

      const matchAno = anoFilter === "all" || carga.grupo_ano === anoFilter;

      return matchSearch && matchEtapa && matchAno;
    });
  }, [cargas, search, etapaFilter, anoFilter]);

  const handleStartEdit = (id: string, currentValue: number) => {
    setEditingId(id);
    setEditValue(currentValue);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditValue(0);
  };

  const handleSaveEdit = async (id: string) => {
    if (editValue < 1 || editValue > 40) {
      return;
    }

    await updateMutation.mutateAsync({
      id,
      carga_horaria_semanal: editValue,
    });

    setEditingId(null);
    setEditValue(0);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Gerenciar Cargas Horárias dos Componentes
          </DialogTitle>
          <DialogDescription>
            Visualize e edite as cargas horárias semanais de cada componente por etapa/modalidade e ano
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Filtros */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar componente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={etapaFilter} onValueChange={setEtapaFilter}>
              <SelectTrigger>
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
            <Select value={anoFilter} onValueChange={setAnoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os anos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anos</SelectItem>
                {anosDisponiveis.map((ano) => (
                  <SelectItem key={ano} value={ano}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabela */}
          <div className="flex-1 overflow-auto border rounded-lg">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Componente</TableHead>
                    <TableHead>Etapa/Modalidade</TableHead>
                    <TableHead>Ano/Grupo</TableHead>
                    <TableHead className="text-right">Carga Semanal (h)</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCargas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma carga horária encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCargas.map((carga) => (
                      <TableRow key={carga.id}>
                        <TableCell className="font-medium">{carga.componente_nome}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {carga.etapa_modalidade}
                        </TableCell>
                        <TableCell>{carga.grupo_ano}</TableCell>
                        <TableCell className="text-right">
                          {editingId === carga.id ? (
                            <Input
                              type="number"
                              min="1"
                              max="40"
                              value={editValue}
                              onChange={(e) => setEditValue(Number(e.target.value))}
                              className="w-20 h-8 text-right"
                              autoFocus
                            />
                          ) : (
                            <span className="font-mono font-semibold">{carga.carga_horaria_semanal}h</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {editingId === carga.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={() => handleSaveEdit(carga.id)}
                                disabled={updateMutation.isPending}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8"
                                onClick={handleCancelEdit}
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                              onClick={() => handleStartEdit(carga.id, carga.carga_horaria_semanal)}
                            >
                              <Pencil className="h-4 w-4 text-primary" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Info */}
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Dica:</strong> As cargas horárias são preenchidas automaticamente ao criar matrizes, 
            mas podem ser editadas individualmente para casos especiais (escolas de tempo integral, escolas do campo, etc.)
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
