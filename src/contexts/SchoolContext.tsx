import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './AuthContext';
import { toast } from 'sonner';

interface Lotacao {
  lotacao_id: string;
  escola_saesc: string;
  escola_nome: string;
  perfil: string;
  carga_horaria: number | null;
  data_inicio: string;
  data_fim: string | null;
}

interface EscolaAtual {
  saesc: string;
  nome: string;
  lotacao_id: string;
  perfil: string;
}

interface SchoolContextType {
  escolaAtual: EscolaAtual | null;
  todasLotacoes: Lotacao[];
  trocarEscola: (lotacao_id: string) => Promise<void>;
  loading: boolean;
  needsSchoolSelection: boolean;
}

const SchoolContext = createContext<SchoolContextType | undefined>(undefined);

export function SchoolProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [escolaAtual, setEscolaAtual] = useState<EscolaAtual | null>(null);
  const [todasLotacoes, setTodasLotacoes] = useState<Lotacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsSchoolSelection, setNeedsSchoolSelection] = useState(false);

  useEffect(() => {
    console.log('🔄 SchoolContext: useEffect triggered', { user: user?.id });
    if (user) {
      carregarLotacoes();
    } else {
      console.log('🔄 SchoolContext: No user, setting loading=false');
      setEscolaAtual(null);
      setTodasLotacoes([]);
      setLoading(false);
      setNeedsSchoolSelection(false);
    }
  }, [user]);

  const carregarLotacoes = async () => {
    console.log('🔄 SchoolContext: carregarLotacoes started', { userId: user?.id });
    if (!user?.id) {
      console.log('❌ SchoolContext: No user.id, returning early');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('🔄 SchoolContext: Loading set to true');

      // Buscar pessoa_id do usuário
      const { data: usuarioData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('pessoa_id')
        .eq('id', user.id)
        .maybeSingle();

      if (usuarioError) throw usuarioError;
      if (!usuarioData?.pessoa_id) {
        console.error('❌ SchoolContext: Usuário sem pessoa_id vinculada');
        setLoading(false);
        setNeedsSchoolSelection(false);
        return;
      }
      console.log('✅ SchoolContext: pessoa_id found:', usuarioData.pessoa_id);

      // Buscar lotações ativas
      const { data: lotacoesData, error: lotacoesError } = await supabase
        .from('lotacoes')
        .select(`
          id,
          escola_saesc,
          perfil,
          carga_horaria,
          data_inicio,
          data_fim,
          escolas!inner(nome, saesc)
        `)
        .eq('pessoa_id', usuarioData.pessoa_id)
        .eq('ativo', true)
        .order('data_inicio', { ascending: false });

      if (lotacoesError) throw lotacoesError;

      const lotacoes: Lotacao[] = (lotacoesData || []).map((l: any) => ({
        lotacao_id: l.id,
        escola_saesc: l.escola_saesc,
        escola_nome: l.escolas?.nome || 'Escola não encontrada',
        perfil: l.perfil,
        carga_horaria: l.carga_horaria,
        data_inicio: l.data_inicio,
        data_fim: l.data_fim,
      }));

      setTodasLotacoes(lotacoes);

      // Se não há lotações
      if (lotacoes.length === 0) {
        console.log('⚠️ SchoolContext: No lotações found, setting loading=false');
        setEscolaAtual(null);
        setNeedsSchoolSelection(false);
        setLoading(false);
        return;
      }
      console.log('✅ SchoolContext: Lotações found:', lotacoes.length);

      // Se há apenas 1 lotação, setar automaticamente
      if (lotacoes.length === 1) {
        console.log('✅ SchoolContext: Single lotação, auto-selecting');
        await selecionarEscolaAutomaticamente(lotacoes[0]);
        setNeedsSchoolSelection(false);
        setLoading(false);
        console.log('✅ SchoolContext: Single lotação selected, loading=false');
        return;
      }

      // Se há múltiplas lotações, verificar contexto salvo
      const contextoSalvo = localStorage.getItem('escola_atual');
      if (contextoSalvo) {
        try {
          const escola = JSON.parse(contextoSalvo);
          // Validar se a lotação ainda está ativa
          const lotacaoValida = lotacoes.find(l => l.lotacao_id === escola.lotacao_id);
          if (lotacaoValida) {
            setEscolaAtual(escola);
            setNeedsSchoolSelection(false);
            setLoading(false);
            return;
          }
        } catch (e) {
          localStorage.removeItem('escola_atual');
        }
      }

      // Precisa selecionar escola
      console.log('⚠️ SchoolContext: Multiple lotações, needs selection');
      setNeedsSchoolSelection(true);
      setLoading(false);
      console.log('✅ SchoolContext: loading=false after needs selection');
    } catch (error) {
      console.error('❌ SchoolContext: Erro ao carregar lotações:', error);
      toast.error('Erro ao carregar suas lotações');
      setLoading(false);
      setNeedsSchoolSelection(false);
      console.log('✅ SchoolContext: Error handled, loading=false');
    }
  };

  const selecionarEscolaAutomaticamente = async (lotacao: Lotacao) => {
    const escola: EscolaAtual = {
      saesc: lotacao.escola_saesc,
      nome: lotacao.escola_nome,
      lotacao_id: lotacao.lotacao_id,
      perfil: lotacao.perfil,
    };

    setEscolaAtual(escola);
    localStorage.setItem('escola_atual', JSON.stringify(escola));

    // Salvar em sessoes_contexto
    await salvarSessaoContexto(lotacao.lotacao_id, lotacao.escola_saesc);
  };

  const trocarEscola = async (lotacao_id: string) => {
    const lotacao = todasLotacoes.find(l => l.lotacao_id === lotacao_id);
    if (!lotacao) {
      toast.error('Lotação não encontrada');
      return;
    }

    const escola: EscolaAtual = {
      saesc: lotacao.escola_saesc,
      nome: lotacao.escola_nome,
      lotacao_id: lotacao.lotacao_id,
      perfil: lotacao.perfil,
    };

    setEscolaAtual(escola);
    localStorage.setItem('escola_atual', JSON.stringify(escola));
    setNeedsSchoolSelection(false);

    // Salvar em sessoes_contexto
    await salvarSessaoContexto(lotacao.lotacao_id, lotacao.escola_saesc);

    toast.success(`✅ Contexto alterado para ${escola.nome}`);
  };

  const salvarSessaoContexto = async (lotacao_id: string, escola_saesc: string) => {
    if (!user?.id) return;

    try {
      // Verificar se já existe sessão ativa
      const { data: sessaoExistente } = await supabase
        .from('sessoes_contexto')
        .select('id')
        .eq('usuario_id', user.id)
        .maybeSingle();

      if (sessaoExistente) {
        // Atualizar sessão existente
        await supabase
          .from('sessoes_contexto')
          .update({
            lotacao_id,
            escola_saesc,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', sessaoExistente.id);
      } else {
        // Criar nova sessão
        await supabase
          .from('sessoes_contexto')
          .insert({
            usuario_id: user.id,
            lotacao_id,
            escola_saesc,
          });
      }
    } catch (error) {
      console.error('Erro ao salvar sessão de contexto:', error);
    }
  };

  return (
    <SchoolContext.Provider
      value={{
        escolaAtual,
        todasLotacoes,
        trocarEscola,
        loading,
        needsSchoolSelection,
      }}
    >
      {children}
    </SchoolContext.Provider>
  );
}

export function useSchool() {
  const context = useContext(SchoolContext);
  if (context === undefined) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
