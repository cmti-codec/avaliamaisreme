import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: string[];
  escola_id: string | null;
  ativo: boolean;
  created_at: string;
}

interface UsuarioEditDialogProps {
  usuario: Usuario | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const perfisDisponiveis = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'GESTOR_SEMED', label: 'Gestor SEMED' },
  { value: 'TECNICO_SEMED', label: 'Técnico SEMED' },
  { value: 'DIRETOR', label: 'Diretor' },
  { value: 'SECRETARIO', label: 'Secretário' },
  { value: 'COORDENADOR', label: 'Coordenador' },
  { value: 'PROFESSOR', label: 'Professor' },
];

export function UsuarioEditDialog({ usuario, open, onOpenChange }: UsuarioEditDialogProps) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [isProfessor, setIsProfessor] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (usuario && open) {
        setNome(usuario.nome);
        setEmail(usuario.email);
        
        // Buscar roles reais do banco
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', usuario.id);
        
        const roles = rolesData?.map(r => r.role) || [];
        setSelectedRoles(roles);
        
        // Verificar se é professor
        const hasProfessorRole = roles.includes('PROFESSOR');
        setIsProfessor(hasProfessorRole);
      }
    };
    
    loadUserData();
  }, [usuario, open]);

  const handleToggleRole = async (role: string) => {
    const isCurrentlySelected = selectedRoles.includes(role);
    const isUnchecking = isCurrentlySelected;
    
    // 🛑 CRÍTICO: Impedir que usuário remova seu próprio perfil ADMIN
    if (role === 'ADMIN' && isUnchecking) {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (sessionUser?.id === usuario?.id) {
        toast.error('Você não pode remover seu próprio perfil de Administrador.');
        return;
      }
    }
    
    // Atualizar roles
    const newRoles = selectedRoles.includes(role) 
      ? selectedRoles.filter((r) => r !== role) 
      : [...selectedRoles, role];
    setSelectedRoles(newRoles);
    
    // Atualizar flag isProfessor
    setIsProfessor(newRoles.includes('PROFESSOR'));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!usuario) return;

    if (selectedRoles.length === 0) {
      toast.error('Selecione pelo menos um perfil');
      return;
    }

    // Validação: Impedir que o usuário remova seu próprio perfil ADMIN
    const { data: { user: sessionUser } } = await supabase.auth.getUser();
    if (sessionUser?.id === usuario.id && !selectedRoles.includes('ADMIN')) {
      toast.error('Você não pode remover seu próprio perfil de Administrador.');
      return;
    }

    setLoading(true);

    try {
      // Atualizar nome e email na tabela usuarios
      const { error: updateError } = await supabase
        .from('usuarios')
        .update({ nome, email })
        .eq('id', usuario.id);

      if (updateError) throw updateError;

      // Buscar roles atuais
      const { data: currentRolesData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', usuario.id);

      const currentRoles = currentRolesData?.map((r) => r.role) || [];

      // Identificar roles a adicionar (estão em selectedRoles mas não em currentRoles)
      const rolesToAdd = selectedRoles.filter((role) => !(currentRoles as string[]).includes(role));

      // Identificar roles a remover (estão em currentRoles mas não em selectedRoles)
      const rolesToRemove = (currentRoles as string[]).filter((role) => !selectedRoles.includes(role));

      // ✅ ORDEM CORRETA: Adicionar novas roles PRIMEIRO (mantém permissões durante a operação)
      if (rolesToAdd.length > 0) {
        const rolesToInsert = rolesToAdd.map((role) => ({
          user_id: usuario.id,
          role: role as 'ADMIN' | 'GESTOR_SEMED' | 'TECNICO_SEMED' | 'DIRETOR' | 'SECRETARIO' | 'COORDENADOR' | 'PROFESSOR',
          escola_id: null,
        }));

        const { error: insertError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (insertError) throw insertError;
      }

      // ✅ ORDEM CORRETA: Remover roles antigas DEPOIS (evita violação de RLS)
      if (rolesToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', usuario.id)
          .in('role', rolesToRemove as any);

        if (deleteError) throw deleteError;
      }


      toast.success('Usuário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['pessoas-pool'] });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar usuário:', error);
      toast.error('Erro ao atualizar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!usuario) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Usuário</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label>Perfis</Label>
            <div className="space-y-2 mt-2 border rounded-lg p-4">
              {perfisDisponiveis.map((perfil) => (
                <div key={perfil.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={perfil.value}
                    checked={selectedRoles.includes(perfil.value)}
                    onCheckedChange={() => handleToggleRole(perfil.value)}
                  />
                  <Label
                    htmlFor={perfil.value}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {perfil.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Info sobre perfil Professor */}
          {isProfessor && (
            <div className="border-t pt-4 mt-4">
              <p className="text-sm text-muted-foreground">
                💡 <strong>Dados complementares de professor</strong> (CPF, matrícula, telefone, formações) são gerenciados na página <strong>Pool de Professores</strong>.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
