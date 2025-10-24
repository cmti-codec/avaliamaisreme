import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  escola_id: string | null;
  ativo: boolean;
  created_at: string;
}

interface UsuarioViewDialogProps {
  usuario: Usuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getPerfilLabel = (perfil: string) => {
  const labels: Record<string, string> = {
    ADMIN: 'Administrador',
    GESTOR_SEMED: 'Gestor SEMED',
    TECNICO_SEMED: 'Técnico SEMED',
    DIRETOR: 'Diretor',
    SECRETARIO: 'Secretário',
    COORDENADOR: 'Coordenador',
    PROFESSOR: 'Professor',
  };
  return labels[perfil] || perfil;
};

export function UsuarioViewDialog({ usuario, open, onOpenChange }: UsuarioViewDialogProps) {
  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nome</label>
            <p className="text-lg font-semibold mt-1">{usuario.nome}</p>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <p className="mt-1">{usuario.email}</p>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Perfis</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {usuario.roles.map((role) => (
                <Badge key={role} variant="secondary">
                  {getPerfilLabel(role)}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="mt-2">
              <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                {usuario.ativo ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium text-muted-foreground">Data de Criação</label>
            <p className="mt-1">
              {new Date(usuario.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
