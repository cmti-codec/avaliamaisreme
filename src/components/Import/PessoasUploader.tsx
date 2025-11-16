import { useState, useRef, ChangeEvent } from "react";
import { Upload, FileText, AlertCircle, CheckCircle2, X, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logImportacao } from "@/lib/import-logger";

interface PessoaImport {
  cpf: string;
  nome_completo: string;
  email: string;
  telefone?: string;
  data_nascimento?: string;
  perfil: 'PROFESSOR' | 'COORDENADOR' | 'DIRETOR' | 'SECRETARIO';
  escola_saesc?: string;
  carga_horaria?: number;
}

export const PessoasUploader = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PessoaImport[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [importResult, setImportResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const expectedHeaders = ['cpf', 'nome_completo', 'email', 'perfil'];
  const optionalHeaders = ['telefone', 'data_nascimento', 'escola_saesc', 'carga_horaria'];

  const parseCSV = (text: string) => {
    const lines = text.split("\n").filter(line => line.trim());
    if (lines.length === 0) {
      setErrors(["Arquivo CSV vazio"]);
      return;
    }

    const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
    
    // Validar headers obrigatórios
    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      setErrors([`Colunas obrigatórias faltando: ${missingHeaders.join(", ")}`]);
      return;
    }

    // Parse preview (primeiras 5 linhas)
    const data: PessoaImport[] = [];
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      data.push(row as PessoaImport);
    }

    setPreview(data);
    setErrors([]);
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setImportResult(null);
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
    setImportResult(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const text = event.target.result as string;
          const lines = text.split("\n").filter(line => line.trim());
          const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ""));
          
          // Parse todos os dados
          const allData: PessoaImport[] = [];
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ""));
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || "";
            });
            allData.push(row as PessoaImport);
          }

          console.log(`📤 Enviando ${allData.length} pessoas para importação`);
          setProgress(30);

          // Chamar edge function para processar
          const { data, error } = await supabase.functions.invoke('import-pessoas', {
            body: { pessoas: allData }
          });

          setProgress(90);

          if (error) {
            throw new Error(error.message);
          }

          const result = data as { success: number; errors: any[] };
          setImportResult(result);
          setProgress(100);

          // Logar importação
          await logImportacao({
            tipo: 'Pessoas',
            nomeArquivo: file.name,
            totalLinhas: allData.length,
            linhasSucesso: result.success,
            linhasErro: result.errors.length,
            detalhesErros: result.errors.map(e => ({
              linha: e.linha,
              campo: 'cpf',
              valor: e.cpf,
              erro: e.erro,
              tipo: 'critico' as const
            }))
          });

          if (result.errors.length === 0) {
            toast({
              title: "✅ Importação concluída!",
              description: `${result.success} pessoas importadas com sucesso.`,
            });
          } else if (result.success === 0) {
            toast({
              title: "❌ Falha na importação",
              description: `${result.errors.length} erros encontrados.`,
              variant: "destructive"
            });
          } else {
            toast({
              title: "⚠️ Importação parcial",
              description: `${result.success} sucessos, ${result.errors.length} erros.`,
            });
          }

          setFile(null);
          setPreview([]);
        }
      };
      reader.readAsText(file);
    } catch (error: any) {
      console.error('Erro na importação:', error);
      setErrors([error.message || 'Erro ao processar importação']);
      toast({
        title: "❌ Erro na importação",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  const downloadTemplate = () => {
    const template = `cpf,nome_completo,email,telefone,data_nascimento,perfil,escola_saesc,carga_horaria
12345678901,João da Silva,joao@exemplo.com,11999999999,1990-01-15,PROFESSOR,saesc-123,40
98765432109,Maria Santos,maria@exemplo.com,11888888888,1985-05-20,COORDENADOR,saesc-456,
11122233344,Pedro Oliveira,pedro@exemplo.com,,,DIRETOR,saesc-789,`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template-pessoas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Importar Pessoas
          </CardTitle>
          <CardDescription>
            Importe pessoas em massa (professores, coordenadores, diretores, secretários) via arquivo CSV.
            Cria automaticamente: pessoa → usuário → role → lotação (se escola fornecida).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instruções */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Formato do CSV</AlertTitle>
            <AlertDescription className="space-y-2">
              <p><strong>Colunas obrigatórias:</strong> cpf, nome_completo, email, perfil</p>
              <p><strong>Colunas opcionais:</strong> telefone, data_nascimento, escola_saesc, carga_horaria</p>
              <p><strong>Perfis válidos:</strong> PROFESSOR, COORDENADOR, DIRETOR, SECRETARIO</p>
              <p className="text-sm text-muted-foreground mt-2">
                💡 Se fornecer escola_saesc, uma lotação automática será criada.
              </p>
            </AlertDescription>
          </Alert>

          {/* Botão Download Template */}
          <Button variant="outline" onClick={downloadTemplate} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Baixar Template CSV
          </Button>

          {/* Upload Area */}
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              Selecionar Arquivo
            </Button>
          </div>

          {/* File Info */}
          {file && (
            <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-medium">{file.name}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setErrors([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erros encontrados</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {preview.length > 0 && errors.length === 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Preview (primeiras 5 linhas)</h3>
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>CPF</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Perfil</TableHead>
                      <TableHead>Escola</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">{row.cpf}</TableCell>
                        <TableCell>{row.nome_completo}</TableCell>
                        <TableCell className="text-xs">{row.email}</TableCell>
                        <TableCell>
                          <span className="px-2 py-1 rounded text-xs bg-primary/10">
                            {row.perfil}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">{row.escola_saesc || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
                size="lg"
              >
                {isImporting ? "Importando..." : "Importar Pessoas"}
              </Button>
            </div>
          )}

          {/* Progress */}
          {isImporting && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-center text-muted-foreground">
                Processando... {progress}%
              </p>
            </div>
          )}

          {/* Result */}
          {importResult && (
            <Alert variant={importResult.errors.length === 0 ? "default" : "destructive"}>
              {importResult.errors.length === 0 ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>Resultado da Importação</AlertTitle>
              <AlertDescription>
                <p><strong>✅ Sucessos:</strong> {importResult.success}</p>
                <p><strong>❌ Erros:</strong> {importResult.errors.length}</p>
                {importResult.errors.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer font-medium">
                      Ver erros ({importResult.errors.length})
                    </summary>
                    <ul className="list-disc list-inside mt-2 text-xs space-y-1">
                      {importResult.errors.slice(0, 10).map((e: any, i: number) => (
                        <li key={i}>
                          Linha {e.linha} (CPF: {e.cpf}): {e.erro}
                        </li>
                      ))}
                      {importResult.errors.length > 10 && (
                        <li className="text-muted-foreground">
                          ... e mais {importResult.errors.length - 10} erros
                        </li>
                      )}
                    </ul>
                  </details>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
