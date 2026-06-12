/**
 * Logger consistente para el servidor frontend (BFF / PDF generation).
 * Evita llamadas directas a console.log/console.error en producción,
 * o las formatea de manera uniforme y segura.
 */
const isProd = process.env.NODE_ENV === 'production';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (!isProd) {
      console.log(`[INFO] [BFF] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`[WARN] [BFF] ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    // En producción se conserva console.error de forma estructurada
    console.error(`[ERROR] [BFF] ${message}`, ...args);
  },
};
