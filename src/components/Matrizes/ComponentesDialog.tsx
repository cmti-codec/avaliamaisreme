import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, BookOpen } from "lucide-react";
import { useComponentes, useCreateComponente } from "@/hooks/useComponentes";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface ComponentesDialogProps {
  open: boolean;
  onClose: () => void;
}

const ETAPAS_MODALIDADES = [
  "Educação Infantil",
  "Anos Iniciais",
  "Anos Finais",
  "EJA",
];

export function ComponentesDialog({ open, onClose }: ComponentesDialogProps) {
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome] = useState("");
  const [sigla, setSigla] = useState("");
  const [etapas, setEtapas] = useState<string[]>([]);

  const { data: componentes, isLoading } = useComponentes();
  const createComponente = useCreateComponente();

  const handleToggleEtapa = (etapa: string) => {
    setEtapas((prev) =>
      prev.includes(etapa)
        ? prev.filter((e) => e !== etapa)
        : [...prev, etapa]
    );
  };

  const handleSubmit = async () => {
    if (!nome.trim()) return;

    await createComponente.mutateAsync({
      nome: nome.trim(),
      sigla: sigla.trim() || nome.trim().substring(0, 3).toUpperCase(),
      segmentos: etapas,
    });

    // Reset form
    setNome("");
    setSigla("");
    setEtapas([]);
    setShowForm(false);
  };

  const handleCancel = () => {
    setNome("");
    setSigla("");
    setEtapas([]);
    setShowForm(false);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar Componentes Curriculares</DialogTitle>
          <DialogDescription>
            Visualize e adicione novos componentes curriculares para a rede
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Lista de componentes existentes */}
          {!showForm && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Componentes Cadastrados
                </h3>
                <Button onClick={() => setShowForm(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Componente
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : (
                <div className="grid gap-2 max-h-[400px] overflow-y-auto">
                  {componentes?.map((componente) => (
                    <div
                      key={componente.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{componente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            Sigla: {componente.sigla || "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1 flex-wrap justify-end max-w-[300px]">
                        {componente.segmentos?.map((segmento) => (
                          <Badge key={segmento} variant="secondary">
                            {segmento}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                  {componentes?.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum componente cadastrado
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Formulário de novo componente */}
          {showForm && (
            <div className="space-y-4 border rounded-lg p-4 bg-accent/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Novo Componente</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome do Componente *</Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ex: Matemática, Língua Portuguesa..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sigla">Sigla</Label>
                  <Input
                    id="sigla"
                    value={sigla}
                    onChange={(e) => setSigla(e.target.value)}
                    placeholder="Ex: MAT, PORT..."
                    maxLength={10}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Etapa/Modalidade *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {ETAPAS_MODALIDADES.map((etapa) => (
                      <div key={etapa} className="flex items-center space-x-2">
                        <Checkbox
                          id={etapa}
                          checked={etapas.includes(etapa)}
                          onCheckedChange={() => handleToggleEtapa(etapa)}
                        />
                        <Label
                          htmlFor={etapa}
                          className="text-sm font-normal cursor-pointer"
                        >
                          {etapa}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!nome.trim() || etapas.length === 0 || createComponente.isPending}
                  className="w-full"
                >
                  {createComponente.isPending ? "Salvando..." : "Salvar Componente"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
