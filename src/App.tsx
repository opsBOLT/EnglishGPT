import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing/Landing';
import Signup from './pages/Auth/Signup';
import Onboarding from './pages/Onboarding/Onboarding';
import Dashboard from './pages/Dashboard/Dashboard';
import Study from './pages/Study/Study';
import StudySession from './pages/StudySession';
import Practice from './pages/Practice/Practice';
import PracticeSession from './pages/PracticeSession';
import Calendar from './pages/Calendar/Calendar';
import Analytics from './pages/Analytics/Analytics';

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
                <OnboardingWithAuth />
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
        </Routes>
      </Router>
    </AuthProvider>
  );
}

// Wrapper components to pass auth user to pages
function OnboardingWithAuth() {
  const { user } = useAuth();
  return <Onboarding userId={user?.id || ''} />;
}

function StudySessionWithAuth() {
  const { user } = useAuth();
  return <StudySession userId={user?.id || ''} />;
}

function PracticeSessionWithAuth() {
  const { user } = useAuth();
  return <PracticeSession userId={user?.id || ''} />;
}

export default App;
