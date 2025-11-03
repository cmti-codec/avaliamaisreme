import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { toast } from 'sonner';

type PerfilUsuario = 
  | 'ADMIN' 
  | 'GESTOR_SEMED' 
  | 'TECNICO_SEMED' 
  | 'DIRETOR' 
  | 'SECRETARIO' 
  | 'COORDENADOR' 
  | 'PROFESSOR';

interface Usuario {
  id: string;
  nome: string;
  email: string;
  roles: PerfilUsuario[];
  primaryRole: PerfilUsuario;
  escola_id: string | null;
  ativo: boolean;
}

interface AuthContextType {
  user: Usuario | null;
  session: Session | null;
  loading: boolean;
  isImpersonating: boolean;
  originalAdmin: Usuario | null;
  testSchoolId: string | null;
  testProfile: PerfilUsuario | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  impersonate: (targetUserId: string) => Promise<void>;
  stopImpersonating: () => void;
  startTestMode: (schoolId: string, profile: PerfilUsuario, schoolName: string) => Promise<void>;
  stopTestMode: () => Promise<void>;
  temPermissao: (funcionalidade: string, tipo: 'ler' | 'escrever' | 'aprovar') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<Usuario | null>(null);
  const [testSchoolId, setTestSchoolId] = useState<string | null>(null);
  const [testProfile, setTestProfile] = useState<PerfilUsuario | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const profileLoadAttempts = useRef(0);

  useEffect(() => {
    // Restaurar sessão de impersonation se existir
    const isImp = localStorage.getItem('impersonating') === 'true';
    const adminData = localStorage.getItem('originalAdmin');
    const testSchool = localStorage.getItem('testSchoolId');
    const testProf = localStorage.getItem('testProfile');
    
    if (isImp && adminData) {
      try {
        setOriginalAdmin(JSON.parse(adminData));
        setIsImpersonating(true);
        
        // Restaurar modo teste se existir
        if (testSchool && testProf) {
          setTestSchoolId(testSchool);
          setTestProfile(testProf as PerfilUsuario);
        }
      } catch (e) {
        console.error('Erro ao restaurar sessão de impersonation:', e);
        localStorage.removeItem('impersonating');
        localStorage.removeItem('originalAdmin');
        localStorage.removeItem('testSchoolId');
        localStorage.removeItem('testProfile');
        localStorage.removeItem('testSchoolName');
      }
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user && !isLoadingProfile) {
          // Defer fetching user profile with setTimeout to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 100);
        } else if (!session?.user) {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    if (!isLoadingProfile) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else {
          setLoading(false);
        }
      });
    }

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    // Prevenir execuções simultâneas
    if (isLoadingProfile) {
      console.log('⏸️ Perfil já está sendo carregado, ignorando chamada duplicada');
      return;
    }

    setIsLoadingProfile(true);
    
    try {
      console.log('🔵 Buscando perfil do usuário:', userId);
      
      // Buscar dados básicos do usuário (usar maybeSingle para evitar erro)
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError) {
        console.error('❌ Erro ao buscar dados do usuário:', userError);
        
        // Se for erro de RLS/permissão e ainda não tentou muitas vezes, retry
        if ((userError.code === 'PGRST116' || userError.message?.includes('permission')) && profileLoadAttempts.current < 3) {
          profileLoadAttempts.current++;
          console.log(`🔄 Tentando novamente (${profileLoadAttempts.current}/3)...`);
          setIsLoadingProfile(false);
          setTimeout(() => fetchUserProfile(userId), 500);
          return;
        }
        
        throw userError;
      }

      if (!userData) {
        console.error('❌ Usuário não encontrado na tabela usuarios:', userId);
        
        // Retry se ainda não excedeu tentativas
        if (profileLoadAttempts.current < 3) {
          profileLoadAttempts.current++;
          console.log(`🔄 Tentando novamente (${profileLoadAttempts.current}/3)...`);
          setIsLoadingProfile(false);
          setTimeout(() => fetchUserProfile(userId), 500);
          return;
        }
        
        throw new Error('Usuário não encontrado após 3 tentativas');
      }

      // Reset contador de tentativas em caso de sucesso
      profileLoadAttempts.current = 0;
      console.log('✅ Dados do usuário encontrados:', userData.email);

      // Buscar roles do usuário
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, escola_id')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('❌ Erro ao buscar roles:', rolesError);
        throw rolesError;
      }

      console.log('✅ Roles encontradas:', rolesData?.map(r => r.role));

      // Determinar role principal (maior privilégio)
      const roles = rolesData?.map(r => r.role as PerfilUsuario) || [];
      const primaryRole = roles[0] || 'PROFESSOR';
      const escola_id = rolesData?.[0]?.escola_id ?? userData.escola_id ?? null;

      setUser({
        ...userData,
        roles,
        primaryRole,
        escola_id,
      } as Usuario);
      
      console.log('✅ Perfil do usuário carregado com sucesso');
    } catch (error) {
      console.error('❌ Erro fatal ao buscar perfil do usuário:', error);
      toast.error('Erro ao carregar perfil do usuário. Por favor, tente fazer login novamente.');
      // Fazer logout apenas após esgotadas as tentativas
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
      setIsLoadingProfile(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error, data } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        await fetchUserProfile(data.user.id);
        toast.success('Login realizado com sucesso!');
      }
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      toast.success('Logout realizado com sucesso');
    } catch (error: any) {
      console.error('Erro no logout:', error);
      toast.error('Erro ao fazer logout');
    }
  };

  const impersonate = async (targetUserId: string) => {
    try {
      if (!user?.roles.includes('ADMIN')) {
        toast.error('Apenas administradores podem assumir perfis');
        return;
      }

      // 1. Salvar admin atual
      setOriginalAdmin(user);

      // 2. Buscar dados do usuário-alvo
      const { data: targetUserData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      // 3. Buscar roles do usuário-alvo
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, escola_id')
        .eq('user_id', targetUserId);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(r => r.role as PerfilUsuario) || [];
      const primaryRole = roles[0] || 'PROFESSOR';
      const escola_id = rolesData?.[0]?.escola_id || null;

      const targetUser = {
        ...targetUserData,
        roles,
        primaryRole,
        escola_id,
      } as Usuario;

      // 4. Trocar contexto
      setUser(targetUser);
      setIsImpersonating(true);

      // 5. Persistir no localStorage
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('originalAdmin', JSON.stringify(user));
      localStorage.setItem('impersonatedUserId', targetUserId);

      toast.success(`Agora você está visualizando como: ${targetUser.nome}`);
    } catch (error: any) {
      console.error('Erro ao assumir perfil:', error);
      toast.error('Erro ao assumir perfil: ' + error.message);
    }
  };

  const stopImpersonating = () => {
    if (!originalAdmin) return;

    // Restaurar admin original
    setUser(originalAdmin);
    setIsImpersonating(false);
    setOriginalAdmin(null);
    setTestSchoolId(null);
    setTestProfile(null);

    // Limpar localStorage
    localStorage.removeItem('impersonating');
    localStorage.removeItem('originalAdmin');
    localStorage.removeItem('impersonatedUserId');
    localStorage.removeItem('testSchoolId');
    localStorage.removeItem('testProfile');
    localStorage.removeItem('testSchoolName');

    toast.info('Voltou para sua conta admin');
  };

  const startTestMode = async (schoolId: string, profile: PerfilUsuario, schoolName: string) => {
    if (!user?.roles.includes('ADMIN')) {
      toast.error('Apenas administradores podem usar o modo teste');
      return;
    }

    try {
      // Salvar admin atual se ainda não estiver impersonando
      if (!isImpersonating) {
        setOriginalAdmin(user);
      }

      // 0) Limpar impersonações antigas deste admin (para evitar múltiplos usuários de teste)
      const { error: cleanupErr } = await supabase
        .from('usuarios')
        .update({ impersonated_by: null })
        .eq('impersonated_by', user.id);
      
      if (cleanupErr) {
        console.warn('Aviso ao limpar impersonações antigas:', cleanupErr);
      }

      // 1) Criar usuário real via função do backend (garante integridade do FK e já define escola_id)
      const email = `teste-${profile.toLowerCase()}-${Date.now()}@example.test`;
      const password = Math.random().toString(36).slice(2) + Math.random().toString(36).toUpperCase().slice(2);

      const { data: createResp, error: createErr } = await supabase.functions.invoke('admin-create-user', {
        body: {
          nome: `Teste - ${profile} (${schoolName})`,
          email,
          senha: password,
          roles: [profile],
          escola_id: schoolId,
        },
      });

      if (createErr) throw createErr;

      const newUserId: string | undefined = createResp?.userId ?? createResp?.id ?? createResp?.user_id;
      if (!newUserId) {
        console.error('Resposta inesperada de admin-create-user:', createResp);
        throw new Error('ID do usuário de teste não retornado');
      }

      // 2) Marcar impersonação no usuário de teste para get_effective_user_id()
      const { error: impErr } = await supabase
        .from('usuarios')
        .update({ impersonated_by: user.id })
        .eq('id', newUserId);
      if (impErr) throw impErr;

      // 3) Buscar dados do usuário de teste para setar no contexto (escola_id já foi definido em admin-create-user)
      const { data: userRow, error: userRowErr } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', newUserId)
        .single();
      if (userRowErr) throw userRowErr;

      const { data: rolesData, error: rolesErr } = await supabase
        .from('user_roles')
        .select('role, escola_id')
        .eq('user_id', newUserId);
      if (rolesErr) throw rolesErr;

      const roles = (rolesData?.map(r => r.role as PerfilUsuario) || []);
      const primaryRole = roles[0] || profile;
      const escola_id = rolesData?.[0]?.escola_id || schoolId;

      const testUser: Usuario = {
        id: newUserId,
        nome: `Teste - ${profile} (${schoolName})`,
        email,
        roles,
        primaryRole,
        escola_id,
        ativo: true,
      };

      setUser(testUser);
      setIsImpersonating(true);
      setTestSchoolId(schoolId);
      setTestProfile(profile);

      // Persistir no localStorage
      localStorage.setItem('impersonating', 'true');
      localStorage.setItem('originalAdmin', JSON.stringify(originalAdmin || user));
      localStorage.setItem('testSchoolId', schoolId);
      localStorage.setItem('testProfile', profile);
      localStorage.setItem('testSchoolName', schoolName);
      localStorage.setItem('testUserId', newUserId);

      toast.success(`Modo Teste: ${profile} em ${schoolName}`);
    } catch (error: any) {
      console.error('Erro ao iniciar modo teste:', error);
      toast.error('Erro ao iniciar modo teste: ' + (error?.message || 'erro desconhecido'));
    }
  };

  const stopTestMode = async () => {
    if (!originalAdmin) return;

    try {
      const testUserId = localStorage.getItem('testUserId');

      if (testUserId) {
        // Deletar usuário real via função do backend (limpa auth + tabelas)
        const { error: delErr, data: delResp } = await supabase.functions.invoke('admin-delete-user', {
          body: { userId: testUserId },
        });
        if (delErr) {
          console.error('Erro ao deletar usuário de teste:', delErr, delResp);
          // Continua a restauração mesmo com erro
        }
      }

      // Restaurar admin original
      setUser(originalAdmin);
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setTestSchoolId(null);
      setTestProfile(null);

      // Limpar localStorage
      localStorage.removeItem('impersonating');
      localStorage.removeItem('originalAdmin');
      localStorage.removeItem('testSchoolId');
      localStorage.removeItem('testProfile');
      localStorage.removeItem('testSchoolName');
      localStorage.removeItem('testUserId');

      toast.info('Saiu do modo teste');
    } catch (error: any) {
      console.error('Erro ao sair do modo teste:', error);
      toast.error('Erro ao sair do modo teste');

      // Mesmo com erro, restaurar o estado local
      setUser(originalAdmin);
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setTestSchoolId(null);
      setTestProfile(null);

      localStorage.removeItem('impersonating');
      localStorage.removeItem('originalAdmin');
      localStorage.removeItem('testSchoolId');
      localStorage.removeItem('testProfile');
      localStorage.removeItem('testSchoolName');
      localStorage.removeItem('testUserId');
    }
  };

  const temPermissao = (funcionalidade: string, tipo: 'ler' | 'escrever' | 'aprovar'): boolean => {
    if (!user) return false;
    // Admin sempre tem permissão (mesmo quando impersonando)
    if (originalAdmin?.roles.includes('ADMIN')) return true;
    if (user.roles.includes('ADMIN')) return true;

    // TODO: Implementar verificação real com tabela permissoes_funcionalidade
    // Por enquanto, retorna true para desenvolvimento
    return true;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isImpersonating, 
      originalAdmin,
      testSchoolId,
      testProfile,
      signIn, 
      signOut, 
      impersonate,
      stopImpersonating,
      startTestMode,
      stopTestMode,
      temPermissao 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
