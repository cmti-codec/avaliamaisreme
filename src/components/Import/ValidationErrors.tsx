import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, AlertTriangle } from "lucide-react";
import { ValidationError } from "@/lib/import-validators";

interface ValidationErrorsProps {
  errors: ValidationError[];
}

export function ValidationErrors({ errors }: ValidationErrorsProps) {
  const criticos = errors.filter(e => e.tipo === 'critico');
  const avisos = errors.filter(e => e.tipo === 'aviso');
  
  if (errors.length === 0) return null;
  
  return (
    <div className="space-y-4">
      {criticos.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>
            {criticos.length} erro{criticos.length > 1 ? 's' : ''} crítico{criticos.length > 1 ? 's' : ''} encontrado{criticos.length > 1 ? 's' : ''} 
            <span className="text-sm font-normal ml-2">(importação bloqueada)</span>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {criticos.slice(0, 10).map((error, idx) => (
                <li key={idx}>
                  <strong>Linha {error.linha}:</strong> {error.erro}
                </li>
              ))}
              {criticos.length > 10 && (
                <li className="text-muted-foreground italic">
                  ... e mais {criticos.length - 10} erro{criticos.length - 10 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      
      {avisos.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            {avisos.length} aviso{avisos.length > 1 ? 's' : ''} 
            <span className="text-sm font-normal ml-2">(não bloqueia importação)</span>
          </AlertTitle>
          <AlertDescription>
            <ul className="mt-2 space-y-1 text-sm">
              {avisos.slice(0, 5).map((error, idx) => (
                <li key={idx}>
                  <strong>Linha {error.linha}:</strong> {error.erro}
                </li>
              ))}
              {avisos.length > 5 && (
                <li className="text-muted-foreground italic">
                  ... e mais {avisos.length - 5} aviso{avisos.length - 5 > 1 ? 's' : ''}
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
