import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MatrizComComponentes } from "@/hooks/useMatrizes";

interface MatrizPreviewProps {
  matriz: MatrizComComponentes;
}

export const MatrizPreview = ({ matriz }: MatrizPreviewProps) => {
  const totalHoras = matriz.componentes.reduce(
    (sum, c) => sum + c.carga_horaria_semanal,
    0
  );

  return (
    <Card className="border-2">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>📚 Componentes da Matriz Selecionada</span>
          <Badge variant="secondary">
            {matriz.componentes.length}{" "}
            {matriz.componentes.length === 1 ? "componente" : "componentes"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Lista de Componentes */}
        <div className="space-y-2">
          {matriz.componentes
            .sort((a, b) => a.ordem - b.ordem)
            .map((comp) => (
              <div
                key={comp.id}
                className="flex items-center justify-between py-2 px-3 rounded bg-muted/30"
              >
                <span className="font-medium text-sm">{comp.componente_nome}</span>
                <span className="text-sm text-muted-foreground">
                  {comp.carga_horaria_semanal}h/semana
                </span>
              </div>
            ))}
        </div>

        {/* Total */}
        <Separator />
        <div className="flex items-center justify-between py-2 px-3 bg-primary/5 rounded">
          <span className="font-bold">TOTAL:</span>
          <Badge className="text-base px-3 py-1">
            {totalHoras}h/semana
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
