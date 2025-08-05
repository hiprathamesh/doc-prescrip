'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { Settings, Link, Eye, EyeOff, Check, X } from 'lucide-react';

export default function AccountSettings({ isOpen, onClose }) {
  const { data: session } = useSession();
  const [isLinking, setIsLinking] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const isGoogleUser = session?.user?.googleId;
  const hasPassword = session?.user?.passwordHash;

  const handleLinkGoogle = async () => {
    setIsLinking(true);
    try {
      const response = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'link-google' })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Account Linked', {
          description: 'Google account has been linked successfully'
        });
      } else {
        toast.error('Linking Failed', {
          description: data.error || 'Failed to link Google account'
        });
      }
    } catch (error) {
      console.error('Account linking error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Error', {
        description: 'Passwords do not match'
      });
      return;
    }

    if (password.length < 8) {
      toast.error('Error', {
        description: 'Password must be at least 8 characters long'
      });
      return;
    }

    setIsLinking(true);
    try {
      const response = await fetch('/api/auth/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'set-password',
          password
        })
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Password Set', {
          description: 'Password has been set successfully. You can now login with email and password.'
        });
        setPassword('');
        setConfirmPassword('');
      } else {
        toast.error('Password Setup Failed', {
          description: data.error || 'Failed to set password'
        });
      }
    } catch (error) {
      console.error('Password setup error:', error);
      toast.error('Error', {
        description: 'Network error. Please try again.'
      });
    } finally {
      setIsLinking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Account Settings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Account Status */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
              Current Account
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="text-gray-900 dark:text-gray-100">{session?.user?.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Google Account:</span>
                <span className={`flex items-center ${isGoogleUser ? 'text-green-600' : 'text-gray-400'}`}>
                  {isGoogleUser ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                  {isGoogleUser ? 'Linked' : 'Not Linked'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Password Login:</span>
                <span className={`flex items-center ${hasPassword ? 'text-green-600' : 'text-gray-400'}`}>
                  {hasPassword ? <Check className="w-4 h-4 mr-1" /> : <X className="w-4 h-4 mr-1" />}
                  {hasPassword ? 'Available' : 'Not Set'}
                </span>
              </div>
            </div>
          </div>

          {/* Google Account Linking */}
          {!isGoogleUser && hasPassword && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Link Google Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Link your Google account to enable single sign-on and access Google Drive integration.
              </p>
              <button
                onClick={handleLinkGoogle}
                disabled={isLinking}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Link className="w-4 h-4" />
                <span>{isLinking ? 'Linking...' : 'Link Google Account'}</span>
              </button>
            </div>
          )}

          {/* Set Password for Google Users */}
          {isGoogleUser && !hasPassword && (
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                Set Password
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Set a password to enable email/password login in addition to Google sign-in.
              </p>
              
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New Password"
                    className="w-full px-3 py-2 pr-10 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    className="w-full px-3 py-2 pr-10 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                
                <button
                  type="submit"
                  disabled={isLinking}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLinking ? 'Setting Password...' : 'Set Password'}
                </button>
              </form>
            </div>
          )}

          {/* Both linked */}
          {isGoogleUser && hasPassword && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Account Fully Configured
                </span>
              </div>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                You can sign in using either Google or email/password methods.
              </p>
            </div>
          )}

          {/* Google Drive Integration Note */}
          {isGoogleUser && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Link className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Google Drive Available
                </span>
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                You can now share prescriptions and bills directly to patients through Google Drive links.
              </p>
              <div className="text-xs text-blue-600 dark:text-blue-400">
                💡 Use the "Share" button on any prescription or bill to automatically upload to Drive and send via WhatsApp
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}