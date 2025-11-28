import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, BookOpen, Users, AlertCircle, Lock, Save, ClipboardList, Trash2, Plus, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useDiariosComHorarios, useAlunosDaTurma, type DiarioComHorarios } from "@/hooks/useDiariosClasse";
import { useFrequenciasDaAula, useSalvarFrequencias, type FrequenciaInput } from "@/hooks/useFrequencias";
import { useAvaliacoesAgrupadasPorTitulo, useSalvarAvaliacoes, useDeletarAvaliacoesPorTitulo, type AvaliacaoInput } from "@/hooks/useAvaliacoes";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { InfoTurmasIntegrais } from "@/components/DiarioClasse/InfoTurmasIntegrais";
import { useSchool } from "@/contexts/SchoolContext";
import { useAnosLetivos } from "@/hooks/useAnosLetivos";
import { 
  isDiaLetivo, 
  getBimestreAtual, 
  isEdicaoBloqueadaPorConselho,
  getBimestresDoAno
} from "@/lib/calendario-utils";
import { toast } from "sonner";
import { exportarDiarioParaImpressao } from "@/lib/exportar-diario-pdf";
import { exportarDiarioOficialPDF } from "@/lib/exportar-diario-oficial-pdf";
import { supabase } from "@/integrations/supabase/client";

const DiarioClasse = () => {
  const [diarioSelecionado, setDiarioSelecionado] = useState<DiarioComHorarios | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [bimestreSelecionado, setBimestreSelecionado] = useState<string>("");
  const [bimestres, setBimestres] = useState<Array<{ id: string; numero: number; data_inicio: string; data_fim: string }>>([]);
  const [ehDiaLetivo, setEhDiaLetivo] = useState<boolean>(true);
  const [edicaoBloqueada, setEdicaoBloqueada] = useState<{ bloqueado: boolean; conselho?: any }>({ bloqueado: false });
  const [validandoData, setValidandoData] = useState(false);
  const [tempoSelecionado, setTempoSelecionado] = useState<number | null>(null);
  const [frequenciasLocais, setFrequenciasLocais] = useState<Record<string, boolean>>({});
  const [tabAtiva, setTabAtiva] = useState<string>("frequencias");
  
  // Estados para Avaliações
  const [novaAvaliacao, setNovaAvaliacao] = useState({
    titulo: "",
    tipo: "PROVA",
    data: format(new Date(), "yyyy-MM-dd"),
    notaMaxima: 10,
  });
  const [avaliacaoSelecionada, setAvaliacaoSelecionada] = useState<any>(null);
  const [notasLocais, setNotasLocais] = useState<Record<string, number | null>>({});

  const { escolaAtual } = useSchool();
  const { data: anosLetivos } = useAnosLetivos();
  const anoLetivoAtivo = anosLetivos?.find(ano => ano.ativo);

  const { data: diarios, isLoading: loadingDiarios } = useDiariosComHorarios();
  const { data: alunos, isLoading: loadingAlunos } = useAlunosDaTurma(
    diarioSelecionado?.turma_id || null
  );
  const { data: frequenciasExistentes, isLoading: loadingFrequencias } = useFrequenciasDaAula(
    diarioSelecionado?.id || null,
    dataSelecionada ? format(dataSelecionada, "yyyy-MM-dd") : null,
    tempoSelecionado
  );
  const { mutate: salvarFrequencias, isPending: salvandoFrequencias } = useSalvarFrequencias();
  const { data: avaliacoesAgrupadas, isLoading: loadingAvaliacoes } = useAvaliacoesAgrupadasPorTitulo(diarioSelecionado?.id || null);
  const { mutate: salvarAvaliacoes, isPending: salvandoAvaliacoes } = useSalvarAvaliacoes();
  const { mutate: deletarAvaliacoes } = useDeletarAvaliacoesPorTitulo();

  // Carregar bimestres quando o ano letivo estiver disponível
  useEffect(() => {
    if (anoLetivoAtivo?.id) {
      getBimestresDoAno(anoLetivoAtivo.id).then(setBimestres);
    }
  }, [anoLetivoAtivo]);

  // Validar data selecionada
  useEffect(() => {
    const validarData = async () => {
      if (!escolaAtual?.saesc) return;
      
      setValidandoData(true);
      
      // Verificar se é dia letivo
      const letivo = await isDiaLetivo(dataSelecionada, escolaAtual.saesc);
      setEhDiaLetivo(letivo);
      
      if (!letivo) {
        toast.warning("Atenção: Data selecionada não é dia letivo", {
          description: "Pode ser feriado, fim de semana ou evento institucional que bloqueia.",
        });
      }
      
      // Verificar se edição está bloqueada por conselho
      const bimestreAtual = await getBimestreAtual(escolaAtual.saesc, anoLetivoAtivo?.id, dataSelecionada);
      if (bimestreAtual) {
        const bloqueio = await isEdicaoBloqueadaPorConselho(
          dataSelecionada, 
          escolaAtual.saesc, 
          bimestreAtual.id
        );
        setEdicaoBloqueada(bloqueio);
        
        if (bloqueio.bloqueado && bloqueio.conselho) {
          toast.error("Edição bloqueada", {
            description: `Conselho de classe realizado em ${format(new Date(bloqueio.conselho.data), "dd/MM/yyyy")}. Não é possível editar avaliações deste período.`,
          });
        }
      }
      
      setValidandoData(false);
    };
    
    validarData();
  }, [dataSelecionada, escolaAtual?.saesc, anoLetivoAtivo?.id]);

  const handleDiarioChange = (diarioId: string) => {
    const diario = diarios?.find((d) => d.id === diarioId);
    setDiarioSelecionado(diario || null);
    setTempoSelecionado(null);
    setFrequenciasLocais({});
    setAvaliacaoSelecionada(null);
    setNotasLocais({});
  };

  // Carregar frequências existentes no estado local
  useEffect(() => {
    if (frequenciasExistentes && alunos) {
      const frequenciasMap: Record<string, boolean> = {};
      frequenciasExistentes.forEach((freq) => {
        frequenciasMap[freq.aluno_id] = freq.presente;
      });
      setFrequenciasLocais(frequenciasMap);
    }
  }, [frequenciasExistentes, alunos]);

  const handleCheckboxChange = (alunoId: string, checked: boolean) => {
    setFrequenciasLocais((prev) => ({
      ...prev,
      [alunoId]: checked,
    }));
  };

  const handleSalvarFrequencias = () => {
    if (!diarioSelecionado || !tempoSelecionado || !alunos) {
      toast.error("Selecione um diário, data e tempo antes de salvar");
      return;
    }

    const frequenciasParaSalvar: FrequenciaInput[] = alunos.map((aluno) => ({
      diario_id: diarioSelecionado.id,
      aluno_id: aluno.id,
      data_aula: format(dataSelecionada, "yyyy-MM-dd"),
      tempo: tempoSelecionado,
      presente: frequenciasLocais[aluno.id] ?? true,
    }));

    salvarFrequencias(frequenciasParaSalvar);
  };

  const handleCriarAvaliacao = () => {
    if (!diarioSelecionado || !alunos) {
      toast.error("Selecione um diário antes de criar avaliação");
      return;
    }
    if (!novaAvaliacao.titulo.trim()) {
      toast.error("Preencha o título da avaliação");
      return;
    }

    const avaliacoesParaSalvar: AvaliacaoInput[] = alunos.map((aluno) => ({
      diario_id: diarioSelecionado.id,
      aluno_id: aluno.id,
      tipo_avaliacao: novaAvaliacao.tipo,
      titulo: novaAvaliacao.titulo,
      data_avaliacao: novaAvaliacao.data,
      nota: null,
      nota_maxima: novaAvaliacao.notaMaxima,
    }));

    salvarAvaliacoes(avaliacoesParaSalvar, {
      onSuccess: () => {
        setNovaAvaliacao({
          titulo: "",
          tipo: "PROVA",
          data: format(new Date(), "yyyy-MM-dd"),
          notaMaxima: 10,
        });
      },
    });
  };

  const handleSalvarNotas = () => {
    if (!diarioSelecionado || !avaliacaoSelecionada || !alunos) {
      toast.error("Selecione uma avaliação antes de salvar");
      return;
    }

    const avaliacoesParaSalvar: AvaliacaoInput[] = avaliacaoSelecionada.avaliacoes.map((av: any) => ({
      diario_id: diarioSelecionado.id,
      aluno_id: av.aluno_id,
      tipo_avaliacao: avaliacaoSelecionada.tipo_avaliacao,
      titulo: avaliacaoSelecionada.titulo,
      data_avaliacao: avaliacaoSelecionada.data_avaliacao,
      nota: notasLocais[av.aluno_id] !== undefined ? notasLocais[av.aluno_id] : av.nota,
      nota_maxima: avaliacaoSelecionada.nota_maxima,
    }));

    salvarAvaliacoes(avaliacoesParaSalvar);
  };

  const handleDeletarAvaliacao = (grupo: any) => {
    if (confirm(`Deseja realmente deletar a avaliação "${grupo.titulo}"?`)) {
      deletarAvaliacoes({
        diario_id: diarioSelecionado!.id,
        titulo: grupo.titulo,
        data_avaliacao: grupo.data_avaliacao,
      });
    }
  };

  const handleExportarPDF = async () => {
    if (!diarioSelecionado || !bimestreSelecionado || !alunos) {
      toast.error("Selecione um diário e um bimestre antes de exportar");
      return;
    }

    const bimestre = bimestres.find(b => b.id === bimestreSelecionado);
    if (!bimestre) return;

    try {
      // Buscar dados do professor
      const { data: professor } = await supabase
        .from("professores")
        .select("nome")
        .eq("id", diarioSelecionado.professor_id)
        .single();

      // Buscar todas as frequências do bimestre
      const { data: frequenciasData } = await supabase
        .from("frequencias")
        .select("*")
        .eq("diario_id", diarioSelecionado.id)
        .gte("data_aula", bimestre.data_inicio)
        .lte("data_aula", bimestre.data_fim)
        .order("data_aula")
        .order("tempo");

      // Buscar todas as avaliações do bimestre
      const { data: avaliacoesData } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("diario_id", diarioSelecionado.id)
        .gte("data_avaliacao", bimestre.data_inicio)
        .lte("data_avaliacao", bimestre.data_fim)
        .order("data_avaliacao");

      // Processar dados de frequências por aluno
      const alunosFrequencia = alunos.map(aluno => {
        const frequenciasAluno = frequenciasData?.filter(f => f.aluno_id === aluno.id) || [];
        const totalPresencas = frequenciasAluno.filter(f => f.presente).length;
        const totalFaltas = frequenciasAluno.filter(f => !f.presente).length;
        const total = frequenciasAluno.length;
        const percentualPresenca = total > 0 ? (totalPresencas / total) * 100 : 0;

        return {
          id: aluno.id,
          nomalu: aluno.nomalu,
          frequencias: frequenciasAluno.map(f => ({
            data_aula: f.data_aula,
            tempo: f.tempo,
            presente: f.presente,
          })),
          total_presencas: totalPresencas,
          total_faltas: totalFaltas,
          percentual_presenca: percentualPresenca,
        };
      });

      // Processar dados de avaliações por aluno
      const alunosAvaliacoes = alunos.map(aluno => {
        const avaliacoesAluno = avaliacoesData?.filter(a => a.aluno_id === aluno.id) || [];
        const notasValidas = avaliacoesAluno.filter(a => a.nota !== null).map(a => a.nota!);
        const media = notasValidas.length > 0 
          ? notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length 
          : null;

        return {
          id: aluno.id,
          nomalu: aluno.nomalu,
          avaliacoes: avaliacoesAluno.map(a => ({
            titulo: a.titulo,
            tipo_avaliacao: a.tipo_avaliacao,
            data_avaliacao: a.data_avaliacao,
            nota: a.nota,
            nota_maxima: a.nota_maxima || 10,
          })),
          media,
        };
      });

      // Exportar para PDF
      exportarDiarioParaImpressao(
        {
          turma: diarioSelecionado.turma!,
          componente_curricular: diarioSelecionado.componente_curricular,
          turno_diario: diarioSelecionado.turno_diario,
          professor: { nome: professor?.nome || "N/A" },
        },
        alunosFrequencia,
        alunosAvaliacoes,
        bimestre,
        escolaAtual?.nome || "Escola"
      );
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      toast.error("Erro ao gerar PDF do diário");
    }
  };

  const handleExportarPDFOficial = async () => {
    if (!diarioSelecionado || !bimestreSelecionado || !alunos) {
      toast.error("Selecione um diário e um bimestre antes de exportar");
      return;
    }

    const bimestre = bimestres.find(b => b.id === bimestreSelecionado);
    if (!bimestre) return;

    try {
      // Buscar dados do professor
      const { data: professor } = await supabase
        .from("professores")
        .select("nome, matricula")
        .eq("id", diarioSelecionado.professor_id)
        .single();

      // Buscar todas as frequências do bimestre
      const { data: frequenciasData } = await supabase
        .from("frequencias")
        .select("*")
        .eq("diario_id", diarioSelecionado.id)
        .gte("data_aula", bimestre.data_inicio)
        .lte("data_aula", bimestre.data_fim)
        .order("data_aula")
        .order("tempo");

      // Buscar todas as avaliações do bimestre
      const { data: avaliacoesData } = await supabase
        .from("avaliacoes")
        .select("*")
        .eq("diario_id", diarioSelecionado.id)
        .gte("data_avaliacao", bimestre.data_inicio)
        .lte("data_avaliacao", bimestre.data_fim)
        .order("data_avaliacao");

      // Processar dados de frequências por aluno
      const alunosFrequencia = alunos.map(aluno => {
        const frequenciasAluno = frequenciasData?.filter(f => f.aluno_id === aluno.id) || [];
        const totalPresencas = frequenciasAluno.filter(f => f.presente).length;
        const totalFaltas = frequenciasAluno.filter(f => !f.presente).length;
        const total = frequenciasAluno.length;
        const percentualPresenca = total > 0 ? (totalPresencas / total) * 100 : 0;

        return {
          id: aluno.id,
          nomalu: aluno.nomalu,
          numalu: aluno.numalu,
          frequencias: frequenciasAluno.map(f => ({
            data_aula: f.data_aula,
            tempo: f.tempo,
            presente: f.presente,
          })),
          total_presencas: totalPresencas,
          total_faltas: totalFaltas,
          percentual_presenca: percentualPresenca,
        };
      });

      // Processar dados de avaliações por aluno
      const alunosAvaliacoes = alunos.map(aluno => {
        const avaliacoesAluno = avaliacoesData?.filter(a => a.aluno_id === aluno.id) || [];
        const notasValidas = avaliacoesAluno.filter(a => a.nota !== null).map(a => a.nota!);
        const media = notasValidas.length > 0 
          ? notasValidas.reduce((sum, nota) => sum + nota, 0) / notasValidas.length 
          : null;

        return {
          id: aluno.id,
          nomalu: aluno.nomalu,
          avaliacoes: avaliacoesAluno.map(a => ({
            titulo: a.titulo,
            tipo_avaliacao: a.tipo_avaliacao,
            data_avaliacao: a.data_avaliacao,
            nota: a.nota,
            nota_maxima: a.nota_maxima || 10,
          })),
          media,
        };
      });

      // Exportar para PDF Oficial
      exportarDiarioOficialPDF(
        {
          turma: diarioSelecionado.turma!,
          componente_curricular: diarioSelecionado.componente_curricular,
          turno_diario: diarioSelecionado.turno_diario,
          professor: { 
            nome: professor?.nome || "N/A",
            matricula: professor?.matricula || undefined,
          },
        },
        alunosFrequencia,
        alunosAvaliacoes,
        bimestre,
        escolaAtual?.nome || "Escola"
      );
    } catch (error) {
      console.error("Erro ao exportar PDF oficial:", error);
      toast.error("Erro ao gerar PDF oficial do diário");
    }
  };

  // Carregar notas existentes no estado local
  useEffect(() => {
    if (avaliacaoSelecionada) {
      const notasMap: Record<string, number | null> = {};
      avaliacaoSelecionada.avaliacoes.forEach((av: any) => {
        notasMap[av.aluno_id] = av.nota;
      });
      setNotasLocais(notasMap);
    }
  }, [avaliacaoSelecionada]);

  // Filtrar horários disponíveis para a data selecionada
  const horariosDisponiveis = diarioSelecionado?.horarios.filter((h) => {
    const diaDaSemana = format(dataSelecionada, "EEEE", { locale: ptBR }).toUpperCase();
    const diaMapeado = {
      "SEGUNDA-FEIRA": "Segunda",
      "TERÇA-FEIRA": "Terça",
      "QUARTA-FEIRA": "Quarta",
      "QUINTA-FEIRA": "Quinta",
      "SEXTA-FEIRA": "Sexta",
      "SÁBADO": "Sábado",
      "DOMINGO": "Domingo",
    }[diaDaSemana];
    return h.dia_semana === diaMapeado;
  }) || [];

  if (loadingDiarios) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diário de Classe</h1>
          <p className="text-muted-foreground mt-1">
            Carregando seus diários...
          </p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!diarios || diarios.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Diário de Classe</h1>
          <p className="text-muted-foreground mt-1">
            Registre frequências e avalie seus alunos
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum diário disponível</AlertTitle>
          <AlertDescription>
            Você ainda não possui diários de classe cadastrados. Os diários são criados
            automaticamente quando há horários lançados no Quadro de Horários para suas turmas.
            <br /><br />
            <strong>Para ter diários disponíveis:</strong>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Acesse o menu "Horários → Lançamento"</li>
              <li>Selecione uma turma</li>
              <li>Lance os horários das aulas (componente + professor + dia/tempo)</li>
              <li>Salve o quadro de horários</li>
              <li>Os diários serão criados automaticamente</li>
            </ol>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Diário de Classe</h1>
        <p className="text-muted-foreground mt-1">
          Registre frequências e avalie seus alunos
        </p>
      </div>

      {/* Seleção de Diário */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Selecionar Diário
              </CardTitle>
              <CardDescription>
                Escolha a turma e componente curricular para lançar frequências
              </CardDescription>
            </div>
            {diarioSelecionado && bimestreSelecionado && (
              <div className="flex gap-2">
                <Button
                  onClick={handleExportarPDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF Moderno
                </Button>
                <Button
                  onClick={handleExportarPDFOficial}
                  variant="default"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  PDF Oficial
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Bimestre</label>
              <Select
                value={bimestreSelecionado}
                onValueChange={setBimestreSelecionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um bimestre..." />
                </SelectTrigger>
                <SelectContent>
                  {bimestres.map((bimestre) => (
                    <SelectItem key={bimestre.id} value={bimestre.id}>
                      {bimestre.numero}º Bimestre ({format(new Date(bimestre.data_inicio), "dd/MM")} - {format(new Date(bimestre.data_fim), "dd/MM")})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Turma / Componente</label>
              <Select
                value={diarioSelecionado?.id || ""}
                onValueChange={handleDiarioChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um diário..." />
                </SelectTrigger>
                <SelectContent>
                  {diarios
                    .filter((d) => d.tipo_diario === "REGULAR") // Apenas diários regulares
                    .map((diario) => (
                      <SelectItem key={diario.id} value={diario.id}>
                        {diario.turma?.turma} - {diario.turma?.etapa_modalidade} (
                        {diario.turma?.grupo_ano}) - {diario.componente_curricular}
                        {diario.turno_diario ? ` - ${diario.turno_diario === "MATUTINO" ? "Manhã" : "Tarde"}` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data da Aula</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={format(dataSelecionada, "yyyy-MM-dd")}
                onChange={(e) => setDataSelecionada(new Date(e.target.value))}
                disabled={validandoData}
              />
            </div>
          </div>

          {diarioSelecionado && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Badge>
              
              {!ehDiaLetivo && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Não é dia letivo
                </Badge>
              )}
              
              {edicaoBloqueada.bloqueado && (
                <Badge variant="destructive" className="flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  Edição bloqueada por conselho
                </Badge>
              )}
              
              {diarioSelecionado.turno_diario && (
                <Badge variant="secondary">
                  Turno: {diarioSelecionado.turno_diario === "MATUTINO" ? "Manhã" : "Tarde"}
                </Badge>
              )}
              {!diarioSelecionado.turno_diario && (
                <Badge variant="outline">
                  Turno: {diarioSelecionado.turma?.turno}
                </Badge>
              )}
              <Badge variant="outline">
                {horariosDisponiveis.length} tempo(s) disponível(is)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informativo sobre Turmas Integrais */}
      {diarioSelecionado?.turma?.turno === "INTEGRAL" && (
        <InfoTurmasIntegrais />
      )}

      {/* Alertas de validação */}
      {!ehDiaLetivo && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Data não é dia letivo</AlertTitle>
          <AlertDescription>
            A data selecionada pode ser feriado, fim de semana ou evento institucional que bloqueia o dia letivo.
            Você ainda pode visualizar, mas recomenda-se selecionar uma data letiva para lançamento de frequências.
          </AlertDescription>
        </Alert>
      )}

      {edicaoBloqueada.bloqueado && edicaoBloqueada.conselho && (
        <Alert variant="destructive">
          <Lock className="h-4 w-4" />
          <AlertTitle>Edição bloqueada</AlertTitle>
          <AlertDescription>
            O Conselho de Classe foi realizado em{" "}
            {format(new Date(edicaoBloqueada.conselho.data), "dd/MM/yyyy", { locale: ptBR })}.
            {edicaoBloqueada.conselho.descricao && (
              <> - {edicaoBloqueada.conselho.descricao}</>
            )}
            <br />
            <strong>Não é possível editar avaliações deste período.</strong>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs: Frequências e Avaliações */}
      {diarioSelecionado && !edicaoBloqueada.bloqueado && (
        <Tabs value={tabAtiva} onValueChange={setTabAtiva}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="frequencias" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Frequências
            </TabsTrigger>
            <TabsTrigger value="avaliacoes" className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4" />
              Avaliações
            </TabsTrigger>
          </TabsList>

          {/* Aba Frequências */}
          <TabsContent value="frequencias">
            {horariosDisponiveis.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Nenhum horário disponível</AlertTitle>
                <AlertDescription>
                  Não há horários cadastrados para esta turma/componente na data selecionada.
                </AlertDescription>
              </Alert>
            ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registro de Frequência
            </CardTitle>
            <CardDescription>
              Selecione o tempo da aula e marque a presença dos alunos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAlunos ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Seleção de Tempo */}
                <div className="space-y-2">
                  <Label>Tempo da Aula</Label>
                  <div className="flex gap-2 flex-wrap">
                    {horariosDisponiveis.map((horario) => (
                      <Button
                        key={horario.tempo}
                        variant={tempoSelecionado === horario.tempo ? "default" : "outline"}
                        onClick={() => {
                          setTempoSelecionado(horario.tempo);
                          setFrequenciasLocais({});
                        }}
                        size="sm"
                      >
                        {horario.tempo}º Tempo
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Lista de Alunos */}
                {tempoSelecionado && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        Lista de Chamada - {tempoSelecionado}º Tempo
                      </h3>
                      <Badge variant="outline">
                        {alunos?.length || 0} aluno(s)
                      </Badge>
                    </div>

                    {loadingFrequencias ? (
                      <div className="space-y-2">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ) : (
                      <div className="border rounded-lg divide-y">
                        {alunos?.map((aluno, index) => (
                          <div
                            key={aluno.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-8">
                                {index + 1}
                              </span>
                              <span className="font-medium">{aluno.nomalu}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`presente-${aluno.id}`}
                                checked={frequenciasLocais[aluno.id] ?? true}
                                onCheckedChange={(checked) =>
                                  handleCheckboxChange(aluno.id, checked as boolean)
                                }
                              />
                              <Label
                                htmlFor={`presente-${aluno.id}`}
                                className="text-sm cursor-pointer"
                              >
                                Presente
                              </Label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end pt-4">
                      <Button
                        onClick={handleSalvarFrequencias}
                        disabled={salvandoFrequencias || !alunos || alunos.length === 0}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {salvandoFrequencias ? "Salvando..." : "Salvar Frequências"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
            )}
          </TabsContent>

          {/* Aba Avaliações */}
          <TabsContent value="avaliacoes">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5" />
                  Lançamento de Avaliações
                </CardTitle>
                <CardDescription>
                  Crie avaliações e lance as notas dos alunos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Criar Nova Avaliação */}
                <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Criar Nova Avaliação
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input
                        placeholder="Ex: Prova 1"
                        value={novaAvaliacao.titulo}
                        onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, titulo: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        value={novaAvaliacao.tipo}
                        onValueChange={(v) => setNovaAvaliacao({ ...novaAvaliacao, tipo: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PROVA">Prova</SelectItem>
                          <SelectItem value="TRABALHO">Trabalho</SelectItem>
                          <SelectItem value="PARTICIPACAO">Participação</SelectItem>
                          <SelectItem value="SEMINARIO">Seminário</SelectItem>
                          <SelectItem value="ATIVIDADE">Atividade</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={novaAvaliacao.data}
                        onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, data: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Nota Máxima</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={novaAvaliacao.notaMaxima}
                        onChange={(e) => setNovaAvaliacao({ ...novaAvaliacao, notaMaxima: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>
                  <Button onClick={handleCriarAvaliacao} disabled={salvandoAvaliacoes}>
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Avaliação
                  </Button>
                </div>

                {/* Lista de Avaliações Criadas */}
                {loadingAvaliacoes ? (
                  <div className="space-y-2">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                ) : avaliacoesAgrupadas && avaliacoesAgrupadas.length > 0 ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold">Avaliações Cadastradas</h3>
                    <div className="space-y-2">
                      {avaliacoesAgrupadas.map((grupo: any, index: number) => (
                        <div
                          key={index}
                          className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                          onClick={() => setAvaliacaoSelecionada(grupo)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{grupo.titulo}</h4>
                                <Badge variant="outline">{grupo.tipo_avaliacao}</Badge>
                                <Badge variant="secondary">
                                  Nota máxima: {grupo.nota_maxima}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Data: {format(new Date(grupo.data_avaliacao), "dd/MM/yyyy")} •{" "}
                                {grupo.avaliacoes.filter((av: any) => av.nota !== null).length}/
                                {grupo.avaliacoes.length} notas lançadas
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletarAvaliacao(grupo);
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Nenhuma avaliação cadastrada</AlertTitle>
                    <AlertDescription>
                      Crie uma avaliação acima para começar a lançar notas dos alunos.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Lançamento de Notas */}
                {avaliacaoSelecionada && alunos && (
                  <div className="space-y-4 border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{avaliacaoSelecionada.titulo}</h3>
                        <p className="text-sm text-muted-foreground">
                          Nota máxima: {avaliacaoSelecionada.nota_maxima} pontos
                        </p>
                      </div>
                      <Button onClick={handleSalvarNotas} disabled={salvandoAvaliacoes}>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Notas
                      </Button>
                    </div>

                    <div className="border rounded-lg divide-y max-h-96 overflow-y-auto">
                      {alunos.map((aluno: any, index: number) => {
                        const avaliacaoDoAluno = avaliacaoSelecionada.avaliacoes.find(
                          (av: any) => av.aluno_id === aluno.id
                        );
                        return (
                          <div
                            key={aluno.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-sm text-muted-foreground w-8">
                                {index + 1}
                              </span>
                              <span className="font-medium">{aluno.nomalu}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                max={avaliacaoSelecionada.nota_maxima}
                                placeholder="Nota"
                                className="w-20"
                                value={
                                  notasLocais[aluno.id] !== undefined
                                    ? notasLocais[aluno.id] ?? ""
                                    : avaliacaoDoAluno?.nota ?? ""
                                }
                                onChange={(e) => {
                                  const valor = e.target.value === "" ? null : parseFloat(e.target.value);
                                  setNotasLocais((prev) => ({
                                    ...prev,
                                    [aluno.id]: valor,
                                  }));
                                }}
                              />
                              <span className="text-sm text-muted-foreground">
                                / {avaliacaoSelecionada.nota_maxima}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {diarioSelecionado && horariosDisponiveis.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sem horários para esta data</AlertTitle>
          <AlertDescription>
            Não há horários cadastrados para {diarioSelecionado.componente_curricular} na data
            selecionada ({format(dataSelecionada, "EEEE", { locale: ptBR })}).
            <br />
            Selecione outra data ou verifique o Quadro de Horários.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DiarioClasse;
