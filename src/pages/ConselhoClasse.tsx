import { useState, useMemo } from "react";
import { useSchool } from "@/contexts/SchoolContext";
import { useAnosLetivos, useBimestres } from "@/hooks/useAnosLetivos";
import { useConselhoData, useRealizarConselho } from "@/hooks/useConselhoData";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PainelFrequencias } from "@/components/Conselho/PainelFrequencias";
import { PainelNotas } from "@/components/Conselho/PainelNotas";
import { StatusProfessores } from "@/components/Conselho/StatusProfessores";
import { ClipboardCheck, Users, BookOpen, CheckCircle2, Lock, AlertCircle } from "lucide-react";

export default function ConselhoClasse() {
  const { escolaAtual } = useSchool();
  const escolaId = escolaAtual?.saesc || null;

  const { data: anosLetivos, isLoading: loadingAnos } = useAnosLetivos();
  const anoAtivo = anosLetivos?.find(a => a.ativo);
  const { data: bimestres, isLoading: loadingBim } = useBimestres(anoAtivo?.id || null);

  const [bimestreId, setBimestreId] = useState<string>("");
  const [turmaId, setTurmaId] = useState<string>("");

  const bimestreSelecionado = bimestres?.find(b => b.id === bimestreId);

  // Buscar turmas da escola
  const { data: turmas } = useQuery({
    queryKey: ["turmas_escola_conselho", escolaId],
    queryFn: async () => {
      if (!escolaId) return [];
      const { data, error } = await supabase
        .from("turmas")
        .select("id, turma, etapa_modalidade, grupo_ano, turno")
        .eq("escola_id", escolaId)
        .eq("ativa", true)
        .order("turma");
      if (error) throw error;
      return data;
    },
    enabled: !!escolaId,
  });

  const { data: conselhoData, isLoading: loadingConselho } = useConselhoData(
    escolaId,
    turmaId || null,
    bimestreId || null,
    bimestreSelecionado?.data_inicio || null,
    bimestreSelecionado?.data_fim || null
  );

  const realizarConselho = useRealizarConselho();

  const handleRealizarConselho = () => {
    if (!escolaId || !anoAtivo || !bimestreId || !turmaId) return;
    realizarConselho.mutate({
      escola_id: escolaId,
      ano_letivo_id: anoAtivo.id,
      bimestre_id: bimestreId,
      turmas_ids: [turmaId],
      bloqueia_edicao: true,
    });
  };

  const conselhoRealizado = !!conselhoData?.conselhoExistente;

  // Stats
  const totalAlunos = conselhoData?.frequencias.length || 0;
  const totalProfs = new Set(conselhoData?.statusProfessores.map(s => s.professor_id)).size;
  const profsCompletos = useMemo(() => {
    if (!conselhoData) return 0;
    const porProf = new Map<string, boolean>();
    conselhoData.statusProfessores.forEach(s => {
      const atual = porProf.get(s.professor_id) ?? true;
      porProf.set(s.professor_id, atual && s.tem_frequencias && s.tem_avaliacoes);
    });
    return Array.from(porProf.values()).filter(Boolean).length;
  }, [conselhoData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Conselho de Classe</h1>
        <p className="text-muted-foreground">Consolide notas e frequências por turma e bimestre</p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="min-w-[200px]">
              <label className="text-sm font-medium text-foreground mb-1 block">Bimestre</label>
              <Select value={bimestreId} onValueChange={(v) => { setBimestreId(v); setTurmaId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o bimestre" />
                </SelectTrigger>
                <SelectContent>
                  {bimestres?.map(b => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.numero}º Bimestre
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="min-w-[250px]">
              <label className="text-sm font-medium text-foreground mb-1 block">Turma</label>
              <Select value={turmaId} onValueChange={setTurmaId} disabled={!bimestreId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a turma" />
                </SelectTrigger>
                <SelectContent>
                  {turmas?.map(t => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.turma} — {t.grupo_ano} ({t.turno})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status do conselho */}
      {conselhoRealizado && (
        <Alert className="border-green-200 bg-green-50">
          <Lock className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Conselho de classe já realizado para este bimestre em{" "}
            <strong>{new Date(conselhoData!.conselhoExistente.data).toLocaleDateString("pt-BR")}</strong>.
            As edições de notas e frequências estão bloqueadas.
          </AlertDescription>
        </Alert>
      )}

      {/* Cards de resumo */}
      {turmaId && bimestreId && conselhoData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Users className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{totalAlunos}</p>
                  <p className="text-xs text-muted-foreground">Alunos na turma</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BookOpen className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{conselhoData.componentes.length}</p>
                  <p className="text-xs text-muted-foreground">Componentes curriculares</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{profsCompletos}/{totalProfs}</p>
                  <p className="text-xs text-muted-foreground">Professores com lançamentos completos</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="frequencias" className="space-y-4">
            <TabsList>
              <TabsTrigger value="frequencias">Frequências</TabsTrigger>
              <TabsTrigger value="notas">Notas</TabsTrigger>
              <TabsTrigger value="status">Status Professores</TabsTrigger>
            </TabsList>

            <TabsContent value="frequencias">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Frequências Consolidadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingConselho ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <PainelFrequencias dados={conselhoData.frequencias} componentes={conselhoData.componentes} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notas">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Notas Consolidadas</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingConselho ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <PainelNotas dados={conselhoData.notas} componentes={conselhoData.componentes} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="status">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status de Entrega por Professor</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingConselho ? (
                    <Skeleton className="h-64 w-full" />
                  ) : (
                    <StatusProfessores status={conselhoData.statusProfessores} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Ação */}
          {!conselhoRealizado && (
            <div className="flex justify-end">
              <Button
                size="lg"
                onClick={handleRealizarConselho}
                disabled={realizarConselho.isPending}
                className="gap-2"
              >
                <ClipboardCheck className="w-5 h-5" />
                {realizarConselho.isPending ? "Realizando..." : "Realizar Conselho de Classe"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Estado vazio */}
      {(!turmaId || !bimestreId) && (
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Selecione o bimestre e a turma para visualizar os dados do conselho.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
