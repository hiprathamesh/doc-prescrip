'use client';

import { useState } from 'react';
import { X, Copy, MessageCircle, CheckCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export default function ShareModal({ isOpen, onClose, shareUrl, title = "Share Document", fileName = "document" }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link Copied', {
        description: 'The share link has been copied to your clipboard'
      });
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Copy Failed', {
        description: 'Failed to copy link to clipboard'
      });
    }
  };

  const shareOnWhatsApp = () => {
    const message = `Hi! I'm sharing a ${title.toLowerCase()} with you. You can view it here: ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    toast.success('Opening WhatsApp', {
      description: 'WhatsApp is opening with the share message'
    });
  };

  const openInNewTab = () => {
    window.open(shareUrl, '_blank');
    toast.success('Opening Document', {
      description: 'Document is opening in a new tab'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl max-w-md w-full border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Share URL Display */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Share Link:</p>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 text-sm bg-transparent text-gray-800 dark:text-gray-200 outline-none"
              />
              <button
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors duration-200"
                title="Copy to clipboard"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-gray-500" />
                )}
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Share Options:</h3>
            
            {/* Copy Link Button */}
            <button
              onClick={copyToClipboard}
              className="w-full flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors duration-200"
            >
              {copied ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Copy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
              <div className="flex-1 text-left">
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {copied ? 'Link Copied!' : 'Copy Link'}
                </p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {copied ? 'Link has been copied to clipboard' : 'Copy the share link to clipboard'}
                </p>
              </div>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={shareOnWhatsApp}
              className="w-full flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-800 transition-colors duration-200"
            >
              <MessageCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div className="flex-1 text-left">
                <p className="font-medium text-green-800 dark:text-green-200">Share on WhatsApp</p>
                <p className="text-sm text-green-600 dark:text-green-400">
                  Send the document link via WhatsApp
                </p>
              </div>
            </button>

            {/* Open in New Tab Button */}
            <button
              onClick={openInNewTab}
              className="w-full flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200"
            >
              <ExternalLink className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-800 dark:text-gray-200">Open in New Tab</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  View the document in a new browser tab
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}