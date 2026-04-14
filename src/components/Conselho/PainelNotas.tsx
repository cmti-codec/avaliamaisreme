import { NotaConsolidada } from "@/hooks/useConselhoData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Props {
  dados: NotaConsolidada[];
  componentes: string[];
}

function getNotaColor(media: number | null) {
  if (media === null) return "text-muted-foreground";
  if (media >= 7) return "text-green-700 bg-green-50";
  if (media >= 5) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

export function PainelNotas({ dados, componentes }: Props) {
  if (dados.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Nenhum dado de avaliação encontrado para este bimestre.</p>;
  }

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky left-0 bg-background z-10 min-w-[200px]">Aluno</TableHead>
            {componentes.map(c => (
              <TableHead key={c} className="text-center min-w-[120px]">
                <span className="text-xs">{c}</span>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {dados.map(aluno => (
            <TableRow key={aluno.aluno_id}>
              <TableCell className="sticky left-0 bg-background z-10 font-medium text-sm">
                {aluno.aluno_nome}
              </TableCell>
              {componentes.map(comp => {
                const d = aluno.componentes[comp];
                if (!d || d.avaliacoes.length === 0) {
                  return <TableCell key={comp} className="text-center text-xs text-muted-foreground">—</TableCell>;
                }
                return (
                  <TableCell key={comp} className="text-center p-1">
                    <div className={cn("rounded px-2 py-1 text-xs font-medium", getNotaColor(d.media))}>
                      {d.media !== null ? d.media.toFixed(1) : "—"}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {d.avaliacoes.length} aval.
                    </span>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
