
import { useState, useEffect, useCallback } from 'react';
import { AssetService } from '../services/api/assets';
import { BookingService } from '../services/api/bookings';
import { useFleetStore } from '../stores/useFleetStore';
import { useAuthStore } from '../stores/useAuthStore';

/**
 * HOOK: DATA SYNCHRONIZATION
 * Orchestrates fetching initial state for the UI.
 */
export const useData = () => {
  const { setAssets, setLoading: setFleetLoading } = useFleetStore();
  const token = useAuthStore(state => state.token);
  const [error, setError] = useState<string | null>(null);

  const fetchFleet = useCallback(async () => {
    if (!token) return;
    
    setFleetLoading(true);
    try {
      const fleet = await AssetService.getAllAssets();
      setAssets(fleet);
      setError(null);
    } catch (err) {
      console.error('[DATA] Fleet fetch failed', err);
      setError('Failed to load fleet data.');
    } finally {
      setFleetLoading(false);
    }
  }, [token, setAssets, setFleetLoading]);

  // Auto-fetch on mount if authenticated
  useEffect(() => {
    if (token) {
      fetchFleet();
    }
  }, [token, fetchFleet]);

  return {
    fetchFleet,
    error
  };
};

export const useBookingAction = () => {
  const [isProcessing, setIsProcessing] = useState(false);

  const createBooking = async (payload: any) => {
    setIsProcessing(true);
    try {
      const response = await BookingService.createBooking(payload);
      return response;
    } catch (err: any) {
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return { createBooking, isProcessing };
};
