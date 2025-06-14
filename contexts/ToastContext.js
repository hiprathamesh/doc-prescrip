'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Undo2 } from 'lucide-react';

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
        return <Info className="w-5 h-5 text-blue-600" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
  };

  const getBorderColor = (type) => {
    switch (type) {
      case 'success':
        return 'border-green-200';
      case 'error':
        return 'border-red-200';
      case 'warning':
        return 'border-yellow-200';
      case 'info':
        return 'border-blue-200';
      default:
        return 'border-green-200';
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
                absolute bg-white border ${getBorderColor(toast.type)} rounded-xl shadow-lg p-4 min-w-[320px] max-w-[400px]
                transition-all duration-300 ease-out cursor-pointer
                ${isTop ? 'z-30' : isMiddle ? 'z-20' : 'z-10'}
                ${
                  isHovered
                    ? isTop
                      ? 'transform translate-y-0'
                      : isMiddle
                      ? 'transform translate-y-[-60px]'
                      : 'transform translate-y-[-120px]'
                    : isTop
                    ? 'transform translate-y-0'
                    : isMiddle
                    ? 'transform translate-y-[-8px] scale-95 opacity-80'
                    : 'transform translate-y-[-16px] scale-90 opacity-60'
                }
              `}
              style={{
                bottom: '0px',
                right: '0px',
              }}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIcon(toast.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 leading-tight">
                    {toast.title}
                  </div>
                  {toast.description && (
                    <div className="text-sm text-gray-600 mt-1 leading-tight">
                      {toast.description}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  {toast.onUndo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.onUndo();
                        removeToast(toast.id);
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                      title="Undo"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 rounded-b-xl overflow-hidden">
                <div
                  className={`h-full transition-all ease-linear ${
                    toast.type === 'success'
                      ? 'bg-green-600'
                      : toast.type === 'error'
                      ? 'bg-red-600'
                      : toast.type === 'warning'
                      ? 'bg-yellow-600'
                      : 'bg-blue-600'
                  }`}
                  style={{
                    width: '100%',
                    animation: `toast-progress ${toast.duration}ms linear forwards`,
                  }}
                />
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
    duration = 5000,
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
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, duration);

    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const removeAllToasts = useCallback(() => {
    setToasts([]);
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
        @keyframes toast-progress {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};
