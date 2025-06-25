import { useState, useEffect, useCallback } from 'react';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>(defaultRates);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Simple implementation that uses the default rates
  const updateShippingRate = async (prefecture: string, cost: number, estimatedDays?: string) => {
    try {
      // Update local state only
      setRates(prev => 
        prev.map(rate => 
          rate.prefecture === prefecture 
            ? { ...rate, cost, ...(estimatedDays ? { estimatedDays } : {}) }
            : rate
        )
      );
      return true;
    } catch (err) {
      console.error('Error updating shipping rate:', err);
      return false;
    }
  };

  const updateAllShippingRates = async (newRates: ShippingRate[]) => {
    try {
      // Update local state only
      setRates(newRates);
      return true;
    } catch (err) {
      console.error('Error updating all shipping rates:', err);
      return false;
    }
  };

  const getShippingRate = useCallback((prefecture: string): ShippingRate | undefined => {
    // Find in rates
    const rate = rates.find(rate => rate.prefecture === prefecture);
    if (rate) return rate;
    
    // If not found, find in default rates
    const defaultRate = defaultRates.find(rate => rate.prefecture === prefecture);
    return defaultRate;
  }, [rates]);

  return {
    rates,
    loading,
    error,
    updateShippingRate,
    updateAllShippingRates,
    getShippingRate
  };
};