import { useState, useEffect, useCallback, useMemo } from "react";
import { Save, Trash2, Printer, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import {
  detectarConflitos,
  TURNOS_TEMPOS,
  type HorarioSlot,
  type Professor,
  type Turma,
} from "@/lib/horarios-utils";

const Lancamento = () => {
  const { toast } = useToast();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [turmaSelecionada, setTurmaSelecionada] = useState<Turma | null>(null);
  const [horarios, setHorarios] = useState<Record<string, HorarioSlot>>({});
  const [aulasGeminadas, setAulasGeminadas] = useState(false);
  const [conflitos, setConflitos] = useState<{ dia: string; tempo: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingGrade, setLoadingGrade] = useState(false);
  const [showClearDialog, setShowClearDialog] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

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
      // Buscar turmas da escola do usuário
      const { data: turmasData, error: turmasError } = await supabase
        .from("turmas")
        .select("*")
        .eq("ativa", true)
        .order("segmento", { ascending: true })
        .order("grupo_ano", { ascending: true });

      if (turmasError) throw turmasError;
      setTurmas((turmasData || []).map(t => ({
        ...t,
        matriz_curricular: (t.matriz_curricular as any) || {}
      })));

      // Buscar professores
      const { data: professoresData, error: professoresError } = await supabase
        .from("professores")
        .select("*")
        .eq("ativo", true)
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
  }, [toast]);

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
      // Deletar horários existentes
      const { error: deleteError } = await supabase
        .from("horarios")
        .delete()
        .eq("turma_id", turmaSelecionada.id);

      if (deleteError) throw deleteError;

      // Inserir novos horários
      const horariosArray = Object.values(horarios)
        .filter((h) => h.professor_id)
        .map((h) => ({
          turma_id: turmaSelecionada.id,
          dia_semana: h.dia_semana,
          tempo: h.tempo,
          componente_curricular: h.componente,
          professor_id: h.professor_id,
        }));

      if (horariosArray.length > 0) {
        const { error: insertError } = await supabase
          .from("horarios")
          .insert(horariosArray);

        if (insertError) throw insertError;
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
      return `${turma.segmento} - ${turma.grupo_ano} ${turma.turma} - ${turma.turno}`;
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
                    professores={professores}
                    horarios={horarios}
                    onHorarioChange={handleHorarioChange}
                    onHorarioRemove={handleHorarioRemove}
                    aulasGeminadas={aulasGeminadas}
                    conflitos={conflitos}
                  />
                )}
              </TabsContent>

              <TabsContent value="professor">
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  <p>Horário do Professor em desenvolvimento</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Direita - Painel */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <PainelCargas turma={turmaSelecionada} horarios={horarios} />
          </div>
        </div>
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
