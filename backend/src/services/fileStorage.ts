import fs from 'fs/promises';
import path from 'path';
import { DEFAULT_DATA_STRUCTURE } from '../config/constants';

export interface StoredAppData {
  teds: unknown[];
  proxiId: number;
  [key: string]: unknown;
}

const defaultData: StoredAppData = { ...DEFAULT_DATA_STRUCTURE };

function hasObjectShape(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function getDataFilePath(): string {
  const explicitFile = process.env.TED_DATA_FILE?.trim();
  if (explicitFile) {
    return path.resolve(explicitFile);
  }

  const explicitDir = process.env.TED_DATA_DIR?.trim();
  if (explicitDir) {
    return path.resolve(explicitDir, 'ted-sistema.json');
  }

  return path.resolve(__dirname, '../../../dados/ted-sistema.json');
}

function normalizeStoredData(value: unknown): StoredAppData {
  if (!hasObjectShape(value)) {
    return { ...defaultData };
  }

  const normalized: StoredAppData = {
    ...value,
    teds: Array.isArray(value.teds) ? value.teds : [],
    proxiId: typeof value.proxiId === 'number' && Number.isFinite(value.proxiId) ? value.proxiId : 1
  };

  if (normalized.proxiId < 1) {
    normalized.proxiId = 1;
  }

  return normalized;
}

async function ensureDataFile(): Promise<string> {
  const dataFilePath = getDataFilePath();
  await fs.mkdir(path.dirname(dataFilePath), { recursive: true });

  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(defaultData, null, 2), 'utf-8');
  }

  return dataFilePath;
}

export async function readStoredData(): Promise<StoredAppData> {
  const dataFilePath = await ensureDataFile();
  const content = await fs.readFile(dataFilePath, 'utf-8');

  if (!content.trim()) {
    return { ...defaultData };
  }

  try {
    return normalizeStoredData(JSON.parse(content));
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify(defaultData, null, 2), 'utf-8');
    return { ...defaultData };
  }
}

export async function writeStoredData(value: unknown): Promise<StoredAppData> {
  const normalized = normalizeStoredData(value);
  const dataFilePath = await ensureDataFile();
  const tempFilePath = `${dataFilePath}.tmp`;

  await fs.writeFile(tempFilePath, JSON.stringify(normalized, null, 2), 'utf-8');
  await fs.rename(tempFilePath, dataFilePath);

  return normalized;
}