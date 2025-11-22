import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import { AuthComponent } from '../../components/ui/sign-up';

const Signup = () => {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    const { error } = await signInWithGoogle();
    if (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const handleSignUpSuccess = () => {
    navigate('/onboarding');
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
    />
  );
};

export default Signup;
