import { AlertTriangle, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function ImpersonateBanner() {
  const { user, isImpersonating, stopImpersonating } = useAuth();

  if (!isImpersonating || !user) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-lg">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0" />
        <span className="font-semibold text-sm md:text-base">
          Modo Teste: Você está visualizando como{' '}
          <strong className="ml-1">{user.nome}</strong> ({user.primaryRole})
        </span>
      </div>
      
      <Button 
        variant="ghost" 
        size="sm"
        onClick={stopImpersonating}
        className="bg-white text-amber-600 hover:bg-amber-50 flex-shrink-0"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Voltar para Admin
      </Button>
    </div>
  );
}
