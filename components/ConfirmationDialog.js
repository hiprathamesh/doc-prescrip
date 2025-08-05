'use client';

import { X, Loader2 } from 'lucide-react';
import { useState } from 'react';

export default function ConfirmationDialog({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel, 
  isLoading = false,
  requireConfirmation = false,
  confirmationText = '',
  confirmationPlaceholder = 'Type to confirm'
}) {
  const [inputValue, setInputValue] = useState('');

  if (!isOpen) return null;

  const canConfirm = !requireConfirmation || inputValue.trim() === confirmationText.trim();

  const handleConfirm = () => {
    if (canConfirm) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    setInputValue('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-sm w-full mx-auto border border-gray-200 dark:border-gray-700">
        <div className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-200">{title}</h3>
            {!isLoading && (
              <button
                onClick={handleCancel}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">{message}</p>

          {requireConfirmation && (
            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Type <strong>"{confirmationText}"</strong> to confirm:
              </label>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={confirmationPlaceholder}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-red-500 focus:dark:border-red-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                disabled={isLoading}
                autoFocus
              />
            </div>
          )}
          
          <div className="flex space-x-2.5">
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || !canConfirm}
              className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white dark:text-gray-900 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Confirm</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
