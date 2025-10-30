import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CSVUploaderAdvanced } from "@/components/Import/CSVUploaderAdvanced";
import { ImportLogsList } from "@/components/Import/ImportLogsList";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { logImportacao } from "@/lib/import-logger";
import { validateForeignKey, validateUniqueness, ValidationError, validateDataTypes, convertBrazilianDateToISO, validateRequired } from "@/lib/import-validators";
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
    // Validar unicidade como aviso (não crítico)
    const uniquenessErrors = await validateUniqueness(
      data, 
      'nome', 
      'componentes_curriculares', 
      'Componente',
      true // treatAsWarning = true
    );
    
    // Filtrar apenas registros NOVOS (não duplicados)
    const existingNames = new Set(uniquenessErrors.map(e => e.valor));
    const newData = data.filter(row => !existingNames.has(row.nome));
    
    const errors: ValidationError[] = [];
    let sucessos = 0;

    for (let i = 0; i < newData.length; i++) {
      const row = newData[i];
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
          linha: data.indexOf(row) + 2,
          campo: 'geral',
          valor: row.nome,
          erro: error.message || 'Erro ao inserir',
          tipo: 'critico'
        });
      }
    }

    const allErrors = [...uniquenessErrors, ...errors];
    const skipped = data.length - newData.length;

    await logImportacao({
      tipo: 'Componentes Curriculares',
      nomeArquivo: fileName,
      totalLinhas: data.length,
      linhasSucesso: sucessos,
      linhasErro: errors.length,
      detalhesErros: allErrors
    });

    const successMsg = sucessos > 0 ? `${sucessos} componentes importados` : '';
    const skippedMsg = skipped > 0 ? `${skipped} pulados (já existem)` : '';
    const errorMsg = errors.length > 0 ? `${errors.length} erros` : '';
    
    const parts = [successMsg, skippedMsg, errorMsg].filter(Boolean);

    toast({
      title: errors.length === 0 && sucessos > 0 ? "✅ Componentes importados com sucesso!" : skipped > 0 && sucessos === 0 ? "⚠️ Nenhum registro novo" : "⚠️ Importação parcial",
      description: parts.join(', '),
      variant: errors.length > 0 && sucessos === 0 ? "destructive" : "default",
    });

    return { success: sucessos, errors: allErrors };
  };

  const validateComponentes = async (data: any[]) => {
    return await validateUniqueness(data, 'nome', 'componentes_curriculares', 'Componente', true);
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
      title: errors.length === 0 ? "✅ Formações importadas com sucesso!" : "⚠️ Importação parcial",
      description: `${sucessos} formações importadas, ${errors.length} erros`,
      variant: errors.length > 0 && sucessos === 0 ? "destructive" : "default",
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
            escola_id: null, // Pool da REME (sem vínculo com escola específica)
            funcao_atual: 'PROFESSOR', // Função padrão
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
      title: errors.length === 0 ? "✅ Professores importados com sucesso!" : "⚠️ Importação parcial",
      description: `${sucessos} professores importados, ${errors.length} erros`,
      variant: errors.length > 0 && sucessos === 0 ? "destructive" : "default",
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
    let novasEscolas = 0;
    let escolasAtualizadas = 0;

    // Buscar escolas existentes para contagem
    const { data: existingSchools } = await supabase
      .from('escolas')
      .select('codigo_inep, codigo_saesc');
    
    const existingIneps = new Set(existingSchools?.map(e => e.codigo_inep).filter(Boolean) || []);
    const existingSaescs = new Set(existingSchools?.map(e => e.codigo_saesc).filter(Boolean) || []);

    // Preparar dados para upsert
    const escolasParaUpsert = data.map(row => {
      const isUpdate = existingIneps.has(row.codigo_inep) || existingSaescs.has(row.saesc);
      if (isUpdate) {
        escolasAtualizadas++;
      } else {
        novasEscolas++;
      }

      return {
        nome: row.escola,
        codigo_inep: row.codigo_inep || null,
        saesc: crypto.randomUUID(), // UUID gerado automaticamente
        codigo_saesc: row.saesc,
        tipo: row.tipo,
        localidade: row.localidade,
        regiao: row.regiao,
        ativa: true
      };
    });

    // Separar escolas com e sem INEP
    const escolasComINEP = escolasParaUpsert.filter(e => e.codigo_inep);
    const escolasSemINEP = escolasParaUpsert.filter(e => !e.codigo_inep);

    try {
      // UPSERT escolas com INEP (usa codigo_inep como chave de conflito)
      if (escolasComINEP.length > 0) {
        const { error: inepError } = await supabase
          .from('escolas')
          .upsert(escolasComINEP, { 
            onConflict: 'codigo_inep',
            ignoreDuplicates: false 
          });

        if (inepError) throw inepError;
      }

      // UPSERT escolas sem INEP (usa codigo_saesc como chave de conflito)
      if (escolasSemINEP.length > 0) {
        const { error: saescError } = await supabase
          .from('escolas')
          .upsert(escolasSemINEP, { 
            onConflict: 'codigo_saesc',
            ignoreDuplicates: false 
          });

        if (saescError) throw saescError;
      }

      await logImportacao({
        tipo: 'Escolas',
        nomeArquivo: fileName,
        totalLinhas: data.length,
        linhasSucesso: data.length,
        linhasErro: 0,
        detalhesErros: []
      });

      const parts = [];
      if (novasEscolas > 0) parts.push(`${novasEscolas} novas`);
      if (escolasAtualizadas > 0) parts.push(`${escolasAtualizadas} atualizadas`);

      toast({
        title: "✅ Escolas importadas com sucesso!",
        description: parts.join(' | '),
      });

      return { success: data.length, errors: [] };
    } catch (error: any) {
      errors.push({
        linha: 0,
        campo: 'geral',
        valor: '-',
        erro: error.message || 'Erro ao processar upsert',
        tipo: 'critico'
      });

      await logImportacao({
        tipo: 'Escolas',
        nomeArquivo: fileName,
        totalLinhas: data.length,
        linhasSucesso: 0,
        linhasErro: data.length,
        detalhesErros: errors
      });

      toast({
        title: "❌ Erro na importação de escolas",
        description: error.message,
        variant: "destructive"
      });

      return { success: 0, errors };
    }
  };

  const validateEscolas = async (data: any[]) => {
    const errors: ValidationError[] = [];
    
    // Validar duplicatas de INEP dentro do próprio CSV
    const inepCounts = new Map<string, number[]>();
    data.forEach((row, index) => {
      if (row.codigo_inep) {
        if (!inepCounts.has(row.codigo_inep)) {
          inepCounts.set(row.codigo_inep, []);
        }
        inepCounts.get(row.codigo_inep)!.push(index + 2);
      }
    });

    // Avisar sobre INEPs duplicados no CSV
    inepCounts.forEach((linhas, inep) => {
      if (linhas.length > 1) {
        errors.push({
          linha: linhas[0],
          campo: 'codigo_inep',
          valor: inep,
          erro: `Código INEP aparece ${linhas.length}x no CSV (linhas ${linhas.join(', ')}) - última ocorrência será mantida`,
          tipo: 'aviso'
        });
      }
    });

    // Validar duplicatas de codigo_saesc dentro do CSV
    const saescCounts = new Map<string, number[]>();
    data.forEach((row, index) => {
      if (row.saesc) {
        if (!saescCounts.has(row.saesc)) {
          saescCounts.set(row.saesc, []);
        }
        saescCounts.get(row.saesc)!.push(index + 2);
      }
    });

    saescCounts.forEach((linhas, saesc) => {
      if (linhas.length > 1) {
        errors.push({
          linha: linhas[0],
          campo: 'saesc',
          valor: saesc,
          erro: `Código SAESC aparece ${linhas.length}x no CSV (linhas ${linhas.join(', ')}) - última ocorrência será mantida`,
          tipo: 'aviso'
        });
      }
    });
    
    return errors;
  };

  // Função para mapear sigeta para etapa/modalidade padronizada
  const mapSigetaToEtapaModalidade = (sigeta: string): string => {
    const normalized = sigeta
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toUpperCase()
      .trim();

    // Educação Infantil: GRUPO 1-5, CRECHE, BERÇÁRIO, PRÉ-ESCOLA
    if (
      normalized.includes('GRUPO') ||
      normalized.includes('CRECHE') ||
      normalized.includes('BERCARIO') ||
      normalized.includes('PRE-ESCOLA') ||
      normalized.includes('INFANTIL')
    ) {
      return 'Educação Infantil';
    }

    // Ensino Fundamental I: 1º ao 5º ano
    if (
      /[1-5].*ANO/.test(normalized) &&
      !normalized.includes('EJA')
    ) {
      return 'Ensino Fundamental I - Anos Iniciais';
    }

    // Ensino Fundamental II: 6º ao 9º ano
    if (
      /[6-9].*ANO/.test(normalized) &&
      !normalized.includes('EJA')
    ) {
      return 'Ensino Fundamental II - Anos Finais';
    }

    // EJA: qualquer coisa com EJA
    if (normalized.includes('EJA')) {
      return 'EJA';
    }

    // Fallback: tentar inferir pelo número
    const match = normalized.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1]);
      if (num >= 1 && num <= 5) return 'Ensino Fundamental I - Anos Iniciais';
      if (num >= 6 && num <= 9) return 'Ensino Fundamental II - Anos Finais';
    }

    // Se não conseguir mapear, lançar erro descritivo
    throw new Error(`Não foi possível mapear "${sigeta}" para uma etapa/modalidade válida`);
  };

  // 5. ALUNOS (com criação automática de turmas)
  const handleImportAlunos = async (data: any[], fileName: string, onProgress?: (progress: number) => void) => {
    const errors: ValidationError[] = [];
    let sucessos = 0;
    let turmasCriadas = 0;
    const turmasCache = new Map();

    // Função para mapear siglas de turno para valores válidos
    const mapTurnoSigla = (sigla: string | null | undefined): string | null => {
      if (!sigla) return null;

      const normalize = (s: string) =>
        s
          .normalize('NFD')
          .replace(/\p{Diacritic}/gu, '')
          .toUpperCase()
          .trim()
          .replace(/[^A-Z]/g, '');

      const s = normalize(sigla);

      if (s.startsWith('M') || s.startsWith('MAT') || s.startsWith('MATU') || s.startsWith('MATUTINO'))
        return 'MATUTINO';
      if (s.startsWith('V') || s.startsWith('VES') || s.startsWith('VESP') || s.startsWith('VESPER') || s.startsWith('VESPERTINO'))
        return 'VESPERTINO';
      if (s.startsWith('N') || s.startsWith('NOT') || s.startsWith('NOTU') || s.startsWith('NOTURNO'))
        return 'NOTURNO';
      if (s.startsWith('I') || s.startsWith('INT') || s.startsWith('INTG') || s.startsWith('INTEG') || s.startsWith('INTEGRAL'))
        return 'INTEGRAL';

      return null;
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      // Atualizar progresso
      if (onProgress) {
        const progress = Math.round(((i + 1) / data.length) * 100);
        onProgress(progress);
      }
      
      try {
        // Buscar escola por código saesc
        const { data: escola } = await supabase
          .from('escolas')
          .select('id')
          .eq('codigo_saesc', row.saesc)
          .maybeSingle();
        
        if (!escola) {
          throw new Error(`Escola com saesc ${row.saesc} não encontrada`);
        }
        // Normalizar turno e validar antes de criar turma
        const turno = mapTurnoSigla(row.sigtur);
        if (!turno) {
          throw new Error(`Turno inválido "${row.sigtur}" - use M/V/N/I ou MATUTINO/VESPERTINO/NOTURNO/INTEGRAL`);
        }

        // Verificar/criar turma usando RPC (bypass RLS)
        const turmaKey = `${row.saesc}_${row.sigeta}_${row.trmcla}_${turno}`;
        let turmaId = turmasCache.get(turmaKey);
        if (!turmaId) {
          console.log(`🔍 Processando turma - Escola: ${row.saesc}, Etapa: ${row.sigeta}, Turma: ${row.trmcla}, Turno: ${turno}`);
          
          // RPC já verifica se turma existe e cria se necessário
          const { data: rpcId, error: turmaError } = await supabase.rpc('admin_upsert_turma', {
            p_escola_id: escola.id,
            p_etapa_modalidade: mapSigetaToEtapaModalidade(row.sigeta),
            p_grupo_ano: row.sigeta,
            p_turma: row.trmcla,
            p_turno: turno
          });

          if (turmaError) {
            console.error('❌ Erro ao criar turma:', turmaError);
            throw turmaError;
          }
          
          turmaId = rpcId as string;
          turmasCriadas++;
          console.log(`✅ Turma criada/atualizada com ID: ${turmaId}`);

          turmasCache.set(turmaKey, turmaId);
        } else {
          console.log(`♻️ Turma já em cache: ${turmaKey}`);
        }

        // Upsert aluno (idempotente por saesc+numalu)
        const alunoPayload = {
          saesc: escola.id,
          numalu: row.numalu,
          nomalu: row.nomalu,
          nummtr: row.nummtr,
          datmtr: convertBrazilianDateToISO(row.datmtr),
          sigeta: mapSigetaToEtapaModalidade(row.sigeta),
          trmcla: row.trmcla,
          sigtur: turno,
          sigla: row.sigla,
          desoca: row.desoca,
          sioca: row.sioca,
          dtomtrc: convertBrazilianDateToISO(row.dtomtrc),
          turma_id: turmaId,
          ativo: true
        };

        const { data: existente } = await supabase
          .from('alunos')
          .select('id')
          .eq('saesc', escola.id)
          .eq('numalu', row.numalu)
          .maybeSingle();

        let upsertError: any = null;
        if (existente) {
          const { error: updErr } = await supabase
            .from('alunos')
            .update(alunoPayload)
            .eq('id', existente.id);
          upsertError = updErr;
        } else {
          const { error: insErr } = await supabase
            .from('alunos')
            .insert(alunoPayload);
          upsertError = insErr;
        }

        if (upsertError) throw upsertError;

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
      title: errors.length === 0 ? "✅ Alunos importados com sucesso!" : "⚠️ Importação parcial",
      description: `${sucessos} alunos importados, ${turmasCriadas} turmas criadas${errors.length > 0 ? `, ${errors.length} erros` : ''}`,
      variant: errors.length > 0 && sucessos === 0 ? "destructive" : "default",
    });

    return { success: sucessos, errors };
  };

  const validateAlunos = async (data: any[]) => {
    const errors: ValidationError[] = [];

    // 1) Regras básicas de obrigatoriedade
    const requiredErrors = validateRequired(data, [
      'saesc',
      'numalu',
      'nomalu',
      'nummtr',
      'sigeta',
      'trmcla',
      'sigtur',
    ]);
    errors.push(...requiredErrors);

    // 2) Validar existencia de escola (saesc)
    const saescs = [...new Set(data.map(d => d.saesc))];
    for (const saesc of saescs) {
      const { data: escola } = await supabase
        .from('escolas')
        .select('id')
        .eq('codigo_saesc', saesc)
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

    // 3) Validar turno (mapa robusto)
    const mapTurnoSiglaValid = (sigla: string | null | undefined): string | null => {
      if (!sigla) return null;
      const normalize = (s: string) => s
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .toUpperCase()
        .trim()
        .replace(/[^A-Z]/g, '');
      const s = normalize(sigla);
      if (s.startsWith('M')) return 'MATUTINO';
      if (s.startsWith('V')) return 'VESPERTINO';
      if (s.startsWith('N')) return 'NOTURNO';
      if (s.startsWith('I') || s.startsWith('INT') || s.startsWith('INTEG')) return 'INTEGRAL';
      return null;
    };

    data.forEach((row, idx) => {
      const turno = mapTurnoSiglaValid(row.sigtur);
      if (!turno) {
        errors.push({
          linha: idx + 2,
          campo: 'sigtur',
          valor: row.sigtur,
          erro: 'Turno inválido - use M/V/N/I ou MATUTINO/VESPERTINO/NOTURNO/INTEGRAL',
          tipo: 'critico'
        });
      }
    });

    // 4) Validar datas
    const dateErrors = validateDataTypes(data, { 
      datmtr: 'date',
      dtomtrc: 'date'
    });
    errors.push(...dateErrors);

    // 5) Validar mapeamento de etapa_modalidade
    data.forEach((row, idx) => {
      try {
        mapSigetaToEtapaModalidade(row.sigeta);
      } catch (error: any) {
        errors.push({
          linha: idx + 2,
          campo: 'sigeta',
          valor: row.sigeta,
          erro: error.message,
          tipo: 'critico'
        });
      }
    });

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
          .upsert({
            componente_nome: row.componente_nome,
            etapa_modalidade: row.etapa_modalidade,
            grupo_ano: row.grupo_ano,
            carga_horaria_semanal: parseInt(row.carga_horaria_semanal)
          }, {
            onConflict: 'componente_nome,etapa_modalidade,grupo_ano',
            ignoreDuplicates: false
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
      title: errors.length === 0 ? "✅ Cargas horárias processadas com sucesso!" : "⚠️ Importação parcial",
      description: `${sucessos} cargas horárias processadas (inseridas ou atualizadas)${errors.length > 0 ? `, ${errors.length} erros` : ''}`,
      variant: errors.length > 0 && sucessos === 0 ? "destructive" : "default",
    });

    return { success: sucessos, errors };
  };

  const validateCargas = async (data: any[]) => {
    const errors: ValidationError[] = [];
    
    // Validar se componente existe
    const componenteErrors = await validateForeignKey(
      data,
      'componente_nome',
      'componentes_curriculares',
      'nome',
      'Componente não cadastrado'
    );
    errors.push(...componenteErrors);
    
    // Verificar duplicatas no CSV
    const chaves = new Set<string>();
    data.forEach((row, idx) => {
      const chave = `${row.componente_nome}|${row.etapa_modalidade}|${row.grupo_ano}`;
      if (chaves.has(chave)) {
        errors.push({
          linha: idx + 2,
          campo: 'geral',
          valor: chave,
          erro: `Duplicata no CSV: ${row.componente_nome} já foi definido para ${row.etapa_modalidade} - ${row.grupo_ano}`,
          tipo: 'aviso'
        });
      }
      chaves.add(chave);
    });
    
    return errors;
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
            description="Importe ou atualize cargas horárias. Registros existentes serão atualizados automaticamente."
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
