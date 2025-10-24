import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

interface Activity {
  id: string;
  title: string;
  time: string;
  type: "info" | "success" | "warning";
}

const activities: Activity[] = [
  { id: "1", title: "15 novos professores cadastrados", time: "Há 2 horas", type: "success" },
  { id: "2", title: "Importação de dados concluída", time: "Há 5 horas", type: "success" },
  { id: "3", title: "3 relatórios gerados", time: "Ontem", type: "info" },
];

const typeColors = {
  info: "bg-blue-500",
  success: "bg-green-500",
  warning: "bg-amber-500"
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary" />
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full ${typeColors[activity.type]} mt-2`} />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
