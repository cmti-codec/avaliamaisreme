import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Aluno } from "@/hooks/useAlunos";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface AlunoViewDialogProps {
  aluno: Aluno | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const situacaoMap: Record<string, { label: string; variant: "default" | "destructive" | "secondary" }> = {
  FREQUENTE: { label: "Frequente", variant: "default" },
  CANCELADO: { label: "Cancelado", variant: "destructive" },
  TRANSFERIDO: { label: "Transferido", variant: "secondary" },
};

const turnoMap: Record<string, { label: string; color: string }> = {
  MATUTINO: { label: "Matutino", color: "bg-blue-500" },
  VESPERTINO: { label: "Vespertino", color: "bg-orange-500" },
  NOTURNO: { label: "Noturno", color: "bg-purple-500" },
  INTEGRAL: { label: "Integral", color: "bg-green-500" },
};

export const AlunoViewDialog = ({ aluno, open, onOpenChange }: AlunoViewDialogProps) => {
  if (!aluno) return null;

  const situacao = aluno.desoca || "FREQUENTE";
  const situacaoConfig = situacaoMap[situacao] || { label: situacao, variant: "secondary" as const };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detalhes do Aluno</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Pessoais */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Informações Pessoais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome Completo</p>
                <p className="font-medium text-foreground">{aluno.nomalu}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Código do aluno (SIGER)</p>
                <p className="font-medium text-foreground">{aluno.numalu}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Número na chamada</p>
                <p className="font-medium text-foreground">{aluno.nummtr || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Matrícula</p>
                <p className="font-medium text-foreground">
                  {aluno.datmtr
                    ? format(new Date(aluno.datmtr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Informações Acadêmicas */}
          <div>
            <h3 className="text-lg font-semibold mb-3 text-foreground">Informações Acadêmicas</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Escola</p>
                <p className="font-medium text-foreground">{aluno.escola?.nome || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Situação</p>
                <Badge variant={situacaoConfig.variant}>{situacaoConfig.label}</Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Etapa/Modalidade</p>
                <p className="font-medium text-foreground">{aluno.sigeta}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turma</p>
                <p className="font-medium text-foreground">
                  {aluno.turma ? `${aluno.turma.grupo_ano} ${aluno.trmcla}` : "Sem turma"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Turno</p>
                <div className="flex items-center gap-2 mt-1">
                  {aluno.sigtur && turnoMap[aluno.sigtur] && (
                    <>
                      <div className={`w-2 h-2 rounded-full ${turnoMap[aluno.sigtur].color}`} />
                      <span className="text-sm font-medium text-foreground">
                        {turnoMap[aluno.sigtur].label}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={aluno.ativo ? "default" : "secondary"}>
                  {aluno.ativo ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Informações Complementares */}
          {(aluno.sioca || aluno.dtomtrc) && (
            <div>
              <h3 className="text-lg font-semibold mb-3 text-foreground">Informações Complementares</h3>
              <div className="grid grid-cols-2 gap-4">
                {aluno.sioca && (
                  <div>
                    <p className="text-sm text-muted-foreground">Código SIOCA</p>
                    <p className="font-medium text-foreground">{aluno.sioca}</p>
                  </div>
                )}
                {aluno.dtomtrc && (
                  <div>
                    <p className="text-sm text-muted-foreground">Data Última Ocorrência</p>
                    <p className="font-medium text-foreground">
                      {format(new Date(aluno.dtomtrc), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
