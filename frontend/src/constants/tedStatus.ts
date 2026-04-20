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

export const TED_STATUS_COLORS: Record<string, string> = {
  [TED_STATUS.PLANEJAMENTO]: 'bg-yellow-100 text-yellow-800',
  [TED_STATUS.EXECUCAO]: 'bg-blue-100 text-blue-800',
  [TED_STATUS.CONCLUIDO]: 'bg-green-100 text-green-800',
  [TED_STATUS.SUSPENSO]: 'bg-red-100 text-red-800',
};

export const PAGAMENTO_STATUS_COLORS: Record<string, string> = {
  [PAGAMENTO_STATUS.PLANEJADO]: 'bg-yellow-100 text-yellow-800',
  [PAGAMENTO_STATUS.PAGO]: 'bg-green-100 text-green-800',
  [PAGAMENTO_STATUS.PENDENTE]: 'bg-red-100 text-red-800',
};
