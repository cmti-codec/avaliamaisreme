import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const {
    signIn,
    user
  } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      redirectBasedOnProfile(user.primaryRole);
    }
  }, [user, navigate]);
  const redirectBasedOnProfile = (perfil: string) => {
    switch (perfil) {
      case 'ADMIN':
        navigate('/admin/usuarios');
        break;
      case 'GESTOR_SEMED':
      case 'TECNICO_SEMED':
      case 'DIRETOR':
      case 'SECRETARIO':
        navigate('/');
        break;
      case 'COORDENADOR':
        navigate('/horarios/lancamento');
        break;
      case 'PROFESSOR':
        navigate('/professores');
        break;
      default:
        navigate('/');
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      // Error is already handled in signIn
    } finally {
      setIsLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <GraduationCap className="w-9 h-9 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Avalia+</CardTitle>
            <CardDescription className="text-base mt-2">Sistema de Gestão Escolar da REME</CardDescription>
          </div>
          <p className="text-sm text-muted-foreground">
            Acesse com suas credenciais
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="seu.email@escola.com" value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading} required />
                <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0 h-full px-3 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)} disabled={isLoading}>
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox id="remember" checked={rememberMe} onCheckedChange={checked => setRememberMe(checked as boolean)} disabled={isLoading} />
              <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                Lembrar de mim
              </Label>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>

            <Button type="button" variant="link" className="w-full" disabled={isLoading} onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
              Esqueci minha senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
}