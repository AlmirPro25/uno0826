
import prisma from '../prisma';
import { calculateDistanceNm } from '../utils/geo';

interface CreateBookingDTO {
  assetId: string;
  passengerName: string;
  vipCode?: string;
  originLat: number;
  originLng: number;
  destLat: number;
  destLng: number;
  departureTime: string;
}

export const createBooking = async (data: CreateBookingDTO) => {
  return await prisma.$transaction(async (tx) => {
    // 1. Verificar disponibilidade
    const asset = await tx.asset.findUnique({ where: { id: data.assetId } });
    
    if (!asset) throw new Error('Asset not found');
    if (asset.status === 'MAINTENANCE' || asset.status === 'DECOMMISSIONED') {
      throw new Error('Asset unavailable for mission');
    }

    // 2. Bloqueio Atômico: Verificar conflitos de horário
    const departure = new Date(data.departureTime);
    // Lógica simplificada: se já tem booking confirmado no futuro próximo, rejeita.
    const conflict = await tx.booking.findFirst({
      where: {
        assetId: data.assetId,
        status: 'CONFIRMED',
        departureTime: {
          gte: new Date(departure.getTime() - 2 * 60 * 60 * 1000), // 2h buffer
          lte: new Date(departure.getTime() + 4 * 60 * 60 * 1000)  // Assume 4h mission
        }
      }
    });

    if (conflict) {
      throw new Error('Time slot conflict for this asset.');
    }

    // 3. Calcular custos e detalhes
    const distance = calculateDistanceNm(data.originLat, data.originLng, data.destLat, data.destLng);
    const flightTimeHours = distance / asset.speedKnots;
    const totalCost = flightTimeHours * asset.pricePerHour;
    
    // Ticket Generator
    const ticketNumber = `TITAN-${asset.category.substring(0,2)}-${Date.now().toString().slice(-6)}`;

    // 4. Criar Booking
    const booking = await tx.booking.create({
      data: {
        ticketNumber,
        assetId: data.assetId,
        passengerName: data.passengerName,
        vipCode: data.vipCode,
        originLat: data.originLat,
        originLng: data.originLng,
        destLat: data.destLat,
        destLng: data.destLng,
        departureTime: departure,
        estimatedDurationMin: Math.ceil(flightTimeHours * 60),
        totalCost: Math.ceil(totalCost),
        status: 'CONFIRMED'
      }
    });

    return booking;
  });
};
