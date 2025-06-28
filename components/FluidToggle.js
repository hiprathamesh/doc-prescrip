import React, { useState, useRef, useEffect } from 'react';

export default function FluidToggle({
  checked = false,
  onChange,
  disabled = false,
  size = 'default',
  className = ''
}) {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef(null);

  // Memoized size configurations with smoother scaling
  const sizeConfig = {
    small: {
      track: 'w-10 h-5',
      thumb: 'w-3.5 h-3.5',
      thumbPressed: 'w-5 h-3.5',
      thumbHovered: 'w-4 h-4',
      translateUnchecked: 'translate-x-0.5',
      translateChecked: 'translate-x-[1.25rem]',
      translateCheckedPressed: 'translate-x-[0.75rem]'
    },
    default: {
      track: 'w-12 h-6',
      thumb: 'w-4 h-4',
      thumbPressed: 'w-6 h-4',
      thumbHovered: 'w-4 h-4',
      translateUnchecked: 'translate-x-1',
      translateChecked: 'translate-x-[1.75rem]',
      translateCheckedPressed: 'translate-x-[1.25rem]'
    },
    large: {
      track: 'w-14 h-7',
      thumb: 'w-5 h-5',
      thumbPressed: 'w-7 h-5',
      thumbHovered: 'w-6 h-6',
      translateUnchecked: 'translate-x-1',
      translateChecked: 'translate-x-[2.25rem]',
      translateCheckedPressed: 'translate-x-[1.75rem]'
    }
  };

  const config = sizeConfig[size];

  const handleMouseDown = () => {
    if (disabled) return;
    setIsPressed(true);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const handleMouseUp = () => {
    if (disabled || !isPressed) return;
    
    onChange && onChange(!checked);
    
    timeoutRef.current = setTimeout(() => {
      setIsPressed(false);
      timeoutRef.current = null;
    }, 80);
  };

  const handleMouseEnter = () => {
    if (!disabled) setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isPressed) {
      handleMouseUp();
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Pre-calculate thumb classes with smooth transitions
  let thumbClasses = 'inline-block rounded-full bg-white shadow-lg transition-all duration-150 ease-out transform ';
  
  if (isPressed) {
    thumbClasses += config.thumbPressed + ' ';
  } else if (isHovered) {
    thumbClasses += config.thumbHovered + ' ';
  } else {
    thumbClasses += config.thumb + ' ';
  }

  if (checked) {
    if (isPressed) {
      thumbClasses += config.translateCheckedPressed;
    } else {
      thumbClasses += config.translateChecked;
    }
  } else {
    thumbClasses += config.translateUnchecked;
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative inline-flex items-center ${config.track} rounded-full
        transition-all duration-150 ease-out
        focus:outline-none
        ${disabled
          ? 'opacity-40 cursor-not-allowed'
          : 'cursor-pointer'
        }
        ${checked
          ? `${isPressed ? 'bg-blue-700' : isHovered ? 'bg-blue-500' : 'bg-blue-600'}`
          : `${isPressed ? 'bg-gray-300 dark:bg-gray-600' : isHovered ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-200 dark:bg-gray-800'}`
        }
        ${className}
      `}
    >
      <span className={thumbClasses} />
    </button>
  );
}