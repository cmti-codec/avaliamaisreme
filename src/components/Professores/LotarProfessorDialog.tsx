import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, CheckCircle, UserPlus, TrendingUp, TrendingDown } from "lucide-react";
import { useProfessoresDisponiveis } from "@/hooks/useProfessoresDisponiveis";
import { useCargaTotalProfessor } from "@/hooks/useCargaTotalProfessor";

interface LotarProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolaId: string;
  anoLetivo: string;
  onLotar: (professorIds: string[]) => void;
  isSaving: boolean;
}

function ProfessorDisponibilidade({ professorId, anoLetivo }: { professorId: string; anoLetivo: string }) {
  const { data: cargaProfessor } = useCargaTotalProfessor(professorId, anoLetivo);
  
  if (!cargaProfessor) return null;

  const percentual = (cargaProfessor.carga_alocada / (cargaProfessor.carga_contratual || 40)) * 100;
  
  return (
    <div className="flex items-center gap-2 text-xs">
      <Badge variant="outline" className="text-xs">
        {cargaProfessor.carga_disponivel}h disponível
      </Badge>
      {percentual >= 80 ? (
        <Badge variant="secondary" className="text-red-600 border-red-300">
          <TrendingUp className="w-3 h-3 mr-1" />
          {percentual.toFixed(0)}%
        </Badge>
      ) : percentual > 0 ? (
        <Badge variant="secondary" className="text-orange-600">
          {percentual.toFixed(0)}%
        </Badge>
      ) : (
        <Badge variant="secondary" className="text-green-600">
          <TrendingDown className="w-3 h-3 mr-1" />
          Disponível
        </Badge>
      )}
    </div>
  );
}

export function LotarProfessorDialog({
  open,
  onOpenChange,
  escolaId,
  anoLetivo,
  onLotar,
  isSaving
}: LotarProfessorDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [filtroVinculo, setFiltroVinculo] = useState<string>("TODOS");
  const [ordenacao, setOrdenacao] = useState<string>("nome");
  
  const { data: professores = [], isLoading } = useProfessoresDisponiveis(escolaId, anoLetivo);

  const professoresComInfo = useMemo(() => {
    return professores.map(p => ({
      ...p,
      // Dados serão buscados pelo hook individual
    }));
  }, [professores]);

  const filteredProfessores = useMemo(() => {
    let filtered = professoresComInfo.filter(p => {
      const matchSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.matricula?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchVinculo = filtroVinculo === "TODOS" || p.tipo_vinculo === filtroVinculo;
      
      return matchSearch && matchVinculo;
    });

    // Ordenação será simples por enquanto
    if (ordenacao === "nome") {
      filtered.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (ordenacao === "matricula") {
      filtered.sort((a, b) => (a.matricula || "").localeCompare(b.matricula || ""));
    }

    return filtered;
  }, [professoresComInfo, searchTerm, filtroVinculo, ordenacao]);

  const handleToggle = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProfessores.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProfessores.map(p => p.id));
    }
  };

  const handleConfirm = () => {
    if (selectedIds.length > 0) {
      onLotar(selectedIds);
      setSelectedIds([]);
      setSearchTerm("");
      setFiltroVinculo("TODOS");
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setSelectedIds([]);
      setSearchTerm("");
      setFiltroVinculo("TODOS");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Lotar Professor na Escola - {anoLetivo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Buscar Professor</Label>
              <div className="relative mt-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Digite o nome ou matrícula..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label>Filtrar por Vínculo</Label>
              <Select value={filtroVinculo} onValueChange={setFiltroVinculo}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="EFETIVO">Efetivos</SelectItem>
                  <SelectItem value="CONVOCADO">Convocados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredProfessores.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <Checkbox
                id="select-all"
                checked={selectedIds.length === filteredProfessores.length && filteredProfessores.length > 0}
                onCheckedChange={handleSelectAll}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Selecionar todos ({filteredProfessores.length})
              </label>
              {selectedIds.length > 0 && (
                <Badge className="ml-auto">{selectedIds.length} selecionado(s)</Badge>
              )}
            </div>
          )}

          <div className="max-h-96 overflow-y-auto space-y-2">
            {isLoading ? (
              <p className="text-center text-muted-foreground py-8">Carregando...</p>
            ) : filteredProfessores.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum professor disponível para lotação
              </p>
            ) : (
              filteredProfessores.map((prof) => (
                <Card
                  key={prof.id}
                  className={`hover:shadow-md transition-all cursor-pointer ${
                    selectedIds.includes(prof.id) ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => handleToggle(prof.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedIds.includes(prof.id)}
                        onCheckedChange={() => handleToggle(prof.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h4 className="font-semibold text-foreground truncate">{prof.nome}</h4>
                          <Badge variant={prof.tipo_vinculo === 'CONVOCADO' ? "outline" : "secondary"} className="text-xs">
                            {prof.tipo_vinculo === 'CONVOCADO' ? 'Convocado' : 'Efetivo'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Matrícula: {prof.matricula || 'N/A'} | CH: {prof.carga_horaria_contratual || 40}h
                        </p>
                        {prof.email && (
                          <p className="text-xs text-muted-foreground mt-1">{prof.email}</p>
                        )}
                        <div className="mt-2">
                          <ProfessorDisponibilidade professorId={prof.id} anoLetivo={anoLetivo} />
                        </div>
                      </div>
                      {selectedIds.includes(prof.id) && (
                        <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.length === 0 || isSaving}
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
                Lotando...
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" />
                Lotar {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
