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
  getNivelQualificacao,
  isComponentePolivalente,
  isComponenteValidoParaTurma,
  type HorarioSlot,
  type Professor,
  type Turma,
} from "@/lib/horarios-utils";
import { type TurmaComMatriz } from "@/hooks/useTurmasComMatriz";

interface GradeHorariaProps {
  turma: Turma;
  turmaComMatriz?: TurmaComMatriz | null;
  professores: Professor[];
  horarios: Record<string, HorarioSlot>;
  onHorarioChange: (key: string, slot: HorarioSlot) => void;
  onHorarioRemove: (key: string) => void;
  aulasGeminadas: boolean;
  conflitos: { dia: string; tempo: number }[];
}

export const GradeHoraria = ({
  turma,
  turmaComMatriz,
  professores,
  horarios,
  onHorarioChange,
  onHorarioRemove,
  aulasGeminadas,
  conflitos,
}: GradeHorariaProps) => {
  const [professorTravado, setProfessorTravado] = useState<string | null>(null);
  const tempos = TURNOS_TEMPOS[turma.turno] || [];
  
  // Usar componentes da matriz atribuída à turma e filtrar por validade
  const componentesDisponiveis = useMemo(() => {
    if (!turmaComMatriz?.componentes) return [];
    
    return Object.keys(turmaComMatriz.componentes)
      .filter((comp) => 
        isComponenteValidoParaTurma(comp, turma.etapa_modalidade, turma.grupo_ano)
      )
      .sort();
  }, [turmaComMatriz, turma.etapa_modalidade, turma.grupo_ano]);

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
    const professoresValidos = professores
      .filter((prof) =>
        validarFormacao(prof.formacoes, componente, turma.etapa_modalidade, turma.grupo_ano)
      );

    // Ordenar por nível de qualificação (ideais primeiro) e depois por nome
    return professoresValidos.sort((a, b) => {
      const nivelA = getNivelQualificacao(a.formacoes, componente, turma.etapa_modalidade, turma.grupo_ano);
      const nivelB = getNivelQualificacao(b.formacoes, componente, turma.etapa_modalidade, turma.grupo_ano);
      
      if (nivelA === "ideal" && nivelB !== "ideal") return -1;
      if (nivelA !== "ideal" && nivelB === "ideal") return 1;
      
      return a.nome.localeCompare(b.nome);
    });
  }, [professores, turma.etapa_modalidade, turma.grupo_ano]);

  const handleComponenteChange = useCallback((dia: string, tempo: number, componente: string) => {
    const key = getSlotKey(dia, tempo);
    const profsFiltrados = getProfessoresFiltrados(componente);

    // Auto-selecionar se houver apenas 1 professor
    let professorId = profsFiltrados.length === 1 ? profsFiltrados[0].id : null;

    // Se for componente polivalente, verificar se já existe professor selecionado
    if (isComponentePolivalente(componente, turma.etapa_modalidade)) {
      const professorPolivalenteExistente = Object.values(horarios).find(
        (slot) => 
          isComponentePolivalente(slot.componente, turma.etapa_modalidade) && 
          slot.professor_id
      )?.professor_id;

      if (professorPolivalenteExistente) {
        professorId = professorPolivalenteExistente;
      }
    }

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
  }, [aulasGeminadas, tempos, onHorarioChange, getProfessoresFiltrados, turma, horarios]);

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
                            {profsFiltrados.length === 0 ? (
                              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                                Nenhum professor qualificado
                              </div>
                            ) : (
                              profsFiltrados.map((prof) => {
                                const nivel = getNivelQualificacao(
                                  prof.formacoes,
                                  slot.componente,
                                  turma.etapa_modalidade,
                                  turma.grupo_ano
                                );
                                const formacao = prof.formacoes && prof.formacoes.length > 0
                                  ? prof.formacoes[0]
                                  : "Sem formação cadastrada";

                                return (
                                  <SelectItem key={prof.id} value={prof.id}>
                                    <div className="flex items-center justify-between gap-2 w-full">
                                      <span className="truncate">{prof.nome}</span>
                                      <div className="flex items-center gap-1 flex-shrink-0">
                                        {nivel === "ideal" && (
                                          <Badge 
                                            variant="outline" 
                                            className="h-5 px-1.5 text-xs bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                                          >
                                            ✓
                                          </Badge>
                                        )}
                                        {nivel === "aceitavel" && (
                                          <Badge 
                                            variant="outline" 
                                            className="h-5 px-1.5 text-xs bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"
                                          >
                                            !
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </SelectItem>
                                );
                              })
                            )}
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
