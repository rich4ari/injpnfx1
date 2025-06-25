import { useState, useEffect, useCallback } from 'react';
import { 
  getShippingRates, 
  getShippingRateForPrefecture, 
  updateShippingRate, 
  updateMultipleShippingRates 
} from '@/services/shippingService';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>(defaultRates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch all shipping rates
  useEffect(() => {
    const fetchRates = async () => {
      try {
        setLoading(true);
        const fetchedRates = await getShippingRates();
        setRates(fetchedRates);
      } catch (err) {
        console.error('Error fetching shipping rates:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchRates();
  }, []);

  // Update a single shipping rate
  const updateRate = async (prefecture: string, cost: number, estimatedDays?: string) => {
    try {
      const success = await updateShippingRate(prefecture, cost, estimatedDays);
      
      if (success) {
        // Update local state
        setRates(prev => 
          prev.map(rate => 
            rate.prefecture === prefecture 
              ? { ...rate, cost, ...(estimatedDays ? { estimatedDays } : {}) }
              : rate
          )
        );
      }
      
      return success;
    } catch (err) {
      console.error('Error updating shipping rate:', err);
      return false;
    }
  };

  // Update multiple shipping rates at once
  const updateAllRates = async (newRates: ShippingRate[]) => {
    try {
      const success = await updateMultipleShippingRates(newRates);
      
      if (success) {
        // Update local state
        setRates(newRates);
      }
      
      return success;
    } catch (err) {
      console.error('Error updating all shipping rates:', err);
      return false;
    }
  };

  // Get shipping rate for a specific prefecture
  const getRate = useCallback(async (prefecture: string): Promise<ShippingRate | null> => {
    try {
      return await getShippingRateForPrefecture(prefecture);
    } catch (err) {
      console.error('Error getting shipping rate:', err);
      return null;
    }
  }, []);

  return {
    rates,
    loading,
    error,
    updateRate,
    updateAllRates,
    getRate
  };
};