import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SnowballSpinner from './SnowballSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ children, requireOnboarding = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <SnowballSpinner size="md" label="Loading your workspace..." />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signup" />;
  }

  if (requireOnboarding && !user.onboarding_completed) {
    return <Navigate to={`/onboarding/${user.id}`} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
