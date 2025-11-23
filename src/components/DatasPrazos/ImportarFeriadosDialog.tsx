import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Download, AlertCircle, CheckCircle2 } from "lucide-react";
import Papa from "papaparse";
import { useCriarFeriado } from "@/hooks/useFeriados";
import { toast } from "sonner";

interface ImportarFeriadosDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FeriadoCSV {
  data: string;
  descricao: string;
  tipo: "FERIADO" | "PONTO_FACULTATIVO";
  abrangencia: "NACIONAL" | "ESTADUAL" | "MUNICIPAL";
}

export function ImportarFeriadosDialog({ open, onOpenChange }: ImportarFeriadosDialogProps) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [processando, setProcessando] = useState(false);
  const [resultado, setResultado] = useState<{ sucesso: number; erro: number; erros: string[] } | null>(null);
  const criarFeriado = useCriarFeriado();

  const baixarModelo = () => {
    const modelo = `data,descricao,tipo,abrangencia
2025-01-01,Ano Novo,FERIADO,NACIONAL
2025-02-25,Carnaval,PONTO_FACULTATIVO,NACIONAL
2025-04-18,Sexta-feira Santa,FERIADO,NACIONAL
2025-04-21,Tiradentes,FERIADO,NACIONAL
2025-05-01,Dia do Trabalho,FERIADO,NACIONAL
2025-09-07,Independência do Brasil,FERIADO,NACIONAL
2025-10-12,Nossa Senhora Aparecida,FERIADO,NACIONAL
2025-11-02,Finados,FERIADO,NACIONAL
2025-11-15,Proclamação da República,FERIADO,NACIONAL
2025-11-20,Dia da Consciência Negra,FERIADO,NACIONAL
2025-12-25,Natal,FERIADO,NACIONAL`;

    const blob = new Blob([modelo], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "modelo_feriados.csv";
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Modelo baixado com sucesso!");
  };

  const handleArquivoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setArquivo(e.target.files[0]);
      setResultado(null);
    }
  };

  const processarImportacao = async () => {
    if (!arquivo) {
      toast.error("Selecione um arquivo CSV");
      return;
    }

    setProcessando(true);
    setResultado(null);

    Papa.parse(arquivo, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        let sucesso = 0;
        let erro = 0;
        const erros: string[] = [];

        for (const row of results.data as FeriadoCSV[]) {
          try {
            // Validar campos obrigatórios
            if (!row.data || !row.descricao || !row.tipo || !row.abrangencia) {
              erros.push(`Linha com dados incompletos: ${JSON.stringify(row)}`);
              erro++;
              continue;
            }

            // Validar formato da data
            const dataObj = new Date(row.data);
            if (isNaN(dataObj.getTime())) {
              erros.push(`Data inválida: ${row.data}`);
              erro++;
              continue;
            }

            // Validar tipo
            if (!["FERIADO", "PONTO_FACULTATIVO"].includes(row.tipo)) {
              erros.push(`Tipo inválido: ${row.tipo} (deve ser FERIADO ou PONTO_FACULTATIVO)`);
              erro++;
              continue;
            }

            // Validar abrangência
            if (!["NACIONAL", "ESTADUAL", "MUNICIPAL"].includes(row.abrangencia)) {
              erros.push(`Abrangência inválida: ${row.abrangencia}`);
              erro++;
              continue;
            }

            // Criar feriado
            await criarFeriado.mutateAsync({
              data: row.data,
              descricao: row.descricao,
              tipo: row.tipo,
              abrangencia: row.abrangencia,
              ano: dataObj.getFullYear(),
            });

            sucesso++;
          } catch (error: any) {
            erros.push(`Erro ao importar ${row.descricao}: ${error.message}`);
            erro++;
          }
        }

        setResultado({ sucesso, erro, erros });
        setProcessando(false);

        if (sucesso > 0) {
          toast.success(`${sucesso} feriado(s) importado(s) com sucesso!`);
        }
        if (erro > 0) {
          toast.error(`${erro} erro(s) encontrado(s) durante a importação`);
        }
      },
      error: (error) => {
        toast.error(`Erro ao ler arquivo: ${error.message}`);
        setProcessando(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Feriados via CSV</DialogTitle>
          <DialogDescription>
            Faça upload de um arquivo CSV com os feriados do ano letivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Formato esperado:</strong> CSV com colunas{" "}
              <code>data, descricao, tipo, abrangencia</code>
              <br />
              • <strong>data:</strong> formato YYYY-MM-DD (ex: 2025-12-25)
              <br />
              • <strong>tipo:</strong> FERIADO ou PONTO_FACULTATIVO
              <br />
              • <strong>abrangencia:</strong> NACIONAL, ESTADUAL ou MUNICIPAL
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button variant="outline" onClick={baixarModelo} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Baixar Modelo
            </Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Arquivo CSV</label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleArquivoChange}
              disabled={processando}
            />
            {arquivo && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {arquivo.name}
              </p>
            )}
          </div>

          {resultado && (
            <Alert variant={resultado.erro > 0 ? "destructive" : "default"}>
              {resultado.erro === 0 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>
                <strong>Resultado da importação:</strong>
                <br />
                ✅ {resultado.sucesso} registro(s) importado(s) com sucesso
                <br />
                ❌ {resultado.erro} erro(s) encontrado(s)
                {resultado.erros.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <strong>Detalhes dos erros:</strong>
                    <ul className="list-disc list-inside text-xs mt-1">
                      {resultado.erros.slice(0, 10).map((erro, idx) => (
                        <li key={idx}>{erro}</li>
                      ))}
                      {resultado.erros.length > 10 && (
                        <li>... e mais {resultado.erros.length - 10} erro(s)</li>
                      )}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button
              onClick={processarImportacao}
              disabled={!arquivo || processando}
            >
              <Upload className="w-4 h-4 mr-2" />
              {processando ? "Processando..." : "Importar"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
