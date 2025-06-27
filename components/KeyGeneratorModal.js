'use client';

import { useState, useRef, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function KeyGeneratorTooltip({ isOpen, onClose, triggerRef }) {
  const [password, setPassword] = useState('');
  const [generatedKey, setGeneratedKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState('input'); // 'input', 'loading', 'result'
  const inputRef = useRef(null);
  const tooltipRef = useRef(null);
  const autoCloseTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen && state === 'input') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, state]);

  useEffect(() => {
    if (isOpen) {
      setState('input');
      setPassword('');
      setGeneratedKey('');
      setCopied(false);
      setIsLoading(false);
      // Clear any existing auto-close timer when opening
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
        autoCloseTimerRef.current = null;
      }
    }
  }, [isOpen]);

  const handleKeyPress = async (e) => {
    if (e.key === 'Enter' && password.trim() && !isLoading) {
      await handleGenerate();
    }
  };

  const handleGenerate = async () => {
    if (!password.trim()) return;

    setState('loading');
    setIsLoading(true);

    try {
      // Create a minimum loading time promise
      const minLoadingTime = new Promise(resolve => setTimeout(resolve, 200));
      
      const apiCall = fetch('/api/auth/generate-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      // Wait for both the API call and minimum loading time
      const [response] = await Promise.all([apiCall, minLoadingTime]);
      const data = await response.json();

      if (data.success) {
        setGeneratedKey(data.key);
        setState('result');
        
        // Automatically copy the key to clipboard
        try {
          await navigator.clipboard.writeText(data.key);
          toast.success('Key generated and copied to clipboard');
          
          // Set auto-close timer for 2 seconds after successful copy
          autoCloseTimerRef.current = setTimeout(() => {
            handleClose();
          }, 2000);
        } catch (copyError) {
          toast.success('Registration key generated successfully');
          console.warn('Auto-copy failed:', copyError);
        }
      } else {
        toast.error(data.error || 'Failed to generate key');
        setState('input');
        setPassword('');
      }
    } catch (error) {
      console.error('Key generation error:', error);
      toast.error('Network error. Please try again.');
      setState('input');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedKey);
      setCopied(true);
      toast.success('Key copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy key');
    }
  };

  const handleClose = () => {
    // Clear auto-close timer when manually closing
    if (autoCloseTimerRef.current) {
      clearTimeout(autoCloseTimerRef.current);
      autoCloseTimerRef.current = null;
    }
    setState('input');
    setPassword('');
    setGeneratedKey('');
    setCopied(false);
    onClose();
  };

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && tooltipRef.current && !tooltipRef.current.contains(event.target) && 
          triggerRef.current && !triggerRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Cleanup auto-close timer on unmount
  useEffect(() => {
    return () => {
      if (autoCloseTimerRef.current) {
        clearTimeout(autoCloseTimerRef.current);
      }
    };
  }, []);

  return (
    <div 
      ref={tooltipRef}
      className={`absolute top-full mt-3 left-1/2 transform -translate-x-1/2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl z-50 overflow-hidden transition-all duration-400 ease-in-out ${
        isOpen 
          ? `opacity-100 scale-100 translate-y-0 ${
              state === 'input' ? 'w-72' : state === 'loading' ? 'w-14' : 'w-80'
            } ${state === 'loading' ? 'h-14' : 'h-auto'}` 
          : 'opacity-0 scale-0 translate-y-4 w-0 h-auto pointer-events-none'
      }`}
      style={{
        transformOrigin: 'top center'
      }}
    >
      {state === 'input' && (
        <div className={`p-3 transition-all duration-400 ease-in-out ${
          isOpen && state === 'input' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <input
            ref={inputRef}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent transition-all duration-300"
            placeholder="Admin Password"
          />
        </div>
      )}

      {state === 'loading' && (
        <div className={`w-14 h-14 flex items-center justify-center transition-all duration-400 ease-in-out ${
          state === 'loading' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="w-5 h-5 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {state === 'result' && (
        <div className={`p-3 transition-all duration-400 ease-in-out ${
          state === 'result' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="flex-1 p-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg font-mono text-xs text-center text-gray-900 dark:text-white break-all">
              {generatedKey}
            </div>
            <button
              onClick={handleCopy}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
