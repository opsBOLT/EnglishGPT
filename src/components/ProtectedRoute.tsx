import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
}

const ProtectedRoute = ({ children, requireOnboarding = true }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();

  console.log('[ProtectedRoute] Render:', {
    loading,
    hasUser: !!user,
    userId: user?.id,
    onboardingCompleted: user?.onboarding_completed,
    requireOnboarding,
    currentPath: window.location.pathname
  });

  if (loading) {
    console.log('[ProtectedRoute] Still loading, showing spinner');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    console.log('[ProtectedRoute] No user found, redirecting to /signup');
    return <Navigate to="/signup" />;
  }

  if (requireOnboarding && !user.onboarding_completed) {
    console.log('[ProtectedRoute] User found but onboarding not completed, redirecting to /onboarding');
    return <Navigate to="/onboarding" />;
  }

  console.log('[ProtectedRoute] Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
