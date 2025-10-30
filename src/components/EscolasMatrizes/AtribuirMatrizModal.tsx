import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, X } from "lucide-react";
import { useEscola, useAtribuirMatrizes } from "@/hooks/useEscolas";
import { useMatrizes } from "@/hooks/useMatrizes";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MatrizPreview } from "./MatrizPreview";

interface AtribuirMatrizModalProps {
  open: boolean;
  onClose: () => void;
  escolaId: string | null;
}

export const AtribuirMatrizModal = ({ open, onClose, escolaId }: AtribuirMatrizModalProps) => {
  const { data: escola, isLoading: loadingEscola } = useEscola(escolaId);
  const { data: matrizes } = useMatrizes();
  const atribuirMutation = useAtribuirMatrizes();
  const [matrizesSelecionadas, setMatrizesSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    if (escola?.matrizes && escola.matrizes.length > 0) {
      setMatrizesSelecionadas(escola.matrizes.map((m) => m.id));
    } else {
      setMatrizesSelecionadas([]);
    }
  }, [escola]);

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

  const handleToggleMatriz = (matrizId: string) => {
    setMatrizesSelecionadas((prev) =>
      prev.includes(matrizId)
        ? prev.filter((id) => id !== matrizId)
        : [...prev, matrizId]
    );
  };

  const handleRemoveMatriz = (matrizId: string) => {
    setMatrizesSelecionadas((prev) => prev.filter((id) => id !== matrizId));
  };

  const matrizesObj = matrizes?.filter((m) => matrizesSelecionadas.includes(m.id));

  const handleSalvar = async () => {
    if (!escolaId) return;

    try {
      await atribuirMutation.mutateAsync({
        escolaId,
        matrizesIds: matrizesSelecionadas,
      });
      onClose();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Atribuir Matriz - {escola?.nome || "Carregando..."}
          </DialogTitle>
        </DialogHeader>

        {loadingEscola ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Alerta informativo */}
            {escola?.matrizes && escola.matrizes.length > 0 && (
              <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  Esta escola já possui {escola.matrizes.length} matriz(es) atribuída(s).
                  Você pode adicionar ou remover matrizes conforme necessário.
                </AlertDescription>
              </Alert>
            )}

            {/* Matrizes Selecionadas */}
            {matrizesSelecionadas.length > 0 && (
              <div className="space-y-2">
                <Label>Matrizes Selecionadas ({matrizesSelecionadas.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {matrizesObj?.map((matriz) => (
                    <Badge key={matriz.id} variant="secondary" className="gap-2 py-1.5 px-3">
                      <span className="font-mono text-xs">{matriz.codigo}</span>
                      <span>-</span>
                      <span className="text-xs">{matriz.nome}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 p-0 hover:bg-transparent"
                        onClick={() => handleRemoveMatriz(matriz.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Seleção de Matrizes */}
            <div className="space-y-2">
              <Label>
                Adicionar Matrizes Curriculares
              </Label>
              <ScrollArea className="h-80 rounded-md border p-4">
                <div className="space-y-4">
                  {matrizesAgrupadas &&
                    Object.entries(matrizesAgrupadas).map(([etapa, matrizesGrupo]) => (
                      <div key={etapa} className="space-y-2">
                        <div className="font-semibold text-sm text-muted-foreground">
                          {etapa}
                        </div>
                        <div className="space-y-1.5 pl-2">
                          {matrizesGrupo
                            .sort((a, b) => a.codigo.localeCompare(b.codigo))
                            .map((matriz) => (
                              <div
                                key={matriz.id}
                                className="flex items-center gap-3 p-2 rounded hover:bg-muted/50"
                              >
                                <Checkbox
                                  id={matriz.id}
                                  checked={matrizesSelecionadas.includes(matriz.id)}
                                  onCheckedChange={() => handleToggleMatriz(matriz.id)}
                                />
                                <Label
                                  htmlFor={matriz.id}
                                  className="flex-1 cursor-pointer font-normal"
                                >
                                  <span className="font-mono text-xs mr-2 text-muted-foreground">
                                    {matriz.codigo}
                                  </span>
                                  <span className="text-sm">{matriz.nome}</span>
                                  {matriz.tipo_jornada && (
                                    <Badge variant="outline" className="ml-2 text-xs">
                                      {matriz.tipo_jornada}
                                    </Badge>
                                  )}
                                </Label>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSalvar}
                disabled={atribuirMutation.isPending}
              >
                {atribuirMutation.isPending ? "Salvando..." : "Confirmar Atribuição"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
