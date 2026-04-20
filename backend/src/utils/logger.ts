const ts = () => new Date().toISOString();

export const logger = {
  info: (msg: string, meta?: object) =>
    console.log(JSON.stringify({ level: 'info', msg, ...meta, ts: ts() })),
  warn: (msg: string, meta?: object) =>
    console.warn(JSON.stringify({ level: 'warn', msg, ...meta, ts: ts() })),
  error: (msg: string, meta?: object) =>
    console.error(JSON.stringify({ level: 'error', msg, ...meta, ts: ts() })),
};
