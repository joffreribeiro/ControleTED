import { Router, Request, Response } from 'express';
import { getDataFilePath, readStoredData, writeStoredData } from '../services/fileStorage';

const router = Router();

router.get('/status', async (_req: Request, res: Response) => {
  try {
    const data = await readStoredData();
    res.json({
      mode: 'file',
      path: getDataFilePath(),
      items: Array.isArray(data.teds) ? data.teds.length : 0
    });
  } catch (error) {
    console.error('Erro ao consultar status do armazenamento em arquivo:', error);
    res.status(500).json({ error: 'Erro ao consultar armazenamento em arquivo' });
  }
});

router.get('/app-data', async (_req: Request, res: Response) => {
  try {
    const data = await readStoredData();
    res.json(data);
  } catch (error) {
    console.error('Erro ao ler dados do arquivo:', error);
    res.status(500).json({ error: 'Erro ao ler dados do arquivo' });
  }
});

router.put('/app-data', async (req: Request, res: Response) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'Payload inválido' });
    }

    const data = await writeStoredData(req.body);
    res.json({
      message: 'Dados salvos com sucesso',
      path: getDataFilePath(),
      data
    });
  } catch (error) {
    console.error('Erro ao salvar dados no arquivo:', error);
    res.status(500).json({ error: 'Erro ao salvar dados no arquivo' });
  }
});

export default router;