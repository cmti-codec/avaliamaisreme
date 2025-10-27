import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MatrizComComponentes } from "@/hooks/useMatrizes";

interface MatrizPreviewProps {
  matriz: MatrizComComponentes;
}

export const MatrizPreview = ({ matriz }: MatrizPreviewProps) => {
  // Agrupar componentes por ano
  const componentesPorAno = matriz.componentes.reduce((acc, comp) => {
    if (!acc[comp.grupo_ano]) {
      acc[comp.grupo_ano] = [];
    }
    acc[comp.grupo_ano].push(comp);
    return acc;
  }, {} as Record<string, typeof matriz.componentes>);

  const anos = Object.keys(componentesPorAno).sort();

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>📚 Componentes da Matriz Selecionada</span>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {anos.length} {anos.length === 1 ? "ano" : "anos"}
            </Badge>
            <Badge variant="secondary">
              {matriz.componentes.length} componentes
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anos.map((ano) => {
          const componentesDoAno = componentesPorAno[ano].sort((a, b) => a.ordem - b.ordem);
          const totalHorasAno = componentesDoAno.reduce(
            (sum, c) => sum + c.carga_horaria_semanal,
            0
          );

          return (
            <div key={ano} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-sm">{ano}</h4>
                <Badge variant="outline" className="text-xs">
                  {componentesDoAno.length} componentes • {totalHorasAno}h/semana
                </Badge>
              </div>
              
              <div className="space-y-1 pl-3 border-l-2">
                {componentesDoAno.map((comp) => (
                  <div
                    key={comp.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded bg-muted/30 text-sm"
                  >
                    <span className="font-medium">{comp.componente_nome}</span>
                    <span className="text-muted-foreground">
                      {comp.carga_horaria_semanal}h
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
