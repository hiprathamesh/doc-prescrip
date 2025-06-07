'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Search, Save } from 'lucide-react';
import { storage } from '../utils/storage';
import { PREDEFINED_SYMPTOMS, PREDEFINED_DIAGNOSES, PREDEFINED_LAB_TESTS } from '../lib/medicalData';

export default function MedicalDataManager({ onBack }) {
  const [activeTab, setActiveTab] = useState('symptoms');
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [customDiagnoses, setCustomDiagnoses] = useState([]);
  const [customLabTests, setCustomLabTests] = useState([]);
  const [newItem, setNewItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setCustomSymptoms(storage.getCustomSymptoms());
    setCustomDiagnoses(storage.getCustomDiagnoses());
    setCustomLabTests(storage.getCustomLabTests());
  };

  const handleAddItem = () => {
    if (!newItem.trim()) return;

    if (activeTab === 'symptoms') {
      const updated = [...customSymptoms, newItem.trim()];
      setCustomSymptoms(updated);
      storage.saveCustomSymptoms(updated);
    } else if (activeTab === 'diagnoses') {
      const updated = [...customDiagnoses, newItem.trim()];
      setCustomDiagnoses(updated);
      storage.saveCustomDiagnoses(updated);
    } else if (activeTab === 'lab-tests') {
      const updated = [...customLabTests, newItem.trim()];
      setCustomLabTests(updated);
      storage.saveCustomLabTests(updated);
    }
    setNewItem('');
  };

  const handleDeleteItem = (item) => {
    if (activeTab === 'symptoms') {
      const updated = customSymptoms.filter(s => s !== item);
      setCustomSymptoms(updated);
      storage.saveCustomSymptoms(updated);
    } else if (activeTab === 'diagnoses') {
      const updated = customDiagnoses.filter(d => d !== item);
      setCustomDiagnoses(updated);
      storage.saveCustomDiagnoses(updated);
    } else if (activeTab === 'lab-tests') {
      const updated = customLabTests.filter(l => l !== item);
      setCustomLabTests(updated);
      storage.saveCustomLabTests(updated);
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical Data Manager</h1>
            <p className="text-gray-600 mt-1">Manage custom symptoms, diagnoses, and lab tests</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('symptoms')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'symptoms'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Custom Symptoms ({customSymptoms.length})
            </button>
            <button
              onClick={() => setActiveTab('diagnoses')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'diagnoses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Custom Diagnoses ({customDiagnoses.length})
            </button>
            <button
              onClick={() => setActiveTab('lab-tests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'lab-tests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              Custom Lab Tests ({customLabTests.length})
            </button>
          </nav>
        </div>

        <div className="p-6 space-y-6">
          {/* Add new item */}
          <div className="flex space-x-4">
            <input
              type="text"
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder={getPlaceholder()}
              className="flex-1 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleAddItem()}
            />
            <button
              onClick={handleAddItem}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-4 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <Plus className="w-5 h-5" />
              <span>Add</span>
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab.replace('-', ' ')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          {/* Custom items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {getTabLabel(activeTab)}
            </h3>
            {filteredItems.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                  >
                    <span className="text-blue-800 font-medium">{item}</span>
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
                <p>No custom {activeTab.replace('-', ' ')} found</p>
              </div>
            )}
          </div>

          {/* Predefined items (for reference) */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Predefined {activeTab === 'symptoms' ? 'Symptoms' : activeTab === 'diagnoses' ? 'Diagnoses' : 'Lab Tests'}
            </h3>
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
    </div>
  );
}