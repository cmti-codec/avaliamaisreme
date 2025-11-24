import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface UsuarioCreateDialogProps {
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

export function UsuarioCreateDialog({ open, onOpenChange }: UsuarioCreateDialogProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [senha, setSenha] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const handleToggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim() || !email.trim() || !cpf.trim() || !senha.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (selectedRoles.length === 0) {
      toast.error('Selecione pelo menos um perfil');
      return;
    }

    if (senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validar CPF (formato simples: apenas dígitos)
    const cpfDigits = cpf.replace(/\D/g, '');
    if (cpfDigits.length !== 11) {
      toast.error('CPF deve ter 11 dígitos');
      return;
    }

    setLoading(true);

    try {
      console.log('🔵 Iniciando criação de usuário:', email.trim());
      console.log('🔵 Roles selecionadas:', selectedRoles);
      console.log('🔵 Dados completos:', {
        nome: nome.trim(),
        email: email.trim(),
        cpf: cpfDigits,
        telefone: telefone.trim() || null,
        senha: '***',
        roles: selectedRoles,
        escola_id: null,
      });

      // Criar usuário via função de backend
      const { data: result, error: fnError } = await supabase.functions.invoke('admin-create-user', {
        body: {
          nome: nome.trim(),
          email: email.trim(),
          cpf: cpfDigits,
          telefone: telefone.trim() || null,
          senha,
          roles: selectedRoles,
          escola_id: null,
        },
      });

      console.log('🟢 Resultado admin-create-user:', result, fnError);

      if (fnError) {
        throw new Error(fnError.message || 'Falha ao criar usuário');
      }

      if (!result?.ok) {
        throw new Error(result?.error || 'Falha ao criar usuário');
      }

      toast.success('Usuário criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      
      // Limpar formulário e fechar
      setNome('');
      setEmail('');
      setCpf('');
      setTelefone('');
      setSenha('');
      setSelectedRoles([]);
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao criar usuário:', error);
      toast.error('Erro ao criar usuário: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Usuário</DialogTitle>
          <DialogDescription>
            Preencha as informações do novo usuário
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome">Nome Completo *</Label>
            <Input
              id="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="(00) 00000-0000"
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemplo.com"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="senha">Senha *</Label>
            <Input
              id="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Perfis *</Label>
            <div className="space-y-2 max-h-48 overflow-y-auto border rounded-md p-3">
              {perfisDisponiveis.map((perfil) => (
                <div key={perfil.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={perfil.value}
                    checked={selectedRoles.includes(perfil.value)}
                    onCheckedChange={() => handleToggleRole(perfil.value)}
                    disabled={loading}
                  />
                  <label
                    htmlFor={perfil.value}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {perfil.label}
                  </label>
                </div>
              ))}
            </div>
          </div>

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
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar Usuário
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
