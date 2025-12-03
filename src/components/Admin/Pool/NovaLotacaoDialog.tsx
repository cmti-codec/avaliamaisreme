import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLotacoesGestao } from "@/hooks/useLotacoesGestao";
import { useEscolas } from "@/hooks/useEscolas";
import { PessoaComLotacoes } from "@/hooks/usePessoasPool";
import { Card } from "@/components/ui/card";

interface NovaLotacaoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: PessoaComLotacoes;
  perfil: 'PROFESSOR' | 'COORDENADOR';
}

export function NovaLotacaoDialog({ open, onOpenChange, pessoa, perfil }: NovaLotacaoDialogProps) {
  const [escolaSaesc, setEscolaSaesc] = useState<string>("");
  const [cargaHoraria, setCargaHoraria] = useState<string>("");
  const [dataInicio, setDataInicio] = useState<Date>(new Date());
  const [observacoes, setObservacoes] = useState<string>("");

  const escolasQuery = useEscolas();
  const escolas = escolasQuery.data || [];
  const { criarLotacao, isSaving } = useLotacoesGestao();

  const cargaAtual = pessoa?.carga_horaria_total || 0;
  const novaCarga = parseInt(cargaHoraria) || 0;
  const cargaTotal = cargaAtual + novaCarga;
  const excedeCarga = cargaTotal > 50;

  const handleSubmit = () => {
    if (!escolaSaesc) {
      return;
    }

    if (perfil === 'PROFESSOR' && (!cargaHoraria || parseInt(cargaHoraria) <= 0)) {
      return;
    }

    criarLotacao({
      pessoa_id: pessoa.pessoa_id,
      escola_saesc: escolaSaesc,
      perfil,
      carga_horaria: perfil === 'PROFESSOR' ? parseInt(cargaHoraria) : undefined,
      data_inicio: format(dataInicio, "yyyy-MM-dd"),
      observacoes: observacoes || undefined,
    }, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset
        setEscolaSaesc("");
        setCargaHoraria("");
        setDataInicio(new Date());
        setObservacoes("");
      }
    });
  };

  if (!pessoa) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Lotação - {pessoa.nome_completo}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Escola */}
          <div className="space-y-2">
            <Label htmlFor="escola">Escola *</Label>
            <Select value={escolaSaesc} onValueChange={setEscolaSaesc}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a escola..." />
              </SelectTrigger>
              <SelectContent>
                {escolas.map((escola) => (
                  <SelectItem key={escola.id} value={escola.id}>
                    {escola.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Carga Horária (apenas para professor) */}
          {perfil === 'PROFESSOR' && (
            <div className="space-y-2">
              <Label htmlFor="carga">Carga Horária Semanal (aulas) *</Label>
              <Input
                id="carga"
                type="number"
                min={1}
                max={50}
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(e.target.value)}
                placeholder="Ex: 20"
              />
              <p className="text-sm text-muted-foreground">
                Quantidade de aulas que o professor ministrará nesta escola
              </p>
            </div>
          )}

          {/* Data de Início */}
          <div className="space-y-2">
            <Label>Data de Início *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataInicio && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataInicio ? format(dataInicio, "dd/MM/yyyy") : <span>Selecione a data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataInicio}
                  onSelect={(date) => date && setDataInicio(date)}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="obs">Observações</Label>
            <Textarea
              id="obs"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Ex: Substituição temporária, projeto especial..."
              rows={3}
            />
          </div>

          {/* Card de Alerta para Professores */}
          {perfil === 'PROFESSOR' && pessoa.total_lotacoes_ativas > 0 && (
            <Card className="p-4 space-y-2 border-warning/50 bg-warning/5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                <div className="space-y-2 flex-1">
                  <p className="font-semibold text-sm">Lotações Existentes:</p>
                  <ul className="text-sm space-y-1">
                    {pessoa.lotacoes_ativas.map((lot, idx) => (
                      <li key={idx}>
                        • {lot.escola_nome}: {lot.carga_horaria}h (desde {format(new Date(lot.data_inicio), "dd/MM/yyyy")})
                      </li>
                    ))}
                  </ul>
                  <div className="pt-2 border-t border-warning/20">
                    <p className="text-sm">
                      <strong>Total atual:</strong> {cargaAtual}h
                    </p>
                    {novaCarga > 0 && (
                      <>
                        <p className="text-sm">
                          <strong>Nova lotação:</strong> {novaCarga}h
                        </p>
                        <p className={cn(
                          "text-sm font-semibold",
                          excedeCarga && "text-destructive"
                        )}>
                          <strong>Total após confirmação:</strong> {cargaTotal}h
                        </p>
                      </>
                    )}
                  </div>
                  {excedeCarga && (
                    <div className="pt-2">
                      <p className="text-sm text-destructive font-semibold flex items-center gap-2">
                        🔴 ATENÇÃO: Carga horária total excederá 50h/semana na rede.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSaving ||
              !escolaSaesc ||
              (perfil === 'PROFESSOR' && (!cargaHoraria || parseInt(cargaHoraria) <= 0)) ||
              excedeCarga
            }
          >
            ✅ Confirmar Lotação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
