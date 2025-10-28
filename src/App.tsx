import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/Layout/AppSidebar";
import { AppHeader } from "@/components/Layout/AppHeader";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ImpersonateBanner } from "@/components/ImpersonateBanner";
import { cn } from "@/lib/utils";
import Dashboard from "./pages/Dashboard";
import Professores from "./pages/Professores";
import Turmas from "./pages/Turmas";
import Escolas from "./pages/Escolas";
import Alunos from "./pages/Alunos";
import Login from "./pages/Login";
import Importacao from "./pages/admin/Importacao";
import Matrizes from "./pages/admin/Matrizes";
import EscolasMatrizes from "./pages/admin/EscolasMatrizes";
import EscolasAdmin from "./pages/admin/EscolasAdmin";
import Usuarios from "./pages/admin/Usuarios";
import ConsultaHorarios from "./pages/horarios/Consulta";
import LancamentoHorarios from "./pages/horarios/Lancamento";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading, isImpersonating } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <ImpersonateBanner />
      <div className={cn(
        "min-h-screen flex w-full bg-background",
        isImpersonating && "pt-12"
      )}>
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <AppHeader />
          <main className="flex-1 p-6 md:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route path="/" element={<LayoutWrapper><Dashboard /></LayoutWrapper>} />
            <Route path="/professores" element={<LayoutWrapper><Professores /></LayoutWrapper>} />
            <Route path="/turmas" element={<LayoutWrapper><Turmas /></LayoutWrapper>} />
            <Route path="/escolas" element={<LayoutWrapper><Escolas /></LayoutWrapper>} />
            <Route path="/alunos" element={<LayoutWrapper><Alunos /></LayoutWrapper>} />
            
            {/* Admin Routes */}
            <Route path="/admin/usuarios" element={<LayoutWrapper><Usuarios /></LayoutWrapper>} />
            <Route path="/admin/escolas" element={<LayoutWrapper><EscolasAdmin /></LayoutWrapper>} />
            <Route path="/admin/importacao" element={<LayoutWrapper><Importacao /></LayoutWrapper>} />
            <Route path="/admin/matrizes" element={<LayoutWrapper><Matrizes /></LayoutWrapper>} />
            <Route path="/admin/escolas-matrizes" element={<LayoutWrapper><EscolasMatrizes /></LayoutWrapper>} />

            {/* Horarios Routes */}
            <Route path="/horarios/consulta" element={<LayoutWrapper><ConsultaHorarios /></LayoutWrapper>} />
            <Route path="/horarios/lancamento" element={<LayoutWrapper><LancamentoHorarios /></LayoutWrapper>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
