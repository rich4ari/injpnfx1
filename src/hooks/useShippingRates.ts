import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';
import { toast } from '@/hooks/use-toast';

const SHIPPING_RATES_COLLECTION = 'shipping_rates';

export const useShippingRates = () => {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    
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

  const getShippingRate = (prefecture: string): ShippingRate | undefined => {
    return rates.find(rate => rate.prefecture === prefecture);
  };

  return {
    rates,
    loading,
    error,
    updateShippingRate,
    updateAllShippingRates,
    getShippingRate
  };
};