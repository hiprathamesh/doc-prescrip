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
  }
};