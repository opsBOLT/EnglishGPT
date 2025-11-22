import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { AuthComponent } from '../../components/ui/sign-up';
import { useEffect, useRef } from 'react';

const Signup = () => {
  const { signInWithGoogle, signUp, user, session, loading } = useAuth();
  const navigate = useNavigate();
  const isSigningUp = useRef(false);

  console.log('[Signup] Component state:', {
    hasUser: !!user,
    userId: user?.id,
    hasSession: !!session,
    loading,
    isSigningUp: isSigningUp.current
  });

  useEffect(() => {
    console.log('[Signup] useEffect triggered', {
      hasUser: !!user,
      userId: user?.id,
      isSigningUp: isSigningUp.current
    });

    if (user && isSigningUp.current) {
      console.log('[Signup] Navigating to onboarding with user:', user.id);
      navigate('/onboarding');
      isSigningUp.current = false;
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    console.log('[Signup] Google sign-in initiated');
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('[Signup] Google sign-in error:', error);
    }
  };

  const handleSignUpSuccess = () => {
    console.log('[Signup] handleSignUpSuccess called - setting isSigningUp flag');
    isSigningUp.current = true;
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    console.log('[Signup] Email signup initiated for:', email);
    const { error } = await signUp(email, password);
    console.log('[Signup] Email signup completed', { hasError: !!error, error });
    return { error };
  };

  const logo = (
    <div className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white rounded-md p-1.5">
      <BookOpen className="h-4 w-4" />
    </div>
  );

  return (
    <AuthComponent
      logo={logo}
      brandName="StudyPal"
      onSignUpSuccess={handleSignUpSuccess}
      onGoogleSignIn={handleGoogleSignIn}
      onEmailSignUp={handleEmailSignUp}
    />
  );
};

export default Signup;
