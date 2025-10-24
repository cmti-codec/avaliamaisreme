import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
  color: string;
}

const events: Event[] = [
  {
    id: "1",
    title: "Conselho de Classe - 4º Bimestre",
    date: "15 DEZ",
    description: "Todas as escolas da rede",
    color: "bg-primary"
  },
  {
    id: "2",
    title: "Encerramento do Ano Letivo",
    date: "20 DEZ",
    description: "Prazo final para lançamentos",
    color: "bg-green-500"
  }
];

export function UpcomingEvents() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          Próximos Eventos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4">
              <div className={`${event.color} text-white rounded-lg p-3 text-center min-w-[60px]`}>
                <div className="text-xs font-medium">{event.date.split(' ')[1]}</div>
                <div className="text-2xl font-bold">{event.date.split(' ')[0]}</div>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-foreground">{event.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{event.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
