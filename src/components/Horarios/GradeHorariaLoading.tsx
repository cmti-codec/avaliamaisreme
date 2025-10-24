import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DIAS_SEMANA } from "@/lib/horarios-utils";

interface GradeHorariaLoadingProps {
  tempos: number;
}

export const GradeHorariaLoading = ({ tempos }: GradeHorariaLoadingProps) => {
  const tempArray = Array.from({ length: tempos }, (_, i) => i + 1);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Tempo</TableHead>
            {DIAS_SEMANA.map((dia) => (
              <TableHead key={dia} className="text-center">
                {dia}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {tempArray.map((tempo) => (
            <TableRow key={tempo}>
              <TableCell className="font-medium text-center">{tempo}º</TableCell>
              {DIAS_SEMANA.map((dia) => (
                <TableCell key={`${dia}_${tempo}`} className="p-2">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
