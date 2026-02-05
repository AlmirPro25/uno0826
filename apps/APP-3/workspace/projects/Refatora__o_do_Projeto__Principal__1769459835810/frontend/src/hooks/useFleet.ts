
import { useEffect } from 'react';
import { useFleetStore } from '@/stores/useFleetStore';

export const useFleet = () => {
  const { inventory, isLoading, error, fetchInventory } = useFleetStore();

  // Auto-fetch ao montar o componente se necessário
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const availableCars = inventory.filter(car => car.status === 'AVAILABLE');
  const reservedCars = inventory.filter(car => car.status === 'RESERVED');
  const soldCars = inventory.filter(car => car.status === 'SOLD');

  return {
    inventory,
    availableCars,
    reservedCars,
    soldCars,
    isLoading,
    error,
    refresh: () => fetchInventory(true)
  };
};
