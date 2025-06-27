'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder, onAddNew }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const optionsListRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [wrapperRef]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset highlighted index when search term changes
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [searchTerm]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionsListRef.current) {
      const highlightedElement = optionsListRef.current.children[highlightedIndex];
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
      }
    }
  }, [highlightedIndex]);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (searchTerm.length >= 1) {
          // If user is searching and has typed at least one letter
          if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
            // Select highlighted option
            handleSelect(filteredOptions[highlightedIndex].value);
          } else if (filteredOptions.length > 0) {
            // Select first (most relevant) option
            handleSelect(filteredOptions[0].value);
          } else if (onAddNew && searchTerm.trim()) {
            // No matches found, create new
            onChange('new');
            setIsOpen(false);
            setSearchTerm('');
            setHighlightedIndex(-1);
          }
        } else if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          // No search term, select highlighted option
          handleSelect(filteredOptions[highlightedIndex].value);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const maxIndex = filteredOptions.length - 1;
          return prev < maxIndex ? prev + 1 : 0;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => {
          const maxIndex = filteredOptions.length - 1;
          return prev > 0 ? prev - 1 : maxIndex;
        });
        break;

      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;

      case 'Tab':
        // Allow tab to close dropdown and move to next element
        setIsOpen(false);
        setSearchTerm('');
        setHighlightedIndex(-1);
        break;

      default:
        // For any other key, reset highlighted index to allow natural search
        if (e.key.length === 1) {
          setHighlightedIndex(-1);
        }
        break;
    }
  };

  const handleMouseEnter = (index) => {
    setHighlightedIndex(index);
  };

  const handleMouseLeave = () => {
    setHighlightedIndex(-1);
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-3 text-left focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex items-center justify-between h-12 cursor-pointer"
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute z-10 mt-1 w-full bg-white dark:bg-gray-900 shadow-lg max-h-60 rounded-lg py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-600 transition-all duration-300 ease-out origin-top ${
        isOpen 
          ? 'opacity-100 scale-y-100 translate-y-0 pointer-events-auto' 
          : 'opacity-0 scale-y-95 -translate-y-2 pointer-events-none'
      }`}>
        <div className="p-2">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500"
          />
        </div>
        
        <div ref={optionsListRef}>
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <div
                key={option.value}
                onClick={() => handleSelect(option.value)}
                onMouseEnter={() => handleMouseEnter(index)}
                onMouseLeave={handleMouseLeave}
                className={`cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 dark:text-white flex items-center transition-colors ${
                  highlightedIndex === index
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                    : option.value === value 
                      ? 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                <span className={`block truncate ${option.value === value ? 'font-medium' : 'font-normal'}`}>
                  {option.label}
                </span>
                {option.value === value && (
                  <span className="absolute inset-y-0 right-0 flex items-center pr-4 text-blue-600">
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </span>
                )}
              </div>
            ))
          ) : (
            onAddNew ? (
              <div
                onClick={() => {
                  onChange('new');
                  setIsOpen(false);
                  setSearchTerm('');
                  setHighlightedIndex(-1);
                }}
                className="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-600 text-sm"
              >
                Add "{searchTerm}" as new patient
              </div>
            ) : (
              <div className="cursor-default select-none relative py-2 px-3 text-gray-500 text-sm">
                No options found.
              </div>
            )
          )}
        </div>

        {onAddNew && filteredOptions.length > 0 && (
          <div
            onClick={() => {
              onChange('new');
              setIsOpen(false);
              setSearchTerm('');
              setHighlightedIndex(-1);
            }}
            className="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-blue-600 border-t border-gray-200 dark:border-gray-600 mt-1 pt-2 text-sm"
          >
            Add New Patient...
          </div>
        )}
      </div>
    </div>
  );
}
