import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type PerfilUsuario = 
  | 'ADMIN' 
  | 'GESTOR_SEMED' 
  | 'TECNICO_SEMED' 
  | 'DIRETOR' 
  | 'SECRETARIO' 
  | 'COORDENADOR' 
  | 'PROFESSOR';

interface ProtectedRouteProps {
  children: ReactNode;
  perfisPermitidos?: PerfilUsuario[];
  funcionalidade?: string;
  tipoPermissao?: 'ler' | 'escrever' | 'aprovar';
}

export function ProtectedRoute({
  children,
  perfisPermitidos,
  funcionalidade,
  tipoPermissao = 'ler',
}: ProtectedRouteProps) {
  const { user, loading, temPermissao } = useAuth();

  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verificar perfil se especificado
  if (perfisPermitidos && !user.roles.some(role => perfisPermitidos.includes(role))) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para acessar esta área do sistema.
            Esta funcionalidade está disponível apenas para: {perfisPermitidos.join(', ')}.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Verificar permissão específica se especificada
  if (funcionalidade && !temPermissao(funcionalidade, tipoPermissao)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para {tipoPermissao} nesta funcionalidade.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
