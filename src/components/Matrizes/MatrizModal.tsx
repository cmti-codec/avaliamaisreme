import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import {
  useMatriz,
  useCreateMatriz,
  useUpdateMatriz,
  useComponentesCurriculares,
} from "@/hooks/useMatrizes";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface MatrizModalProps {
  open: boolean;
  onClose: () => void;
  matrizId: string | null;
}

interface ComponenteForm {
  temp_id: string;
  componente_nome: string;
  carga_horaria_semanal: number;
  ordem: number;
}

const ETAPAS_MODALIDADES = [
  "Educacao Infantil",
  "Ensino Fundamental I - Anos Iniciais",
  "Ensino Fundamental II - Anos Finais",
  "EJA",
];

export const MatrizModal = ({ open, onClose, matrizId }: MatrizModalProps) => {
  const { data: matriz, isLoading } = useMatriz(matrizId);
  const { data: componentesDisponiveis } = useComponentesCurriculares();
  const createMutation = useCreateMatriz();
  const updateMutation = useUpdateMatriz();

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [etapaModalidade, setEtapaModalidade] = useState("");
  const [grupoAno, setGrupoAno] = useState("");
  const [tipoJornada, setTipoJornada] = useState<"PARCIAL" | "INTEGRAL">("PARCIAL");
  const [descricao, setDescricao] = useState("");
  const [componentes, setComponentes] = useState<ComponenteForm[]>([]);

  useEffect(() => {
    if (matriz) {
      setCodigo(matriz.codigo);
      setNome(matriz.nome);
      setEtapaModalidade(matriz.etapa_modalidade);
      setGrupoAno(matriz.grupo_ano);
      setTipoJornada(matriz.tipo_jornada || "PARCIAL");
      setDescricao(matriz.descricao || "");
      setComponentes(
        matriz.componentes.map((c) => ({
          temp_id: c.id,
          componente_nome: c.componente_nome,
          carga_horaria_semanal: c.carga_horaria_semanal,
          ordem: c.ordem,
        }))
      );
    } else {
      resetForm();
    }
  }, [matriz]);

  const resetForm = () => {
    setCodigo("");
    setNome("");
    setEtapaModalidade("");
    setGrupoAno("");
    setTipoJornada("PARCIAL");
    setDescricao("");
    setComponentes([]);
  };

  const totalHoras = componentes.reduce((sum, c) => sum + c.carga_horaria_semanal, 0);
  const limiteHoras = tipoJornada === "PARCIAL" ? 20 : 40;
  const excedeHoras = totalHoras > limiteHoras;

  const handleAddComponente = () => {
    setComponentes([
      ...componentes,
      {
        temp_id: `temp_${Date.now()}`,
        componente_nome: "",
        carga_horaria_semanal: 1,
        ordem: componentes.length,
      },
    ]);
  };

  const handleRemoveComponente = (temp_id: string) => {
    setComponentes(componentes.filter((c) => c.temp_id !== temp_id));
  };

  const handleComponenteChange = (
    temp_id: string,
    field: keyof ComponenteForm,
    value: string | number
  ) => {
    setComponentes(
      componentes.map((c) =>
        c.temp_id === temp_id ? { ...c, [field]: value } : c
      )
    );
  };

  const handleSave = async () => {
    // Validações
    if (!codigo || !nome || !etapaModalidade || !grupoAno) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (componentes.length === 0) {
      alert("Adicione pelo menos 1 componente");
      return;
    }

    if (excedeHoras) {
      alert(`Total de horas excede o limite de ${limiteHoras}h para jornada ${tipoJornada}`);
      return;
    }

    // Verificar duplicatas de componentes
    const nomes = componentes.map((c) => c.componente_nome);
    const hasDuplicates = nomes.some((nome, index) => nomes.indexOf(nome) !== index);
    if (hasDuplicates) {
      alert("Não é possível adicionar o mesmo componente mais de uma vez");
      return;
    }

    // Verificar se todos os componentes foram selecionados
    if (componentes.some((c) => !c.componente_nome)) {
      alert("Selecione um componente para cada linha");
      return;
    }

    const matrizData = {
      codigo: codigo.toUpperCase(),
      nome,
      etapa_modalidade: etapaModalidade,
      grupo_ano: grupoAno,
      tipo_jornada: tipoJornada,
      total_horas_semanais: totalHoras,
      descricao: descricao || null,
      ativa: true,
    };

    const componentesData = componentes.map((c) => ({
      componente_nome: c.componente_nome,
      carga_horaria_semanal: c.carga_horaria_semanal,
      ordem: c.ordem,
    }));

    try {
      if (matrizId) {
        await updateMutation.mutateAsync({
          id: matrizId,
          matriz: matrizData,
          componentes: componentesData,
        });
      } else {
        await createMutation.mutateAsync({
          matriz: matrizData,
          componentes: componentesData,
        });
      }
      handleClose();
    } catch (error) {
      // Erro já tratado no hook
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {matrizId ? "Editar Matriz Curricular" : "Nova Matriz Curricular"}
          </DialogTitle>
        </DialogHeader>

        {isLoading && matrizId ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Seção 1: Informações Básicas */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Informações Básicas</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigo">
                    Código <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="codigo"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder="EF1-1ANO-20H"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Ensino Fundamental I - 1º Ano (20h)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="etapa">
                    Etapa/Modalidade <span className="text-destructive">*</span>
                  </Label>
                  <Select value={etapaModalidade} onValueChange={setEtapaModalidade}>
                    <SelectTrigger id="etapa">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ETAPAS_MODALIDADES.map((etapa) => (
                        <SelectItem key={etapa} value={etapa}>
                          {etapa}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="grupo-ano">
                    Grupo/Ano <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="grupo-ano"
                    value={grupoAno}
                    onChange={(e) => setGrupoAno(e.target.value)}
                    placeholder="1º Ano, Grupo 4, Fase Inicial I..."
                  />
                  <p className="text-xs text-muted-foreground">
                    Especifique o ano/série/grupo desta matriz
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>
                  Tipo de Jornada <span className="text-destructive">*</span>
                </Label>
                <RadioGroup
                  value={tipoJornada}
                  onValueChange={(v) => setTipoJornada(v as "PARCIAL" | "INTEGRAL")}
                  className="flex gap-6"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PARCIAL" id="parcial" />
                    <Label htmlFor="parcial" className="font-normal">
                      PARCIAL (4-5 tempos/dia)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="INTEGRAL" id="integral" />
                    <Label htmlFor="integral" className="font-normal">
                      INTEGRAL (8 tempos/dia)
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Observações sobre esta matriz..."
                  rows={3}
                />
              </div>
            </div>

            {/* Seção 2: Componentes Curriculares */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">📚 Componentes da Matriz</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddComponente}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Componente
                </Button>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Ordem</TableHead>
                      <TableHead>Componente Curricular</TableHead>
                      <TableHead className="w-48">Carga Horária Semanal</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {componentes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          Nenhum componente adicionado. Clique em "Adicionar Componente"
                        </TableCell>
                      </TableRow>
                    ) : (
                      componentes.map((comp, index) => (
                        <TableRow key={comp.temp_id}>
                          <TableCell className="text-center font-medium">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={comp.componente_nome}
                              onValueChange={(v) =>
                                handleComponenteChange(comp.temp_id, "componente_nome", v)
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um componente..." />
                              </SelectTrigger>
                              <SelectContent>
                                {componentesDisponiveis?.map((c) => (
                                  <SelectItem key={c.nome} value={c.nome}>
                                    {c.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={comp.carga_horaria_semanal}
                              onChange={(e) =>
                                handleComponenteChange(
                                  comp.temp_id,
                                  "carga_horaria_semanal",
                                  parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveComponente(comp.temp_id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Rodapé do Builder */}
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={excedeHoras ? "destructive" : "default"}
                    className="text-base px-3 py-1"
                  >
                    Total: {totalHoras} horas/semana
                  </Badge>
                  {excedeHoras && (
                    <div className="flex items-center gap-1.5 text-destructive text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Excede o limite de {limiteHoras}h para jornada {tipoJornada}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="ghost" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
