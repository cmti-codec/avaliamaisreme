import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Professor {
  id: string;
  nome: string;
  email: string | null;
  cpf: string | null;
  matricula: string | null;
  telefone: string | null;
  formacoes: string[] | null;
  ativo: boolean;
}

interface ProfessorREMEEditDialogProps {
  professor: Professor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfessorREMEEditDialog({ professor, open, onOpenChange }: ProfessorREMEEditDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [cpf, setCpf] = useState("");
  const [matricula, setMatricula] = useState("");
  const [telefone, setTelefone] = useState("");
  const [formacoes, setFormacoes] = useState<string[]>([]);
  const [novaFormacao, setNovaFormacao] = useState("");

  useEffect(() => {
    if (professor && open) {
      setCpf(professor.cpf || "");
      setMatricula(professor.matricula || "");
      setTelefone(professor.telefone || "");
      setFormacoes(professor.formacoes || []);
    }
  }, [professor, open]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!professor) return;

      const { error } = await supabase
        .from("professores")
        .update({
          cpf: cpf.trim() || null,
          matricula: matricula.trim() || null,
          telefone: telefone.trim() || null,
          formacoes: formacoes.length > 0 ? formacoes : null,
        })
        .eq("id", professor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professores-reme"] });
      toast({
        title: "Professor atualizado",
        description: "Os dados foram salvos com sucesso.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddFormacao = () => {
    if (novaFormacao.trim()) {
      setFormacoes([...formacoes, novaFormacao.trim()]);
      setNovaFormacao("");
    }
  };

  const handleRemoveFormacao = (index: number) => {
    setFormacoes(formacoes.filter((_, i) => i !== index));
  };

  if (!professor) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Professor</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Nome</Label>
            <Input value={professor.nome} disabled />
          </div>

          <div>
            <Label className="text-muted-foreground">Email</Label>
            <Input value={professor.email || "-"} disabled />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={matricula}
                onChange={(e) => setMatricula(e.target.value)}
                placeholder="Ex: 12345"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>

          <div>
            <Label>Formações</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={novaFormacao}
                onChange={(e) => setNovaFormacao(e.target.value)}
                placeholder="Ex: Licenciatura em Matemática"
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFormacao();
                  }
                }}
              />
              <Button type="button" onClick={handleAddFormacao} variant="secondary">
                Adicionar
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formacoes.map((formacao, index) => (
                <Badge key={index} variant="secondary" className="gap-1">
                  {formacao}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveFormacao(index)}
                  />
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => updateMutation.mutate()} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
