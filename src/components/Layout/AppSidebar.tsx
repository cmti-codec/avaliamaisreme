import { LayoutDashboard, Users, School, Building2, GraduationCap, Calendar as CalendarIcon, FileText, Download, Settings, BookOpen, Link2, Clock, Search, BarChart3 } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUsuario } from "@/hooks/useUsuario";
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
const menuItems = [{
  title: "Painel",
  url: "/",
  icon: LayoutDashboard
}, {
  title: "Professores",
  url: "/professores",
  icon: Users
}, {
  title: "Turmas",
  url: "/turmas",
  icon: School
}, {
  title: "Alunos",
  url: "/alunos",
  icon: GraduationCap
}];
const pedagogicoItems = [{
  title: "Lançar Horários",
  url: "/horarios/lancamento",
  icon: Clock
}, {
  title: "Consultar Horários",
  url: "/horarios/consulta",
  icon: Search
}, {
  title: "Dashboard",
  url: "/dashboard-pedagogico",
  icon: BarChart3
}];
const secondaryItems = [{
  title: "Datas & Prazos",
  url: "/datas",
  icon: CalendarIcon,
  adminOnly: false
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: FileText,
  adminOnly: false
}, {
  title: "Configurações",
  url: "/configuracoes",
  icon: Settings,
  adminOnly: false
}];
const adminItems = [{
  title: "Gestão de Usuários",
  url: "/admin/usuarios",
  icon: Users
}, {
  title: "Gestão de Escolas",
  url: "/admin/escolas",
  icon: Building2
}, {
  title: "Matrizes Curriculares",
  url: "/admin/matrizes",
  icon: BookOpen
}, {
  title: "Escolas ↔ Matrizes",
  url: "/admin/escolas-matrizes",
  icon: Link2
}, {
  title: "Importar Dados",
  url: "/admin/importacao",
  icon: Download
}];
export function AppSidebar() {
  const {
    state
  } = useSidebar();
  const collapsed = state === "collapsed";
  const {
    data: usuario
  } = useUsuario();
  const isAdmin = usuario?.roles.includes("ADMIN");
  return <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo Section */}
        <div className="px-4 py-6 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && <div>
                <h2 className="text-lg font-bold text-sidebar-foreground">Avalia+</h2>
                <p className="text-xs text-muted-foreground">Gestão Escolar</p>
              </div>}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Gestão Pedagógica */}
        <SidebarGroup>
          <SidebarGroupLabel>Gestão Pedagógica</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {pedagogicoItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Sistema</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryItems.map(item => <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                      <item.icon className="w-4 h-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin Navigation - Only visible to admins */}
        {isAdmin && <SidebarGroup>
            <SidebarGroupLabel>🔒 Administração</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map(item => <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink to={item.url} className={({
                  isActive
                }) => isActive ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50"}>
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>}
      </SidebarContent>
    </Sidebar>;
}