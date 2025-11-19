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
import { Badge } from "@/components/ui/badge";

interface LotarUsuarioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: {
    id: string;
    nome: string;
    email: string;
    roles: string[];
    pessoa_id?: string | null;
  } | null;
  onConfirm: (data: {
    pessoa_id: string;
    perfil: string;
    escola_saesc: string;
    data_inicio: string;
    carga_horaria?: number | null;
    observacoes?: string;
  }) => void;
}

const getPerfilLabel = (perfil: string) => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    GESTOR_SEMED: 'Gestor SEMED',
    TECNICO_SEMED: 'Técnico SEMED',
    DIRETOR: 'Diretor',
    SECRETARIO: 'Secretário',
    COORDENADOR: 'Coordenador',
    PROFESSOR: 'Professor',
  };
  return labels[perfil] || perfil;
};

export function LotarUsuarioDialog({
  open,
  onOpenChange,
  usuario,
  onConfirm,
}: LotarUsuarioDialogProps) {
  const escolasQuery = useEscolas();
  const escolas = escolasQuery.data || [];
  const [escolaSaesc, setEscolaSaesc] = useState<string>("");
  const [perfilSelecionado, setPerfilSelecionado] = useState<string>("");
  
  const { register, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      data_inicio: new Date().toISOString().split('T')[0],
      carga_horaria: null as number | null,
      observacoes: "",
    },
  });

  const handleClose = () => {
    reset();
    setEscolaSaesc("");
    setPerfilSelecionado("");
    onOpenChange(false);
  };

  const onSubmit = (data: any) => {
    if (!usuario?.pessoa_id || !escolaSaesc || !perfilSelecionado) {
      return;
    }

    onConfirm({
      pessoa_id: usuario.pessoa_id,
      perfil: perfilSelecionado,
      escola_saesc: escolaSaesc,
      data_inicio: data.data_inicio,
      carga_horaria: data.carga_horaria || null,
      observacoes: data.observacoes,
    });

    handleClose();
  };

  const isProfessor = perfilSelecionado === 'PROFESSOR';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar Nova Lotação</DialogTitle>
          <DialogDescription>
            {usuario?.nome} ({usuario?.email})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Perfis Disponíveis</Label>
            <div className="flex flex-wrap gap-2">
              {usuario?.roles?.map((role) => (
                <Badge key={role} variant="outline">
                  {getPerfilLabel(role)}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil para Lotar *</Label>
            <Select
              value={perfilSelecionado}
              onValueChange={setPerfilSelecionado}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o perfil..." />
              </SelectTrigger>
              <SelectContent>
                {usuario?.roles?.map((role) => (
                  <SelectItem key={role} value={role}>
                    {getPerfilLabel(role)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                {escolas.map((escola) => (
                  <SelectItem key={escola.id} value={escola.saesc || ''}>
                    {escola.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data_inicio">Data de Início *</Label>
              <Input
                id="data_inicio"
                type="date"
                {...register("data_inicio", { required: true })}
              />
            </div>

            {isProfessor && (
              <div className="space-y-2">
                <Label htmlFor="carga_horaria">Carga Horária (h)</Label>
                <Input
                  id="carga_horaria"
                  type="number"
                  min="0"
                  max="50"
                  placeholder="Ex: 20, 40..."
                  {...register("carga_horaria", { 
                    valueAsNumber: true,
                    min: 0,
                    max: 50 
                  })}
                />
              </div>
            )}
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
              disabled={!escolaSaesc || !perfilSelecionado}
            >
              ✅ Confirmar Lotação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
