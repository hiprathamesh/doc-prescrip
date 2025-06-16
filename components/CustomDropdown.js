'use client';

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronDown } from 'lucide-react';

const CustomDropdown = forwardRef(function CustomDropdown({ options, value, onChange, placeholder, disabled = false, onEnterPress }, ref) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const buttonRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);
  const selectedIndex = options.findIndex(option => option.value === value);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    focus: () => {
      buttonRef.current?.focus();
    },
    open: () => {
      setIsOpen(true);
      buttonRef.current?.focus();
    },
    close: () => {
      setIsOpen(false);
      setHighlightedIndex(-1);
    }
  }));

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  useEffect(() => {
    if (isOpen && selectedIndex >= 0) {
      setHighlightedIndex(selectedIndex);
    }
  }, [isOpen, selectedIndex]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setHighlightedIndex(-1);
    if (onEnterPress) {
      onEnterPress();
    }
  };

  const handleKeyDown = (e) => {
    if (disabled) return;

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (isOpen && highlightedIndex >= 0) {
          handleSelect(options[highlightedIndex].value);
        } else if (isOpen && selectedOption) {
          handleSelect(selectedOption.value);
        } else if (!isOpen) {
          setIsOpen(true);
        } else if (onEnterPress) {
          setIsOpen(false);
          onEnterPress();
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        } else {
          setHighlightedIndex(prev =>
            prev < options.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : options.length - 1);
        } else {
          setHighlightedIndex(prev =>
            prev > 0 ? prev - 1 : options.length - 1
          );
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setHighlightedIndex(-1);
        buttonRef.current?.blur();
        break;
      case ' ':
        e.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
        }
        break;
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`w-full bg-white border border-gray-300 rounded-lg p-3 hover:border-[#BFDBFE] text-left cursor-default focus:outline-none focus:ring-3 focus:ring-[#BFDBFE] focus:border-[#3B82F6] text-sm flex items-center justify-between h-12 transition-colors ${disabled ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''
          }`}
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''} ${disabled ? 'opacity-50' : ''}`} />
      </button>

      <div className={`absolute z-20 mt-2 w-full bg-white max-h-60 rounded-xl p-2 overflow-auto focus:outline-none text-sm border border-gray-200 transition-all duration-300 ease-out origin-top ${
        isOpen && !disabled 
          ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
      }`}>
        {options.map((option, index) => (
          <div
            key={option.value}
            onClick={() => handleSelect(option.value)}
            onMouseEnter={() => setHighlightedIndex(index)}
            className={`cursor-pointer mb-1 rounded-lg select-none relative py-2.5 px-3 font-medium transition-colors ${index === highlightedIndex
                ? 'bg-blue-50 text-blue-600'
                : option.value === value ? 'bg-[#EFF6FF] text-[#1D4ED8]' : 'text-[#374151] hover:bg-[#F3F4F6]'
              }`}
          >
            <span className="block truncate">
              {option.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});

export default CustomDropdown;
