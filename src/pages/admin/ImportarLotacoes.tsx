import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Papa from "papaparse";
import { Upload, FileText, AlertCircle, CheckCircle, Download } from "lucide-react";

interface CSVRow {
  cpf: string;
  nome_completo: string;
  email: string;
  escola_saesc: string;
  perfil: string;
  carga_horaria?: string;
  data_inicio: string;
}

interface ValidationError {
  linha: number;
  erro: string;
}

export default function ImportarLotacoes() {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    sucesso: number;
    erros: number;
    detalhesErros: string[];
  } | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as CSVRow[];
        setCsvData(data);
        await validateData(data);
      },
      error: (error) => {
        toast.error(`Erro ao ler arquivo: ${error.message}`);
      },
    });
  };

  const validateData = async (data: CSVRow[]) => {
    setIsValidating(true);
    const errors: ValidationError[] = [];

    // Buscar todas as escolas para validação
    const { data: escolas } = await supabase
      .from("escolas")
      .select("saesc");
    
    const escolasSaesc = new Set(escolas?.map(e => e.saesc));

    data.forEach((row, index) => {
      const linha = index + 2; // +2 porque linha 1 é cabeçalho e índice começa em 0

      // Validar CPF
      const cpfLimpo = row.cpf.replace(/\D/g, '');
      if (cpfLimpo.length !== 11) {
        errors.push({ linha, erro: "CPF inválido (deve ter 11 dígitos)" });
      }

      // Validar email
      if (!row.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        errors.push({ linha, erro: "Email inválido" });
      }

      // Validar escola_saesc
      if (!escolasSaesc.has(row.escola_saesc)) {
        errors.push({ linha, erro: `Escola com SAESC ${row.escola_saesc} não encontrada` });
      }

      // Validar perfil
      const perfisValidos = ['PROFESSOR', 'COORDENADOR', 'DIRETOR', 'SECRETARIO'];
      if (!perfisValidos.includes(row.perfil)) {
        errors.push({ linha, erro: `Perfil inválido (deve ser: ${perfisValidos.join(', ')})` });
      }

      // Validar carga_horaria para PROFESSOR
      if (row.perfil === 'PROFESSOR') {
        if (!row.carga_horaria || isNaN(Number(row.carga_horaria)) || Number(row.carga_horaria) <= 0) {
          errors.push({ linha, erro: "Carga horária obrigatória e deve ser > 0 para PROFESSOR" });
        }
      }

      // Validar data
      if (!row.data_inicio || isNaN(Date.parse(row.data_inicio))) {
        errors.push({ linha, erro: "Data de início inválida (formato: YYYY-MM-DD)" });
      }
    });

    setValidationErrors(errors);
    setIsValidating(false);
  };

  const handleImport = async () => {
    if (validationErrors.length > 0) {
      toast.error("Corrija os erros antes de importar");
      return;
    }

    setIsImporting(true);
    let sucesso = 0;
    let erros = 0;
    const detalhesErros: string[] = [];

    for (const [index, row] of csvData.entries()) {
      try {
        const cpfLimpo = row.cpf.replace(/\D/g, '');
        
        // 1. Buscar ou criar pessoa
        let pessoaId: string;
        const { data: pessoaExistente } = await supabase
          .from("pessoas")
          .select("id")
          .eq("cpf", cpfLimpo)
          .maybeSingle();

        if (pessoaExistente) {
          pessoaId = pessoaExistente.id;
        } else {
          const { data: novaPessoa, error: pessoaError } = await supabase
            .from("pessoas")
            .insert({
              cpf: cpfLimpo,
              nome_completo: row.nome_completo,
              email: row.email,
              ativo: true,
            })
            .select("id")
            .single();

          if (pessoaError) throw pessoaError;
          pessoaId = novaPessoa.id;
        }

        // 2. Verificar/criar usuário
        const { data: usuarioExistente } = await supabase
          .from("usuarios")
          .select("id")
          .eq("pessoa_id", pessoaId)
          .maybeSingle();

        if (!usuarioExistente) {
          // Criar usuário - precisa criar no auth primeiro
          // Por simplicidade, vamos apenas lotar pessoas que já têm usuário
          // OU usar a função edge admin-create-user se disponível
          throw new Error("Pessoa sem usuário vinculado. Configure o usuário antes de importar lotações.");
        }

        // 3. Criar lotação
        const { error: lotacaoError } = await supabase
          .from("lotacoes")
          .insert({
            pessoa_id: pessoaId,
            escola_saesc: row.escola_saesc,
            perfil: row.perfil,
            carga_horaria: row.carga_horaria ? Number(row.carga_horaria) : null,
            data_inicio: row.data_inicio,
            ativo: true,
          });

        if (lotacaoError) throw lotacaoError;

        sucesso++;
      } catch (error: any) {
        erros++;
        detalhesErros.push(
          `Linha ${index + 2}: ${error.message || 'Erro desconhecido'}`
        );
      }
    }

    setImportResult({ sucesso, erros, detalhesErros });
    setIsImporting(false);

    if (erros === 0) {
      toast.success(`✅ Importadas ${sucesso} lotações com sucesso!`);
      setCsvData([]);
      setValidationErrors([]);
    } else {
      toast.warning(`⚠️ Importadas ${sucesso} lotações. ${erros} com erro.`);
    }
  };

  const downloadErrorLog = () => {
    if (!importResult?.detalhesErros) return;

    const csv = "Linha,Erro\n" + importResult.detalhesErros.map(e => e).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "erros-importacao.csv";
    a.click();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importação de Lotações em Massa</h1>
        <p className="text-muted-foreground mt-2">
          Importe múltiplas lotações através de arquivo CSV
        </p>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>Formato esperado:</strong> cpf, nome_completo, email, escola_saesc, perfil, carga_horaria, data_inicio
          <br />
          <strong>Exemplo:</strong> 123.456.789-00,Ana Silva,ana@escola.com,5001,PROFESSOR,20,2025-03-01
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Arquivo</CardTitle>
          <CardDescription>
            Selecione um arquivo CSV para importar lotações
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Arraste um arquivo CSV ou clique para selecionar
            </p>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <Button asChild>
              <label htmlFor="csv-upload" className="cursor-pointer">
                Selecionar Arquivo
              </label>
            </Button>
          </div>

          {isValidating && (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Validando dados...</p>
            </div>
          )}

          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{validationErrors.length} erro(s) encontrado(s):</strong>
                <ul className="mt-2 space-y-1">
                  {validationErrors.slice(0, 5).map((error, i) => (
                    <li key={i} className="text-sm">
                      Linha {error.linha}: {error.erro}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li className="text-sm font-semibold">
                      ... e mais {validationErrors.length - 5} erro(s)
                    </li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {csvData.length > 0 && validationErrors.length === 0 && (
            <>
              <Alert>
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <strong>✅ Arquivo validado com sucesso!</strong>
                  <br />
                  {csvData.length} {csvData.length === 1 ? 'lotação pronta' : 'lotações prontas'} para importar
                </AlertDescription>
              </Alert>

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>CPF</TableHead>
                        <TableHead>Escola</TableHead>
                        <TableHead>Perfil</TableHead>
                        <TableHead>Carga</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 10).map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.nome_completo}</TableCell>
                          <TableCell>{row.cpf}</TableCell>
                          <TableCell>{row.escola_saesc}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{row.perfil}</Badge>
                          </TableCell>
                          <TableCell>
                            {row.carga_horaria ? `${row.carga_horaria}h` : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {csvData.length > 10 && (
                  <div className="p-2 text-center text-sm text-muted-foreground border-t">
                    ... e mais {csvData.length - 10} linha(s)
                  </div>
                )}
              </div>

              <Button
                onClick={handleImport}
                disabled={isImporting}
                className="w-full"
              >
                {isImporting ? "Importando..." : `Importar ${csvData.length} Lotações`}
              </Button>
            </>
          )}

          {importResult && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Resultado da Importação:</strong>
                <div className="mt-2 space-y-1">
                  <p>✅ Importadas: {importResult.sucesso} lotações</p>
                  {importResult.erros > 0 && (
                    <>
                      <p>⚠️ Erros: {importResult.erros} lotações</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadErrorLog}
                        className="mt-2"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar Log de Erros
                      </Button>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
