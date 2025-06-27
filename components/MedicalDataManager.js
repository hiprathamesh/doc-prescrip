'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { PREDEFINED_SYMPTOMS, PREDEFINED_DIAGNOSES, PREDEFINED_LAB_TESTS } from '../lib/medicalData';
import { toast } from 'sonner';
import { activityLogger } from '../utils/activityLogger';
import CustomDropdown from './CustomDropdown';
import useScrollToTop from '../hooks/useScrollToTop';

// Loading skeleton for custom items
const CustomItemsSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: 8 }).map((_, index) => (
      <div 
        key={index} 
        className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
        style={{ width: `${Math.random() * 60 + 60}px` }} // Random widths between 60-120px
      />
    ))}
  </div>
);

// Loading skeleton for predefined items
const PredefinedItemsSkeleton = () => (
  <div className="flex flex-wrap gap-2">
    {Array.from({ length: 24 }).map((_, index) => (
      <div 
        key={index} 
        className="h-7 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"
        style={{ width: `${Math.random() * 80 + 80}px` }} // Random widths between 80-160px
      />
    ))}
  </div>
);

export default function MedicalDataManager({ onBack }) {
  const [activeTab, setActiveTab] = useState('symptoms');
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [customDiagnoses, setCustomDiagnoses] = useState([]);
  const [customLabTests, setCustomLabTests] = useState([]);
  const [customMedications, setCustomMedications] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  // Add loading state
  const [isLoadingData, setIsLoadingData] = useState(true);
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(24); // Show 24 items per page for better grid layout

  // Add refs and state for floating header
  const medDataHeaderRef = useRef(null);
  const [isMedDataHeaderVisible, setIsMedDataHeaderVisible] = useState(true);
  const searchInputRef = useRef(null);

  // Add scroll to top when component mounts or active tab changes
  useScrollToTop([activeTab]);

  useEffect(() => {
    loadData();
  }, []);

  // Reset header visibility when component mounts
  useEffect(() => {
    setIsMedDataHeaderVisible(true);
  }, []);

  // Intersection Observer for medical data header visibility
  useEffect(() => {
    const medDataHeaderElement = medDataHeaderRef.current;

    if (!medDataHeaderElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsMedDataHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-81px";

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          setIsMedDataHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(medDataHeaderElement);

    return () => {
      if (medDataHeaderElement) {
        observer.unobserve(medDataHeaderElement);
      }
    };
  }, []);

  const loadData = async () => {
    setIsLoadingData(true);
    try {
      const [symptoms, diagnoses, labTests, medications] = await Promise.all([
        storage.getCustomSymptoms(),
        storage.getCustomDiagnoses(),
        storage.getCustomLabTests(),
        storage.getCustomMedications()
      ]);

      setCustomSymptoms(symptoms || []);
      setCustomDiagnoses(diagnoses || []);
      setCustomLabTests(labTests || []);
      setCustomMedications(medications || []);
    } catch (error) {
      console.error('Error loading custom data:', error);
      setCustomSymptoms([]);
      setCustomDiagnoses([]);
      setCustomLabTests([]);
      setCustomMedications([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.trim()) return;

    try {
      if (activeTab === 'symptoms') {
        const updated = [...customSymptoms, newItem.trim()];
        setCustomSymptoms(updated);
        await storage.saveCustomSymptoms(updated);
        await activityLogger.logCustomDataAdded('symptom', newItem.trim());
        toast.success('Symptom Added', {
          description: `"${newItem.trim()}" added to custom symptoms`
        });
      } else if (activeTab === 'diagnoses') {
        const updated = [...customDiagnoses, newItem.trim()];
        setCustomDiagnoses(updated);
        await storage.saveCustomDiagnoses(updated);
        await activityLogger.logCustomDataAdded('diagnosis', newItem.trim());
        toast.success('Diagnosis Added', {
          description: `"${newItem.trim()}" added to custom diagnoses`
        });
      } else if (activeTab === 'lab-tests') {
        const updated = [...customLabTests, newItem.trim()];
        setCustomLabTests(updated);
        await storage.saveCustomLabTests(updated);
        await activityLogger.logCustomDataAdded('labTest', newItem.trim());
        toast.success('Lab Test Added', {
          description: `"${newItem.trim()}" added to custom lab tests`
        });
      } else if (activeTab === 'medications') {
        const updated = [...customMedications, newItem.trim()];
        setCustomMedications(updated);
        await storage.saveCustomMedications(updated);
        await activityLogger.logCustomDataAdded('medication', newItem.trim());
        toast.success('Medication Added', {
          description: `"${newItem.trim()}" added to custom medications`
        });
      }
      setNewItem('');
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Error', {
        description: 'Failed to add item. Please try again.'
      });
    }
  };

  const handleDeleteItem = async (item) => {
    try {
      if (activeTab === 'symptoms') {
        const updated = customSymptoms.filter(s => s !== item);
        setCustomSymptoms(updated);
        await storage.saveCustomSymptoms(updated);
      } else if (activeTab === 'diagnoses') {
        const updated = customDiagnoses.filter(d => d !== item);
        setCustomDiagnoses(updated);
        await storage.saveCustomDiagnoses(updated);
      } else if (activeTab === 'lab-tests') {
        const updated = customLabTests.filter(l => l !== item);
        setCustomLabTests(updated);
        await storage.saveCustomLabTests(updated);
      } else if (activeTab === 'medications') {
        const updated = customMedications.filter(m => m !== item);
        setCustomMedications(updated);
        await storage.saveCustomMedications(updated);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const getCurrentItems = () => {
    if (activeTab === 'symptoms') return customSymptoms;
    if (activeTab === 'diagnoses') return customDiagnoses;
    if (activeTab === 'lab-tests') return customLabTests;
    if (activeTab === 'medications') return customMedications;
    return [];
  };

  const getPredefinedItems = () => {
    if (activeTab === 'symptoms') return PREDEFINED_SYMPTOMS;
    if (activeTab === 'diagnoses') return PREDEFINED_DIAGNOSES;
    if (activeTab === 'lab-tests') return PREDEFINED_LAB_TESTS;
    return [];
  };

  const currentItems = getCurrentItems();
  const predefinedItems = getPredefinedItems();

  const filteredItems = currentItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPredefined = predefinedItems.filter(item =>
    item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic for predefined items
  const totalPages = Math.ceil(filteredPredefined.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPredefined = filteredPredefined.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getTabLabel = (tab) => {
    if (tab === 'symptoms') return 'Custom Symptoms';
    if (tab === 'diagnoses') return 'Custom Diagnoses';
    if (tab === 'lab-tests') return 'Custom Lab Tests';
    if (tab === 'medications') return 'Custom Medications';
    return '';
  };

  const getPlaceholder = () => {
    if (activeTab === 'symptoms') return 'Add new symptom...';
    if (activeTab === 'diagnoses') return 'Add new diagnosis...';
    if (activeTab === 'lab-tests') return 'Add new lab test...';
    if (activeTab === 'medications') return 'Add new medication...';
    return '';
  };

  const getItemCount = () => {
    if (activeTab === 'symptoms') return customSymptoms.length;
    if (activeTab === 'diagnoses') return customDiagnoses.length;
    if (activeTab === 'lab-tests') return customLabTests.length;
    if (activeTab === 'medications') return customMedications.length;
    return 0;
  };

  const categoryOptions = [
    { value: 'symptoms', label: `Custom Symptoms (${customSymptoms.length})` },
    { value: 'diagnoses', label: `Custom Diagnoses (${customDiagnoses.length})` },
    { value: 'lab-tests', label: `Custom Lab Tests (${customLabTests.length})` },
    { value: 'medications', label: `Custom Medications (${customMedications.length})` }
  ];

  // Handle Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Reset pagination when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isMedDataHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Medical Data Manager</span>
              </div>
              <div className="w-64">
                <CustomDropdown
                  options={categoryOptions}
                  value={activeTab}
                  onChange={setActiveTab}
                  placeholder="Select category..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Header */}
        <div ref={medDataHeaderRef} className="med-data-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Medical Data Manager</span>
              </div>
              <div className="w-full sm:w-64">
                <CustomDropdown
                  options={categoryOptions}
                  value={activeTab}
                  onChange={setActiveTab}
                  placeholder="Select category..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Search */}
          <div className="w-full flex justify-end">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder={`Search ${activeTab.replace('-', ' ')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-70 pl-10 pr-16 py-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border cursor-pointer"
                onClick={() => searchInputRef.current?.focus()}
              >
                Ctrl K
              </div>
            </div>
          </div>

          {/* Add new item */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Add New {activeTab === 'symptoms' ? 'Symptom' : activeTab === 'diagnoses' ? 'Diagnosis' : activeTab === 'lab-tests' ? 'Lab Test' : 'Medication'}</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={getPlaceholder()}
                className="flex-1 p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Custom items */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {getTabLabel(activeTab)}
              </h3>
              {isLoadingData ? (
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              ) : (
                <span className="text-sm text-gray-500">
                  {getItemCount()} item{getItemCount() !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            {isLoadingData ? (
              <CustomItemsSkeleton />
            ) : filteredItems.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className="relative group px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors cursor-default"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-xs cursor-pointer"
                      title="Remove item"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  {searchTerm ? `No ${activeTab.replace('-', ' ')} found matching "${searchTerm}"` : `No custom ${activeTab.replace('-', ' ')} found`}
                </p>
                {!searchTerm && (
                  <p className="text-xs text-gray-400 mt-1">Add items using the form above</p>
                )}
              </div>
            )}
          </div>

          {/* Predefined items (for reference) */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Predefined {activeTab === 'symptoms' ? 'Symptoms' : activeTab === 'diagnoses' ? 'Diagnoses' : 'Lab Tests'}
              </h3>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">
                  {searchTerm ? `${filteredPredefined.length} found` : `${predefinedItems.length} total`}
                </span>
                {totalPages > 1 && (
                  <span className="text-sm text-gray-500">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>
            </div>

            {filteredPredefined.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2">
                  {paginatedPredefined.map((item, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 rounded-full text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors cursor-default"
                    >
                      {item}
                    </span>
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                      showingStart={startIndex + 1}
                      showingEnd={Math.min(endIndex, filteredPredefined.length)}
                      totalItems={filteredPredefined.length}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">
                  {searchTerm ? `No ${activeTab.replace('-', ' ')} found matching "${searchTerm}"` : `No ${activeTab.replace('-', ' ')} available`}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Reusable Pagination Component
function Pagination({ currentPage, totalPages, onPageChange, showingStart, showingEnd, totalItems }) {
  const getPageNumbers = () => {
    const delta = 2; // Number of pages to show on each side of current page
    const range = [];

    // Always show first page
    if (totalPages > 0) {
      range.push(1);
    }

    // Calculate start and end of middle range
    const start = Math.max(2, currentPage - delta);
    const end = Math.min(totalPages - 1, currentPage + delta);

    // Add ellipsis after page 1 if needed
    if (start > 2) {
      range.push('...');
    }

    // Add middle pages
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) {
        range.push(i);
      }
    }

    // Add ellipsis before last page if needed
    if (end < totalPages - 1) {
      range.push('...');
    }

    // Always show last page (if different from first)
    if (totalPages > 1) {
      range.push(totalPages);
    }

    return range;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Showing {showingStart}-{showingEnd} of {totalItems} items
      </div>

      <div className="flex items-center space-x-1">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === 1
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            }`}
        >
          Previous
        </button>

        {/* Page numbers */}
        <div className="flex space-x-1">
          {pageNumbers.map((page, index) => (
            <button
              key={index}
              onClick={() => typeof page === 'number' && onPageChange(page)}
              disabled={page === '...'}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${page === currentPage
                ? 'bg-blue-600 text-white'
                : page === '...'
                  ? 'text-gray-400 cursor-default'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
                }`}
            >
              {page}
            </button>
          ))}
        </div>

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}