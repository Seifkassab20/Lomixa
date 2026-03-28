export const ARABIC_COUNTRY_CODES = [
  { code: '+966', countryId: 'sa', country: 'KSA', flag: '🇸🇦' },
  { code: '+971', countryId: 'uae', country: 'UAE', flag: '🇦🇪' },
  { code: '+20', countryId: 'egypt', country: 'EGY', flag: '🇪🇬' },
  { code: '+965', countryId: 'kw', country: 'KWT', flag: '🇰🇼' },
  { code: '+974', countryId: 'qa', country: 'QAT', flag: '🇶🇦' },
  { code: '+968', countryId: 'om', country: 'OMN', flag: '🇴🇲' },
  { code: '+973', countryId: 'bh', country: 'BHR', flag: '🇧🇭' },
  { code: '+962', countryId: 'jo', country: 'JOR', flag: '🇯🇴' },
  { code: '+964', countryId: 'iq', country: 'IRQ', flag: '🇮🇶' },
  { code: '+218', countryId: 'ly', country: 'LBY', flag: '🇱🇾' },
];

export const COUNTRIES = [
  { id: 'sa', name: 'Saudi Arabia' },
  { id: 'uae', name: 'United Arab Emirates' },
  { id: 'egypt', name: 'Egypt' },
  { id: 'kw', name: 'Kuwait' },
  { id: 'qa', name: 'Qatar' },
  { id: 'om', name: 'Oman' },
  { id: 'bh', name: 'Bahrain' },
  { id: 'jo', name: 'Jordan' },
  { id: 'iq', name: 'Iraq' },
  { id: 'ly', name: 'Libya' }
];

export const CITY_MAP: Record<string, string[]> = {
  sa: ['Riyadh', 'Jeddah', 'Dammam', 'Makkah', 'Medina', 'Buraidah', 'Tabuk', 'Abha', 'Khobar', 'Hofuf'],
  uae: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah'],
  egypt: ['Cairo', 'Alexandria', 'Giza', 'Mansoura', 'Sharm El Sheikh', 'Hurghada'],
  jo: ['Amman', 'Zarqa', 'Irbid'],
  kw: ['Kuwait City', 'Jahra', 'Hawalli', 'Salmiya'],
  om: ['Muscat', 'Salalah', 'Sohar', 'Nizwa'],
  qa: ['Doha', 'Al Wakrah', 'Al Khor', 'Al Rayyan'],
  bh: ['Manama', 'Muharraq', 'Riffa', 'Hamad Town'],
  iq: ['Baghdad', 'Erbil', 'Basra', 'Mosul', 'Sulaymaniyah', 'Najaf'],
  ly: ['Tripoli', 'Benghazi', 'Misrata', 'Bayda'],
};

export const SPECIALTIES = [
  'Cardiology', 'Neurology', 'Pediatrics', 'Oncology',
  'Orthopedics', 'Dermatology', 'Psychiatry', 'General Practice',
  'Endocrinology', 'Gastroenterology', 'Pulmonology', 'Rheumatology',
];
