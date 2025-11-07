import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchool } from '@/contexts/SchoolContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { School, AlertTriangle, ArrowRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function SelecaoEscola() {
  const { user } = useAuth();
  const { todasLotacoes, trocarEscola, loading, needsSchoolSelection } = useSchool();
  const navigate = useNavigate();

  useEffect(() => {
    // Se não precisa selecionar escola, redirecionar
    if (!loading && !needsSchoolSelection) {
      navigate('/');
    }
  }, [loading, needsSchoolSelection, navigate]);

  const handleSelectSchool = async (lotacao_id: string) => {
    await trocarEscola(lotacao_id);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <p className="text-muted-foreground">Carregando suas lotações...</p>
      </div>
    );
  }

  // Nenhuma lotação ativa
  if (todasLotacoes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-9 h-9 text-destructive" />
            </div>
            <CardTitle>Sem lotação ativa</CardTitle>
            <CardDescription>
              Você não possui nenhuma lotação ativa no sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Entre em contato com a Secretaria de Educação para regularizar sua situação.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              className="w-full mt-4"
              onClick={() => {
                localStorage.clear();
                navigate('/login');
              }}
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Bem-vindo(a), {user?.nome}!</h1>
          <p className="text-muted-foreground">
            Você está lotado(a) em {todasLotacoes.length} {todasLotacoes.length === 1 ? 'escola' : 'escolas'}. Selecione para continuar:
          </p>
        </div>

        <div className="grid gap-4">
          {todasLotacoes.map((lotacao) => (
            <Card
              key={lotacao.lotacao_id}
              className="cursor-pointer hover:border-primary transition-all hover:shadow-md"
              onClick={() => handleSelectSchool(lotacao.lotacao_id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <School className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{lotacao.escola_nome}</CardTitle>
                      <CardDescription className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">{lotacao.perfil}</Badge>
                        {lotacao.perfil === 'PROFESSOR' && lotacao.carga_horaria && (
                          <span className="text-sm text-muted-foreground">
                            {lotacao.carga_horaria}h/semana
                          </span>
                        )}
                      </CardDescription>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Você poderá trocar de escola a qualquer momento através do menu no topo da página
        </p>
      </div>
    </div>
  );
}
