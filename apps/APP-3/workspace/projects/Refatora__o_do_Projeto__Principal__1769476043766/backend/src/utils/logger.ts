
import prisma from './prisma';

export enum Severity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ALERT = 'ALERT',
  CRITICAL = 'CRITICAL',
  FATAL = 'FATAL'
}

export enum Origin {
  SYSTEM = 'SYSTEM',
  USER_OVERRIDE = 'USER_OVERRIDE',
  AUTOMATION = 'AUTOMATION',
  PHYSICS_ENGINE = 'PHYSICS_ENGINE'
}

class CydoniaLogger {
  /**
   * Writes an immutable log entry to the "Black Box" (SystemLog table).
   * Asynchronous to prevent blocking the main event loop.
   */
  async log(severity: Severity, origin: Origin, message: String, meta?: any) {
    const metaString = meta ? JSON.stringify(meta) : null;
    
    // Console output for immediate debugging (Retina Display)
    const color = severity === Severity.CRITICAL ? '\x1b[31m' : '\x1b[36m';
    console.log(`${color}[${new Date().toISOString()}] [${severity}] ${message}\x1b[0m`);

    try {
      await prisma.systemLog.create({
        data: {
          severity: severity.toString(),
          origin: origin.toString(),
          message: message.toString(),
          meta_data: metaString
        }
      });
    } catch (error) {
      console.error('CRITICAL: FAILED TO WRITE TO AUDIT LOG', error);
      // If logging fails, we are in deep trouble.
    }
  }
}

export const logger = new CydoniaLogger();
