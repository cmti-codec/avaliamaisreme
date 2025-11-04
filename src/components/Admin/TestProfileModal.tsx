import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEscolas } from '@/hooks/useEscolas';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface RecentSchool {
  id: string;
  nome: string;
  profile: TestProfile;
  timestamp: number;
}

export function TestProfileModal({ open, onOpenChange }: TestProfileModalProps) {
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [selectedProfile, setSelectedProfile] = useState<TestProfile | ''>('');
  const [recentSchools, setRecentSchools] = useState<RecentSchool[]>([]);
  const { data: escolas, isLoading } = useEscolas();
  const { startTestMode } = useAuth();

  // Carregar histórico de escolas recentes
  useEffect(() => {
    const stored = localStorage.getItem('recentTestSchools');
    if (stored) {
      try {
        setRecentSchools(JSON.parse(stored));
      } catch (e) {
        console.error('Erro ao carregar histórico:', e);
      }
    }
  }, [open]);

  const handleStartTest = async () => {
    if (!selectedSchool || !selectedProfile) return;

    const escola = escolas?.find(e => e.id === selectedSchool);
    if (!escola) return;

    await startTestMode(selectedSchool, selectedProfile, escola.nome);
    
    // Salvar no histórico
    const newRecent: RecentSchool = {
      id: selectedSchool,
      nome: escola.nome,
      profile: selectedProfile,
      timestamp: Date.now(),
    };
    
    const updated = [newRecent, ...recentSchools.filter(r => r.id !== selectedSchool)].slice(0, 3);
    localStorage.setItem('recentTestSchools', JSON.stringify(updated));
    
    onOpenChange(false);
    
    // Reset form
    setSelectedSchool('');
    setSelectedProfile('');
  };

  const handleQuickAccess = (school: RecentSchool) => {
    setSelectedSchool(school.id);
    setSelectedProfile(school.profile);
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
          {/* Histórico de Escolas Recentes */}
          {recentSchools.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                Acessos Recentes
              </Label>
              <div className="flex flex-wrap gap-2">
                {recentSchools.map((school) => (
                  <Badge
                    key={school.id}
                    variant="outline"
                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={() => handleQuickAccess(school)}
                  >
                    {school.nome} · {profileLabels[school.profile]}
                  </Badge>
                ))}
              </div>
            </div>
          )}

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
