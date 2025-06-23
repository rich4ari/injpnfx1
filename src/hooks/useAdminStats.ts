
import { useQuery } from '@tanstack/react-query';
import { DashboardStats, Product } from '@/types';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Mock stats data
      return {
        totalProducts: 12,
        activeProducts: 10,
        outOfStockProducts: 2,
        lowStockProducts: [],
        totalOrders: 0,
        criticalStockProducts: [],
        totalCategories: 5,
        pendingOrders: 0,
        totalRevenue: 0
      };
    },
  });
};
