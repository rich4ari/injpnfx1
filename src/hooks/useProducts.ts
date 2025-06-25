import { useQuery } from '@tanstack/react-query';
import { getAllProducts, getProduct } from '@/services/productService';

export const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: getAllProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
    refetchInterval: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProduct = (id: string) => {
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!id,
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });
};