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
  
  // Store session token in memory only (NOT localStorage)
  const impersonationToken = useRef<string | null>(null);
  const testUserId = useRef<string | null>(null);

  useEffect(() => {
    console.log('🔄 AuthContext: Setting up auth listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, currentSession) => {
      console.log('🔄 AuthContext: Auth state changed', { event, hasSession: !!currentSession });
      setSession(currentSession);
      
      if (currentSession?.user) {
        console.log('🔄 AuthContext: User found, deferring profile fetch');
        setTimeout(() => {
          fetchUserProfile(currentSession.user);
        }, 0);
      } else {
        console.log('🔄 AuthContext: No user, clearing state and setting loading=false');
        setUser(null);
        setIsImpersonating(false);
        setOriginalAdmin(null);
        setTestSchoolId(null);
        setTestProfile(null);
        impersonationToken.current = null;
        testUserId.current = null;
        setLoading(false);
      }
    });

    // Initial session check to prevent deadlocks
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔄 AuthContext: Initial getSession', { hasSession: !!session });
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user);
        }, 0);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (supabaseUser: SupabaseUser, retryCount = 0) => {
    if (isLoadingProfile) {
      console.log('⏭️ AuthContext: Pulando fetchUserProfile - já está carregando');
      return;
    }
    
    console.log('🔄 AuthContext: fetchUserProfile started', { userId: supabaseUser.id, retryCount });
    setIsLoadingProfile(true);
    
    try {
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', supabaseUser.id)
        .maybeSingle();

      if (userError) throw userError;
      if (!userData) {
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return fetchUserProfile(supabaseUser, retryCount + 1);
        }
        throw new Error('Usuário não encontrado no banco de dados');
      }

      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, escola_id')
        .eq('user_id', supabaseUser.id);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(r => r.role as PerfilUsuario) || [];
      const primaryRole = roles[0] || 'PROFESSOR';
      const escola_id = rolesData?.[0]?.escola_id || null;

      const userProfile: Usuario = {
        id: userData.id,
        nome: userData.nome,
        email: userData.email,
        roles,
        primaryRole,
        escola_id,
        ativo: userData.ativo,
      };

      setUser(userProfile);
      profileLoadAttempts.current = 0;
      console.log('✅ AuthContext: User profile loaded successfully', { userId: userProfile.id, roles: userProfile.roles });
    } catch (error) {
      console.error('❌ AuthContext: Erro ao buscar perfil:', error);
      if (retryCount < 3) {
        profileLoadAttempts.current++;
        await new Promise(resolve => setTimeout(resolve, 1000 * profileLoadAttempts.current));
        return fetchUserProfile(supabaseUser, retryCount + 1);
      }
      toast.error('Erro ao carregar perfil do usuário');
    } finally {
      setIsLoadingProfile(false);
      setLoading(false);
      console.log('✅ AuthContext: fetchUserProfile finished, loading=false');
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      toast.success('Login realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro no login:', error);
      toast.error(error.message || 'Erro ao fazer login');
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // End impersonation if active
      if (impersonationToken.current) {
        await stopImpersonating();
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setSession(null);
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setTestSchoolId(null);
      setTestProfile(null);
      impersonationToken.current = null;
      testUserId.current = null;
      
      toast.success('Logout realizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer logout:', error);
      toast.error(error.message || 'Erro ao fazer logout');
      throw error;
    }
  };

  const impersonate = async (targetUserId: string) => {
    if (!user || !user.roles.includes('ADMIN')) {
      toast.error('Apenas administradores podem impersonar usuários');
      return;
    }

    try {
      // Call secure edge function to create impersonation session
      const { data, error } = await supabase.functions.invoke('secure-impersonate', {
        body: {
          targetUserId,
          action: 'start'
        }
      });

      if (error) throw error;
      if (!data?.sessionToken) throw new Error('Session token not returned');

      // Store token in memory only
      impersonationToken.current = data.sessionToken;

      // Fetch target user data
      const { data: targetUserData, error: targetError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (targetError) throw targetError;

      const { data: targetRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('role, escola_id')
        .eq('user_id', targetUserId);

      if (rolesError) throw rolesError;

      const roles = targetRoles?.map(r => r.role as PerfilUsuario) || [];
      const primaryRole = roles[0] || 'PROFESSOR';
      const escola_id = targetRoles?.[0]?.escola_id || null;

      const targetUser: Usuario = {
        id: targetUserData.id,
        nome: targetUserData.nome,
        email: targetUserData.email,
        roles,
        primaryRole,
        escola_id,
        ativo: targetUserData.ativo,
      };

      // Store original admin ONLY in state (not localStorage)
      setOriginalAdmin(user);
      setUser(targetUser);
      setIsImpersonating(true);

      toast.success(`Agora visualizando como: ${targetUser.nome}`);
    } catch (error: any) {
      console.error('Erro ao impersonar usuário:', error);
      toast.error(error.message || 'Erro ao impersonar usuário');
      throw error;
    }
  };

  const stopImpersonating = async () => {
    try {
      // End impersonation session on server
      if (impersonationToken.current) {
        await supabase.functions.invoke('secure-impersonate', {
          body: {
            action: 'end',
            sessionToken: impersonationToken.current
          }
        });
      }

      // Delete test user if exists
      if (testUserId.current) {
        await supabase.functions.invoke('admin-delete-user', {
          body: { userId: testUserId.current }
        });
      }

      // Restore original admin
      if (originalAdmin) {
        setUser(originalAdmin);
      }
      
      setIsImpersonating(false);
      setOriginalAdmin(null);
      setTestSchoolId(null);
      setTestProfile(null);
      impersonationToken.current = null;
      testUserId.current = null;

      toast.success('Voltou para o perfil de administrador');
    } catch (error: any) {
      console.error('Erro ao parar impersonation:', error);
      toast.error('Erro ao voltar para perfil admin');
    }
  };

  const startTestMode = async (schoolId: string, profile: PerfilUsuario, schoolName: string) => {
    if (!user || !user.roles.includes('ADMIN')) {
      toast.error('Apenas administradores podem usar o modo teste');
      return;
    }

    try {
      const originalAdminUser = originalAdmin || user;

      // Create test user
      const email = `teste.${Date.now()}@tempmail.lovable.dev`;
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
      if (!newUserId) throw new Error('ID do usuário de teste não retornado');

      // Start impersonation for test user
      const { data: impData, error: impError } = await supabase.functions.invoke('secure-impersonate', {
        body: {
          targetUserId: newUserId,
          action: 'start'
        }
      });

      if (impError) throw impError;
      if (!impData?.sessionToken) throw new Error('Session token not returned');

      // Store token and test user ID in memory
      impersonationToken.current = impData.sessionToken;
      testUserId.current = newUserId;

      // Fetch test user data
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

      const roles = rolesData?.map(r => r.role as PerfilUsuario) || [];
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

      setOriginalAdmin(originalAdminUser);
      setUser(testUser);
      setIsImpersonating(true);
      setTestSchoolId(schoolId);
      setTestProfile(profile);

      toast.success(`Modo Teste: ${profile} em ${schoolName}`);
    } catch (error: any) {
      console.error('Erro ao iniciar modo teste:', error);
      toast.error(error.message || 'Erro ao iniciar modo teste');
      throw error;
    }
  };

  const stopTestMode = async () => {
    await stopImpersonating();
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
