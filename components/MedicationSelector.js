'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { COMMON_MEDICATIONS, MEDICATION_CATEGORIES } from '../lib/medicationData';
import { storage } from '../utils/storage';

export default function MedicationSelector({ onSelect, onAddCustom }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // Add state for custom medications
  const [customMedications, setCustomMedications] = useState([]);
  const [isLoadingCustom, setIsLoadingCustom] = useState(true);

  // Load custom medications on mount
  useEffect(() => {
    loadCustomMedications();
  }, []);

  const loadCustomMedications = async () => {
    try {
      setIsLoadingCustom(true);
      const medications = await storage.getCustomMedications();
      setCustomMedications(medications || []);
    } catch (error) {
      console.error('Error loading custom medications:', error);
      setCustomMedications([]);
    } finally {
      setIsLoadingCustom(false);
    }
  };

  const getDisplayMedications = () => {
    if (isLoadingCustom) {
      return COMMON_MEDICATIONS; // Show only common medications while loading
    }
    
    if (selectedCategory === 'all') {
      return [...COMMON_MEDICATIONS, ...customMedications];
    }
    return MEDICATION_CATEGORIES[selectedCategory] || [];
  };

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollability();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScrollability);
      return () => container.removeEventListener('scroll', checkScrollability);
    }
  }, [getDisplayMedications()]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleSelect = (medication) => {
    const medicationName = typeof medication === 'string' ? medication : medication.name;
    onSelect(medicationName);
    setSearchTerm('');
    setShowSearch(false);
  };

  const handleAddCustom = async () => {
    if (searchTerm.trim() && onAddCustom) {
      await onAddCustom(searchTerm.trim());
      await loadCustomMedications(); // Reload custom medications
      setSearchTerm('');
      setShowSearch(false);
    }
  };

  const getSearchResults = () => {
    if (!searchTerm || searchTerm.length < 2) return [];
    
    const allMedications = [...COMMON_MEDICATIONS, ...customMedications];
    return allMedications.filter(med => 
      med.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800 dark:text-white">Select Medications</h4>
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            title="Search Medications"
          >
            <Search className="w-4 h-4" />
          </button>
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden sm:block p-2 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden sm:block p-2 text-gray-600 dark:text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex-shrink-0 px-3 py-1 rounded-full text-sm transition-colors ${
            selectedCategory === 'all' 
              ? 'bg-blue-600 text-white dark:text-gray-900' 
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {Object.keys(MEDICATION_CATEGORIES).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === category 
                ? 'bg-blue-600 text-white dark:text-gray-900' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {showSearch && (
        <div className="space-y-3 animate-in fade-in duration-400">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-700 hover:border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-200 focus:border-blue-400 transition-colors"
              autoFocus
            />
          </div>
          
          {searchTerm && (
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl max-h-64 overflow-y-auto shadow-lg">
              {getSearchResults().length > 0 ? (
                <div className="p-2">
                  {getSearchResults().slice(0, 15).map((medication, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelect(medication)}
                      className="w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    >
                      <div className="font-medium text-sm">{medication}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <p className="text-gray-500 text-sm mb-3">No matches found</p>
                  {onAddCustom && (
                    <button
                      onClick={handleAddCustom}
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium transition-all duration-200 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add "{searchTerm}"</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Horizontal scrolling pills */}
      <div className="relative">
        <div
          ref={scrollContainerRef}
          className="flex space-x-2 sm:space-x-3 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {getDisplayMedications().map((medication, index) => (
            <button
              key={index}
              onClick={() => handleSelect(medication)}
              className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-400 rounded-full text-sm font-medium transition-colors duration-200 border border-gray-300 dark:border-gray-700 whitespace-nowrap cursor-pointer"
            >
              {medication}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}