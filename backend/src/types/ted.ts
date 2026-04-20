import { TedStatus, PagamentoStatus } from '../config/constants';

export interface PhysicalMilestone {
  id: number;
  ted_id: number;
  description: string;
  target_percentage: number;
  actual_percentage: number;
  planned_date?: string;
  completion_date?: string;
  status: PagamentoStatus;
  created_at: string;
  updated_at: string;
}

export interface FinancialItem {
  id: number;
  ted_id: number;
  description: string;
  planned_amount: number;
  spent_amount: number;
  payment_date?: string;
  status: PagamentoStatus;
  created_at: string;
  updated_at: string;
}

export interface Ted {
  id: number;
  number: string;
  title: string;
  description?: string;
  status: TedStatus;
  start_date?: string;
  end_date?: string;
  total_budget: number;
  total_spent: number;
  physical_progress_percentage: number;
  financial_progress_percentage: number;
  responsible_user_id?: number;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface TedWithDetails extends Ted {
  physical_milestones: PhysicalMilestone[];
  financial_items: FinancialItem[];
}

export interface StoredData {
  teds: Ted[];
  proxiId: number;
}
