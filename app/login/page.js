'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Stethoscope, UserPlus, ArrowRight } from 'lucide-react';
import { storage } from '../../utils/storage';
import { initializeTheme } from '../../utils/theme';
import DoctorRegistration from '../../components/DoctorRegistration';
import DarkModeToggle from '../../components/DarkModeToggle';

export default function LoginPage() {
  const [email, setEmail] = useState('admin@chaitanyahospital.com');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const router = useRouter();

  useEffect(() => {
    initializeTheme();
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Error', {
        description: 'Please enter both email and password'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        storage.setCurrentDoctor(data.doctor.doctorId);
        
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
      setIsLoading(false);
    }
  };

  const handleRegistrationSuccess = (doctor) => {
    toast.success('Doctor Registered', {
      description: `${doctor.name} has been registered successfully`
    });
    setShowRegistration(false);
  };

  if (showRegistration) {
    return (
      <DoctorRegistration 
        onBack={() => setShowRegistration(false)}
        onSuccess={handleRegistrationSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      {/* Dark Mode Toggle */}
      <div className="absolute top-4 right-4">
        <DarkModeToggle />
      </div>

      {/* Login Container */}
      <div className={`w-full max-w-sm transform transition-all duration-500 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-10 h-10 mb-4 transform transition-all duration-700 ease-out ${
            isVisible ? 'scale-100 rotate-0' : 'scale-50 rotate-45'
          }`}>
            <Stethoscope className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-1">
            Doc Prescrip
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Welcome back
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
              Email
            </label>
            <div className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${
                focusedField === 'email' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <Mail className="h-4 w-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-10 pr-3 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                placeholder="Enter your email"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-400 uppercase tracking-wide">
              Password
            </label>
            <div className="relative group">
              <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-all duration-200 ${
                focusedField === 'password' ? 'text-blue-500 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
              }`}>
                <Lock className="h-4 w-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-10 pr-10 py-3 bg-transparent border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 hover:border-gray-300 dark:hover:border-gray-600"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-all duration-200 hover:scale-110 active:scale-95"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="group w-full bg-blue-600 dark:bg-blue-500 text-white font-medium py-3 px-4 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center relative overflow-hidden"
            >
              <div className={`flex items-center transition-all duration-200 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
                Sign In
                <ArrowRight className="w-4 h-4 ml-2 transform transition-transform duration-200 group-hover:translate-x-0.5" />
              </div>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="px-2 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
              or
            </span>
          </div>
        </div>

        {/* Register Button */}
        <button
          type="button"
          onClick={() => setShowRegistration(true)}
          className="group w-full border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-4 rounded-lg hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:focus:ring-gray-400 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center"
        >
          <UserPlus className="w-4 h-4 mr-2 transform transition-transform duration-200 group-hover:scale-110" />
          Register New Doctor
        </button>
      </div>
    </div>
  );
}
