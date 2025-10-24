import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  horarios: Record<string, HorarioSlot>;
}

export const PainelCargas = ({ turma, horarios }: PainelCargasProps) => {
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

  const componentesMatriz = Object.entries(turma.matriz_curricular || {}).sort(
    ([a], [b]) => a.localeCompare(b)
  );

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
          {componentesMatriz.map(([componente, total]) => {
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
            {componentesMatriz.map(([componente]) => {
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
      </CardContent>
    </Card>
  );
};
