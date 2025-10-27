import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  impersonate: (targetUserId: string) => Promise<void>;
  stopImpersonating: () => void;
  temPermissao: (funcionalidade: string, tipo: 'ler' | 'escrever' | 'aprovar') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdmin, setOriginalAdmin] = useState<Usuario | null>(null);

  useEffect(() => {
    // Restaurar sessão de impersonation se existir
    const isImp = localStorage.getItem('impersonating') === 'true';
    const adminData = localStorage.getItem('originalAdmin');
    
    if (isImp && adminData) {
      try {
        setOriginalAdmin(JSON.parse(adminData));
        setIsImpersonating(true);
      } catch (e) {
        console.error('Erro ao restaurar sessão de impersonation:', e);
        localStorage.removeItem('impersonating');
        localStorage.removeItem('originalAdmin');
      }
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Defer fetching user profile with setTimeout to avoid deadlock
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
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
        throw userError;
      }

      if (!userData) {
        console.error('❌ Usuário não encontrado na tabela usuarios:', userId);
        throw new Error('Usuário não encontrado');
      }

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
      const escola_id = rolesData?.[0]?.escola_id || null;

      setUser({
        ...userData,
        roles,
        primaryRole,
        escola_id,
      } as Usuario);
      
      console.log('✅ Perfil do usuário carregado com sucesso');
    } catch (error) {
      console.error('❌ Erro fatal ao buscar perfil do usuário:', error);
      toast.error('Erro ao carregar perfil do usuário');
      // IMPORTANTE: fazer logout se falhar
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
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

    // Limpar localStorage
    localStorage.removeItem('impersonating');
    localStorage.removeItem('originalAdmin');
    localStorage.removeItem('impersonatedUserId');

    toast.info('Voltou para sua conta admin');
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
      signIn, 
      signOut, 
      impersonate,
      stopImpersonating,
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
