import { useQuery } from '@tanstack/react-query';
import { DashboardStats, Product } from '@/types';
import { getAllProducts } from '@/services/productService';

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      try {
        // Fetch products to calculate stats
        const products = await getAllProducts();
        
        // Calculate critical stock products (stock <= 5)
        const criticalStockProducts = products
          .filter(product => product.stock <= 5 && product.stock > 0)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5);
        
        // Calculate low stock products (stock <= 10)
        const lowStockProducts = products
          .filter(product => product.stock <= 10 && product.stock > 0)
          .sort((a, b) => a.stock - b.stock)
          .slice(0, 5);
        
        // Get unique categories
        const uniqueCategories = new Set(products.map(product => product.category));
        
        return {
          totalProducts: products.length,
          activeProducts: products.filter(p => p.status === 'active').length,
          outOfStockProducts: products.filter(p => p.stock === 0).length,
          lowStockProducts,
          criticalStockProducts,
          totalCategories: uniqueCategories.size,
          totalOrders: 0, // This would come from orders data
          pendingOrders: 0, // This would come from orders data
          totalRevenue: 0 // This would come from orders data
        };
      } catch (error) {
        console.error('Error fetching admin stats:', error);
        // Return default stats on error
        return {
          totalProducts: 0,
          activeProducts: 0,
          outOfStockProducts: 0,
          lowStockProducts: [],
          criticalStockProducts: [],
          totalCategories: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0
        };
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });
};