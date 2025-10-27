import { useState, DragEvent, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, Download, CheckCircle2, AlertCircle } from "lucide-react";
import { ValidationErrors } from "./ValidationErrors";
import { ValidationError, validateRequired, validateDataTypes } from "@/lib/import-validators";

interface ExpectedHeader {
  name: string;
  required: boolean;
  type: 'text' | 'number' | 'date' | 'boolean' | 'email';
}

interface CSVUploaderAdvancedProps {
  title: string;
  description: string;
  expectedHeaders: ExpectedHeader[];
  onImport: (data: any[], fileName: string) => Promise<{ success: number; errors: ValidationError[] }>;
  templateData: any[];
  onValidate?: (data: any[]) => Promise<ValidationError[]>;
  warningMessage?: string;
}

// Função para detectar automaticamente o delimitador do CSV
const detectDelimiter = (text: string): string => {
  const firstLine = text.split('\n')[0];
  const delimiters = [',', ';', '\t', '|'];
  
  let maxColumns = 0;
  let bestDelimiter = ',';
  
  for (const delimiter of delimiters) {
    const columns = firstLine.split(delimiter).length;
    if (columns > maxColumns) {
      maxColumns = columns;
      bestDelimiter = delimiter;
    }
  }
  
  return bestDelimiter;
};

export function CSVUploaderAdvanced({
  title,
  description,
  expectedHeaders,
  onImport,
  templateData,
  onValidate,
  warningMessage
}: CSVUploaderAdvancedProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>('');

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv')) {
      setErrors([{
        linha: 0,
        campo: 'arquivo',
        valor: selectedFile.name,
        erro: 'O arquivo deve ser .csv',
        tipo: 'critico'
      }]);
      return;
    }

    setFile(selectedFile);
    setSuccess(false);
    setErrors([]);
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      await parseCSV(text);
    };
    reader.readAsText(selectedFile);
  };

  const parseCSV = async (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      setErrors([{
        linha: 0,
        campo: 'arquivo',
        valor: '',
        erro: 'Arquivo CSV vazio ou inválido',
        tipo: 'critico'
      }]);
      return;
    }

    // Detectar delimitador automaticamente
    const delimiter = detectDelimiter(text);
    const delimiterName = delimiter === ',' ? 'vírgula' : 
                          delimiter === ';' ? 'ponto e vírgula' : 
                          delimiter === '\t' ? 'tabulação' : 'pipe';
    setDetectedDelimiter(delimiterName);
    console.log('Delimitador detectado:', delimiterName);

    const headers = lines[0].split(delimiter).map(h => h.trim());
    const expectedHeaderNames = expectedHeaders.map(h => h.name);
    
    // Validar cabeçalhos
    const missingHeaders = expectedHeaderNames.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      setErrors([{
        linha: 1,
        campo: 'cabeçalho',
        valor: missingHeaders.join(', '),
        erro: `Colunas obrigatórias faltando: ${missingHeaders.join(', ')}`,
        tipo: 'critico'
      }]);
      return;
    }

    // Parse dos dados
    const data = lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim());
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });

    setPreview(data.slice(0, 10));
    
    // Validações básicas
    let allErrors: ValidationError[] = [];
    
    // Validar campos obrigatórios
    const requiredFields = expectedHeaders.filter(h => h.required).map(h => h.name);
    const requiredErrors = validateRequired(data, requiredFields);
    allErrors = [...allErrors, ...requiredErrors];
    
    // Validar tipos de dados
    const fieldTypes: Record<string, any> = {};
    expectedHeaders.forEach(h => {
      fieldTypes[h.name] = h.type;
    });
    const typeErrors = validateDataTypes(data, fieldTypes);
    allErrors = [...allErrors, ...typeErrors];
    
    // Validações customizadas (chaves estrangeiras, etc)
    if (onValidate) {
      const customErrors = await onValidate(data);
      allErrors = [...allErrors, ...customErrors];
    }
    
    setErrors(allErrors);
  };

  const handleImport = async () => {
    if (!file || preview.length === 0) return;
    
    const criticalErrors = errors.filter(e => e.tipo === 'critico');
    if (criticalErrors.length > 0) {
      return;
    }

    setIsImporting(true);
    setProgress(0);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        const delimiter = detectDelimiter(text);
        const headers = lines[0].split(delimiter).map(h => h.trim());
        
        const data = lines.slice(1).map(line => {
          const values = line.split(delimiter).map(v => v.trim());
          const row: any = {};
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          return row;
        });

        setProgress(50);
        const result = await onImport(data, file.name);
        setProgress(100);
        
        if (result.errors.length === 0) {
          setSuccess(true);
          setTimeout(() => {
            clearFile();
          }, 3000);
        } else {
          setErrors(result.errors);
        }
      };
      reader.readAsText(file);
    } catch (error) {
      console.error('Erro na importação:', error);
      setErrors([{
        linha: 0,
        campo: 'sistema',
        valor: '',
        erro: 'Erro ao processar importação',
        tipo: 'critico'
      }]);
    } finally {
      setIsImporting(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setSuccess(false);
    setProgress(0);
  };

  const downloadTemplate = () => {
    const headers = expectedHeaders.map(h => h.name);
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(h => row[h] || '').join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `template_${title.toLowerCase().replace(/\s+/g, '_')}.csv`;
    link.click();
  };

  const criticalErrors = errors.filter(e => e.tipo === 'critico');
  const canImport = file && preview.length > 0 && criticalErrors.length === 0 && !isImporting;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {warningMessage && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {warningMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                Arraste e solte o arquivo CSV aqui
              </p>
              <p className="text-xs text-muted-foreground mb-4">ou</p>
              <Button asChild variant="secondary">
                <label>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileInput}
                  />
                  Selecionar Arquivo
                </label>
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <FileText className="h-5 w-5" />
              <span className="font-medium">{file.name}</span>
              <Button variant="ghost" size="sm" onClick={clearFile}>
                Remover
              </Button>
            </div>
          )}
        </div>

        {preview.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold">Preview (10 primeiras linhas)</h4>
              {detectedDelimiter && (
                <span className="text-sm text-muted-foreground">
                  Delimitador: <strong>{detectedDelimiter}</strong>
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead>
                  <tr className="bg-muted">
                    {expectedHeaders.map(h => (
                      <th key={h.name} className="p-2 text-left border">
                        {h.name}
                        {h.required && <span className="text-destructive ml-1">*</span>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, idx) => (
                    <tr key={idx} className="border-b">
                      {expectedHeaders.map(h => (
                        <td key={h.name} className="p-2 border">
                          {row[h.name]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <ValidationErrors errors={errors} />

        {success && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Importação concluída com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-center text-muted-foreground">
              Importando... {progress}%
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!canImport}
            className="flex-1"
          >
            {isImporting ? 'Importando...' : 'Importar'}
          </Button>
          <Button
            onClick={downloadTemplate}
            variant="outline"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Template
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
