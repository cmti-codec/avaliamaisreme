import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar, BookOpen, Users, AlertCircle } from "lucide-react";
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

const DiarioClasse = () => {
  const [diarioSelecionado, setDiarioSelecionado] = useState<DiarioComHorarios | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<Date>(new Date());

  const { data: diarios, isLoading: loadingDiarios } = useDiariosComHorarios();
  const { data: alunos, isLoading: loadingAlunos } = useAlunosDaTurma(
    diarioSelecionado?.turma_id || null
  );

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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {diarios.map((diario) => (
                    <SelectItem key={diario.id} value={diario.id}>
                      {diario.turma?.turma} - {diario.turma?.etapa_modalidade} (
                      {diario.turma?.grupo_ano}) - {diario.componente_curricular}
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
              />
            </div>
          </div>

          {diarioSelecionado && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="outline" className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {format(dataSelecionada, "EEEE, dd 'de' MMMM", { locale: ptBR })}
              </Badge>
              <Badge variant="outline">
                Turno: {diarioSelecionado.turma?.turno}
              </Badge>
              <Badge variant="outline">
                {horariosDisponiveis.length} tempo(s) disponível(is)
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Alunos / Lançamento de Frequência */}
      {diarioSelecionado && horariosDisponiveis.length > 0 && (
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
