'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Undo2 } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const ToastContainer = ({ toasts, removeToast, isHovered, setIsHovered }) => {
  const getIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'info':
        return <AlertCircle className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse space-y-reverse space-y-2">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {toasts.map((toast, index) => {
          const isTop = index === toasts.length - 1;
          const isMiddle = index === toasts.length - 2;
          const isBottom = index === toasts.length - 3;

          // Only show max 3 toasts
          if (index < toasts.length - 3) return null;

          return (
            <div
              key={toast.id}
              className={`
                absolute bg-white rounded-xl shadow-lg p-4 min-w-[320px] max-w-[400px] border border-gray-200
                transition-all duration-500 ease-out cursor-pointer group
                ${isTop ? 'z-30' : isMiddle ? 'z-20' : 'z-10'}
                ${isHovered
                  ? isTop
                    ? 'transform translate-y-0'
                    : isMiddle
                      ? 'transform translate-y-[-70px]'
                      : 'transform translate-y-[-140px]'
                  : isTop
                    ? 'transform translate-y-0'
                    : isMiddle
                      ? 'transform translate-y-[-12px] scale-95 opacity-90'
                      : 'transform translate-y-[-24px] scale-90 opacity-80'
                }
                animate-toast-enter
              `}
              style={{
                bottom: '0px',
                right: '0px',
                animationDelay: isTop ? '0ms' : '0ms', // Remove staggered delay for smoother simultaneous animation
              }}
            >
              <div className="space-y-2">

                <div className="flex justify-between lex-1 min-w-0 pr-2">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      {getIcon(toast.type)}
                    </div>
                    <div className="text-sm font-medium text-gray-900 leading-tight">
                      {toast.title}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-auto">
                    {toast.onUndo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.onUndo();
                          removeToast(toast.id);
                        }}
                        className="flex items-center space-x-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 rounded-md transition-colors"
                        title="Undo"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    )}
                    <button
                      onClick={() => removeToast(toast.id)}
                      className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {toast.description && (
                  <div className="text-sm text-gray-600 mt-1 leading-tight">
                    {toast.description}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  const addToast = useCallback(({
    title,
    description,
    type = 'success',
    duration = 8000, // Increased duration
    onUndo
  }) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      title,
      description,
      type,
      duration,
      onUndo
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (unless hovered)
    const timeoutId = setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);

    // Store timeout ID for potential clearing
    newToast.timeoutId = timeoutId;

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast && toast.timeoutId) {
        clearTimeout(toast.timeoutId);
      }
      return prev.filter(toast => toast.id !== id);
    });
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts(prev => {
      prev.forEach(toast => {
        if (toast.timeoutId) {
          clearTimeout(toast.timeoutId);
        }
      });
      return [];
    });
  }, []);

  return (
    <ToastContext.Provider value={{
      addToast,
      removeToast,
      removeAllToasts,
      toasts
    }}>
      {children}
      <ToastContainer
        toasts={toasts}
        removeToast={removeToast}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
      />
      <style jsx global>{`
        @keyframes toast-enter {
          0% {
            transform: translateY(100%) scale(0.8);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        
        @keyframes toast-stack-down {
          from {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateY(-12px) scale(0.95);
            opacity: 0.9;
          }
        }
        
        .animate-toast-enter {
          animation: toast-enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        .animate-toast-stack {
          animation: toast-stack-down 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
};
