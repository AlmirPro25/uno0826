
import prisma from '../prisma';
import { AssetStatus } from '@prisma/client';

export const getAllAssets = async () => {
  return await prisma.asset.findMany({
    orderBy: { category: 'asc' },
    include: {
      bookings: {
        where: { status: 'CONFIRMED' },
        take: 1,
        orderBy: { departureTime: 'asc' }
      }
    }
  });
};

export const updateAssetTelemetry = async (id: string, data: { lat: number, lng: number, heading?: number, altitude?: number, status?: AssetStatus }) => {
  return await prisma.asset.update({
    where: { id },
    data: {
      latitude: data.lat,
      longitude: data.lng,
      heading: data.heading,
      altitude: data.altitude,
      status: data.status
    }
  });
};

export const getAssetById = async (id: string) => {
  return await prisma.asset.findUnique({
    where: { id }
  });
};
