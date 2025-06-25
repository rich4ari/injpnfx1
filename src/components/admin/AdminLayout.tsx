import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useFirebaseAuth';
import { useEffect, useState, memo } from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Use memo to prevent unnecessary re-renders of the layout
const AdminLayout = memo(({ children }: AdminLayoutProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = () => {
      if (user) {
        // Enhanced admin emails list with more flexibility
        const adminEmails = [
          'admin@gmail.com', 
          'ari4rich@gmail.com'
        ];
        
        const userIsAdmin = adminEmails.includes(user.email || '');
        setIsAdmin(userIsAdmin);
      } else {
        setIsAdmin(false);
      }
      setLoading(false);
    };

    if (!authLoading) {
      checkAdminStatus();
    }
  }, [user, authLoading]);

  // Add more detailed loading state
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
          <p className="text-sm text-gray-400 mt-2">
            {authLoading ? 'Checking authentication...' : 'Verifying admin access...'}
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">
            You don't have admin privileges to access this page.
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Current user: {user.email}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
});

AdminLayout.displayName = 'AdminLayout';

export default AdminLayout;