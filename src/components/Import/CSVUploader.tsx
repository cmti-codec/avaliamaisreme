import { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CSVUploaderProps {
  title: string;
  description: string;
  expectedHeaders: string[];
  onImport: (data: any[]) => Promise<void>;
  templateData?: any[];
}

export const CSVUploader = ({ 
  title, 
  description, 
  expectedHeaders, 
  onImport,
  templateData 
}: CSVUploaderProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length === 0) {
      setErrors(["Arquivo CSV vazio"]);
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    
    // Validar headers
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      setErrors([`Colunas faltando: ${missingHeaders.join(", ")}`]);
      return;
    }

    const data = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      data.push(row);
    }

    setPreview(data);
    setErrors([]);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "text/csv") {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSV(event.target.result as string);
        }
      };
      reader.readAsText(droppedFile);
    } else {
      setErrors(["Por favor, selecione um arquivo CSV válido"]);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          parseCSV(event.target.result as string);
        }
      };
      reader.readAsText(selectedFile);
    } else {
      setErrors(["Por favor, selecione um arquivo CSV válido"]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setIsImporting(true);
    setProgress(0);
    setErrors([]);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          const lines = text.split("\n").filter(line => line.trim());
          const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
          
          const allData = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            allData.push(row);
          }

          setProgress(50);
          await onImport(allData);
          setProgress(100);
          setSuccess(true);
          
          setTimeout(() => {
            setFile(null);
            setPreview([]);
            setSuccess(false);
            setProgress(0);
          }, 3000);
        }
      };
      reader.readAsText(file);
    } catch (error: any) {
      setErrors([error.message || "Erro ao importar dados"]);
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    if (!templateData || templateData.length === 0) return;
    
    const headers = Object.keys(templateData[0]);
    const csvContent = [
      headers.join(","),
      ...templateData.map(row => 
        headers.map(header => `"${row[header]}"`).join(",")
      )
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `template_${title.toLowerCase().replace(/\s+/g, "_")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const clearFile = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Área de Upload */}
        <div
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-foreground mb-2">
            Arraste e solte seu arquivo CSV aqui
          </p>
          <p className="text-xs text-muted-foreground mb-4">ou</p>
          <Button variant="outline" type="button">
            Selecionar arquivo CSV
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>

        {/* Arquivo Selecionado */}
        {file && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={clearFile}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Preview dos Dados */}
        {preview.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Preview (primeiras 5 linhas)</h4>
            <div className="border rounded-lg overflow-auto max-h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    {expectedHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, index) => (
                    <TableRow key={index}>
                      {expectedHeaders.map((header) => (
                        <TableCell key={header} className="text-xs">
                          {row[header]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* Erros */}
        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Sucesso */}
        {success && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-600">
              Dados importados com sucesso!
            </AlertDescription>
          </Alert>
        )}

        {/* Progresso */}
        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-center text-muted-foreground">
              Importando... {progress}%
            </p>
          </div>
        )}

        {/* Botões */}
        <div className="flex gap-2">
          <Button
            onClick={handleImport}
            disabled={!file || preview.length === 0 || isImporting || errors.length > 0}
            className="flex-1"
          >
            {isImporting ? "Importando..." : "Importar Dados"}
          </Button>
          {templateData && (
            <Button variant="outline" onClick={downloadTemplate}>
              Baixar Template
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
