import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Plus, RefreshCw, Eye, AlertTriangle, UserPlus, Edit } from "lucide-react";
import { usePessoasPool } from "@/hooks/usePessoasPool";
import { NovaLotacaoDialog } from "@/components/Admin/Pool/NovaLotacaoDialog";
import { TransferirProfessorDialog } from "@/components/Admin/Pool/TransferirProfessorDialog";
import { NovoProfessorDialog } from "@/components/Admin/Pool/NovoProfessorDialog";
import { ProfessorDetalhesDialog } from "@/components/Admin/Pool/ProfessorDetalhesDialog";
import { EditarProfessorDialog } from "@/components/Admin/Pool/EditarProfessorDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function PoolProfessores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "ativos" | "inativos">("todos");
  const [lotacaoFilter, setLotacaoFilter] = useState<"todos" | "lotado" | "disponivel">("todos");
  
  const [showNovaLotacaoDialog, setShowNovaLotacaoDialog] = useState(false);
  const [showTransferirDialog, setShowTransferirDialog] = useState(false);
  const [showNovoProfessorDialog, setShowNovoProfessorDialog] = useState(false);
  const [showDetalhesDialog, setShowDetalhesDialog] = useState(false);
  const [showEditarDialog, setShowEditarDialog] = useState(false);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<any>(null);

  const { pessoas, isLoading } = usePessoasPool({
    busca: searchTerm,
    status: statusFilter,
    lotacao: lotacaoFilter === "todos" ? "todos" : (lotacaoFilter === "lotado" ? "com_lotacao" : "sem_lotacao"),
    perfil: "PROFESSOR"
  });

  const handleLotar = (pessoa: any) => {
    setPessoaSelecionada(pessoa);
    setShowNovaLotacaoDialog(true);
  };

  const handleTransferir = (pessoa: any) => {
    setPessoaSelecionada(pessoa);
    setShowTransferirDialog(true);
  };

  const handleVerDetalhes = (pessoa: any) => {
    setPessoaSelecionada(pessoa);
    setShowDetalhesDialog(true);
  };

  const handleEditar = (pessoa: any) => {
    setPessoaSelecionada(pessoa);
    setShowEditarDialog(true);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const getCargaTotalProfessor = (pessoa: any) => {
    if (!pessoa.lotacoes_ativas || pessoa.lotacoes_ativas.length === 0) return 0;
    return pessoa.lotacoes_ativas.reduce((total: number, lot: any) => {
      return total + (lot.carga_horaria || 0);
    }, 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Professores (REME)</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie professores da REME e suas lotações nas escolas da rede
          </p>
        </div>
        <Button onClick={() => setShowNovoProfessorDialog(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Cadastrar Professor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="ativos">Apenas ativos</SelectItem>
                <SelectItem value="inativos">Apenas inativos</SelectItem>
              </SelectContent>
            </Select>

            <Select value={lotacaoFilter} onValueChange={(v) => setLotacaoFilter(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas lotações</SelectItem>
                <SelectItem value="lotado">Com lotação ativa</SelectItem>
                <SelectItem value="disponivel">Sem lotação ativa</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Professores ({pessoas.length})</CardTitle>
          <CardDescription>
            Lista de professores da Rede Municipal de Ensino
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando professores...
            </div>
          ) : pessoas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum professor encontrado com os filtros selecionados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Completo</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Lotações Ativas</TableHead>
                    <TableHead>Carga Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pessoas.map((pessoa) => {
                    const cargaTotal = getCargaTotalProfessor(pessoa);
                    const temLotacao = pessoa.total_lotacoes_ativas > 0;

                    return (
                      <TableRow key={pessoa.pessoa_id}>
                        <TableCell className="font-medium">
                          {pessoa.nome_completo}
                        </TableCell>
                        <TableCell>{formatCPF(pessoa.cpf)}</TableCell>
                        <TableCell>{pessoa.email}</TableCell>
                        <TableCell>
                          {temLotacao ? (
                            <div className="space-y-1">
                              {pessoa.lotacoes_ativas?.map((lot: any, idx: number) => (
                                <div key={idx} className="text-sm">
                                  <span className="font-medium">{lot.escola_nome}</span>
                                  <span className="text-muted-foreground ml-2">
                                    ({lot.carga_horaria}h)
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Sem lotação
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{cargaTotal}h</span>
                            {cargaTotal > 50 && (
                              <Badge variant="destructive" className="text-xs">
                                Excede 50h
                              </Badge>
                            )}
                            {cargaTotal > 0 && cargaTotal <= 50 && (
                              <span className="text-xs text-muted-foreground">
                                / 50h
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={pessoa.usuario_ativo ? "default" : "secondary"}>
                            {pessoa.usuario_ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleVerDetalhes(pessoa)}
                              title="Ver detalhes e histórico"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEditar(pessoa)}
                              title="Editar dados pessoais"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            {temLotacao && cargaTotal < 50 && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLotar(pessoa)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Nova Lotação
                              </Button>
                            )}
                            {temLotacao && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransferir(pessoa)}
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Transferir
                              </Button>
                            )}
                            {!temLotacao && (
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => handleLotar(pessoa)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Lotar
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <NovaLotacaoDialog
        open={showNovaLotacaoDialog}
        onOpenChange={setShowNovaLotacaoDialog}
        pessoa={pessoaSelecionada}
        perfil="PROFESSOR"
      />

      <TransferirProfessorDialog
        open={showTransferirDialog}
        onOpenChange={setShowTransferirDialog}
        pessoa={pessoaSelecionada}
      />

      <NovoProfessorDialog
        open={showNovoProfessorDialog}
        onOpenChange={setShowNovoProfessorDialog}
      />

      <ProfessorDetalhesDialog
        open={showDetalhesDialog}
        onOpenChange={setShowDetalhesDialog}
        pessoa={pessoaSelecionada}
      />

      <EditarProfessorDialog
        open={showEditarDialog}
        onOpenChange={setShowEditarDialog}
        pessoa={pessoaSelecionada}
      />
    </div>
  );
}
