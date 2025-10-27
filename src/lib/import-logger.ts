import { supabase } from "@/integrations/supabase/client";

interface LogImportacaoParams {
  tipo: string;
  nomeArquivo: string;
  totalLinhas: number;
  linhasSucesso: number;
  linhasErro: number;
  detalhesErros?: any[];
}

export async function logImportacao({
  tipo,
  nomeArquivo,
  totalLinhas,
  linhasSucesso,
  linhasErro,
  detalhesErros
}: LogImportacaoParams) {
  const status = 
    linhasErro === 0 ? 'sucesso' :
    linhasSucesso > 0 ? 'sucesso_parcial' :
    'erro';
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.error('Usuário não autenticado');
    return;
  }
  
  const { error } = await supabase
    .from('import_logs')
    .insert({
      usuario_id: user.id,
      tipo_importacao: tipo,
      nome_arquivo: nomeArquivo,
      total_linhas: totalLinhas,
      linhas_sucesso: linhasSucesso,
      linhas_erro: linhasErro,
      status,
      detalhes_erros: detalhesErros || null
    });
  
  if (error) {
    console.error('Erro ao salvar log:', error);
  }
}
