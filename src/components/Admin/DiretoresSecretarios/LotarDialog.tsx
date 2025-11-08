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
import { useEscolas } from "@/hooks/useEscolas";

interface LotarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: {
    pessoa_id: string;
    nome_completo: string;
  } | null;
  perfil: 'DIRETOR' | 'SECRETARIO' | 'COORDENADOR';
  onConfirm: (data: {
    pessoa_id: string;
    escola_saesc: string;
    data_inicio: string;
    observacoes?: string;
  }) => void;
}

export function LotarDialog({
  open,
  onOpenChange,
  pessoa,
  perfil,
  onConfirm,
}: LotarDialogProps) {
  const escolasQuery = useEscolas();
  const escolas = escolasQuery.data || [];
  const [escolaSaesc, setEscolaSaesc] = useState<string>("");
  
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      data_inicio: new Date().toISOString().split('T')[0],
      observacoes: "",
    },
  });

  const handleClose = () => {
    reset();
    setEscolaSaesc("");
    onOpenChange(false);
  };

  const onSubmit = (data: any) => {
    if (!pessoa || !escolaSaesc) return;

    onConfirm({
      pessoa_id: pessoa.pessoa_id,
      escola_saesc: escolaSaesc,
      data_inicio: data.data_inicio,
      observacoes: data.observacoes,
    });

    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>
            Lotar {perfil === 'DIRETOR' ? 'Diretor(a)' : perfil === 'SECRETARIO' ? 'Secretário(a)' : 'Coordenador(a)'}
          </DialogTitle>
          <DialogDescription>
            {pessoa?.nome_completo}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="escola">Escola *</Label>
            <Select
              value={escolaSaesc}
              onValueChange={setEscolaSaesc}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a escola..." />
              </SelectTrigger>
              <SelectContent>
                {escolas.map(escola => (
                  <SelectItem key={escola.id} value={escola.saesc || ''}>
                    {escola.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_inicio">Data de Início *</Label>
            <Input
              id="data_inicio"
              type="date"
              {...register("data_inicio", { required: true })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Ex: Nomeação por portaria, designação temporária..."
              {...register("observacoes")}
              rows={3}
            />
          </div>

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
              disabled={!escolaSaesc}
            >
              ✅ Confirmar Lotação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
