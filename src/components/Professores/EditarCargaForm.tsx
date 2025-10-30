import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, X } from "lucide-react";
import { getOpcoesPL } from "@/lib/pl-table";

interface EditarCargaFormProps {
  horasAulaInicial?: number | null;
  plInicial?: number | null;
  onSave: (horas_aula: number, pl: number) => void;
  onCancel: () => void;
  isSaving: boolean;
}

export function EditarCargaForm({
  horasAulaInicial,
  plInicial,
  onSave,
  onCancel,
  isSaving
}: EditarCargaFormProps) {
  const [horasAula, setHorasAula] = useState(horasAulaInicial?.toString() || "");
  const [pl, setPl] = useState(plInicial?.toString() || "");

  const opcoesPL = getOpcoesPL(horasAula);
  const cargaTotal = (parseInt(horasAula) || 0) + (parseInt(pl) || 0);

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

    if (cargaTotal > 50) {
      alert("⚠️ A carga total nesta escola não pode exceder 50 horas.");
      return;
    }

    onSave(ha, plNum);
  };

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
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
              {cargaTotal} horas
            </span>
          </div>
          <p className="text-xs text-muted-foreground">HA + PL nesta escola</p>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          onClick={handleSubmit}
          disabled={!horasAula || !pl || isSaving}
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
