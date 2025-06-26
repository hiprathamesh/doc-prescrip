'use client';

import { useState } from 'react';
import { X, Key, Lock, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function KeyGeneratorModal({ isOpen, onClose }) {
  const [password, setPassword] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e) => {
    e.preventDefault();
    
    if (!password) {
      toast.error('Error', { description: 'Please enter your admin password' });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.key);
        toast.success('Success', { description: 'Registration key generated successfully' });
        setPassword(''); // Clear password for security
      } else {
        toast.error('Error', { description: data.error || 'Failed to generate key' });
      }
    } catch (error) {
      console.error('Key generation error:', error);
      toast.error('Error', { description: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success('Copied', { description: 'Key copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Error', { description: 'Failed to copy key' });
    }
  };

  const handleClose = () => {
    setPassword('');
    setGeneratedKey('');
    setCopied(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Key className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Generate Access Key</h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!generatedKey ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  id="adminPassword"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter admin password"
                  required
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Generating...' : 'Generate Key'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Generated Access Key
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 p-3 bg-gray-50 border rounded-md font-mono text-lg text-center">
                  {generatedKey}
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? (
                    <Check className="w-5 h-5 text-green-600" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-800">
                <strong>Important:</strong> This key can only be used once. Make sure to securely share it with the intended doctor.
              </p>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
