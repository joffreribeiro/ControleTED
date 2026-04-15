import { Router, Response } from 'express';
import { authMiddleware, AuthRequest, adminMiddleware } from '../middleware/auth';
import * as userModel from '../models/user';

const router = Router();

// GET /api/user/profile - Get current user
router.get('/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await userModel.getUserById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
});

// GET /api/user/all - Get all users (admin only)
router.get('/all', authMiddleware, adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuários' });
  }
});

// PUT /api/user/:id - Update user (admin or self)
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = parseInt(req.params.id);
    if (isNaN(userId)) return res.status(400).json({ error: 'ID inválido' });

    // Permitir que o usuário atualize apenas seus próprios dados, ou que admins atualizem qualquer usuário
    if (req.user!.id !== userId && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    // Não-admins não podem alterar role nem active
    const { role, active, ...safeFields } = req.body;
    const payload = req.user!.role === 'admin'
      ? req.body
      : safeFields;

    const updatedUser = await userModel.updateUser(userId, payload);
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
});

export default router;
