import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowRight } from "lucide-react";
import { useLotacoesGestao } from "@/hooks/useLotacoesGestao";
import { useEscolas } from "@/hooks/useEscolas";
import { toast } from "sonner";

interface TransferirProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: any;
}

export function TransferirProfessorDialog({
  open,
  onOpenChange,
  pessoa,
}: TransferirProfessorDialogProps) {
  const [lotacaoSelecionadaId, setLotacaoSelecionadaId] = useState<string>("");
  const [novaEscolaSaesc, setNovaEscolaSaesc] = useState<string>("");

  const { data: escolas = [] } = useEscolas();
  const { encerrarLotacao, criarLotacao, isSaving } = useLotacoesGestao(pessoa?.pessoa_id);

  useEffect(() => {
    if (open && pessoa) {
      // Resetar ao abrir
      setLotacaoSelecionadaId("");
      setNovaEscolaSaesc("");
    }
  }, [open, pessoa]);

  const handleTransferir = async () => {
    if (!pessoa || !lotacaoSelecionadaId || !novaEscolaSaesc) {
      toast.error("Selecione a lotação e a nova escola");
      return;
    }

    const lotacaoAtual = pessoa.lotacoes_ativas?.find((l: any) => l.lotacao_id === lotacaoSelecionadaId);
    if (!lotacaoAtual) {
      toast.error("Lotação não encontrada");
      return;
    }

    try {
      // 1. Encerrar lotação atual (data_fim = hoje)
      await encerrarLotacao(lotacaoSelecionadaId);

      // 2. Criar nova lotação (data_inicio = amanhã)
      const amanha = new Date();
      amanha.setDate(amanha.getDate() + 1);

      await criarLotacao({
        pessoa_id: pessoa.pessoa_id,
        escola_saesc: novaEscolaSaesc,
        perfil: "PROFESSOR",
        carga_horaria: lotacaoAtual.carga_horaria,
        data_inicio: amanha.toISOString().split('T')[0],
        observacoes: `Transferido de ${lotacaoAtual.escola_nome}`,
      });

      toast.success(`Professor transferido com sucesso!`);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao transferir:", error);
      toast.error(error.message || "Erro ao transferir professor");
    }
  };

  if (!pessoa) return null;

  const lotacaoAtual = pessoa.lotacoes_ativas?.find((l: any) => l.lotacao_id === lotacaoSelecionadaId);
  const escolaAtual = lotacaoAtual ? escolas.find(e => e.codigo_saesc === lotacaoAtual.escola_saesc) : null;
  const novaEscola = novaEscolaSaesc ? escolas.find(e => e.codigo_saesc === novaEscolaSaesc) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transferir Professor</DialogTitle>
          <DialogDescription>
            Encerra a lotação atual e cria uma nova na escola de destino
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info do Professor */}
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <p className="font-medium">{pessoa.nome_completo}</p>
                <p className="text-sm text-muted-foreground">{pessoa.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Selecionar lotação atual */}
          <div className="space-y-2">
            <Label>Lotação Atual *</Label>
            <Select value={lotacaoSelecionadaId} onValueChange={setLotacaoSelecionadaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a lotação a transferir" />
              </SelectTrigger>
              <SelectContent>
                {pessoa.lotacoes_ativas?.map((lot: any) => (
                  <SelectItem key={lot.lotacao_id} value={lot.lotacao_id}>
                    {lot.escola_nome} - {lot.carga_horaria}h
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Selecionar nova escola */}
          <div className="space-y-2">
            <Label>Nova Escola *</Label>
            <Select 
              value={novaEscolaSaesc} 
              onValueChange={setNovaEscolaSaesc}
              disabled={!lotacaoSelecionadaId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a nova escola" />
              </SelectTrigger>
              <SelectContent>
                {escolas
                  .filter(e => e.codigo_saesc !== lotacaoAtual?.escola_saesc)
                  .map((escola) => (
                    <SelectItem key={escola.id} value={escola.codigo_saesc}>
                      {escola.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview da transferência */}
          {lotacaoAtual && novaEscola && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">De:</p>
                    <p className="text-lg">{escolaAtual?.nome}</p>
                    <Badge variant="secondary">{lotacaoAtual.carga_horaria}h/semana</Badge>
                  </div>
                  <ArrowRight className="w-8 h-8 text-primary" />
                  <div className="space-y-1 text-right">
                    <p className="text-sm font-medium">Para:</p>
                    <p className="text-lg">{novaEscola.nome}</p>
                    <Badge variant="default">{lotacaoAtual.carga_horaria}h/semana</Badge>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-background rounded-lg space-y-1 text-sm">
                  <p className="flex items-center gap-2 text-muted-foreground">
                    <AlertCircle className="w-4 h-4" />
                    A lotação atual será encerrada <strong>hoje</strong>
                  </p>
                  <p className="text-muted-foreground ml-6">
                    A nova lotação iniciará <strong>amanhã</strong>
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            Cancelar
          </Button>
          <Button 
            onClick={handleTransferir} 
            disabled={!lotacaoSelecionadaId || !novaEscolaSaesc || isSaving}
          >
            {isSaving ? "Transferindo..." : "Confirmar Transferência"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
