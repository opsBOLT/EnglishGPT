import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Signup from './pages/Auth/Signup';
import Onboarding from './pages/Onboarding/Onboarding';
import OnboardingResult from './pages/Onboarding/OnboardingResult';
import Dashboard from './pages/Dashboard/dashboard';
import StudyPlanGeneration from './pages/StudyPlanGeneration';
import Study from './pages/Study/Study';
import StudySession from './pages/StudySession';
import Practice from './pages/Practice/Practice';
import PracticeSession from './pages/PracticeSession';
import Calendar from './pages/Calendar/Calendar';
import Analytics from './pages/Analytics/Analytics';
import AILogs from './pages/AILogs';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function App() {
  return (
    <AuthProvider>
      <Router>
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

          {/* New study session route with category parameter */}
          <Route
            path="/study/session/:category"
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

export default App;
