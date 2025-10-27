import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEscolas } from '@/hooks/useEscolas';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface TestProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TestProfile = 'DIRETOR' | 'COORDENADOR' | 'SECRETARIO';

const profileLabels: Record<TestProfile, string> = {
  DIRETOR: 'Diretor',
  COORDENADOR: 'Coordenador',
  SECRETARIO: 'Secretário',
};

export function TestProfileModal({ open, onOpenChange }: TestProfileModalProps) {
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<TestProfile | ''>('');
  const { data: escolas, isLoading } = useEscolas();
  const { startTestMode } = useAuth();

  const handleStartTest = () => {
    if (!selectedSchool || !selectedProfile) return;

    const escola = escolas?.find(e => e.id === selectedSchool);
    if (!escola) return;

    startTestMode(selectedSchool, selectedProfile, escola.nome);
    onOpenChange(false);
    
    // Reset form
    setSelectedSchool('');
    setSelectedProfile('');
  };

  const handleCancel = () => {
    setSelectedSchool('');
    setSelectedProfile('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Modo Teste - Perfil por Escola</DialogTitle>
          <DialogDescription>
            Selecione uma escola e um perfil para testar o sistema sem assumir um usuário real.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Select Escola */}
          <div className="space-y-2">
            <Label htmlFor="escola">Escola</Label>
            {isLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                <SelectTrigger id="escola">
                  <SelectValue placeholder="Selecione uma escola..." />
                </SelectTrigger>
                <SelectContent>
                  {escolas?.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Select Perfil */}
          <div className="space-y-2">
            <Label htmlFor="perfil">Perfil</Label>
            <Select value={selectedProfile} onValueChange={(value) => setSelectedProfile(value as TestProfile)}>
              <SelectTrigger id="perfil">
                <SelectValue placeholder="Selecione um perfil..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(profileLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleStartTest}
            disabled={!selectedSchool || !selectedProfile}
          >
            Entrar em Modo Teste
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
