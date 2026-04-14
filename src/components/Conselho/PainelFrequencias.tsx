import { FrequenciaConsolidada } from "@/hooks/useConselhoData";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  dados: FrequenciaConsolidada[];
  componentes: string[];
}

function getFreqColor(pct: number) {
  if (pct >= 90) return "text-green-700 bg-green-50";
  if (pct >= 75) return "text-yellow-700 bg-yellow-50";
  return "text-red-700 bg-red-50";
}

export function PainelFrequencias({ dados, componentes }: Props) {
  if (dados.length === 0) {
    return <p className="text-muted-foreground text-center py-8">Nenhum dado de frequência encontrado para este bimestre.</p>;
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
                if (!d || d.total_aulas === 0) {
                  return <TableCell key={comp} className="text-center text-xs text-muted-foreground">—</TableCell>;
                }
                return (
                  <TableCell key={comp} className="text-center p-1">
                    <div className={cn("rounded px-2 py-1 text-xs font-medium", getFreqColor(d.percentual))}>
                      {d.percentual}%
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {d.presencas}P / {d.faltas}F
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
