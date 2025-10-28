import { useState, useMemo } from "react";
import { useTurmas } from "@/hooks/useTurmas";
import { Card } from "@/components/ui/card";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Filter, Search } from "lucide-react";

interface TurmasTableProps {
  onView: (id: string) => void;
}

const getTurnoBadge = (turno: string | null) => {
  const turnoMap: Record<string, { label: string; className: string }> = {
    MATUTINO: { label: "Matutino", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    VESPERTINO: { label: "Vespertino", className: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" },
    NOTURNO: { label: "Noturno", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    INTEGRAL: { label: "Integral", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  };
  
  return turnoMap[turno || ""] || { label: "-", className: "bg-muted text-muted-foreground" };
};

export const TurmasTable = ({ onView }: TurmasTableProps) => {
  const { data: turmas, isLoading } = useTurmas();
  const [searchTerm, setSearchTerm] = useState("");
  const [turnoFilter, setTurnoFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const escolasDisponiveis = useMemo(() => {
    if (!turmas) return [];
    const uniqueEscolas = new Map();
    turmas.forEach((t) => {
      if (t.escola) {
        uniqueEscolas.set(t.escola.id, t.escola);
      }
    });
    return Array.from(uniqueEscolas.values());
  }, [turmas]);

  const [escolaFilter, setEscolaFilter] = useState<string>("all");

  const filteredTurmas = useMemo(() => {
    if (!turmas) return [];
    
    return turmas.filter((turma) => {
      const matchesSearch = 
        turma.turma.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.segmento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        turma.escola?.nome.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesTurno = turnoFilter === "all" || turma.turno === turnoFilter;
      const matchesStatus = statusFilter === "all" || 
        (statusFilter === "ativa" && turma.ativa) || 
        (statusFilter === "inativa" && !turma.ativa);
      const matchesEscola = escolaFilter === "all" || turma.escola_id === escolaFilter;

      return matchesSearch && matchesTurno && matchesStatus && matchesEscola;
    });
  }, [turmas, searchTerm, turnoFilter, statusFilter, escolaFilter]);

  const stats = useMemo(() => {
    if (!turmas) return { total: 0, ativas: 0, porTurno: {} };
    
    const porTurno: Record<string, number> = {};
    let ativas = 0;
    
    turmas.forEach((t) => {
      if (t.ativa) ativas++;
      const turno = t.turno || "SEM_TURNO";
      porTurno[turno] = (porTurno[turno] || 0) + 1;
    });
    
    return {
      total: turmas.length,
      ativas,
      porTurno,
    };
  }, [turmas]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total de Turmas</div>
          <div className="text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Turmas Ativas</div>
          <div className="text-2xl font-bold">{stats.ativas}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Matutino</div>
          <div className="text-2xl font-bold">{stats.porTurno.MATUTINO || 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Vespertino</div>
          <div className="text-2xl font-bold">{stats.porTurno.VESPERTINO || 0}</div>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por turma, segmento ou escola..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={escolaFilter} onValueChange={setEscolaFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Escola" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Escolas</SelectItem>
              {escolasDisponiveis.map((escola) => (
                <SelectItem key={escola.id} value={escola.id}>
                  {escola.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={turnoFilter} onValueChange={setTurnoFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Turno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Turnos</SelectItem>
              <SelectItem value="MATUTINO">Matutino</SelectItem>
              <SelectItem value="VESPERTINO">Vespertino</SelectItem>
              <SelectItem value="NOTURNO">Noturno</SelectItem>
              <SelectItem value="INTEGRAL">Integral</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativa">Ativas</SelectItem>
              <SelectItem value="inativa">Inativas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Tabela */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Escola</TableHead>
                <TableHead>Grupo/Ano</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Turno</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTurmas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    Nenhuma turma encontrada
                  </TableCell>
                </TableRow>
              ) : (
                filteredTurmas.map((turma) => {
                  const turnoBadge = getTurnoBadge(turma.turno);
                  
                  return (
                    <TableRow key={turma.id}>
                      <TableCell>{turma.escola?.nome || "-"}</TableCell>
                      <TableCell>{turma.grupo_ano}</TableCell>
                      <TableCell className="font-medium">{turma.turma}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={turnoBadge.className}>
                          {turnoBadge.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={turma.ativa ? "default" : "secondary"}>
                          {turma.ativa ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onView(turma.id)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};
