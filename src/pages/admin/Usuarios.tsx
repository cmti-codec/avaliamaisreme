import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, RotateCw, Lock, Eye, Unlock } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UsuarioViewDialog } from '@/components/Admin/UsuarioViewDialog';
import { UsuarioEditDialog } from '@/components/Admin/UsuarioEditDialog';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  escola_id: string | null;
  ativo: boolean;
  created_at: string;
}

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [perfilFilter, setPerfilFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<Usuario | null>(null);
  const [toggleStatusUser, setToggleStatusUser] = useState<Usuario | null>(null);

  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      // Buscar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      if (usuariosError) throw usuariosError;

      // Para cada usuário, buscar suas roles
      const usuariosComRoles = await Promise.all(
        usuariosData.map(async (u) => {
          const { data: rolesData } = await supabase
            .from('user_roles')
            .select('role, escola_id')
            .eq('user_id', u.id);

          return {
            id: u.id,
            nome: u.nome,
            email: u.email,
            roles: rolesData?.map((r) => r.role) || [],
            escola_id: u.escola_id,
            ativo: u.ativo,
            created_at: u.created_at,
          };
        })
      );

      return usuariosComRoles as Usuario[];
    },
  });

  const perfis = [
    'ADMIN',
    'GESTOR_SEMED',
    'TECNICO_SEMED',
    'DIRETOR',
    'SECRETARIO',
    'COORDENADOR',
    'PROFESSOR',
  ];

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

  const getPerfilVariant = (perfil: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
      ADMIN: 'default',
      GESTOR_SEMED: 'secondary',
      TECNICO_SEMED: 'secondary',
      DIRETOR: 'outline',
      SECRETARIO: 'outline',
      COORDENADOR: 'outline',
      PROFESSOR: 'outline',
    };
    return variants[perfil] || 'outline';
  };

  const toggleStatusMutation = useMutation({
    mutationFn: async (usuario: Usuario) => {
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: !usuario.ativo })
        .eq('id', usuario.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status do usuário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setToggleStatusUser(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao atualizar status: ' + error.message);
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Email de redefinição de senha enviado com sucesso!');
      setResetPasswordUser(null);
    },
    onError: (error: any) => {
      toast.error('Erro ao enviar email: ' + error.message);
    },
  });

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = perfilFilter === 'all' || (usuario.roles && usuario.roles.includes(perfilFilter));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ativo' && usuario.ativo) ||
      (statusFilter === 'inativo' && !usuario.ativo);

    return matchesSearch && matchesPerfil && matchesStatus;
  });

  return (
    <ProtectedRoute perfisPermitidos={['ADMIN']}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar usuários e permissões do sistema
            </p>
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Novo Usuário
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={perfilFilter} onValueChange={setPerfilFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Todos os perfis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os perfis</SelectItem>
              {perfis.map((perfil) => (
                <SelectItem key={perfil} value={perfil}>
                  {getPerfilLabel(perfil)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">{usuario.nome}</TableCell>
                    <TableCell>{usuario.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {usuario.roles && usuario.roles.length > 0 ? (
                          usuario.roles.map((role) => (
                            <Badge key={role} variant={getPerfilVariant(role)}>
                              {getPerfilLabel(role)}
                            </Badge>
                          ))
                        ) : (
                          <Badge variant="outline">Sem perfil</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUsuario(usuario);
                            setViewDialogOpen(true);
                          }}
                          title="Visualizar detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUsuario(usuario);
                            setEditDialogOpen(true);
                          }}
                          title="Editar usuário"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setResetPasswordUser(usuario)}
                          title="Resetar senha"
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToggleStatusUser(usuario)}
                          title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {usuario.ativo ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Diálogos */}
        <UsuarioViewDialog
          usuario={selectedUsuario}
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
        />

        <UsuarioEditDialog
          usuario={selectedUsuario}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />

        {/* Reset Password Dialog */}
        <AlertDialog
          open={!!resetPasswordUser}
          onOpenChange={(open) => !open && setResetPasswordUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
              <AlertDialogDescription>
                Será enviado um email para <strong>{resetPasswordUser?.email}</strong> com
                instruções para redefinição de senha. Deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  resetPasswordUser && resetPasswordMutation.mutate(resetPasswordUser.email)
                }
              >
                Enviar Email
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Toggle Status Dialog */}
        <AlertDialog
          open={!!toggleStatusUser}
          onOpenChange={(open) => !open && setToggleStatusUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {toggleStatusUser?.ativo ? 'Desativar' : 'Ativar'} Usuário
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja {toggleStatusUser?.ativo ? 'desativar' : 'ativar'} o
                usuário <strong>{toggleStatusUser?.nome}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => toggleStatusUser && toggleStatusMutation.mutate(toggleStatusUser)}
              >
                Confirmar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
