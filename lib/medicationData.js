export const COMMON_MEDICATIONS = [
  // Pain Relief & Anti-inflammatory
  'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Naproxen', 'Diclofenac', 'Tramadol', 'Morphine', 'Codeine',
  'Paracetamol', 'Combiflam', 'Voveran', 'Zerodol', 'Dolo 650', 'Crocin', 'Brufen', 'Flexon',
  
  // Antibiotics
  'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Penicillin', 'Cephalexin', 'Levofloxacin',
  'Metronidazole', 'Clarithromycin', 'Ampicillin', 'Erythromycin', 'Tetracycline', 'Augmentin', 'Azee',
  'Norflox', 'Ofloxacin', 'Cefixime', 'Clindamycin', 'Roxithromycin', 'Sparfloxacin',
  
  // Cardiovascular
  'Amlodipine', 'Lisinopril', 'Metoprolol', 'Atorvastatin', 'Losartan', 'Carvedilol', 'Simvastatin',
  'Enalapril', 'Propranolol', 'Diltiazem', 'Verapamil', 'Digoxin', 'Warfarin', 'Clopidogrel',
  'Amlokind', 'Telma', 'Ecosprin', 'Rosuvastatin', 'Olmesartan', 'Telmisartan',
  
  // Diabetes Management
  'Metformin', 'Insulin', 'Glipizide', 'Glyburide', 'Pioglitazone', 'Sitagliptin', 'Glimepiride',
  'Januvia', 'Glimpiride', 'Gliclazide', 'Repaglinide', 'Voglibose',
  
  // Respiratory
  'Albuterol', 'Prednisone', 'Montelukast', 'Fluticasone', 'Budesonide', 'Theophylline',
  'Salbutamol', 'Asthalin', 'Levolin', 'Budecort', 'Foracort', 'Deriphyllin',
  
  // Gastrointestinal
  'Omeprazole', 'Pantoprazole', 'Ranitidine', 'Ondansetron', 'Loperamide', 'Simethicone',
  'Pan D', 'Rablet', 'Rantac', 'Gelusil', 'ENO', 'Cyclopam', 'Aristozyme', 'Digene',
  'Esomeprazole', 'Lansoprazole', 'Domperidone', 'Famotidine',
  
  // Mental Health & Neurological
  'Sertraline', 'Fluoxetine', 'Escitalopram', 'Paroxetine', 'Lorazepam', 'Alprazolam', 'Diazepam',
  'Clonazepam', 'Gabapentin', 'Pregabalin', 'Phenytoin', 'Carbamazepine',
  
  // Vitamins & Supplements
  'Becosules', 'Shelcal', 'Evion', 'Limcee', 'Neurobion', 'Folic Acid', 'Iron Tablets',
  'Vitamin D3', 'Calcium Carbonate', 'Multivitamin', 'Omega 3', 'Zinc Tablets',
  
  // Liver Support
  'Liv 52', 'Udiliv', 'Hepamerz', 'Silymarin',
  
  // Antihistamines & Allergies
  'Cetirizine', 'Loratadine', 'Fexofenadine', 'Chlorpheniramine', 'Allegra', 'Zyrtec',
  
  // Antifungals
  'Fluconazole', 'Ketoconazole', 'Itraconazole', 'Terbinafine',
  
  // Cough & Cold
  'Dextromethorphan', 'Bromhexine', 'Ambroxol', 'Alex', 'Benadryl', 'Chericof',
  
  // Topical Applications
  'Betnovate', 'Soframycin', 'Neosporin', 'Thrombophob', 'Diclofenac Gel', 'Volini'
];

export const MEDICATION_CATEGORIES = {
  'Pain Relief': [
    'Acetaminophen', 'Ibuprofen', 'Aspirin', 'Naproxen', 'Diclofenac', 'Tramadol', 
    'Paracetamol', 'Combiflam', 'Voveran', 'Zerodol', 'Dolo 650', 'Crocin', 'Brufen', 'Flexon'
  ],
  'Antibiotics': [
    'Amoxicillin', 'Azithromycin', 'Ciprofloxacin', 'Doxycycline', 'Penicillin', 'Cephalexin',
    'Augmentin', 'Azee', 'Norflox', 'Ofloxacin', 'Cefixime', 'Clindamycin', 'Roxithromycin'
  ],
  'Cardiovascular': [
    'Amlodipine', 'Lisinopril', 'Metoprolol', 'Atorvastatin', 'Losartan', 'Carvedilol',
    'Amlokind', 'Telma', 'Ecosprin', 'Rosuvastatin', 'Olmesartan', 'Telmisartan'
  ],
  'Diabetes': [
    'Metformin', 'Insulin', 'Glipizide', 'Glyburide', 'Pioglitazone', 'Sitagliptin',
    'Januvia', 'Glimpiride', 'Gliclazide', 'Repaglinide', 'Voglibose'
  ],
  'Respiratory': [
    'Albuterol', 'Prednisone', 'Montelukast', 'Fluticasone', 'Budesonide',
    'Salbutamol', 'Asthalin', 'Levolin', 'Budecort', 'Foracort', 'Deriphyllin'
  ],
  'Gastrointestinal': [
    'Omeprazole', 'Pantoprazole', 'Ranitidine', 'Ondansetron', 'Loperamide',
    'Pan D', 'Rablet', 'Rantac', 'Gelusil', 'ENO', 'Cyclopam', 'Aristozyme'
  ],
  'Mental Health': [
    'Sertraline', 'Fluoxetine', 'Escitalopram', 'Paroxetine', 'Lorazepam',
    'Alprazolam', 'Diazepam', 'Clonazepam', 'Gabapentin', 'Pregabalin'
  ],
  'Vitamins & Supplements': [
    'Becosules', 'Shelcal', 'Evion', 'Limcee', 'Neurobion', 'Folic Acid',
    'Vitamin D3', 'Calcium Carbonate', 'Multivitamin', 'Omega 3', 'Zinc Tablets'
  ],
  'Liver Support': ['Liv 52', 'Udiliv', 'Hepamerz', 'Silymarin'],
  'Antihistamines': ['Cetirizine', 'Loratadine', 'Fexofenadine', 'Allegra', 'Zyrtec'],
  'Antifungals': ['Fluconazole', 'Ketoconazole', 'Itraconazole', 'Terbinafine'],
  'Cough & Cold': ['Dextromethorphan', 'Bromhexine', 'Ambroxol', 'Alex', 'Benadryl', 'Chericof'],
  'Topical': ['Betnovate', 'Soframycin', 'Neosporin', 'Thrombophob', 'Diclofenac Gel', 'Volini']
};