
import { WebSocketServer, WebSocket } from 'ws';
import { prisma } from '../prisma';

// MOTOR DE SIMULAÇÃO TÁTICA (THE HEARTBEAT)
// Responsável por gerar telemetria viva e manter o sistema "respirando".

interface TacticalCoordinate {
  lat: number;
  lng: number;
}

export class SimulationEngine {
  private wss: WebSocketServer;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(wss: WebSocketServer) {
    this.wss = wss;
  }

  public ignite() {
    console.log("[SENTINEL] :: SIMULATION ENGINE ONLINE ::");
    
    // Ciclo de atualização de 3 segundos
    this.intervalId = setInterval(async () => {
      await this.pulse();
    }, 3000);
  }

  private async pulse() {
    const assets = await prisma.asset.findMany();

    // Processamento em lote para cada ativo
    const updates = assets.map(async (asset) => {
      // 1. Simular Movimento (Drift Aleatório para Demo)
      // Em produção real, usaria interpolação de vetor direção ao destino
      const driftLat = (Math.random() - 0.5) * 0.01; 
      const driftLng = (Math.random() - 0.5) * 0.01;

      // 2. Simular Telemetria de Sensores
      const tempFluctuation = (Math.random() - 0.5) * 0.5;
      const batteryDrain = Math.random() > 0.9 ? 1 : 0; // Drena 1% ocasionalmente

      const newLat = asset.latitude + driftLat;
      const newLng = asset.longitude + driftLng;
      const newTemp = parseFloat((asset.temperature + tempFluctuation).toFixed(2));
      const newBattery = Math.max(0, asset.battery - batteryDrain);

      // 3. Persistência Atômica
      return prisma.asset.update({
        where: { id: asset.id },
        data: {
          latitude: newLat,
          longitude: newLng,
          temperature: newTemp,
          battery: newBattery,
          updatedAt: new Date()
        }
      });
    });

    const updatedAssets = await Promise.all(updates);
    
    // 4. Broadcast via WebSocket (Latência Zero)
    this.broadcast({
      type: 'TELEMETRY_UPDATE',
      timestamp: new Date().toISOString(),
      payload: updatedAssets
    });
  }

  private broadcast(data: any) {
    const payload = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    });
  }

  // Auto-Seeding: Garante que existam ativos no radar ao iniciar
  public async ensureDataIntegrity() {
    const count = await prisma.asset.count();
    if (count === 0) {
      console.log("[SENTINEL] :: NO ASSETS DETECTED. INITIATING PROTOCOL SEED ::");
      
      const seeds = [
        {
          codename: 'OP-RED-DRAGON',
          type: 'AIR',
          origin: 'DXB',
          destination: 'LHR',
          latitude: 25.276987,
          longitude: 55.296249,
          temperature: 4.5,
          status: 'IN_TRANSIT',
          threatLevel: 'LOW'
        },
        {
          codename: 'OP-STEEL-VAULT',
          type: 'LAND',
          origin: 'MCO',
          destination: 'GVA',
          latitude: 43.7384,
          longitude: 7.4246,
          temperature: 18.2,
          status: 'IN_TRANSIT',
          threatLevel: 'ELEVATED'
        },
        {
          codename: 'OP-NEON-TIDE',
          type: 'SEA',
          origin: 'HKG',
          destination: 'NYC',
          latitude: 22.3193,
          longitude: 114.1694,
          temperature: -2.0,
          status: 'CLEARED',
          threatLevel: 'LOW'
        }
      ];

      for (const seed of seeds) {
        await prisma.asset.create({ data: seed });
      }
      console.log("[SENTINEL] :: SEED COMPLETE. ASSETS DEPLOYED ::");
    }
  }
}
