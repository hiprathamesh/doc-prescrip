'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { storage } from '../utils/storage';
import { PREDEFINED_SYMPTOMS, PREDEFINED_DIAGNOSES, PREDEFINED_LAB_TESTS } from '../lib/medicalData';
import { useToast } from '../contexts/ToastContext';
import { activityLogger } from '../utils/activityLogger';
import CustomDropdown from './CustomDropdown';

export default function MedicalDataManager({ onBack }) {
  const [activeTab, setActiveTab] = useState('symptoms');
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [customDiagnoses, setCustomDiagnoses] = useState([]);
  const [customLabTests, setCustomLabTests] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const { addToast } = useToast();

  // Add refs and state for floating header
  const medDataHeaderRef = useRef(null);
  const [isMedDataHeaderVisible, setIsMedDataHeaderVisible] = useState(true);

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
    try {
      const [symptoms, diagnoses, labTests] = await Promise.all([
        storage.getCustomSymptoms(),
        storage.getCustomDiagnoses(),
        storage.getCustomLabTests()
      ]);

      setCustomSymptoms(symptoms || []);
      setCustomDiagnoses(diagnoses || []);
      setCustomLabTests(labTests || []);
    } catch (error) {
      console.error('Error loading custom data:', error);
      setCustomSymptoms([]);
      setCustomDiagnoses([]);
      setCustomLabTests([]);
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
        addToast({
          title: 'Symptom Added',
          description: `"${newItem.trim()}" added to custom symptoms`,
          type: 'success'
        });
      } else if (activeTab === 'diagnoses') {
        const updated = [...customDiagnoses, newItem.trim()];
        setCustomDiagnoses(updated);
        await storage.saveCustomDiagnoses(updated);
        await activityLogger.logCustomDataAdded('diagnosis', newItem.trim());
        addToast({
          title: 'Diagnosis Added',
          description: `"${newItem.trim()}" added to custom diagnoses`,
          type: 'success'
        });
      } else if (activeTab === 'lab-tests') {
        const updated = [...customLabTests, newItem.trim()];
        setCustomLabTests(updated);
        await storage.saveCustomLabTests(updated);
        await activityLogger.logCustomDataAdded('labTest', newItem.trim());
        addToast({
          title: 'Lab Test Added',
          description: `"${newItem.trim()}" added to custom lab tests`,
          type: 'success'
        });
      }
      setNewItem('');
    } catch (error) {
      console.error('Error adding item:', error);
      addToast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        type: 'error'
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

  const getTabLabel = (tab) => {
    if (tab === 'symptoms') return 'Custom Symptoms';
    if (tab === 'diagnoses') return 'Custom Diagnoses';
    if (tab === 'lab-tests') return 'Custom Lab Tests';
    return '';
  };

  const getPlaceholder = () => {
    if (activeTab === 'symptoms') return 'Add new symptom...';
    if (activeTab === 'diagnoses') return 'Add new diagnosis...';
    if (activeTab === 'lab-tests') return 'Add new lab test...';
    return '';
  };

  const getItemCount = () => {
    if (activeTab === 'symptoms') return customSymptoms.length;
    if (activeTab === 'diagnoses') return customDiagnoses.length;
    if (activeTab === 'lab-tests') return customLabTests.length;
    return 0;
  };

  const categoryOptions = [
    { value: 'symptoms', label: `Custom Symptoms (${customSymptoms.length})` },
    { value: 'diagnoses', label: `Custom Diagnoses (${customDiagnoses.length})` },
    { value: 'lab-tests', label: `Custom Lab Tests (${customLabTests.length})` }
  ];

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isMedDataHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900">Medical Data Manager</span>
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
                  className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900">Medical Data Manager</span>
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
          {/* Add new item */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New {activeTab === 'symptoms' ? 'Symptom' : activeTab === 'diagnoses' ? 'Diagnosis' : 'Lab Test'}</h3>
            <div className="flex space-x-3">
              <input
                type="text"
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder={getPlaceholder()}
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
              />
              <button
                onClick={handleAddItem}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center space-x-2 transition-colors duration-200 font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Search */}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.replace('-', ' ')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
            />
          </div>


          {/* Custom items */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {getTabLabel(activeTab)}
              </h3>
              <span className="text-sm text-gray-500">
                {getItemCount()} item{getItemCount() !== 1 ? 's' : ''}
              </span>
            </div>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <span className="text-blue-800 font-medium text-sm">{item}</span>
                    <button
                      onClick={() => handleDeleteItem(item)}
                      className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
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
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Predefined {activeTab === 'symptoms' ? 'Symptoms' : activeTab === 'diagnoses' ? 'Diagnoses' : 'Lab Tests'}
              </h3>
              <span className="text-sm text-gray-500">
                {searchTerm ? `${filteredPredefined.length} found` : `${predefinedItems.length} total`}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
              {filteredPredefined.slice(0, 50).map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                >
                  {item}
                </span>
              ))}
            </div>
            {filteredPredefined.length > 50 && (
              <p className="text-gray-500 text-sm mt-2">
                Showing first 50 results. Use search to find more.
              </p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}