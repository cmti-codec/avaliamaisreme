import { useState, useEffect } from "react";
import { CalendarDays, Plus, ChevronDown, ChevronUp, Edit2, Trash2, Save, X, Info, Upload, Printer } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { ConfirmarExclusaoDialog } from "@/components/DatasPrazos/ConfirmarExclusaoDialog";
import { ImportarFeriadosDialog } from "@/components/DatasPrazos/ImportarFeriadosDialog";
import { exportarCalendarioParaImpressao } from "@/lib/exportar-calendario-pdf";

export default function DatasPrazos() {
  const { data: usuario } = useUsuario();
  const { data: escolas } = useEscolas();
  const [escolaSelecionada, setEscolaSelecionada] = useState<string>("");
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  const [anoLetivoSelecionado, setAnoLetivoSelecionado] = useState<string>("");
  
  // Estados de expansão
  const [anoLetivoExpandido, setAnoLetivoExpandido] = useState(false);
  const [bimestresExpandidos, setBimestresExpandidos] = useState<Record<number, boolean>>({});
  const [feriadosExpandido, setFeriadosExpandido] = useState(false);
  const [sabadosExpandido, setSabadosExpandido] = useState(false);
  const [conselhosExpandido, setConselhosExpandido] = useState(false);
  const [entregasExpandido, setEntregasExpandido] = useState(false);
  const [eventosExpandido, setEventosExpandido] = useState(false);
  
  // Dialogs
  const [anoLetivoDialogOpen, setAnoLetivoDialogOpen] = useState(false);
  const [feriadoDialogOpen, setFeriadoDialogOpen] = useState(false);
  const [sabadoLetivoDialogOpen, setSabadoLetivoDialogOpen] = useState(false);
  const [conselhoDialogOpen, setConselhoDialogOpen] = useState(false);
  const [entregaDiariosDialogOpen, setEntregaDiariosDialogOpen] = useState(false);
  const [eventoDialogOpen, setEventoDialogOpen] = useState(false);
  const [importarFeriadosDialogOpen, setImportarFeriadosDialogOpen] = useState(false);
  
  const [itemExclusao, setItemExclusao] = useState<{ id: string; tipo: string; nome: string } | null>(null);
  const [itemEditando, setItemEditando] = useState<any>(null);
  
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
  
  // Auto-selecionar primeiro ano letivo
  useEffect(() => {
    if (anosLetivos && anosLetivos.length > 0 && !anoLetivoSelecionado) {
      const anoAtivo = anosLetivos.find(a => a.ativo) || anosLetivos[0];
      setAnoLetivoSelecionado(anoAtivo.id);
    }
  }, [anosLetivos, anoLetivoSelecionado]);

  const eventosParaExportar = [
    ...(feriados || []).map(f => ({ data: f.data, tipo: "FERIADO", descricao: f.descricao })),
    ...(sabadosLetivos || []).map(s => ({ data: s.data, tipo: "SABADO_LETIVO", descricao: s.descricao || "Sábado Letivo" })),
    ...(conselhos || []).map(c => ({ data: c.data, tipo: "CONSELHO", descricao: c.descricao || "Conselho" })),
    ...(entregas || []).map(e => ({ data: e.data, tipo: "ENTREGA", descricao: e.descricao || "Entrega de Diários" })),
    ...(eventos || []).map(ev => ({ data: ev.data, tipo: "EVENTO", descricao: ev.descricao })),
  ];

  const anoAtivo = anosLetivos?.find(a => a.id === anoLetivoSelecionado);
  const feriadosOrdenados = [...(feriados || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const sabadosOrdenados = [...(sabadosLetivos || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const conselhosOrdenados = [...(conselhos || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const entregasOrdenadas = [...(entregas || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const eventosOrdenados = [...(eventos || [])].sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Datas & Prazos</h1>
              <p className="text-lg text-muted-foreground">
                Configure o calendário letivo da rede municipal de ensino
              </p>
            </div>

            <div className="flex gap-2">
              {isAdmin && (
                <Button variant="outline" onClick={() => setImportarFeriadosDialogOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Importar Feriados
                </Button>
              )}
              <Button variant="outline" onClick={() => {
                const escolaNome = escolas?.find(e => e.id === escolaSelecionada)?.nome || "Todas as Escolas";
                exportarCalendarioParaImpressao(eventosParaExportar, new Date().getMonth(), anoSelecionado, escolaNome);
              }}>
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Principal - Formulários */}
          <div className="lg:col-span-2 space-y-6">
            {/* Filtros */}
            <Card className="border-none shadow-lg">
              <CardContent className="pt-6">
                <div className="flex gap-4">
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
                </div>
              </CardContent>
            </Card>

            {/* Ano Letivo */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[hsl(var(--event-ano-letivo))]" />
                    Ano Letivo
                  </CardTitle>
                  {!anoLetivoExpandido && anoAtivo && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnoLetivoExpandido(true)}
                      className="hover:bg-[hsl(var(--event-ano-letivo-bg))]"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {!anoLetivoExpandido ? (
                  <div>
                    {anoAtivo ? (
                      <div className="bg-[hsl(var(--event-ano-letivo-bg))] p-4 rounded-lg border border-[hsl(var(--event-ano-letivo)_/_20%)]">
                        <p className="text-sm text-[hsl(var(--event-ano-letivo))]">
                          <span className="font-medium">Ano {anoAtivo.ano}:</span> {format(new Date(anoAtivo.data_inicio), "dd/MM/yyyy")} até {format(new Date(anoAtivo.data_fim), "dd/MM/yyyy")}
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-muted-foreground mb-3">Ano letivo ainda não configurado</p>
                        {isAdmin && (
                          <Button
                            onClick={() => setAnoLetivoDialogOpen(true)}
                            variant="outline"
                            className="border-[hsl(var(--event-ano-letivo)_/_30%)] text-[hsl(var(--event-ano-letivo))] hover:bg-[hsl(var(--event-ano-letivo-bg))]"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Configurar Ano Letivo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-[hsl(var(--event-ano-letivo-bg))] p-4 rounded-lg border border-[hsl(var(--event-ano-letivo)_/_20%)]">
                      <p className="text-sm text-[hsl(var(--event-ano-letivo))]">
                        Configure o ano letivo usando o botão abaixo
                      </p>
                    </div>
                    <div className="flex justify-end gap-2">
                      {isAdmin && (
                        <Button
                          size="sm"
                          onClick={() => setAnoLetivoDialogOpen(true)}
                          className="bg-[hsl(var(--event-ano-letivo))] hover:bg-[hsl(var(--event-ano-letivo)_/_90%)]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Novo Ano
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAnoLetivoExpandido(false)}
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Bimestres */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-[hsl(var(--event-bimestre))]" />
                  Bimestres
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {bimestres && bimestres.length > 0 ? (
                  bimestres.map((bimestre) => {
                    const isExpandido = bimestresExpandidos[bimestre.numero];
                    
                    return (
                      <div key={bimestre.id} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setBimestresExpandidos({ ...bimestresExpandidos, [bimestre.numero]: !isExpandido })}
                          className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-[hsl(var(--event-bimestre-bg))] text-[hsl(var(--event-bimestre))] rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold">{bimestre.numero}º</span>
                            </div>
                            <div className="text-left">
                              <h4 className="font-semibold">{bimestre.numero}º Bimestre</h4>
                              {!isExpandido && (
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(bimestre.data_inicio), "dd/MM/yyyy")} até {format(new Date(bimestre.data_fim), "dd/MM/yyyy")}
                                </p>
                              )}
                            </div>
                          </div>
                          {isExpandido ? (
                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                          )}
                        </button>

                        {isExpandido && (
                          <div className="p-4 bg-[hsl(var(--event-bimestre-bg))] border-t">
                            <div className="text-sm space-y-2">
                              <p>
                                <span className="font-medium">Início:</span> {format(new Date(bimestre.data_inicio), "dd/MM/yyyy")}
                              </p>
                              <p>
                                <span className="font-medium">Término:</span> {format(new Date(bimestre.data_fim), "dd/MM/yyyy")}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <p>Configure um ano letivo para gerar os bimestres automaticamente</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Feriados */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[hsl(var(--event-feriado))]" />
                    Feriados ({feriadosOrdenados.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeriadosExpandido(!feriadosExpandido)}
                  >
                    {feriadosExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              {feriadosExpandido && (
                <CardContent>
                  {isAdmin && (
                    <Button
                      onClick={() => setFeriadoDialogOpen(true)}
                      className="w-full mb-4 bg-[hsl(var(--event-feriado))] hover:bg-[hsl(var(--event-feriado)_/_90%)]"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Novo Feriado
                    </Button>
                  )}
                  
                  {feriadosOrdenados.length > 0 ? (
                    <div className="space-y-2">
                      {feriadosOrdenados.map((feriado) => (
                        <div key={feriado.id} className="bg-[hsl(var(--event-feriado-bg))] p-3 rounded border border-[hsl(var(--event-feriado)_/_20%)] group hover:border-[hsl(var(--event-feriado)_/_40%)] transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-[hsl(var(--event-feriado))]">
                                {format(new Date(feriado.data), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm">{feriado.descricao}</p>
                              <div className="flex gap-2 mt-1">
                                <Badge variant={feriado.tipo === "FERIADO" ? "default" : "secondary"} className="text-xs">
                                  {feriado.tipo === "FERIADO" ? "Feriado" : "Facultativo"}
                                </Badge>
                                <Badge variant="outline" className="text-xs">{feriado.abrangencia}</Badge>
                              </div>
                            </div>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setItemExclusao({ id: feriado.id, tipo: "feriado", nome: feriado.descricao })}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum feriado cadastrado</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Sábados Letivos */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[hsl(var(--event-sabado))]" />
                    Sábados Letivos ({sabadosOrdenados.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSabadosExpandido(!sabadosExpandido)}
                  >
                    {sabadosExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              {sabadosExpandido && (
                <CardContent>
                  <Button
                    onClick={() => setSabadoLetivoDialogOpen(true)}
                    className="w-full mb-4 bg-[hsl(var(--event-sabado))] hover:bg-[hsl(var(--event-sabado)_/_90%)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Sábado Letivo
                  </Button>
                  
                  {sabadosOrdenados.length > 0 ? (
                    <div className="space-y-2">
                      {sabadosOrdenados.map((sabado) => (
                        <div key={sabado.id} className="bg-[hsl(var(--event-sabado-bg))] p-3 rounded border border-[hsl(var(--event-sabado)_/_20%)] group hover:border-[hsl(var(--event-sabado)_/_40%)] transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-[hsl(var(--event-sabado))]">
                                {format(new Date(sabado.data), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm">
                                {sabado.tipo === "REPLICA_DIA_SEMANA" ? `Réplica ${sabado.dia_replica}` : sabado.descricao}
                              </p>
                              <Badge variant="outline" className="text-xs mt-1">
                                {sabado.exige_chamada ? "Exige chamada" : "Não exige chamada"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemExclusao({ id: sabado.id, tipo: "sabado_letivo", nome: sabado.descricao || "Sábado Letivo" })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum sábado letivo cadastrado</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Conselhos de Classe */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[hsl(var(--event-conselho))]" />
                    Conselhos de Classe ({conselhosOrdenados.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConselhosExpandido(!conselhosExpandido)}
                  >
                    {conselhosExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              {conselhosExpandido && (
                <CardContent>
                  <Button
                    onClick={() => setConselhoDialogOpen(true)}
                    className="w-full mb-4 bg-[hsl(var(--event-conselho))] hover:bg-[hsl(var(--event-conselho)_/_90%)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Conselho
                  </Button>
                  
                  {conselhosOrdenados.length > 0 ? (
                    <div className="space-y-2">
                      {conselhosOrdenados.map((conselho) => (
                        <div key={conselho.id} className="bg-[hsl(var(--event-conselho-bg))] p-3 rounded border border-[hsl(var(--event-conselho)_/_20%)] group hover:border-[hsl(var(--event-conselho)_/_40%)] transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-[hsl(var(--event-conselho))]">
                                {format(new Date(conselho.data), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm">{conselho.descricao || "Conselho de Classe"}</p>
                              <Badge variant={conselho.bloqueia_edicao_avaliacoes ? "destructive" : "secondary"} className="text-xs mt-1">
                                {conselho.bloqueia_edicao_avaliacoes ? "Bloqueia edições" : "Não bloqueia"}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemExclusao({ id: conselho.id, tipo: "conselho", nome: conselho.descricao || "Conselho" })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum conselho cadastrado</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Entregas de Diários */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-[hsl(var(--event-entrega))]" />
                    Entregas de Diários ({entregasOrdenadas.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEntregasExpandido(!entregasExpandido)}
                  >
                    {entregasExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              {entregasExpandido && (
                <CardContent>
                  <Button
                    onClick={() => setEntregaDiariosDialogOpen(true)}
                    className="w-full mb-4 bg-[hsl(var(--event-entrega))] hover:bg-[hsl(var(--event-entrega)_/_90%)]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nova Entrega
                  </Button>
                  
                  {entregasOrdenadas.length > 0 ? (
                    <div className="space-y-2">
                      {entregasOrdenadas.map((entrega) => (
                        <div key={entrega.id} className="bg-[hsl(var(--event-entrega-bg))] p-3 rounded border border-[hsl(var(--event-entrega)_/_20%)] group hover:border-[hsl(var(--event-entrega)_/_40%)] transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-[hsl(var(--event-entrega))]">
                                {format(new Date(entrega.data), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm">{entrega.descricao || "Entrega de Diários"}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemExclusao({ id: entrega.id, tipo: "entrega", nome: entrega.descricao || "Entrega" })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhuma entrega cadastrada</p>
                  )}
                </CardContent>
              )}
            </Card>

            {/* Eventos Institucionais */}
            <Card className="border-none shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-primary" />
                    Eventos Institucionais ({eventosOrdenados.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEventosExpandido(!eventosExpandido)}
                  >
                    {eventosExpandido ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </Button>
                </div>
              </CardHeader>
              {eventosExpandido && (
                <CardContent>
                  <Button
                    onClick={() => setEventoDialogOpen(true)}
                    className="w-full mb-4"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Evento
                  </Button>
                  
                  {eventosOrdenados.length > 0 ? (
                    <div className="space-y-2">
                      {eventosOrdenados.map((evento) => (
                        <div key={evento.id} className="bg-muted/50 p-3 rounded border group hover:border-primary/40 transition-colors">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-semibold text-sm text-primary">
                                {format(new Date(evento.data), "dd/MM/yyyy")}
                              </p>
                              <p className="text-sm">{evento.descricao}</p>
                              <Badge variant="outline" className="text-xs mt-1">{evento.tipo}</Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setItemExclusao({ id: evento.id, tipo: "evento", nome: evento.descricao })}
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-4">Nenhum evento cadastrado</p>
                  )}
                </CardContent>
              )}
            </Card>
          </div>

          {/* Coluna Lateral - Resumo */}
          <div className="space-y-6">
            <Card className="border-none shadow-lg sticky top-8">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10">
                <CardTitle className="text-lg">📅 Resumo do Calendário</CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Ano Letivo */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">ANO LETIVO {anoSelecionado}</p>
                  {anoAtivo ? (
                    <div className="text-sm">
                      <p><span className="font-medium">Ano {anoAtivo.ano}</span></p>
                      <p className="text-muted-foreground">
                        {format(new Date(anoAtivo.data_inicio), "dd/MM/yyyy")} até {format(new Date(anoAtivo.data_fim), "dd/MM/yyyy")}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Não configurado</p>
                  )}
                </div>

                {/* Bimestres */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">BIMESTRES</p>
                  <div className="space-y-2">
                    {bimestres && bimestres.length > 0 ? (
                      bimestres.map((bim) => (
                        <div key={bim.id} className="text-xs bg-[hsl(var(--event-bimestre-bg))] p-2 rounded border border-[hsl(var(--event-bimestre)_/_20%)]">
                          <p className="font-semibold text-[hsl(var(--event-bimestre))]">{bim.numero}º Bimestre</p>
                          <p className="text-muted-foreground">
                            {format(new Date(bim.data_inicio), "dd/MM")} até {format(new Date(bim.data_fim), "dd/MM")}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground">Nenhum bimestre configurado</p>
                    )}
                  </div>
                </div>

                {/* Feriados */}
                <div className="border-t pt-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">
                    FERIADOS ({feriadosOrdenados.length})
                  </p>
                  {feriadosOrdenados.length > 0 ? (
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {feriadosOrdenados.slice(0, 5).map((feriado) => (
                        <div key={feriado.id} className="text-xs bg-[hsl(var(--event-feriado-bg))] p-2 rounded border border-[hsl(var(--event-feriado)_/_20%)]">
                          <p className="font-semibold text-[hsl(var(--event-feriado))]">
                            {format(new Date(feriado.data), "dd/MM/yyyy")}
                          </p>
                          <p className="text-muted-foreground truncate">{feriado.descricao}</p>
                        </div>
                      ))}
                      {feriadosOrdenados.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center pt-1">
                          +{feriadosOrdenados.length - 5} mais
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Nenhum feriado cadastrado</p>
                  )}
                </div>

                {/* Demais eventos - resumo compacto */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Sábados Letivos:</span>
                    <Badge variant="outline" className="text-xs">{sabadosOrdenados.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Conselhos:</span>
                    <Badge variant="outline" className="text-xs">{conselhosOrdenados.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Entregas:</span>
                    <Badge variant="outline" className="text-xs">{entregasOrdenadas.length}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Eventos:</span>
                    <Badge variant="outline" className="text-xs">{eventosOrdenados.length}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <AnoLetivoDialog 
        open={anoLetivoDialogOpen} 
        onOpenChange={setAnoLetivoDialogOpen}
      />
      <FeriadoDialog 
        open={feriadoDialogOpen} 
        onOpenChange={setFeriadoDialogOpen}
      />
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
      <ImportarFeriadosDialog
        open={importarFeriadosDialogOpen}
        onOpenChange={setImportarFeriadosDialogOpen}
      />
      <ConfirmarExclusaoDialog
        open={!!itemExclusao}
        onOpenChange={(open) => !open && setItemExclusao(null)}
        onConfirm={handleConfirmarExclusao}
        titulo="Confirmar exclusão"
        descricao={`Tem certeza que deseja excluir "${itemExclusao?.nome}"? Esta ação não pode ser desfeita.`}
      />
    </div>
  );
}
