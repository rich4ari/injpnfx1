// Dummy service file to avoid errors
import { ShippingRate, shippingRates as defaultRates } from '@/utils/shippingCost';

// Get all shipping rates
export const getShippingRates = async (): Promise<ShippingRate[]> => {
  // Return default rates
  return defaultRates;
};

// Get shipping rate for a specific prefecture
export const getShippingRateForPrefecture = async (prefecture: string): Promise<ShippingRate | null> => {
  try {
    if (!prefecture) return null;
    
    // Find in default rates
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate || null;
  } catch (error) {
    console.error('Error fetching shipping rate for prefecture:', error);
    
    // Return from default rates if there's an error
    const defaultRate = defaultRates.find(r => r.prefecture === prefecture);
    return defaultRate || null;
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
  } catch (error) {
    console.error('Error exporting shipping rates to CSV:', error);
    throw error;
  }
};