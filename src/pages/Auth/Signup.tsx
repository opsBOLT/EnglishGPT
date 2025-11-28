import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { AuthComponent } from '../../components/ui/sign-up';
import { useEffect, useState } from 'react';

const Signup = () => {
  const { signInWithGoogle, signUp, user } = useAuth();
  const navigate = useNavigate();
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    if (user && isSigningUp) {
      navigate(`/onboarding/${user.id}`);
      setIsSigningUp(false);
    }
  }, [user, isSigningUp, navigate]);

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) return;
  };

  const handleSignUpSuccess = () => {
    setIsSigningUp(true);
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
