import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAllOrders, getOrdersByUser, createOrder } from '@/services/orderService';
import { Order, CartItem } from '@/types';

export const useOrders = () => {
  return useQuery({
    queryKey: ['orders'],
    queryFn: getAllOrders,
    staleTime: 0, // Always consider data stale for real-time updates
    refetchInterval: 2000, // Refetch every 2 seconds
    refetchIntervalInBackground: true, // Continue refetching when tab is not active
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });
};

export const useUserOrders = (userId: string) => {
  return useQuery({
    queryKey: ['orders', 'user', userId],
    queryFn: () => getOrdersByUser(userId),
    enabled: !!userId,
    staleTime: 0,
    refetchInterval: 10000, // Refetch every 10 seconds for user orders (less frequent)
    refetchIntervalInBackground: false, // Don't refetch in background for user orders
    retry: 3, // Retry failed requests
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });
};

export const useCreateOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      items,
      totalPrice,
      subtotal,
      shippingCost,
      customerInfo,
      userId
    }: {
      items: CartItem[];
      totalPrice: number;
      subtotal?: number;
      shippingCost?: number;
      customerInfo: any;
      userId?: string;
    }) => {
      return await createOrder({
        user_id: userId,
        customer_info: customerInfo,
        items: items,
        total_price: totalPrice,
        subtotal: subtotal || totalPrice,
        shippingCost: shippingCost || 0,
        status: 'pending'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-orders'] });
    },
  });
};