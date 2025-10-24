import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, UserCheck } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  primaryRole: string;
  escola_id: string | null;
}

interface Escola {
  id: string;
  nome: string;
}

interface ImpersonateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  escola: Escola | null;
  onConfirm: () => void;
}

export function ImpersonateDialog({
  open,
  onOpenChange,
  usuario,
  escola,
  onConfirm,
}: ImpersonateDialogProps) {
  const [isConfirming, setIsConfirming] = useState(false);

  if (!usuario) return null;

  const handleConfirm = () => {
    setIsConfirming(true);
    onConfirm();
    setIsConfirming(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-amber-500" />
            Assumir Perfil de Usuário
          </DialogTitle>
          <DialogDescription>
            Você está prestes a visualizar o sistema como outro usuário
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-2xl">👤</span>
              <div>
                <p className="font-semibold">{usuario.nome}</p>
                <p className="text-sm text-muted-foreground">{usuario.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl">🎭</span>
              <div>
                <p className="text-sm font-medium">Perfil</p>
                <p className="text-sm text-muted-foreground">{usuario.primaryRole}</p>
              </div>
            </div>

            {escola && (
              <div className="flex items-center gap-2">
                <span className="text-xl">🏫</span>
                <div>
                  <p className="text-sm font-medium">Escola</p>
                  <p className="text-sm text-muted-foreground">{escola.nome}</p>
                </div>
              </div>
            )}
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm space-y-2">
              <p className="font-semibold">Neste modo:</p>
              <ul className="space-y-1 ml-4">
                <li>✅ Você verá o sistema EXATAMENTE como este usuário vê</li>
                <li>✅ Poderá testar funcionalidades no contexto dele</li>
                <li>⚠️ Mudanças feitas SERÃO REAIS (não é sandbox)</li>
                <li>⚠️ Ações serão registradas no log com seu ID de admin</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConfirming}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <UserCheck className="mr-2 h-4 w-4" />
            Assumir Perfil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
