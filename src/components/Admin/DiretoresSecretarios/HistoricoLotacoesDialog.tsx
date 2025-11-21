import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Building2, Calendar, CheckCircle2, XCircle, Clock, FileText } from "lucide-react";

interface HistoricoLotacoesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: any;
}

export function HistoricoLotacoesDialog({ open, onOpenChange, pessoa }: HistoricoLotacoesDialogProps) {
  const { data: lotacoes = [], isLoading } = useQuery({
    queryKey: ['historico-lotacoes', pessoa?.pessoa_id],
    queryFn: async () => {
      if (!pessoa?.pessoa_id) return [];

      // Buscar todas as lotações (ativas e encerradas)
      const { data: lotacoesData, error: lotacoesError } = await supabase
        .from('lotacoes')
        .select('*')
        .eq('pessoa_id', pessoa.pessoa_id)
        .order('data_inicio', { ascending: false });

      if (lotacoesError) throw lotacoesError;

      // Buscar nomes das escolas
      const escolaIds = [...new Set(lotacoesData.map(l => l.escola_saesc))];
      const { data: escolasData, error: escolasError } = await supabase
        .from('escolas')
        .select('codigo_saesc, nome')
        .in('codigo_saesc', escolaIds);

      if (escolasError) throw escolasError;

      // Criar mapa de escolas
      const escolasMap = new Map(escolasData.map(e => [e.codigo_saesc, e.nome]));

      // Enriquecer lotações com nomes de escolas
      return lotacoesData.map(lot => ({
        ...lot,
        escola_nome: escolasMap.get(lot.escola_saesc) || lot.escola_saesc,
      }));
    },
    enabled: open && !!pessoa?.pessoa_id,
  });

  if (!pessoa) return null;

  const lotacoesAtivas = lotacoes.filter(l => l.ativo);
  const lotacoesEncerradas = lotacoes.filter(l => !l.ativo);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Lotações</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {pessoa.nome_completo}
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando histórico...
          </div>
        ) : lotacoes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma lotação encontrada para esta pessoa</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Lotações Ativas */}
            {lotacoesAtivas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <h3 className="font-semibold text-lg">Lotações Ativas ({lotacoesAtivas.length})</h3>
                </div>
                <div className="space-y-3">
                  {lotacoesAtivas.map((lotacao) => (
                    <Card key={lotacao.id} className="border-green-200 bg-green-50/50">
                      <CardContent className="pt-4">
                        <div className="grid gap-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium text-lg">{lotacao.escola_nome}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span className="font-medium">{lotacao.escola_saesc}</span>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-600">
                              Ativa
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Início</span>
                              </div>
                              <p className="font-medium">
                                {format(new Date(lotacao.data_inicio), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Badge variant="outline">{lotacao.perfil}</Badge>
                              </div>
                              {lotacao.carga_horaria && (
                                <p className="text-sm">
                                  <span className="text-muted-foreground">Carga:</span> {lotacao.carga_horaria}h/semana
                                </p>
                              )}
                            </div>
                          </div>

                          {lotacao.observacoes && (
                            <>
                              <Separator />
                              <div className="text-sm">
                                <span className="text-muted-foreground">Observações:</span>
                                <p className="mt-1">{lotacao.observacoes}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Lotações Encerradas */}
            {lotacoesEncerradas.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-muted-foreground" />
                  <h3 className="font-semibold text-lg">Lotações Encerradas ({lotacoesEncerradas.length})</h3>
                </div>
                <div className="space-y-3">
                  {lotacoesEncerradas.map((lotacao) => (
                    <Card key={lotacao.id} className="border-muted">
                      <CardContent className="pt-4">
                        <div className="grid gap-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-muted-foreground" />
                                <span className="font-medium">{lotacao.escola_nome}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{lotacao.escola_saesc}</span>
                              </div>
                            </div>
                            <Badge variant="secondary">
                              Encerrada
                            </Badge>
                          </div>

                          <Separator />

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Calendar className="w-4 h-4" />
                                <span className="font-medium">Início</span>
                              </div>
                              <p>
                                {format(new Date(lotacao.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                              </p>
                            </div>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <XCircle className="w-4 h-4" />
                                <span className="font-medium">Término</span>
                              </div>
                              <p>
                                {lotacao.data_fim 
                                  ? format(new Date(lotacao.data_fim), "dd/MM/yyyy", { locale: ptBR })
                                  : '—'
                                }
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-sm">
                            <Badge variant="outline">{lotacao.perfil}</Badge>
                            {lotacao.carga_horaria && (
                              <span className="text-muted-foreground">
                                Carga: {lotacao.carga_horaria}h/semana
                              </span>
                            )}
                          </div>

                          {lotacao.observacoes && (
                            <>
                              <Separator />
                              <div className="text-sm">
                                <span className="text-muted-foreground">Observações:</span>
                                <p className="mt-1 text-muted-foreground">{lotacao.observacoes}</p>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo */}
            <Card className="bg-muted/50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-muted-foreground">Total de lotações:</span>
                    <span className="ml-2 font-semibold">{lotacoes.length}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-muted-foreground">Ativas:</span>
                      <span className="ml-2 font-semibold text-green-600">{lotacoesAtivas.length}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Encerradas:</span>
                      <span className="ml-2 font-semibold">{lotacoesEncerradas.length}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
