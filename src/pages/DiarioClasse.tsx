import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, BookOpen, Users, AlertCircle, Lock } from "lucide-react";
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
import { useDiariosComHorarios, useAlunosDaTurma, type DiarioComHorarios } from "@/hooks/useDiariosClasse";
import { Skeleton } from "@/components/ui/skeleton";
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

const DiarioClasse = () => {
  const [diarioSelecionado, setDiarioSelecionado] = useState<DiarioComHorarios | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());
  const [bimestreSelecionado, setBimestreSelecionado] = useState<string>("");
  const [bimestres, setBimestres] = useState<Array<{ id: string; numero: number; data_inicio: string; data_fim: string }>>([]);
  const [ehDiaLetivo, setEhDiaLetivo] = useState<boolean>(true);
  const [edicaoBloqueada, setEdicaoBloqueada] = useState<{ bloqueado: boolean; conselho?: any }>({ bloqueado: false });
  const [validandoData, setValidandoData] = useState(false);

  const { escolaAtual } = useSchool();
  const { data: anosLetivos } = useAnosLetivos(escolaAtual?.saesc);
  const anoLetivoAtivo = anosLetivos?.find(ano => ano.ativo);

  const { data: diarios, isLoading: loadingDiarios } = useDiariosComHorarios();
  const { data: alunos, isLoading: loadingAlunos } = useAlunosDaTurma(
    diarioSelecionado?.turma_id || null
  );

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
  };

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
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Selecionar Diário
          </CardTitle>
          <CardDescription>
            Escolha a turma e componente curricular para lançar frequências
          </CardDescription>
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

      {/* Lista de Alunos / Lançamento de Frequência */}
      {diarioSelecionado && horariosDisponiveis.length > 0 && !edicaoBloqueada.bloqueado && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Registro de Frequência
            </CardTitle>
            <CardDescription>
              Lance a presença dos alunos para esta aula
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
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Funcionalidade em desenvolvimento</AlertTitle>
                  <AlertDescription>
                    O formulário de lançamento de frequências está sendo construído.
                    Em breve você poderá registrar presença/falta de cada aluno por tempo de aula.
                  </AlertDescription>
                </Alert>

                <div className="text-sm text-muted-foreground">
                  <strong>Total de alunos:</strong> {alunos?.length || 0}
                  <br />
                  <strong>Tempos disponíveis:</strong>{" "}
                  {horariosDisponiveis.map((h) => `${h.tempo}º`).join(", ")}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
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
