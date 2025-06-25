import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Truck, Clock, Gift } from 'lucide-react';
import { formatShippingCost, isFreeShipping, ShippingRate, calculateShippingCost } from '@/utils/shippingCost';
import { getShippingRateForPrefecture } from '@/services/shippingService';

interface ShippingCalculatorProps {
  prefecture: string;
  subtotal: number;
  onShippingCostChange: (cost: number, details: ShippingRate) => void;
  className?: string;
}

const ShippingCalculator = ({ 
  prefecture, 
  subtotal, 
  onShippingCostChange, 
  className = "" 
}: ShippingCalculatorProps) => {
  const [shippingDetails, setShippingDetails] = useState<ShippingRate | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!prefecture) {
      setShippingDetails(null);
      onShippingCostChange(0, { prefecture: '', cost: 0, estimatedDays: '' });
      return;
    }

    setIsCalculating(true);
    setError(null);
    
    const getShippingRate = async () => {
      try {
        console.log(`Calculating shipping for prefecture: ${prefecture}, subtotal: ${subtotal}`);
        
        // First try to get from Firebase
        const firestoreRate = await getShippingRateForPrefecture(prefecture);
        
        if (firestoreRate) {
          console.log(`Found shipping rate in Firestore for ${prefecture}:`, firestoreRate);
          const freeShipping = isFreeShipping(subtotal, prefecture);
          
          const finalDetails = {
            ...firestoreRate,
            cost: freeShipping ? 0 : firestoreRate.cost
          };
          
          setShippingDetails(finalDetails);
          onShippingCostChange(finalDetails.cost, finalDetails);
          return;
        }
        
        // If not in Firestore, use the utility function with default rates
        console.log(`No Firestore rate found for ${prefecture}, using default rates`);
        const rateDetails = await calculateShippingCost(prefecture, subtotal);
        
        if (rateDetails) {
          setShippingDetails(rateDetails);
          onShippingCostChange(rateDetails.cost, rateDetails);
        } else {
          // Fallback rate if prefecture not found
          const fallbackRate = {
            prefecture: prefecture,
            cost: 800,
            estimatedDays: '3-5 hari'
          };
          console.log(`No default rate found for ${prefecture}, using fallback:`, fallbackRate);
          setShippingDetails(fallbackRate);
          onShippingCostChange(fallbackRate.cost, fallbackRate);
        }
      } catch (error) {
        console.error('Error calculating shipping:', error);
        setError('Gagal menghitung ongkir. Silakan coba lagi.');
        
        // Use fallback rate instead of showing error
        const fallbackRate = {
          prefecture: prefecture,
          cost: 800,
          estimatedDays: '3-5 hari'
        };
        setShippingDetails(fallbackRate);
        onShippingCostChange(fallbackRate.cost, fallbackRate);
      } finally {
        setIsCalculating(false);
      }
    };

    getShippingRate();
  }, [prefecture, subtotal, onShippingCostChange]);

  if (!prefecture) {
    return (
      <Card className={`border-dashed border-gray-300 ${className}`}>
        <CardContent className="py-6 text-center">
          <Truck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            Pilih prefektur untuk melihat ongkir
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isCalculating) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Menghitung ongkir...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardContent className="py-6 text-center">
          <p className="text-yellow-600 text-sm">
            {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!shippingDetails) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardContent className="py-6 text-center">
          <p className="text-yellow-600 text-sm">
            Tidak dapat menghitung ongkir untuk prefektur ini
          </p>
        </CardContent>
      </Card>
    );
  }

  const isFree = shippingDetails.cost === 0;

  return (
    <Card className={`border-blue-200 bg-blue-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center space-x-2">
          <Truck className="w-5 h-5 text-blue-600" />
          <span>Informasi Pengiriman</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Tujuan:</span>
          <span className="font-medium">{prefecture}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700">Ongkir:</span>
          <div className="text-right">
            {isFree ? (
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  <Gift className="w-3 h-3 mr-1" />
                  GRATIS
                </Badge>
                <span className="text-xs text-gray-500 line-through">
                  {formatShippingCost(shippingDetails.cost)}
                </span>
              </div>
            ) : (
              <span className="font-bold text-lg text-blue-600">
                {formatShippingCost(shippingDetails.cost)}
              </span>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Estimasi:
          </span>
          <span className="text-sm font-medium">{shippingDetails.estimatedDays}</span>
        </div>

        {/* Promo info */}
        {!isFree && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              💡 <strong>Tips:</strong> Gratis ongkir untuk belanja ≥ ¥15,000 ke seluruh Jepang
              {['東京都', '神奈川県', '埼玉県', '千葉県'].includes(prefecture) && 
                ' atau ≥ ¥10,000 untuk area Kanto'
              }
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippingCalculator;