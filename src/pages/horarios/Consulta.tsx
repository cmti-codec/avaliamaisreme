import { useState, useEffect, useMemo } from "react";
import { Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { gerarSigla, DIAS_SEMANA } from "@/lib/horarios-utils";

interface TurmaConsolidada {
  id: string;
  etapa_modalidade: string;
  grupo_ano: string;
  turma: string;
  turno: string;
  professores: string[];
  componentes: string[];
  horarios: any[];
}

interface ProfessorConsolidado {
  id: string;
  nome: string;
  turmas: string[];
  componentes: string[];
  cargaAlocada: number;
  cargaTotal: number;
}

const Consulta = () => {
  const { toast } = useToast();
  const [busca, setBusca] = useState("");
  const [turmasConsolidadas, setTurmasConsolidadas] = useState<TurmaConsolidada[]>([]);
  const [professoresConsolidados, setProfessoresConsolidados] = useState<ProfessorConsolidado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    setLoading(true);
    try {
      await Promise.all([carregarTurmas(), carregarProfessores()]);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const carregarTurmas = async () => {
    // Buscar turmas
    const { data: turmas, error: turmasError } = await supabase
      .from("turmas")
      .select("*")
      .eq("ativa", true)
      .order("segmento", { ascending: true })
      .order("grupo_ano", { ascending: true });

    if (turmasError) throw turmasError;

    // Buscar horários
    const { data: horarios, error: horariosError } = await supabase
      .from("horarios")
      .select(`
        *,
        professores (id, nome)
      `);

    if (horariosError) throw horariosError;

    // Consolidar dados
    const consolidadas: TurmaConsolidada[] = (turmas || []).map((turma) => {
      const horariosTurma = (horarios || []).filter((h) => h.turma_id === turma.id);
      
      const professoresSet = new Set<string>();
      const componentesSet = new Set<string>();

      horariosTurma.forEach((h) => {
        if (h.professores?.nome) professoresSet.add(h.professores.nome);
        if (h.componente_curricular) componentesSet.add(h.componente_curricular);
      });

      return {
        id: turma.id,
        etapa_modalidade: turma.etapa_modalidade,
        grupo_ano: turma.grupo_ano,
        turma: turma.turma,
        turno: turma.turno,
        professores: Array.from(professoresSet).sort(),
        componentes: Array.from(componentesSet).sort(),
        horarios: horariosTurma,
      };
    });

    setTurmasConsolidadas(consolidadas);
  };

  const carregarProfessores = async () => {
    // Buscar professores
    const { data: professores, error: professoresError } = await supabase
      .from("professores")
      .select("*")
      .eq("ativo", true)
      .order("nome", { ascending: true });

    if (professoresError) throw professoresError;

    // Buscar horários
    const { data: horarios, error: horariosError } = await supabase
      .from("horarios")
      .select(`
        *,
        turmas (etapa_modalidade, grupo_ano, turma, turno)
      `);

    if (horariosError) throw horariosError;

    // Consolidar dados
    const consolidados: ProfessorConsolidado[] = (professores || []).map((prof) => {
      const horariosProfessor = (horarios || []).filter((h) => h.professor_id === prof.id);
      
      const turmasSet = new Set<string>();
      const componentesSet = new Set<string>();

      horariosProfessor.forEach((h) => {
        if (h.turmas) {
          const turmaLabel = `${h.turmas.grupo_ano} ${h.turmas.turma}`;
          turmasSet.add(turmaLabel);
        }
        if (h.componente_curricular) componentesSet.add(h.componente_curricular);
      });

      return {
        id: prof.id,
        nome: prof.nome,
        turmas: Array.from(turmasSet).sort(),
        componentes: Array.from(componentesSet).sort(),
        cargaAlocada: horariosProfessor.length,
        cargaTotal: prof.carga_horaria_contratual,
      };
    });

    setProfessoresConsolidados(consolidados);
  };

  const gerarHorarioResumido = (horarios: any[]): string => {
    const resumo: Record<string, string[]> = {};

    horarios.forEach((h) => {
      const dia = h.dia_semana.substring(0, 3); // Seg, Ter, etc
      const sigla = gerarSigla(h.componente_curricular);

      if (!resumo[dia]) {
        resumo[dia] = [];
      }
      if (!resumo[dia].includes(sigla)) {
        resumo[dia].push(sigla);
      }
    });

    return Object.entries(resumo)
      .map(([dia, siglas]) => `${dia}: ${siglas.join(", ")}`)
      .join(" | ");
  };

  const exportarJSON = () => {
    const dados = {
      metadata: {
        escola: "Escola Municipal", // TODO: pegar da sessão
        gerado_em: new Date().toISOString(),
        total_turmas: turmasConsolidadas.length,
        total_professores: professoresConsolidados.length,
      },
      turmas: turmasConsolidadas.map((t) => {
        const horariosPorDia: Record<string, any> = {};

        DIAS_SEMANA.forEach((dia) => {
          const horariosdia = t.horarios.filter((h) => h.dia_semana === dia);
          horariosPorDia[dia] = horariosdia.reduce((acc: any, h: any) => {
            acc[`tempo_${h.tempo}`] = {
              componente: h.componente_curricular,
              professor: h.professores?.nome || "Não alocado",
            };
            return acc;
          }, {});
        });

        return {
          id: t.id,
          identificacao: `${t.etapa_modalidade} - ${t.grupo_ano} ${t.turma}`,
          turno: t.turno,
          professores: t.professores,
          componentes: t.componentes,
          horarios: horariosPorDia,
        };
      }),
      professores: professoresConsolidados.map((p) => ({
        id: p.id,
        nome: p.nome,
        turmas: p.turmas,
        componentes: p.componentes,
        carga: {
          alocada: p.cargaAlocada,
          total: p.cargaTotal,
          percentual: ((p.cargaAlocada / p.cargaTotal) * 100).toFixed(1) + "%",
        },
      })),
    };

    const blob = new Blob([JSON.stringify(dados, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `horarios_consolidados_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exportação concluída",
      description: "Arquivo JSON baixado com sucesso",
    });
  };

  const turmasFiltradas = useMemo(() => {
    if (!busca) return turmasConsolidadas;
    const termo = busca.toLowerCase();
    return turmasConsolidadas.filter(
      (t) =>
        t.etapa_modalidade.toLowerCase().includes(termo) ||
        t.grupo_ano.toLowerCase().includes(termo) ||
        t.turma.toLowerCase().includes(termo) ||
        t.turno.toLowerCase().includes(termo) ||
        t.professores.some((p) => p.toLowerCase().includes(termo)) ||
        t.componentes.some((c) => c.toLowerCase().includes(termo))
    );
  }, [turmasConsolidadas, busca]);

  const professoresFiltrados = useMemo(() => {
    if (!busca) return professoresConsolidados;
    const termo = busca.toLowerCase();
    return professoresConsolidados.filter(
      (p) =>
        p.nome.toLowerCase().includes(termo) ||
        p.turmas.some((t) => t.toLowerCase().includes(termo)) ||
        p.componentes.some((c) => c.toLowerCase().includes(termo))
    );
  }, [professoresConsolidados, busca]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">Horários Consolidados</h1>
        <Button onClick={exportarJSON}>
          <Download className="h-4 w-4 mr-2" />
          Exportar JSON
        </Button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar turmas, professores, componentes..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="turmas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="turmas">
            Turmas ({turmasFiltradas.length})
          </TabsTrigger>
          <TabsTrigger value="professores">
            Professores ({professoresFiltrados.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab Turmas */}
        <TabsContent value="turmas">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Turma</TableHead>
                  <TableHead>Turno</TableHead>
                  <TableHead>Professores</TableHead>
                  <TableHead>Componentes</TableHead>
                  <TableHead>Horário Resumido</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {turmasFiltradas.map((turma) => (
                  <TableRow key={turma.id}>
                    <TableCell className="font-medium">
                      {turma.etapa_modalidade} - {turma.grupo_ano} {turma.turma}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{turma.turno}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {turma.professores.map((prof, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {prof}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {turma.componentes.map((comp, idx) => (
                          <Badge key={idx} className="text-xs">
                            {gerarSigla(comp)}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {gerarHorarioResumido(turma.horarios)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Tab Professores */}
        <TabsContent value="professores">
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Professor</TableHead>
                  <TableHead>Turmas</TableHead>
                  <TableHead>Componentes</TableHead>
                  <TableHead>Carga Alocada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {professoresFiltrados.map((professor) => {
                  const percentual = (professor.cargaAlocada / professor.cargaTotal) * 100;
                  const corCarga =
                    percentual >= 100
                      ? "text-red-600"
                      : percentual >= 80
                      ? "text-yellow-600"
                      : "text-green-600";

                  return (
                    <TableRow key={professor.id}>
                      <TableCell className="font-medium">{professor.nome}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {professor.turmas.map((turma, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {turma}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {professor.componentes.map((comp, idx) => (
                            <Badge key={idx} className="text-xs">
                              {gerarSigla(comp)}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`font-medium ${corCarga}`}>
                          {professor.cargaAlocada}/{professor.cargaTotal}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({percentual.toFixed(0)}%)
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Consulta;
