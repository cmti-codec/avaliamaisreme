import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, CheckCircle, UserPlus, TrendingUp, TrendingDown, Info, AlertCircle } from "lucide-react";
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

function ResumoDisponibilidade({ 
  escolaId, 
  anoLetivo, 
  includeInativos 
}: { 
  escolaId: string; 
  anoLetivo: string;
  includeInativos: boolean;
}) {
  const { data: resumo, isLoading } = useQuery({
    queryKey: ["resumo-disponibilidade", escolaId, anoLetivo],
    queryFn: async () => {
      // Total de usuários com perfil PROFESSOR
      const { data: totalUsuarios } = await supabase
        .from("user_roles")
        .select("user_id", { count: "exact" })
        .eq("role", "PROFESSOR");

      // Usuários ativos com perfil PROFESSOR
      const usuariosIds = totalUsuarios?.map(u => u.user_id) || [];
      const { count: totalAtivos } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true })
        .in("id", usuariosIds)
        .eq("ativo", true);

      // Buscar pessoa_ids dos usuários ativos
      const { data: usuariosAtivos } = await supabase
        .from("usuarios")
        .select("pessoa_id")
        .in("id", usuariosIds)
        .eq("ativo", true);

      const pessoasAtivas = usuariosAtivos?.map(u => u.pessoa_id).filter(Boolean) || [];

      // Já lotados na escola/ano
      const { count: jaLotados } = await supabase
        .from("lotacoes")
        .select("*", { count: "exact", head: true })
        .eq("escola_saesc", escolaId)
        .eq("perfil", "PROFESSOR")
        .eq("ano_letivo", anoLetivo)
        .eq("ativo", true)
        .in("pessoa_id", pessoasAtivas);

      return {
        totalPool: totalUsuarios?.length || 0,
        totalPoolAtivos: totalAtivos || 0,
        jaLotados: jaLotados || 0,
        disponiveis: (totalAtivos || 0) - (jaLotados || 0)
      };
    },
    enabled: !!escolaId && !!anoLetivo,
  });

  if (isLoading) {
    return (
      <p className="text-center text-muted-foreground py-8">Carregando resumo...</p>
    );
  }

  return (
    <div className="space-y-4 py-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription className="space-y-2">
          <p className="font-semibold">Resumo de Disponibilidade</p>
          <div className="space-y-1 text-sm">
            <p>• <strong>Total no pool (REME):</strong> {resumo?.totalPool || 0} professores</p>
            <p>• <strong>Ativos no pool:</strong> {resumo?.totalPoolAtivos || 0} professores</p>
            <p>• <strong>Já lotados nesta escola ({anoLetivo}):</strong> {resumo?.jaLotados || 0} professores</p>
            <p className="text-primary font-semibold">• <strong>Disponíveis para lotação:</strong> {resumo?.disponiveis || 0} professores</p>
          </div>
        </AlertDescription>
      </Alert>

      {!includeInativos && (resumo?.totalPool || 0) > (resumo?.totalPoolAtivos || 0) && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="text-sm">
              Existem <strong>{(resumo?.totalPool || 0) - (resumo?.totalPoolAtivos || 0)} professores inativos</strong> no pool. 
              Ative a opção "Incluir professores inativos (REME)" acima para visualizá-los.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
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
  const [includeInativos, setIncludeInativos] = useState(false);
  
  const { data: professores = [], isLoading } = useProfessoresDisponiveis(escolaId, anoLetivo, includeInativos);

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
      // Mapear IDs de professores para pessoa_id
      const pessoaIds = selectedIds
        .map(id => professores.find(p => p.id === id)?.pessoa_id)
        .filter(Boolean) as string[];
      
      if (pessoaIds.length > 0) {
        onLotar(pessoaIds);
        setSelectedIds([]);
        setSearchTerm("");
        setFiltroVinculo("TODOS");
      }
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      setSelectedIds([]);
      setSearchTerm("");
      setFiltroVinculo("TODOS");
      setIncludeInativos(false);
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

          <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
            <Checkbox
              id="include-inativos"
              checked={includeInativos}
              onCheckedChange={(checked) => setIncludeInativos(checked as boolean)}
            />
            <label htmlFor="include-inativos" className="text-sm font-medium cursor-pointer">
              Incluir professores inativos (REME)
            </label>
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
              <ResumoDisponibilidade 
                escolaId={escolaId} 
                anoLetivo={anoLetivo} 
                includeInativos={includeInativos}
              />
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
                           {prof.ativo ? (
                            <Badge variant="default" className="text-xs">
                              Pool (REME)
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs text-muted-foreground">
                              Inativo
                            </Badge>
                          )}
                          {Array.isArray(prof.formacoes) && prof.formacoes.map((formacao: string, index: number) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="text-xs bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800"
                            >
                              {formacao}
                            </Badge>
                          ))}
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
