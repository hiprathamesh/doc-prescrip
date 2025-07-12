'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Search, Edit, Trash2, FileText, Calendar, User, Stethoscope, FlaskConical, Pill } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate } from '../utils/dateUtils';
import { MEDICAL_CONDITIONS, SEVERITY_OPTIONS, DURATION_OPTIONS, MEDICATION_TIMING, MEDICATION_DURATION_OPTIONS } from '../lib/constants';
import PillSelector from './PillSelector';
import MedicationSelector from './MedicationSelector';
import { PREDEFINED_SYMPTOMS, PREDEFINED_DIAGNOSES, PREDEFINED_LAB_TESTS } from '../lib/medicalData';
import { activityLogger } from '../utils/activityLogger';
import useScrollToTop from '../hooks/useScrollToTop';
import CustomDropdown from './CustomDropdown';
import ConfirmationDialog from './ConfirmationDialog';
import { toast } from 'sonner';

// Loading skeleton component for templates list
const TemplatesListSkeleton = () => (
  <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
    <div className="divide-y divide-gray-200 dark:divide-gray-700">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className={`p-4 transition-colors duration-200
            ${index === 0 ? 'rounded-t-xl' : ''}
            ${index === 4 ? 'rounded-b-xl' : ''}
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
                <div className="flex items-center space-x-1 ml-3">
                  <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                  <div className="w-7 h-7 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                </div>
              </div>

              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3 animate-pulse"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                {Array.from({ length: 4 }).map((_, colIndex) => (
                  <div key={colIndex}>
                    <div className="flex items-center space-x-1 mb-1">
                      <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                <div className="flex items-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function PrescriptionTemplates({ onBack }) {
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Add sorting state
  const [sortBy, setSortBy] = useState('date-created');
  const [sortDirection, setSortDirection] = useState('desc');

  // Add refs and state for floating header
  const templatesHeaderRef = useRef(null);
  const [isTemplatesHeaderVisible, setIsTemplatesHeaderVisible] = useState(true);
  const searchInputRef = useRef(null);

  // Add confirmation dialog state
  const [deleteConfirmation, setDeleteConfirmation] = useState({
    isOpen: false,
    templateId: null,
    templateName: '',
    isDeleting: false
  });

  // Add loading state
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  // Reset header visibility when returning to list view
  useEffect(() => {
    if (currentView === 'list') {
      setIsTemplatesHeaderVisible(true);
    }
  }, [currentView]);

  // Intersection Observer for templates header visibility
  useEffect(() => {
    const templatesHeaderElement = templatesHeaderRef.current;

    if (!templatesHeaderElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsTemplatesHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-81px"; // Adjusted to match main header height

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          // Only update state if we're in list view
          if (currentView === 'list') {
            setIsTemplatesHeaderVisible(entry.isIntersecting);
          }
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0, // Trigger as soon as element enters/leaves the adjusted viewport
      }
    );

    // Only observe if we're in list view
    if (currentView === 'list') {
      observer.observe(templatesHeaderElement);
    }

    return () => {
      if (templatesHeaderElement) {
        observer.unobserve(templatesHeaderElement);
      }
    };
  }, [currentView]); // Add currentView as dependency

  const loadTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const savedTemplates = await storage.getTemplates();
      setTemplates(Array.isArray(savedTemplates) ? savedTemplates : []);
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Sort options
  const sortOptions = [
    { value: 'date-created', label: 'Date Created' },
    { value: 'name', label: 'Name' },
    { value: 'last-used', label: 'Last Used' }
  ];

  const filteredTemplates = (templates || []).filter(template =>
    template.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.diagnosis || []).some(d => d.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  ).sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'last-used':
        // Handle lastUsed dates properly with fallback to creation date
        const aLastUsed = a.lastUsed ? new Date(a.lastUsed) : new Date(0);
        const bLastUsed = b.lastUsed ? new Date(b.lastUsed) : new Date(0);

        // If both have never been used, sort by creation date
        if (aLastUsed.getTime() === 0 && bLastUsed.getTime() === 0) {
          comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        } else {
          // Templates with usage always come before unused ones
          if (aLastUsed.getTime() === 0) return 1;
          if (bLastUsed.getTime() === 0) return -1;
          comparison = aLastUsed - bLastUsed;
        }
        break;
      case 'date-created':
      default:
        comparison = new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        break;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setCurrentView('create');
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setCurrentView('edit');
  };

  const handleDelete = async (templateId) => {
    const templateToDelete = templates.find(t => t.templateId === templateId);
    if (templateToDelete) {
      setDeleteConfirmation({
        isOpen: true,
        templateId: templateId,
        templateName: templateToDelete.name,
        isDeleting: false
      });
    }
  };

  const confirmDelete = async () => {
    setDeleteConfirmation(prev => ({ ...prev, isDeleting: true }));

    try {
      const templateToDelete = templates.find(t => t.templateId === deleteConfirmation.templateId);
      const success = await storage.deleteTemplate(deleteConfirmation.templateId);
      if (success) {
        // Log activity
        if (templateToDelete) {
          await activityLogger.logTemplateDeleted(templateToDelete.name);
        }

        await loadTemplates(); // Reload templates after deletion
        setDeleteConfirmation({
          isOpen: false,
          templateId: null,
          templateName: '',
          isDeleting: false
        });
      } else {
        alert('Failed to delete template');
        setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
      setDeleteConfirmation(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const cancelDelete = () => {
    if (!deleteConfirmation.isDeleting) {
      setDeleteConfirmation({
        isOpen: false,
        templateId: null,
        templateName: '',
        isDeleting: false
      });
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      const templates = await storage.getTemplates();
      let updatedTemplates;
      let isEditing = false;

      if (selectedTemplate) {
        // Editing existing template
        isEditing = true;
        updatedTemplates = templates.map(t =>
          t.templateId === selectedTemplate.templateId
            ? { ...templateData, templateId: selectedTemplate.templateId, id: selectedTemplate.id, updatedAt: new Date() }
            : t
        );
      } else {
        // Creating new template
        const newTemplate = {
          ...templateData,
          id: Date.now().toString(),
          templateId: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastUsed: null
        };
        updatedTemplates = [...templates, newTemplate];
      }

      await storage.saveTemplates(updatedTemplates);

      // Add toast notifications
      if (isEditing) {
        toast.success('Template Updated', {
          description: `"${templateData.name}" has been updated successfully`
        });
      } else {
        toast.success('Template Created', {
          description: `"${templateData.name}" has been created successfully`
        });
      }

      loadTemplates();
      setCurrentView('list');
      setSelectedTemplate(null);
    } catch (error) {
      console.error('Error saving template:', error);

      // Add error toast
      toast.error('Save Failed', {
        description: 'Failed to save template. Please try again.'
      });
    }
  };

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

  // Add scroll to top when component mounts or when returning to list view
  useScrollToTop([currentView]);

  const handleSortChange = (newSortBy) => {
    setSortBy(newSortBy);
  };

  const handleSortDirectionToggle = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const applyTemplate = async (template) => {
    if (!template) return;

    // Store previous state for undo functionality
    const previousState = {
      symptoms,
      diagnoses,
      medications,
      labResults,
      doctorNotesList,
      adviceList
    };

    // Apply symptoms with proper structure
    if (template.symptoms && Array.isArray(template.symptoms) && template.symptoms.length > 0) {
      setSymptoms(template.symptoms.map(symptom => ({
        ...symptom,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply diagnosis with proper structure
    if (template.diagnosis && Array.isArray(template.diagnosis) && template.diagnosis.length > 0) {
      setDiagnoses(template.diagnosis.map(diagnosis => ({
        ...diagnosis,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply medications with proper structure
    if (template.medications && Array.isArray(template.medications) && template.medications.length > 0) {
      setMedications(template.medications.map(medication => ({
        ...medication,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      })));
    }

    // Apply lab results with proper structure
    if (template.labResults && Array.isArray(template.labResults) && template.labResults.length > 0) {
      setLabResults(template.labResults.map(labResult => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        testName: labResult.testName || labResult.name || labResult
      })));
    }

    // Convert template notes to list format
    if (template.doctorNotes && template.doctorNotes.trim()) {
      const notes = template.doctorNotes.split('\n').filter(note => note.trim()).map(note => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: note.trim()
      }));
      setDoctorNotesList(notes);
    }

    // Convert template advice to list format
    if (template.advice && template.advice.trim()) {
      const advice = template.advice.split('\n').filter(a => a.trim()).map(a => ({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        text: a.trim()
      }));
      setAdviceList(advice);
    }

    // Update template usage tracking
    try {
      await storage.updateTemplateUsage(template.templateId);
    } catch (error) {
      console.error('Failed to update template usage:', error);
      // Don't block the template application if usage tracking fails
    }

    setShowTemplates(false);
    setTemplateSearch('');

    // Show success toast with undo functionality
    const undoToast = () => {
      // Restore previous state
      setSymptoms(previousState.symptoms);
      setDiagnoses(previousState.diagnoses);
      setMedications(previousState.medications);
      setLabResults(previousState.labResults);
      setDoctorNotesList(previousState.doctorNotesList);
      setAdviceList(previousState.adviceList);
      
      // Show undo confirmation
      toast.info('Template Undone', {
        description: `"${template.name}" has been removed`
      });
    };

    toast.success('Template Applied', {
      description: `"${template.name}" has been applied successfully`,
      action: {
        label: 'Undo',
        onClick: undoToast
      }
    });
  };

  if (currentView === 'create' || currentView === 'edit') {
    return (
      <TemplateEditor
        template={selectedTemplate}
        onSave={handleSaveTemplate}
        onCancel={() => {
          setCurrentView('list');
          setSelectedTemplate(null);
        }}
      />
    );
  }

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isTemplatesHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
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
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">Prescription Templates</span>
              </div>
              <button
                onClick={handleCreateNew}
                className="bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Template</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Header */}
        <div ref={templatesHeaderRef} className="templates-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onBack}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Prescription Templates</span>
              </div>
              <button
                onClick={handleCreateNew}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-5 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 font-medium cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Template</span>
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Search Bar and Sort Controls */}
          <div className="w-full flex justify-end items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-70 pl-10 pr-16 py-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
              />
              <div
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded border cursor-pointer"
                onClick={() => searchInputRef.current?.focus()}
              >
                Ctrl K
              </div>
            </div>
            <div className="w-48">
              <CustomDropdown
                options={sortOptions}
                value={sortBy}
                onChange={handleSortChange}
                placeholder="Sort by..."
                showDirectionToggle={true}
                sortDirection={sortDirection}
                onDirectionToggle={handleSortDirectionToggle}
              />
            </div>
          </div>

          {/* Templates List */}
          <div>
            {isLoadingTemplates ? (
              <TemplatesListSkeleton />
            ) : filteredTemplates.length > 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTemplates.map((template, index) => (
                    <div
                      key={template.templateId}
                      className={`p-4 transition-colors duration-200
                        ${index === 0 ? 'first-template-item hover:bg-gray-50 dark:hover:bg-gray-800 rounded-t-xl' : ''}
                        ${index === filteredTemplates.length - 1 ? 'last-template-item hover:bg-gray-50 dark:hover:bg-gray-800 rounded-b-xl' : ''}
                        ${(index !== 0 && index !== filteredTemplates.length - 1) ? 'hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-200 truncate">{template.name}</h3>
                            <div className="flex items-center space-x-1 ml-3">
                              <button
                                onClick={() => handleEdit(template)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(template.templateId)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {template.description && (
                            <p className="text-xs text-gray-600 mb-3 line-clamp-1">{template.description}</p>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                            {/* Symptoms */}
                            {template.symptoms?.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <FileText className="w-3 h-3 text-orange-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-400">Symptoms ({template.symptoms.length})</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-500">
                                  {template.symptoms.slice(0, 2).map(s => s.name).join(', ')}
                                  {template.symptoms.length > 2 && ` +${template.symptoms.length - 2} more`}
                                </div>
                              </div>
                            )}

                            {/* Diagnosis */}
                            {template.diagnosis?.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <Stethoscope className="w-3 h-3 text-blue-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-400">Diagnosis ({template.diagnosis.length})</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-500">
                                  {template.diagnosis.slice(0, 2).map(d => d.name).join(', ')}
                                  {template.diagnosis.length > 2 && ` +${template.diagnosis.length - 2} more`}
                                </div>
                              </div>
                            )}

                            {/* Medications */}
                            {template.medications?.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <Pill className="w-3 h-3 text-green-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-400">Medications ({template.medications.length})</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-500">
                                  {template.medications.slice(0, 2).map(m => m.name).join(', ')}
                                  {template.medications.length > 2 && ` +${template.medications.length - 2} more`}
                                </div>
                              </div>
                            )}

                            {/* Lab Tests */}
                            {template.labResults?.length > 0 && (
                              <div>
                                <div className="flex items-center space-x-1 mb-1">
                                  <FlaskConical className="w-3 h-3 text-purple-500" />
                                  <span className="font-medium text-gray-700 dark:text-gray-400">Lab Tests ({template.labResults.length})</span>
                                </div>
                                <div className="text-gray-600 dark:text-gray-500">
                                  {template.labResults.slice(0, 2).map(l => l.testName).join(', ')}
                                  {template.labResults.length > 2 && ` +${template.labResults.length - 2} more`}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3" />
                                <span>Created {formatDate(template.createdAt)}</span>
                              </div>
                              {template.lastUsed && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>Last used {formatDate(template.lastUsed)}</span>
                                </div>
                              )}
                              {!template.lastUsed && (
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-400">Never used</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {/* Show total items count */}
                              {(() => {
                                const totalItems =
                                  (template.symptoms?.length || 0) +
                                  (template.diagnosis?.length || 0) +
                                  (template.medications?.length || 0) +
                                  (template.labResults?.length || 0);
                                return totalItems > 0 ? `${totalItems} total items` : '';
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-center py-12">
                  <FileText className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-700 mb-3" />
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-1">No templates found</h3>
                  <p className="text-xs text-gray-500 mb-4">
                    {searchTerm ? 'No templates match your search.' : 'Create your first prescription template to get started.'}
                  </p>
                  {!searchTerm && (
                    <button
                      onClick={handleCreateNew}
                      className="bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 transition-colors duration-200 mx-auto cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Template</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirmation.isOpen}
        title="Delete Template"
        message={`Are you sure you want to delete "${deleteConfirmation.templateName}"? This action cannot be undone.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        isLoading={deleteConfirmation.isDeleting}
      />
    </>
  );
}

// Template Editor Component
function TemplateEditor({ template, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    symptoms: template?.symptoms || [],
    diagnosis: template?.diagnosis || [],
    medications: template?.medications || [],
    labResults: template?.labResults || [],
    doctorNotes: template?.doctorNotes || '',
    advice: template?.advice || ''
  });

  // Add refs and state for floating header
  const templateEditorHeaderRef = useRef(null);
  const [isTemplateEditorHeaderVisible, setIsTemplateEditorHeaderVisible] = useState(true);

  // Custom data states
  const [customSymptoms, setCustomSymptoms] = useState([]);
  const [customDiagnoses, setCustomDiagnoses] = useState([]);
  const [customLabTests, setCustomLabTests] = useState([]);
  const [customMedications, setCustomMedications] = useState([]);

  useEffect(() => {
    loadCustomData();
  }, []);

  // Reset header visibility when component mounts
  useEffect(() => {
    setIsTemplateEditorHeaderVisible(true);
  }, []);

  // Intersection Observer for template editor header visibility
  useEffect(() => {
    const templateEditorHeaderElement = templateEditorHeaderRef.current;

    if (!templateEditorHeaderElement) {
      return;
    }

    if (!('IntersectionObserver' in window)) {
      setIsTemplateEditorHeaderVisible(true);
      return;
    }

    const rootMarginTop = "-81px"; // Adjusted to match main header height

    const observer = new window.IntersectionObserver(
      (entries) => {
        if (entries && entries.length > 0 && entries[0]) {
          const entry = entries[0];
          setIsTemplateEditorHeaderVisible(entry.isIntersecting);
        }
      },
      {
        root: null,
        rootMargin: `${rootMarginTop} 0px 0px 0px`,
        threshold: 0,
      }
    );

    observer.observe(templateEditorHeaderElement);

    return () => {
      if (templateEditorHeaderElement) {
        observer.unobserve(templateEditorHeaderElement);
      }
    };
  }, []);

  // Add scroll restoration when component mounts
  useEffect(() => {
    // Scroll to top when template editor opens
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []); // Empty dependency array means this runs once when component mounts

  const loadCustomData = async () => {
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
    }
  };

  // Symptoms functions
  const addSymptom = () => {
    const newSymptom = {
      id: Date.now().toString(),
      name: '',
      severity: 'mild',
      duration: ''
    };
    setFormData({
      ...formData,
      symptoms: [...formData.symptoms, newSymptom]
    });
  };

  const updateSymptom = (id, field, value) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.map(s => s.id === id ? { ...s, [field]: value } : s)
    });
  };

  const removeSymptom = (id) => {
    setFormData({
      ...formData,
      symptoms: formData.symptoms.filter(s => s.id !== id)
    });
  };

  // Diagnosis functions
  const addDiagnosis = () => {
    const newDiagnosis = {
      id: Date.now().toString(),
      name: '',
      description: ''
    };
    setFormData({
      ...formData,
      diagnosis: [...formData.diagnosis, newDiagnosis]
    });
  };

  const updateDiagnosis = (id, field, value) => {
    setFormData({
      ...formData,
      diagnosis: formData.diagnosis.map(d => d.id === id ? { ...d, [field]: value } : d)
    });
  };

  const removeDiagnosis = (id) => {
    setFormData({
      ...formData,
      diagnosis: formData.diagnosis.filter(d => d.id !== id)
    });
  };

  // Medication functions
  const addMedication = () => {
    const newMedication = {
      id: Date.now().toString(),
      name: '',
      timing: {
        morning: false,
        afternoon: false,
        evening: false,
        night: false
      },
      dosage: '',
      mealTiming: 'after_meal',
      duration: '',
      remarks: ''
    };
    setFormData({
      ...formData,
      medications: [...formData.medications, newMedication]
    });
  };

  const updateMedication = (id, field, value) => {
    setFormData({
      ...formData,
      medications: formData.medications.map(m => {
        if (m.id === id) {
          if (field.startsWith('timing.')) {
            const timingField = field.split('.')[1];
            return {
              ...m,
              timing: {
                ...m.timing,
                [timingField]: value
              }
            };
          }
          return { ...m, [field]: value };
        }
        return m;
      })
    });
  };

  const removeMedication = (id) => {
    setFormData({
      ...formData,
      medications: formData.medications.filter(m => m.id !== id)
    });
  };

  // Lab Results functions
  const addLabResult = () => {
    const newLabResult = {
      id: Date.now().toString(),
      testName: '',
      remarks: ''
    };
    setFormData({
      ...formData,
      labResults: [...formData.labResults, newLabResult]
    });
  };

  const updateLabResult = (id, field, value) => {
    setFormData({
      ...formData,
      labResults: formData.labResults.map(l => l.id === id ? { ...l, [field]: value } : l)
    });
  };

  const removeLabResult = (id) => {
    setFormData({
      ...formData,
      labResults: formData.labResults.filter(l => l.id !== id)
    });
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      alert('Please enter a template name');
      return;
    }

    onSave(formData);
  };

  return (
    <>
      {/* Floating header */}
      <div
        className={`fixed left-0 right-0 z-30 transition-transform duration-300 ease-in-out
          ${isTemplateEditorHeaderVisible ? '-translate-y-full' : 'translate-y-0'}
        `}
        style={{ top: '81px' }}
      >
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-5xl mx-auto px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-md font-semibold text-gray-900 dark:text-gray-100">
                  {template ? 'Edit Template' : 'Create New Template'}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={onCancel}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-4 py-2 rounded-md text-sm font-medium flex items-center space-x-2 transition-colors duration-200 cursor-pointer"
                >
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6 min-h-screen">
        {/* Header */}
        <div ref={templateEditorHeaderRef} className="template-editor-header">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onCancel}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors duration-200 cursor-pointer"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {template ? 'Edit Template' : 'Create New Template'}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={onCancel}
                  className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white dark:text-gray-900 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-colors duration-200 text-sm font-medium cursor-pointer"
                >
                  <span>Save Template</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 space-y-6">
          {/* Template Basic Info */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Template Information</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">Template Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Common Cold, Hypertension, Diabetes Follow-up"
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-800 dark:text-gray-300 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of when to use this template"
                  className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors text-sm"
                />
              </div>
            </div>
          </div>

          {/* Symptoms Section */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <PillSelector
                title="Select Symptoms"
                items={[...PREDEFINED_SYMPTOMS, ...customSymptoms]}
                onSelect={(symptom) => {
                  const newSymptom = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: symptom,
                    severity: 'mild',
                    duration: ''
                  };
                  setFormData({
                    ...formData,
                    symptoms: [...formData.symptoms, newSymptom]
                  });
                }}
                searchPlaceholder="Search symptoms..."
                onAddCustom={async (symptom) => {
                  await storage.addCustomSymptom(symptom);
                  await loadCustomData();
                  const newSymptom = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: symptom,
                    severity: 'mild',
                    duration: ''
                  };
                  setFormData({
                    ...formData,
                    symptoms: [...formData.symptoms, newSymptom]
                  });
                }}
              />

              {/* Selected symptoms with details */}
              {formData.symptoms.length > 0 && (
                <div className="space-y-0">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Selected Symptoms</h4>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.symptoms.map((symptom) => (
                      <div key={symptom.id} className="flex justify-between items-center py-4">
                        <div className="font-normal text-gray-700 dark:text-gray-400">{symptom.name}</div>
                        <div className="flex w-100 space-x-3 pl-3 items-center">
                          <CustomDropdown
                            options={SEVERITY_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
                            value={symptom.severity}
                            onChange={(value) => updateSymptom(symptom.id, 'severity', value)}
                            placeholder="Select severity"
                          />
                          <CustomDropdown
                            options={[
                              { value: '', label: 'Select duration' },
                              ...DURATION_OPTIONS.map(duration => ({ value: duration, label: duration }))
                            ]}
                            value={symptom.duration}
                            onChange={(value) => updateSymptom(symptom.id, 'duration', value)}
                            placeholder="Select duration"
                          />
                          <button
                            onClick={() => removeSymptom(symptom.id)}
                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Diagnosis Section */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <PillSelector
                title="Select Diagnosis"
                items={[...PREDEFINED_DIAGNOSES, ...customDiagnoses]}
                onSelect={(diagnosis) => {
                  const newDiagnosis = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: diagnosis,
                    description: ''
                  };
                  setFormData({
                    ...formData,
                    diagnosis: [...formData.diagnosis, newDiagnosis]
                  });
                }}
                searchPlaceholder="Search diagnoses..."
                onAddCustom={async (diagnosis) => {
                  await storage.addCustomDiagnosis(diagnosis);
                  await loadCustomData();
                  const newDiagnosis = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: diagnosis,
                    description: ''
                  };
                  setFormData({
                    ...formData,
                    diagnosis: [...formData.diagnosis, newDiagnosis]
                  });
                }}
              />

              {/* Selected diagnoses with details */}
              {formData.diagnosis.length > 0 && (
                <div className="space-y-0">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Selected Diagnoses</h4>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.diagnosis.map((diagnosis) => (
                      <div key={diagnosis.id} className="flex justify-between items-center py-4">
                        <div className="font-normal text-gray-700 dark:text-gray-400">{diagnosis.name}</div>
                        <div className="flex w-100 space-x-3 pl-3 items-center">
                          <input
                            type="text"
                            placeholder="Description (optional)"
                            value={diagnosis.description}
                            onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                            className="text-sm w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                          />
                          <button
                            onClick={() => removeDiagnosis(diagnosis.id)}
                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Medications Section */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">

              <MedicationSelector
                onSelect={(medication) => {
                  const newMedication = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: medication,
                    timing: {
                      morning: false,
                      afternoon: false,
                      evening: false,
                      night: false
                    },
                    dosage: '',
                    mealTiming: 'after_meal',
                    duration: '',
                    remarks: ''
                  };
                  setFormData({
                    ...formData,
                    medications: [...formData.medications, newMedication]
                  });
                }}
                onAddCustom={async (medication) => {
                  await storage.addCustomMedication(medication);
                  await loadCustomData();
                  const newMedication = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    name: medication,
                    timing: {
                      morning: false,
                      afternoon: false,
                      evening: false,
                      night: false
                    },
                    dosage: '',
                    mealTiming: 'after_meal',
                    duration: '',
                    remarks: ''
                  };
                  setFormData({
                    ...formData,
                    medications: [...formData.medications, newMedication]
                  });
                }}
              />

              {/* Selected medications with details */}
              {formData.medications.length > 0 && (
                <div className="space-y-0">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Selected Medications</h4>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.medications.map((medication) => (
                      <div key={medication.id} className="py-4 space-y-3.5">
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-center">
                          <div className="font-normal text-gray-700 dark:text-gray-400">{medication.name}</div>

                          <div className="col-span-1 sm:col-span-4 flex items-center space-x-2.5 justify-center sm:justify-start">
                            {Object.entries(medication.timing).map(([key, value]) => (
                              <div key={key} className="flex flex-col items-center space-y-1">
                                <button
                                  type="button"
                                  onClick={() => updateMedication(medication.id, `timing.${key}`, !value)}
                                  className={`w-7 h-7 rounded-md border-1 transition-all duration-200 flex items-center justify-center cursor-pointer ${value
                                    ? 'border-blue-400 bg-blue-100 dark:bg-gray-900'
                                    : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                                    }`}
                                >
                                  {value && (
                                    <div className="w-5 h-5 bg-blue-400 rounded-sm"></div>
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>

                          <button
                            onClick={() => removeMedication(medication.id)}
                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors sm:justify-self-end cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Dosage (e.g., 500mg)"
                            value={medication.dosage}
                            onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                            className="text-sm w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                          />
                          <CustomDropdown
                            options={MEDICATION_TIMING.map(option => ({ value: option.value, label: option.label }))}
                            value={medication.mealTiming}
                            onChange={(value) => updateMedication(medication.id, 'mealTiming', value)}
                            placeholder="Select meal timing"
                          />
                          <CustomDropdown
                            options={[
                              { value: '', label: 'Select duration' },
                              ...MEDICATION_DURATION_OPTIONS.map(duration => ({ value: duration, label: duration }))
                            ]}
                            value={medication.duration}
                            onChange={(value) => updateMedication(medication.id, 'duration', value)}
                            placeholder="Select duration"
                          />
                          <input
                            type="text"
                            placeholder="Remarks"
                            value={medication.remarks}
                            onChange={(e) => updateMedication(medication.id, 'remarks', e.target.value)}
                            className="text-sm w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lab Results Section */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              <PillSelector
                title="Select Lab Tests"
                items={[...PREDEFINED_LAB_TESTS, ...customLabTests]}
                onSelect={(labTest) => {
                  const newLabResult = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    testName: labTest,
                    remarks: ''
                  };
                  setFormData({
                    ...formData,
                    labResults: [...formData.labResults, newLabResult]
                  });
                }}
                searchPlaceholder="Search lab tests..."
                onAddCustom={async (labTest) => {
                  await storage.addCustomLabTest(labTest);
                  await loadCustomData();
                  const newLabResult = {
                    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                    testName: labTest,
                    remarks: ''
                  };
                  setFormData({
                    ...formData,
                    labResults: [...formData.labResults, newLabResult]
                  });
                }}
              />

              {/* Selected lab results */}
              {formData.labResults.length > 0 && (
                <div className="space-y-0">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">Selected Lab Tests</h4>
                  <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {formData.labResults.map((lab) => (
                      <div key={lab.id} className="flex justify-between items-center py-4">
                        <div className="font-normal text-gray-700 dark:text-gray-400">{lab.testName}</div>
                        <div className="flex w-100 space-x-3 pl-3 items-center">
                          <input
                            type="text"
                            placeholder="Remarks (optional)"
                            value={lab.remarks || ''}
                            onChange={(e) => updateLabResult(lab.id, 'remarks', e.target.value)}
                            className="text-sm w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors h-11"
                          />
                          <button
                            onClick={() => removeLabResult(lab.id)}
                            className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Doctor Notes and Advice */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Doctor's Notes</h3>
              <textarea
                value={formData.doctorNotes}
                onChange={(e) => setFormData({ ...formData, doctorNotes: e.target.value })}
                placeholder="Enter doctor's notes (one per line)"
                rows={5}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors resize-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Separate each note with a new line</p>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Advice to Patient</h3>
              <textarea
                value={formData.advice}
                onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
                placeholder="Enter advice for patient (one per line)"
                rows={5}
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-0 focus:ring-blue-500 focus:border-blue-500 dark:focus:border-blue-500 transition-colors resize-none text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">Separate each advice with a new line</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}