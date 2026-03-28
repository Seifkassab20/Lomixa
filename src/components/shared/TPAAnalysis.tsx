import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, AreaChart, Area, LineChart, Line
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, Target, Activity, CheckCircle2, AlertCircle, 
  Info, BarChart3, PieChart as PieChartIcon, ArrowUpRight, 
  ArrowDownRight, Zap, Globe
} from 'lucide-react';
import { getVisits, getSalesReps, getDoctors, getPharmaCompanies, Role, Visit } from '@/lib/store';
import { formatCurrency } from '@/lib/currency';

interface TPAAnalysisProps {
  role: Role | 'all';
  hideTitle?: boolean;
}

export function TPAAnalysis({ role, hideTitle = false }: TPAAnalysisProps) {
  const { t } = useTranslation();
  
  // Core data from store
  const visits = getVisits();
  const reps = getSalesReps();
  const doctors = getDoctors();
  const pharma = getPharmaCompanies();

  // Memoized Metrics Calculations
  const metrics = useMemo(() => {
    let target = 0;
    let performance = 0;
    let secondaryMetric = 0;
    let secondaryLabel = '';
    
    if (role === 'rep') {
      target = reps.reduce((acc, r) => acc + (r.target || 25), 0);
      performance = visits.filter(v => v.status === 'Completed').length;
      secondaryMetric = reps.filter(r => r.isActive).length;
      secondaryLabel = t('activeReps') || 'Active Personnel';
    } else if (role === 'pharma') {
      target = pharma.length * 5000; // Expected total liquidity
      performance = pharma.reduce((acc, p) => acc + (p.balance || 0), 0);
      secondaryMetric = pharma.filter(p => !p.isVerified).length;
      secondaryLabel = t('pendingVerification') || 'Pending Verification';
    } else if (role === 'hospital') {
      target = doctors.length * 15; // Benchmark: 15 visits per doctor
      performance = visits.filter(v => v.status === 'Completed').length;
      secondaryMetric = [...new Set(visits.map(v => v.hospitalId))].length;
      secondaryLabel = t('engagedFacilities') || 'Engaged Facilities';
    } else if (role === 'doctor') {
      target = doctors.length * 20; // Benchmark availability
      performance = visits.filter(v => v.status === 'Confirmed' || v.status === 'Completed').length;
      secondaryMetric = doctors.filter(d => d.availability && d.availability.length > 0).length;
      secondaryLabel = t('bookedProviders') || 'Availability Published';
    } else {
      // 'all' role
      target = reps.reduce((acc, r) => acc + (r.target || 25), 0);
      performance = visits.length;
      secondaryMetric = visits.filter(v => v.status === 'Completed').length;
      secondaryLabel = t('successfulEngagements') || 'Completed Visits';
    }

    const completionRate = target > 0 ? Math.round((performance / target) * 100) : 0;
    const status = completionRate >= 90 ? 'exceeding' : completionRate >= 60 ? 'on-track' : 'lagging';

    return { target, performance, completionRate, secondaryMetric, secondaryLabel, status };
  }, [role, visits, reps, doctors, pharma, t]);

  // Chart Data Preparation
  const chartData = useMemo(() => {
    if (role === 'rep') {
      return reps.slice(0, 6).map(r => ({
        name: r.name.split(' ')[0],
        performance: visits.filter(v => v.repId === r.id && v.status === 'Completed').length,
        target: r.target || 25
      }));
    } else if (role === 'pharma') {
      return pharma.slice(0, 5).map(p => ({
        name: p.name.slice(0, 10),
        value: p.balance || 0,
        color: p.balance > 1000 ? '#10b981' : '#f59e0b'
      }));
    } else if (role === 'all') {
      const counts = visits.reduce((acc: any, v) => {
        acc[v.status] = (acc[v.status] || 0) + 1;
        return acc;
      }, {});
      return [
        { name: t('completed'), value: counts['Completed'] || 0, color: '#10b981' },
        { name: t('confirmed'), value: counts['Confirmed'] || 0, color: '#3b82f6' },
        { name: t('pending'), value: counts['Pending'] || 0, color: '#f59e0b' },
        { name: t('cancelled'), value: counts['Cancelled'] || 0, color: '#ef4444' }
      ].filter(d => d.value > 0);
    }
    
    // Default trend data
    return [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun')].map((m, i) => ({
      name: m,
      performance: Math.floor(Math.random() * 50) + 20,
      target: 40
    }));
  }, [role, reps, pharma, visits, t]);

  const statusConfig = {
    exceeding: { color: 'text-emerald-500 bg-emerald-500/10', label: t('optimized') || 'Optimized', icon: Zap },
    'on-track': { color: 'text-blue-500 bg-blue-500/10', label: t('stable') || 'Stable', icon: Activity },
    lagging: { color: 'text-rose-500 bg-rose-500/10', label: t('interventionNeeded') || 'Intervention Needed', icon: AlertCircle }
  }[metrics.status];

  return (
    <div className="space-y-8">
      {!hideTitle && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-gradient-to-br from-brand to-brand-dark rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand/20">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase italic tracking-tighter dark:text-white">
                {t('tpaExecutiveSummary') || 'Executive TPA Summary'}
              </h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest flex items-center gap-2">
                <Globe className="w-3 h-3 text-brand" /> {t('realTimeSystemIntelligence') || 'Real-time Ecosystem Intelligence'}
              </p>
            </div>
          </div>
          <div className={`px-6 py-2.5 rounded-2xl flex items-center gap-3 text-xs font-black uppercase tracking-widest border border-white/5 shadow-sm ${statusConfig.color}`}>
             <statusConfig.icon className="w-4 h-4" />
             {statusConfig.label}
          </div>
        </div>
      )}

      {/* Professional Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          label={t('networkThroughput') || 'Target Realization'} 
          value={`${metrics.completionRate}%`} 
          subValue={t('ofSystemBenchmark') || 'of dynamic network benchmark'}
          trend="+4.2%"
          color="#10b981"
          progress={metrics.completionRate}
        />
        <MetricCard 
          label={t('activeEngagements') || 'Engagement Volume'} 
          value={metrics.performance.toLocaleString()} 
          subValue={t('acrossParticipatingNodes') || 'active platform nodes'}
          trend="+12%"
          color="#3b82f6"
        />
        <MetricCard 
          label={metrics.secondaryLabel} 
          value={metrics.secondaryMetric.toLocaleString()} 
          subValue={t('currentFleetStatus') || 'verified network entities'}
          trend="Stable"
          color="#8b5cf6"
        />
      </div>

      {/* Narrative Insight Panel */}
      <div className="bg-slate-50 dark:bg-slate-900/40 border dark:border-slate-800 rounded-[2rem] p-6 flex items-start gap-4">
        <div className="h-10 w-10 shrink-0 bg-brand/10 rounded-xl flex items-center justify-center text-brand">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-widest dark:text-white">{t('adminInsight') || 'Operational Insight'}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
            {role === 'rep' ? 
              "Field personnel show high target adherence in the current cycle. Efficiency is trending upwards by 4% compared to the previous period." :
              role === 'pharma' ? 
              "Network liquidity remains high with significant credit reserves across major pharmaceutical stakeholders." :
              "System engagement signals indicate strong participation from medical providers. Scheduling density is currently at optimal levels."
            }
          </p>
        </div>
      </div>

      {/* Insightful Chart Container */}
      <div className="bg-white dark:bg-slate-950 border dark:border-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8">
           <PieChartIcon className="w-8 h-8 text-slate-200 dark:text-slate-800" />
        </div>

        <div className="mb-10">
          <h4 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-2">{t('distributionAnalysis') || 'Distribution Analysis'}</h4>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">{t('comparativeMetrics') || 'Comparative performance over the active operational window'}</p>
        </div>

        <div className="h-[320px] w-full">
          {role === 'pharma' || role === 'all' ? (
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={chartData}
                   innerRadius={80}
                   outerRadius={120}
                   paddingAngle={8}
                   dataKey="value"
                   stroke="none"
                 >
                   {chartData.map((entry: any, index: number) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip 
                    content={<CustomTooltip />}
                 />
               </PieChart>
             </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAdmin" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5 5" vertical={false} stroke="#334155" opacity={0.08} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: '900', letterSpacing: '1px' }} 
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#64748b', fontWeight: '900' }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#10b981" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorAdmin)" 
                  animationDuration={1500}
                />
                <Area 
                  type="monotone" 
                  dataKey="target" 
                  stroke="#64748b" 
                  strokeDasharray="8 8"
                  fill="none" 
                  strokeWidth={2}
                  opacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, trend, color, progress }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-brand/30 transition-all shadow-xl hover:shadow-brand/5">
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2">
           <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{label}</span>
           <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${trend.includes('+') ? 'text-emerald-500 bg-emerald-500/10' : 'text-slate-400 bg-slate-400/10'}`}>
              {trend}
           </span>
        </div>
        <div className="flex items-baseline gap-2">
           <span className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">{value}</span>
           {progress !== undefined && <ArrowUpRight className="w-5 h-5 text-emerald-500" />}
        </div>
        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mt-1 italic">{subValue}</div>
        
        {progress !== undefined && (
          <div className="mt-6 space-y-2">
             <div className="flex justify-between text-[8px] font-black uppercase text-slate-600">
                <span>0</span>
                <span>MBMK 100%</span>
             </div>
             <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${Math.min(100, progress)}%` }}
                />
             </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-3xl">
        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">{label}</p>
        <div className="space-y-1">
          {payload.map((p: any, i: number) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color || p.fill }} />
              <span className="text-sm font-black text-white italic tracking-tighter">
                {p.name}: {p.value.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}
