import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useEscolas } from "@/hooks/useEscolas";
import { Check } from "lucide-react";

interface TransferirDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: {
    pessoa_id: string;
    nome_completo: string;
    lotacao_atual: {
      escola_saesc: string;
      escola_nome: string;
    } | null;
  } | null;
  perfil: 'DIRETOR' | 'SECRETARIO';
  onConfirm: (data: {
    pessoa_id: string;
    escola_atual_saesc: string;
    nova_escola_saesc: string;
    data_transferencia: string;
    motivo?: string;
  }) => void;
}

export function TransferirDialog({
  open,
  onOpenChange,
  pessoa,
  perfil,
  onConfirm,
}: TransferirDialogProps) {
  const escolasQuery = useEscolas();
  const escolas = escolasQuery.data || [];
  const [novaEscolaSaesc, setNovaEscolaSaesc] = useState<string>("");
  
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      data_transferencia: new Date().toISOString().split('T')[0],
      motivo: "",
    },
  });

  const handleClose = () => {
    reset();
    setNovaEscolaSaesc("");
    onOpenChange(false);
  };

  const onSubmit = (data: any) => {
    if (!pessoa?.lotacao_atual || !novaEscolaSaesc) return;

    onConfirm({
      pessoa_id: pessoa.pessoa_id,
      escola_atual_saesc: pessoa.lotacao_atual.escola_saesc,
      nova_escola_saesc: novaEscolaSaesc,
      data_transferencia: data.data_transferencia,
      motivo: data.motivo,
    });

    handleClose();
  };

  const novaEscola = escolas.find(e => e.saesc === novaEscolaSaesc);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Transferir {pessoa?.nome_completo}
          </DialogTitle>
          <DialogDescription>
            De {pessoa?.lotacao_atual?.escola_nome}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nova_escola">Nova Escola *</Label>
            <Select
              value={novaEscolaSaesc}
              onValueChange={setNovaEscolaSaesc}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a nova escola..." />
              </SelectTrigger>
              <SelectContent>
                {escolas
                  .filter(e => e.saesc !== pessoa?.lotacao_atual?.escola_saesc)
                  .map(escola => (
                    <SelectItem key={escola.id} value={escola.saesc || ''}>
                      {escola.nome}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_transferencia">Data da Transferência *</Label>
            <Input
              id="data_transferencia"
              type="date"
              {...register("data_transferencia", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo</Label>
            <Textarea
              id="motivo"
              placeholder="Ex: Redistribuição de pessoal, solicitação..."
              {...register("motivo")}
              rows={3}
            />
          </div>

          {novaEscola && pessoa?.lotacao_atual && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <p className="font-semibold mb-2">Esta ação irá:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Encerrar lotação em <strong>{pessoa.lotacao_atual.escola_nome}</strong>
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>
                      Criar nova lotação em <strong>{novaEscola.nome}</strong>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!novaEscolaSaesc}
            >
              ✅ Confirmar Transferência
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
