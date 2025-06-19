'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Eye, EyeOff, CheckCircle, AlertCircle, Clock, Ban } from 'lucide-react';
import useScrollToTop from '../../hooks/useScrollToTop';

export default function PinEntry() {
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const router = useRouter();
  const inputRef = useRef(null);

  // Add scroll to top when component mounts
  useScrollToTop();

  useEffect(() => {
    // Auto-focus and maintain focus on the invisible input
    if (inputRef.current && !isLockedOut) {
      inputRef.current.focus();
    }
  }, [isLockedOut]);

  // Countdown timer for lockout
  useEffect(() => {
    let interval;
    if (isLockedOut && lockoutTime > 0) {
      interval = setInterval(() => {
        setLockoutTime((prevTime) => {
          if (prevTime <= 1) {
            setIsLockedOut(false);
            setError('');
            setTimeout(() => {
              if (inputRef.current) {
                inputRef.current.focus();
              }
            }, 100);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLockedOut, lockoutTime]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLockedOut) return;
    
    setAttemptedSubmit(true);
    
    if (pin.length < 4 || pin.length > 10) {
      setError('PIN must be between 4 and 10 digits');
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
        // Handle different types of errors
        if (data.lockedOut) {
          setIsLockedOut(true);
          setLockoutTime(data.remainingTime || 900); // Default 15 minutes
          setError(data.error);
          setPin('');
        } else if (data.rateLimited) {
          setError('Too many requests. Please wait a moment before trying again.');
          setPin('');
        } else {
          setError(data.error);
          setRemainingAttempts(data.remainingAttempts);
          setPin('');
        }
        
        // Restore focus after clearing PIN (if not locked out)
        if (!data.lockedOut) {
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.focus();
            }
          }, 10);
        }
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      // Restore focus after error
      setTimeout(() => {
        if (inputRef.current && !isLockedOut) {
          inputRef.current.focus();
        }
      }, 10);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinChange = (e) => {
    if (isLockedOut) return;
    
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setPin(value);
    if (error) setError('');
    if (attemptedSubmit) setAttemptedSubmit(false);
    if (remainingAttempts !== null) setRemainingAttempts(null);
  };

  const handleContainerClick = () => {
    // Refocus input when container is clicked (if not locked out)
    if (inputRef.current && !isLockedOut) {
      inputRef.current.focus();
    }
  };

  const isValidLength = pin.length >= 4 && pin.length <= 10;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg ${
            isLockedOut ? 'bg-red-600' : 'bg-blue-600'
          }`}>
            {isLockedOut ? (
              <Ban className="w-8 h-8 text-white" />
            ) : (
              <Shield className="w-8 h-8 text-white" />
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {isLockedOut ? 'Access Temporarily Blocked' : 'Secure Access'}
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            {isLockedOut 
              ? 'Too many failed attempts. Please wait before trying again.'
              : 'Enter your PIN (4-10 digits) to access the medical practice system'
            }
          </p>
        </div>

        {/* PIN Entry Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
          {/* Lockout Timer */}
          {isLockedOut && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-red-800">Account Locked</h3>
                  <p className="text-red-700 text-sm mt-1">
                    Time remaining: <span className="font-mono font-bold">{formatTime(lockoutTime)}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-700 mb-3">
                Enter PIN
              </label>
              
              {/* PIN Input Container */}
              <div 
                className={`relative flex items-center justify-center py-6 px-4 ${
                  isLockedOut ? 'cursor-not-allowed opacity-50' : 'cursor-text'
                }`}
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
                  maxLength={10}
                  disabled={isLoading || isLockedOut}
                  autoFocus={!isLockedOut}
                  onBlur={() => {
                    // Prevent losing focus if not locked out
                    if (!isLockedOut) {
                      setTimeout(() => {
                        if (inputRef.current) {
                          inputRef.current.focus();
                        }
                      }, 10);
                    }
                  }}
                />
                
                {/* Lock Icon */}
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                  <Lock className={`h-5 w-5 ${isLockedOut ? 'text-red-400' : 'text-gray-400'}`} />
                </div>
                
                {/* PIN Display */}
                <div className="flex items-center justify-center min-h-[40px] px-12">
                  {pin.length === 0 ? (
                    <div className={`text-lg ${isLockedOut ? 'text-red-400' : 'text-gray-400'}`}>••••</div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      {showPin ? (
                        <span className="text-2xl font-mono tracking-wider text-gray-800">
                          {pin}
                        </span>
                      ) : (
                        <div className="flex space-x-1">
                          {pin.split('').map((_, index) => (
                            <div
                              key={index}
                              className={`w-3 h-3 rounded-full ${
                                isLockedOut ? 'bg-red-400' : 'bg-blue-600 animate-pulse'
                              }`}
                              style={{ animationDelay: `${index * 100}ms` }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Eye Icon */}
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2"
                  disabled={isLoading || pin.length === 0 || isLockedOut}
                >
                  {showPin ? (
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>

              {/* PIN Length Indicator */}
              {!isLockedOut && (
                <div className="flex items-center justify-between mt-2 px-2">
                  <div className="text-xs text-gray-500">
                    {pin.length}/10 digits
                  </div>
                  <div className="flex space-x-1">
                    {[4, 5, 6, 7, 8, 9, 10].map((length) => (
                      <div
                        key={length}
                        className={`w-2 h-1 rounded-full transition-all duration-200 ${
                          pin.length >= length
                            ? 'bg-blue-600'
                            : pin.length >= 4
                            ? 'bg-green-400'
                            : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Remaining Attempts Warning */}
            {remainingAttempts !== null && remainingAttempts <= 2 && remainingAttempts > 0 && (
              <div className="flex items-center space-x-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0" />
                <p className="text-orange-700 text-sm">
                  <strong>Warning:</strong> Only {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining before temporary lockout
                </p>
              </div>
            )}

            {/* Status Message */}
            {attemptedSubmit && pin.length > 0 && pin.length < 4 && !isLockedOut && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                <p className="text-yellow-700 text-sm">
                  Enter at least 4 digits ({4 - pin.length} more needed)
                </p>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className={`flex items-center space-x-2 p-3 border rounded-lg ${
                isLockedOut 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <AlertCircle className={`w-5 h-5 flex-shrink-0 ${
                  isLockedOut ? 'text-red-600' : 'text-red-600'
                }`} />
                <p className={`text-sm ${
                  isLockedOut ? 'text-red-700' : 'text-red-700'
                }`}>{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isValidLength || isLoading || isLockedOut}
              className={`w-full font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg transform ${
                isLockedOut
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : !isValidLength || isLoading
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white hover:shadow-xl hover:-translate-y-0.5'
              }`}
            >
              {isLockedOut ? (
                <>
                  <Ban className="w-5 h-5" />
                  <span>Access Blocked</span>
                </>
              ) : isLoading ? (
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
              {!isLockedOut && (
                <>
                  <br />
                  <span className="text-orange-600 font-medium">
                    Multiple failed attempts will result in temporary account lockout.
                  </span>
                </>
              )}
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
