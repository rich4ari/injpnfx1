import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';
import { toast } from '@/hooks/use-toast';

const SHIPPING_RATES_COLLECTION = 'shipping_rates';

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>(defaultRates);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
    try {
      // Set up real-time listener for shipping rates
      const unsubscribe = onSnapshot(
        collection(db, SHIPPING_RATES_COLLECTION),
        (snapshot) => {
          try {
            const fetchedRates: ShippingRate[] = [];
            
            snapshot.forEach((doc) => {
              fetchedRates.push({
                prefecture: doc.id,
                cost: doc.data().cost,
                estimatedDays: doc.data().estimatedDays
              });
            });
            
            if (fetchedRates.length > 0) {
              setRates(fetchedRates);
            } else {
              // If no rates in database, use default rates
              setRates(defaultRates);
              // Initialize database with default rates
              initializeDefaultRates();
            }
            
            setLoading(false);
            setError(null);
          } catch (err) {
            console.error('Error processing shipping rates:', err);
            setRates(defaultRates);
            setError(err instanceof Error ? err : new Error('Unknown error'));
            setLoading(false);
          }
        },
        (err) => {
          console.error('Error fetching shipping rates:', err);
          setRates(defaultRates);
          setError(err);
          setLoading(false);
        }
      );
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Error setting up shipping rates listener:', err);
      setRates(defaultRates);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setLoading(false);
      return () => {}; // Return empty cleanup function
    }
  }, []);

  const initializeDefaultRates = async () => {
    try {
      // Check if rates already exist
      const firstRateRef = doc(db, SHIPPING_RATES_COLLECTION, defaultRates[0].prefecture);
      const docSnap = await getDoc(firstRateRef);
      
      if (docSnap.exists()) {
        return; // Rates already exist, no need to initialize
      }
      
      // Initialize with default rates
      const promises = defaultRates.map(rate => 
        setDoc(doc(db, SHIPPING_RATES_COLLECTION, rate.prefecture), {
          cost: rate.cost,
          estimatedDays: rate.estimatedDays,
          updated_at: new Date().toISOString()
        })
      );
      
      await Promise.all(promises);
      console.log('Default shipping rates initialized');
    } catch (err) {
      console.error('Error initializing default rates:', err);
      // Don't throw error, just log it
    }
  };

  const updateShippingRate = async (prefecture: string, cost: number, estimatedDays?: string) => {
    try {
      const rateRef = doc(db, SHIPPING_RATES_COLLECTION, prefecture);
      
      const updateData: any = {
        cost,
        updated_at: new Date().toISOString()
      };
      
      if (estimatedDays) {
        updateData.estimatedDays = estimatedDays;
      }
      
      await setDoc(rateRef, updateData, { merge: true });
      
      return true;
    } catch (err) {
      console.error('Error updating shipping rate:', err);
      toast({
        title: "Error",
        description: "Gagal memperbarui tarif ongkir",
        variant: "destructive"
      });
      return false;
    }
  };

  const updateAllShippingRates = async (newRates: ShippingRate[]) => {
    try {
      const promises = newRates.map(rate => 
        setDoc(doc(db, SHIPPING_RATES_COLLECTION, rate.prefecture), {
          cost: rate.cost,
          estimatedDays: rate.estimatedDays,
          updated_at: new Date().toISOString()
        }, { merge: true })
      );
      
      await Promise.all(promises);
      
      return true;
    } catch (err) {
      console.error('Error updating all shipping rates:', err);
      toast({
        title: "Error",
        description: "Gagal memperbarui semua tarif ongkir",
        variant: "destructive"
      });
      return false;
    }
  };

  const getShippingRate = useCallback((prefecture: string): ShippingRate | undefined => {
    // First try to find in fetched rates
    const fetchedRate = rates.find(rate => rate.prefecture === prefecture);
    if (fetchedRate) return fetchedRate;
    
    // If not found in fetched rates, try to find in default rates
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