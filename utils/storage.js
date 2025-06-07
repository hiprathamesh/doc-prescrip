const STORAGE_KEYS = {
  PATIENTS: 'patients',
  PRESCRIPTIONS: 'prescriptions',
  BILLS: 'bills',
  TEMPLATES: 'prescription_templates' // Add this line
};

export const storage = {
  // Patients
  getPatients: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('patients');
    return data ? JSON.parse(data) : [];
  },

  savePatients: (patients) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('patients', JSON.stringify(patients));
  },

  // Prescriptions
  getPrescriptions: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('prescriptions');
    return data ? JSON.parse(data) : [];
  },

  savePrescriptions: (prescriptions) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('prescriptions', JSON.stringify(prescriptions));
  },

  getPrescriptionsByPatient: (patientId) => {
    const prescriptions = storage.getPrescriptions();
    return prescriptions.filter(p => p.patientId === patientId);
  },

  // Bills
  getBills: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('bills');
    return data ? JSON.parse(data) : [];
  },

  saveBills: (bills) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('bills', JSON.stringify(bills));
  },

  getBillsByPatient: (patientId) => {
    const bills = storage.getBills();
    return bills.filter(b => b.patientId === patientId);
  },

  // Template methods
  getTemplates: () => {
    if (typeof window === 'undefined') return [];
    const templates = localStorage.getItem(STORAGE_KEYS.TEMPLATES);
    return templates ? JSON.parse(templates) : [];
  },

  saveTemplates: (templates) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
  },

  getTemplate: (id) => {
    const templates = storage.getTemplates();
    return templates.find(template => template.id === id) || null;
  },

  // Custom Symptoms and Diagnoses
  getCustomSymptoms: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('custom_symptoms');
    return data ? JSON.parse(data) : [];
  },

  saveCustomSymptoms: (symptoms) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('custom_symptoms', JSON.stringify(symptoms));
  },

  addCustomSymptom: (symptom) => {
    const symptoms = storage.getCustomSymptoms();
    if (!symptoms.includes(symptom)) {
      symptoms.push(symptom);
      storage.saveCustomSymptoms(symptoms);
    }
  },

  getCustomDiagnoses: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('custom_diagnoses');
    return data ? JSON.parse(data) : [];
  },

  saveCustomDiagnoses: (diagnoses) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('custom_diagnoses', JSON.stringify(diagnoses));
  },

  addCustomDiagnosis: (diagnosis) => {
    const diagnoses = storage.getCustomDiagnoses();
    if (!diagnoses.includes(diagnosis)) {
      diagnoses.push(diagnosis);
      storage.saveCustomDiagnoses(diagnoses);
    }
  },

  // Custom Lab Tests
  getCustomLabTests: () => {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem('custom_lab_tests');
    return data ? JSON.parse(data) : [];
  },

  saveCustomLabTests: (labTests) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('custom_lab_tests', JSON.stringify(labTests));
  },

  addCustomLabTest: (labTest) => {
    const labTests = storage.getCustomLabTests();
    if (!labTests.includes(labTest)) {
      labTests.push(labTest);
      storage.saveCustomLabTests(labTests);
    }
  },
};