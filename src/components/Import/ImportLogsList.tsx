import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export function ImportLogsList() {
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  
  const { data: logs, isLoading } = useQuery({
    queryKey: ['import-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    }
  });
  
  const toggleExpand = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sucesso':
        return <Badge variant="default" className="bg-green-600">✅ Sucesso</Badge>;
      case 'sucesso_parcial':
        return <Badge variant="secondary">⚠️ Sucesso Parcial</Badge>;
      case 'erro':
        return <Badge variant="destructive">❌ Erro</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };
  
  if (isLoading) {
    return <div className="text-center py-8">Carregando histórico...</div>;
  }
  
  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhuma importação realizada ainda
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {logs.map((log) => (
        <Card key={log.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <CardTitle className="text-lg">
                  📅 {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </CardTitle>
                {getStatusBadge(log.status)}
              </div>
              {log.detalhes_erros && log.linhas_erro > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleExpand(log.id)}
                >
                  {expandedLogs.has(log.id) ? (
                    <>Ver Menos <ChevronUp className="ml-1 h-4 w-4" /></>
                  ) : (
                    <>Ver Detalhes <ChevronDown className="ml-1 h-4 w-4" /></>
                  )}
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium">{log.tipo_importacao}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Arquivo</p>
                <p className="font-medium truncate">{log.nome_arquivo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Total de Linhas</p>
                <p className="font-medium">{log.total_linhas}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Resultado</p>
                <p className="font-medium">
                  {log.linhas_sucesso} sucesso / {log.linhas_erro} erro{log.linhas_erro !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            
            {expandedLogs.has(log.id) && log.detalhes_erros && (
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Detalhes dos Erros:</h4>
                <ul className="space-y-1 text-sm">
                  {(log.detalhes_erros as any[]).slice(0, 20).map((erro, idx) => (
                    <li key={idx}>
                      <strong>Linha {erro.linha}:</strong> {erro.erro}
                    </li>
                  ))}
                  {(log.detalhes_erros as any[]).length > 20 && (
                    <li className="text-muted-foreground italic">
                      ... e mais {(log.detalhes_erros as any[]).length - 20} erros
                    </li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
