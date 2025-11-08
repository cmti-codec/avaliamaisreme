import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGestoresEscolares } from "@/hooks/useGestoresEscolares";
import { TransferirDialog } from "@/components/Admin/DiretoresSecretarios/TransferirDialog";
import { LotarDialog } from "@/components/Admin/DiretoresSecretarios/LotarDialog";
import { RefreshCw, Plus, Edit, Eye, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function GestoresEscolares() {
  const [activeTab, setActiveTab] = useState<'DIRETOR' | 'SECRETARIO' | 'COORDENADOR'>('DIRETOR');
  const [showTransferirDialog, setShowTransferirDialog] = useState(false);
  const [showLotarDialog, setShowLotarDialog] = useState(false);
  const [pessoaSelecionada, setPessoaSelecionada] = useState<any>(null);

  const { pessoas, isLoading, transferir, lotar, isTransferindo } = useGestoresEscolares(activeTab);

  const handleTransferir = (pessoa: any) => {
    setPessoaSelecionada(pessoa);
    setShowTransferirDialog(true);
  };

  const handleLotar = (pessoa: any) => {
    setPessoaSelecionada(pessoa);
    setShowLotarDialog(true);
  };

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestores Escolares</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie as lotações de diretores, secretários e coordenadores nas escolas da rede
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="DIRETOR">Diretores</TabsTrigger>
          <TabsTrigger value="SECRETARIO">Secretários</TabsTrigger>
          <TabsTrigger value="COORDENADOR">Coordenadores</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'DIRETOR' ? 'Diretores' : activeTab === 'SECRETARIO' ? 'Secretários' : 'Coordenadores'}
              </CardTitle>
              <CardDescription>
                Lista de {activeTab === 'DIRETOR' ? 'diretores' : activeTab === 'SECRETARIO' ? 'secretários' : 'coordenadores'} cadastrados no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando...
                </div>
              ) : pessoas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum {activeTab === 'DIRETOR' ? 'diretor' : activeTab === 'SECRETARIO' ? 'secretário' : 'coordenador'} cadastrado
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome Completo</TableHead>
                      <TableHead>CPF</TableHead>
                      <TableHead>Escola Atual</TableHead>
                      <TableHead>Desde</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pessoas.map((pessoa) => (
                      <TableRow key={pessoa.pessoa_id}>
                        <TableCell className="font-medium">
                          {pessoa.nome_completo}
                        </TableCell>
                        <TableCell>{formatCPF(pessoa.cpf)}</TableCell>
                        <TableCell>
                          {pessoa.lotacao_atual ? (
                            <span>{pessoa.lotacao_atual.escola_nome}</span>
                          ) : (
                            <Badge variant="outline" className="gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Sem lotação
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {pessoa.lotacao_atual ? (
                            format(new Date(pessoa.lotacao_atual.data_inicio), 'dd/MM/yyyy', {
                              locale: ptBR,
                            })
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {pessoa.lotacao_atual && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleTransferir(pessoa)}
                                disabled={isTransferindo}
                              >
                                <RefreshCw className="w-4 h-4 mr-1" />
                                Transferir
                              </Button>
                            )}
                            {!pessoa.lotacao_atual && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleLotar(pessoa)}
                                disabled={isTransferindo}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Lotar
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {}}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <TransferirDialog
        open={showTransferirDialog}
        onOpenChange={setShowTransferirDialog}
        pessoa={pessoaSelecionada}
        perfil={activeTab}
        onConfirm={transferir}
      />

      <LotarDialog
        open={showLotarDialog}
        onOpenChange={setShowLotarDialog}
        pessoa={pessoaSelecionada}
        perfil={activeTab}
        onConfirm={lotar}
      />
    </div>
  );
}
