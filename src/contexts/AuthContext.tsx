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
  perfil: PerfilUsuario;
  escola_id: string | null;
  ativo: boolean;
}

interface AuthContextType {
  user: Usuario | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  temPermissao: (funcionalidade: string, tipo: 'ler' | 'escrever' | 'aprovar') => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      const { data, error } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      setUser(data as Usuario);
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      toast.error('Erro ao carregar perfil do usuário');
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

  const temPermissao = (funcionalidade: string, tipo: 'ler' | 'escrever' | 'aprovar'): boolean => {
    if (!user) return false;
    if (user.perfil === 'ADMIN') return true;

    // TODO: Implementar verificação real com tabela permissoes_funcionalidade
    // Por enquanto, retorna true para desenvolvimento
    return true;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, temPermissao }}>
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
