import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Truck, Receipt } from 'lucide-react';
import { CartItem } from '@/types';
import { formatPrice } from '@/utils/cart';
import { ShippingRate } from '@/utils/shippingCost';

interface CheckoutSummaryProps {
  cart: CartItem[];
  subtotal: number;
  shippingCost: number;
  shippingDetails: ShippingRate | null;
  total: number;
  className?: string;
}

// Use memo to prevent unnecessary re-renders
const CheckoutSummary = memo(({
  cart,
  subtotal,
  shippingCost,
  shippingDetails,
  total,
  className = ""
}: CheckoutSummaryProps) => {
  const itemCount = cart.reduce((count, item) => count + item.quantity, 0);
  const isFreeShipping = shippingCost === 0 && shippingDetails?.prefecture;

  return (
    <Card className={`shadow-lg border-gray-200 ${className}`}>
      <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
        <CardTitle className="flex items-center space-x-2">
          <Receipt className="w-5 h-5" />
          <span>Ringkasan Pesanan</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-4">
        {/* Item Summary */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Subtotal ({itemCount} item)</span>
          </div>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>

        {/* Shipping Cost */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span className="text-gray-700">Ongkir</span>
            {shippingDetails?.prefecture && (
              <span className="text-xs text-gray-500">
                ke {shippingDetails.prefecture}
              </span>
            )}
          </div>
          <div className="text-right">
            {isFreeShipping ? (
              <div className="flex items-center space-x-2">
                <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                  GRATIS
                </Badge>
                <span className="text-xs text-gray-400 line-through">
                  {formatPrice(shippingDetails?.cost || 0)}
                </span>
              </div>
            ) : shippingCost > 0 ? (
              <span className="font-semibold">{formatPrice(shippingCost)}</span>
            ) : (
              <span className="text-gray-400 text-sm">Belum dihitung</span>
            )}
          </div>
        </div>

        {/* Shipping Estimate */}
        {shippingDetails?.estimatedDays && (
          <div className="text-xs text-gray-600 ml-6">
            Estimasi pengiriman: {shippingDetails.estimatedDays}
          </div>
        )}

        <Separator className="my-4" />

        {/* Total */}
        <div className="flex items-center justify-between bg-primary/5 p-4 rounded-lg">
          <span className="text-lg font-bold text-gray-900">Total Belanja</span>
          <span className="text-2xl font-bold text-primary">
            {formatPrice(total)}
          </span>
        </div>

        {/* Breakdown for transparency */}
        <div className="text-xs text-gray-500 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal produk:</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span>Biaya pengiriman:</span>
            <span>{isFreeShipping ? 'Gratis' : formatPrice(shippingCost)}</span>
          </div>
          <div className="flex justify-between font-medium text-gray-700 pt-1 border-t">
            <span>Total yang harus dibayar:</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        {/* Savings indicator */}
        {isFreeShipping && shippingDetails && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-green-800 text-sm font-medium">
              🎉 Anda hemat {formatPrice(shippingDetails.cost)} dari ongkir!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

CheckoutSummary.displayName = 'CheckoutSummary';

export default CheckoutSummary;