import { StatusProfessor } from "@/hooks/useConselhoData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, BookOpen, ClipboardList } from "lucide-react";

interface Props {
  status: StatusProfessor[];
}

export function StatusProfessores({ status }: Props) {
  if (status.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Nenhum professor encontrado para esta turma.</p>;
  }

  // Agrupar por professor
  const porProfessor = new Map<string, StatusProfessor[]>();
  status.forEach(s => {
    const key = s.professor_id;
    if (!porProfessor.has(key)) porProfessor.set(key, []);
    porProfessor.get(key)!.push(s);
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from(porProfessor.entries()).map(([profId, items]) => {
        const nome = items[0].professor_nome;
        const todosFreq = items.every(i => i.tem_frequencias);
        const todosAval = items.every(i => i.tem_avaliacoes);
        const completo = todosFreq && todosAval;

        return (
          <Card key={profId} className={completo ? "border-green-200 bg-green-50/30" : "border-orange-200 bg-orange-50/30"}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm truncate">{nome}</h4>
                {completo ? (
                  <Badge variant="default" className="bg-green-600 text-xs">Completo</Badge>
                ) : (
                  <Badge variant="secondary" className="bg-orange-100 text-orange-700 text-xs">Pendente</Badge>
                )}
              </div>
              <div className="space-y-1">
                {items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground truncate mr-2">{item.componente}</span>
                    <div className="flex gap-2">
                      <span className="flex items-center gap-1">
                        <ClipboardList className="w-3 h-3" />
                        {item.tem_frequencias ? (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {item.tem_avaliacoes ? (
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                        ) : (
                          <XCircle className="w-3 h-3 text-red-500" />
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
