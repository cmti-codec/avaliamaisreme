import { useTurma } from "@/hooks/useTurmas";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface TurmaViewDialogProps {
  turmaId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getTurnoBadge = (turno: string | null) => {
  const turnoMap: Record<string, { label: string; className: string }> = {
    MATUTINO: { label: "Matutino", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    VESPERTINO: { label: "Vespertino", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    NOTURNO: { label: "Noturno", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    INTEGRAL: { label: "Integral", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  };
  
  return turnoMap[turno || ""] || { label: "Não especificado", className: "bg-muted text-muted-foreground" };
};

export const TurmaViewDialog = ({
  turmaId,
  open,
  onOpenChange,
}: TurmaViewDialogProps) => {
  const { data: turma, isLoading } = useTurma(turmaId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Turma</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : !turma ? (
          <div className="text-center py-8 text-muted-foreground">
            Turma não encontrada
          </div>
        ) : (
          <div className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Turma:</span>
                    <p className="font-medium">{turma.turma}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <div className="mt-1">
                      <Badge variant={turma.ativa ? "default" : "secondary"}>
                        {turma.ativa ? "Ativa" : "Inativa"}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Etapa/Modalidade:</span>
                    <p className="font-medium">{turma.etapa_modalidade}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Grupo/Ano:</span>
                    <p className="font-medium">{turma.grupo_ano}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Turno:</span>
                    <div className="mt-1">
                      <Badge variant="outline" className={getTurnoBadge(turma.turno).className}>
                        {getTurnoBadge(turma.turno).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Criada em:</span>
                    <p className="font-medium">
                      {format(new Date(turma.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Informações da Escola */}
              {turma.escola && (
                <>
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground mb-2">
                      Escola
                    </h3>
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm text-muted-foreground">Nome:</span>
                        <p className="font-medium">{turma.escola.nome}</p>
                      </div>
                      {turma.escola.codigo_inep && (
                        <div>
                          <span className="text-sm text-muted-foreground">Código INEP:</span>
                          <p className="font-medium">{turma.escola.codigo_inep}</p>
                        </div>
                      )}
                      {turma.escola.endereco && (
                        <div>
                          <span className="text-sm text-muted-foreground">Endereço:</span>
                          <p className="font-medium">{turma.escola.endereco}</p>
                        </div>
                      )}
                      {turma.escola.telefone && (
                        <div>
                          <span className="text-sm text-muted-foreground">Telefone:</span>
                          <p className="font-medium">{turma.escola.telefone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Matriz Curricular */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Matriz Curricular
                </h3>
                {turma.matriz_curricular ? (
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm">
                      Matriz definida via importação ou atribuição manual
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma matriz curricular atribuída
                  </p>
                )}
              </div>

              <Separator />

              {/* Alunos */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Alunos
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">
                    Total de alunos: {turma.alunos?.[0]?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
