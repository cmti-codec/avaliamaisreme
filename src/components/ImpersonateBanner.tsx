import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function ImpersonateBanner() {
  const { user, isImpersonating, stopImpersonating, testSchoolId, stopTestMode } = useAuth();

  if (!isImpersonating || !user) return null;

  const isTestMode = !!testSchoolId;
  const handleStop = isTestMode ? stopTestMode : stopImpersonating;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <span className="font-semibold text-sm md:text-base">
          {isTestMode ? (
            <>
              ⚡ Modo Teste: {user.primaryRole} em {user.nome.split('(')[1]?.replace(')', '') || 'escola'}. 
              <span className="ml-1 text-xs opacity-90">(Você pode editar normalmente)</span>
            </>
          ) : (
            <>
              Modo Teste: Você está visualizando como{' '}
              <strong className="ml-1">{user.nome}</strong> ({user.primaryRole})
            </>
          )}
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={handleStop}
        className="bg-white text-amber-600 hover:bg-amber-50 flex-shrink-0"
      >
        <LogOut className="mr-2 h-4 w-4" />
        {isTestMode ? 'Sair do Modo Teste' : 'Voltar para Admin'}
      </Button>
    </div>
  );
}
