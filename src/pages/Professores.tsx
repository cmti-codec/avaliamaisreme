import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Search, UserPlus, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLotacoes } from "@/hooks/useLotacoes";
import { LotarProfessorDialog } from "@/components/Professores/LotarProfessorDialog";
import { ProfessorLotadoCard } from "@/components/Professores/ProfessorLotadoCard";

const Professores = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [anoLetivo, setAnoLetivo] = useState(new Date().getFullYear().toString());
  const [dialogOpen, setDialogOpen] = useState(false);

  const escolaId = user?.escola_id || "";
  const { lotacoes, isLoading, criarLotacao, atualizarCarga, removerLotacao, isSaving } = useLotacoes(escolaId, anoLetivo);

  const handleLotarProfessores = (professorIds: string[]) => {
    professorIds.forEach(professorId => {
      criarLotacao({
        professor_id: professorId,
        escola_id: escolaId,
        ano_letivo: anoLetivo,
      });
    });
    setDialogOpen(false);
  };

  const handleAtualizarCarga = (id: string, horas_aula: number, pl: number) => {
    atualizarCarga({ id, horas_aula, pl });
  };

  const lotacoesFiltradas = lotacoes.filter(lot =>
    lot.professor?.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lot.professor?.matricula?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Professores</h1>
          <p className="text-muted-foreground mt-1">Gerenciar professores lotados na escola</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Ano:</Label>
            <Select value={anoLetivo} onValueChange={setAnoLetivo}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <UserPlus className="w-4 h-4" />
            Lotar Professor
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Buscar professor lotado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertCircle className="w-5 h-5 text-blue-600" />
        <AlertDescription className="text-blue-800 ml-2">
          <p className="font-semibold mb-1">ℹ️ Regras de Carga Horária:</p>
          <ul className="list-disc list-inside text-sm space-y-1">
            <li>Máximo de <strong>33 horas-aula</strong> em sala por professor</li>
            <li>PLs (Planejamento) seguem regra de <strong>1/3 da carga</strong></li>
            <li>Carga total máxima: <strong>50 horas (HA + PL) por professor em TODA A REDE</strong></li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        {isLoading ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </div>
            </CardContent>
          </Card>
        ) : lotacoesFiltradas.length === 0 ? (
          <Card className="border-none shadow-lg">
            <CardContent className="p-12 text-center">
              <UserPlus className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-lg mb-2">
                {searchTerm ? 'Nenhum professor encontrado' : `Nenhum professor lotado para ${anoLetivo}`}
              </p>
              {!searchTerm && (
                <p className="text-muted-foreground/70 text-sm">
                  Clique em "Lotar Professor" para começar
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          lotacoesFiltradas.map((lotacao) => (
            <ProfessorLotadoCard
              key={lotacao.id}
              lotacao={lotacao}
              anoLetivo={anoLetivo}
              escolaId={escolaId}
              onAtualizarCarga={handleAtualizarCarga}
              onRemover={removerLotacao}
              isSaving={isSaving}
            />
          ))
        )}
      </div>

      <LotarProfessorDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        escolaId={escolaId}
        anoLetivo={anoLetivo}
        onLotar={handleLotarProfessores}
        isSaving={isSaving}
      />
    </div>
  );
};

export default Professores;
