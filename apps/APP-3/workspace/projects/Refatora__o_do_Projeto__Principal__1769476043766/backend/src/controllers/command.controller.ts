
import { Request, Response } from 'express';
import prisma from '../utils/prisma';
import { ModulateCommandSchema } from '../models/validation';
import { logger, Severity, Origin } from '../utils/logger';

export const modulateSystem = async (req: Request, res: Response) => {
  try {
    // 1. Validation
    const validation = ModulateCommandSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'INVALID PARAMETERS', 
        details: validation.error.errors 
      });
    }

    const { target_system, value, authorization_hash } = validation.data;

    // 2. Audit
    await logger.log(Severity.WARNING, Origin.USER_OVERRIDE, `Executive Command: ${target_system} -> ${value}`);

    // 3. Execution (Update Calibration Config)
    // Map API target to internal config keys
    let configKey = '';
    switch(target_system) {
      case 'OXYGEN_GENERATOR': configKey = 'OXYGEN_TARGET'; break;
      case 'PRESSURE_VALVE': configKey = 'PRESSURE_TARGET'; break;
      case 'THERMAL_REGULATOR': configKey = 'TEMP_TARGET'; break;
      default: configKey = 'UNKNOWN';
    }

    if (configKey !== 'UNKNOWN') {
      await prisma.calibrationConfig.upsert({
        where: { key: configKey },
        update: { value: value, last_author: authorization_hash },
        create: { key: configKey, value: value, last_author: authorization_hash }
      });
    }

    // 4. Response
    res.status(200).json({ 
      status: 'ACCEPTED', 
      message: `Actuators aligning for ${target_system}` 
    });

  } catch (error) {
    await logger.log(Severity.CRITICAL, Origin.SYSTEM, 'Modulation Failed', error);
    res.status(500).json({ error: 'COMMAND REJECTED BY CORE' });
  }
};

export const triggerFailSafe = async (req: Request, res: Response) => {
  await logger.log(Severity.FATAL, Origin.USER_OVERRIDE, 'OMEGA PROTOCOL INITIATED');
  
  // Set systems to absolute survival minimums
  await prisma.calibrationConfig.upsert({ where: { key: 'OXYGEN_TARGET' }, update: { value: 195000 }, create: { key: 'OXYGEN_TARGET', value: 195000, last_author: 'FAILSAFE' }});
  
  res.status(202).json({ message: 'PROTOCOL OMEGA ACTIVE. SEALING SECTORS.' });
};
