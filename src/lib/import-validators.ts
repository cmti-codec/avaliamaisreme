import { supabase } from "@/integrations/supabase/client";

export interface ValidationError {
  linha: number;
  campo: string;
  valor: any;
  erro: string;
  tipo: 'critico' | 'aviso';
}

export async function validateForeignKey(
  data: any[],
  column: string,
  table: string,
  referenceColumn: string,
  errorMessage: string
): Promise<ValidationError[]> {
  const valores = [...new Set(data.map(d => d[column]).filter(Boolean))];
  
  if (valores.length === 0) return [];
  
  const { data: existentes, error } = await supabase
    .from(table as any)
    .select(referenceColumn)
    .in(referenceColumn, valores);
  
  if (error) {
    console.error(`Erro ao validar chave estrangeira ${column}:`, error);
    return [];
  }
  
  const existentesSet = new Set(existentes?.map(e => e[referenceColumn]));
  
  return data
    .map((row, index) => {
      if (row[column] && !existentesSet.has(row[column])) {
        return {
          linha: index + 2,
          campo: column,
          valor: row[column],
          erro: `${errorMessage}: "${row[column]}"`,
          tipo: 'critico' as const
        };
      }
      return null;
    })
    .filter(Boolean) as ValidationError[];
}

export async function validateUniqueness(
  data: any[],
  field: string,
  table: string,
  fieldLabel?: string
): Promise<ValidationError[]> {
  const valores = data.map(d => d[field]).filter(Boolean);
  
  if (valores.length === 0) return [];
  
  const { data: existentes, error } = await supabase
    .from(table as any)
    .select(field)
    .in(field, valores);
  
  if (error) {
    console.error(`Erro ao validar unicidade ${field}:`, error);
    return [];
  }
  
  const existentesSet = new Set(existentes?.map(e => e[field]));
  
  return data
    .map((row, index) => {
      if (row[field] && existentesSet.has(row[field])) {
        return {
          linha: index + 2,
          campo: field,
          valor: row[field],
          erro: `${fieldLabel || field} "${row[field]}" já existe no sistema`,
          tipo: 'critico' as const
        };
      }
      return null;
    })
    .filter(Boolean) as ValidationError[];
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export function validateCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.length === 11;
}

export function validateDate(dateStr: string): boolean {
  if (!dateStr) return true; // Campos opcionais
  
  // Aceita formatos: DD/MM/YYYY, YYYY-MM-DD
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

export function validateRequired(data: any[], requiredFields: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    requiredFields.forEach(field => {
      if (!row[field] || row[field].toString().trim() === '') {
        errors.push({
          linha: index + 2,
          campo: field,
          valor: row[field],
          erro: `Campo obrigatório "${field}" está vazio`,
          tipo: 'critico'
        });
      }
    });
  });
  
  return errors;
}

export function validateDataTypes(data: any[], fieldTypes: Record<string, 'text' | 'number' | 'date' | 'boolean' | 'email'>): ValidationError[] {
  const errors: ValidationError[] = [];
  
  data.forEach((row, index) => {
    Object.entries(fieldTypes).forEach(([field, type]) => {
      const value = row[field];
      
      if (!value) return; // Campos vazios já são validados em validateRequired
      
      switch (type) {
        case 'email':
          if (!validateEmail(value)) {
            errors.push({
              linha: index + 2,
              campo: field,
              valor: value,
              erro: `Email inválido: "${value}"`,
              tipo: 'critico'
            });
          }
          break;
        case 'number':
          if (isNaN(Number(value))) {
            errors.push({
              linha: index + 2,
              campo: field,
              valor: value,
              erro: `Valor deve ser numérico: "${value}"`,
              tipo: 'critico'
            });
          }
          break;
        case 'date':
          if (!validateDate(value)) {
            errors.push({
              linha: index + 2,
              campo: field,
              valor: value,
              erro: `Data inválida: "${value}"`,
              tipo: 'critico'
            });
          }
          break;
        case 'boolean':
          if (!['true', 'false', '1', '0', 'sim', 'não'].includes(value.toLowerCase())) {
            errors.push({
              linha: index + 2,
              campo: field,
              valor: value,
              erro: `Valor booleano inválido: "${value}" (use: true/false)`,
              tipo: 'critico'
            });
          }
          break;
      }
    });
  });
  
  return errors;
}
