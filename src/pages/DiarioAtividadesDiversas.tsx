import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, BookOpen, Users, AlertCircle, CheckCircle, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDiariosComHorarios, useAlunosDaTurma, type DiarioComHorarios } from "@/hooks/useDiariosClasse";
import { useFrequenciasDaAula, useSalvarFrequencias } from "@/hooks/useFrequencias";
import { Skeleton } from "@/components/ui/skeleton";

const DiarioAtividadesDiversas = () => {
  const [diarioSelecionado, setDiarioSelecionado] = useState<DiarioComHorarios | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [turnoAtual, setTurnoAtual] = useState<"MATUTINO" | "VESPERTINO">("MATUTINO");
  const [tempoSelecionado, setTempoSelecionado] = useState<number>(1);
  const [presencasLocais, setPresencasLocais] = useState<Map<string, boolean>>(new Map());

  const { data: diarios, isLoading: loadingDiarios } = useDiariosComHorarios();
  const { data: alunos, isLoading: loadingAlunos } = useAlunosDaTurma(
    diarioSelecionado?.turma_id || null
  );

  const dataFormatada = format(dataSelecionada, "yyyy-MM-dd");
  const { data: frequenciasSalvas, isLoading: loadingFrequencias } = useFrequenciasDaAula(
    diarioSelecionado?.id || null,
    dataFormatada,
    tempoSelecionado
  );

  const salvarFrequenciasMutation = useSalvarFrequencias();

  // Filtrar apenas diários de atividades diversas
  const diariosAtividades = diarios?.filter(
    (d) => d.tipo_diario === "ATIVIDADES_DIVERSAS"
  ) || [];

  // Atualizar presenças locais quando frequências salvas mudarem
  useEffect(() => {
    if (frequenciasSalvas && alunos) {
      const novasPresencas = new Map<string, boolean>();
      alunos.forEach((aluno) => {
        const freq = frequenciasSalvas.find((f) => f.aluno_id === aluno.id);
        novasPresencas.set(aluno.id, freq?.presente ?? true); // default: presente
      });
      setPresencasLocais(novasPresencas);
    }
  }, [frequenciasSalvas, alunos]);

  const handleDiarioChange = (diarioId: string) => {
    const diario = diariosAtividades.find((d) => d.id === diarioId);
    setDiarioSelecionado(diario || null);
    setPresencasLocais(new Map()); // Limpar seleções
  };

  const handlePresencaChange = (alunoId: string, presente: boolean) => {
    setPresencasLocais((prev) => {
      const next = new Map(prev);
      next.set(alunoId, presente);
      return next;
    });
  };

  const handleSalvarFrequencias = async () => {
    if (!diarioSelecionado || !alunos) return;

    const frequencias = alunos.map((aluno) => ({
      diario_id: diarioSelecionado.id,
      aluno_id: aluno.id,
      data_aula: dataFormatada,
      tempo: tempoSelecionado,
      presente: presencasLocais.get(aluno.id) ?? true,
    }));

    await salvarFrequenciasMutation.mutateAsync(frequencias);
  };

  if (loadingDiarios) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atividades Diversas</h1>
          <p className="text-muted-foreground mt-1">
            Carregando diários...
          </p>
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (diariosAtividades.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Atividades Diversas</h1>
          <p className="text-muted-foreground mt-1">
            Lançamento de frequências de atividades diversas
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Nenhum diário disponível</AlertTitle>
          <AlertDescription>
            Não há turmas integrais dos grupos 1, 1I, 1II, 2 ou 3 nesta escola,
            ou os diários ainda não foram criados automaticamente.
            <br /><br />
            Os diários de Atividades Diversas são criados automaticamente para turmas
            integrais desses grupos quando há horários lançados.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Atividades Diversas</h1>
        <p className="text-muted-foreground mt-1">
          Lançamento de frequências de atividades diversas (Assistente)
        </p>
      </div>

      {/* Seleção de Turma */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Selecionar Turma
          </CardTitle>
          <CardDescription>
            Escolha a turma e turno para lançar as frequências de atividades diversas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Turma</label>
              <Select
                value={diarioSelecionado?.id || ""}
                onValueChange={handleDiarioChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma turma..." />
                </SelectTrigger>
                <SelectContent>
                  {diariosAtividades
                    .filter((d) => !d.turno_diario || d.turno_diario === turnoAtual)
                    .map((diario) => (
                      <SelectItem key={diario.id} value={diario.id}>
                        {diario.turma?.turma} - {diario.turma?.grupo_ano} 
                        {diario.turno_diario ? ` (${diario.turno_diario})` : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data</label>
              <input
                type="date"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={format(dataSelecionada, "yyyy-MM-dd")}
                onChange={(e) => setDataSelecionada(new Date(e.target.value))}
              />
            </div>
          </div>

          {/* Seleção de Turno para turmas integrais */}
          <Tabs value={turnoAtual} onValueChange={(v) => setTurnoAtual(v as "MATUTINO" | "VESPERTINO")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="MATUTINO">Manhã</TabsTrigger>
              <TabsTrigger value="VESPERTINO">Tarde</TabsTrigger>
            </TabsList>
          </Tabs>

          {diarioSelecionado && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Badge>
              <Badge variant="secondary">
                Turno: {turnoAtual === "MATUTINO" ? "Manhã" : "Tarde"}
              </Badge>
              <Badge variant="outline">
                {diarioSelecionado.turma?.turma} - {diarioSelecionado.turma?.grupo_ano}
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informativo */}
      {diarioSelecionado && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Sobre Atividades Diversas</AlertTitle>
          <AlertDescription>
            As frequências lançadas aqui são referentes às atividades realizadas pelas
            <strong> assistentes de educação infantil</strong> nas turmas integrais.
            <br />
            Essas frequências são <strong>somadas às dos professores</strong> (manhã + tarde)
            para compor o total de presença do aluno no bimestre.
          </AlertDescription>
        </Alert>
      )}

      {/* Lista de Alunos */}
      {diarioSelecionado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registro de Frequência - Atividades Diversas
            </CardTitle>
            <CardDescription>
              Lance a presença dos alunos nas atividades diversas
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
              <div className="space-y-4">
                {/* Seleção de Tempo */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Tempo de Aula</label>
                  <Select
                    value={tempoSelecionado.toString()}
                    onValueChange={(v) => setTempoSelecionado(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tempo..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1º Tempo</SelectItem>
                      <SelectItem value="2">2º Tempo</SelectItem>
                      <SelectItem value="3">3º Tempo</SelectItem>
                      <SelectItem value="4">4º Tempo</SelectItem>
                      <SelectItem value="5">5º Tempo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {loadingFrequencias ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <>
                    {/* Lista de Alunos com Checkboxes */}
                    <div className="border rounded-lg overflow-hidden">
                      <div className="bg-muted px-4 py-2 flex justify-between items-center">
                        <span className="text-sm font-medium">
                          Alunos ({alunos?.length || 0})
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Tempo: {tempoSelecionado}º
                        </span>
                      </div>
                      <div className="divide-y max-h-96 overflow-y-auto">
                        {alunos?.map((aluno) => (
                          <div
                            key={aluno.id}
                            className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                          >
                            <span className="text-sm">{aluno.nomalu}</span>
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={presencasLocais.get(aluno.id) ?? true}
                                onCheckedChange={(checked) =>
                                  handlePresencaChange(aluno.id, checked === true)
                                }
                              />
                              <span className="text-xs text-muted-foreground w-16">
                                {presencasLocais.get(aluno.id) ?? true ? "Presente" : "Falta"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botão Salvar */}
                    <Button
                      onClick={handleSalvarFrequencias}
                      disabled={salvarFrequenciasMutation.isPending}
                      className="w-full"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {salvarFrequenciasMutation.isPending
                        ? "Salvando..."
                        : "Salvar Frequências"}
                    </Button>
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DiarioAtividadesDiversas;
