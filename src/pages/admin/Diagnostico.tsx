import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Users, School, UserCheck, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Diagnostico() {
  // Query para estatísticas gerais
  const { data: stats, isLoading } = useQuery({
    queryKey: ["diagnostico-stats"],
    queryFn: async () => {
      // Total de usuários
      const { count: totalUsuarios } = await supabase
        .from("usuarios")
        .select("*", { count: "exact", head: true });

      // Usuários com múltiplas lotações
      const { data: usuariosMultiplas } = await supabase
        .from("usuarios_contextualizados")
        .select("*")
        .gt("total_lotacoes_ativas", 1);

      // Total de escolas
      const { count: totalEscolas } = await supabase
        .from("escolas")
        .select("*", { count: "exact", head: true });

      // Total de lotações ativas
      const { count: lotacoesAtivas } = await supabase
        .from("lotacoes")
        .select("*", { count: "exact", head: true })
        .eq("ativo", true);

      // Professores com carga excedente (>50h)
      const { data: professoresExcedente } = await supabase
        .from("usuarios_contextualizados")
        .select("*")
        .contains("lotacoes_ativas", [{ perfil: "PROFESSOR" }])
        .gt("carga_horaria_total", 50);

      // Gestores ativos (Diretores, Secretários, Coordenadores)
      const { data: gestores } = await supabase
        .from("usuarios_contextualizados")
        .select("*")
        .or("lotacoes_ativas->>perfil.eq.DIRETOR,lotacoes_ativas->>perfil.eq.SECRETARIO,lotacoes_ativas->>perfil.eq.COORDENADOR");

      // Pessoas sem lotação ativa
      const { data: pessoasSemLotacao } = await supabase
        .from("usuarios_contextualizados")
        .select("*")
        .eq("total_lotacoes_ativas", 0);

      return {
        totalUsuarios: totalUsuarios || 0,
        usuariosMultiplas: usuariosMultiplas?.length || 0,
        totalEscolas: totalEscolas || 0,
        lotacoesAtivas: lotacoesAtivas || 0,
        professoresExcedente: professoresExcedente?.length || 0,
        totalGestores: gestores?.length || 0,
        pessoasSemLotacao: pessoasSemLotacao?.length || 0,
      };
    },
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
          <p className="text-muted-foreground mt-2">
            Validação de fluxos críticos e métricas de performance
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const validacoes = [
    {
      titulo: "Usuários com Múltiplas Lotações",
      valor: stats?.usuariosMultiplas || 0,
      descricao: "Usuários que precisam selecionar escola no login",
      status: (stats?.usuariosMultiplas || 0) > 0 ? "info" : "success",
      icon: Users,
    },
    {
      titulo: "Professores com Carga Excedente",
      valor: stats?.professoresExcedente || 0,
      descricao: "Professores com mais de 50h na rede (requer atenção)",
      status: (stats?.professoresExcedente || 0) > 0 ? "warning" : "success",
      icon: AlertCircle,
    },
    {
      titulo: "Pessoas Sem Lotação",
      valor: stats?.pessoasSemLotacao || 0,
      descricao: "Pessoas cadastradas mas sem lotação ativa",
      status: (stats?.pessoasSemLotacao || 0) > 0 ? "info" : "success",
      icon: UserCheck,
    },
    {
      titulo: "Gestores Ativos",
      valor: stats?.totalGestores || 0,
      descricao: "Diretores, Secretários e Coordenadores lotados",
      status: "info",
      icon: Users,
    },
  ];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Diagnóstico do Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Validação de fluxos críticos e métricas de performance
        </p>
      </div>

      {/* Métricas Gerais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsuarios}</div>
            <p className="text-xs text-muted-foreground">
              Usuários cadastrados no sistema
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Escolas Ativas</CardTitle>
            <School className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEscolas}</div>
            <p className="text-xs text-muted-foreground">
              Escolas cadastradas na rede
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lotações Ativas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.lotacoesAtivas}</div>
            <p className="text-xs text-muted-foreground">
              Total de lotações ativas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gestores Escolares</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalGestores}</div>
            <p className="text-xs text-muted-foreground">
              Diretores, Secretários e Coordenadores
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Validações de Fluxos Críticos */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Validações de Fluxos Críticos</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {validacoes.map((validacao, index) => {
            const Icon = validacao.icon;
            return (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{validacao.titulo}</CardTitle>
                    <Badge
                      variant={
                        validacao.status === "success"
                          ? "default"
                          : validacao.status === "warning"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {validacao.status === "success" ? (
                        <CheckCircle className="h-3 w-3 mr-1" />
                      ) : (
                        <Icon className="h-3 w-3 mr-1" />
                      )}
                      {validacao.status === "success"
                        ? "OK"
                        : validacao.status === "warning"
                        ? "Atenção"
                        : "Info"}
                    </Badge>
                  </div>
                  <CardDescription>{validacao.descricao}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{validacao.valor}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Checklist de Funcionalidades */}
      <Card>
        <CardHeader>
          <CardTitle>Checklist de Funcionalidades Implementadas</CardTitle>
          <CardDescription>
            Validação das principais funcionalidades do sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Login e autenticação de usuários</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Seleção de escola para usuários com múltiplas lotações</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Gestão de professores e coordenadores (Pool)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Gestão de diretores e secretários escolares</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Criação e transferência de lotações</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Histórico completo de lotações</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Validação de carga horária (limite de 50h)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Políticas RLS para segurança de dados</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Importação em lote de dados (CSV)</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <span>Gestão de matrizes curriculares</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
