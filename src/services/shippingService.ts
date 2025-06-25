import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';

// Get all shipping rates
export const getShippingRates = async (): Promise<ShippingRate[]> => {
  try {
    const ratesCollection = collection(db, 'shipping_rates');
    const snapshot = await getDocs(ratesCollection);
    
    if (!snapshot.empty) {
      const rates: ShippingRate[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data && data.prefecture && data.cost !== undefined) {
          rates.push({
            prefecture: data.prefecture,
            cost: data.cost,
            estimatedDays: data.estimatedDays || '3-5 hari'
          });
        }
      });
      
      if (rates.length > 0) {
        return rates;
      }
    }
    
    // If no rates in Firebase, return default rates
    return defaultRates;
  } catch (error) {
    console.error('Error fetching shipping rates:', error);
    // Return default rates if there's an error
    return defaultRates;
  }
};

// Get shipping rate for a specific prefecture
export const getShippingRateForPrefecture = async (prefecture: string): Promise<ShippingRate | null> => {
  try {
    if (!prefecture) return null;
    
    // Try to get from Firebase first
    const rateRef = doc(db, 'shipping_rates', prefecture);
    const rateDoc = await getDoc(rateRef);
    
    if (rateDoc.exists()) {
      const data = rateDoc.data();
      if (data && data.prefecture && data.cost !== undefined) {
        return {
          prefecture: data.prefecture,
          cost: data.cost,
          estimatedDays: data.estimatedDays || '3-5 hari'
        };
      }
    }
    
    // If not in Firebase, find in default rates
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate || null;
  } catch (error) {
    console.error('Error fetching shipping rate for prefecture:', error);
    
    // Return from default rates if there's an error
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate || null;
  }
};

// Update shipping rate for a prefecture
export const updateShippingRate = async (prefecture: string, cost: number, estimatedDays?: string): Promise<boolean> => {
  try {
    if (!prefecture) {
      console.error('Prefecture is required');
      return false;
    }
    
    // Get current rate first
    const currentRate = await getShippingRateForPrefecture(prefecture);
    
    // Create new rate object
    const newRate: ShippingRate = {
      prefecture,
      cost,
      estimatedDays: estimatedDays || (currentRate?.estimatedDays || '3-5 hari')
    };
    
    // Save to Firebase
    const rateRef = doc(db, 'shipping_rates', prefecture);
    await setDoc(rateRef, newRate);
    
    return true;
  } catch (error) {
    console.error('Error updating shipping rate:', error);
    return false;
  }
};

// Update multiple shipping rates at once
export const updateMultipleShippingRates = async (rates: ShippingRate[]): Promise<boolean> => {
  try {
    if (!rates || rates.length === 0) {
      console.error('No rates provided');
      return false;
    }
    
    // Use batch write for better performance
    for (const rate of rates) {
      if (rate && rate.prefecture) {
        const rateRef = doc(db, 'shipping_rates', rate.prefecture);
        await setDoc(rateRef, {
          prefecture: rate.prefecture,
          cost: rate.cost,
          estimatedDays: rate.estimatedDays || '3-5 hari'
        });
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error updating multiple shipping rates:', error);
    return false;
  }
};

// Export shipping rates to CSV
export const exportShippingRatesToCSV = (rates: ShippingRate[]): void => {
  try {
    // Prepare CSV content
    const headers = ['Prefecture', 'Cost', 'EstimatedDays'];
    const rows = rates.map(rate => [
      rate.prefecture,
      rate.cost.toString(),
      rate.estimatedDays || '3-5 hari'
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
  } catch (error) {
    console.error('Error exporting shipping rates to CSV:', error);
    throw error;
  }
};

// Import shipping rates from CSV data
export const importShippingRatesFromCSV = async (csvData: string): Promise<ShippingRate[]> => {
  try {
    const lines = csvData.split('\n');
    
    // Skip header row
    const dataRows = lines.slice(1).filter(line => line.trim());
    
    const importedRates: ShippingRate[] = [];
    
    for (const row of dataRows) {
      const columns = row.split(',');
      
      if (columns.length >= 3) {
        const prefecture = columns[0].trim();
        const cost = parseInt(columns[1].trim());
        const estimatedDays = columns[2].trim();
        
        if (prefecture && !isNaN(cost)) {
          importedRates.push({
            prefecture,
            cost,
            estimatedDays: estimatedDays || '3-5 hari'
          });
        }
      }
    }
    
    return importedRates;
  } catch (error) {
    console.error('Error importing shipping rates from CSV:', error);
    throw error;
  }
};