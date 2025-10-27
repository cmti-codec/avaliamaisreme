import { useState } from "react";
import { StatCard } from "@/components/Dashboard/StatCard";
import { RecentActivity } from "@/components/Dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/Dashboard/UpcomingEvents";
import { Users, School, Building2, GraduationCap, FlaskConical } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestProfileModal } from "@/components/Admin/TestProfileModal";

const Dashboard = () => {
  const { user } = useAuth();
  const [testModalOpen, setTestModalOpen] = useState(false);
  const isAdmin = user?.roles.includes('ADMIN');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão escolar</p>
      </div>

      {/* Test Mode Card - Only for Admin */}
      {isAdmin && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-amber-600" />
              Modo Teste de Perfil
            </CardTitle>
            <CardDescription>
              Teste o sistema assumindo diferentes perfis por escola sem usar contas reais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setTestModalOpen(true)}
              className="w-full"
              variant="outline"
            >
              <FlaskConical className="w-4 h-4 mr-2" />
              Testar Escola/Função
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total de Professores"
          value="248"
          change="+12% em relação ao último mês"
          changeType="positive"
          icon={Users}
          iconColor="text-blue-600"
        />
        <StatCard
          title="Total de Alunos"
          value="5.432"
          change="+5% em relação ao último mês"
          changeType="positive"
          icon={GraduationCap}
          iconColor="text-green-600"
        />
        <StatCard
          title="Turmas Ativas"
          value="186"
          change="+3% em relação ao último mês"
          changeType="positive"
          icon={School}
          iconColor="text-amber-600"
        />
        <StatCard
          title="Escolas da Rede"
          value="24"
          change="0% em relação ao último mês"
          changeType="neutral"
          icon={Building2}
          iconColor="text-purple-600"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <UpcomingEvents />
        <RecentActivity />
      </div>

      {/* Test Profile Modal */}
      <TestProfileModal open={testModalOpen} onOpenChange={setTestModalOpen} />
    </div>
  );
};

export default Dashboard;
