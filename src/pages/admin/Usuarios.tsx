import { useState, useEffect } from 'react';
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
import { Plus, Search, Edit, RotateCw, Lock, Eye, Unlock, UserCheck, Trash2, BriefcaseBusiness } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { UsuarioViewDialog } from '@/components/Admin/UsuarioViewDialog';
import { UsuarioEditDialog } from '@/components/Admin/UsuarioEditDialog';
import { UsuarioCreateDialog } from '@/components/Admin/UsuarioCreateDialog';
import { ImpersonateDialog } from '@/components/Admin/ImpersonateDialog';
import { LotarUsuarioDialog } from '@/components/Admin/LotarUsuarioDialog';
import { useEscolas } from '@/hooks/useEscolas';
import { useLotacoesGestao } from '@/hooks/useLotacoesGestao';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  primaryRole: string;
  escola_id: string | null;
  ativo: boolean;
  created_at: string;
  professor_id?: string | null;
  professor_ativo?: boolean | null;
  pessoa_id?: string | null;
  lotacoes_ativas?: Array<{
    id: string;
    escola_saesc: string;
    escola_nome: string;
    perfil: string;
    carga_horaria: number | null;
    data_inicio: string;
  }>;
}

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [perfilFilter, setPerfilFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [escolaFilter, setEscolaFilter] = useState<string>('all');
  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<Usuario | null>(null);
  const [toggleStatusUser, setToggleStatusUser] = useState<Usuario | null>(null);
  const [deleteUser, setDeleteUser] = useState<Usuario | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [impersonateUser, setImpersonateUser] = useState<Usuario | null>(null);
  const [impersonateDialogOpen, setImpersonateDialogOpen] = useState(false);
  const [lotarUsuario, setLotarUsuario] = useState<Usuario | null>(null);
  const [lotarDialogOpen, setLotarDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { user: currentUser, impersonate } = useAuth();
  const { data: escolas = [] } = useEscolas();
  const { criarLotacao } = useLotacoesGestao();

  // Capturar ID do usuário logado
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id ?? null);
    });
  }, []);

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      console.log('🔵 Iniciando busca de usuários...');
      
      // Verificar autenticação
      const { data: { user: authUser } } = await supabase.auth.getUser();
      console.log('🔵 Usuário autenticado:', authUser?.id, authUser?.email);
      
      // Buscar usuários
      const { data: usuariosData, error: usuariosError } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      console.log('🔵 Resultado query usuarios:', { 
        count: usuariosData?.length, 
        error: usuariosError?.message 
      });

      if (usuariosError) {
        console.error('❌ Erro ao buscar usuários:', usuariosError);
        throw usuariosError;
      }

      if (!usuariosData || usuariosData.length === 0) {
        console.warn('⚠️ Nenhum usuário retornado do banco');
        return [];
      }

          // Para cada usuário, buscar suas roles e dados de professor
      const usuariosComRoles = await Promise.all(
        usuariosData.map(async (u, index) => {
          const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('role, escola_id')
            .eq('user_id', u.id);

          if (rolesError) {
            console.error(`❌ Erro ao buscar roles do usuário ${u.id}:`, rolesError);
          }

          const roles = rolesData?.map((r) => r.role) || [];
          const primaryRole = roles[0] || 'PROFESSOR';

          // Se tem perfil de professor, buscar dados do professor
          let professor_id = null;
          let professor_ativo = null;
          if (roles.includes('PROFESSOR')) {
            const { data: professorData } = await supabase
              .from('professores')
              .select('id, ativo')
              .eq('usuario_id', u.id)
              .maybeSingle();
            
            if (professorData) {
              professor_id = professorData.id;
              professor_ativo = professorData.ativo;
            }
          }

          // Buscar lotações ativas da pessoa
          let lotacoes_ativas: any[] = [];
          if (u.pessoa_id) {
            const { data: lotacoesData } = await supabase
              .from('lotacoes')
              .select(`
                id,
                escola_saesc,
                perfil,
                carga_horaria,
                data_inicio
              `)
              .eq('pessoa_id', u.pessoa_id)
              .eq('ativo', true)
              .order('data_inicio', { ascending: false });

            if (lotacoesData && lotacoesData.length > 0) {
              // Buscar nomes das escolas
              const escolaIds = lotacoesData.map(l => l.escola_saesc);
              const { data: escolasData } = await supabase
                .from('escolas')
                .select('id, nome')
                .in('id', escolaIds);

              const escolasMap = new Map(escolasData?.map(e => [e.id, e.nome]) || []);
              
              lotacoes_ativas = lotacoesData.map(lot => ({
                ...lot,
                escola_nome: escolasMap.get(lot.escola_saesc) || 'Escola desconhecida'
              }));
            }
          }

          return {
            id: u.id,
            nome: u.nome,
            email: u.email,
            roles,
            primaryRole,
            ativo: u.ativo,
            created_at: u.created_at,
            professor_id,
            professor_ativo,
            lotacoes_ativas,
          };
        })
      );

      console.log('✅ Usuários processados:', usuariosComRoles.length);
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
      // Se for ativar, não há risco de lockout
      if (!usuario.ativo) {
        const { error } = await supabase
          .from('usuarios')
          .update({ ativo: true })
          .eq('id', usuario.id);
        if (error) throw error;
        return;
      }

      // 🛑 PROTEÇÃO 1: Impedir desativar a si mesmo
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser?.id === usuario.id) {
        throw new Error('Você não pode desativar seu próprio usuário.');
      }

      // 🛑 PROTEÇÃO 2: Impedir desativar o último ADMIN ativo
      const { data: adminRows, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ADMIN');
      if (rolesErr) throw rolesErr;

      const adminIds = (adminRows ?? []).map(r => r.user_id);
      if (adminIds.includes(usuario.id)) {
        const { data: activeAdmins, error: actErr } = await supabase
          .from('usuarios')
          .select('id')
          .in('id', adminIds)
          .eq('ativo', true);
        if (actErr) throw actErr;

        if ((activeAdmins?.length ?? 0) <= 1) {
          throw new Error('Você não pode desativar o último Administrador ativo do sistema.');
        }
      }

      // Só desativar se passou por todas as validações
      const { error } = await supabase
        .from('usuarios')
        .update({ ativo: false })
        .eq('id', usuario.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Status do usuário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setToggleStatusUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao atualizar status');
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

  const deleteUserMutation = useMutation({
    mutationFn: async (usuario: Usuario) => {
      // 🛑 PROTEÇÃO 1: Impedir deletar a si mesmo
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser?.id === usuario.id) {
        throw new Error('Você não pode excluir seu próprio usuário.');
      }

      // 🛑 PROTEÇÃO 2: Impedir deletar o último ADMIN ativo
      const { data: adminRows, error: rolesErr } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'ADMIN');
      if (rolesErr) throw rolesErr;

      const adminIds = (adminRows ?? []).map(r => r.user_id);
      if (adminIds.includes(usuario.id)) {
        const { data: activeAdmins, error: actErr } = await supabase
          .from('usuarios')
          .select('id')
          .in('id', adminIds)
          .eq('ativo', true);
        if (actErr) throw actErr;

        if ((activeAdmins?.length ?? 0) <= 1) {
          throw new Error('Você não pode excluir o último Administrador ativo do sistema.');
        }
      }

      // Deletar usuário (cascade vai deletar roles e outras relações)
      const { error } = await supabase
        .from('usuarios')
        .delete()
        .eq('id', usuario.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Usuário excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setDeleteUser(null);
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erro ao excluir usuário');
    },
  });

  // Calcular número de admins ativos
  const activeAdminCount = usuarios.filter(
    u => u.ativo && u.roles?.includes('ADMIN')
  ).length;

  // Buscar escola do usuário que será impersonado
  const { data: impersonateEscola } = useQuery({
    queryKey: ['escola', impersonateUser?.escola_id],
    queryFn: async () => {
      if (!impersonateUser?.escola_id) return null;
      const { data, error } = await supabase
        .from('escolas')
        .select('id, nome')
        .eq('id', impersonateUser.escola_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!impersonateUser?.escola_id,
  });

  const handleImpersonate = async () => {
    if (!impersonateUser) return;
    
    try {
      await impersonate(impersonateUser.id);
      setImpersonateDialogOpen(false);
      setImpersonateUser(null);
    } catch (error: any) {
      console.error('Erro ao assumir perfil:', error);
      toast.error(error.message || 'Erro ao assumir perfil');
    }
  };

  const handleConfirmLotacao = async (data: {
    pessoa_id: string;
    perfil: string;
    escola_saesc: string;
    data_inicio: string;
    carga_horaria?: number | null;
    observacoes?: string;
  }) => {
    try {
      // Validar que o perfil é válido para lotação
      const perfisValidos = ['PROFESSOR', 'COORDENADOR', 'DIRETOR', 'SECRETARIO'];
      if (!perfisValidos.includes(data.perfil)) {
        toast.error('Perfil inválido para lotação');
        return;
      }

      await criarLotacao({
        pessoa_id: data.pessoa_id,
        perfil: data.perfil as 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'SECRETARIO',
        escola_saesc: data.escola_saesc,
        data_inicio: data.data_inicio,
        carga_horaria: data.carga_horaria || undefined,
        observacoes: data.observacoes,
      });
      toast.success('Lotação criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      setLotarDialogOpen(false);
      setLotarUsuario(null);
    } catch (error: any) {
      console.error('Erro ao criar lotação:', error);
      toast.error(error.message || 'Erro ao criar lotação');
    }
  };

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = perfilFilter === 'all' || (usuario.roles && usuario.roles.includes(perfilFilter));
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'ativo' && usuario.ativo) ||
      (statusFilter === 'inativo' && !usuario.ativo);
    const matchesEscola = 
      escolaFilter === 'all' || 
      usuario.lotacoes_ativas?.some(lot => lot.escola_saesc === escolaFilter);

    return matchesSearch && matchesPerfil && matchesStatus && matchesEscola;
  });

  return (
    <ProtectedRoute perfisPermitidos={['ADMIN']}>
      <div className="p-6 space-y-6 max-w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">
              Gerenciar usuários e permissões do sistema
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
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

          <Select value={escolaFilter} onValueChange={setEscolaFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="Todas as escolas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as escolas</SelectItem>
              {escolas.map((escola) => (
                <SelectItem key={escola.id} value={escola.id}>
                  {escola.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="border rounded-lg overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Lotações Ativas</TableHead>
                <TableHead>Status Usuário</TableHead>
                <TableHead>Status Professor</TableHead>
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
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-32 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                      {(() => {
                        // Filtrar lotações pelo perfil selecionado (se não for 'all')
                        let lotacoesFiltradas = perfilFilter === 'all' 
                          ? usuario.lotacoes_ativas 
                          : usuario.lotacoes_ativas?.filter(lot => lot.perfil === perfilFilter);
                        
                        // Filtrar lotações com escolas válidas
                        lotacoesFiltradas = lotacoesFiltradas?.filter(lot => lot.escola_nome);
                        
                        return lotacoesFiltradas && lotacoesFiltradas.length > 0 ? (
                          <div className="space-y-1">
                            {lotacoesFiltradas.map((lot, idx) => (
                              <div key={lot.id} className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="text-xs">
                                  {getPerfilLabel(lot.perfil)}
                                </Badge>
                                <span className="text-muted-foreground truncate max-w-[200px]" title={lot.escola_nome}>
                                  {lot.escola_nome}
                                </span>
                                {/* Mostrar carga horária apenas para PROFESSOR */}
                                {lot.perfil === 'PROFESSOR' && lot.carga_horaria && (
                                  <span className="text-xs text-muted-foreground">
                                    ({lot.carga_horaria}h)
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Sem lotações</span>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={usuario.ativo ? 'default' : 'secondary'}>
                        {usuario.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.roles?.includes('PROFESSOR') ? (
                        usuario.professor_id ? (
                          <Badge variant={usuario.professor_ativo ? 'default' : 'secondary'}>
                            {usuario.professor_ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">
                            Não vinculado
                          </Badge>
                        )
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
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

                        {/* Botão Lotar - só mostra se usuário tem pessoa_id */}
                        {usuario.pessoa_id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setLotarUsuario(usuario);
                              setLotarDialogOpen(true);
                            }}
                            title="Criar nova lotação"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <BriefcaseBusiness className="w-4 h-4" />
                          </Button>
                        )}
                        
                        {/* Botão Testar Perfil - apenas para não-admins */}
                        {!usuario.roles?.includes('ADMIN') && currentUser?.roles?.includes('ADMIN') && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setImpersonateUser(usuario);
                              setImpersonateDialogOpen(true);
                            }}
                            title="Testar perfil deste usuário"
                            className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          >
                            <UserCheck className="w-4 h-4" />
                          </Button>
                        )}
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setToggleStatusUser(usuario)}
                          title={usuario.ativo ? 'Desativar usuário' : 'Ativar usuário'}
                          disabled={
                            (usuario.id === currentUserId && usuario.ativo) ||
                            (usuario.roles?.includes('ADMIN') && usuario.ativo && activeAdminCount === 1)
                          }
                        >
                          {usuario.ativo ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <Unlock className="w-4 h-4" />
                          )}
                        </Button>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteUser(usuario)}
                          title="Excluir usuário"
                          disabled={
                            usuario.id === currentUserId ||
                            (usuario.roles?.includes('ADMIN') && activeAdminCount === 1)
                          }
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
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

        <UsuarioCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
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

        {/* Delete User Dialog */}
        <AlertDialog
          open={!!deleteUser}
          onOpenChange={(open) => !open && setDeleteUser(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir permanentemente o usuário{' '}
                <strong>{deleteUser?.nome}</strong> ({deleteUser?.email})?
                <br /><br />
                <span className="text-destructive font-semibold">
                  Esta ação não pode ser desfeita.
                </span>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteUser && deleteUserMutation.mutate(deleteUser)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Impersonate Dialog */}
        <ImpersonateDialog
          open={impersonateDialogOpen}
          onOpenChange={setImpersonateDialogOpen}
          usuario={impersonateUser}
          escola={impersonateEscola}
          onConfirm={handleImpersonate}
        />

        {/* Lotar Dialog */}
        <LotarUsuarioDialog
          open={lotarDialogOpen}
          onOpenChange={setLotarDialogOpen}
          usuario={lotarUsuario}
          onConfirm={handleConfirmLotacao}
        />
      </div>
    </ProtectedRoute>
  );
}
