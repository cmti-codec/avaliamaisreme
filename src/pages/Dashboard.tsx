import { StatCard } from "@/components/Dashboard/StatCard";
import { RecentActivity } from "@/components/Dashboard/RecentActivity";
import { UpcomingEvents } from "@/components/Dashboard/UpcomingEvents";
import { Users, School, Building2, GraduationCap } from "lucide-react";

const Dashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Painel Administrativo</h1>
        <p className="text-muted-foreground">Visão geral do sistema de gestão escolar</p>
      </div>

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
    </div>
  );
};

export default Dashboard;
