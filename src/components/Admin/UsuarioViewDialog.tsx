import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { format } from 'date-fns';
import { Building2, Calendar } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  escola_id: string | null;
  ativo: boolean;
  created_at: string;
  lotacoes_ativas?: Array<{
    id: string;
    escola_saesc: string;
    escola_nome: string;
    perfil: string;
    carga_horaria: number | null;
    data_inicio: string;
  }>;
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes do Usuário</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Básicas */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Nome</label>
              <p className="text-lg font-semibold mt-1">{usuario.nome}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground">Email</label>
              <p className="mt-1">{usuario.email}</p>
            </div>
          </div>

          <Separator />

          {/* Perfis */}
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

          {/* Lotações Ativas */}
          {usuario.lotacoes_ativas && usuario.lotacoes_ativas.length > 0 && (
            <>
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-3 block">
                  Lotações Ativas ({usuario.lotacoes_ativas.length})
                </label>
                <div className="space-y-2">
                  {usuario.lotacoes_ativas.map((lotacao) => (
                    <Card key={lotacao.id} className="border-muted">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{lotacao.escola_nome}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {getPerfilLabel(lotacao.perfil)}
                              </Badge>
                              {lotacao.carga_horaria && (
                                <span className="flex items-center gap-1">
                                  <strong>{lotacao.carga_horaria}h</strong>/semana
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                desde {format(new Date(lotacao.data_inicio), 'dd/MM/yyyy')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Status e Data de Criação */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Status</label>
              <div className="mt-2">
                <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                  {usuario.ativo ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
            </div>

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
        </div>
      </DialogContent>
    </Dialog>
  );
}
