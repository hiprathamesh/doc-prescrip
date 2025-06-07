'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Search, Edit, Trash2, FileText, Calendar, User, Stethoscope } from 'lucide-react';
import { storage } from '../utils/storage';
import { formatDate } from '../utils/dateUtils';
import { MEDICAL_CONDITIONS, SEVERITY_OPTIONS, DURATION_OPTIONS, MEDICATION_TIMING, FREQUENCY_OPTIONS } from '../lib/constants';

export default function PrescriptionTemplates({ onBack }) {
  const [templates, setTemplates] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentView, setCurrentView] = useState('list'); // 'list' | 'create' | 'edit'
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const savedTemplates = storage.getTemplates();
    setTemplates(savedTemplates);
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.diagnosis.some(d => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateNew = () => {
    setSelectedTemplate(null);
    setCurrentView('create');
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setCurrentView('edit');
  };

  const handleDelete = (templateId) => {
    if (confirm('Are you sure you want to delete this template?')) {
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      storage.saveTemplates(updatedTemplates);
    }
  };

  const handleSaveTemplate = (templateData) => {
    const template = {
      ...templateData,
      id: selectedTemplate ? selectedTemplate.id : Date.now().toString(),
      createdAt: selectedTemplate ? selectedTemplate.createdAt : new Date(),
      updatedAt: new Date()
    };

    let updatedTemplates;
    if (selectedTemplate) {
      updatedTemplates = templates.map(t => t.id === template.id ? template : t);
    } else {
      updatedTemplates = [...templates, template];
    }

    setTemplates(updatedTemplates);
    storage.saveTemplates(updatedTemplates);
    setCurrentView('list');
    setSelectedTemplate(null);
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
            <h1 className="text-3xl font-bold text-gray-900">Prescription Templates</h1>
            <p className="text-gray-600 mt-1">Manage your common prescription templates</p>
          </div>
        </div>
        <button
          onClick={handleCreateNew}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Template</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="max-w-2xl">
        <div className="relative">
          <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search templates by name, description, or diagnosis..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg shadow-lg"
          />
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{template.name}</h3>
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Template Preview */}
              <div className="space-y-3">
                {/* Symptoms */}
                {template.symptoms?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>Symptoms</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {template.symptoms.slice(0, 2).map((symptom, index) => (
                        <span key={index} className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                          {symptom.name}
                        </span>
                      ))}
                      {template.symptoms.length > 2 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{template.symptoms.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Diagnosis */}
                {template.diagnosis?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                      <Stethoscope className="w-3 h-3" />
                      <span>Diagnosis</span>
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {template.diagnosis.slice(0, 2).map((diag, index) => (
                        <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {diag.name}
                        </span>
                      ))}
                      {template.diagnosis.length > 2 && (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                          +{template.diagnosis.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Medications */}
                {template.medications?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 mb-1 flex items-center space-x-1">
                      <FileText className="w-3 h-3" />
                      <span>Medications</span>
                    </h4>
                    <div className="text-xs text-gray-600">
                      {template.medications.slice(0, 2).map((med, index) => (
                        <div key={index} className="truncate">• {med.name} - {med.dosage}</div>
                      ))}
                      {template.medications.length > 2 && (
                        <div className="text-gray-500">+{template.medications.length - 2} more medications</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Meta info */}
                <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs text-gray-500">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(template.createdAt)}</span>
                  </span>
                  <span>{template.medications?.length || 0} meds</span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-6">
              {searchTerm ? 'No templates match your search.' : 'Create your first prescription template to get started.'}
            </p>
            {!searchTerm && (
              <button
                onClick={handleCreateNew}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span className="font-medium">Create Template</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
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
      dosage: '',
      timing: 'after_meal',
      frequency: '',
      duration: ''
    };
    setFormData({
      ...formData,
      medications: [...formData.medications, newMedication]
    });
  };

  const updateMedication = (id, field, value) => {
    setFormData({
      ...formData,
      medications: formData.medications.map(m => m.id === id ? { ...m, [field]: value } : m)
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
      testName: ''
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {template ? 'Edit Template' : 'Create New Template'}
          </h1>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <span className="font-medium">Save Template</span>
          </button>
        </div>
      </div>

      {/* Template Basic Info */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Template Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Template Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Common Cold, Hypertension, Diabetes Follow-up"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of when to use this template"
              className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Symptoms Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Symptoms</h3>
          <button
            onClick={addSymptom}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Symptom</span>
          </button>
        </div>
        <div className="space-y-4">
          {formData.symptoms.map((symptom) => (
            <div key={symptom.id} className="grid grid-cols-4 gap-4 items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="text"
                placeholder="Symptom name"
                value={symptom.name}
                onChange={(e) => updateSymptom(symptom.id, 'name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <select
                value={symptom.severity}
                onChange={(e) => updateSymptom(symptom.id, 'severity', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {SEVERITY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={symptom.duration}
                onChange={(e) => updateSymptom(symptom.id, 'duration', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Select duration</option>
                {DURATION_OPTIONS.map(duration => (
                  <option key={duration} value={duration}>{duration}</option>
                ))}
              </select>
              <button
                onClick={() => removeSymptom(symptom.id)}
                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors justify-self-end"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.symptoms.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No symptoms added yet. Click "Add Symptom" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Diagnosis Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Diagnosis</h3>
          <button
            onClick={addDiagnosis}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Diagnosis</span>
          </button>
        </div>
        <div className="space-y-4">
          {formData.diagnosis.map((diagnosis) => (
            <div key={diagnosis.id} className="grid grid-cols-3 gap-4 items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="text"
                placeholder="Diagnosis name"
                value={diagnosis.name}
                onChange={(e) => updateDiagnosis(diagnosis.id, 'name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={diagnosis.description}
                onChange={(e) => updateDiagnosis(diagnosis.id, 'description', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => removeDiagnosis(diagnosis.id)}
                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors justify-self-end"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.diagnosis.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No diagnosis added yet. Click "Add Diagnosis" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Medications Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Medications</h3>
          <button
            onClick={addMedication}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medication</span>
          </button>
        </div>
        <div className="space-y-4">
          {formData.medications.map((medication) => (
            <div key={medication.id} className="grid grid-cols-6 gap-4 items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="text"
                placeholder="Medication name"
                value={medication.name}
                onChange={(e) => updateMedication(medication.id, 'name', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <input
                type="text"
                placeholder="Dosage"
                value={medication.dosage}
                onChange={(e) => updateMedication(medication.id, 'dosage', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <select
                value={medication.timing}
                onChange={(e) => updateMedication(medication.id, 'timing', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                {MEDICATION_TIMING.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
              <select
                value={medication.frequency}
                onChange={(e) => updateMedication(medication.id, 'frequency', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="">Frequency</option>
                {FREQUENCY_OPTIONS.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Duration"
                value={medication.duration}
                onChange={(e) => updateMedication(medication.id, 'duration', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => removeMedication(medication.id)}
                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors justify-self-end"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.medications.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No medications added yet. Click "Add Medication" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Lab Results Section */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Lab Results</h3>
          <button
            onClick={addLabResult}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-xl flex items-center space-x-2 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lab Test</span>
          </button>
        </div>
        <div className="space-y-4">
          {formData.labResults.map((lab) => (
            <div key={lab.id} className="grid grid-cols-2 gap-4 items-center p-4 bg-gray-50 rounded-xl">
              <input
                type="text"
                placeholder="Test name"
                value={lab.testName}
                onChange={(e) => updateLabResult(lab.id, 'testName', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
              <button
                onClick={() => removeLabResult(lab.id)}
                className="text-red-600 hover:text-red-800 p-2 hover:bg-red-50 rounded-lg transition-colors justify-self-end"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {formData.labResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>No lab tests added yet. Click "Add Lab Test" to start.</p>
            </div>
          )}
        </div>
      </div>

      {/* Doctor Notes and Advice */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Doctor's Notes</h3>
          <textarea
            value={formData.doctorNotes}
            onChange={(e) => setFormData({ ...formData, doctorNotes: e.target.value })}
            placeholder="Enter doctor's notes (one per line)"
            rows={6}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">Separate each note with a new line</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Advice to Patient</h3>
          <textarea
            value={formData.advice}
            onChange={(e) => setFormData({ ...formData, advice: e.target.value })}
            placeholder="Enter advice for patient (one per line)"
            rows={6}
            className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
          />
          <p className="text-sm text-gray-500 mt-2">Separate each advice with a new line</p>
        </div>
      </div>
    </div>
  );
}