import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const getPerfilLabel = (perfil: string) => {
    const labels: Record<string, string> = {
      ADMIN: 'Administrador',
      GESTOR_SEMED: 'Gestor SEMED',
      TECNICO_SEMED: 'Técnico SEMED',
      DIRETOR: 'Diretor',
      SECRETARIO: 'Secretário',
      COORDENADOR: 'Coordenador',
      PROFESSOR: 'Professor',
    };
    return labels[perfil] || perfil;
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <>
            <Badge variant="outline" className="hidden sm:flex">
              {getPerfilLabel(user.primaryRole)}
            </Badge>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden sm:block">{user.nome}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.nome}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </header>
  );
}
