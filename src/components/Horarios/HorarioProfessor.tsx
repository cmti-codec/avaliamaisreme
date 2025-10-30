import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DIAS_SEMANA,
  TURNOS_TEMPOS,
  CORES_COMPONENTES,
  gerarSigla,
  type HorarioSlot,
  type Professor,
  type Turma,
} from "@/lib/horarios-utils";

interface HorarioProfessorProps {
  professores: Professor[];
  turmas: Turma[];
  horarios: Record<string, HorarioSlot>;
  turmaSelecionada: Turma | null;
}

interface HorarioProfessorSlot {
  turma: Turma;
  componente: string;
  dia_semana: string;
  tempo: number;
}

export const HorarioProfessor = ({
  professores,
  turmas,
  horarios,
  turmaSelecionada,
}: HorarioProfessorProps) => {
  const [professorId, setProfessorId] = useState<string>("");

  // Agrupar horários por professor
  const horariosPorProfessor = useMemo(() => {
    const agrupado: Record<string, HorarioProfessorSlot[]> = {};

    Object.values(horarios).forEach((slot) => {
      if (!slot.professor_id || !turmaSelecionada) return;

      if (!agrupado[slot.professor_id]) {
        agrupado[slot.professor_id] = [];
      }

      agrupado[slot.professor_id].push({
        turma: turmaSelecionada,
        componente: slot.componente,
        dia_semana: slot.dia_semana,
        tempo: slot.tempo,
      });
    });

    return agrupado;
  }, [horarios, turmaSelecionada]);

  const professorSelecionado = professores.find((p) => p.id === professorId);
  const horariosProf = professorId ? horariosPorProfessor[professorId] || [] : [];

  // Determinar todos os tempos necessários baseado no turno da turma
  const tempos = useMemo(() => {
    if (!turmaSelecionada) return [1, 2, 3, 4, 5, 6, 7, 8];
    return TURNOS_TEMPOS[turmaSelecionada.turno] || [1, 2, 3, 4];
  }, [turmaSelecionada]);

  // Criar matriz de horários
  const matrizHorarios = useMemo(() => {
    const matriz: Record<string, HorarioProfessorSlot | null> = {};

    horariosProf.forEach((slot) => {
      const key = `${slot.dia_semana}_${slot.tempo}`;
      matriz[key] = slot;
    });

    return matriz;
  }, [horariosProf]);

  const getSlotKey = (dia: string, tempo: number): string => {
    return `${dia}_${tempo}`;
  };

  // Calcular estatísticas do professor
  const stats = useMemo(() => {
    const totalAulas = horariosProf.length;
    const componentesUnicos = new Set(horariosProf.map((h) => h.componente));
    const turmasUnicas = new Set(horariosProf.map((h) => h.turma.id));

    return {
      totalAulas,
      componentesUnicos: componentesUnicos.size,
      turmasUnicas: turmasUnicas.size,
      horasPL: professorSelecionado?.horas_pl || 0,
      cargaContratual: professorSelecionado?.carga_horaria_contratual || 0,
    };
  }, [horariosProf, professorSelecionado]);

  return (
    <div className="space-y-4">
      {/* Cabeçalho com Select e Stats */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Select value={professorId} onValueChange={setProfessorId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecionar Professor" />
            </SelectTrigger>
            <SelectContent>
              {professores.map((prof) => (
                <SelectItem key={prof.id} value={prof.id}>
                  {prof.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {professorSelecionado && (
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="gap-1">
              📚 {stats.totalAulas} aulas
            </Badge>
            <Badge variant="secondary" className="gap-1">
              📖 {stats.componentesUnicos} componentes
            </Badge>
            <Badge variant="secondary" className="gap-1">
              👥 {stats.turmasUnicas} turmas
            </Badge>
            <Badge variant="outline" className="gap-1">
              ⏰ {stats.totalAulas + stats.horasPL}/{stats.cargaContratual}h
            </Badge>
          </div>
        )}
      </div>

      {/* Grade Horária */}
      {professorSelecionado ? (
        <Card>
          <CardContent className="p-4">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Tempo</TableHead>
                    {DIAS_SEMANA.map((dia) => (
                      <TableHead key={dia} className="text-center min-w-[150px]">
                        {dia}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tempos.map((tempo) => (
                    <TableRow key={tempo}>
                      <TableCell className="font-medium text-center">{tempo}º</TableCell>
                      {DIAS_SEMANA.map((dia) => {
                        const key = getSlotKey(dia, tempo);
                        const slot = matrizHorarios[key];
                        const cor = slot
                          ? CORES_COMPONENTES[slot.componente] || "#95A5A6"
                          : "transparent";

                        return (
                          <TableCell
                            key={key}
                            className="p-2"
                            style={{
                              backgroundColor: slot ? `${cor}20` : undefined,
                            }}
                          >
                            {slot && (
                              <div className="space-y-1 relative">
                                <div className="text-xs font-medium text-center">
                                  {slot.turma.grupo_ano} {slot.turma.turma}
                                </div>
                                <div className="text-xs text-center text-muted-foreground">
                                  {slot.componente}
                                </div>
                                <Badge
                                  className="absolute top-0 right-0 text-[10px] h-5"
                                  style={{ backgroundColor: cor }}
                                >
                                  {gerarSigla(slot.componente)}
                                </Badge>
                              </div>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>Selecione um professor para visualizar seus horários</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HorarioProfessor;
