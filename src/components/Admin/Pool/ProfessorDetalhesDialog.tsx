import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Building2, Clock, FileText, User, Mail, Phone, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProfessorDetalhesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pessoa: {
    pessoa_id: string;
    nome_completo: string;
    cpf: string;
    email: string;
    telefone?: string | null;
  } | null;
}

export function ProfessorDetalhesDialog({
  open,
  onOpenChange,
  pessoa,
}: ProfessorDetalhesDialogProps) {
  const { data: detalhes, isLoading } = useQuery({
    queryKey: ["professor-detalhes", pessoa?.pessoa_id],
    queryFn: async () => {
      if (!pessoa?.pessoa_id) return null;

      // Buscar dados completos da pessoa
      const { data: pessoaData, error: pessoaError } = await supabase
        .from("pessoas")
        .select("*")
        .eq("id", pessoa.pessoa_id)
        .single();

      if (pessoaError) throw pessoaError;

      // Buscar histórico completo de lotações (ativas e inativas)
      const { data: lotacoesData, error: lotacoesError } = await supabase
        .from("lotacoes")
        .select("*")
        .eq("pessoa_id", pessoa.pessoa_id)
        .eq("perfil", "PROFESSOR")
        .order("data_inicio", { ascending: false });

      if (lotacoesError) throw lotacoesError;

      // Buscar nomes das escolas
      const escolasSaesc = [...new Set(lotacoesData?.map(l => l.escola_saesc) || [])];
      const { data: escolasData } = await supabase
        .from("escolas")
        .select("id, nome, codigo_saesc")
        .in("id", escolasSaesc.map(s => s));

      // Mapear escolas por ID
      const escolasMap = new Map(escolasData?.map(e => [e.id, e]) || []);

      // Adicionar dados da escola às lotações
      const lotacoesComEscola = lotacoesData?.map(lot => ({
        ...lot,
        escola_nome: escolasMap.get(lot.escola_saesc)?.nome || "Escola não encontrada",
        escola_codigo: escolasMap.get(lot.escola_saesc)?.codigo_saesc || lot.escola_saesc
      })) || [];

      return {
        pessoa: pessoaData,
        lotacoes: lotacoesComEscola,
      };
    },
    enabled: !!pessoa?.pessoa_id && open,
  });

  const formatCPF = (cpf: string) => {
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  };

  const formatTelefone = (telefone: string) => {
    const cleaned = telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    }
    return telefone;
  };

  const calcularCargaTotal = () => {
    if (!detalhes?.lotacoes) return 0;
    return detalhes.lotacoes
      .filter(l => l.ativo)
      .reduce((total, lot) => total + (lot.carga_horaria || 0), 0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Professor</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : detalhes ? (
          <div className="space-y-6">
            {/* Informações Pessoais */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Informações Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Nome Completo</p>
                    <p className="font-medium">{detalhes.pessoa.nome_completo}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <CreditCard className="w-3 h-3" />
                      CPF
                    </p>
                    <p className="font-medium">{formatCPF(detalhes.pessoa.cpf)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      Email
                    </p>
                    <p className="font-medium">{detalhes.pessoa.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Phone className="w-3 h-3" />
                      Telefone
                    </p>
                    <p className="font-medium">
                      {detalhes.pessoa.telefone ? formatTelefone(detalhes.pessoa.telefone) : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Data de Nascimento
                    </p>
                    <p className="font-medium">
                      {detalhes.pessoa.data_nascimento
                        ? format(new Date(detalhes.pessoa.data_nascimento), "dd/MM/yyyy", { locale: ptBR })
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={detalhes.pessoa.ativo ? "default" : "secondary"}>
                      {detalhes.pessoa.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Resumo de Carga Horária */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Carga Horária Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total de horas na rede</p>
                    <p className="text-2xl font-bold">{calcularCargaTotal()}h</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Lotações ativas</p>
                    <p className="text-2xl font-bold">
                      {detalhes.lotacoes.filter(l => l.ativo).length}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Disponível para</p>
                    <p className="text-2xl font-bold text-green-600">
                      {Math.max(0, 50 - calcularCargaTotal())}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Histórico de Lotações */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Histórico de Lotações
                </CardTitle>
              </CardHeader>
              <CardContent>
                {detalhes.lotacoes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma lotação registrada
                  </p>
                ) : (
                  <div className="space-y-4">
                    {detalhes.lotacoes.map((lotacao, idx) => (
                      <div key={lotacao.id}>
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0">
                            <Badge variant={lotacao.ativo ? "default" : "outline"}>
                              {lotacao.ativo ? "Ativa" : "Encerrada"}
                            </Badge>
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium flex items-center gap-2">
                                  <Building2 className="w-4 h-4" />
                                  {lotacao.escola_nome}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Código SAESC: {lotacao.escola_codigo}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium">{lotacao.carga_horaria || 0}h</p>
                                <p className="text-xs text-muted-foreground">semanais</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                Início: {format(new Date(lotacao.data_inicio), "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              {lotacao.data_fim && (
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  Fim: {format(new Date(lotacao.data_fim), "dd/MM/yyyy", { locale: ptBR })}
                                </span>
                              )}
                            </div>

                            {lotacao.observacoes && (
                              <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                                {lotacao.observacoes}
                              </p>
                            )}
                          </div>
                        </div>
                        {idx < detalhes.lotacoes.length - 1 && <Separator className="mt-4" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <p className="text-center text-muted-foreground py-8">
            Nenhuma informação disponível
          </p>
        )}

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
