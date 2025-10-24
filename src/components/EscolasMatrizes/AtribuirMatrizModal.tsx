import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useEscola, useAtribuirMatriz } from "@/hooks/useEscolas";
import { useMatrizes } from "@/hooks/useMatrizes";
import { Skeleton } from "@/components/ui/skeleton";
import { MatrizPreview } from "./MatrizPreview";

interface AtribuirMatrizModalProps {
  open: boolean;
  onClose: () => void;
  escolaId: string | null;
}

export const AtribuirMatrizModal = ({ open, onClose, escolaId }: AtribuirMatrizModalProps) => {
  const { data: escola, isLoading: loadingEscola } = useEscola(escolaId);
  const { data: matrizes } = useMatrizes();
  const atribuirMutation = useAtribuirMatriz();
  const [matrizSelecionada, setMatrizSelecionada] = useState<string>("");

  useEffect(() => {
    if (escola?.matriz_curricular_id) {
      setMatrizSelecionada(escola.matriz_curricular_id);
    } else {
      setMatrizSelecionada("");
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

  const matrizAtual = escola?.matriz;
  const matrizNova = matrizes?.find((m) => m.id === matrizSelecionada);
  const mudandoMatriz = matrizAtual && matrizSelecionada !== matrizAtual.id;

  const handleSalvar = async () => {
    if (!escolaId) return;

    try {
      await atribuirMutation.mutateAsync({
        escolaId,
        matrizId: matrizSelecionada || null,
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
            {/* Alerta se já possui matriz */}
            {mudandoMatriz && matrizAtual && (
              <Alert className="border-amber-500 bg-amber-50 dark:bg-amber-950">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800 dark:text-amber-200">
                  Esta escola já possui a matriz{" "}
                  <strong>{matrizAtual.codigo}</strong>. Ao alterar, todas as
                  turmas desta escola usarão a nova matriz. Horários já lançados{" "}
                  <strong>NÃO serão alterados automaticamente</strong>.
                </AlertDescription>
              </Alert>
            )}

            {/* Seleção de Matriz */}
            <div className="space-y-2">
              <Label htmlFor="matriz">
                Matriz Curricular <span className="text-destructive">*</span>
              </Label>
              <Select value={matrizSelecionada} onValueChange={setMatrizSelecionada}>
                <SelectTrigger id="matriz">
                  <SelectValue placeholder="Selecione uma matriz..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">
                    <span className="text-muted-foreground">Remover matriz</span>
                  </SelectItem>
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

            {/* Preview da Matriz */}
            {matrizNova && <MatrizPreview matriz={matrizNova} />}

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSalvar}
                disabled={atribuirMutation.isPending || !matrizSelecionada}
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
