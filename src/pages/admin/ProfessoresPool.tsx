import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye, Edit, Plus, Trash2, UserPlus } from "lucide-react";
import { usePessoasPool, PessoaComLotacoes } from "@/hooks/usePessoasPool";
import { useEscolas } from "@/hooks/useEscolas";
import { NovaLotacaoDialog } from "@/components/Admin/Pool/NovaLotacaoDialog";
import { format } from "date-fns";
import { useDebounce } from "@/hooks/useDebounce";

export default function ProfessoresPool() {
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<'todos' | 'ativos' | 'inativos'>('todos');
  const [lotacao, setLotacao] = useState<'todos' | 'com_lotacao' | 'sem_lotacao'>('todos');
  const [escolaFiltro, setEscolaFiltro] = useState<string>('todos');
  const [pessoaSelecionada, setPessoaSelecionada] = useState<PessoaComLotacoes | null>(null);
  const [novaLotacaoOpen, setNovaLotacaoOpen] = useState(false);

  const buscaDebounced = useDebounce(busca, 300);

  const { pessoas, isLoading } = usePessoasPool({
    busca: buscaDebounced,
    status,
    lotacao,
    escola_saesc: escolaFiltro !== 'todos' ? escolaFiltro : undefined,
    perfil: 'PROFESSOR',
  });

  const escolasQuery = useEscolas();
  const escolas = escolasQuery.data || [];

  const formatarCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const handleNovaLotacao = (pessoa: PessoaComLotacoes) => {
    setPessoaSelecionada(pessoa);
    setNovaLotacaoOpen(true);
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pool de Professores</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todos os professores da rede. Localize, lote em escolas e acompanhe cargas horárias.
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Busca e Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Busca */}
            <div className="md:col-span-2">
              <Input
                placeholder="Buscar por nome, CPF ou email..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            {/* Status */}
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="ativos">Apenas Ativos</SelectItem>
                <SelectItem value="inativos">Apenas Inativos</SelectItem>
              </SelectContent>
            </Select>

            {/* Lotação */}
            <Select value={lotacao} onValueChange={(v: any) => setLotacao(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Lotação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="com_lotacao">Com Lotação</SelectItem>
                <SelectItem value="sem_lotacao">Sem Lotação</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Filtro de Escola (linha separada) */}
          <div className="mt-4">
            <Select value={escolaFiltro} onValueChange={setEscolaFiltro}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas as escolas</SelectItem>
                {escolas.map((escola) => (
                  <SelectItem key={escola.id} value={escola.saesc?.toString() || ''}>
                    {escola.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome Completo</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-center">Lotações Ativas</TableHead>
                <TableHead className="text-center">Carga Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : pessoas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum professor encontrado
                  </TableCell>
                </TableRow>
              ) : (
                pessoas.map((pessoa) => (
                  <TableRow key={pessoa.pessoa_id}>
                    <TableCell className="font-medium">{pessoa.nome_completo}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {formatarCPF(pessoa.cpf)}
                    </TableCell>
                    <TableCell className="text-sm">{pessoa.email}</TableCell>
                    <TableCell className="text-center">
                      {pessoa.total_lotacoes_ativas > 0 ? (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Badge variant="secondary" className="cursor-help">
                                {pessoa.total_lotacoes_ativas} {pessoa.total_lotacoes_ativas === 1 ? 'escola' : 'escolas'}
                              </Badge>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1 text-sm">
                                {pessoa.lotacoes_ativas.map((lot, idx) => (
                                  <div key={idx}>
                                    • {lot.escola_nome} ({lot.carga_horaria}h)
                                  </div>
                                ))}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ) : (
                        <Badge variant="outline">Sem lotação</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant={pessoa.carga_horaria_total && pessoa.carga_horaria_total >= 40 ? "default" : "secondary"}>
                        {pessoa.carga_horaria_total || 0}h
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {pessoa.usuario_ativo ? (
                        <Badge variant="default" className="bg-green-500">✅ Ativo</Badge>
                      ) : (
                        <Badge variant="destructive">⚠️ Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="ghost" title="Ver detalhes">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Editar">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          title="Nova lotação"
                          onClick={() => handleNovaLotacao(pessoa)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" title="Inativar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Botão Flutuante */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 rounded-full shadow-lg h-14 px-6"
        title="Cadastrar novo professor"
      >
        <UserPlus className="h-5 w-5 mr-2" />
        Cadastrar Novo Professor
      </Button>

      {/* Modal Nova Lotação */}
      {pessoaSelecionada && (
        <NovaLotacaoDialog
          open={novaLotacaoOpen}
          onOpenChange={setNovaLotacaoOpen}
          pessoa={pessoaSelecionada}
          perfil="PROFESSOR"
        />
      )}
    </div>
  );
}
