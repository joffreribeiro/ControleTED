import API from './api';

export interface TED {
  id: number;
  number: string;
  title: string;
  description?: string;
  status: string;
  start_date?: string;
  end_date?: string;
  total_budget?: number;
  total_spent?: number;
  physical_progress_percentage?: number;
  financial_progress_percentage?: number;
  responsible_user_id?: number;
  created_at: string;
  updated_at: string;
}

export interface PhysicalMilestone {
  id: number;
  ted_id: number;
  description: string;
  target_percentage: number;
  actual_percentage: number;
  planned_date?: string;
  completion_date?: string;
  status: string;
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
  status: string;
  created_at: string;
  updated_at: string;
}

export const tedService = {
  getAll: async (limit: number = 50, offset: number = 0): Promise<TED[]> => {
    const response = await API.get('/ted', { params: { limit, offset } });
    return response.data;
  },

  getById: async (id: number): Promise<TED & { physical_milestones: PhysicalMilestone[]; financial_items: FinancialItem[] }> => {
    const response = await API.get(`/ted/${id}`);
    return response.data;
  },

  create: async (data: Partial<TED>): Promise<TED> => {
    const response = await API.post('/ted', data);
    return response.data;
  },

  update: async (id: number, data: Partial<TED>): Promise<TED> => {
    const response = await API.put(`/ted/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await API.delete(`/ted/${id}`);
  },

  addPhysicalMilestone: async (tedId: number, data: Partial<PhysicalMilestone>): Promise<PhysicalMilestone> => {
    const response = await API.post(`/ted/${tedId}/physical-milestone`, data);
    return response.data;
  },

  updatePhysicalMilestone: async (tedId: number, milestoneId: number, data: Partial<PhysicalMilestone>): Promise<PhysicalMilestone> => {
    const response = await API.put(`/ted/${tedId}/physical-milestone/${milestoneId}`, data);
    return response.data;
  },

  addFinancialItem: async (tedId: number, data: Partial<FinancialItem>): Promise<FinancialItem> => {
    const response = await API.post(`/ted/${tedId}/financial-item`, data);
    return response.data;
  },

  updateFinancialItem: async (tedId: number, itemId: number, data: Partial<FinancialItem>): Promise<FinancialItem> => {
    const response = await API.put(`/ted/${tedId}/financial-item/${itemId}`, data);
    return response.data;
  }
};
