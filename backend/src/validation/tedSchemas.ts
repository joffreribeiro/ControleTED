import { TED_STATUS, PAGAMENTO_STATUS } from '../config/constants';

export interface CreateTedInput {
  number: string;
  title: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  responsible_user_id?: number;
}

export interface CreateMilestoneInput {
  description: string;
  target_percentage?: number;
  planned_date?: string;
}

export interface CreateFinancialItemInput {
  description: string;
  planned_amount?: number;
  payment_date?: string;
}

function isValidStatus<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

export function validateCreateTed(body: Record<string, unknown>): { valid: true; data: CreateTedInput } | { valid: false; error: string } {
  if (!body.number || typeof body.number !== 'string') {
    return { valid: false, error: 'Número é obrigatório e deve ser texto' };
  }
  if (!body.title || typeof body.title !== 'string' || (body.title as string).trim().length === 0) {
    return { valid: false, error: 'Título é obrigatório' };
  }
  if (body.total_budget !== undefined && (typeof body.total_budget !== 'number' || body.total_budget < 0)) {
    return { valid: false, error: 'Orçamento deve ser um número positivo' };
  }
  if (body.status !== undefined) {
    const allowed = Object.values(TED_STATUS) as string[];
    if (!isValidStatus(body.status, allowed)) {
      return { valid: false, error: `Status inválido. Valores permitidos: ${allowed.join(', ')}` };
    }
  }
  return { valid: true, data: body as unknown as CreateTedInput };
}

export function parseId(raw: string): number | null {
  const id = parseInt(raw, 10);
  return isNaN(id) || id <= 0 ? null : id;
}
