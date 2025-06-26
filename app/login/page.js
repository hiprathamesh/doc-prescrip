'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, EyeOff, Mail, Lock, Stethoscope, UserPlus } from 'lucide-react';
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
  const router = useRouter();

  useEffect(() => {
    // Initialize theme on component mount
    initializeTheme();
    // Trigger entrance animation
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4 transition-all duration-700 ease-out">
      {/* Dark Mode Toggle */}
      <div className="absolute top-6 right-6">
        <DarkModeToggle />
      </div>

      {/* Login Card */}
      <div className={`w-full max-w-md transform transition-all duration-1000 ease-out ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
      }`}>
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 overflow-hidden">
          {/* Header */}
          <div className="p-8 text-center">
            <div className={`mx-auto h-16 w-16 bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 rounded-2xl flex items-center justify-center mb-6 transform transition-all duration-700 ease-out shadow-lg ${
              isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-12'
            }`}>
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Doctor Portal
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Access your practice
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="group">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <Mail className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 ease-out"
                    placeholder="doctor@hospital.com"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="group">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors">
                    <Lock className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-blue-500 dark:group-focus-within:text-blue-400 transition-colors duration-200" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-200 ease-out"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-400 dark:to-blue-500 text-white font-medium py-3 px-4 rounded-xl hover:from-blue-600 hover:to-blue-700 dark:hover:from-blue-500 dark:hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Signing in...
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Register Button */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowRegistration(true)}
                className="w-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium py-3 px-4 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 dark:focus:ring-slate-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 transform transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Register New Doctor
              </button>
            </div>

            {/* Demo Credentials */}
            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-200 dark:border-slate-600">
              <p className="text-xs text-slate-600 dark:text-slate-400 text-center">
                <span className="font-medium">Default:</span> admin@chaitanyahospital.com
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
