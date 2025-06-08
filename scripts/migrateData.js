/**
 * Data migration script to move localStorage data to MongoDB Atlas
 * Run this once to migrate existing data
 */

// This should be run in the browser console on your existing site
function migrateLocalStorageToMongoDB() {
  const localData = {
    patients: JSON.parse(localStorage.getItem('patients') || '[]'),
    prescriptions: JSON.parse(localStorage.getItem('prescriptions') || '[]'),
    bills: JSON.parse(localStorage.getItem('bills') || '[]'),
    templates: JSON.parse(localStorage.getItem('prescription_templates') || '[]'),
    customSymptoms: JSON.parse(localStorage.getItem('custom_symptoms') || '[]'),
    customDiagnoses: JSON.parse(localStorage.getItem('custom_diagnoses') || '[]'),
    customLabTests: JSON.parse(localStorage.getItem('custom_lab_tests') || '[]'),
    customMedications: JSON.parse(localStorage.getItem('custom_medications') || '[]')
  };

  console.log('Local data to migrate:', localData);
  
  // You would then manually save this data through your new MongoDB-enabled site
  // Or create an API endpoint specifically for migration
  
  return localData;
}

// Run this in browser console to see your localStorage data
// migrateLocalStorageToMongoDB();