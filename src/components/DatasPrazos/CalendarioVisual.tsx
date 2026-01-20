import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface EventoCalendario {
  id: string;
  data: string;
  titulo: string;
  tipo: "feriado" | "sabado_letivo" | "conselho" | "entrega" | "evento";
  descricao?: string;
  subtitulo?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

interface CalendarioVisualProps {
  eventos: EventoCalendario[];
  mesAtual?: Date;
  onMesChange?: (mes: Date) => void;
}

const coresEvento = {
  feriado: "bg-red-100 border-red-300 text-red-800",
  sabado_letivo: "bg-blue-100 border-blue-300 text-blue-800",
  conselho: "bg-purple-100 border-purple-300 text-purple-800",
  entrega: "bg-orange-100 border-orange-300 text-orange-800",
  evento: "bg-green-100 border-green-300 text-green-800",
};

const labelsEvento = {
  feriado: "Feriado",
  sabado_letivo: "Sábado Letivo",
  conselho: "Conselho",
  entrega: "Entrega",
  evento: "Evento",
};

export function CalendarioVisual({ eventos, mesAtual: mesAtualProp, onMesChange }: CalendarioVisualProps) {
  const [mesAtual, setMesAtual] = useState(mesAtualProp || new Date());

  const handleMesChange = (novoMes: Date) => {
    setMesAtual(novoMes);
    onMesChange?.(novoMes);
  };

  const diasDoMes = eachDayOfInterval({
    start: startOfMonth(mesAtual),
    end: endOfMonth(mesAtual),
  });

  const primeiroDiaSemana = startOfMonth(mesAtual).getDay();
  const diasVazios = Array(primeiroDiaSemana).fill(null);

  const eventosNoDia = (dia: Date) => {
    return eventos.filter(evento => isSameDay(parseISO(evento.data), dia));
  };

  return (
    <div className="space-y-4">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleMesChange(subMonths(mesAtual, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <h2 className="text-xl font-semibold capitalize">
          {format(mesAtual, "MMMM 'de' yyyy", { locale: ptBR })}
        </h2>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleMesChange(addMonths(mesAtual, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-sm">
        {Object.entries(labelsEvento).map(([tipo, label]) => (
          <div key={tipo} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded border", coresEvento[tipo as keyof typeof coresEvento])} />
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Grade do Calendário */}
      <Card className="p-4">
        {/* Dias da Semana */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(dia => (
            <div key={dia} className="text-center text-sm font-semibold text-muted-foreground p-2">
              {dia}
            </div>
          ))}
        </div>

        {/* Dias do Mês */}
        <div className="grid grid-cols-7 gap-2">
          {/* Dias vazios do início */}
          {diasVazios.map((_, index) => (
            <div key={`vazio-${index}`} className="aspect-square" />
          ))}

          {/* Dias do mês */}
          {diasDoMes.map(dia => {
            const eventosHoje = eventosNoDia(dia);
            const isHoje = isSameDay(dia, new Date());

            return (
              <TooltipProvider key={dia.toISOString()}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "aspect-square border rounded-lg p-2 transition-colors cursor-pointer hover:bg-accent/50",
                        !isSameMonth(dia, mesAtual) && "opacity-30",
                        isHoje && "ring-2 ring-primary"
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <span className={cn(
                          "text-sm font-medium mb-1",
                          isHoje && "text-primary font-bold"
                        )}>
                          {format(dia, "d")}
                        </span>
                        
                        <div className="flex-1 overflow-hidden space-y-1">
                          {eventosHoje.slice(0, 2).map(evento => (
                            <div
                              key={evento.id}
                              className={cn(
                                "text-xs px-1 py-0.5 rounded border truncate",
                                coresEvento[evento.tipo]
                              )}
                            >
                              {evento.titulo}
                            </div>
                          ))}
                          {eventosHoje.length > 2 && (
                            <div className="text-xs text-muted-foreground">
                              +{eventosHoje.length - 2} mais
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  
                  {eventosHoje.length > 0 && (
                    <TooltipContent side="right" className="max-w-sm p-0">
                      <div className="p-3 space-y-2">
                        <div className="font-semibold border-b pb-2">
                          {format(dia, "dd 'de' MMMM", { locale: ptBR })}
                        </div>
                        
                        {eventosHoje.map(evento => (
                          <div key={evento.id} className="space-y-1 py-2 border-b last:border-b-0">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <Badge variant="outline" className={coresEvento[evento.tipo]}>
                                  {labelsEvento[evento.tipo]}
                                </Badge>
                                <p className="font-medium mt-1">{evento.titulo}</p>
                                {evento.subtitulo && (
                                  <p className="text-xs text-muted-foreground">{evento.subtitulo}</p>
                                )}
                                {evento.descricao && (
                                  <p className="text-sm text-muted-foreground mt-1">{evento.descricao}</p>
                                )}
                              </div>
                              
                              {(evento.onEdit || evento.onDelete) && (
                                <div className="flex gap-1">
                                  {evento.onEdit && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        evento.onEdit?.();
                                      }}
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                  )}
                                  {evento.onDelete && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        evento.onDelete?.();
                                      }}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </Card>

      {/* Botão para voltar ao mês atual */}
      {!isSameMonth(mesAtual, new Date()) && (
        <Button variant="outline" onClick={() => handleMesChange(new Date())} className="w-full">
          Voltar para o mês atual
        </Button>
      )}
    </div>
  );
}
