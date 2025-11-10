import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, X, ChevronDown, ChevronUp, Building2, AlertTriangle } from "lucide-react";
import { EditarCargaForm } from "./EditarCargaForm";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCargaTotalProfessor } from "@/hooks/useCargaTotalProfessor";
import type { Lotacao } from "@/hooks/useLotacoes";

interface ProfessorLotadoCardProps {
  lotacao: Lotacao;
  anoLetivo: string;
  escolaId: string; // escola_saesc
  onAtualizarCarga: (id: string, horas_aula: number, pl: number) => void;
  onRemover: (id: string) => void;
  isSaving: boolean;
}

export function ProfessorLotadoCard({
  lotacao,
  anoLetivo,
  escolaId,
  onAtualizarCarga,
  onRemover,
  isSaving
}: ProfessorLotadoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showOutrasEscolas, setShowOutrasEscolas] = useState(false);
  
  const { data: cargaProfessor } = useCargaTotalProfessor(lotacao.pessoa_id, anoLetivo);

  const professor = lotacao.professor;
  const pessoa = lotacao.pessoa;

  const handleSave = (horas_aula: number, pl: number) => {
    onAtualizarCarga(lotacao.id, horas_aula, pl);
    setIsEditing(false);
  };

  const handleRemove = () => {
    if (confirm("Tem certeza que deseja remover esta lotação?")) {
      onRemover(lotacao.id);
    }
  };

  if (!pessoa) return null;

  const isConvocado = professor?.tipo_vinculo === 'CONVOCADO';
  const cargaContratual = professor?.carga_horaria_contratual || 40;
  const percentualAlocado = cargaProfessor ? (cargaProfessor.carga_alocada / cargaContratual) * 100 : 0;
  const outrasEscolas = cargaProfessor?.lotacoes_ativas.filter(l => l.escola_saesc !== lotacao.escola_saesc) || [];
  const temMultiplasEscolas = outrasEscolas.length > 0;
  const percentualLimite = cargaProfessor ? (cargaProfessor.carga_alocada / 50) * 100 : 0;

  return (
    <Card className="border-none shadow-lg hover:shadow-xl transition-all">
      <CardContent className="p-6">
        {isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold text-lg">
                    {pessoa.nome_completo[0]?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-foreground">{pessoa.nome_completo}</h3>
                  <p className="text-sm text-muted-foreground">
                    {professor?.matricula ? `Matrícula: ${professor.matricula}` : `CPF: ${pessoa.cpf}`}
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                <ChevronUp className="w-4 h-4 mr-2" />
                Recolher
              </Button>
            </div>

            {cargaProfessor && (
              <Alert>
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-medium">
                      Carga na rede: {cargaProfessor.carga_alocada}h / {cargaContratual}h contratual
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Disponível para alocar: {cargaProfessor.carga_disponivel}h
                    </p>
                    {temMultiplasEscolas && (
                      <p className="text-sm text-orange-600">
                        ⚠️ Professor lotado em {cargaProfessor.numero_escolas} escolas
                      </p>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <EditarCargaForm
              professorId={lotacao.pessoa_id}
              anoLetivo={anoLetivo}
              escolaAtualId={lotacao.escola_saesc}
              lotacaoId={lotacao.id}
              horasAulaInicial={lotacao.horas_aula}
              plInicial={lotacao.pl}
              onSave={handleSave}
              onCancel={() => setIsEditing(false)}
              isSaving={isSaving}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-6">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-primary-foreground font-semibold text-lg">
                    {pessoa.nome_completo[0]?.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-semibold text-foreground truncate">
                      {pessoa.nome_completo}
                    </h3>
                    <Badge variant={isConvocado ? "outline" : "secondary"}>
                      {isConvocado ? '📋 Convocado' : '✓ Efetivo'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 flex-wrap text-sm text-muted-foreground">
                    {pessoa.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{pessoa.email}</span>
                      </div>
                    )}
                    {pessoa.telefone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span>{pessoa.telefone}</span>
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
                          Total nesta escola: {lotacao.carga_total}h
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

            {cargaProfessor && (
              <div className="space-y-3 pt-3 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Carga na rede:</span>
                  <span className="font-semibold">
                    {cargaProfessor.carga_alocada}h de {cargaContratual}h
                    {cargaProfessor.carga_disponivel > 0 && (
                      <span className="text-green-600 ml-2">
                        ({cargaProfessor.carga_disponivel}h disponível)
                      </span>
                    )}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <Progress value={percentualAlocado} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{percentualAlocado.toFixed(0)}% da carga contratual</span>
                    {percentualLimite >= 90 && (
                      <span className="text-red-600 font-medium">
                        ⚠️ Próximo do limite (50h)
                      </span>
                    )}
                  </div>
                </div>

                {temMultiplasEscolas && (
                  <Collapsible open={showOutrasEscolas} onOpenChange={setShowOutrasEscolas}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="w-full justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>Outras lotações ({outrasEscolas.length})</span>
                        </div>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showOutrasEscolas ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-2 pt-2">
                      {outrasEscolas.map((outra, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">{outra.escola_nome}</span>
                          <Badge variant="outline">
                            {outra.horas_aula}h + {outra.pl}h PL = {outra.carga_total}h
                          </Badge>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {isConvocado && temMultiplasEscolas && cargaProfessor.numero_escolas >= 3 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      Professor convocado com carga distribuída em {cargaProfessor.numero_escolas} escolas (carga "picada")
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
