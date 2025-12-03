import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { usePessoasPool } from "@/hooks/usePessoasPool";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface EditarProfessorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: {
    pessoa_id: string;
    nome_completo: string;
    cpf: string;
    email: string;
    telefone?: string | null;
    data_nascimento?: string | null;
  } | null;
}

export function EditarProfessorDialog({
  open,
  onOpenChange,
  pessoa,
}: EditarProfessorDialogProps) {
  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [dataNascimento, setDataNascimento] = useState<Date | undefined>();

  const { atualizarPessoa, isSaving } = usePessoasPool({ perfil: 'PROFESSOR' });

  useEffect(() => {
    if (pessoa) {
      setNomeCompleto(pessoa.nome_completo);
      setEmail(pessoa.email);
      setTelefone(pessoa.telefone || "");
      setDataNascimento(
        pessoa.data_nascimento ? new Date(pessoa.data_nascimento) : undefined
      );
    }
  }, [pessoa]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pessoa?.pessoa_id) return;

    if (!nomeCompleto.trim() || !email.trim()) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Email inválido");
      return;
    }

    try {
      await atualizarPessoa({
        id: pessoa.pessoa_id,
        dados: {
          nome_completo: nomeCompleto.trim(),
          email: email.trim(),
          telefone: telefone.trim() || null,
          data_nascimento: dataNascimento ? format(dataNascimento, 'yyyy-MM-dd') : null,
        }
      });

      toast.success("Dados atualizados com sucesso!");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao atualizar pessoa:", error);
      toast.error(error.message || "Erro ao atualizar dados");
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Dados do Professor</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_completo">Nome Completo *</Label>
            <Input
              id="nome_completo"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              placeholder="Nome completo do professor"
              disabled={isSaving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={pessoa?.cpf ? pessoa.cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4") : ""}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">O CPF não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              disabled={isSaving}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label>Data de Nascimento</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dataNascimento && "text-muted-foreground"
                  )}
                  disabled={isSaving}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dataNascimento ? (
                    format(dataNascimento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
                  ) : (
                    <span>Selecione uma data</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dataNascimento}
                  onSelect={setDataNascimento}
                  captionLayout="dropdown-buttons"
                  fromYear={1940}
                  toYear={new Date().getFullYear()}
                  disabled={(date) =>
                    date > new Date() || date < new Date("1900-01-01")
                  }
                  initialFocus
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
