'use client';

import React, { useState, useRef, useEffect } from 'react';

export default function FluidToggle({ 
  checked, 
  onChange, 
  disabled = false,
  size = 'default', // 'small', 'default', 'large'
  className = ''
}) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef(null);

  // Size configurations
  const sizeConfig = {
    small: {
      track: 'w-10 h-5',
      thumb: 'w-4 h-4',
      thumbPressed: 'w-6 h-4',
      translate: 'translate-x-[1.375rem]' // 22px
    },
    default: {
      track: 'w-12 h-6',
      thumb: 'w-5 h-5',
      thumbPressed: 'w-7 h-5',
      translate: 'translate-x-[1.625rem]' // 26px
    },
    large: {
      track: 'w-14 h-7',
      thumb: 'w-6 h-6',
      thumbPressed: 'w-8 h-6',
      translate: 'translate-x-[1.875rem]' // 30px
    }
  };

  const config = sizeConfig[size];

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  const handleMouseUp = () => {
    if (disabled) return;
    
    // Immediately toggle the state
    onChange(!checked);
    
    // Keep the pressed state for a brief moment to show the animation
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
    }, 150);
  };

  const handleMouseLeave = () => {
    if (disabled) return;
    
    // If mouse leaves while pressed, still complete the toggle
    if (isPressed) {
      onChange(!checked);
      timeoutRef.current = setTimeout(() => {
        setIsPressed(false);
      }, 150);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      className={`
        relative inline-flex items-center ${config.track} rounded-full
        transition-all duration-200 ease-in-out
        focus:outline-none focus:ring-0
        ${disabled 
          ? 'opacity-50 cursor-not-allowed' 
          : 'cursor-pointer'
        }
        ${checked 
          ? 'bg-blue-600 dark:bg-blue-500' 
          : 'bg-gray-200 dark:bg-gray-700'
        }
        ${className}
      `}
    >
      {/* Thumb */}
      <span
        className={`
          inline-block rounded-full bg-white dark:bg-gray-100 shadow-sm
          transition-all duration-300 ease-out
          transform
          ${isPressed && checked ? 'translate-x-[1.125rem]' : (checked ? config.translate : 'translate-x-0.5')}
          ${isPressed ? config.thumbPressed : config.thumb}
        `}
      />
      
      {/* Ripple effect on click */}
      {/* {isPressed && (
        <span
          className={`
            absolute inset-0 rounded-full
            ${checked 
              ? 'bg-blue-400 dark:bg-blue-300' 
              : 'bg-gray-300 dark:bg-gray-600'
            }
            opacity-30 animate-ping
          `}
        />
      )} */}
    </button>
  );
}
