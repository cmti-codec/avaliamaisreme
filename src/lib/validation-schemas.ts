import { z } from 'zod';

// CPF validation with checksum algorithm
function validateCPFChecksum(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid CPFs
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate first check digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(9))) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  checkDigit = 11 - (sum % 11);
  if (checkDigit >= 10) checkDigit = 0;
  if (checkDigit !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

// CPF schema with proper validation
export const cpfSchema = z.string()
  .min(1, 'CPF é obrigatório')
  .refine((val) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.length === 11;
  }, 'CPF deve ter 11 dígitos')
  .refine(validateCPFChecksum, 'CPF inválido');

// Email schema with strict validation
export const emailSchema = z.string()
  .min(1, 'Email é obrigatório')
  .email('Email inválido')
  .max(255, 'Email deve ter no máximo 255 caracteres')
  .regex(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, 'Email inválido');

// Phone schema
export const phoneSchema = z.string()
  .min(10, 'Telefone deve ter no mínimo 10 dígitos')
  .max(15, 'Telefone deve ter no máximo 15 dígitos')
  .regex(/^[\d\s\-\(\)]+$/, 'Telefone deve conter apenas números e símbolos válidos');

// Name schema with XSS protection
export const nameSchema = z.string()
  .min(1, 'Nome é obrigatório')
  .max(200, 'Nome deve ter no máximo 200 caracteres')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome contém caracteres inválidos')
  .transform(val => val.trim());

// Date schema
export const dateSchema = z.string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
  .refine((val) => {
    const date = new Date(val);
    return !isNaN(date.getTime());
  }, 'Data inválida');

// Matricula schema
export const matriculaSchema = z.string()
  .min(1, 'Matrícula é obrigatória')
  .regex(/^\d{6}$/, 'Matrícula deve ter 6 dígitos');

// User creation schema
export const userCreateSchema = z.object({
  nome: nameSchema,
  email: emailSchema,
  password: z.string()
    .min(12, 'Senha deve ter no mínimo 12 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter ao menos uma letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter ao menos uma letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter ao menos um número'),
  roles: z.array(z.enum(['ADMIN', 'GESTOR_SEMED', 'TECNICO_SEMED', 'DIRETOR', 'SECRETARIO', 'COORDENADOR', 'PROFESSOR']))
    .min(1, 'Pelo menos uma role é obrigatória'),
  escola_id: z.string().uuid().nullable().optional()
});

// Professor schema
export const professorSchema = z.object({
  nome: nameSchema,
  email: emailSchema.optional(),
  cpf: cpfSchema.optional(),
  telefone: phoneSchema.optional(),
  matricula: matriculaSchema.optional(),
  carga_horaria_contratual: z.number().min(0).max(50)
});

// CSV import row schema
export const csvImportRowSchema = z.object({
  nome: nameSchema,
  email: emailSchema.optional(),
  cpf: cpfSchema.optional(),
  matricula: z.string().optional(),
  escola_saesc: z.string()
    .regex(/^[a-zA-Z0-9-]+$/, 'Código SAESC inválido')
    .max(50)
});

// Sanitize text for output (prevent XSS)
export function sanitizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/[<>]/g, '') // Remove < and >
    .trim();
}

// Sanitize for SQL (though Supabase client handles this)
export function sanitizeForQuery(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/['";\\]/g, '') // Remove SQL special characters
    .trim();
}