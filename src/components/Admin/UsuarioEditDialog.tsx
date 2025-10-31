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
import { Loader2, Plus, X } from 'lucide-react';

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
  
  // Campos extras para professores
  const [cpf, setCpf] = useState('');
  const [matricula, setMatricula] = useState('');
  const [telefone, setTelefone] = useState('');
  const [formacoes, setFormacoes] = useState<string[]>([]);
  const [novaFormacao, setNovaFormacao] = useState('');
  const [professorId, setProfessorId] = useState<string | null>(null);
  const [isProfessor, setIsProfessor] = useState(false);
  const [professorAtivo, setProfessorAtivo] = useState(true);

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
        
        // Verificar se é professor e buscar dados extras
        const hasProfessorRole = roles.includes('PROFESSOR');
        setIsProfessor(hasProfessorRole);
        
        if (hasProfessorRole) {
          const { data: professorData } = await supabase
            .from('professores')
            .select('id, cpf, matricula, telefone, formacoes, ativo')
            .eq('usuario_id', usuario.id)
            .maybeSingle();
          
          if (professorData) {
            setProfessorId(professorData.id);
            setCpf(professorData.cpf || '');
            setMatricula(professorData.matricula || '');
            setTelefone(professorData.telefone || '');
            setProfessorAtivo(professorData.ativo ?? true);
            setFormacoes(
              Array.isArray(professorData.formacoes) 
                ? (professorData.formacoes as string[]) 
                : []
            );
          }
        } else {
          // Reset campos de professor
          setProfessorId(null);
          setCpf('');
          setMatricula('');
          setTelefone('');
          setFormacoes([]);
          setProfessorAtivo(true);
        }
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

  const handleAddFormacao = () => {
    if (novaFormacao.trim()) {
      setFormacoes([...formacoes, novaFormacao.trim()]);
      setNovaFormacao('');
    }
  };

  const handleRemoveFormacao = (index: number) => {
    setFormacoes(formacoes.filter((_, i) => i !== index));
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

      // Atualizar dados do professor se for PROFESSOR
      if (selectedRoles.includes('PROFESSOR')) {
        if (professorId) {
          // Atualizar professor existente
          const { error: profError } = await supabase
            .from('professores')
            .update({
              cpf: cpf || null,
              matricula: matricula || null,
              telefone: telefone || null,
              formacoes: formacoes.length > 0 ? formacoes : null,
              ativo: professorAtivo
            })
            .eq('id', professorId);

          if (profError) throw profError;
        } else {
          // Criar registro de professor se não existir
          const { error: profError } = await supabase
            .from('professores')
            .insert({
              usuario_id: usuario.id,
              nome: nome,
              email: email,
              cpf: cpf || null,
              matricula: matricula || null,
              telefone: telefone || null,
              formacoes: formacoes.length > 0 ? formacoes : null,
              escola_id: null,
              ativo: professorAtivo
            });

          if (profError) throw profError;
        }
      }

      toast.success('Usuário atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
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

          {/* Campos extras para Professores */}
          {isProfessor && (
            <>
              <div className="border-t pt-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold">Dados do Professor</h3>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="professor-ativo"
                      checked={professorAtivo}
                      onCheckedChange={(checked) => setProfessorAtivo(checked as boolean)}
                    />
                    <Label
                      htmlFor="professor-ativo"
                      className="text-sm font-normal cursor-pointer"
                    >
                      Professor Ativo (REME)
                    </Label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input
                      id="cpf"
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div>
                    <Label htmlFor="matricula">Matrícula</Label>
                    <Input
                      id="matricula"
                      value={matricula}
                      onChange={(e) => setMatricula(e.target.value)}
                      placeholder="000000"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="mt-4">
                  <Label>Formações</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={novaFormacao}
                      onChange={(e) => setNovaFormacao(e.target.value)}
                      placeholder="Ex: Pedagogia"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFormacao();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddFormacao}
                      size="icon"
                      variant="outline"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {formacoes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {formacoes.map((formacao, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm"
                        >
                          {formacao}
                          <button
                            type="button"
                            onClick={() => handleRemoveFormacao(index)}
                            className="hover:text-destructive"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
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
