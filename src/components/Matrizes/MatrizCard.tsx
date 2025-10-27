import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Pencil, Copy, Trash2, FileText } from "lucide-react";
import { MatrizComComponentes } from "@/hooks/useMatrizes";

interface MatrizCardProps {
  matriz: MatrizComComponentes;
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export const MatrizCard = ({
  matriz,
  onView,
  onEdit,
  onDuplicate,
  onDelete,
}: MatrizCardProps) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Ícone */}
          <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7 text-primary" />
          </div>

          {/* Conteúdo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                  {matriz.nome}
                </h3>
                <p className="text-sm text-muted-foreground font-mono">
                  {matriz.codigo}
                </p>
              </div>
              {matriz.ativa ? (
                <Badge className="bg-green-600 shrink-0">
                  ✅ Ativa
                </Badge>
              ) : (
                <Badge variant="secondary" className="shrink-0">
                  Inativa
                </Badge>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-3">
              {matriz.etapa_modalidade}
            </p>

            <div className="flex flex-wrap gap-2 mb-4">
              {matriz.grupo_ano.split(',').map((ano, idx) => (
                <Badge key={idx} variant="outline" className="gap-1">
                  {ano.trim()}
                </Badge>
              ))}
              {matriz.tipo_jornada && (
                <Badge variant="outline">
                  {matriz.tipo_jornada}
                </Badge>
              )}
              <Badge variant="secondary">
                {matriz.qtd_componentes} componentes
              </Badge>
              <Badge>
                {matriz.total_horas_semanais || 0}h/semana
              </Badge>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onView(matriz.id)}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                Ver
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(matriz.id)}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(matriz.id)}
                title="Duplicar"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(matriz.id)}
                title="Excluir"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
