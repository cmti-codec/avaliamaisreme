import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";

interface EscolasAdminTableProps {
  escolas: any[];
  onEdit: (escola: any) => void;
}

export function EscolasAdminTable({ escolas, onEdit }: EscolasAdminTableProps) {
  if (escolas.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma escola encontrada
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Código INEP</TableHead>
            <TableHead>Código SAESC</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Localidade</TableHead>
            <TableHead>Região</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {escolas.map((escola) => (
            <TableRow key={escola.id}>
              <TableCell className="font-medium">{escola.nome}</TableCell>
              <TableCell>{escola.codigo_inep || "-"}</TableCell>
              <TableCell>{escola.codigo_saesc || "-"}</TableCell>
              <TableCell>{escola.tipo || "-"}</TableCell>
              <TableCell>{escola.localidade || "-"}</TableCell>
              <TableCell>{escola.regiao || "-"}</TableCell>
              <TableCell>
                {escola.ativa ? (
                  <Badge variant="default">Ativa</Badge>
                ) : (
                  <Badge variant="secondary">Inativa</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(escola)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
