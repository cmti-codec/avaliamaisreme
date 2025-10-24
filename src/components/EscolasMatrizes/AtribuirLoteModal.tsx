import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEscolas, useAtribuirMatrizEmLote } from "@/hooks/useEscolas";
import { useMatrizes } from "@/hooks/useMatrizes";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle } from "lucide-react";

interface AtribuirLoteModalProps {
  open: boolean;
  onClose: () => void;
}

export const AtribuirLoteModal = ({ open, onClose }: AtribuirLoteModalProps) => {
  const { data: escolas, isLoading: loadingEscolas } = useEscolas();
  const { data: matrizes } = useMatrizes();
  const atribuirLoteMutation = useAtribuirMatrizEmLote();

  const [escolasSelecionadas, setEscolasSelecionadas] = useState<string[]>([]);
  const [matrizSelecionada, setMatrizSelecionada] = useState<string>("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const matrizesAtivas = matrizes?.filter((m) => m.ativa);

  // Agrupar matrizes por etapa
  const matrizesAgrupadas = matrizesAtivas?.reduce((acc, matriz) => {
    const etapa = matriz.etapa_modalidade;
    if (!acc[etapa]) {
      acc[etapa] = [];
    }
    acc[etapa].push(matriz);
    return acc;
  }, {} as Record<string, typeof matrizesAtivas>);

  const todasSelecionadas = escolasSelecionadas.length === escolas?.length;

  const handleToggleTodas = () => {
    if (todasSelecionadas) {
      setEscolasSelecionadas([]);
    } else {
      setEscolasSelecionadas(escolas?.map((e) => e.id) || []);
    }
  };

  const handleToggleEscola = (id: string) => {
    setEscolasSelecionadas((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id]
    );
  };

  const escolasParaExibir = useMemo(() => {
    if (!escolas) return [];
    return escolas
      .filter((e) => escolasSelecionadas.includes(e.id))
      .slice(0, 10);
  }, [escolas, escolasSelecionadas]);

  const handleConfirmar = async () => {
    if (escolasSelecionadas.length === 0 || !matrizSelecionada) return;

    try {
      await atribuirLoteMutation.mutateAsync({
        escolasIds: escolasSelecionadas,
        matrizId: matrizSelecionada,
      });
      handleClose();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleClose = () => {
    setEscolasSelecionadas([]);
    setMatrizSelecionada("");
    setConfirmDialogOpen(false);
    onClose();
  };

  const matrizObj = matrizes?.find((m) => m.id === matrizSelecionada);

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Atribuir Matriz para Múltiplas Escolas</DialogTitle>
          </DialogHeader>

          {loadingEscolas ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Seleção de Escolas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Escolas</Label>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="todas"
                      checked={todasSelecionadas}
                      onCheckedChange={handleToggleTodas}
                    />
                    <Label htmlFor="todas" className="cursor-pointer font-normal">
                      Selecionar todas ({escolas?.length || 0})
                    </Label>
                  </div>
                </div>

                <ScrollArea className="h-64 rounded-md border p-4">
                  <div className="space-y-2">
                    {escolas?.map((escola) => (
                      <div
                        key={escola.id}
                        className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                      >
                        <Checkbox
                          id={escola.id}
                          checked={escolasSelecionadas.includes(escola.id)}
                          onCheckedChange={() => handleToggleEscola(escola.id)}
                        />
                        <Label
                          htmlFor={escola.id}
                          className="flex-1 cursor-pointer font-normal"
                        >
                          <div className="flex items-center justify-between">
                            <span>{escola.nome}</span>
                            {escola.matriz_curricular_id && (
                              <Badge variant="outline" className="text-xs">
                                Já possui matriz
                              </Badge>
                            )}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="text-sm text-muted-foreground">
                  {escolasSelecionadas.length} escola(s) selecionada(s)
                </div>
              </div>

              {/* Seleção de Matriz */}
              <div className="space-y-2">
                <Label htmlFor="matriz-lote">
                  Matriz Curricular <span className="text-destructive">*</span>
                </Label>
                <Select value={matrizSelecionada} onValueChange={setMatrizSelecionada}>
                  <SelectTrigger id="matriz-lote">
                    <SelectValue placeholder="Selecione uma matriz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {matrizesAgrupadas &&
                      Object.entries(matrizesAgrupadas).map(([etapa, matrizesGrupo]) => (
                        <SelectGroup key={etapa}>
                          <SelectLabel>{etapa}</SelectLabel>
                          {matrizesGrupo
                            .sort((a, b) => a.codigo.localeCompare(b.codigo))
                            .map((matriz) => (
                              <SelectItem key={matriz.id} value={matriz.id}>
                                <span className="font-mono text-xs mr-2">
                                  {matriz.codigo}
                                </span>
                                - {matriz.nome}
                              </SelectItem>
                            ))}
                        </SelectGroup>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  onClick={() => setConfirmDialogOpen(true)}
                  disabled={escolasSelecionadas.length === 0 || !matrizSelecionada}
                >
                  Aplicar para {escolasSelecionadas.length} escola(s)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <AlertDialogTitle className="text-xl">
                Confirmar Atribuição em Lote
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="space-y-4">
              <p>
                Você está prestes a atribuir a matriz{" "}
                <strong className="text-foreground">{matrizObj?.nome}</strong> para{" "}
                <strong className="text-foreground">{escolasSelecionadas.length}</strong>{" "}
                escola(s):
              </p>

              <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                <ul className="space-y-1 text-sm">
                  {escolasParaExibir.map((escola) => (
                    <li key={escola.id}>• {escola.nome}</li>
                  ))}
                  {escolasSelecionadas.length > 10 && (
                    <li className="text-muted-foreground italic">
                      ... e mais {escolasSelecionadas.length - 10} escola(s)
                    </li>
                  )}
                </ul>
              </div>

              <p className="text-sm">Deseja continuar?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={atribuirLoteMutation.isPending}
            >
              {atribuirLoteMutation.isPending
                ? "Processando..."
                : "✅ Confirmar Atribuição em Lote"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
