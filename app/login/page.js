'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Eye, EyeOff, Mail, Lock, Stethoscope, UserPlus, ArrowRight, ArrowLeft,
  User, Building2, GraduationCap, Phone, MapPin, FileText, Key, Info, Shield, Check
} from 'lucide-react';
import { storage } from '../../utils/storage';
import { initializeTheme } from '../../utils/theme';
import DarkModeToggle from '../../components/DarkModeToggle';

export default function LoginPage() {
  const [currentStep, setCurrentStep] = useState('login'); // 'login', 'register', 'otp'
  const [isVisible, setIsVisible] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [focusedField, setFocusedField] = useState(null);

  // Login state
  const [loginData, setLoginData] = useState({
    email: 'roy@l.p',
    password: '',
    showPassword: false,
    isLoading: false
  });

  // Registration state
  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    hospitalName: '',
    hospitalAddress: '',
    degree: '',
    registrationNumber: '',
    phone: '',
    accessKey: '',
    showPassword: false,
    showConfirmPassword: false,
    isLoading: false
  });

  // OTP state
  const [otpData, setOtpData] = useState({
    emailOtp: ['', '', '', '', '', ''], // Changed to array for 6 digits
    isLoading: false,
    countdown: 0,
    canResend: true
  });

  const [accessType, setAccessType] = useState('trial');
  const router = useRouter();

  useEffect(() => {
    initializeTheme();
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval;
    if (otpData.countdown > 0) {
      interval = setInterval(() => {
        setOtpData(prev => {
          const newCount = prev.countdown - 1;
          if (newCount <= 0) {
            return { ...prev, countdown: 0, canResend: true };
          }
          return { ...prev, countdown: newCount };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpData.countdown]);

  // Auto-focus first OTP input when OTP step is reached
  useEffect(() => {
    if (currentStep === 'otp') {
      const timer = setTimeout(() => {
        const firstInput = document.getElementById('otp-0');
        if (firstInput) {
          firstInput.focus();
        }
      }, 600); // Wait for animation to complete
      return () => clearTimeout(timer);
    }
  }, [currentStep]);

  // Remove artificial delay for content switch
  const handleModeSwitch = async (toStep) => {
    setIsTransitioning(true);
    setCurrentStep(toStep);
    setIsTransitioning(false);
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();

    if (!loginData.email || !loginData.password) {
      toast.error('Error', {
        description: 'Please enter both email and password'
      });
      return;
    }

    setLoginData(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        storage.setCurrentDoctor(data.doctor.doctorId, {
          name: data.doctor.name,
          lastName: data.doctor.lastName,
          accessType: data.doctor.accessType,
          phone: data.doctor.phone || '',
          degree: data.doctor.degree || '',
          registrationNumber: data.doctor.registrationNumber || '',
          hospitalName: data.doctor.hospitalName || '',
          hospitalAddress: data.doctor.hospitalAddress || ''
        });

        toast.success('Login Successful', {
          description: `Welcome back, ${data.doctor.name}!`
        });

        router.push('/');
      } else {
        toast.error('Login Failed', {
          description: data.error || 'Invalid credentials'
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setLoginData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleRegistrationSubmit = async (e) => {
    e.preventDefault();

    if (!validateRegistrationForm()) return;

    setRegData(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: regData.firstName,
          lastName: regData.lastName,
          email: regData.email,
          phone: regData.phone,
          password: regData.password,
          hospitalName: regData.hospitalName,
          hospitalAddress: regData.hospitalAddress,
          degree: regData.degree,
          registrationNumber: regData.registrationNumber,
          accessKey: regData.accessKey
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('OTP Sent', {
          description: 'Verification codes have been sent to your email'
        });

        setOtpData(prev => ({
          ...prev,
          countdown: 60,
          canResend: false
        }));

        await handleModeSwitch('otp');
      } else {
        toast.error('Failed to Send OTP', {
          description: data.error || 'Failed to send verification codes'
        });
      }
    } catch (error) {
      console.error('OTP send error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setRegData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();

    const otpString = otpData.emailOtp.join('');
    if (otpString.length !== 6) {
      toast.error('Error', { description: 'Please enter the complete 6-digit verification code' });
      return;
    }

    setOtpData(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regData.email,
          emailOtp: otpString,
          registrationData: {
            firstName: regData.firstName,
            lastName: regData.lastName,
            email: regData.email,
            password: regData.password,
            hospitalName: regData.hospitalName,
            hospitalAddress: regData.hospitalAddress,
            degree: regData.degree,
            registrationNumber: regData.registrationNumber,
            phone: regData.phone,
            accessKey: regData.accessKey
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        const accessMessage = data.doctor.accessType === 'lifetime_free'
          ? 'with lifetime free access'
          : 'with 6-month free trial';

        storage.setCurrentDoctor(data.doctor.doctorId, {
          name: data.doctor.name,
          accessType: data.doctor.accessType,
          phone: data.doctor.phone || '',
          degree: data.doctor.degree || '',
          registrationNumber: data.doctor.registrationNumber || ''
        });

        toast.success('Registration Successful', {
          description: `Doctor account has been created successfully ${accessMessage}`
        });
        router.push('/');
      } else {
        toast.error('Verification Failed', {
          description: data.error || 'Invalid verification code'
        });
      }
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setOtpData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleResendOtp = async () => {
    if (!otpData.canResend) return;

    setOtpData(prev => ({ ...prev, isLoading: true }));

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: regData.firstName,
          lastName: regData.lastName,
          email: regData.email,
          phone: regData.phone,
          resend: true
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('OTP Resent', {
          description: 'New verification code has been sent'
        });

        setOtpData(prev => ({
          ...prev,
          countdown: 60,
          canResend: false,
          emailOtp: ['', '', '', '', '', '']
        }));
      } else {
        toast.error('Failed to Resend', {
          description: data.error || 'Failed to resend verification code'
        });
      }
    } catch (error) {
      console.error('OTP resend error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setOtpData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleOtpDigitChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otpData.emailOtp];
    newOtp[index] = value;

    setOtpData(prev => ({ ...prev, emailOtp: newOtp }));

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpData.emailOtp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleOtpFocus = (index) => {
    // Keep focus within OTP inputs
    const input = document.getElementById(`otp-${index}`);
    if (input) {
      input.focus();
    }
  };

  const handleOtpBlur = (index, e) => {
    // Prevent focus from leaving OTP inputs unless it's going to another OTP input, button, or form elements
    const relatedTarget = e.relatedTarget;
    const isOtpInput = relatedTarget && relatedTarget.id && relatedTarget.id.startsWith('otp-');
    const isOtpButton = relatedTarget && (
      relatedTarget.type === 'submit' ||
      relatedTarget.textContent?.includes('Resend') ||
      relatedTarget.textContent?.includes('Verify')
    );

    if (!isOtpInput && !isOtpButton) {
      // Return focus to current input
      setTimeout(() => {
        const currentInput = document.getElementById(`otp-${index}`);
        if (currentInput && currentStep === 'otp') {
          currentInput.focus();
        }
      }, 0);
    }
  };

  const validateRegistrationForm = () => {
    if (regData.password !== regData.confirmPassword) {
      toast.error('Error', { description: 'Passwords do not match' });
      return false;
    }

    if (regData.password.length < 8) {
      toast.error('Error', { description: 'Password must be at least 8 characters long' });
      return false;
    }

    const phoneRegex = /^[\+]?[1-9][\d]{3,14}$/;
    if (!phoneRegex.test(regData.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast.error('Error', { description: 'Please enter a valid phone number' });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regData.email)) {
      toast.error('Error', { description: 'Please enter a valid email address' });
      return false;
    }

    return true;
  };

  // Access Key validation state
  const [keyValidation, setKeyValidation] = useState({
    isValidating: false,
    isValid: false,
    hasValidated: false
  });

  // Debounced validation function for access key
  const validateAccessKey = useCallback(async (key) => {
    if (!key || !key.trim()) {
      setKeyValidation({
        isValidating: false,
        isValid: false,
        hasValidated: false
      });
      return;
    }

    setKeyValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const response = await fetch('/api/auth/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessKey: key.trim() })
      });

      const data = await response.json();

      if (data.success) {
        setKeyValidation({
          isValidating: false,
          isValid: data.isValid,
          hasValidated: true
        });
      } else {
        setKeyValidation({
          isValidating: false,
          isValid: false,
          hasValidated: true
        });
      }
    } catch (error) {
      console.error('Key validation error:', error);
      setKeyValidation({
        isValidating: false,
        isValid: false,
        hasValidated: false
      });
    }
  }, []);

  // Debounce timer ref
  const validationTimerRef = useRef(null);

  // Effect to handle debounced validation
  useEffect(() => {
    if (validationTimerRef.current) {
      clearTimeout(validationTimerRef.current);
    }

    if (regData.accessKey.trim()) {
      validationTimerRef.current = setTimeout(() => {
        validateAccessKey(regData.accessKey);
      }, 800); // Wait 800ms after user stops typing
    } else {
      setKeyValidation({
        isValidating: false,
        isValid: false,
        hasValidated: false
      });
    }

    return () => {
      if (validationTimerRef.current) {
        clearTimeout(validationTimerRef.current);
      }
    };
  }, [regData.accessKey, validateAccessKey]);

  const handleRegDataChange = (field, value) => {
    setRegData(prev => ({ ...prev, [field]: value }));

    if (field === 'accessKey') {
      setAccessType(value.trim() ? 'lifetime_free' : 'trial');
      // Reset validation state when user types
      if (keyValidation.hasValidated) {
        setKeyValidation(prev => ({ ...prev, hasValidated: false }));
      }
    }
  };

  return (
    <div className="min-h-screen w-screen bg-white dark:bg-gray-900 flex items-center overflow-hidden transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <div className="fixed top-4 right-4 z-10">
        <DarkModeToggle />
      </div>
      {/* Photo section: hidden on small screens, always 1/2 width on md+ */}
      <div className="photo hidden sm:block sm:w-1/2 h-screen bg-amber-100"></div>

      {/* Main Container */}
      <div className="flex flex-col flex-1 items-center sm:justify-center min-h-screen overflow-hidden w-full px-15 py-20 sm:p-8">
        {/* Animated Header */}
        <div
          className="relative w-full flex flex-col items-center"
          style={{
            minHeight: 100, // enough for header+subtitle
            transition: 'min-height 0.5s cubic-bezier(0.4,0,0.2,1)'
          }}
        >
          <div
            className={`absolute left-0 right-0 flex flex-col items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              currentStep === 'login'
                ? 'translate-y-0 opacity-100'
                : currentStep === 'register'
                  ? 'translate-y-[-40px] opacity-100'
                  : 'translate-y-[20px] opacity-100'
            }`}
            style={{
              zIndex: 2,
              pointerEvents: 'none',
              willChange: 'transform, opacity'
            }}
          >
            <div className="inline-flex items-center justify-center gap-3 mb-4">
              <Stethoscope className={`w-8 h-8 text-blue-600 dark:text-blue-400 transform transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-45'
              }`} />
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                Doc Prescrip
              </h1>
            </div>
            <p className={`text-sm text-gray-500 dark:text-gray-400 transition-all duration-500 ${
              isTransitioning ? 'opacity-0' : 'opacity-100'
            }`}>
              {currentStep === 'login' ? 'Welcome back'
                : currentStep === 'register' ? 'Create your doctor account'
                : 'Verify your email'}
            </p>
          </div>
        </div>

        {/* Content Container */}
        <div className="relative w-full max-w-4xl flex items-start justify-center min-h-[400px]">
          {/* Login Form */}
          <div className={`absolute left-0 right-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            currentStep === 'login'
              ? 'translate-x-0 opacity-100 pointer-events-auto'
              : '-translate-x-20 opacity-0 pointer-events-none'
          }`}>
            <div className="max-w-sm mx-auto">
              <form onSubmit={handleLoginSubmit} className="space-y-6">
                {/* Email Field */}
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'login-email' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={loginData.email}
                    onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))
                    }
                    onFocus={() => setFocusedField('login-email')}
                    onBlur={() => setFocusedField(null)}
                    className="peer text-sm w-full pl-10 pr-3 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 placeholder-transparent"
                    placeholder="Email"
                  />
                  <label htmlFor="login-email" className="form-label">Email</label>
                </div>

                {/* Password Field */}
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'login-password' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="login-password"
                    type={loginData.showPassword ? 'text' : 'password'}
                    required
                    value={loginData.password}
                    onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))
                    }
                    onFocus={() => setFocusedField('login-password')}
                    onBlur={() => setFocusedField(null)}
                    className="peer text-sm w-full pl-10 pr-10 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 placeholder-transparent"
                    placeholder="Password"
                  />
                  <label htmlFor="login-password" className="form-label">Password</label>
                  <button
                    type="button"
                    onClick={() => setLoginData(prev => ({ ...prev, showPassword: !prev.showPassword }))
                    }
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
                  >
                    {loginData.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loginData.isLoading}
                    className="group w-full bg-blue-600 dark:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center relative overflow-hidden cursor-pointer"
                  >
                    <div className={`flex items-center transition-all duration-200 ${loginData.isLoading ? 'opacity-0' : 'opacity-100'}`}>
                      Sign In
                    </div>
                    {loginData.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">New User? </span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('register')}
                  disabled={isTransitioning}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:underline focus:outline-none focus:underline disabled:opacity-50 cursor-pointer"
                >
                  Register
                </button>
              </div>
            </div>
          </div>

          {/* Registration Form */}
          <div className={`absolute left-0 right-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            currentStep === 'register'
              ? 'translate-x-0 translate-y-[-40px] opacity-100 pointer-events-auto'
              : currentStep === 'login'
                ? 'translate-x-20 translate-y-[-40px] opacity-0 pointer-events-none'
                : '-translate-x-20 translate-y-[-40px] opacity-0 pointer-events-none'
          }`}>
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleRegistrationSubmit} className="space-y-6">

                {/* Access Key */}
                <div className="relative">
                  <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${
                    focusedField === 'reg-accessKey' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    <Key className="h-4 w-4" />
                  </div>
                  <input
                    id="reg-accessKey"
                    type="text"
                    value={regData.accessKey}
                    onChange={(e) => handleRegDataChange('accessKey', e.target.value)}
                    onFocus={() => setFocusedField('reg-accessKey')}
                    onBlur={() => setFocusedField(null)}
                    className="peer text-sm pl-10 pr-12 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                    placeholder="Access Key (Optional)"
                  />
                  <label htmlFor="reg-accessKey" className="form-label">Access Key (Optional)</label>
                  
                  {/* Validation Indicator */}
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {keyValidation.isValidating && regData.accessKey.trim() && (
                      <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin" />
                    )}
                    {keyValidation.hasValidated && regData.accessKey.trim() && !keyValidation.isValidating && (
                      <div 
                      title={`${keyValidation.isValid ? 'Valid Access Key' : 'Invalid Access Key'}`}
                      className={`w-5 h-5 rounded flex items-center justify-center transition-all duration-200 cursor-pointer ${
                        keyValidation.isValid 
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                          : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                      }`}>
                        {keyValidation.isValid ? (
                          <Check className="w-3 h-3 text-green-700 dark:text-green-300" />
                        ) : (
                          <div className="w-2 h-2 bg-red-700 dark:bg-red-300 rounded-full" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">



                  {/* First Name */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-firstName' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-firstName"
                      type="text"
                      required
                      value={regData.firstName}
                      onChange={(e) => handleRegDataChange('firstName', e.target.value)}
                      onFocus={() => setFocusedField('reg-firstName')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="First Name *"
                    />
                    <label htmlFor="reg-firstName" className="form-label">First Name *</label>
                  </div>

                  {/* Last Name */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-lastName' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <User className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-lastName"
                      type="text"
                      required
                      value={regData.lastName}
                      onChange={(e) => handleRegDataChange('lastName', e.target.value)}
                      onFocus={() => setFocusedField('reg-lastName')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Last Name *"
                    />
                    <label htmlFor="reg-lastName" className="form-label">Last Name *</label>
                  </div>

                  {/* Email */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-email' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <Mail className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-email"
                      type="email"
                      required
                      value={regData.email}
                      onChange={(e) => handleRegDataChange('email', e.target.value)}
                      onFocus={() => setFocusedField('reg-email')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Email Address *"
                    />
                    <label htmlFor="reg-email" className="form-label">Email Address *</label>
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-phone' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <Phone className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-phone"
                      type="tel"
                      required
                      value={regData.phone}
                      onChange={(e) => handleRegDataChange('phone', e.target.value)}
                      onFocus={() => setFocusedField('reg-phone')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Phone Number *"
                    />
                    <label htmlFor="reg-phone" className="form-label">Phone Number *</label>
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-password' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-password"
                      type={regData.showPassword ? 'text' : 'password'}
                      required
                      value={regData.password}
                      onChange={(e) => handleRegDataChange('password', e.target.value)}
                      onFocus={() => setFocusedField('reg-password')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 pr-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Password *"
                    />
                    <label htmlFor="reg-password" className="form-label">Password *</label>
                    <button
                      type="button"
                      onClick={() => handleRegDataChange('showPassword', !regData.showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      {regData.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-confirmPassword' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-confirmPassword"
                      type={regData.showConfirmPassword ? 'text' : 'password'}
                      required
                      value={regData.confirmPassword}
                      onChange={(e) => handleRegDataChange('confirmPassword', e.target.value)}
                      onFocus={() => setFocusedField('reg-confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 pr-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Confirm Password *"
                    />
                    <label htmlFor="reg-confirmPassword" className="form-label">Confirm Password *</label>
                    <button
                      type="button"
                      onClick={() => handleRegDataChange('showConfirmPassword', !regData.showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer"
                    >
                      {regData.showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>


                  {/* Hospital Name */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-hospitalName' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <Building2 className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-hospitalName"
                      type="text"
                      required
                      value={regData.hospitalName}
                      onChange={(e) => handleRegDataChange('hospitalName', e.target.value)}
                      onFocus={() => setFocusedField('reg-hospitalName')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Hospital/Clinic Name *"
                    />
                    <label htmlFor="reg-hospitalName" className="form-label">Hospital/Clinic Name *</label>
                  </div>

                  {/* Hospital Address */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-hospitalAddress' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <MapPin className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-hospitalAddress"
                      type="text"
                      value={regData.hospitalAddress}
                      onChange={(e) => handleRegDataChange('hospitalAddress', e.target.value)}
                      onFocus={() => setFocusedField('reg-hospitalAddress')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Hospital Address"
                    />
                    <label htmlFor="reg-hospitalAddress" className="form-label">Hospital Address</label>
                  </div>

                  {/* Degree */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-degree' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <GraduationCap className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-degree"
                      type="text"
                      required
                      value={regData.degree}
                      onChange={(e) => handleRegDataChange('degree', e.target.value)}
                      onFocus={() => setFocusedField('reg-degree')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Medical Degree *"
                    />
                    <label htmlFor="reg-degree" className="form-label">Medical Degree *</label>
                  </div>

                  {/* Registration Number */}
                  <div className="relative">
                    <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${focusedField === 'reg-registrationNumber' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                      }`}>
                      <FileText className="h-4 w-4" />
                    </div>
                    <input
                      id="reg-registrationNumber"
                      type="text"
                      required
                      value={regData.registrationNumber}
                      onChange={(e) => handleRegDataChange('registrationNumber', e.target.value)}
                      onFocus={() => setFocusedField('reg-registrationNumber')}
                      onBlur={() => setFocusedField(null)}
                      className="peer text-sm pl-10 w-full py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 placeholder-transparent"
                      placeholder="Medical Registration Number *"
                    />
                    <label htmlFor="reg-registrationNumber" className="form-label">Medical Registration Number *</label>
                  </div>

                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={regData.isLoading}
                    className="group w-full bg-blue-600 dark:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center relative overflow-hidden cursor-pointer"
                  >
                    <div className={`flex items-center transition-all duration-200 ${regData.isLoading ? 'opacity-0' : 'opacity-100'}`}>
                      Register Doctor
                    </div>
                    {regData.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                </div>
              </form>

              {/* Back to Sign In Link */}
              <div className="mt-6 text-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => handleModeSwitch('login')}
                  disabled={isTransitioning}
                  className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:underline focus:outline-none focus:underline disabled:opacity-50 cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          {/* OTP Verification Form */}
          <div className={`absolute left-0 right-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            currentStep === 'otp'
              ? 'translate-x-0 translate-y-[20px] opacity-100 pointer-events-auto'
              : 'translate-x-40 translate-y-[20px] opacity-0 pointer-events-none'
          }`}>
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  We've sent a 6-digit verification code to your email address
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                {/* Email OTP - 6 Digit Inputs */}
                <div className="space-y-4">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide text-center">
                    Email Verification Code
                  </label>
                  <div className="flex justify-center items-center space-x-3">
                    {/* First 3 digits */}
                    <div className="flex space-x-3">
                      {[0, 1, 2].map((index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={otpData.emailOtp[index]}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onFocus={() => handleOtpFocus(index)}
                          onBlur={(e) => handleOtpBlur(index, e)}
                          className="w-12 h-12 text-center text-lg font-semibold bg-transparent border-2 border-gray-200 dark:border-gray-700 rounded-full text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 caret-transparent"
                        />
                      ))}
                    </div>

                    {/* Dash separator */}
                    <div className="text-gray-400 dark:text-gray-500 text-xl font-bold">-</div>

                    {/* Last 3 digits */}
                    <div className="flex space-x-3">
                      {[3, 4, 5].map((index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          maxLength={1}
                          value={otpData.emailOtp[index]}
                          onChange={(e) => handleOtpDigitChange(index, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(index, e)}
                          onFocus={() => handleOtpFocus(index)}
                          onBlur={(e) => handleOtpBlur(index, e)}
                          className="w-12 h-12 text-center text-lg font-semibold bg-transparent border-2 border-gray-200 dark:border-gray-700 rounded-full text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600 caret-transparent"
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={otpData.isLoading}
                    className="group w-full bg-blue-600 dark:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center relative overflow-hidden cursor-pointer"
                  >
                    <div className={`flex items-center transition-all duration-200 ${otpData.isLoading ? 'opacity-0' : 'opacity-100'}`}>
                      Verify & Register
                    </div>
                    {otpData.isLoading && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </button>
                </div>

                {/* Resend OTP */}
                <div className="text-center">
                  {otpData.canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={otpData.isLoading}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-200 hover:underline focus:outline-none focus:underline disabled:opacity-50 cursor-pointer"
                    >
                      Resend verification code
                    </button>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed">
                      Resend available in {otpData.countdown}s
                    </p>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
