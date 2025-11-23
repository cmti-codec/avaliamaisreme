import { useState } from "react";
import { Calendar, CalendarDays, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAnosLetivos } from "@/hooks/useAnosLetivos";
import { useEscolas } from "@/hooks/useEscolas";
import { useUsuario } from "@/hooks/useUsuario";

export default function DatasPrazos() {
  const { data: usuario } = useUsuario();
  const { data: escolas } = useEscolas();
  const [escolaSelecionada, setEscolaSelecionada] = useState<string>("");
  const [anoSelecionado, setAnoSelecionado] = useState<number>(new Date().getFullYear());
  
  const isAdmin = usuario?.roles.includes("ADMIN") || usuario?.roles.includes("GESTOR_SEMED");
  
  const { data: anosLetivos } = useAnosLetivos(escolaSelecionada || undefined);

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
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Calendário Visual em Desenvolvimento</p>
                <p className="text-sm mt-2">
                  Use as abas acima para gerenciar feriados, sábados letivos, conselhos e entregas
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ano-letivo" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Anos Letivos</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Ano Letivo
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              {anosLetivos && anosLetivos.length > 0 ? (
                <div className="space-y-4">
                  {anosLetivos.map((ano) => (
                    <div key={ano.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg">Ano Letivo {ano.ano}</h3>
                          <p className="text-sm text-muted-foreground">
                            {new Date(ano.data_inicio).toLocaleDateString()} a {new Date(ano.data_fim).toLocaleDateString()}
                          </p>
                          {ano.escola && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Escola: {ano.escola.nome}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm">
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum ano letivo cadastrado</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Ano Letivo
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feriados" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Feriados {anoSelecionado}</h2>
            {isAdmin && (
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Feriado
              </Button>
            )}
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum feriado cadastrado para {anoSelecionado}</p>
                {isAdmin && (
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Cadastrar Feriados
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sabados" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Sábados Letivos {anoSelecionado}</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Sábado Letivo
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum sábado letivo cadastrado</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conselhos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Conselhos de Classe {anoSelecionado}</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Conselho
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum conselho de classe cadastrado</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="entregas" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Entregas de Diários {anoSelecionado}</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova Entrega
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma entrega de diários cadastrada</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Eventos Institucionais {anoSelecionado}</h2>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Evento
            </Button>
          </div>
          
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum evento institucional cadastrado</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
