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
  fieldLabel?: string,
  treatAsWarning = false
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
          tipo: treatAsWarning ? 'aviso' as const : 'critico' as const
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
  
  // Tratar sentinelas de data como vazias
  const sentinels = ['00/00/0000', '0000-00-00', '-', '—', 'N/A', 'NA', 'NULL', '0'];
  if (sentinels.includes(dateStr.trim())) return true;
  
  // Regex para DD/MM/YYYY ou YYYY-MM-DD
  const brFormat = /^(\d{2})\/(\d{2})\/(\d{4})$/;
  const isoFormat = /^(\d{4})-(\d{2})-(\d{2})$/;
  
  let day, month, year;
  
  // Tenta formato brasileiro DD/MM/YYYY
  const brMatch = dateStr.match(brFormat);
  if (brMatch) {
    day = parseInt(brMatch[1], 10);
    month = parseInt(brMatch[2], 10);
    year = parseInt(brMatch[3], 10);
  } else {
    // Tenta formato ISO YYYY-MM-DD
    const isoMatch = dateStr.match(isoFormat);
    if (isoMatch) {
      year = parseInt(isoMatch[1], 10);
      month = parseInt(isoMatch[2], 10);
      day = parseInt(isoMatch[3], 10);
    } else {
      return false; // Formato não reconhecido
    }
  }
  
  // Validar ranges
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;
  
  // Validar dia válido para o mês
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

export function convertBrazilianDateToISO(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  // Tratar sentinelas de data como null
  const sentinels = ['00/00/0000', '0000-00-00', '-', '—', 'N/A', 'NA', 'NULL', '0'];
  if (sentinels.includes(dateStr.trim())) return null;
  
  if (!validateDate(dateStr)) {
    throw new Error(`Data inválida: "${dateStr}"`);
  }
  
  // Se já está em formato ISO, retorna
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }
  
  // Converte DD/MM/YYYY para YYYY-MM-DD
  const parts = dateStr.split('/');
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
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
