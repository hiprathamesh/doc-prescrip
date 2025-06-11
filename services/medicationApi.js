// Free APIs for medication data
const MEDICATION_APIS = {
  // OpenFDA API (Free, comprehensive US drug database)
  openFDA: 'https://api.fda.gov/drug/label.json',
  
  // DrugBank API (Requires registration but has free tier)
  drugBank: 'https://go.drugbank.com/api/v1',
  
  // RxNav API (Free NIH service)
  rxNav: 'https://rxnav.nlm.nih.gov/REST'
};

// Indian drug database (you might want to use this for Indian medications)
const INDIAN_DRUG_API = 'https://api.fda.gov/drug/ndc.json';

class MedicationApiService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Search medications using OpenFDA API
  async searchMedicationsOpenFDA(query, limit = 20) {
    try {
      const cacheKey = `openfda_${query}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const response = await fetch(
        `${MEDICATION_APIS.openFDA}?search=openfda.brand_name:"${encodeURIComponent(query)}"&limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('OpenFDA API request failed');
      }

      const data = await response.json();
      const medications = data.results?.map(result => ({
        name: result.openfda?.brand_name?.[0] || result.openfda?.generic_name?.[0] || 'Unknown',
        genericName: result.openfda?.generic_name?.[0] || '',
        manufacturer: result.openfda?.manufacturer_name?.[0] || '',
        dosageForm: result.dosage_form?.[0] || '',
        strength: result.openfda?.substance_name?.join(', ') || '',
        source: 'OpenFDA'
      })) || [];

      // Cache the result
      this.cache.set(cacheKey, {
        data: medications,
        timestamp: Date.now()
      });

      return medications;
    } catch (error) {
      console.error('OpenFDA API error:', error);
      return [];
    }
  }

  // Search medications using RxNav API (NIH)
  async searchMedicationsRxNav(query, limit = 20) {
    try {
      const cacheKey = `rxnav_${query}`;
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheExpiry) {
          return cached.data;
        }
      }

      const response = await fetch(
        `${MEDICATION_APIS.rxNav}/drugs.json?name=${encodeURIComponent(query)}`
      );
      
      if (!response.ok) {
        throw new Error('RxNav API request failed');
      }

      const data = await response.json();
      const medications = data.drugGroup?.conceptGroup?.flatMap(group => 
        group.conceptProperties?.slice(0, limit).map(concept => ({
          name: concept.name,
          rxcui: concept.rxcui,
          synonym: concept.synonym || '',
          source: 'RxNav'
        })) || []
      ) || [];

      // Cache the result
      this.cache.set(cacheKey, {
        data: medications,
        timestamp: Date.now()
      });

      return medications;
    } catch (error) {
      console.error('RxNav API error:', error);
      return [];
    }
  }

  // Combined search function with fallback
  async searchMedications(query, limit = 20) {
    if (!query || query.length < 2) return [];

    try {
      // Try multiple APIs in parallel
      const [openFDAResults, rxNavResults] = await Promise.allSettled([
        this.searchMedicationsOpenFDA(query, limit),
        this.searchMedicationsRxNav(query, limit)
      ]);

      let allMedications = [];

      if (openFDAResults.status === 'fulfilled' && Array.isArray(openFDAResults.value)) {
        allMedications.push(...openFDAResults.value);
      }

      if (rxNavResults.status === 'fulfilled' && Array.isArray(rxNavResults.value)) {
        allMedications.push(...rxNavResults.value);
      }

      // Remove duplicates based on name
      const uniqueMedications = allMedications.filter((med, index, self) =>
        index === self.findIndex(m => m.name && med.name && m.name.toLowerCase() === med.name.toLowerCase())
      );

      return uniqueMedications.slice(0, limit);
    } catch (error) {
      console.error('Medication search error:', error);
      return [];
    }
  }

  // Get medication details
  async getMedicationDetails(medicationName) {
    try {
      const response = await fetch(
        `${MEDICATION_APIS.openFDA}?search=openfda.brand_name:"${encodeURIComponent(medicationName)}"&limit=1`
      );
      
      if (!response.ok) {
        throw new Error('Failed to get medication details');
      }

      const data = await response.json();
      const result = data.results?.[0];
      
      if (!result) return null;

      return {
        name: result.openfda?.brand_name?.[0] || medicationName,
        genericName: result.openfda?.generic_name?.[0] || '',
        manufacturer: result.openfda?.manufacturer_name?.[0] || '',
        dosageForm: result.dosage_form?.[0] || '',
        strength: result.openfda?.substance_name?.join(', ') || '',
        indications: result.indications_and_usage?.[0] || '',
        dosage: result.dosage_and_administration?.[0] || '',
        warnings: result.warnings?.[0] || '',
        sideEffects: result.adverse_reactions?.[0] || ''
      };
    } catch (error) {
      console.error('Error getting medication details:', error);
      return null;
    }
  }
}

export const medicationApiService = new MedicationApiService();