import pool from '../config/database';

export interface TED {
  id?: number;
  number: string;
  title: string;
  description?: string;
  status: string;
  start_date?: Date | string;
  end_date?: Date | string;
  total_budget?: number;
  total_spent?: number;
  physical_progress_percentage?: number;
  financial_progress_percentage?: number;
  responsible_user_id?: number;
  created_by?: number;
  created_at?: Date | string;
  updated_at?: Date | string;
}

export async function getTEDById(id: number): Promise<TED | null> {
  const result = await pool.query('SELECT * FROM teds WHERE id = $1', [id]);
  return result.rows[0] || null;
}

export async function getTEDByNumber(number: string): Promise<TED | null> {
  const result = await pool.query('SELECT * FROM teds WHERE number = $1', [number]);
  return result.rows[0] || null;
}

export async function getAllTEDs(limit: number = 50, offset: number = 0): Promise<TED[]> {
  const result = await pool.query(
    'SELECT * FROM teds ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset]
  );
  return result.rows;
}

export async function createTED(ted: TED): Promise<TED> {
  const {
    number,
    title,
    description,
    status,
    start_date,
    end_date,
    total_budget,
    responsible_user_id,
    created_by
  } = ted;

  const result = await pool.query(
    `INSERT INTO teds (number, title, description, status, start_date, end_date, total_budget, responsible_user_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [number, title, description, status, start_date, end_date, total_budget, responsible_user_id, created_by]
  );
  return result.rows[0];
}

export async function updateTED(id: number, ted: Partial<TED>): Promise<TED> {
  const {
    title,
    description,
    status,
    start_date,
    end_date,
    total_budget,
    total_spent,
    physical_progress_percentage,
    financial_progress_percentage,
    responsible_user_id
  } = ted;

  const result = await pool.query(
    `UPDATE teds 
     SET title = COALESCE($1, title),
         description = COALESCE($2, description),
         status = COALESCE($3, status),
         start_date = COALESCE($4, start_date),
         end_date = COALESCE($5, end_date),
         total_budget = COALESCE($6, total_budget),
         total_spent = COALESCE($7, total_spent),
         physical_progress_percentage = COALESCE($8, physical_progress_percentage),
         financial_progress_percentage = COALESCE($9, financial_progress_percentage),
         responsible_user_id = COALESCE($10, responsible_user_id),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $11
     RETURNING *`,
    [title, description, status, start_date, end_date, total_budget, total_spent, physical_progress_percentage, financial_progress_percentage, responsible_user_id, id]
  );
  return result.rows[0];
}

export async function deleteTED(id: number): Promise<boolean> {
  const result = await pool.query('DELETE FROM teds WHERE id = $1', [id]);
  return result.rowCount ? result.rowCount > 0 : false;
}
