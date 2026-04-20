export const DEFAULT_PORT = 5000;

export const JWT_SECRET_DEFAULT = 'ted-secret-key-2024';
export const JWT_EXPIRES_IN_DEFAULT = '24h';

export const TED_STATUS = {
  PLANEJAMENTO: 'PLANEJAMENTO',
  EXECUCAO: 'EXECUÇÃO',
  CONCLUIDO: 'CONCLUÍDO',
  SUSPENSO: 'SUSPENSO',
} as const;

export const PAGAMENTO_STATUS = {
  PENDENTE: 'PENDENTE',
  PAGO: 'PAGO',
  PLANEJADO: 'PLANEJADO',
} as const;

export type TedStatus = typeof TED_STATUS[keyof typeof TED_STATUS];
export type PagamentoStatus = typeof PAGAMENTO_STATUS[keyof typeof PAGAMENTO_STATUS];

export const DEFAULT_DATA_STRUCTURE = { teds: [] as unknown[], proxiId: 1 };
