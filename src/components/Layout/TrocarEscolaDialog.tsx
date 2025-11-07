import { useState } from 'react';
import { useSchool } from '@/contexts/SchoolContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { School, ArrowRight, Check } from 'lucide-react';

interface TrocarEscolaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TrocarEscolaDialog({ open, onOpenChange }: TrocarEscolaDialogProps) {
  const { todasLotacoes, escolaAtual, trocarEscola } = useSchool();
  const [isChanging, setIsChanging] = useState(false);

  const handleSelectSchool = async (lotacao_id: string) => {
    setIsChanging(true);
    await trocarEscola(lotacao_id);
    setIsChanging(false);
    onOpenChange(false);
    window.location.reload(); // Recarregar página para aplicar novo contexto
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Trocar Escola</DialogTitle>
          <DialogDescription>
            Selecione a escola que deseja acessar
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 max-h-[60vh] overflow-y-auto">
          {todasLotacoes.map((lotacao) => {
            const isAtual = escolaAtual?.lotacao_id === lotacao.lotacao_id;

            return (
              <Card
                key={lotacao.lotacao_id}
                className={`cursor-pointer transition-all ${
                  isAtual
                    ? 'border-primary bg-primary/5'
                    : 'hover:border-primary hover:shadow-md'
                }`}
                onClick={() => !isAtual && handleSelectSchool(lotacao.lotacao_id)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <School className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base flex items-center gap-2">
                          {lotacao.escola_nome}
                          {isAtual && (
                            <Badge variant="default" className="ml-2">
                              <Check className="w-3 h-3 mr-1" />
                              Atual
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{lotacao.perfil}</Badge>
                          {lotacao.perfil === 'PROFESSOR' && lotacao.carga_horaria && (
                            <span className="text-sm text-muted-foreground">
                              {lotacao.carga_horaria}h/semana
                            </span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    {!isAtual && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isChanging}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
