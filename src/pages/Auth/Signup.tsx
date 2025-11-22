import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { AuthComponent } from '../../components/ui/sign-up';
import { useEffect, useRef } from 'react';

const Signup = () => {
  const { signInWithGoogle, signUp, user } = useAuth();
  const navigate = useNavigate();
  const isSigningUp = useRef(false);

  useEffect(() => {
    if (user && isSigningUp.current) {
      navigate('/onboarding');
      isSigningUp.current = false;
    }
  }, [user, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleSignUpSuccess = () => {
    isSigningUp.current = true;
  };

  const handleEmailSignUp = async (email: string, password: string) => {
    const { error } = await signUp(email, password);
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
