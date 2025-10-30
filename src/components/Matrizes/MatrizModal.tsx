import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ChevronDown, Edit3 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useMatriz,
  useCreateMatriz,
  useUpdateMatriz,
  useComponentesCurriculares,
} from "@/hooks/useMatrizes";
import { useCargasHorarias, getCargaHoraria } from "@/hooks/useCargasHorarias";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Alert, AlertDescription } from "@/components/ui/alert";

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

interface AnoForm {
  nome: string;
  componentes: ComponenteForm[];
  isOpen: boolean;
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
  const { data: cargasHorarias } = useCargasHorarias();
  const createMutation = useCreateMatriz();
  const updateMutation = useUpdateMatriz();

  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [etapaModalidade, setEtapaModalidade] = useState("");
  const [tipoJornada, setTipoJornada] = useState<"PARCIAL" | "INTEGRAL" | "MISTO">("PARCIAL");
  const [descricao, setDescricao] = useState("");
  const [anos, setAnos] = useState<AnoForm[]>([]);
  const [modoEdicao, setModoEdicao] = useState(true);

  useEffect(() => {
    if (matriz) {
      setCodigo(matriz.codigo);
      setNome(matriz.nome);
      setEtapaModalidade(matriz.etapa_modalidade);
      setTipoJornada(matriz.tipo_jornada || "PARCIAL");
      setDescricao(matriz.descricao || "");
      
      // Agrupar componentes por ano
      const componentesPorAno = matriz.componentes.reduce((acc, comp) => {
        if (!acc[comp.grupo_ano]) {
          acc[comp.grupo_ano] = [];
        }
        acc[comp.grupo_ano].push({
          temp_id: comp.id,
          componente_nome: comp.componente_nome,
          carga_horaria_semanal: comp.carga_horaria_semanal,
          ordem: comp.ordem,
        });
        return acc;
      }, {} as Record<string, ComponenteForm[]>);

      const anosForm = Object.entries(componentesPorAno).map(([nomeAno, componentes]) => ({
        nome: nomeAno,
        componentes: componentes.sort((a, b) => a.ordem - b.ordem),
        isOpen: true,
      }));

      setAnos(anosForm);
    } else {
      resetForm();
    }
  }, [matriz]);

  const resetForm = () => {
    setCodigo("");
    setNome("");
    setEtapaModalidade("");
    setTipoJornada("PARCIAL");
    setDescricao("");
    setAnos([]);
    setModoEdicao(true);
  };

  const totalHoras = anos.reduce((sum, ano) => {
    return sum + ano.componentes.reduce((s, c) => s + c.carga_horaria_semanal, 0);
  }, 0);
  
  const limiteHoras = tipoJornada === "PARCIAL" ? 20 : 40;
  const totalComponentes = anos.reduce((sum, ano) => sum + ano.componentes.length, 0);

  const handleAddAno = () => {
    const novoNumero = anos.length + 1;
    setAnos([
      ...anos,
      {
        nome: `${novoNumero}º ANO`,
        componentes: [],
        isOpen: true,
      },
    ]);
  };

  const handleRemoveAno = (index: number) => {
    setAnos(anos.filter((_, i) => i !== index));
  };

  const handleAnoNameChange = (index: number, novoNome: string) => {
    setAnos(
      anos.map((ano, i) => (i === index ? { ...ano, nome: novoNome } : ano))
    );
  };

  const handleToggleAno = (index: number) => {
    setAnos(
      anos.map((ano, i) => (i === index ? { ...ano, isOpen: !ano.isOpen } : ano))
    );
  };

  const handleToggleComponente = (anoIndex: number, componenteNome: string) => {
    const updatedAnos = [...anos];
    const ano = updatedAnos[anoIndex];
    const existe = ano.componentes.find(c => c.componente_nome === componenteNome);

    if (existe) {
      // Remover
      ano.componentes = ano.componentes.filter(c => c.componente_nome !== componenteNome);
    } else {
      // Buscar carga horária correspondente da tabela
      const cargaImportada = getCargaHoraria(
        cargasHorarias,
        componenteNome,
        etapaModalidade,
        ano.nome
      );
      
      // Adicionar com carga horária importada ou padrão (1h)
      ano.componentes.push({
        temp_id: `temp_${Date.now()}`,
        componente_nome: componenteNome,
        carga_horaria_semanal: cargaImportada || 1,
        ordem: ano.componentes.length,
      });
    }
    setAnos(updatedAnos);
  };

  const handleRemoveComponente = (anoIndex: number, temp_id: string) => {
    const updatedAnos = [...anos];
    updatedAnos[anoIndex].componentes = updatedAnos[anoIndex].componentes.filter(
      (c) => c.temp_id !== temp_id
    );
    setAnos(updatedAnos);
  };

  const handleComponenteChange = (
    anoIndex: number,
    temp_id: string,
    field: keyof ComponenteForm,
    value: string | number
  ) => {
    const updatedAnos = [...anos];
    updatedAnos[anoIndex].componentes = updatedAnos[anoIndex].componentes.map((c) =>
      c.temp_id === temp_id ? { ...c, [field]: value } : c
    );
    setAnos(updatedAnos);
  };

  const handleSave = async () => {
    // Validações
    if (!codigo || !nome || !etapaModalidade) {
      alert("Preencha todos os campos obrigatórios");
      return;
    }

    if (anos.length === 0) {
      alert("Adicione pelo menos 1 ano à matriz");
      return;
    }

    // Verificar se todos os anos têm nome
    if (anos.some((ano) => !ano.nome.trim())) {
      alert("Todos os anos devem ter um nome");
      return;
    }

    // Verificar se todos os anos têm componentes
    if (anos.some((ano) => ano.componentes.length === 0)) {
      alert("Todos os anos devem ter pelo menos 1 componente");
      return;
    }

    // Verificar se todos os componentes foram selecionados
    for (const ano of anos) {
      if (ano.componentes.some((c) => !c.componente_nome)) {
        alert(`Selecione um componente para cada linha em ${ano.nome}`);
        return;
      }

      // Verificar duplicatas de componentes dentro do mesmo ano
      const nomes = ano.componentes.map((c) => c.componente_nome);
      const hasDuplicates = nomes.some((nome, index) => nomes.indexOf(nome) !== index);
      if (hasDuplicates) {
        alert(`Não é possível adicionar o mesmo componente mais de uma vez em ${ano.nome}`);
        return;
      }
    }

    // Verificar carga horária por ano
    for (const ano of anos) {
      const horasAno = ano.componentes.reduce((sum, c) => sum + c.carga_horaria_semanal, 0);
      if (horasAno > limiteHoras) {
        alert(`${ano.nome}: Total de horas (${horasAno}h) excede o limite de ${limiteHoras}h para jornada ${tipoJornada}`);
        return;
      }
    }

    const grupoAnoStr = anos.map(a => a.nome).join(", ");
    
    const matrizData = {
      codigo: codigo.toUpperCase(),
      nome,
      etapa_modalidade: etapaModalidade,
      grupo_ano: grupoAnoStr, // Armazena todos os anos como string separada por vírgula
      tipo_jornada: tipoJornada,
      total_horas_semanais: Math.max(...anos.map(ano => 
        ano.componentes.reduce((sum, c) => sum + c.carga_horaria_semanal, 0)
      )),
      descricao: descricao || null,
      ativa: true,
    };

    // Flatten todos os componentes de todos os anos
    const componentesData = anos.flatMap((ano) =>
      ano.componentes.map((c) => ({
        componente_nome: c.componente_nome,
        carga_horaria_semanal: c.carga_horaria_semanal,
        ordem: c.ordem,
        grupo_ano: ano.nome, // Adiciona o grupo_ano aqui
      }))
    );

    try {
      if (matrizId) {
        await updateMutation.mutateAsync({
          id: matrizId,
          matriz: matrizData as any,
          componentes: componentesData,
        });
      } else {
        await createMutation.mutateAsync({
          matriz: matrizData as any,
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
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                    placeholder="EF1-1A5-PARCIAL"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">
                    Nome da Matriz <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Matriz Padrão EF I"
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
                  <Label>
                    Tipo de Jornada <span className="text-destructive">*</span>
                  </Label>
                  <RadioGroup
                    value={tipoJornada}
                    onValueChange={(v) => setTipoJornada(v as "PARCIAL" | "INTEGRAL" | "MISTO")}
                    className="flex gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="PARCIAL" id="parcial" />
                      <Label htmlFor="parcial" className="font-normal">
                        PARCIAL (até 20h)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="INTEGRAL" id="integral" />
                      <Label htmlFor="integral" className="font-normal">
                        INTEGRAL (até 40h)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="MISTO" id="misto" />
                      <Label htmlFor="misto" className="font-normal">
                        PARCIAL + INTEGRAL
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva as especificidades desta matriz..."
                  rows={2}
                />
              </div>

              {matrizId && (
                <Alert>
                  <AlertDescription>
                    <span className="font-semibold">Matriz ativa (disponível para uso)</span>
                  </AlertDescription>
                </Alert>
              )}
            </div>

              {/* Seção 2: Componentes da Matriz */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Componentes da Matriz</h3>
                  <p className="text-sm text-muted-foreground">
                    {modoEdicao ? "Selecione os componentes para cada ano" : "Visualização dos componentes configurados"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className="text-sm">
                    {totalComponentes} componente(s)
                  </Badge>
                  <Badge className="text-sm">
                    {anos.length} ano(s)
                  </Badge>
                  <div className="flex items-center gap-2 ml-2 pl-2 border-l">
                    <Label htmlFor="modo-edicao" className="text-sm font-medium cursor-pointer">
                      {modoEdicao ? "Modo Edição" : "Modo Visualização"}
                    </Label>
                    <Switch
                      id="modo-edicao"
                      checked={modoEdicao}
                      onCheckedChange={setModoEdicao}
                    />
                    <Edit3 className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </div>

              {modoEdicao && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAno}
                  className="w-full gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar Ano
                </Button>
              )}

              {/* Lista de Anos */}
              <div className="space-y-3">
                {anos.map((ano, anoIndex) => (
                  <Collapsible
                    key={anoIndex}
                    open={ano.isOpen}
                    onOpenChange={() => handleToggleAno(anoIndex)}
                  >
                    <div className="border rounded-lg bg-muted/30">
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-3">
                            <ChevronDown
                              className={`w-5 h-5 transition-transform ${
                                ano.isOpen ? "" : "-rotate-90"
                              }`}
                            />
                            {modoEdicao ? (
                              <Input
                                value={ano.nome}
                                onChange={(e) => {
                                  e.stopPropagation();
                                  handleAnoNameChange(anoIndex, e.target.value);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-48 h-8"
                                placeholder="Nome do ano"
                              />
                            ) : (
                              <span className="font-semibold">{ano.nome}</span>
                            )}
                            <Badge variant="secondary">
                              {ano.componentes.length} componentes
                            </Badge>
                            <Badge>
                              {ano.componentes.reduce((sum, c) => sum + c.carga_horaria_semanal, 0)}h total
                            </Badge>
                          </div>
                          {modoEdicao && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAno(anoIndex);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </CollapsibleTrigger>

                      <CollapsibleContent>
                        <div className="p-4 border-t space-y-3">
                          {modoEdicao ? (
                            <>
                              {/* Lista de checkboxes para selecionar componentes */}
                              <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                                {componentesDisponiveis?.map((componente) => {
                                  const selecionado = ano.componentes.some(
                                    c => c.componente_nome === componente.nome
                                  );
                                  return (
                                    <div key={componente.nome} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`${anoIndex}-${componente.nome}`}
                                        checked={selecionado}
                                        onCheckedChange={() => handleToggleComponente(anoIndex, componente.nome)}
                                      />
                                      <label
                                        htmlFor={`${anoIndex}-${componente.nome}`}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {componente.nome}
                                      </label>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Tabela de componentes selecionados com h/semana editável */}
                              {ano.componentes.length > 0 && (
                                <div className="space-y-2">
                                  <Label className="text-sm font-semibold">
                                    Componentes Selecionados ({ano.componentes.length})
                                  </Label>
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Componente</TableHead>
                                        <TableHead className="w-32">h/semana</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {ano.componentes
                                        .sort((a, b) => a.componente_nome.localeCompare(b.componente_nome))
                                        .map((comp, compIndex) => (
                                          <TableRow key={comp.temp_id}>
                                            <TableCell className="text-center font-medium text-muted-foreground">
                                              {compIndex + 1}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                              {comp.componente_nome}
                                            </TableCell>
                                            <TableCell>
                                              <Input
                                                type="number"
                                                min={1}
                                                max={20}
                                                value={comp.carga_horaria_semanal}
                                                onChange={(e) =>
                                                  handleComponenteChange(
                                                    anoIndex,
                                                    comp.temp_id,
                                                    "carga_horaria_semanal",
                                                    parseInt(e.target.value) || 1
                                                  )
                                                }
                                                className="w-20"
                                              />
                                            </TableCell>
                                          </TableRow>
                                        ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </>
                          ) : (
                            /* Modo visualização */
                            ano.componentes.length > 0 && (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="w-12">#</TableHead>
                                    <TableHead>Componente</TableHead>
                                    <TableHead className="w-32 text-center">h/semana</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {ano.componentes
                                    .sort((a, b) => a.componente_nome.localeCompare(b.componente_nome))
                                    .map((comp, compIndex) => (
                                      <TableRow key={comp.temp_id}>
                                        <TableCell className="text-center font-medium text-muted-foreground">
                                          {compIndex + 1}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {comp.componente_nome}
                                        </TableCell>
                                        <TableCell className="text-center">
                                          <Badge variant="outline">{comp.carga_horaria_semanal}h</Badge>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
                            )
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                ))}
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
                {createMutation.isPending || updateMutation.isPending
                  ? "Salvando..."
                  : "Salvar Matriz"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
