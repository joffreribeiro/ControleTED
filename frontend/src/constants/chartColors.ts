// Cores para gráficos (Recharts). Precisam ser valores JS pois a lib não lê CSS vars.
// As cores de UI (badges, header) vivem em globals.css como CSS custom properties.

export const CHART_COLORS = {
  primary: '#0C447C',
  primaryMid: '#185FA5',
  success: '#639922',
  warning: '#854F0B',
  progress: '#3b82f6',
  empty: '#e5e7eb',
} as const;

// Par padrão para gráficos de progresso (preenchido / restante)
export const PIE_PROGRESS_COLORS = [CHART_COLORS.progress, CHART_COLORS.empty];

// Cores dos cards do Dashboard (cada card tem sua cor de destaque)
export const STAT_CARD_COLORS = {
  orcamento: CHART_COLORS.primary,
  executado: CHART_COLORS.success,
  emExecucao: CHART_COLORS.primaryMid,
  concluidos: CHART_COLORS.warning,
} as const;
