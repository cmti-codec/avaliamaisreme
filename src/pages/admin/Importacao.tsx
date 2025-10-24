import { useState } from "react";
import { CSVUploader } from "@/components/Import/CSVUploader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BookOpen, GraduationCap, Users, School, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Importacao = () => {
  const { toast } = useToast();
  const [validationResults, setValidationResults] = useState<any[]>([]);

  const handleImportComponentes = async (data: any[]) => {
    try {
      const componentes = data.map((row) => ({
        nome: row.nome,
        sigla: row.sigla,
        cor: row.cor,
        segmentos: row.segmentos.split("|"),
        ativo: true,
      }));

      const { error } = await supabase
        .from("componentes_curriculares")
        .insert(componentes);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${componentes.length} componentes curriculares importados`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleImportFormacoes = async (data: any[]) => {
    try {
      const formacoes = data.map((row) => ({
        nome: row.nome,
        componentes_permitidos: row.componentes_permitidos.split("|"),
        segmentos: row.segmentos.split("|"),
        ativo: true,
      }));

      const { error } = await supabase
        .from("formacoes")
        .insert(formacoes);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${formacoes.length} formações importadas`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleImportProfessores = async (data: any[]) => {
    try {
      const professores = data.map((row) => ({
        nome: row.nome,
        escola_id: row.escola_id,
        formacoes: row.formacoes.split("|"),
        carga_horaria_contratual: parseInt(row.carga_horaria),
        horas_pl: parseInt(row.horas_pl),
        ativo: true,
      }));

      const { error } = await supabase
        .from("professores")
        .insert(professores);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${professores.length} professores importados`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleImportTurmas = async (data: any[]) => {
    try {
      const turmas = data.map((row) => {
        const matrizPairs = row.matriz_curricular.split("|");
        const matrizObj: any = {};
        matrizPairs.forEach((pair: string) => {
          const [comp, horas] = pair.split(":");
          matrizObj[comp] = parseInt(horas);
        });

        return {
          escola_id: row.escola_id,
          segmento: row.segmento,
          grupo_ano: row.grupo_ano,
          turma: row.turma,
          turno: row.turno,
          matriz_curricular: matrizObj,
          ativa: true,
        };
      });

      const { error } = await supabase
        .from("turmas")
        .insert(turmas);

      if (error) throw error;

      toast({
        title: "Sucesso!",
        description: `${turmas.length} turmas importadas`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const runValidations = async () => {
    const results = [];

    try {
      // Validar professores sem formação
      const { data: profSemFormacao } = await supabase
        .from("professores")
        .select("nome")
        .or("formacoes.is.null,formacoes.eq.{}");

      if (profSemFormacao && profSemFormacao.length > 0) {
        results.push({
          type: "warning",
          message: `${profSemFormacao.length} professores sem formação cadastrada`,
        });
      }

      // Validar turmas sem matriz
      const { data: turmasSemMatriz } = await supabase
        .from("turmas")
        .select("segmento, grupo_ano, turma")
        .or("matriz_curricular.is.null,matriz_curricular.eq.{}");

      if (turmasSemMatriz && turmasSemMatriz.length > 0) {
        results.push({
          type: "error",
          message: `${turmasSemMatriz.length} turmas sem matriz curricular`,
        });
      }

      // Validar componentes órfãos
      const { data: componentesOrfaos } = await supabase
        .from("componentes_curriculares")
        .select("nome");

      if (componentesOrfaos) {
        results.push({
          type: "info",
          message: `${componentesOrfaos.length} componentes curriculares cadastrados`,
        });
      }

      setValidationResults(results);
      
      toast({
        title: "Validação concluída",
        description: `${results.length} verificações realizadas`,
      });
    } catch (error: any) {
      toast({
        title: "Erro na validação",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Importação de Dados em Massa
        </h1>
        <p className="text-muted-foreground">
          Faça upload de arquivos CSV para popular o banco de dados
        </p>
      </div>

      <Tabs defaultValue="componentes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="componentes" className="gap-2">
            <BookOpen className="h-4 w-4" />
            Componentes
          </TabsTrigger>
          <TabsTrigger value="formacoes" className="gap-2">
            <GraduationCap className="h-4 w-4" />
            Formações
          </TabsTrigger>
          <TabsTrigger value="professores" className="gap-2">
            <Users className="h-4 w-4" />
            Professores
          </TabsTrigger>
          <TabsTrigger value="turmas" className="gap-2">
            <School className="h-4 w-4" />
            Turmas
          </TabsTrigger>
          <TabsTrigger value="validacao" className="gap-2">
            <CheckCircle className="h-4 w-4" />
            Validação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="componentes">
          <CSVUploader
            title="Componentes Curriculares"
            description="Importe componentes curriculares com nome, sigla, cor e segmentos"
            expectedHeaders={["nome", "sigla", "cor", "segmentos"]}
            onImport={handleImportComponentes}
            templateData={[
              {
                nome: "MATEMÁTICA",
                sigla: "MAT",
                cor: "#2ECC71",
                segmentos: "Ed. Infantil|1º ao 5º - EF I|6º ao 9º - EF II",
              },
              {
                nome: "LÍNGUA PORTUGUESA",
                sigla: "POR",
                cor: "#F1C40F",
                segmentos: "1º ao 5º - EF I|6º ao 9º - EF II",
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="formacoes">
          <CSVUploader
            title="Formações"
            description="Importe formações de professores com componentes permitidos"
            expectedHeaders={["nome", "componentes_permitidos", "segmentos"]}
            onImport={handleImportFormacoes}
            templateData={[
              {
                nome: "Pedagogia - Ed. Infantil",
                componentes_permitidos: "ATIVIDADES|ATIVIDADES DIVERSAS",
                segmentos: "Ed. Infantil",
              },
              {
                nome: "Matemática",
                componentes_permitidos: "MATEMÁTICA|APLICAÇÕES MATEMÁTICAS",
                segmentos: "6º ao 9º - EF II|EJA",
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="professores">
          <CSVUploader
            title="Professores"
            description="Importe professores com formações e carga horária"
            expectedHeaders={["nome", "escola_id", "formacoes", "carga_horaria", "horas_pl"]}
            onImport={handleImportProfessores}
            templateData={[
              {
                nome: "Ana Silva",
                escola_id: "uuid-exemplo",
                formacoes: "Matemática|Educação Física",
                carga_horaria: "20",
                horas_pl: "11",
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="turmas">
          <CSVUploader
            title="Turmas e Matrizes Curriculares"
            description="Importe turmas com suas matrizes curriculares"
            expectedHeaders={["escola_id", "segmento", "grupo_ano", "turma", "turno", "matriz_curricular"]}
            onImport={handleImportTurmas}
            templateData={[
              {
                escola_id: "uuid-exemplo",
                segmento: "1º ao 5º - EF I",
                grupo_ano: "3º Ano",
                turma: "A",
                turno: "MATUTINO",
                matriz_curricular: "MATEMÁTICA:5|PORTUGUÊS:5|HISTÓRIA:2",
              },
            ]}
          />
        </TabsContent>

        <TabsContent value="validacao">
          <Card>
            <CardHeader>
              <CardTitle>Validação de Dados</CardTitle>
              <CardDescription>
                Execute verificações para identificar inconsistências
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={runValidations} className="w-full">
                Executar Validações
              </Button>

              {validationResults.length > 0 && (
                <div className="space-y-2">
                  {validationResults.map((result, index) => (
                    <Alert
                      key={index}
                      variant={result.type === "error" ? "destructive" : "default"}
                      className={
                        result.type === "warning"
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950"
                          : result.type === "info"
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                          : ""
                      }
                    >
                      {result.type === "error" && <AlertTriangle className="h-4 w-4" />}
                      {result.type === "warning" && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                      {result.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
                      <AlertTitle>
                        {result.type === "error" && "Erro"}
                        {result.type === "warning" && "Atenção"}
                        {result.type === "info" && "Informação"}
                      </AlertTitle>
                      <AlertDescription>{result.message}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Importacao;
