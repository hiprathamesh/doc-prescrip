'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder, onAddNew }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = options.find(option => option.value === value);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
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

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-3 py-3 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm flex items-center justify-between h-12"
      >
        <span className={`block truncate ${selectedOption ? 'text-gray-900' : 'text-gray-400'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className={`absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-lg py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200 transition-all duration-300 ease-out origin-top ${
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
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option) => (
            <div
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="cursor-pointer select-none relative py-2 pl-3 pr-9 hover:bg-gray-50 text-gray-900 flex items-center"
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
              }}
              className="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-50 text-blue-600 text-sm"
            >
              Add "{searchTerm}" as new patient
            </div>
          ) : (
            <div className="cursor-default select-none relative py-2 px-3 text-gray-500 text-sm">
              No options found.
            </div>
          )
        )}
        {onAddNew && options.length > 0 && (
          <div
            onClick={() => {
              onChange('new');
              setIsOpen(false);
              setSearchTerm('');
            }}
            className="cursor-pointer select-none relative py-2 px-3 hover:bg-gray-50 text-blue-600 border-t border-gray-200 mt-1 pt-2 text-sm"
          >
            Add New Patient...
          </div>
        )}
      </div>
    </div>
  );
}
