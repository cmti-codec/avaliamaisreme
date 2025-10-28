import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  validarFormacao,
  isProfessorTravado,
  type HorarioSlot,
  type Professor,
  type Turma,
} from "@/lib/horarios-utils";

interface GradeHorariaProps {
  turma: Turma;
  professores: Professor[];
  horarios: Record<string, HorarioSlot>;
  onHorarioChange: (key: string, slot: HorarioSlot) => void;
  onHorarioRemove: (key: string) => void;
  aulasGeminadas: boolean;
  conflitos: { dia: string; tempo: number }[];
}

export const GradeHoraria = ({
  turma,
  professores,
  horarios,
  onHorarioChange,
  onHorarioRemove,
  aulasGeminadas,
  conflitos,
}: GradeHorariaProps) => {
  const [professorTravado, setProfessorTravado] = useState<string | null>(null);
  const tempos = TURNOS_TEMPOS[turma.turno] || [];
  const componentesDisponiveis = Object.keys(turma.matriz_curricular || {}).sort();

  useEffect(() => {
    // Detectar professor travado
    Object.values(horarios).forEach((slot) => {
      if (
        slot.professor_id &&
        isProfessorTravado(turma.etapa_modalidade, turma.grupo_ano, slot.componente)
      ) {
        setProfessorTravado(slot.professor_id);
      }
    });
  }, [horarios, turma]);

  const getSlotKey = (dia: string, tempo: number): string => {
    return `${dia}_${tempo}`;
  };

  const hasConflito = (dia: string, tempo: number): boolean => {
    return conflitos.some((c) => c.dia === dia && c.tempo === tempo);
  };

  const getProfessoresFiltrados = useCallback((componente: string): Professor[] => {
    return professores
      .filter((prof) =>
        validarFormacao(prof.formacoes, componente, turma.etapa_modalidade, turma.grupo_ano)
      )
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [professores, turma.etapa_modalidade, turma.grupo_ano]);

  const handleComponenteChange = useCallback((dia: string, tempo: number, componente: string) => {
    const key = getSlotKey(dia, tempo);
    const profsFiltrados = getProfessoresFiltrados(componente);

    // Auto-selecionar se houver apenas 1 professor
    const professorId = profsFiltrados.length === 1 ? profsFiltrados[0].id : null;

    const slot: HorarioSlot = {
      dia_semana: dia,
      tempo,
      componente,
      professor_id: professorId,
    };

    onHorarioChange(key, slot);

    // Se aulas geminadas, duplicar na próxima célula
    if (aulasGeminadas && tempo < tempos[tempos.length - 1]) {
      const nextKey = getSlotKey(dia, tempo + 1);
      onHorarioChange(nextKey, {
        ...slot,
        tempo: tempo + 1,
      });
    }

    // Travar professor se necessário
    if (
      professorId &&
      isProfessorTravado(turma.etapa_modalidade, turma.grupo_ano, componente)
    ) {
      setProfessorTravado(professorId);
    }
  }, [aulasGeminadas, tempos, onHorarioChange, getProfessoresFiltrados, turma]);

  const handleProfessorChange = useCallback((dia: string, tempo: number, professorId: string) => {
    const key = getSlotKey(dia, tempo);
    const currentSlot = horarios[key];

    if (currentSlot) {
      onHorarioChange(key, {
        ...currentSlot,
        professor_id: professorId,
      });

      // Verificar travamento
      if (isProfessorTravado(turma.etapa_modalidade, turma.grupo_ano, currentSlot.componente)) {
        setProfessorTravado(professorId);
      }
    }
  }, [horarios, onHorarioChange, turma]);

  const handleRemove = useCallback((dia: string, tempo: number) => {
    const key = getSlotKey(dia, tempo);
    onHorarioRemove(key);

    // Verificar se deve destravar professor
    const hasOtherSlots = Object.values(horarios).some(
      (slot) =>
        slot.professor_id === professorTravado &&
        getSlotKey(slot.dia_semana, slot.tempo) !== key
    );

    if (!hasOtherSlots) {
      setProfessorTravado(null);
    }
  }, [horarios, professorTravado, onHorarioRemove]);

  const getCellStyle = useMemo(() => (componente?: string): React.CSSProperties => {
    if (!componente) return {};

    const cor = CORES_COMPONENTES[componente] || "#95A5A6";
    return {
      backgroundColor: `${cor}20`,
      position: "relative",
    };
  }, []);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-20">Tempo</TableHead>
            {DIAS_SEMANA.map((dia) => (
              <TableHead key={dia} className="text-center">
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
                const slot = horarios[key];
                const temConflito = hasConflito(dia, tempo);
                const profsFiltrados = slot
                  ? getProfessoresFiltrados(slot.componente)
                  : [];

                return (
                  <TableCell
                    key={key}
                    className="p-2 min-w-[200px]"
                    style={{
                      ...getCellStyle(slot?.componente),
                      border: temConflito ? "3px solid red" : undefined,
                    }}
                  >
                    <div className="space-y-2 relative">
                      {/* Select Componente */}
                      <Select
                        value={slot?.componente || ""}
                        onValueChange={(value) =>
                          handleComponenteChange(dia, tempo, value)
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Componente" />
                        </SelectTrigger>
                        <SelectContent>
                          {componentesDisponiveis.map((comp) => (
                            <SelectItem key={comp} value={comp}>
                              {comp}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Select Professor */}
                      {slot && (
                        <Select
                          value={slot.professor_id || ""}
                          onValueChange={(value) =>
                            handleProfessorChange(dia, tempo, value)
                          }
                          disabled={
                            professorTravado !== null &&
                            professorTravado !== slot.professor_id
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Professor" />
                          </SelectTrigger>
                          <SelectContent>
                            {profsFiltrados.map((prof) => (
                              <SelectItem key={prof.id} value={prof.id}>
                                {prof.nome}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}

                      {/* Badge Sigla */}
                      {slot && (
                        <Badge
                          className="absolute top-1 right-1 text-xs"
                          style={{
                            backgroundColor: CORES_COMPONENTES[slot.componente],
                          }}
                        >
                          {gerarSigla(slot.componente)}
                        </Badge>
                      )}

                      {/* Botão Remover */}
                      {slot && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute bottom-1 right-1 h-6 w-6 opacity-0 hover:opacity-100 transition-opacity"
                          onClick={() => handleRemove(dia, tempo)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default memo(GradeHoraria);
