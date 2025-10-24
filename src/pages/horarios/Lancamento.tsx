import { useState, useEffect } from "react";
import { Save, Trash2, Printer, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GradeHoraria } from "@/components/Horarios/GradeHoraria";
import { PainelCargas } from "@/components/Horarios/PainelCargas";
import {
  detectarConflitos,
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

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (turmaSelecionada) {
      carregarHorariosTurma();
      const novosConflitos = detectarConflitos(horarios, turmaSelecionada);
      setConflitos(novosConflitos);
    }
  }, [turmaSelecionada]);

  useEffect(() => {
    if (turmaSelecionada) {
      const novosConflitos = detectarConflitos(horarios, turmaSelecionada);
      setConflitos(novosConflitos);
    }
  }, [horarios, turmaSelecionada]);

  const carregarDados = async () => {
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
  };

  const carregarHorariosTurma = async () => {
    if (!turmaSelecionada) return;

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
    }
  };

  const handleTurmaChange = (turmaId: string) => {
    const turma = turmas.find((t) => t.id === turmaId);
    setTurmaSelecionada(turma || null);
    setHorarios({});
  };

  const handleHorarioChange = (key: string, slot: HorarioSlot) => {
    setHorarios((prev) => ({
      ...prev,
      [key]: slot,
    }));
  };

  const handleHorarioRemove = (key: string) => {
    setHorarios((prev) => {
      const newHorarios = { ...prev };
      delete newHorarios[key];
      return newHorarios;
    });
  };

  const handleLimpar = () => {
    if (confirm("Deseja realmente limpar todos os horários?")) {
      setHorarios({});
      toast({
        title: "Horários limpos",
        description: "Grade horária foi limpa com sucesso",
      });
    }
  };

  const handleSalvar = async () => {
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
  };

  const handleImprimir = () => {
    window.print();
  };

  const formatarTurma = (turma: Turma): string => {
    return `${turma.segmento} - ${turma.grupo_ano} ${turma.turma} - ${turma.turno}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Lançar Horário</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleLimpar}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar
            </Button>
            <Button variant="outline" onClick={handleImprimir}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
            <Button onClick={handleSalvar} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? "Salvando..." : "Salvar"}
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
              <div className="flex justify-between items-center">
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
                  />
                  <Label htmlFor="geminadas" className="text-sm cursor-pointer">
                    🔗 Aulas geminadas
                  </Label>
                </div>
              </div>

              <TabsContent value="turma">
                <GradeHoraria
                  turma={turmaSelecionada}
                  professores={professores}
                  horarios={horarios}
                  onHorarioChange={handleHorarioChange}
                  onHorarioRemove={handleHorarioRemove}
                  aulasGeminadas={aulasGeminadas}
                  conflitos={conflitos}
                />
              </TabsContent>

              <TabsContent value="professor">
                <div className="p-8 text-center text-muted-foreground border rounded-lg">
                  <p>Horário do Professor em desenvolvimento</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Direita - Painel */}
          <div>
            <PainelCargas turma={turmaSelecionada} horarios={horarios} />
          </div>
        </div>
      )}

      {!turmaSelecionada && (
        <div className="text-center py-12 text-muted-foreground">
          <p>Selecione uma turma para começar a lançar horários</p>
        </div>
      )}
    </div>
  );
};

export default Lancamento;
