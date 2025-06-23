import { useOrders } from '@/hooks/useOrders';
import { useAuth } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import InvoiceModal from '@/components/InvoiceModal';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Calendar, Package, FileText } from 'lucide-react';
import { Order } from '@/types';
import { Navigate } from 'react-router-dom';
import { useState } from 'react';

const Orders = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: orders, isLoading, error } = useOrders();
  const [showInvoice, setShowInvoice] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Redirect to auth if not logged in
  if (!authLoading && !user) {
    return <Navigate to="/auth" replace />;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const handleShowInvoice = (order: Order) => {
    setSelectedOrder(order);
    setShowInvoice(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY'
    }).format(price);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending':
        return 'secondary';
      case 'processing':
        return 'default';
      case 'completed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Menunggu';
      case 'processing':
        return 'Diproses';
      case 'completed':
        return 'Selesai';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center space-x-3 mb-8">
            <ShoppingBag className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Pesanan Saya</h1>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Terjadi kesalahan saat memuat pesanan.</p>
              </CardContent>
            </Card>
          ) : !orders || orders.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Belum Ada Pesanan
                </h3>
                <p className="text-gray-600 mb-6">
                  Anda belum memiliki pesanan. Mulai berbelanja sekarang!
                </p>
                <a
                  href="/products"
                  className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  Mulai Belanja
                </a>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {orders.map((order: Order) => (
                <Card key={order.id} className="shadow-sm">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Pesanan #{order.id.slice(-8).toUpperCase()}
                        </CardTitle>
                        <CardDescription className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(order.created_at)}
                        </CardDescription>
                      </div>
                      <div className="text-right space-y-2">
                        <Badge variant={getStatusBadgeVariant(order.status || 'pending')}>
                          {getStatusText(order.status || 'pending')}
                        </Badge>
                        <div className="text-lg font-bold text-primary">
                          {formatPrice(order.total_price)}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Order Items */}
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">Item Pesanan:</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                              <div>
                                <p className="font-medium">{item.name}</p>
                                <p className="text-sm text-gray-600">
                                  {item.quantity} x {formatPrice(item.price)}
                                </p>
                                {item.selectedVariants && Object.keys(item.selectedVariants).length > 0 && (
                                  <p className="text-xs text-gray-500">
                                    Varian: {Object.entries(item.selectedVariants).map(([type, value]) => `${type}: ${value}`).join(', ')}
                                  </p>
                                )}
                              </div>
                              <p className="font-medium">
                                {formatPrice(item.quantity * item.price)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Customer Info */}
                      <div className="grid md:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Informasi Penerima:</h4>
                          <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Nama:</span> {order.customer_info.name}</p>
                            <p><span className="font-medium">Email:</span> {order.customer_info.email}</p>
                            <p><span className="font-medium">Phone:</span> {order.customer_info.phone}</p>
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">Alamat Pengiriman:</h4>
                          <div className="text-sm text-gray-600">
                            <p>{order.customer_info.address}</p>
                            <p>{order.customer_info.prefecture}</p>
                            <p>{order.customer_info.postal_code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Invoice Button */}
                      <div className="pt-4 border-t border-gray-200">
                        <Button 
                          onClick={() => handleShowInvoice(order)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          Lihat Invoice
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && selectedOrder && (
        <InvoiceModal
          isOpen={showInvoice}
          onClose={() => {
            setShowInvoice(false);
            setSelectedOrder(null);
          }}
          order={selectedOrder}
        />
      )}

      <Footer />
    </div>
  );
};

export default Orders;