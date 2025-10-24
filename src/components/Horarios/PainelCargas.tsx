import { useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react";
import { TurmaComMatriz } from "@/hooks/useTurmasComMatriz";
import {
  CORES_COMPONENTES,
  calcularQuota,
  gerarSigla,
  type HorarioSlot,
  type Turma,
  TURNOS_TEMPOS,
} from "@/lib/horarios-utils";

interface PainelCargasProps {
  turma: Turma | null;
  turmaComMatriz: TurmaComMatriz | null | undefined;
  horarios: Record<string, HorarioSlot>;
}

export const PainelCargas = ({ turma, turmaComMatriz, horarios }: PainelCargasProps) => {
  if (!turma) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📊 Painel de Cargas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecione uma turma para visualizar as cargas
          </p>
        </CardContent>
      </Card>
    );
  }

  // Usar componentes da matriz se disponível, senão usar matriz_curricular (legado)
  const componentesMatriz = useMemo(() => {
    if (turmaComMatriz?.componentes) {
      return Object.entries(turmaComMatriz.componentes).sort(
        ([, a], [, b]) => a.ordem - b.ordem
      ) as Array<[string, { carga: number; ordem: number }]>;
    }
    return Object.entries(turma.matriz_curricular || {}).sort(([a], [b]) =>
      a.localeCompare(b)
    ) as Array<[string, number]>;
  }, [turma, turmaComMatriz]);

  const getProgressColor = (percentual: number): string => {
    if (percentual <= 70) return "bg-green-500";
    if (percentual <= 99) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">📊 Painel de Cargas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lista de Componentes */}
        <div className="space-y-3">
          {componentesMatriz.map(([componente, dados]) => {
            const total = typeof dados === "number" ? dados : dados.carga;
            const { atual, percentual } = calcularQuota(horarios, componente, total);
            const progressColor = getProgressColor(percentual);

            return (
              <div key={componente} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-medium">{componente}</span>
                  <span className="text-muted-foreground">
                    {atual}/{total}
                  </span>
                </div>
                <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full ${progressColor} transition-all`}
                    style={{ width: `${percentual}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Legenda */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-semibold">Legenda</h4>
          <div className="grid grid-cols-2 gap-2">
            {componentesMatriz.map(([componente, _dados]) => {
              const cor = CORES_COMPONENTES[componente] || "#95A5A6";
              const sigla = gerarSigla(componente);

              return (
                <div key={componente} className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: cor }}
                  />
                  <span className="text-xs">{sigla}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Informações da Turma */}
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-semibold">Informações</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turno:</span>
              <Badge variant="outline">{turma.turno}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tempos:</span>
              <span className="font-medium">
                {TURNOS_TEMPOS[turma.turno]?.length || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turma:</span>
              <span className="font-medium">
                {turma.grupo_ano} {turma.turma}
              </span>
            </div>
          </div>
        </div>

        {/* Informações da Matriz */}
        {turmaComMatriz?.matriz_id && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              <h4 className="text-sm font-semibold">Matriz Curricular</h4>
            </div>
            <div className="space-y-1 text-xs bg-muted/30 p-3 rounded-lg">
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Código:</span>
                <span className="font-mono font-medium">
                  {turmaComMatriz.matriz_codigo}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex flex-col gap-1">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium text-xs leading-tight">
                  {turmaComMatriz.matriz_nome}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total de horas:</span>
                <Badge variant="secondary" className="text-xs">
                  {turmaComMatriz.total_horas_semanais}h/semana
                </Badge>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default memo(PainelCargas);
