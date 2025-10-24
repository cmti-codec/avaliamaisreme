import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useMatriz, useDeleteMatriz } from "@/hooks/useMatrizes";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface MatrizDeleteDialogProps {
  open: boolean;
  onClose: () => void;
  matrizId: string | null;
}

export const MatrizDeleteDialog = ({ open, onClose, matrizId }: MatrizDeleteDialogProps) => {
  const { data: matriz } = useMatriz(matrizId);
  const deleteMutation = useDeleteMatriz();
  const [escolasUsando, setEscolasUsando] = useState<any[]>([]);
  const [turmasUsando, setTurmasUsando] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && matrizId) {
      fetchUsage();
    }
  }, [open, matrizId]);

  const fetchUsage = async () => {
    if (!matrizId) return;

    setLoading(true);
    try {
      // Buscar escolas que usam esta matriz
      const { data: escolas } = await supabase
        .from("escolas")
        .select("nome")
        .eq("matriz_curricular_id", matrizId);

      setEscolasUsando(escolas || []);

      // Buscar turmas nas escolas que usam esta matriz
      if (escolas && escolas.length > 0) {
        const { count } = await supabase
          .from("turmas")
          .select("id", { count: "exact", head: true })
          .in(
            "escola_id",
            escolas.map((e: any) => e.id)
          );

        setTurmasUsando(count || 0);
      } else {
        setTurmasUsando(0);
      }
    } catch (error) {
      console.error("Erro ao buscar uso da matriz:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!matrizId) return;

    try {
      await deleteMutation.mutateAsync(matrizId);
      onClose();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  if (!open || !matriz) return null;

  const temUso = escolasUsando.length > 0;

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl">
              {temUso ? "Inativar Matriz?" : "Excluir Matriz?"}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-4">
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ) : (
              <>
                <p className="text-foreground font-medium">
                  Tem certeza que deseja {temUso ? "inativar" : "excluir"} a matriz{" "}
                  <span className="font-bold">{matriz.nome}</span>?
                </p>

                {temUso ? (
                  <>
                    <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                      <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                        Esta matriz está sendo usada por:
                      </p>
                      <ul className="text-sm text-amber-800 dark:text-amber-200 list-disc list-inside space-y-1">
                        <li>
                          <strong>{escolasUsando.length}</strong>{" "}
                          {escolasUsando.length === 1 ? "escola" : "escolas"}
                        </li>
                        <li>
                          <strong>{turmasUsando}</strong>{" "}
                          {turmasUsando === 1 ? "turma" : "turmas"}
                        </li>
                      </ul>
                    </div>

                    {escolasUsando.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Escolas afetadas:</p>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {escolasUsando.slice(0, 5).map((escola: any, index: number) => (
                            <li key={index}>• {escola.nome}</li>
                          ))}
                          {escolasUsando.length > 5 && (
                            <li className="text-xs italic">
                              ... e mais {escolasUsando.length - 5}{" "}
                              {escolasUsando.length - 5 === 1 ? "escola" : "escolas"}
                            </li>
                          )}
                        </ul>
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      Como esta matriz está em uso, ela será{" "}
                      <strong>inativada</strong> ao invés de excluída. Você poderá
                      reativá-la posteriormente se necessário.
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Esta matriz não está sendo usada por nenhuma escola ou turma e será{" "}
                    <strong>excluída permanentemente</strong>. Esta ação não pode ser desfeita.
                  </p>
                )}
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || loading}
          >
            {deleteMutation.isPending ? "Processando..." : temUso ? "Inativar" : "🗑️ Excluir"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
