import { collection, getDocs, doc, setDoc, updateDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';

const SHIPPING_RATES_COLLECTION = 'shipping_rates';

// Get all shipping rates
export const getShippingRates = async (): Promise<ShippingRate[]> => {
  try {
    const ratesRef = collection(db, SHIPPING_RATES_COLLECTION);
    const snapshot = await getDocs(ratesRef);
    
    if (snapshot.empty) {
      // If no rates exist in the database, initialize with default rates
      await initializeDefaultRates();
      return defaultRates;
    }
    
    return snapshot.docs.map(doc => ({
      prefecture: doc.id,
      cost: doc.data().cost,
      estimatedDays: doc.data().estimatedDays
    }));
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    // Return default rates if there's an error
    return defaultRates;
  }
};

// Initialize default shipping rates in the database
export const initializeDefaultRates = async (): Promise<void> => {
  try {
    const batch = db.batch();
    
    for (const rate of defaultRates) {
      const rateRef = doc(db, SHIPPING_RATES_COLLECTION, rate.prefecture);
      batch.set(rateRef, {
        cost: rate.cost,
        estimatedDays: rate.estimatedDays,
        updated_at: new Date().toISOString()
      });
    }
    
    await batch.commit();
    console.log('Default shipping rates initialized');
  } catch (error) {
    console.error('Error initializing default shipping rates:', error);
    throw error;
  }
};

// Update a single shipping rate
export const updateShippingRate = async (prefecture: string, cost: number, estimatedDays?: string): Promise<void> => {
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
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    throw error;
  }
};

// Update all shipping rates at once
export const updateAllShippingRates = async (rates: ShippingRate[]): Promise<void> => {
  try {
    const batch = db.batch();
    
    for (const rate of rates) {
      const rateRef = doc(db, SHIPPING_RATES_COLLECTION, rate.prefecture);
      batch.set(rateRef, {
        cost: rate.cost,
        estimatedDays: rate.estimatedDays,
        updated_at: new Date().toISOString()
      }, { merge: true });
    }
    
    await batch.commit();
  } catch (error) {
    console.error('Error updating all shipping rates:', error);
    throw error;
  }
};

// Export shipping rates to CSV
export const exportShippingRatesToCSV = (rates: ShippingRate[]): void => {
  // Prepare CSV content
  const headers = ['Prefecture', 'Cost', 'EstimatedDays'];
  const rows = rates.map(rate => [
    rate.prefecture,
    rate.cost.toString(),
    rate.estimatedDays
  ]);
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  // Create and download CSV file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `shipping-rates-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Import shipping rates from CSV
export const importShippingRatesFromCSV = async (file: File): Promise<ShippingRate[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csvText = event.target?.result as string;
        const lines = csvText.split('\n');
        
        // Skip header row
        const dataRows = lines.slice(1).filter(line => line.trim());
        
        const importedRates: ShippingRate[] = [];
        
        for (const row of dataRows) {
          const columns = row.split(',');
          
          if (columns.length >= 2) {
            const prefecture = columns[0].trim();
            const cost = parseInt(columns[1].trim());
            const estimatedDays = columns.length >= 3 ? columns[2].trim() : '3-5 hari';
            
            if (prefecture && !isNaN(cost)) {
              importedRates.push({
                prefecture,
                cost,
                estimatedDays
              });
            }
          }
        }
        
        resolve(importedRates);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
};

// Get shipping rate for a specific prefecture
export const getShippingRateForPrefecture = async (prefecture: string): Promise<ShippingRate | null> => {
  try {
    const rateRef = doc(db, SHIPPING_RATES_COLLECTION, prefecture);
    const rateDoc = await rateRef.get();
    
    if (rateDoc.exists()) {
      return {
        prefecture,
        cost: rateDoc.data().cost,
        estimatedDays: rateDoc.data().estimatedDays
      };
    }
    
    // If not found in database, find in default rates
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate || null;
  } catch (error) {
    console.error('Error fetching shipping rate for prefecture:', error);
    
    // Return from default rates if there's an error
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate || null;
  }
};