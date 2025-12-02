import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, Users, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useEscolas } from "@/hooks/useEscolas";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface PessoaPool {
  pessoa_id: string;
  nome_completo: string;
  cpf: string;
  email: string;
  usuario_ativo: boolean;
  lotacoes_ativas: any[];
}

interface AtribuirCargaLoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoas: PessoaPool[];
}

export function AtribuirCargaLoteDialog({
  open,
  onOpenChange,
  pessoas,
}: AtribuirCargaLoteDialogProps) {
  const [selectedPessoas, setSelectedPessoas] = useState<Set<string>>(new Set());
  const [cargaHoraria, setCargaHoraria] = useState<number>(20);
  const [escolaId, setEscolaId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: escolas = [] } = useEscolas();
  const queryClient = useQueryClient();

  // Filtrar apenas professores que precisam de carga ou têm carga 0/null
  const professoresDisponiveis = useMemo(() => {
    return pessoas.filter((p) => {
      // Calcular carga atual
      const cargaAtual = (p.lotacoes_ativas || [])
        .filter((lot: any) => lot.perfil === "PROFESSOR")
        .reduce((sum: number, lot: any) => sum + (lot.carga_horaria || 0), 0);
      
      // Incluir se tem espaço para mais carga (< 50h)
      return cargaAtual < 50;
    });
  }, [pessoas]);

  // Filtrar por busca
  const filteredPessoas = useMemo(() => {
    if (!searchTerm) return professoresDisponiveis;
    const term = searchTerm.toLowerCase();
    return professoresDisponiveis.filter(
      (p) =>
        p.nome_completo.toLowerCase().includes(term) ||
        p.cpf.includes(term) ||
        p.email.toLowerCase().includes(term)
    );
  }, [professoresDisponiveis, searchTerm]);

  const getCargaAtual = (pessoa: PessoaPool) => {
    return (pessoa.lotacoes_ativas || [])
      .filter((lot: any) => lot.perfil === "PROFESSOR")
      .reduce((sum: number, lot: any) => sum + (lot.carga_horaria || 0), 0);
  };

  const handleTogglePessoa = (pessoaId: string) => {
    const newSelected = new Set(selectedPessoas);
    if (newSelected.has(pessoaId)) {
      newSelected.delete(pessoaId);
    } else {
      newSelected.add(pessoaId);
    }
    setSelectedPessoas(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedPessoas.size === filteredPessoas.length) {
      setSelectedPessoas(new Set());
    } else {
      setSelectedPessoas(new Set(filteredPessoas.map((p) => p.pessoa_id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedPessoas.size === 0) {
      toast.error("Selecione pelo menos um professor");
      return;
    }

    if (!escolaId) {
      toast.error("Selecione uma escola");
      return;
    }

    if (cargaHoraria < 1 || cargaHoraria > 50) {
      toast.error("A carga horária deve ser entre 1 e 50 horas");
      return;
    }

    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    try {
      for (const pessoaId of selectedPessoas) {
        const pessoa = pessoas.find((p) => p.pessoa_id === pessoaId);
        if (!pessoa) continue;

        const cargaAtual = getCargaAtual(pessoa);
        const novaCargaTotal = cargaAtual + cargaHoraria;

        if (novaCargaTotal > 50) {
          errors.push(`${pessoa.nome_completo}: excederia 50h (atual: ${cargaAtual}h)`);
          errorCount++;
          continue;
        }

        // Verificar se já tem lotação nesta escola
        const lotacaoExistente = (pessoa.lotacoes_ativas || []).find(
          (lot: any) => lot.escola_saesc === escolaId && lot.perfil === "PROFESSOR"
        );

        if (lotacaoExistente) {
          // Atualizar lotação existente
          const { error } = await supabase
            .from("lotacoes")
            .update({ 
              carga_horaria: (lotacaoExistente.carga_horaria || 0) + cargaHoraria,
              updated_at: new Date().toISOString()
            })
            .eq("id", lotacaoExistente.id);

          if (error) {
            errors.push(`${pessoa.nome_completo}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        } else {
          // Criar nova lotação
          const { error } = await supabase.from("lotacoes").insert({
            pessoa_id: pessoaId,
            escola_saesc: escolaId,
            perfil: "PROFESSOR",
            carga_horaria: cargaHoraria,
            ano_letivo: "2025",
            data_inicio: new Date().toISOString().split("T")[0],
            ativo: true,
            status: "ATIVO",
          });

          if (error) {
            errors.push(`${pessoa.nome_completo}: ${error.message}`);
            errorCount++;
          } else {
            successCount++;
          }
        }
      }

      // Mostrar resultado
      if (successCount > 0) {
        toast.success(`${successCount} professor(es) atualizado(s) com sucesso`);
        queryClient.invalidateQueries({ queryKey: ["pessoas-pool"] });
        queryClient.invalidateQueries({ queryKey: ["lotacoes"] });
      }

      if (errorCount > 0) {
        toast.error(`${errorCount} erro(s) ao processar`, {
          description: errors.slice(0, 3).join("\n"),
        });
      }

      if (successCount > 0 && errorCount === 0) {
        onOpenChange(false);
        resetForm();
      }
    } catch (error: any) {
      toast.error("Erro ao processar lote", { description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setSelectedPessoas(new Set());
    setCargaHoraria(20);
    setEscolaId("");
    setSearchTerm("");
  };

  // Calcular estatísticas
  const selectedCount = selectedPessoas.size;
  const totalCargaAtribuida = selectedCount * cargaHoraria;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Atribuir Carga Horária em Lote
          </DialogTitle>
          <DialogDescription>
            Selecione os professores e defina a carga horária a ser atribuída
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Configuração */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="escola">Escola *</Label>
              <Select value={escolaId} onValueChange={setEscolaId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a escola" />
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

            <div className="space-y-2">
              <Label htmlFor="carga">Carga Horária (por professor) *</Label>
              <Input
                id="carga"
                type="number"
                min={1}
                max={50}
                value={cargaHoraria}
                onChange={(e) => setCargaHoraria(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Busca e seleção */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Professores Disponíveis ({filteredPessoas.length})</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
              >
                {selectedPessoas.size === filteredPessoas.length
                  ? "Desmarcar todos"
                  : "Selecionar todos"}
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Lista de professores */}
          <ScrollArea className="h-[300px] border rounded-md">
            <div className="p-2 space-y-1">
              {filteredPessoas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum professor disponível</p>
                </div>
              ) : (
                filteredPessoas.map((pessoa) => {
                  const cargaAtual = getCargaAtual(pessoa);
                  const novaCarga = cargaAtual + cargaHoraria;
                  const excede = novaCarga > 50;

                  return (
                    <div
                      key={pessoa.pessoa_id}
                      className={`flex items-center gap-3 p-2 rounded hover:bg-muted/50 ${
                        excede ? "opacity-50" : ""
                      }`}
                    >
                      <Checkbox
                        checked={selectedPessoas.has(pessoa.pessoa_id)}
                        onCheckedChange={() => handleTogglePessoa(pessoa.pessoa_id)}
                        disabled={excede}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{pessoa.nome_completo}</p>
                        <p className="text-sm text-muted-foreground">{pessoa.email}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={cargaAtual === 0 ? "outline" : "secondary"}
                          className="text-xs"
                        >
                          {cargaAtual}h atual
                        </Badge>
                        {excede && (
                          <p className="text-xs text-destructive mt-1">
                            Excederia 50h
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Resumo */}
          {selectedCount > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {selectedCount} professor(es) selecionado(s)
                </span>
              </div>
              <span className="text-sm text-muted-foreground">
                Total a atribuir: {totalCargaAtribuida}h
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSaving || selectedCount === 0 || !escolaId}
          >
            {isSaving ? "Processando..." : `Atribuir a ${selectedCount} professor(es)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
