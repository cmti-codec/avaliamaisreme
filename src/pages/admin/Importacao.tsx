import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVUploaderAdvanced } from "@/components/Import/CSVUploaderAdvanced";
import { ImportLogsList } from "@/components/Import/ImportLogsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logImportacao } from "@/lib/import-logger";
import { validateForeignKey, validateUniqueness, ValidationError } from "@/lib/import-validators";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function Importacao() {
  const { toast } = useToast();
  const { user } = useAuth();

  // Verificação adicional de permissão ADMIN
  if (!user?.roles.includes('ADMIN')) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Apenas administradores podem acessar a área de Importação de Dados.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // 1. COMPONENTES CURRICULARES
  const handleImportComponentes = async (data: any[], fileName: string) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const segmentos = row.segmentos ? row.segmentos.split(',').map((s: string) => s.trim()) : [];
        
        const { error } = await supabase
          .from('componentes_curriculares')
          .insert({
            nome: row.nome,
            sigla: row.sigla,
            segmentos: segmentos,
            ativo: true
          });

        if (error) throw error;
        sucessos++;
      } catch (error: any) {
        errors.push({
          linha: i + 2,
          campo: 'geral',
          valor: row.nome,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    await logImportacao({
      tipo: 'Componentes Curriculares',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: errors
    });

    toast({
      title: errors.length === 0 ? "Sucesso!" : "Importação parcial",
      description: `${sucessos} componentes importados, ${errors.length} erros`,
    });

    return { success: sucessos, errors };
  };

  const validateComponentes = async (data: any[]) => {
    return await validateUniqueness(data, 'nome', 'componentes_curriculares', 'Nome do componente');
  };

  // 2. FORMAÇÕES
  const handleImportFormacoes = async (data: any[], fileName: string) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const componentes = row.componentes_permitidos ? 
          row.componentes_permitidos.split(',').map((s: string) => s.trim()) : [];
        const segmentos = row.segmentos ? 
          row.segmentos.split(',').map((s: string) => s.trim()) : [];
        
        const { error } = await supabase
          .from('formacoes')
          .insert({
            nome: row.formacao,
            componentes_permitidos: componentes,
            segmentos: segmentos,
            ativo: true
          });

        if (error) throw error;
        sucessos++;
      } catch (error: any) {
        errors.push({
          linha: i + 2,
          campo: 'geral',
          valor: row.formacao,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    await logImportacao({
      tipo: 'Formações',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: errors
    });

    toast({
      title: errors.length === 0 ? "Sucesso!" : "Importação parcial",
      description: `${sucessos} formações importadas, ${errors.length} erros`,
    });

    return { success: sucessos, errors };
  };

  const validateFormacoes = async (data: any[]) => {
    const errors: ValidationError[] = [];
    
    // Validar que componentes_permitidos existem
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const componentes = row.componentes_permitidos ? 
        row.componentes_permitidos.split(',').map((s: string) => s.trim()) : [];
      
      for (const comp of componentes) {
        const { data: exists } = await supabase
          .from('componentes_curriculares')
          .select('nome')
          .eq('nome', comp)
          .maybeSingle();
        
        if (!exists) {
          errors.push({
            linha: i + 2,
            campo: 'componentes_permitidos',
            valor: comp,
            erro: `Componente "${comp}" não cadastrado`,
            tipo: 'critico'
          });
        }
      }
    }
    
    const uniqueErrors = await validateUniqueness(data, 'formacao', 'formacoes', 'Formação');
    return [...errors, ...uniqueErrors];
  };

  // 3. PROFESSORES
  const handleImportProfessores = async (data: any[], fileName: string) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const formacoes = row.formacao ? [row.formacao] : [];
        
        const { error } = await supabase
          .from('professores')
          .insert({
            nome: row.full_name,
            email: row.email,
            cargo: row.cargo,
            cpf: row.cpf,
            matricula: row.matricula,
            telefone: row.telefone,
            formacoes: formacoes,
            escola_id: null, // Será associado manualmente depois
            ativo: row.ativo.toLowerCase() === 'true' || row.ativo === '1',
            carga_horaria_contratual: 40
          });

        if (error) throw error;
        sucessos++;
      } catch (error: any) {
        errors.push({
          linha: i + 2,
          campo: 'geral',
          valor: row.full_name,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    await logImportacao({
      tipo: 'Professores',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: errors
    });

    toast({
      title: errors.length === 0 ? "Sucesso!" : "Importação parcial",
      description: `${sucessos} professores importados, ${errors.length} erros`,
    });

    return { success: sucessos, errors };
  };

  const validateProfessores = async (data: any[]) => {
    const errors: ValidationError[] = [];
    
    // Validar formação existe
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.formacao) {
        const { data: exists } = await supabase
          .from('formacoes')
          .select('nome')
          .eq('nome', row.formacao)
          .maybeSingle();
        
        if (!exists) {
          errors.push({
            linha: i + 2,
            campo: 'formacao',
            valor: row.formacao,
            erro: `Formação "${row.formacao}" não cadastrada`,
            tipo: 'critico'
          });
        }
      }
    }
    
    const emailErrors = await validateUniqueness(data, 'email', 'professores', 'Email');
    const cpfErrors = await validateUniqueness(data, 'cpf', 'professores', 'CPF');
    const matriculaErrors = await validateUniqueness(data, 'matricula', 'professores', 'Matrícula');
    
    return [...errors, ...emailErrors, ...cpfErrors, ...matriculaErrors];
  };

  // 4. ESCOLAS
  const handleImportEscolas = async (data: any[], fileName: string) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Gerar UUID consistente para saesc
        const saescUuid = crypto.randomUUID();
        
        const { error } = await supabase
          .from('escolas')
          .insert({
            nome: row.escola,
            codigo_inep: row.codigo_inep,
            saesc: saescUuid,
            tipo: row.tipo,
            localidade: row.localidade,
            regiao: row.regiao,
            ativa: true
          });

        if (error) throw error;
        sucessos++;
      } catch (error: any) {
        errors.push({
          linha: i + 2,
          campo: 'geral',
          valor: row.escola,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    await logImportacao({
      tipo: 'Escolas',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: errors
    });

    toast({
      title: errors.length === 0 ? "Sucesso!" : "Importação parcial",
      description: `${sucessos} escolas importadas, ${errors.length} erros`,
    });

    return { success: sucessos, errors };
  };

  const validateEscolas = async (data: any[]) => {
    const inepErrors = await validateUniqueness(data, 'codigo_inep', 'escolas', 'Código INEP');
    return inepErrors;
  };

  // 5. ALUNOS (com criação automática de turmas)
  const handleImportAlunos = async (data: any[], fileName: string) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;
    let turmasCriadas = 0;
    const turmasCache = new Map();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // Buscar escola por código saesc
        const { data: escola } = await supabase
          .from('escolas')
          .select('id')
          .eq('saesc', row.saesc)
          .maybeSingle();
        
        if (!escola) {
          throw new Error(`Escola com saesc ${row.saesc} não encontrada`);
        }

        // Verificar/criar turma
        const turmaKey = `${row.saesc}_${row.sigeta}_${row.trmcla}_${row.sigtur}`;
        let turmaId = turmasCache.get(turmaKey);

        if (!turmaId) {
          const { data: turmaExistente } = await supabase
            .from('turmas')
            .select('id')
            .eq('escola_id', escola.id)
            .eq('segmento', row.sigeta)
            .eq('turma', row.trmcla)
            .eq('turno', row.sigtur)
            .maybeSingle();

          if (turmaExistente) {
            turmaId = turmaExistente.id;
          } else {
            // Criar turma automaticamente
            const { data: novaTurma, error: turmaError } = await supabase
              .from('turmas')
              .insert({
                escola_id: escola.id,
                segmento: row.sigeta,
                grupo_ano: row.sigeta,
                turma: row.trmcla,
                turno: row.sigtur,
                ativa: true
              })
              .select('id')
              .single();

            if (turmaError) throw turmaError;
            turmaId = novaTurma.id;
            turmasCriadas++;
          }

          turmasCache.set(turmaKey, turmaId);
        }

        // Inserir aluno
        const { error } = await supabase
          .from('alunos')
          .insert({
            saesc: escola.id,
            numalu: row.numalu,
            nomalu: row.nomalu,
            nummtr: row.nummtr,
            datmtr: row.datmtr ? new Date(row.datmtr.split('/').reverse().join('-')).toISOString().split('T')[0] : null,
            sigeta: row.sigeta,
            trmcla: row.trmcla,
            sigtur: row.sigtur,
            sigla: row.sigla,
            desoca: row.desoca,
            sioca: row.sioca,
            dtomtrc: row.dtomtrc ? new Date(row.dtomtrc.split('/').reverse().join('-')).toISOString().split('T')[0] : null,
            turma_id: turmaId,
            ativo: true
          });

        if (error) throw error;
        sucessos++;
      } catch (error: any) {
        errors.push({
          linha: i + 2,
          campo: 'geral',
          valor: row.nomalu,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    await logImportacao({
      tipo: 'Alunos',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: errors
    });

    toast({
      title: errors.length === 0 ? "Sucesso!" : "Importação parcial",
      description: `${sucessos} alunos importados, ${turmasCriadas} turmas criadas, ${errors.length} erros`,
    });

    return { success: sucessos, errors };
  };

  const validateAlunos = async (data: any[]) => {
    const errors: ValidationError[] = [];
    
    // Validar saesc existe
    const saescs = [...new Set(data.map(d => d.saesc))];
    for (const saesc of saescs) {
      const { data: escola } = await supabase
        .from('escolas')
        .select('id')
        .eq('saesc', saesc)
        .maybeSingle();
      
      if (!escola) {
        const linhas = data
          .map((row, idx) => row.saesc === saesc ? idx + 2 : null)
          .filter(Boolean);
        
        errors.push({
          linha: linhas[0] as number,
          campo: 'saesc',
          valor: saesc,
          erro: `Escola com código saesc "${saesc}" não encontrada`,
          tipo: 'critico'
        });
      }
    }
    
    return errors;
  };

  // 6. CARGAS HORÁRIAS
  const handleImportCargas = async (data: any[], fileName: string) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        const { error } = await supabase
          .from('cargas_horarias_componentes')
          .insert({
            componente_nome: row.componente_nome,
            etapa_modalidade: row.etapa_modalidade,
            grupo_ano: row.grupo_ano,
            carga_horaria_semanal: parseInt(row.carga_horaria_semanal)
          });

        if (error) throw error;
        sucessos++;
      } catch (error: any) {
        errors.push({
          linha: i + 2,
          campo: 'geral',
          valor: row.componente_nome,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    await logImportacao({
      tipo: 'Cargas Horárias',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: errors
    });

    toast({
      title: errors.length === 0 ? "Sucesso!" : "Importação parcial",
      description: `${sucessos} cargas horárias importadas, ${errors.length} erros`,
    });

    return { success: sucessos, errors };
  };

  const validateCargas = async (data: any[]) => {
    return await validateForeignKey(
      data,
      'componente_nome',
      'componentes_curriculares',
      'nome',
      'Componente não cadastrado'
    );
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Importação de Dados</h1>
        <p className="text-muted-foreground mt-2">
          Importe dados em massa através de arquivos CSV
        </p>
      </div>

      <Tabs defaultValue="componentes" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
          <TabsTrigger value="componentes">Componentes</TabsTrigger>
          <TabsTrigger value="formacoes">Formações</TabsTrigger>
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="escolas">Escolas</TabsTrigger>
          <TabsTrigger value="alunos">Alunos</TabsTrigger>
          <TabsTrigger value="cargas">Cargas</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        {/* 1. COMPONENTES */}
        <TabsContent value="componentes">
          <CSVUploaderAdvanced
            title="Importar Componentes Curriculares"
            description="Importe componentes curriculares (disciplinas) do sistema"
            expectedHeaders={[
              { name: 'nome', required: true, type: 'text' },
              { name: 'sigla', required: true, type: 'text' },
              { name: 'segmentos', required: true, type: 'text' }
            ]}
            onImport={handleImportComponentes}
            onValidate={validateComponentes}
            templateData={[{
              nome: 'MATEMÁTICA',
              sigla: 'MAT',
              segmentos: 'Ensino Fundamental I - Anos Iniciais,Ensino Fundamental II - Anos Finais,EJA'
            }]}
          />
        </TabsContent>

        {/* 2. FORMAÇÕES */}
        <TabsContent value="formacoes">
          <CSVUploaderAdvanced
            title="Importar Formações de Professores"
            description="Importe as formações acadêmicas dos professores"
            expectedHeaders={[
              { name: 'formacao', required: true, type: 'text' },
              { name: 'componentes_permitidos', required: true, type: 'text' },
              { name: 'segmentos', required: true, type: 'text' }
            ]}
            onImport={handleImportFormacoes}
            onValidate={validateFormacoes}
            templateData={[{
              formacao: 'Pedagogia - Ed. Infantil',
              componentes_permitidos: 'ATIVIDADES',
              segmentos: 'Educação Infantil'
            }]}
          />
        </TabsContent>

        {/* 3. PROFESSORES */}
        <TabsContent value="professores">
          <CSVUploaderAdvanced
            title="Importar Professores"
            description="Importe dados dos professores da rede"
            expectedHeaders={[
              { name: 'full_name', required: true, type: 'text' },
              { name: 'email', required: true, type: 'email' },
              { name: 'cargo', required: true, type: 'text' },
              { name: 'cpf', required: true, type: 'text' },
              { name: 'matricula', required: true, type: 'text' },
              { name: 'telefone', required: true, type: 'text' },
              { name: 'formacao', required: true, type: 'text' },
              { name: 'ativo', required: true, type: 'boolean' }
            ]}
            onImport={handleImportProfessores}
            onValidate={validateProfessores}
            templateData={[{
              full_name: 'Maria Souza',
              email: 'maria@escola.com',
              cargo: 'PROFESSORA',
              cpf: '000.000.000-00',
              matricula: '12345',
              telefone: '99999-9999',
              formacao: 'Pedagogia - Ed. Infantil',
              ativo: 'true'
            }]}
          />
        </TabsContent>

        {/* 4. ESCOLAS */}
        <TabsContent value="escolas">
          <CSVUploaderAdvanced
            title="Importar Escolas"
            description="Importe dados das escolas da rede"
            expectedHeaders={[
              { name: 'escola', required: true, type: 'text' },
              { name: 'codigo_inep', required: true, type: 'text' },
              { name: 'saesc', required: true, type: 'text' },
              { name: 'tipo', required: true, type: 'text' },
              { name: 'localidade', required: true, type: 'text' },
              { name: 'regiao', required: true, type: 'text' }
            ]}
            onImport={handleImportEscolas}
            onValidate={validateEscolas}
            templateData={[{
              escola: 'EMEI ALBA LÚCIA SPENGLER DOS SANTOS PEREIRA',
              codigo_inep: '50026151',
              saesc: '5002',
              tipo: 'EMEI',
              localidade: 'URBANA',
              regiao: 'Lagoa'
            }]}
          />
        </TabsContent>

        {/* 5. ALUNOS */}
        <TabsContent value="alunos">
          <CSVUploaderAdvanced
            title="Importar Alunos"
            description="Importe dados dos alunos (turmas serão criadas automaticamente)"
            expectedHeaders={[
              { name: 'saesc', required: true, type: 'text' },
              { name: 'numalu', required: true, type: 'text' },
              { name: 'nomalu', required: true, type: 'text' },
              { name: 'nummtr', required: false, type: 'text' },
              { name: 'datmtr', required: false, type: 'date' },
              { name: 'sigeta', required: true, type: 'text' },
              { name: 'trmcla', required: true, type: 'text' },
              { name: 'sigtur', required: true, type: 'text' },
              { name: 'sigla', required: false, type: 'text' },
              { name: 'desoca', required: false, type: 'text' },
              { name: 'sioca', required: false, type: 'text' },
              { name: 'dtomtrc', required: false, type: 'date' }
            ]}
            onImport={handleImportAlunos}
            onValidate={validateAlunos}
            warningMessage="⚠️ IMPORTANTE: A importação de alunos criará automaticamente as turmas conforme necessário, agrupando por (saesc, sigeta, trmcla, sigtur). Não é preciso importar turmas separadamente!"
            templateData={[{
              saesc: '549',
              numalu: '779728',
              nomalu: 'LAURA SOFIA MARIANO FERREIRA',
              nummtr: '5',
              datmtr: '17/01/2025',
              sigeta: 'GRUPO 4 ESCOLA',
              trmcla: 'A',
              sigtur: 'INTEG',
              sigla: 'GRUPO 4 ESCOLA  A INT',
              desoca: 'TRANSFERIDO',
              sioca: 'TRANS',
              dtomtrc: '25/07/2025'
            }]}
          />
        </TabsContent>

        {/* 6. CARGAS HORÁRIAS */}
        <TabsContent value="cargas">
          <CSVUploaderAdvanced
            title="Importar Cargas Horárias dos Componentes"
            description="Importe as cargas horárias dos componentes por etapa e ano"
            expectedHeaders={[
              { name: 'componente_nome', required: true, type: 'text' },
              { name: 'etapa_modalidade', required: true, type: 'text' },
              { name: 'grupo_ano', required: true, type: 'text' },
              { name: 'carga_horaria_semanal', required: true, type: 'number' }
            ]}
            onImport={handleImportCargas}
            onValidate={validateCargas}
            templateData={[{
              componente_nome: 'MATEMÁTICA',
              etapa_modalidade: 'Ensino Fundamental I - Anos Iniciais',
              grupo_ano: '3º Ano',
              carga_horaria_semanal: '5'
            }]}
          />
        </TabsContent>

        {/* 7. LOGS */}
        <TabsContent value="logs">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Histórico de Importações</h2>
            <ImportLogsList />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
