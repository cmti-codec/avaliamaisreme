import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSchool } from "@/contexts/SchoolContext";
import { useUsuario } from "@/hooks/useUsuario";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { User, LogOut, School, RefreshCw, Info, ChevronDown } from "lucide-react";
import { TrocarEscolaDialog } from "./TrocarEscolaDialog";
import { MinhasLotacoesDialog } from "./MinhasLotacoesDialog";

export function AppHeader() {
  const { signOut } = useAuth();
  const { data: usuario } = useUsuario();
  const { escolaAtual, todasLotacoes } = useSchool();
  const navigate = useNavigate();
  const [showTrocarEscola, setShowTrocarEscola] = useState(false);
  const [showMinhasLotacoes, setShowMinhasLotacoes] = useState(false);

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
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4 gap-4">
          <SidebarTrigger />
          
          {/* Escola Atual */}
          {escolaAtual && todasLotacoes.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <School className="h-4 w-4" />
                  <span className="hidden sm:inline">{escolaAtual.nome}</span>
                  <ChevronDown className="h-3 w-3 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                  <School className="h-4 w-4" />
                  Escola Atual
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="px-2 py-1.5 text-sm">
                  <p className="font-medium">{escolaAtual.nome}</p>
                  <Badge variant="secondary" className="mt-1">
                    {escolaAtual.perfil}
                  </Badge>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowTrocarEscola(true)}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Trocar Escola
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowMinhasLotacoes(true)}>
                  <Info className="mr-2 h-4 w-4" />
                  Minhas Lotações
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {escolaAtual && todasLotacoes.length === 1 && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <School className="h-4 w-4" />
              <span>{escolaAtual.nome}</span>
            </div>
          )}
          
          {usuario && (
            <div className="ml-auto flex items-center gap-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {usuario.nome
                          .split(' ')
                          .map(n => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left">
                      <span className="text-sm font-medium">{usuario.nome}</span>
                      <span className="text-xs text-muted-foreground">
                        {getPerfilLabel(usuario.primaryRole)}
                      </span>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/perfil')}>
                    <User className="mr-2 h-4 w-4" />
                    Perfil
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </header>

      <TrocarEscolaDialog
        open={showTrocarEscola}
        onOpenChange={setShowTrocarEscola}
      />

      <MinhasLotacoesDialog
        open={showMinhasLotacoes}
        onOpenChange={setShowMinhasLotacoes}
      />
    </>
  );
}
