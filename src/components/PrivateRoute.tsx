import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, requireAdmin = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  // Strict routing for admin and student areas
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" />;
  }

  return <>{children}</>;
};

export default PrivateRoute;