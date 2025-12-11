import pool from '../config/database';

export interface User {
  id?: number;
  email: string;
  password?: string;
  name: string;
  role: 'admin' | 'gestor' | 'user';
  active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export async function getUserById(id: number): Promise<User | null> {
  const result = await pool.query(
    'SELECT id, email, name, role, active, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
}

export async function createUser(user: User): Promise<User> {
  const { email, password, name, role } = user;
  const result = await pool.query(
    'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, active, created_at, updated_at',
    [email, password, name, role || 'user']
  );
  return result.rows[0];
}

export async function updateUser(id: number, user: Partial<User>): Promise<User> {
  const { email, name, role, active } = user;
  const result = await pool.query(
    'UPDATE users SET email = COALESCE($1, email), name = COALESCE($2, name), role = COALESCE($3, role), active = COALESCE($4, active), updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING id, email, name, role, active, created_at, updated_at',
    [email, name, role, active, id]
  );
  return result.rows[0];
}

export async function getAllUsers(): Promise<User[]> {
  const result = await pool.query(
    'SELECT id, email, name, role, active, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
}
