import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import * as tedModel from '../models/ted';
import pool from '../config/database';
import { logger } from '../utils/logger';
import { parseId, validateCreateTed } from '../validation/tedSchemas';
import { TED_STATUS, PAGAMENTO_STATUS } from '../config/constants';

const router = Router();

// GET /api/ted - List all TEDs
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const offset = parseInt(req.query.offset as string) || 0;
    const teds = await tedModel.getAllTEDs(limit, offset);
    res.json(teds);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar TEDs' });
  }
});

// GET /api/ted/:id - Get TED by ID
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    const ted = await tedModel.getTEDById(id);
    if (!ted) {
      return res.status(404).json({ error: 'TED não encontrado' });
    }

    // Buscar marcos físicos
    const milestonesResult = await pool.query(
      'SELECT * FROM physical_milestones WHERE ted_id = $1 ORDER BY created_at DESC',
      [ted.id]
    );

    // Buscar itens financeiros
    const financialResult = await pool.query(
      'SELECT * FROM financial_items WHERE ted_id = $1 ORDER BY created_at DESC',
      [ted.id]
    );

    res.json({
      ...ted,
      physical_milestones: milestonesResult.rows,
      financial_items: financialResult.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar TED' });
  }
});

// POST /api/ted - Create new TED
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const validation = validateCreateTed(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }
    const { number, title, description, start_date, end_date, total_budget, responsible_user_id } = validation.data;

    const ted = await tedModel.createTED({
      number,
      title,
      description,
      status: TED_STATUS.PLANEJAMENTO,
      start_date,
      end_date,
      total_budget,
      responsible_user_id,
      created_by: req.user!.id
    });

    res.status(201).json(ted);
  } catch (error) {
    logger.error('Erro ao criar TED', { error: String(error) });
    res.status(500).json({ error: 'Erro ao criar TED' });
  }
});

// PUT /api/ted/:id - Update TED
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    const ted = await tedModel.updateTED(id, req.body);
    if (!ted) {
      return res.status(404).json({ error: 'TED não encontrado' });
    }
    res.json(ted);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar TED' });
  }
});

// DELETE /api/ted/:id - Delete TED
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseId(req.params.id);
    if (!id) return res.status(400).json({ error: 'ID inválido' });
    const deleted = await tedModel.deleteTED(id);
    if (!deleted) {
      return res.status(404).json({ error: 'TED não encontrado' });
    }
    res.json({ message: 'TED deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar TED' });
  }
});

// POST /api/ted/:id/physical-milestone - Add physical milestone
router.post('/:id/physical-milestone', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { description, target_percentage, planned_date } = req.body;
    const tedId = parseId(req.params.id);
    if (!tedId) return res.status(400).json({ error: 'ID inválido' });

    const result = await pool.query(
      `INSERT INTO physical_milestones (ted_id, description, target_percentage, planned_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tedId, description, target_percentage, planned_date, PAGAMENTO_STATUS.PENDENTE]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar marco físico' });
  }
});

// PUT /api/ted/:id/physical-milestone/:milestoneId - Update physical milestone
router.put('/:id/physical-milestone/:milestoneId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { actual_percentage, completion_date, status } = req.body;
    const milestoneId = parseId(req.params.milestoneId);
    if (!milestoneId) return res.status(400).json({ error: 'ID inválido' });

    const result = await pool.query(
      `UPDATE physical_milestones
       SET actual_percentage = COALESCE($1, actual_percentage),
           completion_date = COALESCE($2, completion_date),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [actual_percentage, completion_date, status, milestoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Marco físico não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar marco físico' });
  }
});

// POST /api/ted/:id/financial-item - Add financial item
router.post('/:id/financial-item', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { description, planned_amount, payment_date } = req.body;
    const tedId = parseId(req.params.id);
    if (!tedId) return res.status(400).json({ error: 'ID inválido' });

    const result = await pool.query(
      `INSERT INTO financial_items (ted_id, description, planned_amount, payment_date, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tedId, description, planned_amount, payment_date, PAGAMENTO_STATUS.PLANEJADO]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar item financeiro' });
  }
});

// PUT /api/ted/:id/financial-item/:itemId - Update financial item
router.put('/:id/financial-item/:itemId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { spent_amount, payment_date, status } = req.body;
    const itemId = parseId(req.params.itemId);
    if (!itemId) return res.status(400).json({ error: 'ID inválido' });

    const result = await pool.query(
      `UPDATE financial_items
       SET spent_amount = COALESCE($1, spent_amount),
           payment_date = COALESCE($2, payment_date),
           status = COALESCE($3, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [spent_amount, payment_date, status, itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item financeiro não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar item financeiro' });
  }
});

export default router;
