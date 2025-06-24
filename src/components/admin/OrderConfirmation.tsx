import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Order } from '@/types';
import { useOrderOperations } from '@/hooks/useOrderOperations';
import { CheckCircle, XCircle, Clock, User, Mail, Phone, MapPin, Package, FileText, Truck } from 'lucide-react';
import InvoiceModal from '@/components/InvoiceModal';
import { formatPrice } from '@/utils/cart';

interface OrderConfirmationProps {
  order: Order;
}

const OrderConfirmation = ({ order }: OrderConfirmationProps) => {
  const { confirmOrder, cancelOrder, isLoading } = useOrderOperations();
  const [showInvoice, setShowInvoice] = useState(false);

  const handleConfirm = () => {
    confirmOrder(order.id);
  };

  const handleCancel = () => {
    cancelOrder(order.id);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' },
      confirmed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      cancelled: { variant: 'destructive' as const, icon: XCircle, color: 'text-red-600' },
      processing: { variant: 'secondary' as const, icon: Package, color: 'text-blue-600' },
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Extract shipping information
  const shippingCost = order.customer_info?.shippingCost || 0;
  const shippingDetails = order.customer_info?.shippingDetails;
  const subtotal = order.total_price - shippingCost;

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Order #{order.id.slice(0, 8)}
            </CardTitle>
            {getStatusBadge(order.status)}
          </div>
          <p className="text-sm text-gray-600">
            Dibuat: {new Date(order.created_at).toLocaleDateString('id-ID', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Customer Information */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Informasi Customer
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center">
                <User className="w-4 h-4 mr-2 text-gray-500" />
                <span>{order.customer_info.name}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-500" />
                <span>{order.customer_info.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 mr-2 text-gray-500" />
                <span>{order.customer_info.phone}</span>
              </div>
              <div className="flex items-start">
                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-500 flex-shrink-0" />
                <span className="break-words">{order.customer_info.address}</span>
              </div>
            </div>
            {order.customer_info.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Catatan:</p>
                <p className="text-sm text-gray-600">{order.customer_info.notes}</p>
              </div>
            )}
          </div>

          <Separator />

          {/* Order Items */}
          <div>
            <h4 className="font-semibold mb-3 flex items-center">
              <Package className="w-4 h-4 mr-2" />
              Item Pesanan
            </h4>
            <div className="space-y-3">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                  <img
                    src={item.image_url || '/placeholder.svg'}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-xs text-gray-600">
                      {item.quantity}x - ¥{item.price.toLocaleString()}
                    </p>
                    {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                      <p className="text-xs text-gray-500">
                        {Object.entries(item.selectedVariants).map(([type, value]) => `${type}: ${value}`).join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">
                      ¥{(item.price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Shipping Information */}
          {shippingDetails && (
            <div>
              <h4 className="font-semibold mb-3 flex items-center">
                <Truck className="w-4 h-4 mr-2" />
                Informasi Pengiriman
              </h4>
              <div className="p-3 bg-blue-50 rounded-md">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium text-blue-800">Tujuan:</span>
                    <span className="ml-2 text-blue-700">{order.customer_info.prefecture}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Estimasi:</span>
                    <span className="ml-2 text-blue-700">{shippingDetails.estimatedDays}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-800">Ongkir:</span>
                    <span className="ml-2 text-blue-700">
                      {shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Order Total */}
          <div className="bg-primary/5 p-4 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium">Subtotal Produk:</span>
              <span className="font-semibold">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Ongkir:</span>
              <span className={`font-semibold ${shippingCost === 0 ? 'text-green-600' : ''}`}>
                {shippingCost === 0 ? 'GRATIS' : formatPrice(shippingCost)}
              </span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">Total Pesanan:</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(order.total_price)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            {order.status === 'pending' && (
              <>
                <Button
                  onClick={handleConfirm}
                  disabled={isLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Konfirmasi Pesanan'}
                </Button>
                <Button
                  onClick={handleCancel}
                  disabled={isLoading}
                  variant="destructive"
                  className="flex-1"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  {isLoading ? 'Processing...' : 'Batalkan Pesanan'}
                </Button>
              </>
            )}
            
            <Button
              onClick={() => setShowInvoice(true)}
              variant="outline"
              className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
            >
              <FileText className="w-4 h-4 mr-2" />
              Lihat Invoice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoice Modal */}
      {showInvoice && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          order={order}
        />
      )}
    </>
  );
};

export default OrderConfirmation;