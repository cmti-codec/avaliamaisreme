import { useSchool } from '@/contexts/SchoolContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface MinhasLotacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MinhasLotacoesDialog({ open, onOpenChange }: MinhasLotacoesDialogProps) {
  const { todasLotacoes } = useSchool();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Minhas Lotações</DialogTitle>
          <DialogDescription>
            Todas as suas lotações ativas no sistema
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Carga Horária</TableHead>
                <TableHead>Data de Início</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todasLotacoes.map((lotacao) => (
                <TableRow key={lotacao.lotacao_id}>
                  <TableCell className="font-medium">
                    {lotacao.escola_nome}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{lotacao.perfil}</Badge>
                  </TableCell>
                  <TableCell>
                    {lotacao.perfil === 'PROFESSOR' && lotacao.carga_horaria
                      ? `${lotacao.carga_horaria}h/semana`
                      : '—'}
                  </TableCell>
                  <TableCell>
                    {format(new Date(lotacao.data_inicio), 'dd/MM/yyyy', {
                      locale: ptBR,
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
