import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, X, ChevronDown, ChevronUp } from "lucide-react";
import { EditarCargaForm } from "./EditarCargaForm";
import type { Lotacao } from "@/hooks/useLotacoes";

interface ProfessorLotadoCardProps {
  lotacao: Lotacao;
  onAtualizarCarga: (id: string, horas_aula: number, pl: number) => void;
  onRemover: (id: string) => void;
  isSaving: boolean;
}

export function ProfessorLotadoCard({
  lotacao,
  onAtualizarCarga,
  onRemover,
  isSaving
}: ProfessorLotadoCardProps) {
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (horas_aula: number, pl: number) => {
    onAtualizarCarga(lotacao.id, horas_aula, pl);
    setIsEditing(false);
  };

  const handleRemove = () => {
    if (confirm("Tem certeza que deseja remover esta lotação?")) {
      onRemover(lotacao.id);
    }
  };

  const professor = lotacao.professor;
  if (!professor) return null;

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-lg">
                    {professor.nome[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{professor.nome}</h3>
                  <p className="text-sm text-muted-foreground">Matrícula: {professor.matricula}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <ChevronUp className="w-4 h-4 mr-2" />
                Recolher
              </Button>
            </div>

            <EditarCargaForm
              horasAulaInicial={lotacao.horas_aula}
              plInicial={lotacao.pl}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={isSaving}
            />
          </div>
        ) : (
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-foreground font-semibold text-lg">
                  {professor.nome[0]?.toUpperCase()}
                </span>
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <h3 className="text-xl font-semibold text-foreground truncate">
                  {professor.nome}
                </h3>
                
                <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                  {professor.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{professor.email}</span>
                    </div>
                  )}
                  {professor.telefone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <span>{professor.telefone}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  {lotacao.horas_aula ? (
                    <>
                      <Badge variant="secondary">
                        {lotacao.horas_aula}h em sala
                      </Badge>
                      <Badge variant="secondary">
                        {lotacao.pl}h PL
                      </Badge>
                      <Badge className="font-semibold">
                        Total: {lotacao.carga_total}h
                      </Badge>
                    </>
                  ) : (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      Carga não definida
                    </Badge>
                  )}
                  <Badge variant={lotacao.status === "ATIVO" ? "default" : "secondary"}>
                    {lotacao.status}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 flex-shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <ChevronDown className="w-4 h-4 mr-2" />
                {lotacao.horas_aula ? 'Editar' : 'Definir'} Carga
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive hover:bg-destructive/10"
                onClick={handleRemove}
              >
                <X className="w-4 h-4 mr-2" />
                Remover
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
