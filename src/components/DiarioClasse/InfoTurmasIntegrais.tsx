import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, Users, Clock, Calculator } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const InfoTurmasIntegrais = () => {
  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-blue-900">
          <Info className="w-5 h-5" />
          Como funciona: Turmas Integrais (Grupos 1, 1I, 1II, 2 e 3)
        </CardTitle>
        <CardDescription className="text-blue-700">
          Entenda o sistema de diários e frequências para educação infantil
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estrutura das Turmas */}
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Estrutura das Turmas Integrais
          </h4>
          <div className="text-sm space-y-2 text-blue-800">
            <p>
              <strong>Cada turma integral possui:</strong>
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>
                <strong>2 Professores:</strong> Um para o período da manhã e outro para a tarde
              </li>
              <li>
                <strong>1 Assistente:</strong> Responsável pelas atividades diversas
              </li>
              <li>
                <strong>Professor de Ed. Física:</strong> Apenas para Grupos 2 e 3
              </li>
            </ul>
          </div>
        </div>

        {/* Exemplo Prático */}
        <div className="space-y-2 bg-white/70 p-4 rounded-lg border border-blue-200">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Exemplo: Turma 2º ANO A (Integral)
          </h4>
          <div className="text-sm space-y-3 text-blue-800">
            <div>
              <Badge variant="outline" className="mb-2">Manhã (Professora Maria)</Badge>
              <p className="ml-4">• 13h de atividades pedagógicas por semana</p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Tarde (Professor João)</Badge>
              <p className="ml-4">• 13h de atividades pedagógicas por semana</p>
            </div>
            <div>
              <Badge variant="secondary" className="mb-2">Atividades Diversas (Assistente)</Badge>
              <p className="ml-4">• Divididas entre manhã e tarde</p>
              <p className="ml-4 text-xs text-muted-foreground">
                * Lançadas pelo secretário escolar no sistema
              </p>
            </div>
            <div>
              <Badge variant="outline" className="mb-2">Ed. Física (Prof. Carlos)</Badge>
              <p className="ml-4">• Apenas para Grupos 2 e 3</p>
            </div>
          </div>
        </div>

        {/* Como as frequências são somadas */}
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-900 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Cálculo de Frequência Total
          </h4>
          <div className="text-sm space-y-2 text-blue-800">
            <p>
              <strong>Ao final do bimestre, as frequências são somadas:</strong>
            </p>
            <div className="bg-blue-100/50 p-3 rounded-md space-y-1">
              <p className="font-mono text-xs">
                Frequência Total = Manhã + Tarde + Atividades Diversas (+ Ed. Física)
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Exemplo: Se um aluno teve 95% de presença na manhã, 90% na tarde e 100% em
                atividades diversas, a frequência é calculada considerando todas as aulas.
              </p>
            </div>
          </div>
        </div>

        {/* Responsabilidades */}
        <Alert className="bg-blue-100/50 border-blue-300">
          <Info className="h-4 w-4 text-blue-700" />
          <AlertTitle className="text-blue-900">Responsabilidades</AlertTitle>
          <AlertDescription className="text-blue-800 text-sm">
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong>Professores:</strong> Lançam frequências em seus respectivos turnos
              </li>
              <li>
                <strong>Assistentes:</strong> Registram presença manualmente na sala de aula
              </li>
              <li>
                <strong>Secretário Escolar:</strong> Lança no sistema as frequências de atividades diversas
              </li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};
