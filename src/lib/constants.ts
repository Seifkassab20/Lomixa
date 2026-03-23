export const ARABIC_COUNTRY_CODES = [
  { code: '+966', country: 'KSA', flag: '🇸🇦' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+20', country: 'EGY', flag: '🇪🇬' },
  { code: '+965', country: 'KWT', flag: '🇰🇼' },
  { code: '+974', country: 'QAT', flag: '🇶🇦' },
  { code: '+968', country: 'OMN', flag: '🇴🇲' },
  { code: '+973', country: 'BHR', flag: '🇧🇭' },
  { code: '+962', country: 'JOR', flag: '🇯🇴' },
  { code: '+964', country: 'IRQ', flag: '🇮🇶' },
  { code: '+218', country: 'LBY', flag: '🇱🇾' },
  { code: '+961', country: 'LBN', flag: '🇱🇧' },
  { code: '+963', country: 'SYR', flag: '🇸🇾' },
  { code: '+212', country: 'MAR', flag: '🇲🇦' },
  { code: '+213', country: 'DZA', flag: '🇩🇿' },
  { code: '+216', country: 'TUN', flag: '🇹🇳' },
  { code: '+249', country: 'SDN', flag: '🇸🇩' },
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
