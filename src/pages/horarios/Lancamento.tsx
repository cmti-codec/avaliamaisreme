import { useState, useEffect, useCallback, useMemo } from "react";
import { Save, Trash2, Printer, AlertTriangle, Loader2, AlertCircle, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import GradeHoraria from "@/components/Horarios/GradeHoraria";
import PainelCargas from "@/components/Horarios/PainelCargas";
import { GradeHorariaLoading } from "@/components/Horarios/GradeHorariaLoading";
import HorarioProfessor from "@/components/Horarios/HorarioProfessor";
import { useTurmaComMatriz, type TurmaComMatriz } from "@/hooks/useTurmasComMatriz";
import {
  detectarConflitos,
  calcularQuota,
  TURNOS_TEMPOS,
  type HorarioSlot,
  type Professor,
  type Turma,
} from "@/lib/horarios-utils";
import { sortTurmasPedagogica } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";

const Lancamento = () => {
  const { toast } = useToast();
  const { user: authUser, testSchoolId } = useAuth();
  const { escolaAtual } = useSchool();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [horarios, setHorarios] = useState<Record<string, HorarioSlot>>({});
  const [aulasGeminadas, setAulasGeminadas] = useState(false);
  const [conflitos, setConflitos] = useState<{ dia: string; tempo: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);
  
  // Buscar informações da matriz da turma selecionada
  const { data: turmaComMatriz, isLoading: loadingMatriz } = useTurmaComMatriz(
    turmaSelecionada?.id || null
  );

  // Calcular quotas dos componentes usando carga da matriz atribuída
  const quotasComponentes = useMemo(() => {
    if (!turmaComMatriz?.componentes) return {};
    
    const quotas: Record<string, { atual: number; total: number; percentual: number }> = {};
    
    Object.entries(turmaComMatriz.componentes).forEach(([componenteNome, componenteInfo]) => {
      const cargaTotal = (componenteInfo as { carga: number; ordem: number }).carga || 0;
      quotas[componenteNome] = calcularQuota(horarios, componenteNome, cargaTotal);
    });
    
    return quotas;
  }, [horarios, turmaComMatriz]);

  useEffect(() => {
    carregarDados();
  }, []);

  // Recarregar dados quando contexto de escola mudar
  useEffect(() => {
    if (testSchoolId || escolaAtual) {
      carregarDados();
    }
  }, [testSchoolId, escolaAtual?.saesc]);

  useEffect(() => {
    if (turmaSelecionada) {
      carregarHorariosTurma();
    }
  }, [turmaSelecionada]);

  useEffect(() => {
    if (turmaSelecionada && Object.keys(horarios).length > 0) {
      const novosConflitos = detectarConflitos(horarios, turmaSelecionada);
      setConflitos(novosConflitos);
    }
  }, [horarios, turmaSelecionada]);

  const carregarDados = useCallback(async () => {
    try {
      // Em modo teste, usar testSchoolId diretamente
      const escolaId = testSchoolId || escolaAtual?.saesc || null;

      if (!escolaId) {
        toast({
          title: "Escola não encontrada",
          description: "Você não está vinculado a nenhuma escola neste contexto (use Modo Teste ou atribua uma escola).",
          variant: "destructive",
        });
        return;
      }

      const { data: turmasData, error: turmasError } = await supabase
        .from("turmas")
        .select("*")
        .eq("ativa", true)
        .eq("escola_id", escolaId);

      if (turmasError) throw turmasError;
      const turmasFormatadas = (turmasData || []).map(t => ({
        ...t,
        matriz_curricular: (t.matriz_curricular as any) || {}
      }));
      setTurmas(sortTurmasPedagogica(turmasFormatadas));

      // Buscar professores lotados via nova tabela lotacoes usando o UUID da escola
      const { data: lotacoesData, error: lotacoesError } = await supabase
        .from("lotacoes")
        .select("pessoa_id")
        .eq("escola_saesc", escolaId)
        .eq("perfil", "PROFESSOR")
        .eq("ativo", true);

      if (lotacoesError) throw lotacoesError;

      const pessoaIds = (lotacoesData || []).map(l => l.pessoa_id);

      if (pessoaIds.length === 0) {
        setProfessores([]);
        return;
      }

      // Buscar usuários das pessoas
      const { data: usuariosData } = await supabase
        .from("usuarios")
        .select("id, pessoa_id")
        .in("pessoa_id", pessoaIds)
        .eq("ativo", true);

      const usuarioIds = usuariosData?.map(u => u.id) || [];

      // Buscar dados de professores
      const { data: professoresData, error: professoresError } = await supabase
        .from("professores")
        .select("*")
        .eq("ativo", true)
        .in("usuario_id", usuarioIds)
        .order("nome", { ascending: true });

      if (professoresError) throw professoresError;
      setProfessores((professoresData || []).map(p => ({
        ...p,
        formacoes: (p.formacoes as any) || []
      })));
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [toast, authUser, testSchoolId, escolaAtual]);

  const carregarHorariosTurma = useCallback(async () => {
    if (!turmaSelecionada) return;

    setLoadingGrade(true);
    try {
      const { data, error } = await supabase
        .from("horarios")
        .select("*")
        .eq("turma_id", turmaSelecionada.id);

      if (error) throw error;

      const horariosMap: Record<string, HorarioSlot> = {};
      data?.forEach((h) => {
        const key = `${h.dia_semana}_${h.tempo}`;
        horariosMap[key] = {
          dia_semana: h.dia_semana,
          tempo: h.tempo,
          componente: h.componente_curricular,
          professor_id: h.professor_id,
        };
      });

      setHorarios(horariosMap);
    } catch (error: any) {
      toast({
        title: "Erro ao carregar horários",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingGrade(false);
    }
  }, [turmaSelecionada, toast]);

  const handleTurmaChange = useCallback((turmaId: string) => {
    const turma = turmas.find((t) => t.id === turmaId);
    setTurmaSelecionada(turma || null);
    setHorarios({});
    setConflitos([]);
  }, [turmas]);

  const handleHorarioChange = useCallback((key: string, slot: HorarioSlot) => {
    setHorarios((prev) => ({
      ...prev,
      [key]: slot,
    }));
  }, []);

  const handleHorarioRemove = useCallback((key: string) => {
    setHorarios((prev) => {
      const newHorarios = { ...prev };
      delete newHorarios[key];
      return newHorarios;
    });
  }, []);

  const handleLimpar = useCallback(() => {
    setShowClearDialog(true);
  }, []);

  const confirmarLimpar = useCallback(() => {
    setHorarios({});
    setShowClearDialog(false);
    toast({
      title: "Horários limpos",
      description: "Grade horária foi limpa com sucesso",
    });
  }, [toast]);

  const handleSalvar = useCallback(async () => {
    if (!turmaSelecionada) {
      toast({
        title: "Selecione uma turma",
        description: "Por favor, selecione uma turma antes de salvar",
        variant: "destructive",
      });
      return;
    }

    if (conflitos.length > 0) {
      toast({
        title: "Conflitos detectados",
        description: "Resolva os conflitos antes de salvar",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Preparar novos horários
      const horariosArray = Object.values(horarios)
        .filter((h) => h.professor_id)
        .map((h) => ({
          turma_id: turmaSelecionada.id,
          dia_semana: h.dia_semana,
          tempo: h.tempo,
          componente_curricular: h.componente,
          professor_id: h.professor_id,
        }));

      // Buscar horários existentes para identificar os que devem ser removidos
      const { data: existentes } = await supabase
        .from("horarios")
        .select("id, dia_semana, tempo")
        .eq("turma_id", turmaSelecionada.id);

      const novosKeys = new Set(horariosArray.map(h => `${h.dia_semana}_${h.tempo}`));
      const idsParaRemover = (existentes || [])
        .filter(e => !novosKeys.has(`${e.dia_semana}_${e.tempo}`))
        .map(e => e.id);

      // Remover slots que não existem mais (por ID específico)
      if (idsParaRemover.length > 0) {
        const { error: deleteError } = await supabase
          .from("horarios")
          .delete()
          .in("id", idsParaRemover);

        if (deleteError) throw deleteError;
      }

      // Upsert dos novos horários (atualiza se existir, insere se não)
      if (horariosArray.length > 0) {
        const { error: upsertError } = await supabase
          .from("horarios")
          .upsert(horariosArray, { 
            onConflict: 'turma_id,dia_semana,tempo'
          });

        if (upsertError) throw upsertError;
      }

      toast({
        title: "✅ Horário salvo!",
        description: `${horariosArray.length} aulas lançadas com sucesso`,
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [turmaSelecionada, conflitos, horarios, toast]);

  const handleImprimir = useCallback(() => {
    window.print();
  }, []);

  const formatarTurma = useMemo(
    () => (turma: Turma): string => {
      return `${turma.grupo_ano} ${turma.turma} - ${turma.turno}`;
    },
    []
  );

  const temposGrade = useMemo(() => {
    return turmaSelecionada ? TURNOS_TEMPOS[turmaSelecionada.turno]?.length || 4 : 4;
  }, [turmaSelecionada]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Lançar Horário</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLimpar} disabled={loading || loadingGrade}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button variant="outline" onClick={handleImprimir} disabled={loading || loadingGrade}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleSalvar} disabled={loading || loadingGrade || !turmaSelecionada}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Seletor de Turma */}
        <div className="flex items-center gap-4">
          <Select
            value={turmaSelecionada?.id || ""}
            onValueChange={handleTurmaChange}
          >
            <SelectTrigger className="w-[400px]">
              <SelectValue placeholder="Selecionar Turma" />
            </SelectTrigger>
            <SelectContent>
              {turmas.map((turma) => (
                <SelectItem key={turma.id} value={turma.id}>
                  {formatarTurma(turma)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {conflitos.length > 0 && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              {conflitos.length} Conflito(s) detectado(s)
            </Badge>
          )}
        </div>
      </div>

      {/* Layout Grid */}
      {turmaSelecionada && (
        <>
          {/* Alerta se sem matriz configurada */}
          {!loadingMatriz && (!turmaComMatriz || !turmaComMatriz.matriz_id) && (
            <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-800 dark:text-amber-200">
                Matriz Curricular Não Configurada
              </AlertTitle>
              <AlertDescription className="text-amber-700 dark:text-amber-300">
                Esta turma ainda não possui uma matriz curricular atribuída pela Secretaria. 
                Entre em contato com o administrador do sistema para configurar a matriz antes de lançar horários.
              </AlertDescription>
            </Alert>
          )}

          {!loadingMatriz && turmaComMatriz?.matriz_id && (
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-6">
          {/* Esquerda - Tabs */}
          <div>
            <Tabs defaultValue="turma" className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <TabsList>
                  <TabsTrigger value="turma">Horário da Turma</TabsTrigger>
                  <TabsTrigger value="professor">Horário do Professor</TabsTrigger>
                </TabsList>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="geminadas"
                    checked={aulasGeminadas}
                    onCheckedChange={(checked) =>
                      setAulasGeminadas(checked as boolean)
                    }
                    disabled={loading || loadingGrade}
                  />
                  <Label htmlFor="geminadas" className="text-sm cursor-pointer">
                    🔗 Aulas geminadas
                  </Label>
                </div>
              </div>

              <TabsContent value="turma" className="overflow-x-auto">
                {loadingGrade ? (
                  <GradeHorariaLoading tempos={temposGrade} />
                ) : (
                  <GradeHoraria
                    turma={turmaSelecionada}
                    turmaComMatriz={turmaComMatriz}
                    professores={professores}
                    horarios={horarios}
                    onHorarioChange={handleHorarioChange}
                    onHorarioRemove={handleHorarioRemove}
                    aulasGeminadas={aulasGeminadas}
                    conflitos={conflitos}
                    quotasComponentes={quotasComponentes}
                  />
                )}
              </TabsContent>

              <TabsContent value="professor">
                <HorarioProfessor
                  professores={professores}
                  turmas={turmas}
                  horarios={horarios}
                  turmaSelecionada={turmaSelecionada}
                />
              </TabsContent>
            </Tabs>
          </div>

          {/* Direita - Painel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <PainelCargas 
              turma={turmaSelecionada} 
              turmaComMatriz={turmaComMatriz}
              horarios={horarios} 
            />
          </div>
        </div>
          )}
        </>
      )}

      {!turmaSelecionada && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Selecione uma turma para começar a lançar horários</p>
        </div>
      )}

      {/* Dialog de Confirmação */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar grade horária?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover todos os horários lançados. Os dados não serão salvos
              no banco de dados até que você clique em "Salvar".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarLimpar}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Lancamento;
