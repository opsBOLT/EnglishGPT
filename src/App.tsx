import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { lazy, Suspense, useEffect } from 'react';
import SnowballSpinner from './components/SnowballSpinner';
import { useNavigate } from 'react-router-dom';

const Landing = lazy(() => import('./pages/Landing/Landing'));
const Signup = lazy(() => import('./pages/Auth/Signup'));
const Onboarding = lazy(() => import('./pages/Onboarding/Onboarding'));
const OnboardingResult = lazy(() => import('./pages/Onboarding/OnboardingResult'));
const Dashboard = lazy(() => import('./pages/Dashboard/dashboard'));
const StudyPlanGeneration = lazy(() => import('./pages/StudyPlanGeneration'));
const Study = lazy(() => import('./pages/Study/Study'));
const StudySession = lazy(() => import('./pages/StudySession'));
const Practice = lazy(() => import('./pages/Practice/Practice'));
const PracticeSession = lazy(() => import('./pages/PracticeSession').then((module) => ({
  default: module.PracticeSession,
})));
const Calendar = lazy(() => import('./pages/Calendar/Calendar'));
const Analytics = lazy(() => import('./pages/Analytics/Analytics'));
const AILogs = lazy(() => import('./pages/AILogs'));

function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<AppLoader />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/signup" element={<Signup />} />

            <Route
              path="/onboarding"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <OnboardingRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding/:userId"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <Onboarding />
                </ProtectedRoute>
              }
            />

            <Route
              path="/onboarding/:userId/result"
              element={
                <ProtectedRoute requireOnboarding={false}>
                  <OnboardingResult />
                </ProtectedRoute>
              }
            />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/study"
              element={
                <ProtectedRoute>
                  <Study />
                </ProtectedRoute>
              }
            />

            {/* Study session route with sessionId parameter */}
            <Route
              path="/study/session/:sessionId"
              element={
                <ProtectedRoute>
                  <StudySessionWithAuth />
                </ProtectedRoute>
              }
            />

            <Route
              path="/practice"
              element={
                <ProtectedRoute>
                  <Practice />
                </ProtectedRoute>
              }
            />

            {/* New practice session route */}
            <Route
              path="/practice/session/:sessionId"
              element={
                <ProtectedRoute>
                  <PracticeSessionWithAuth />
                </ProtectedRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <ProtectedRoute>
                  <Calendar />
                </ProtectedRoute>
              }
            />

            <Route
              path="/analytics"
              element={
                <ProtectedRoute>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            <Route
              path="/ai-logs"
              element={
                <ProtectedRoute>
                  <AILogs />
                </ProtectedRoute>
              }
            />

            <Route
              path="/study-plan/generate"
              element={
                <ProtectedRoute>
                  <StudyPlanGeneration />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

// Wrapper components to pass auth user to pages
function StudySessionWithAuth() {
  const { user } = useAuth();
  return <StudySession userId={user?.id || ''} />;
}

function PracticeSessionWithAuth() {
  const { user } = useAuth();
  return <PracticeSession userId={user?.id || ''} />;
}

function OnboardingRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      navigate(`/onboarding/${user.id}`, { replace: true });
    }
  }, [user?.id, navigate]);

  return null;
}

const AppLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <SnowballSpinner size="md" label="Loading your workspace..." />
  </div>
);

export default App;
