
import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export const getTelemetry = async (req: Request, res: Response) => {
  try {
    // Fetch the absolute latest frame
    const latestFrame = await prisma.telemetryFrame.findFirst({
      orderBy: { recorded_at: 'desc' }
    });

    if (!latestFrame) {
      return res.status(503).json({ message: 'SENSORS CALIBRATING...' });
    }

    // Transform into OpenAPI PlanetaryState format
    const responsePayload = {
      timestamp: latestFrame.recorded_at,
      atmosphere: {
        oxygen_ppm: latestFrame.oxygen_ppm,
        pressure_kpa: latestFrame.pressure_kpa,
        radiation_sieverts: latestFrame.radiation_level
      },
      resources: {
        water_reserves_liters: Math.floor(latestFrame.water_reserve_lvl * 10000), // Simulating liters
        energy_output_mw: latestFrame.energy_grid_load * 5.2, // Simulated MW
        biomass_index: 0.85 // Static for now, represents algae tanks
      },
      sector_status: {
        dome_integrity: latestFrame.hull_integrity,
        active_alerts: 0 // Would query active logs in full implementation
      }
    };

    res.json(responsePayload);
  } catch (error) {
    res.status(500).json({ error: 'TELEMETRY BUS FAILURE' });
  }
};
