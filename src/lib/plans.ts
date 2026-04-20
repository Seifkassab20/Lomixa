import { CountryCode, convertCurrency } from './currency';

export interface SubscriptionPlan {
  id: '1_month' | '3_months' | '12_months';
  name: string;
  durationMonths: number;
  basePriceEGP: number; // Egypt base price as specified by the user
  features: string[];
}

export const REP_PLANS: SubscriptionPlan[] = [
  {
    id: '1_month',
    name: 'Standard Monthly',
    durationMonths: 1,
    basePriceEGP: 149,
    features: [
      'Full App Access',
      'Advanced Doctor Search',
      'Visit Scheduling',
      'Basic Performance Reports',
      'Mobile Accessibility'
    ]
  },
  {
    id: '3_months',
    name: 'Quarterly Booster',
    durationMonths: 3,
    basePriceEGP: 379,
    features: [
      'All Standard Features',
      'Priority Support',
      'Area Coverage Analytics',
      'Custom Visit Outcomes',
      'Data Export (PDF/Excel)'
    ]
  },
  {
    id: '12_months',
    name: 'Annual Professional',
    durationMonths: 12,
    basePriceEGP: 1249,
    features: [
      'All Quarterly Features',
      'Best Value Savings',
      'Advanced CRM Dashboard',
      'Unlimited Historical Data',
      'New Features Preview'
    ]
  }
];

export function getPriceForCountry(planId: string, countryCode: CountryCode): number {
  const plan = REP_PLANS.find(p => p.id === planId);
  if (!plan) return 0;
  
  // Convert from EGP base (egypt/eg) to the target country currency
  return convertCurrency(plan.basePriceEGP, 'eg', countryCode);
}
