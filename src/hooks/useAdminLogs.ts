import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminLog } from '@/types';
import { collection, getDocs, addDoc, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';

export const useAdminLogs = () => {
  return useQuery({
    queryKey: ['admin-logs'],
    queryFn: async (): Promise<AdminLog[]> => {
      try {
        // Fetch logs from Firestore with limit and order
        const logsRef = collection(db, 'admin_logs');
        const q = query(logsRef, orderBy('created_at', 'desc'), limit(20));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          return [];
        }
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AdminLog));
      } catch (error) {
        console.error('Error fetching admin logs:', error);
        return [];
      }
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false, // Prevent refetch on window focus
  });
};

export const useLogAdminAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logData: {
      action: string;
      target_type: string;
      target_id?: string;
      details?: any;
    }) => {
      try {
        const logsRef = collection(db, 'admin_logs');
        const docRef = await addDoc(logsRef, {
          ...logData,
          user_id: 'system', // Default user ID
          created_at: new Date().toISOString()
        });
        return docRef.id;
      } catch (error) {
        console.error('Error logging admin action:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-logs'] });
    },
  });
};