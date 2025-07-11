import React, { useState } from 'react';
import { X, Mail, Lock, LogIn, User, Phone, MapPin, Book, School, Award, UserPlus, ChevronDown, Eye, EyeOff, AlertCircle, CheckCircle, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface LoginOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  forceEmailVerification?: boolean;
}

const LoginOverlay: React.FC<LoginOverlayProps> = ({ isOpen, onClose, forceEmailVerification = false }) => {
  const { login, signup, signInWithGoogle, sendVerificationEmail, resetPassword, checkEmailVerified, currentUser } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [emailVerificationSent, setEmailVerificationSent] = useState(false);
  const [isCheckingVerification, setIsCheckingVerification] = useState(false);
  
  const [loginData, setLoginData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });

  const [signupData, setSignupData] = useState({
    fullName: '',
    phoneNumber: '',
    province: '',
    district: '',
    currentStandard: '',
    college: '',
    email: '',
    password: '',
    confirmPassword: '',
    examType: '',
    customExam: ''
  });

  const provinces = [
    'Province 1',
    'Madhesh',
    'Bagmati',
    'Gandaki',
    'Lumbini',
    'Karnali',
    'Sudurpashchim'
  ];

  const standards = [
    '11',
    '12',
    'Pass out'
  ];

  const examTypes = [
    'IOE',
    'CEE',
    'Other',
    'None'
  ];

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setLoginData({
      ...loginData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSignupChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSignupData({
      ...signupData,
      [name]: value,
    });
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(loginData.email, loginData.password);
      
      // If we get here, the login was successful and email is verified (or it's not required)
      toast.success('Successfully logged in!');
      onClose();
      
    } catch (error: any) {
      let errorMessage = 'Failed to log in. Please check your credentials.';
      
      if (error.message === 'EMAIL_NOT_VERIFIED') {
        // Show verification UI instead of closing
        toast.error('Please verify your email before continuing');
        setEmailVerificationSent(true); // This will trigger the verification UI
        return;
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.';
      }
      toast.error(errorMessage);
      console.error('Login error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (signupData.password !== signupData.confirmPassword) {
      toast.error('Passwords do not match!');
      setIsLoading(false);
      return;
    }

    try {
      const userData = {
        fullName: signupData.fullName,
        displayName: signupData.fullName, // Set displayName same as fullName
        phoneNumber: signupData.phoneNumber,
        province: signupData.province,
        district: signupData.district,
        currentStandard: signupData.currentStandard,
        college: signupData.college,
        examType: signupData.examType === 'Other' ? signupData.customExam : signupData.examType
      };

      await signup(signupData.email, signupData.password, userData);
      toast.success('Account created successfully! Please check your email for verification.');
      setEmailVerificationSent(true);
      // Don't close the overlay, show verification UI instead
    } catch (error: any) {
      let errorMessage = 'Failed to create account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      }
      toast.error(errorMessage);
      console.error('Signup error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast.success('Successfully logged in with Google!');
      onClose();
    } catch (error) {
      toast.error('Failed to log in with Google.');
      console.error('Google sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowForgotPassword(false);
    setEmailVerificationSent(false);
    setForgotPasswordEmail('');
    // Reset login data when switching modes
    setLoginData({
      email: '',
      password: '',
      rememberMe: false
    });
    // Reset signup data when switching modes
    setSignupData({
      fullName: '',
      phoneNumber: '',
      province: '',
      district: '',
      currentStandard: '',
      college: '',
      email: '',
      password: '',
      confirmPassword: '',
      examType: '',
      customExam: ''
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await resetPassword(forgotPasswordEmail);
      toast.success('Password reset email sent! Please check your inbox.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      let errorMessage = 'Failed to send password reset email.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }
      toast.error(errorMessage);
      console.error('Forgot password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendVerificationEmail = async () => {
    setIsLoading(true);
    try {
      await sendVerificationEmail();
      toast.success('Verification email sent! Please check your inbox.');
      setEmailVerificationSent(true);
    } catch (error: any) {
      toast.error('Failed to send verification email. Please try again.');
      console.error('Send verification error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckEmailVerification = async () => {
    setIsCheckingVerification(true);
    try {
      const isVerified = await checkEmailVerified();
      if (isVerified) {
        toast.success('Email verified successfully!');
        setEmailVerificationSent(false); // Hide verification UI
        onClose(); // Close the overlay
      } else {
        toast.error('Email not yet verified. Please check your inbox and click the verification link.');
      }
    } catch (error: any) {
      toast.error('Failed to check verification status. Please try again.');
      console.error('Check verification error:', error);
    } finally {
      setIsCheckingVerification(false);
    }
  };

  const showEmailVerificationUI = emailVerificationSent || 
    (currentUser && 
     currentUser.providerData[0]?.providerId === 'password' && 
     !currentUser.emailVerified);

  React.useEffect(() => {
    if (isOpen) {
      if (forceEmailVerification) {
        // Show email verification UI directly for unverified users
        setEmailVerificationSent(true);
        setShowForgotPassword(false);
        setIsLogin(true);
      } else {
        // Normal reset for regular login overlay
        setEmailVerificationSent(false);
        setShowForgotPassword(false);
        setIsLogin(true);
      }
      
      setLoginData({
        email: '',
        password: '',
        rememberMe: false
      });
      setSignupData({
        fullName: '',
        phoneNumber: '',
        province: '',
        district: '',
        currentStandard: '',
        college: '',
        email: '',
        password: '',
        confirmPassword: '',
        examType: '',
        customExam: ''
      });
    }
  }, [isOpen, forceEmailVerification]);

  if (!isOpen) return null;

  // Forgot Password Modal
  if (showForgotPassword) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-md relative animate-fade-in">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Close forgot password form"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900 mb-1">
                Reset Password
              </h2>
              <p className="text-gray-600">
                Enter your email address and we'll send you a link to reset your password
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-5">
              <div>
                <label htmlFor="forgot-email" className="block text-gray-700 font-medium mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="forgot-email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email address"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isLoading ? 'Sending...' : (
                  <>
                    Send Reset Link
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              <button 
                onClick={() => setShowForgotPassword(false)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Back to Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md relative animate-fade-in overflow-hidden">
        <button
          onClick={() => {
            // Reset all states when closing
            setEmailVerificationSent(false);
            setShowForgotPassword(false);
            setIsLogin(true);
            onClose();
          }}
          className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 transition-colors"
          aria-label="Close auth form"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-blue-900 mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to access your account' : 'Complete your details to register'}
            </p>
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full mb-6 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-medium transition-colors flex items-center justify-center relative"
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google" 
              className="w-5 h-5 absolute left-4"
            />
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with email</span>
            </div>
          </div>

          {isLogin ? (
            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div>
                <label htmlFor="login-email" className="block text-gray-700 font-medium mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password" className="block text-gray-700 font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    className="w-full pl-10 pr-10 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your password"
                    required
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    name="rememberMe"
                    checked={loginData.rememberMe}
                    onChange={handleLoginChange}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" 
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button 
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isLoading ? 'Signing in...' : (
                  <>
                    Sign In
                    <LogIn className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignupSubmit} className="space-y-4 max-h-96 overflow-y-auto pr-2">
              <div>
                <label htmlFor="fullName" className="block text-gray-700 font-medium mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={signupData.fullName}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your full name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-gray-700 font-medium mb-1">
                  Phone Number
                </label>
                <div className="flex">
                  <div className="w-1/4 mr-2">
                    <div className="flex items-center justify-center h-full bg-gray-100 text-gray-700 rounded-lg border border-gray-300 px-3 py-2">
                      <Phone className="w-4 h-4 mr-1" />
                      +977
                    </div>
                  </div>
                  <input
                    type="tel"
                    id="phoneNumber"
                    name="phoneNumber"
                    value={signupData.phoneNumber}
                    onChange={handleSignupChange}
                    className="w-3/4 px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="9XXXXXXXX"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="province" className="block text-gray-700 font-medium mb-1">
                  Province
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="province"
                    name="province"
                    value={signupData.province}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="" disabled>Select Province</option>
                    {provinces.map((province, index) => (
                      <option key={index} value={province}>{province}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="district" className="block text-gray-700 font-medium mb-1">
                  District
                </label>
                <div className="relative">
                  <MapPin className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="district"
                    name="district"
                    value={signupData.district}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your district"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currentStandard" className="block text-gray-700 font-medium mb-1">
                  Current Standard
                </label>
                <div className="relative">
                  <Book className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="currentStandard"
                    name="currentStandard"
                    value={signupData.currentStandard}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="" disabled>Select Standard</option>
                    {standards.map((standard, index) => (
                      <option key={index} value={standard}>{standard}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              <div>
                <label htmlFor="examType" className="block text-gray-700 font-medium mb-1">
                  Competitive Exam
                </label>
                <div className="relative">
                  <Award className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    id="examType"
                    name="examType"
                    value={signupData.examType}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                    required
                  >
                    <option value="" disabled>Select exam</option>
                    {examTypes.map((exam, index) => (
                      <option key={index} value={exam}>{exam}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-5 h-5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {signupData.examType === 'Other' && (
                <div>
                  <label htmlFor="customExam" className="block text-gray-700 font-medium mb-1">
                    Specify Exam
                  </label>
                  <div className="relative">
                    <Award className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      id="customExam"
                      name="customExam"
                      value={signupData.customExam}
                      onChange={handleSignupChange}
                      className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter the exam name"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="college" className="block text-gray-700 font-medium mb-1">
                  College
                </label>
                <div className="relative">
                  <School className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    id="college"
                    name="college"
                    value={signupData.college}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your college name"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-gray-700 font-medium mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="signup-email"
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-gray-700 font-medium mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    name="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Create a password"
                    required
                  />
                  <button 
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-gray-700 font-medium mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    className="w-full pl-10 pr-10 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Confirm your password"
                    required
                  />
                  <button 
                    type="button"
                    onClick={toggleConfirmPasswordVisibility}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center mt-2"
              >
                {isLoading ? 'Creating Account...' : (
                  <>
                    Create Account
                    <UserPlus className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>
            </form>
          )}

          {showForgotPassword && (
            <form onSubmit={handleForgotPassword} className="space-y-4 mt-4">
              <div>
                <label htmlFor="forgot-password-email" className="block text-gray-700 font-medium mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    id="forgot-password-email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-800 hover:bg-blue-900 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
              >
                {isLoading ? 'Sending...' : (
                  <>
                    Send Reset Link
                    <Send className="w-5 h-5 ml-2" />
                  </>
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                <button 
                  onClick={() => setShowForgotPassword(false)}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {showEmailVerificationUI && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-yellow-800 mb-1">
                    Email Verification Required
                  </h3>
                  <p className="text-sm text-yellow-700 mb-3">
                    {emailVerificationSent 
                      ? "We've sent a verification email to your address. Please check your inbox and click the verification link."
                      : "Please verify your email address to access your account."
                    }
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={handleSendVerificationEmail}
                      disabled={isLoading}
                      className="flex items-center justify-center px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded-lg font-medium transition-colors"
                    >
                      {isLoading ? 'Sending...' : (
                        <>
                          <Send className="w-4 h-4 mr-1" />
                          {emailVerificationSent ? 'Resend Email' : 'Send Verification Email'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleCheckEmailVerification}
                      disabled={isCheckingVerification}
                      className="flex items-center justify-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium transition-colors"
                    >
                      {isCheckingVerification ? 'Checking...' : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          I've Verified
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!showEmailVerificationUI && (
            <div className="mt-6 text-center text-sm text-gray-600">
              {isLogin ? (
                <>
                  Don't have an account?{' '}
                  <button 
                    onClick={toggleAuthMode}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button 
                    onClick={toggleAuthMode}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginOverlay;