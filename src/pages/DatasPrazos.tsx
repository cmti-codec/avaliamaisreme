import { useState } from "react";
import { CalendarDays, Plus, Edit, Trash2, Upload, Printer } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAnosLetivos, useBimestres } from "@/hooks/useAnosLetivos";
import { useFeriados, useDeletarFeriado } from "@/hooks/useFeriados";
import { useSabadosLetivos, useDeletarSabadoLetivo } from "@/hooks/useSabadosLetivos";
import { useConselhos, useDeletarConselho } from "@/hooks/useConselhos";
import { useEntregasDiarios, useDeletarEntregaDiarios } from "@/hooks/useEntregasDiarios";
import { useEventosInstitucionais, useDeletarEventoInstitucional } from "@/hooks/useEventosInstitucionais";
import { useEscolas } from "@/hooks/useEscolas";
import { useUsuario } from "@/hooks/useUsuario";
import { AnoLetivoDialog } from "@/components/DatasPrazos/AnoLetivoDialog";
import { FeriadoDialog } from "@/components/DatasPrazos/FeriadoDialog";
import { SabadoLetivoDialog } from "@/components/DatasPrazos/SabadoLetivoDialog";
import { ConselhoDialog } from "@/components/DatasPrazos/ConselhoDialog";
import { EntregaDiariosDialog } from "@/components/DatasPrazos/EntregaDiariosDialog";
import { EventoDialog } from "@/components/DatasPrazos/EventoDialog";
import { CalendarioVisual } from "@/components/DatasPrazos/CalendarioVisual";
import { ConfirmarExclusaoDialog } from "@/components/DatasPrazos/ConfirmarExclusaoDialog";
import { ImportarFeriadosDialog } from "@/components/DatasPrazos/ImportarFeriadosDialog";
import { exportarCalendarioParaImpressao } from "@/lib/exportar-calendario-pdf";

export default function DatasPrazos() {
  const { data: usuario } = useUsuario();
  const { data: escolas } = useEscolas();
  const [escolaSelecionada, setEscolaSelecionada] = useState<string>("");
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState<string>("");
  
  // Dialogs
  const [anoLetivoDialogOpen, setAnoLetivoDialogOpen] = useState(false);
  const [feriadoDialogOpen, setFeriadoDialogOpen] = useState(false);
  const [sabadoLetivoDialogOpen, setSabadoLetivoDialogOpen] = useState(false);
  const [conselhoDialogOpen, setConselhoDialogOpen] = useState(false);
  const [entregaDiariosDialogOpen, setEntregaDiariosDialogOpen] = useState(false);
  const [eventoDialogOpen, setEventoDialogOpen] = useState(false);
  const [importarFeriadosDialogOpen, setImportarFeriadosDialogOpen] = useState(false);
  
  // Estado para exclusão e edição
  const [itemExclusao, setItemExclusao] = useState<{ id: string; tipo: string; nome: string } | null>(null);
  const [itemEditando, setItemEditando] = useState<any>(null);
  
  // Mutations para exclusão
  const deletarFeriado = useDeletarFeriado();
  const deletarSabadoLetivo = useDeletarSabadoLetivo();
  const deletarConselho = useDeletarConselho();
  const deletarEntrega = useDeletarEntregaDiarios();
  const deletarEvento = useDeletarEventoInstitucional();
  
  const handleConfirmarExclusao = async () => {
    if (!itemExclusao) return;
    
    try {
      switch (itemExclusao.tipo) {
        case "feriado":
          await deletarFeriado.mutateAsync(itemExclusao.id);
          break;
        case "sabado_letivo":
          await deletarSabadoLetivo.mutateAsync(itemExclusao.id);
          break;
        case "conselho":
          await deletarConselho.mutateAsync(itemExclusao.id);
          break;
        case "entrega":
          await deletarEntrega.mutateAsync(itemExclusao.id);
          break;
        case "evento":
          await deletarEvento.mutateAsync(itemExclusao.id);
          break;
      }
      setItemExclusao(null);
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };
  
  const isAdmin = usuario?.roles.includes("ADMIN") || usuario?.roles.includes("GESTOR_SEMED");
  
  const { data: anosLetivos } = useAnosLetivos(escolaSelecionada || undefined);
  const { data: bimestres } = useBimestres(anoLetivoSelecionado || null);
  const { data: feriados } = useFeriados(anoSelecionado);
  const { data: sabadosLetivos } = useSabadosLetivos(escolaSelecionada || undefined, anoSelecionado);
  const { data: conselhos } = useConselhos(escolaSelecionada || undefined, anoLetivoSelecionado || undefined);
  const { data: entregas } = useEntregasDiarios(escolaSelecionada || undefined, anoLetivoSelecionado || undefined);
  const { data: eventos } = useEventosInstitucionais(escolaSelecionada || undefined, anoSelecionado);
  
  // Preparar eventos para exportação
  const eventosParaExportar = [
    ...(feriados || []).map(f => ({ data: f.data, tipo: "FERIADO", descricao: f.descricao })),
    ...(sabadosLetivos || []).map(s => ({ data: s.data, tipo: "SABADO_LETIVO", descricao: s.descricao || "Sábado Letivo" })),
    ...(conselhos || []).map(c => ({ data: c.data, tipo: "CONSELHO", descricao: c.descricao || "Conselho" })),
    ...(entregas || []).map(e => ({ data: e.data, tipo: "ENTREGA", descricao: e.descricao || "Entrega de Diários" })),
    ...(eventos || []).map(ev => ({ data: ev.data, tipo: "EVENTO", descricao: ev.descricao })),
  ];
  
  const handleExportarCalendario = () => {
    const escolaNome = escolas?.find(e => e.id === escolaSelecionada)?.nome || "Todas as Escolas";
    const mesAtual = new Date().getMonth();
    exportarCalendarioParaImpressao(eventosParaExportar, mesAtual, anoSelecionado, escolaNome);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarDays className="h-8 w-8" />
            Datas & Prazos
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o calendário letivo, feriados, eventos e prazos institucionais
          </p>
        </div>
        
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setImportarFeriadosDialogOpen(true)}>
              <Upload className="w-4 h-4 mr-2" />
              Importar Feriados
            </Button>
          )}
          <Button variant="outline" onClick={handleExportarCalendario}>
            <Printer className="w-4 h-4 mr-2" />
            Imprimir Calendário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          {isAdmin && (
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Escola</label>
              <Select value={escolaSelecionada} onValueChange={setEscolaSelecionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as escolas</SelectItem>
                  {escolas?.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex-1">
            <label className="text-sm font-medium mb-2 block">Ano</label>
            <Select 
              value={anoSelecionado.toString()} 
              onValueChange={(v) => setAnoSelecionado(parseInt(v))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((ano) => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs de Conteúdo */}
      <Tabs defaultValue="visao-geral" className="space-y-4">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="visao-geral">Visão Geral</TabsTrigger>
          <TabsTrigger value="ano-letivo">Ano Letivo</TabsTrigger>
          <TabsTrigger value="feriados">Feriados</TabsTrigger>
          <TabsTrigger value="sabados">Sábados Letivos</TabsTrigger>
          <TabsTrigger value="conselhos">Conselhos</TabsTrigger>
          <TabsTrigger value="entregas">Entregas</TabsTrigger>
          <TabsTrigger value="eventos">Eventos</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendário Anual {anoSelecionado}</CardTitle>
            </CardHeader>
            <CardContent>
              <CalendarioVisual
                eventos={[
                  ...(feriados || []).map(f => ({
                    id: f.id,
                    data: f.data,
                    titulo: f.descricao,
                    tipo: "feriado" as const,
                    subtitulo: f.tipo === "FERIADO" ? "Feriado" : "Ponto Facultativo",
                    descricao: f.abrangencia,
                    onEdit: isAdmin ? () => {} : undefined,
                    onDelete: isAdmin ? () => setItemExclusao({ id: f.id, tipo: "feriado", nome: f.descricao }) : undefined,
                  })),
                  ...(sabadosLetivos || []).map(s => ({
                    id: s.id,
                    data: s.data,
                    titulo: s.tipo === "REPLICA_DIA_SEMANA" ? `Réplica ${s.dia_replica}` : s.descricao || "Evento",
                    tipo: "sabado_letivo" as const,
                    subtitulo: "Sábado Letivo",
                    descricao: s.exige_chamada ? "Exige chamada" : "Não exige chamada",
                    onEdit: () => {},
                    onDelete: () => setItemExclusao({ id: s.id, tipo: "sabado_letivo", nome: s.descricao || "Sábado Letivo" }),
                  })),
                  ...(conselhos || []).map(c => ({
                    id: c.id,
                    data: c.data,
                    titulo: c.descricao || "Conselho de Classe",
                    tipo: "conselho" as const,
                    subtitulo: "Conselho de Classe",
                    descricao: c.bloqueia_edicao_avaliacoes ? "Bloqueia edições" : "Não bloqueia edições",
                    onEdit: () => {},
                    onDelete: () => setItemExclusao({ id: c.id, tipo: "conselho", nome: c.descricao || "Conselho de Classe" }),
                  })),
                  ...(entregas || []).map(e => ({
                    id: e.id,
                    data: e.data,
                    titulo: e.descricao || "Entrega de Diários",
                    tipo: "entrega" as const,
                    subtitulo: "Entrega de Diários",
                    descricao: `${e.professores_entregaram.length} professor(es) entregaram`,
                    onEdit: () => {},
                    onDelete: () => setItemExclusao({ id: e.id, tipo: "entrega", nome: e.descricao || "Entrega de Diários" }),
                  })),
                ]}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ano-letivo" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Anos Letivos</h2>
            {isAdmin && (
              <Button onClick={() => setAnoLetivoDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Ano Letivo
              </Button>
            )}
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {anosLetivos && anosLetivos.length > 0 ? (
                <div className="space-y-4">
                  {anosLetivos.map((ano) => (
                    <div key={ano.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">Ano Letivo {ano.ano}</h3>
                            {ano.ativo && <Badge variant="default">Ativo</Badge>}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(ano.data_inicio), "dd/MM/yyyy")} a {format(new Date(ano.data_fim), "dd/MM/yyyy")}
                          </p>
                          {ano.escola && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Escola: {ano.escola.nome}
                            </p>
                          )}
                          
                          {/* Bimestres */}
                          <Button 
                            variant="link" 
                            className="p-0 h-auto mt-2"
                            onClick={() => setAnoLetivoSelecionado(ano.id)}
                          >
                            Ver bimestres
                          </Button>
                        </div>
                      </div>
                      
                      {anoLetivoSelecionado === ano.id && bimestres && (
                        <div className="mt-4 pt-4 border-t">
                          <h4 className="font-medium mb-3">Bimestres</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {bimestres.map((bimestre) => (
                              <div key={bimestre.id} className="border rounded p-3">
                                <div className="font-medium">{bimestre.numero}º Bimestre</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {format(new Date(bimestre.data_inicio), "dd/MM")} a {format(new Date(bimestre.data_fim), "dd/MM")}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum ano letivo cadastrado</p>
                  {isAdmin && (
                    <Button className="mt-4" onClick={() => setAnoLetivoDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Primeiro Ano Letivo
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feriados" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feriados {anoSelecionado}</h2>
            {isAdmin && (
              <Button onClick={() => setFeriadoDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Feriado
              </Button>
            )}
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {feriados && feriados.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Abrangência</TableHead>
                      {isAdmin && <TableHead className="w-[100px]">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feriados.map((feriado) => (
                      <TableRow key={feriado.id}>
                        <TableCell>{format(new Date(feriado.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium">{feriado.descricao}</TableCell>
                        <TableCell>
                          <Badge variant={feriado.tipo === "FERIADO" ? "default" : "secondary"}>
                            {feriado.tipo === "FERIADO" ? "Feriado" : "Ponto Facultativo"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{feriado.abrangencia}</Badge>
                        </TableCell>
                        {isAdmin && (
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => setItemExclusao({ id: feriado.id, tipo: "feriado", nome: feriado.descricao })}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum feriado cadastrado para {anoSelecionado}</p>
                  {isAdmin && (
                    <Button className="mt-4" onClick={() => setFeriadoDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Cadastrar Feriados
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sabados" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sábados Letivos {anoSelecionado}</h2>
            <Button onClick={() => setSabadoLetivoDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Sábado Letivo
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {sabadosLetivos && sabadosLetivos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Detalhes</TableHead>
                      <TableHead>Chamada</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sabadosLetivos.map((sabado) => (
                      <TableRow key={sabado.id}>
                        <TableCell>{format(new Date(sabado.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={sabado.tipo === "REPLICA_DIA_SEMANA" ? "default" : "secondary"}>
                            {sabado.tipo === "REPLICA_DIA_SEMANA" ? "Réplica" : "Evento"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {sabado.tipo === "REPLICA_DIA_SEMANA" ? (
                            <span className="text-sm">Replica {sabado.dia_replica}</span>
                          ) : (
                            <span className="text-sm">{sabado.descricao}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {sabado.exige_chamada ? (
                            <Badge variant="outline" className="bg-green-50">Sim</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-gray-50">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setItemExclusao({ id: sabado.id, tipo: "sabado_letivo", nome: sabado.descricao || "Sábado Letivo" })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum sábado letivo cadastrado</p>
                  <Button className="mt-4" onClick={() => setSabadoLetivoDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Sábado Letivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conselhos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Conselhos de Classe</h2>
            <Button onClick={() => setConselhoDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Conselho
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {conselhos && conselhos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Bimestre</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Bloqueia Edição</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {conselhos.map((conselho) => (
                      <TableRow key={conselho.id}>
                        <TableCell>{format(new Date(conselho.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge>Bimestre</Badge>
                        </TableCell>
                        <TableCell>{conselho.descricao || "—"}</TableCell>
                        <TableCell>
                          {conselho.bloqueia_edicao_avaliacoes ? (
                            <Badge variant="destructive">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setItemExclusao({ id: conselho.id, tipo: "conselho", nome: conselho.descricao || "Conselho de Classe" })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum conselho de classe cadastrado</p>
                  <Button className="mt-4" onClick={() => setConselhoDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Conselho
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Entregas de Diários</h2>
            <Button onClick={() => setEntregaDiariosDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrega
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {entregas && entregas.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Limite</TableHead>
                      <TableHead>Bimestre</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Entregas</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {entregas.map((entrega) => (
                      <TableRow key={entrega.id}>
                        <TableCell>{format(new Date(entrega.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <Badge>Bimestre</Badge>
                        </TableCell>
                        <TableCell>{entrega.descricao || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {entrega.professores_entregaram.length} professor(es)
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setItemExclusao({ id: entrega.id, tipo: "entrega", nome: entrega.descricao || "Entrega de Diários" })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhuma entrega de diários cadastrada</p>
                  <Button className="mt-4" onClick={() => setEntregaDiariosDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Entrega
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Eventos Institucionais {anoSelecionado}</h2>
            <Button onClick={() => setEventoDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {eventos && eventos.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Bloqueia Letivo</TableHead>
                      <TableHead className="w-[100px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventos.map((evento) => (
                      <TableRow key={evento.id}>
                        <TableCell>{format(new Date(evento.data), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="font-medium">{evento.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{evento.tipo}</Badge>
                        </TableCell>
                        <TableCell>
                          {evento.bloqueia_letivo ? (
                            <Badge variant="destructive">Sim</Badge>
                          ) : (
                            <Badge variant="outline">Não</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => setItemExclusao({ id: evento.id, tipo: "evento", nome: evento.descricao })}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum evento institucional cadastrado para {anoSelecionado}</p>
                  <Button className="mt-4" onClick={() => setEventoDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Evento
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <AnoLetivoDialog open={anoLetivoDialogOpen} onOpenChange={setAnoLetivoDialogOpen} />
      <FeriadoDialog open={feriadoDialogOpen} onOpenChange={setFeriadoDialogOpen} />
      <SabadoLetivoDialog 
        open={sabadoLetivoDialogOpen} 
        onOpenChange={setSabadoLetivoDialogOpen}
        escolaId={escolaSelecionada}
      />
      <ConselhoDialog 
        open={conselhoDialogOpen} 
        onOpenChange={setConselhoDialogOpen}
        escolaId={escolaSelecionada}
        anoLetivoId={anoLetivoSelecionado}
      />
      <EntregaDiariosDialog 
        open={entregaDiariosDialogOpen} 
        onOpenChange={setEntregaDiariosDialogOpen}
        escolaId={escolaSelecionada}
        anoLetivoId={anoLetivoSelecionado}
      />
      <EventoDialog
        open={eventoDialogOpen}
        onOpenChange={setEventoDialogOpen}
        escolaId={escolaSelecionada}
      />
      
      {/* Dialog de Confirmação de Exclusão */}
      <ConfirmarExclusaoDialog
        open={!!itemExclusao}
        onOpenChange={(open) => !open && setItemExclusao(null)}
        onConfirm={handleConfirmarExclusao}
        titulo="Confirmar Exclusão"
        descricao={`Tem certeza que deseja excluir "${itemExclusao?.nome}"? Esta ação não pode ser desfeita.`}
        isLoading={deletarFeriado.isPending || deletarSabadoLetivo.isPending || deletarConselho.isPending || deletarEntrega.isPending || deletarEvento.isPending}
      />
      
      {/* Dialog de Importação de Feriados */}
      <ImportarFeriadosDialog
        open={importarFeriadosDialogOpen}
        onOpenChange={setImportarFeriadosDialogOpen}
      />
    </div>
  );
}
