import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, GraduationCap, X, Plus, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Lista de formações conhecidas no sistema
const FORMACOES_DISPONIVEIS = [
  "PEDAGOGIA - ANOS INICIAIS",
  "PEDAGOGIA - EDUCAÇÃO INFANTIL",
  "PEDAGOGIA - CIÊNCIAS",
  "LÍNGUA PORTUGUESA",
  "MATEMÁTICA",
  "HISTÓRIA",
  "GEOGRAFIA",
  "CIÊNCIAS",
  "ARTE",
  "EDUCAÇÃO FÍSICA",
  "LÍNGUA INGLESA",
  "LÍNGUA ESPANHOLA",
  "ENSINO RELIGIOSO",
  "ASSISTENTE DE EDUCAÇÃO INFANTIL",
];

interface EditarFormacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: {
    pessoa_id: string;
    nome_completo: string;
  } | null;
}

export function EditarFormacoesDialog({
  open,
  onOpenChange,
  pessoa,
}: EditarFormacoesDialogProps) {
  const [formacoesSelec, setFormacoesSelec] = useState<string[]>([]);
  const queryClient = useQueryClient();

  // Buscar professor e suas formações atuais
  const { data: professor, isLoading } = useQuery({
    queryKey: ["professor-formacoes", pessoa?.pessoa_id],
    queryFn: async () => {
      if (!pessoa?.pessoa_id) return null;

      // Primeiro buscar o usuario_id da pessoa
      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("pessoa_id", pessoa.pessoa_id)
        .maybeSingle();

      if (usuarioError) throw usuarioError;
      if (!usuario) return null;

      // Buscar professor pelo usuario_id
      const { data: prof, error: profError } = await supabase
        .from("professores")
        .select("id, nome, formacoes")
        .eq("usuario_id", usuario.id)
        .maybeSingle();

      if (profError) throw profError;
      return prof;
    },
    enabled: !!pessoa?.pessoa_id && open,
  });

  // Atualizar formações selecionadas quando professor carregar
  useEffect(() => {
    if (professor?.formacoes) {
      setFormacoesSelec(professor.formacoes as string[]);
    } else {
      setFormacoesSelec([]);
    }
  }, [professor]);

  // Mutation para salvar formações
  const salvarMutation = useMutation({
    mutationFn: async (formacoes: string[]) => {
      if (!professor?.id) throw new Error("Professor não encontrado");

      const { error } = await supabase
        .from("professores")
        .update({ formacoes })
        .eq("id", professor.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["professor-formacoes"] });
      queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
      toast.success("Formações atualizadas com sucesso!");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao atualizar formações");
    },
  });

  const toggleFormacao = (formacao: string) => {
    setFormacoesSelec((prev) =>
      prev.includes(formacao)
        ? prev.filter((f) => f !== formacao)
        : [...prev, formacao]
    );
  };

  const handleSalvar = () => {
    salvarMutation.mutate(formacoesSelec);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5" />
            Formações do Professor
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : !professor ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Professor não encontrado. Verifique se a pessoa possui um registro de professor vinculado.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground mb-2">
                Professor: <span className="font-medium text-foreground">{pessoa?.nome_completo}</span>
              </p>
            </div>

            {/* Formações Selecionadas */}
            {formacoesSelec.length > 0 && (
              <div className="space-y-2">
                <Label>Formações Selecionadas</Label>
                <div className="flex flex-wrap gap-2">
                  {formacoesSelec.map((formacao) => (
                    <Badge
                      key={formacao}
                      variant="default"
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => toggleFormacao(formacao)}
                    >
                      {formacao}
                      <X className="w-3 h-3 ml-1" />
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Lista de Formações Disponíveis */}
            <div className="space-y-2">
              <Label>Selecione as Formações</Label>
              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="space-y-3">
                  {FORMACOES_DISPONIVEIS.map((formacao) => (
                    <div key={formacao} className="flex items-center space-x-3">
                      <Checkbox
                        id={formacao}
                        checked={formacoesSelec.includes(formacao)}
                        onCheckedChange={() => toggleFormacao(formacao)}
                      />
                      <Label
                        htmlFor={formacao}
                        className="text-sm cursor-pointer"
                      >
                        {formacao}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <p className="text-xs text-muted-foreground">
              As formações determinam quais componentes curriculares o professor pode lecionar.
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={salvarMutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSalvar}
            disabled={salvarMutation.isPending || !professor}
          >
            {salvarMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Salvar Formações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
