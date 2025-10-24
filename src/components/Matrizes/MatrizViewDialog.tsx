import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useMatriz } from "@/hooks/useMatrizes";
import { Skeleton } from "@/components/ui/skeleton";

interface MatrizViewDialogProps {
  open: boolean;
  onClose: () => void;
  matrizId: string | null;
}

export const MatrizViewDialog = ({ open, onClose, matrizId }: MatrizViewDialogProps) => {
  const { data: matriz, isLoading } = useMatriz(matrizId);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Visualizar Matriz Curricular</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : matriz ? (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold">{matriz.nome}</h3>
                  <p className="text-sm text-muted-foreground font-mono">{matriz.codigo}</p>
                </div>
                {matriz.ativa ? (
                  <Badge className="bg-green-600">✅ Ativa</Badge>
                ) : (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Etapa/Modalidade
                  </p>
                  <p className="text-base">{matriz.etapa_modalidade}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Grupo/Ano</p>
                  <p className="text-base">{matriz.grupo_ano}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Tipo de Jornada
                  </p>
                  <Badge variant="outline">
                    {matriz.tipo_jornada || "Não definido"}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Horas Semanais
                  </p>
                  <p className="text-base font-semibold">
                    {matriz.total_horas_semanais || 0}h
                  </p>
                </div>
              </div>

              {matriz.descricao && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Descrição
                  </p>
                  <p className="text-sm bg-muted/30 rounded-lg p-3">
                    {matriz.descricao}
                  </p>
                </div>
              )}
            </div>

            {/* Componentes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-lg">📚 Componentes Curriculares</h4>
                <Badge variant="secondary">
                  {matriz.componentes.length}{" "}
                  {matriz.componentes.length === 1 ? "componente" : "componentes"}
                </Badge>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Ordem</TableHead>
                      <TableHead>Componente</TableHead>
                      <TableHead className="text-right">Carga Horária</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matriz.componentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                          Nenhum componente cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      matriz.componentes
                        .sort((a, b) => a.ordem - b.ordem)
                        .map((comp, index) => (
                          <TableRow key={comp.id}>
                            <TableCell className="text-center font-medium">
                              {index + 1}
                            </TableCell>
                            <TableCell className="font-medium">
                              {comp.componente_nome}
                            </TableCell>
                            <TableCell className="text-right">
                              {comp.carga_horaria_semanal}h/semana
                            </TableCell>
                          </TableRow>
                        ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Total de Carga Horária:</span>
                  <Badge className="text-base px-3 py-1">
                    {matriz.componentes.reduce(
                      (sum, c) => sum + c.carga_horaria_semanal,
                      0
                    )}
                    h/semana
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-12">
            Matriz não encontrada
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
