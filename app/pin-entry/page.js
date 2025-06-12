'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';

export default function PinEntry() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const router = useRouter();
  const inputRef = useRef(null);

  useEffect(() => {
    // Auto-focus and maintain focus on the invisible input
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (pin.length !== 6) {
      setError('PIN must be 6 digits');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        router.push('/');
      } else {
        setError('Invalid PIN. Please try again.');
        setPin('');
        // Restore focus after clearing PIN
        setTimeout(() => {
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 10);
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      // Restore focus after error
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
    if (error) setError('');
  };

  const handleContainerClick = () => {
    // Refocus input when container is clicked
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Secure Access
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Enter your 6-digit PIN to access the medical practice system
          </p>
        </div>

        {/* PIN Entry Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-3">
                Enter PIN
              </label>
              
              {/* PIN Input Container */}
              <div 
                className="relative flex items-center justify-center py-6 px-4 cursor-text"
                onClick={handleContainerClick}
              >
                {/* Invisible Input */}
                <input
                  ref={inputRef}
                  id="pin"
                  type="text"
                  value={pin}
                  onChange={handlePinChange}
                  className="absolute opacity-0 w-full h-full cursor-default"
                  maxLength={6}
                  disabled={isLoading}
                  autoFocus
                  onBlur={() => {
                    // Prevent losing focus
                    setTimeout(() => {
                      if (inputRef.current) {
                        inputRef.current.focus();
                      }
                    }, 10);
                  }}
                />
                
                {/* Lock Icon */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                
                {/* PIN Dots */}
                <div className="flex justify-center space-x-4">
                  {[...Array(6)].map((_, index) => (
                    <div
                      key={index}
                      className={`w-6 h-6 rounded-full border-1 transition-all duration-300 flex items-center justify-center ${
                        index < pin.length
                          ? 'bg-blue-600 border-blue-600 scale-110 shadow-lg'
                          : 'bg-gray-100 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {showPin && index < pin.length && (
                        <span className="text-white text-sm font-bold">
                          {pin[index]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  disabled={isLoading}
                >
                  {showPin ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={pin.length !== 6 || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none disabled:shadow-md"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Access System</span>
                </>
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <p className="text-xs text-gray-500 leading-relaxed">
              This system contains confidential medical information.<br />
              Unauthorized access is strictly prohibited.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Dr. Prashant Nikam • Practice Management System
          </p>
        </div>
      </div>
    </div>
  );
}
