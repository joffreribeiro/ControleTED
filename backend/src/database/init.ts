import pool from '../config/database';

export async function initializeDatabase() {
  try {
    console.log('📦 Inicializando banco de dados...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teds (
        id SERIAL PRIMARY KEY,
        number VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANEJAMENTO',
        start_date DATE,
        end_date DATE,
        total_budget DECIMAL(15, 2),
        total_spent DECIMAL(15, 2) DEFAULT 0,
        physical_progress_percentage NUMERIC(5, 2) DEFAULT 0,
        financial_progress_percentage NUMERIC(5, 2) DEFAULT 0,
        responsible_user_id INTEGER REFERENCES users(id),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS physical_milestones (
        id SERIAL PRIMARY KEY,
        ted_id INTEGER NOT NULL REFERENCES teds(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        target_percentage NUMERIC(5, 2),
        actual_percentage NUMERIC(5, 2) DEFAULT 0,
        planned_date DATE,
        completion_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'PENDENTE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS financial_items (
        id SERIAL PRIMARY KEY,
        ted_id INTEGER NOT NULL REFERENCES teds(id) ON DELETE CASCADE,
        description VARCHAR(255) NOT NULL,
        planned_amount DECIMAL(15, 2),
        spent_amount DECIMAL(15, 2) DEFAULT 0,
        payment_date DATE,
        status VARCHAR(50) NOT NULL DEFAULT 'PLANEJADO',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        ted_id INTEGER NOT NULL REFERENCES teds(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id),
        type VARCHAR(100) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Banco de dados inicializado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error);
    throw error;
  }
}
