import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, BarChart3, Search, AlertTriangle, CheckCircle } from "lucide-react";
import { useEscolas } from "@/hooks/useEscolas";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EscolasMatrizesTableProps {
  onEdit: (id: string) => void;
}

export const EscolasMatrizesTable = ({ onEdit }: EscolasMatrizesTableProps) => {
  const { data: escolas, isLoading } = useEscolas();
  const [search, setSearch] = useState("");
  const [matrizFilter, setMatrizFilter] = useState<string>("all");

  const filteredEscolas = useMemo(() => {
    if (!escolas) return [];

    return escolas.filter((escola) => {
      const matchSearch =
        search === "" ||
        escola.nome.toLowerCase().includes(search.toLowerCase()) ||
        escola.codigo_inep?.toLowerCase().includes(search.toLowerCase());

      const matchMatriz =
        matrizFilter === "all" ||
        (matrizFilter === "com" && escola.matrizes && escola.matrizes.length > 0) ||
        (matrizFilter === "sem" && (!escola.matrizes || escola.matrizes.length === 0));

      return matchSearch && matchMatriz;
    });
  }, [escolas, search, matrizFilter]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-[400px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome da escola ou código INEP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={matrizFilter} onValueChange={setMatrizFilter}>
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Filtrar por matriz" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="com">Com Matriz</SelectItem>
              <SelectItem value="sem">Sem Matriz</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Total de Escolas</div>
              <div className="text-2xl font-bold">{escolas?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Com Matriz</div>
              <div className="text-2xl font-bold text-green-600">
                {escolas?.filter((e) => e.matrizes && e.matrizes.length > 0).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm text-muted-foreground">Sem Matriz</div>
              <div className="text-2xl font-bold text-amber-600">
                {escolas?.filter((e) => !e.matrizes || e.matrizes.length === 0).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela */}
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola</TableHead>
                <TableHead>Código INEP</TableHead>
                <TableHead>Localidade</TableHead>
                <TableHead>Matriz Atual</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEscolas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    Nenhuma escola encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredEscolas.map((escola) => (
                  <TableRow key={escola.id}>
                    <TableCell className="font-medium">
                      {escola.nome}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {escola.codigo_inep || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {escola.endereco || "-"}
                    </TableCell>
                    <TableCell className="max-w-[300px]">
                      {escola.matrizes && escola.matrizes.length > 0 ? (
                        <div className="space-y-1">
                          {escola.matrizes.map((matriz, idx) => (
                            <div key={matriz.id} className="flex items-center gap-2">
                              <div className="font-mono text-xs text-muted-foreground">
                                {matriz.codigo}
                              </div>
                              <div className="text-sm truncate" title={matriz.nome}>
                                {matriz.nome}
                              </div>
                              {matriz.tipo_jornada && (
                                <Badge variant="outline" className="text-xs">
                                  {matriz.tipo_jornada}
                                </Badge>
                              )}
                            </div>
                          ))}
                          {escola.matrizes.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {escola.matrizes.length} matrizes
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {escola.matrizes && escola.matrizes.length > 0 ? (
                        <Badge variant="default" className="bg-green-600 gap-1.5">
                          <CheckCircle className="w-3 h-3" />
                          Configurada
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 gap-1.5">
                          <AlertTriangle className="w-3 h-3" />
                          Sem Matriz
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(escola.id)}
                          title="Atribuir/Alterar Matriz"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Ver Detalhes"
                          disabled
                        >
                          <BarChart3 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
