'use client';

import { useState, useRef, useEffect } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, RotateCw, Info } from 'lucide-react';
import { medicationApiService } from '../services/medicationApi';
import { COMMON_MEDICATIONS, MEDICATION_CATEGORIES } from '../lib/medicationData';
import { storage } from '../utils/storage';

export default function MedicationSelector({ onSelect, onAddCustom }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [apiResults, setApiResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMedicationDetails, setShowMedicationDetails] = useState(null);
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const searchTimeoutRef = useRef(null);
  
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

  const handleSearch = async (query) => {
    setSearchTerm(query);
    
    if (query.length < 2) {
      setApiResults([]);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await medicationApiService.searchMedications(query);
        setApiResults(results);
      } catch (error) {
        console.error('Search error:', error);
        setApiResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSelect = (medication) => {
    const medicationName = typeof medication === 'string' ? medication : medication.name;
    onSelect(medicationName);
    setSearchTerm('');
    setShowSearch(false);
    setApiResults([]);
  };

  const handleAddCustom = async () => {
    if (searchTerm.trim() && onAddCustom) {
      await onAddCustom(searchTerm.trim());
      await loadCustomMedications(); // Reload custom medications
      setSearchTerm('');
      setShowSearch(false);
      setApiResults([]);
    }
  };

  const showDetails = async (medicationName) => {
    const details = await medicationApiService.getMedicationDetails(medicationName);
    setShowMedicationDetails(details);
  };

  const getAllSearchResults = () => {
    const localResults = [
      ...COMMON_MEDICATIONS.filter(med => 
        med.toLowerCase().includes(searchTerm.toLowerCase())
      ),
      ...customMedications.filter(med => 
        med.toLowerCase().includes(searchTerm.toLowerCase())
      )
    ];

    return [...new Set([...localResults, ...apiResults.map(r => r.name)])];
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <h4 className="text-base sm:text-lg font-semibold text-gray-800">Select Medications</h4>
        <div className="flex items-center justify-end space-x-2">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Search Medications"
          >
            <Search className="w-4 h-4" />
          </button>
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="hidden sm:block p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="hidden sm:block p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
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
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        {Object.keys(MEDICATION_CATEGORIES).map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-sm transition-colors whitespace-nowrap ${
              selectedCategory === category 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {showSearch && (
        <div className="space-y-3 animate-in slide-in-from-top duration-300">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            {isSearching && (
              <RotateCw className="absolute right-3 top-3 h-4 w-4 text-blue-500 animate-spin" />
            )}
            <input
              type="text"
              placeholder="Search medications (API + Local)..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              autoFocus
            />
          </div>
          
          {searchTerm && (
            <div className="bg-white border border-gray-200 rounded-xl max-h-64 overflow-y-auto shadow-lg">
              {getAllSearchResults().length > 0 ? (
                <div className="p-2">
                  {getAllSearchResults().slice(0, 15).map((medication, index) => {
                    const isApiResult = apiResults.find(r => r.name === medication);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <button
                          onClick={() => handleSelect(medication)}
                          className="flex-1 text-left text-sm"
                        >
                          <div className="font-medium">{medication}</div>
                          {isApiResult && (
                            <div className="text-xs text-gray-500">
                              {isApiResult.genericName && `Generic: ${isApiResult.genericName}`}
                              {isApiResult.manufacturer && ` • ${isApiResult.manufacturer}`}
                            </div>
                          )}
                        </button>
                        {isApiResult && (
                          <button
                            onClick={() => showDetails(medication)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            title="View Details"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : !isSearching ? (
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
              ) : (
                <div className="p-4 text-center">
                  <RotateCw className="w-6 h-6 animate-spin mx-auto text-blue-500" />
                  <p className="text-sm text-gray-500 mt-2">Searching medications...</p>
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
              className="flex-shrink-0 px-3 sm:px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-700 rounded-full text-sm font-medium transition-colors duration-200 border border-gray-300 hover:border-gray-300 whitespace-nowrap"
            >
              {medication}
            </button>
          ))}
        </div>
      </div>

      {/* Medication Details Modal */}
      {showMedicationDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold">{showMedicationDetails.name}</h3>
              <button
                onClick={() => setShowMedicationDetails(null)}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4 text-sm">
              {showMedicationDetails.genericName && (
                <div>
                  <strong>Generic Name:</strong> {showMedicationDetails.genericName}
                </div>
              )}
              {showMedicationDetails.manufacturer && (
                <div>
                  <strong>Manufacturer:</strong> {showMedicationDetails.manufacturer}
                </div>
              )}
              {showMedicationDetails.dosageForm && (
                <div>
                  <strong>Dosage Form:</strong> {showMedicationDetails.dosageForm}
                </div>
              )}
              {showMedicationDetails.indications && (
                <div>
                  <strong>Indications:</strong> {showMedicationDetails.indications}
                </div>
              )}
              {showMedicationDetails.dosage && (
                <div>
                  <strong>Dosage:</strong> {showMedicationDetails.dosage}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}