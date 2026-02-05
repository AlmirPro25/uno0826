
import prisma from '../utils/prisma';
import { logger, Severity, Origin } from '../utils/logger';

// PHYSICS CONSTANTS
const BASE_DECAY_RATE = 0.9995; // Natural entropy
const HUMAN_CONSUMPTION_O2 = 50; // ppm per tick
const CO2_GENERATION = 45; // ppm per tick

export class PhysicsEngine {
  private static instance: PhysicsEngine;
  private isRunning: boolean = false;

  private constructor() {}

  public static getInstance(): PhysicsEngine {
    if (!PhysicsEngine.instance) {
      PhysicsEngine.instance = new PhysicsEngine();
    }
    return PhysicsEngine.instance;
  }

  /**
   * Initializes the planetary heartbeat.
   * Runs every 3000ms to simulate environmental shifts.
   */
  public startHeartbeat() {
    if (this.isRunning) return;
    this.isRunning = true;
    logger.log(Severity.INFO, Origin.SYSTEM, 'PHYSICS SIMULATION ENGINE STARTED');

    setInterval(async () => {
      await this.tick();
    }, 3000);
  }

  /**
   * The "Tick": Calculates the next frame of reality based on the previous one.
   */
  private async tick() {
    try {
      // 1. Fetch last known state
      const lastFrame = await prisma.telemetryFrame.findFirst({
        orderBy: { recorded_at: 'desc' }
      });

      // Default state for Genesis (First Run)
      let newState = {
        oxygen_ppm: 210000,
        carbon_dioxide_ppm: 400,
        pressure_kpa: 101.3,
        temperature_c: 22.5,
        radiation_level: 0.005,
        energy_grid_load: 65.0,
        water_reserve_lvl: 98.0,
        shield_frequency: 450.0,
        hull_integrity: 100.0
      };

      if (lastFrame) {
        // 2. Apply Entropy and Consumption
        newState.oxygen_ppm = Math.max(0, lastFrame.oxygen_ppm - HUMAN_CONSUMPTION_O2 + this.randomNoise(-10, 20));
        newState.carbon_dioxide_ppm = lastFrame.carbon_dioxide_ppm + CO2_GENERATION + this.randomNoise(-5, 10);
        newState.pressure_kpa = lastFrame.pressure_kpa + this.randomNoise(-0.1, 0.1);
        newState.temperature_c = lastFrame.temperature_c + this.randomNoise(-0.2, 0.2); // Mars night/day drift
        newState.radiation_level = Math.max(0, lastFrame.radiation_level + this.randomNoise(-0.001, 0.002));
        newState.energy_grid_load = Math.min(100, Math.max(0, lastFrame.energy_grid_load + this.randomNoise(-1.5, 1.5)));
        newState.water_reserve_lvl = Math.max(0, lastFrame.water_reserve_lvl - 0.01); // Slow drain
        newState.shield_frequency = lastFrame.shield_frequency;
        newState.hull_integrity = lastFrame.hull_integrity;

        // 3. Apply Calibration Configs (The System trying to correct itself)
        const configs = await prisma.calibrationConfig.findMany();
        configs.forEach(config => {
           if (config.key === 'OXYGEN_TARGET') {
             if (newState.oxygen_ppm < config.value) newState.oxygen_ppm += 60; // Scrubbers working
           }
           // Add more logic for other regulators
        });
      }

      // 4. Save new frame
      await prisma.telemetryFrame.create({ data: newState });

      // 5. Check Critical Thresholds
      if (newState.oxygen_ppm < 195000) {
        await logger.log(Severity.CRITICAL, Origin.PHYSICS_ENGINE, 'HYPOXIA ALERT: O2 Levels Critical');
      }
      if (newState.radiation_level > 0.5) {
         await logger.log(Severity.ALERT, Origin.PHYSICS_ENGINE, 'SOLAR FLARE DETECTED: High Radiation');
      }

    } catch (error) {
      console.error("Physics Engine Stalled:", error);
    }
  }

  private randomNoise(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
