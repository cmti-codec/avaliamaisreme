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
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Edit, RotateCw, Lock, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  perfil: string;
  escola_id: string | null;
  ativo: boolean;
  created_at: string;
}

export default function Usuarios() {
  const [searchTerm, setSearchTerm] = useState('');
  const [perfilFilter, setPerfilFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const queryClient = useQueryClient();

  const { data: usuarios = [], isLoading } = useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .order('nome');

      if (error) throw error;
      return data as Usuario[];
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

  const filteredUsuarios = usuarios.filter((usuario) => {
    const matchesSearch =
      usuario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      usuario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPerfil = !perfilFilter || usuario.perfil === perfilFilter;
    const matchesStatus =
      !statusFilter ||
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
              <SelectItem value="">Todos os perfis</SelectItem>
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
              <SelectItem value="">Todos</SelectItem>
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
                      <Badge variant={getPerfilVariant(usuario.perfil)}>
                        {getPerfilLabel(usuario.perfil)}
                      </Badge>
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
                          onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                        >
                          <RotateCw className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toast.info('Funcionalidade em desenvolvimento')}
                        >
                          <Lock className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </ProtectedRoute>
  );
}
