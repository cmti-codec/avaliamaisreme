import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, X, AlertTriangle } from "lucide-react";
import { getOpcoesPL } from "@/lib/pl-table";
import { useCargaTotalProfessor } from "@/hooks/useCargaTotalProfessor";

interface EditarCargaFormProps {
  professorId: string;
  anoLetivo: string;
  escolaAtualId: string;
  lotacaoId: string;
  horasAulaInicial?: number | null;
  plInicial?: number | null;
  onSave: (horas_aula: number, pl: number) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function EditarCargaForm({
  professorId,
  anoLetivo,
  escolaAtualId,
  lotacaoId,
  horasAulaInicial,
  plInicial,
  onSave,
  onCancel,
  isSaving
}: EditarCargaFormProps) {
  const [horasAula, setHorasAula] = useState(horasAulaInicial?.toString() || "");
  const [pl, setPl] = useState(plInicial?.toString() || "");
  
  const { data: cargaProfessor } = useCargaTotalProfessor(professorId, anoLetivo);

  const opcoesPL = getOpcoesPL(horasAula);
  const cargaTotalEscola = (parseInt(horasAula) || 0) + (parseInt(pl) || 0);
  
  // Calcular carga atual sem esta lotação
  const cargaAtualSemEstaLotacao = cargaProfessor 
    ? cargaProfessor.carga_alocada - ((horasAulaInicial || 0) + (plInicial || 0))
    : 0;
  
  const cargaTotalRede = cargaAtualSemEstaLotacao + cargaTotalEscola;
  const cargaDisponivel = cargaProfessor 
    ? Math.min(50 - cargaAtualSemEstaLotacao, (cargaProfessor.carga_contratual || 40) - cargaAtualSemEstaLotacao)
    : 0;

  const excedeLimiteRede = cargaTotalRede > 50;
  const excedeLimiteContratual = cargaProfessor && cargaTotalRede > (cargaProfessor.carga_contratual || 40);

  useEffect(() => {
    if (horasAula && opcoesPL.length > 0) {
      if (!pl || !opcoesPL.includes(parseInt(pl))) {
        setPl(opcoesPL[0].toString());
      }
    }
  }, [horasAula, opcoesPL]);

  const handleHorasAulaChange = (value: string) => {
    const ha = parseInt(value) || 0;
    
    if (ha > 33) {
      alert("⚠️ A quantidade máxima de horas-aula é 33.");
      return;
    }

    setHorasAula(value);
  };

  const handleSubmit = () => {
    const ha = parseInt(horasAula);
    const plNum = parseInt(pl);

    if (!ha || ha < 1 || ha > 33) {
      alert("⚠️ Horas-aula deve estar entre 1 e 33.");
      return;
    }

    if (!plNum || !opcoesPL.includes(plNum)) {
      alert("⚠️ O valor de PL selecionado não é válido para esta quantidade de horas-aula.");
      return;
    }

    if (cargaTotalEscola > 50) {
      alert("⚠️ A carga total nesta escola não pode exceder 50 horas.");
      return;
    }

    if (excedeLimiteRede) {
      alert(`❌ Esta alocação faria o professor exceder o limite de 50h na rede!\n\nCarga atual na rede: ${cargaAtualSemEstaLotacao}h\nNova alocação: ${cargaTotalEscola}h\nTotal: ${cargaTotalRede}h (máximo: 50h)`);
      return;
    }

    if (excedeLimiteContratual) {
      const confirmar = confirm(
        `⚠️ Esta alocação excede a carga contratual do professor!\n\n` +
        `Carga contratual: ${cargaProfessor?.carga_contratual}h\n` +
        `Total que será alocado: ${cargaTotalRede}h\n\n` +
        `Deseja continuar mesmo assim?`
      );
      if (!confirmar) return;
    }

    onSave(ha, plNum);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
      {cargaProfessor && (
        <Alert className={excedeLimiteRede ? "border-red-500 bg-red-50 dark:bg-red-950/20" : ""}>
          <AlertDescription>
            <div className="space-y-1 text-sm">
              <p className="font-medium">
                Carga atual na rede: {cargaAtualSemEstaLotacao}h / 50h limite
              </p>
              <p className="text-muted-foreground">
                Disponível: {cargaDisponivel}h
              </p>
              {horasAula && pl && (
                <p className={`font-semibold ${excedeLimiteRede ? 'text-red-600' : 'text-green-600'}`}>
                  → Após salvar: {cargaTotalRede}h na rede
                  {excedeLimiteRede && " ⚠️ EXCEDE LIMITE!"}
                </p>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="horas_aula">Horas-Aula em Sala</Label>
          <Input
            id="horas_aula"
            type="number"
            min="1"
            max="33"
            value={horasAula}
            onChange={(e) => handleHorasAulaChange(e.target.value)}
            placeholder="Ex: 20"
          />
          <p className="text-xs text-muted-foreground">Máximo: 33 horas</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pl">PLs (Planejamento)</Label>
          <Select
            value={pl}
            onValueChange={setPl}
            disabled={!horasAula || opcoesPL.length === 0}
          >
            <SelectTrigger id="pl">
              <SelectValue placeholder={horasAula ? "Selecione o PL..." : "Digite HA primeiro"} />
            </SelectTrigger>
            <SelectContent>
              {opcoesPL.map(plOption => (
                <SelectItem key={plOption} value={plOption.toString()}>
                  {plOption} {plOption === 1 ? 'hora' : 'horas'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {opcoesPL.length > 1 ? 'Opções disponíveis' : 'Valor fixo pela regra'}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Carga Total (nesta escola)</Label>
          <div className="h-10 px-3 py-2 border rounded-md bg-background flex items-center">
            <span className="font-semibold text-lg text-primary">
              {cargaTotalEscola} horas
            </span>
          </div>
          <p className="text-xs text-muted-foreground">HA + PL nesta escola</p>
        </div>
      </div>

      {excedeLimiteRede && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Esta carga fará o professor exceder o limite de 50h na rede!
          </AlertDescription>
        </Alert>
      )}

      {excedeLimiteContratual && !excedeLimiteRede && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ Esta carga excede a carga contratual do professor ({cargaProfessor?.carga_contratual}h)
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!horasAula || !pl || isSaving || excedeLimiteRede}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Salvar Carga
            </>
          )}
        </Button>
        <Button variant="outline" onClick={onCancel} disabled={isSaving}>
          <X className="w-4 h-4 mr-2" />
          Cancelar
        </Button>
      </div>
    </div>
  );
}
