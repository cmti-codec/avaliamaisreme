import { useState, useMemo } from "react";
import { Aluno } from "@/hooks/useAlunos";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, School, Eye } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AlunosTableProps {
  alunos: Aluno[];
  isLoading: boolean;
  isAdmin: boolean;
  onViewAluno: (aluno: Aluno) => void;
}

const turnoMap: Record<string, { label: string; color: string }> = {
  MATUTINO: { label: "Matutino", color: "bg-blue-500" },
  VESPERTINO: { label: "Vespertino", color: "bg-orange-500" },
  NOTURNO: { label: "Noturno", color: "bg-purple-500" },
  INTEGRAL: { label: "Integral", color: "bg-green-500" },
};

export const AlunosTable = ({ alunos, isLoading, isAdmin, onViewAluno }: AlunosTableProps) => {
  const [search, setSearch] = useState("");
  const [selectedEscola, setSelectedEscola] = useState<string>("all");
  const [selectedTurma, setSelectedTurma] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Estatísticas
  const stats = useMemo(() => {
    const total = alunos.length;
    const ensalados = alunos.filter((a) => a.turma_id).length;
    const semTurma = total - ensalados;
    return { total, ensalados, semTurma };
  }, [alunos]);

  // Lista de escolas únicas (se admin)
  const escolas = useMemo(() => {
    if (!isAdmin) return [];
    const uniqueEscolas = Array.from(
      new Map(alunos.map((a) => [a.saesc, a.escola])).values()
    ).filter((e): e is NonNullable<typeof e> => e !== null && e !== undefined);
    return uniqueEscolas.sort((a, b) => a.nome.localeCompare(b.nome));
  }, [alunos, isAdmin]);

  // Lista de turmas únicas
  const turmas = useMemo(() => {
    const uniqueTurmas = Array.from(
      new Map(alunos.map((a) => [a.turma_id, a.turma])).values()
    ).filter((t): t is NonNullable<typeof t> => t !== null && t !== undefined);
    return uniqueTurmas.sort((a, b) => a.grupo_ano.localeCompare(b.grupo_ano));
  }, [alunos]);

  // Filtragem
  const filteredAlunos = useMemo(() => {
    return alunos.filter((aluno) => {
      // Filtro de busca
      const searchLower = search.toLowerCase();
      const matchesSearch =
        !search ||
        aluno.nomalu.toLowerCase().includes(searchLower) ||
        aluno.numalu.toLowerCase().includes(searchLower) ||
        (aluno.nummtr && aluno.nummtr.toLowerCase().includes(searchLower));

      // Filtro de escola
      const matchesEscola = selectedEscola === "all" || aluno.saesc === selectedEscola;

      // Filtro de turma
      const matchesTurma = selectedTurma === "all" || aluno.turma_id === selectedTurma;

      // Filtro de status
      let matchesStatus = true;
      if (selectedStatus === "frequentes") matchesStatus = aluno.desoca === "FREQUENTE" || !aluno.desoca;
      else if (selectedStatus === "cancelados") matchesStatus = aluno.desoca === "CANCELADO";
      else if (selectedStatus === "inativos") matchesStatus = !aluno.ativo;

      return matchesSearch && matchesEscola && matchesTurma && matchesStatus;
    });
  }, [alunos, search, selectedEscola, selectedTurma, selectedStatus]);

  // Agrupamento por escola
  const alunosPorEscola = useMemo(() => {
    const groups = new Map<string, { escola: NonNullable<Aluno["escola"]>; alunos: Aluno[] }>();

    filteredAlunos.forEach((aluno) => {
      if (!aluno.escola) return;
      const escolaId = aluno.saesc;
      if (!groups.has(escolaId)) {
        groups.set(escolaId, { escola: aluno.escola, alunos: [] });
      }
      groups.get(escolaId)!.alunos.push(aluno);
    });

    return Array.from(groups.values()).sort((a, b) => a.escola.nome.localeCompare(b.escola.nome));
  }, [filteredAlunos]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <GraduationCap className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Alunos</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <School className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ensalados</p>
                <p className="text-2xl font-bold text-foreground">{stats.ensalados}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-orange-500/10">
                <GraduationCap className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sem Turma</p>
                <p className="text-2xl font-bold text-foreground">{stats.semTurma}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-4 md:grid-cols-4">
            <Input
              placeholder="Buscar aluno..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {isAdmin && (
              <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={selectedTurma} onValueChange={setSelectedTurma}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as turmas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as turmas</SelectItem>
                {turmas.map((turma) => (
                  <SelectItem key={turma.id} value={turma.id}>
                    {turma.grupo_ano} {turma.turma}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="frequentes">Frequentes</SelectItem>
                <SelectItem value="cancelados">Cancelados</SelectItem>
                <SelectItem value="inativos">Inativos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista Agrupada por Escola */}
      <div className="space-y-6">
        {alunosPorEscola.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">Nenhum aluno encontrado</p>
            </CardContent>
          </Card>
        ) : (
          alunosPorEscola.map(({ escola, alunos: alunosEscola }) => (
            <Card key={escola.id}>
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                  <School className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">{escola.nome}</h3>
                  <Badge variant="secondary">{alunosEscola.length} alunos</Badge>
                </div>

                <div className="space-y-2">
                  {alunosEscola.map((aluno) => (
                    <div
                      key={aluno.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <GraduationCap className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{aluno.nomalu}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Matrícula: {aluno.numalu}</span>
                            {aluno.nummtr && <span>Chamada: {aluno.nummtr}</span>}
                          </div>
                        </div>
                        {aluno.turma ? (
                          <Badge variant="outline" className="gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                turnoMap[aluno.sigtur]?.color || "bg-gray-500"
                              }`}
                            />
                            {aluno.turma.grupo_ano} {aluno.trmcla} -{" "}
                            {turnoMap[aluno.sigtur]?.label || aluno.sigtur}
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Sem turma</Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewAluno(aluno)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
