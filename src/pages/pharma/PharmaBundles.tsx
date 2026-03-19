import React, { useState, useEffect } from 'react';
import { getBundles, getPharmaCompanies, savePharmaCompany, saveTransaction, generateId, pushNotification } from '@/lib/store';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Zap, Shield, Star, CheckCircle2 } from 'lucide-react';

const BUNDLE_ICONS = [Zap, Star, Shield];
const BUNDLE_COLORS = [
  { bg: 'from-slate-800 to-slate-700', accent: 'emerald', border: 'border-slate-600' },
  { bg: 'from-emerald-900 to-teal-800', accent: 'emerald', border: 'border-emerald-600' },
  { bg: 'from-violet-900 to-indigo-800', accent: 'violet', border: 'border-violet-600' },
];

export function PharmaBundles() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [credits, setCredits] = useState(0);
  const bundles = getBundles();

  useEffect(() => {
    const companies = getPharmaCompanies();
    const mine = companies.find(c => c.userId === userId);
    setCredits(mine?.credits || 0);
  }, [userId]);

  const handlePurchase = async (bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;
    setLoading(bundleId);

    // Simulate payment processing
    await new Promise(r => setTimeout(r, 1500));

    const companies = getPharmaCompanies();
    const mine = companies.find(c => c.userId === userId);
    if (mine) {
      const updated = { ...mine, credits: mine.credits + bundle.credits };
      savePharmaCompany(updated);
      setCredits(updated.credits);
      saveTransaction({
        id: generateId(),
        pharmaId: mine.id,
        bundleName: bundle.name,
        creditsAdded: bundle.credits,
        amountSAR: bundle.price,
        date: new Date().toISOString(),
      });
      if (userId) {
        pushNotification({
          userId,
          title: 'Bundle Purchased',
          message: `Successfully added ${bundle.credits} visit credits (${bundle.name} plan). Total: ${updated.credits} credits.`,
          type: 'info',
        });
      }
    }

    setLoading(null);
    setSuccess(bundleId);
    setTimeout(() => setSuccess(null), 3000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Buy Visit Bundles</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Purchase visit credits for your sales team</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-4 py-2">
          <CreditCard className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{credits.toLocaleString()} credits available</span>
        </div>
      </div>

      {/* Bundles */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {bundles.map((bundle, i) => {
          const Icon = BUNDLE_ICONS[i];
          const colors = BUNDLE_COLORS[i];
          const isPopular = i === 1;
          const isPurchasing = loading === bundle.id;
          const justBought = success === bundle.id;

          return (
            <div
              key={bundle.id}
              className={`relative bg-gradient-to-b ${colors.bg} rounded-2xl p-6 border ${colors.border} overflow-hidden transition-transform hover:-translate-y-1 hover:shadow-xl`}
            >
              {isPopular && (
                <div className="absolute top-4 right-4">
                  <Badge className="bg-emerald-500 text-white text-xs">Most Popular</Badge>
                </div>
              )}
              <div className="mb-6">
                <div className="inline-flex p-3 rounded-xl bg-white/10 mb-4">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">{bundle.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold text-white">﷼{bundle.price.toLocaleString()}</span>
                  <span className="text-white/60 text-sm">SAR</span>
                </div>
                <div className="text-emerald-300 text-sm font-medium mt-1">{bundle.credits} Visit Credits</div>
              </div>

              <ul className="space-y-3 mb-6">
                {bundle.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handlePurchase(bundle.id)}
                disabled={isPurchasing || justBought}
                className="w-full bg-white/20 hover:bg-white/30 text-white border-0 font-semibold h-11 transition-all"
              >
                {isPurchasing ? (
                  <span className="flex items-center gap-2">
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </span>
                ) : justBought ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Purchased!
                  </span>
                ) : (
                  `Purchase ${bundle.name}`
                )}
              </Button>
            </div>
          );
        })}
      </div>

      {/* Info */}
      <div className="bg-white dark:bg-slate-800/30 border dark:border-slate-700 rounded-xl p-6">
        <h2 className="text-lg font-semibold dark:text-white mb-4">How Visit Credits Work</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { step: '1', title: 'Purchase a Bundle', desc: 'Buy visit credits for your pharma company using SAR' },
            { step: '2', title: 'Assign to Reps', desc: 'Your sales representatives can use credits to book doctor visits' },
            { step: '3', title: 'Track ROI', desc: 'Monitor performance and conversion rates in your analytics dashboard' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-sm shrink-0">{step}</div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white text-sm">{title}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
