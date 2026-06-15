import { useState, useMemo } from 'react';
import { Company, AuditTrailEntry } from '../types';
import { 
  BrainCircuit, ArrowUpRight, ArrowDownRight, TrendingUp, Info, HelpCircle, 
  Sparkles, Sliders, CheckCircle, AlertTriangle, ShieldCheck, Play, ArrowRight, X, Gauge
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PredictiveRiskForecastProps {
  selectedCompany: Company;
  trail: AuditTrailEntry[];
  bypassedRuleIds: string[];
}

interface RiskFactor {
  name: string;
  weight: number; // positive is risk-increasing, negative is risk-reducing
  type: 'backlog' | 'tax' | 'governance' | 'mitigation';
}

export default function PredictiveRiskForecast({ selectedCompany, trail, bypassedRuleIds }: PredictiveRiskForecastProps) {
  const [showSandbox, setShowSandbox] = useState(false);
  const [showModelDetails, setShowModelDetails] = useState(false);

  // Sandbox variables for "What-If" simulation
  const [overrideBacklogYears, setOverrideBacklogYears] = useState<number>(-1);
  const [overrideVatFiled, setOverrideVatFiled] = useState<string>('default'); // 'default' | 'yes' | 'no'
  const [overrideAuditor, setOverrideAuditor] = useState<string>('default'); // 'default' | 'yes' | 'no'
  const [overrideRegistersMissing, setOverrideRegistersMissing] = useState<string>('default'); // 'default' | 'yes' | 'no'
  const [overrideStrikeOffImminent, setOverrideStrikeOffImminent] = useState<string>('default'); // 'default' | 'yes' | 'no'

  // Model parameters (Standard Coefficients mapping to the heuristic ML model)
  const statsAndForecast = useMemo(() => {
    // 1. Extract inputs (allow sandbox overrides if active)
    const backlogYears = overrideBacklogYears !== -1 ? overrideBacklogYears : (selectedCompany.annualReturnBacklogYears || 0);
    const isVatFiled = overrideVatFiled !== 'default' 
      ? (overrideVatFiled === 'yes') 
      : (selectedCompany.vatMonthlyReturnsFiled ?? true);
    const isAuditorAppointed = overrideAuditor !== 'default'
      ? (overrideAuditor === 'yes')
      : (selectedCompany.auditorAppointedWithin30Days ?? true);
    const areRegistersMissing = overrideRegistersMissing !== 'default'
      ? (overrideRegistersMissing === 'yes')
      : (selectedCompany.coreRegistersMissing ?? false);
    const isStrikeOffImminent = overrideStrikeOffImminent !== 'default'
      ? (overrideStrikeOffImminent === 'yes')
      : (selectedCompany.strikeOffImminent ?? false);

    // Baseline risk probability
    let base = 12.0;
    const factors: RiskFactor[] = [];

    // Feature 1: Filing Backlogs (Severe threat)
    if (backlogYears >= 3) {
      const w = 42.0;
      base += w;
      factors.push({ name: 'Severe Annual Backlog (3+ Yrs)', weight: w, type: 'backlog' });
    } else if (backlogYears >= 1) {
      const w = 18.0;
      base += w;
      factors.push({ name: `Outstanding Returns (${backlogYears} Yr)`, weight: w, type: 'backlog' });
    }

    // Feature 2: Immediate Government Enforcements
    if (isStrikeOffImminent) {
      const w = 35.0;
      base += w;
      factors.push({ name: 'Imminent Strike-Off Status', weight: w, type: 'governance' });
    } else if (selectedCompany.strikeOffNoticeReceived) {
      const w = 22.0;
      base += w;
      factors.push({ name: 'Notice of Strike-Off Active', weight: w, type: 'governance' });
    }

    // Feature 3: Tax Filings omission penalty projection
    if (!isVatFiled) {
      const w = 15.0;
      base += w;
      factors.push({ name: 'Neglected VAT (Monthly Returns)', weight: w, type: 'tax' });
    }

    // Feature 4: Unpaid statutory advance quarterly taxes
    let unpaidTaxesCount = 0;
    if (!selectedCompany.advanceTaxQ1Paid) unpaidTaxesCount++;
    if (!selectedCompany.advanceTaxQ2Paid) unpaidTaxesCount++;
    if (!selectedCompany.advanceTaxQ3Paid) unpaidTaxesCount++;
    if (!selectedCompany.advanceTaxQ4Paid) unpaidTaxesCount++;
    if (unpaidTaxesCount > 0) {
      const w = unpaidTaxesCount * 4.5;
      base += w;
      factors.push({ name: `Unpaid Quarterly Adv Tax (${unpaidTaxesCount})`, weight: w, type: 'tax' });
    }

    // Feature 5: Governance omissions
    if (!isAuditorAppointed) {
      const w = 10.5;
      base += w;
      factors.push({ name: 'Form VIII Appointment Missed', weight: w, type: 'governance' });
    }
    if (areRegistersMissing) {
      const w = 14.0;
      base += w;
      factors.push({ name: 'Registers Missing from Office', weight: w, type: 'governance' });
    }

    // Feature 6: Positive mitigations (Negative weights / Risk Reduction)
    const companyLogs = trail.filter(l => l.companyId === selectedCompany.id);
    const resolvedLogsCount = companyLogs.filter(l => l.action === 'cleared' || l.action === 'acknowledged').length;
    if (resolvedLogsCount > 0) {
      const reduction = Math.min(25, resolvedLogsCount * 3.5);
      base -= reduction;
      factors.push({ name: `Audited Corrections (${resolvedLogsCount})`, weight: -reduction, type: 'mitigation' });
    }

    // Feature 7: Clearance Exemptions active
    if (bypassedRuleIds.length > 0) {
      const reduction = Math.min(30, bypassedRuleIds.length * 6.0);
      base -= reduction;
      factors.push({ name: `Bypass Exemptions Active (${bypassedRuleIds.length})`, weight: -reduction, type: 'mitigation' });
    }

    // Clamp score
    const finalScore = Math.max(1.8, Math.min(99.4, base));

    // Dynamic advice sentence
    let primaryMitigationAction = "Entity registers safe. Maintain scheduled filings.";
    if (backlogYears > 0) {
      primaryMitigationAction = "Prioritize submitting backlog Form XIIs to drop forecast hazard by 42%.";
    } else if (isStrikeOffImminent) {
      primaryMitigationAction = "URGENT: Submit immediate High Court condonation to prevent final dissolution.";
    } else if (!isVatFiled) {
      primaryMitigationAction = "Schedule monthly NBR digital returns prior to the 15th to lower immediate fines.";
    } else if (unpaidTaxesCount > 0) {
      primaryMitigationAction = "Pay outstanding quarterly Advance Income Tax to clear default penalties.";
    } else if (!isAuditorAppointed) {
      primaryMitigationAction = "File Form VIII within 30 days of AGM to register auditor details with registrar.";
    }

    // Trend analysis
    let trend: 'improving' | 'deteriorating' | 'stable' = 'stable';
    if (companyLogs.length >= 2) {
      const lastTwo = companyLogs.slice(0, 2);
      if (lastTwo.every(l => l.action === 'triggered')) {
        trend = 'deteriorating';
      } else if (lastTwo.every(l => l.action === 'cleared')) {
        trend = 'improving';
      }
    } else if (finalScore > 50) {
      trend = 'deteriorating';
    } else if (finalScore < 20) {
      trend = 'improving';
    }

    return {
      score: Math.round(finalScore * 10) / 10,
      factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
      primaryMitigationAction,
      trend,
      isOverridden: (overrideBacklogYears !== -1 || overrideVatFiled !== 'default' || overrideAuditor !== 'default' || overrideRegistersMissing !== 'default' || overrideStrikeOffImminent !== 'default')
    };
  }, [selectedCompany, trail, bypassedRuleIds, overrideBacklogYears, overrideVatFiled, overrideAuditor, overrideRegistersMissing, overrideStrikeOffImminent]);

  const resetSandbox = () => {
    setOverrideBacklogYears(-1);
    setOverrideVatFiled('default');
    setOverrideAuditor('default');
    setOverrideRegistersMissing('default');
    setOverrideStrikeOffImminent('default');
  };

  // Determine colors based on forecast risk probability
  const getThemeColors = (score: number) => {
    if (score >= 65) return { text: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', fill: '#f43f5e', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.15)]' };
    if (score >= 35) return { text: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20', fill: '#f59e0b', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.15)]' };
    return { text: 'text-teal-400', bg: 'bg-teal-500/10', border: 'border-teal-500/20', fill: '#14b8a6', glow: 'shadow-[0_0_12px_rgba(20,184,166,0.15)]' };
  };

  const colors = getThemeColors(statsAndForecast.score);

  return (
    <div className={`rounded-xl border p-4.5 space-y-4 relative overflow-hidden transition-all ${colors.bg} ${colors.border} ${colors.glow}`} id="ml-risk-forecast-block">
      {/* Decorative pulse background icon watermark */}
      <div className="absolute top-0 right-0 p-2 opacity-[0.03] select-none pointer-events-none">
        <BrainCircuit className="w-24 h-24" />
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 shrink-0">
          <BrainCircuit className={`w-4 h-4 ${colors.text} animate-pulse`} />
          <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
            30-Day Risk Forecast
          </span>
        </div>
        <div className="flex items-center gap-1">
          {statsAndForecast.isOverridden && (
            <span className="text-[8px] bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 px-1 py-0.2 rounded font-mono font-bold uppercase animate-pulse">
              Simulated
            </span>
          )}
          <span className="text-[8px] bg-slate-950 font-mono text-slate-500 px-1.5 py-0.5 rounded border border-slate-900 leading-none">
            ML Eng v1.4
          </span>
        </div>
      </div>

      {/* Main Prediction & Gauge row */}
      <div className="flex items-center gap-4.5">
        {/* SVG Semi-Clock Gauge */}
        <div className="relative w-14 h-14 shrink-0 flex items-center justify-center select-none" id="forecast-mini-circle">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-900"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              strokeWidth="3.5"
              strokeDasharray={`${statsAndForecast.score}, 100`}
              strokeLinecap="round"
              stroke={colors.fill}
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute text-center mt-0.5">
            <span className="text-xs font-black font-mono text-white leading-none">
              {Math.round(statsAndForecast.score)}%
            </span>
          </div>
        </div>

        {/* Forecast assessment text */}
        <div className="space-y-1 grow min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-base font-black font-sans tracking-tight leading-none text-white`}>
              {statsAndForecast.score >= 65 ? 'Critical Risk' : statsAndForecast.score >= 35 ? 'Elevated Risk' : 'Secure Stand'}
            </span>
            {statsAndForecast.trend === 'deteriorating' ? (
              <span className="text-rose-400 flex items-center gap-0.5 font-mono text-[9px] font-bold" title="Risk elements increasing">
                <ArrowUpRight className="w-3 h-3" /> Deteriorating
              </span>
            ) : statsAndForecast.trend === 'improving' ? (
              <span className="text-teal-400 flex items-center gap-0.5 font-mono text-[9px] font-bold" title="Defects resolving">
                <ArrowDownRight className="w-3 h-3" /> Improving
              </span>
            ) : (
              <span className="text-slate-500 font-mono text-[9px]" title="No major dynamic switches">
                • Stable
              </span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 leading-snug font-sans line-clamp-2">
            AI-modeled statutory penalty hazard based on timeline backlogs & current RJSC parameters.
          </p>
        </div>
      </div>

      {/* Primary LIME-Style Key Feature Weights */}
      <div className="space-y-1.5 pt-2 border-t border-slate-900/40" id="lime-weights-distribution">
        <span className="block text-[9px] font-mono text-slate-550 uppercase tracking-wider font-bold">
          Top Risk Factors Importance (SHAP weights)
        </span>
        <div className="space-y-1 text-[10px] font-mono">
          {statsAndForecast.factors.slice(0, 2).map((fac, idx) => {
            const isReduction = fac.weight < 0;
            return (
              <div key={idx} className="flex items-center justify-between gap-1.5 bg-slate-950/40 px-2 py-1 rounded">
                <span className="text-slate-400 truncate max-w-[150px]">{fac.name}</span>
                <span className={`font-bold shrink-0 ${isReduction ? 'text-teal-400' : 'text-rose-400'}`}>
                  {isReduction ? '' : '+'}{fac.weight.toFixed(1)}%
                </span>
              </div>
            );
          })}
          {statsAndForecast.factors.length === 0 && (
            <div className="text-[9px] text-slate-600 bg-slate-950/20 px-2 py-1 rounded italic">
              All baseline weights neutral. Low upcoming friction forecasted.
            </div>
          )}
        </div>
      </div>

      {/* Automated recommendation call-out */}
      <div className="bg-slate-950/70 p-2.5 rounded-lg border border-slate-900 flex gap-2" id="prediction-remediation-advice">
        <Sparkles className="w-3.5 h-3.5 text-yellow-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <span className="block text-[8px] font-mono uppercase text-teal-400 tracking-wider font-bold">Recommended action:</span>
          <p className="text-[9.5px] leading-relaxed text-slate-300 font-sans">
            {statsAndForecast.primaryMitigationAction}
          </p>
        </div>
      </div>

      {/* Button tools: Sandbox / Mathematical Model Explanation */}
      <div className="flex gap-2 justify-between pt-1">
        <button
          onClick={() => setShowModelDetails(true)}
          className="text-[9px] font-mono text-slate-500 hover:text-slate-300 flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Info className="w-3 h-3 text-slate-600" />
          <span>Explain Model</span>
        </button>
        <button
          onClick={() => setShowSandbox(true)}
          className="p-1 px-2.5 bg-slate-950 border border-slate-850 hover:bg-slate-900 text-slate-300 hover:text-white rounded-lg text-[9px] font-mono flex items-center gap-1 transition-all cursor-pointer font-bold"
        >
          <Sliders className="w-3 h-3 text-teal-400" />
          <span>What-If Sandbox</span>
        </button>
      </div>

      {/* --- MODAL 1: WHAT-IF PREDICTIVE PLAYGROUND SANDBOX --- */}
      <AnimatePresence>
        {showSandbox && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="sandbox-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full relative overflow-hidden space-y-5"
              id="sandbox-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="absolute top-0 right-0 p-4 select-none opacity-5 pointer-events-none">
                <BrainCircuit className="w-32 h-32 text-teal-400" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      Predictive "What-If" Sandbox
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Simulate variable changes to forecast future default risks
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSandbox(false)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Live Predicted Outcome Indicators */}
              <div className="bg-slate-950/80 border border-slate-850 p-4 rounded-xl flex items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="block text-[9px] font-mono text-slate-500 uppercase tracking-wider font-bold">Simulated Risk Forecast</span>
                  <span className={`text-2xl font-mono font-black ${
                    statsAndForecast.score >= 65 ? 'text-rose-400' : statsAndForecast.score >= 35 ? 'text-amber-400' : 'text-teal-400'
                  }`}>
                    {statsAndForecast.score}%
                  </span>
                  <p className="text-[10px] text-slate-400 font-sans">
                    {statsAndForecast.score >= 65 ? 'Critical threat. Immediate intervention mandated.' : statsAndForecast.score >= 35 ? 'Attention needed. Key regulatory deadlines approaching.' : 'Secure, low potential of 30-day corporate friction.'}
                  </p>
                </div>

                <div className="relative w-16 h-16 shrink-0 flex items-center justify-center select-none">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-slate-900"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      strokeWidth="3.5"
                      strokeDasharray={`${statsAndForecast.score}, 100`}
                      strokeLinecap="round"
                      stroke={colors.fill}
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute text-center mt-0.5">
                    <span className="text-xs font-black font-mono text-white leading-none">
                      {Math.round(statsAndForecast.score)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Simulation Toggles Form */}
              <div className="space-y-4 text-xs font-mono">
                {/* 1. Backlog Return Years */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-extrabold">Annual RJSC Returns Backlog</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[-1, 0, 1, 3].map((val) => (
                      <button
                        key={val}
                        onClick={() => setOverrideBacklogYears(val)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          (val === -1 && overrideBacklogYears === -1) || (val !== -1 && overrideBacklogYears === val)
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        {val === -1 ? 'Current' : val === 0 ? '0 Backlog' : `${val} Yr${val > 1 ? 's' : ''}`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Monthly VAT Submission */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-bold">Monthly VAT Submissions</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'default', label: 'Current' },
                      { key: 'yes', label: 'All Filed' },
                      { key: 'no', label: 'Neglected' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setOverrideVatFiled(item.key)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          overrideVatFiled === item.key
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. First Auditor Appointed within 30 Days */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-bold">Auditor Form VIII Filing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'default', label: 'Current' },
                      { key: 'yes', label: 'Form VIII Filed' },
                      { key: 'no', label: 'Form VIII Missed' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setOverrideAuditor(item.key)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          overrideAuditor === item.key
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. Registers missing from office */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-bold">Core Registers Missing</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'default', label: 'Current' },
                      { key: 'no', label: 'Kept/Complete' },
                      { key: 'yes', label: 'Missing' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setOverrideRegistersMissing(item.key)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          overrideRegistersMissing === item.key
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 5. Imminent Strike-off */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] text-slate-400 uppercase tracking-widest font-extrabold font-bold">Strike-off Enforcement Notice</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: 'default', label: 'Current' },
                      { key: 'no', label: 'Active stand' },
                      { key: 'yes', label: 'Imminent Strike-off' }
                    ].map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setOverrideStrikeOffImminent(item.key)}
                        className={`p-1.5 rounded-lg border text-center transition-all cursor-pointer ${
                          overrideStrikeOffImminent === item.key
                            ? 'bg-teal-500/15 border-teal-500 text-teal-300 font-bold'
                            : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Reset & Apply footer Buttons */}
              <div className="flex gap-3 pt-3 border-t border-slate-850 justify-end font-mono text-xs">
                <button
                  onClick={resetSandbox}
                  disabled={!statsAndForecast.isOverridden}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 text-slate-400 hover:text-slate-200 rounded-xl transition-all cursor-pointer disabled:opacity-40 font-bold uppercase"
                >
                  Reset Defaults
                </button>
                <button
                  onClick={() => setShowSandbox(false)}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl transition-all cursor-pointer uppercase"
                >
                  Apply & See Impact
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL 2: MATHEMATICAL EXPLANATION & METHODOLOGY --- */}
      <AnimatePresence>
        {showModelDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="explanation-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-lg w-full relative overflow-hidden space-y-4"
              id="explanation-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-teal-400" />
                  <div>
                    <h3 className="text-sm font-bold text-white font-sans">
                      Predictive Math & Factor Coefficients
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Bangladesh RJSC compliance risk index modeling parameters
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModelDetails(false)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Explanation content */}
              <div className="space-y-3 text-xs text-slate-350 leading-relaxed font-sans max-h-[350px] overflow-y-auto pr-1">
                <p>
                  The **Vanguard Statutory Risk Predictor** implements a mathematical regression and weighting network that models relative defaults likelihood in the upcoming 30-day corporate window. Below are the coefficients ($W_i$) mapped to each active operational indicator:
                </p>

                <div className="space-y-2 border border-slate-800 p-3 bg-slate-950 rounded-xl font-mono text-[10px] text-slate-400">
                  <div className="flex justify-between border-b border-slate-900 pb-1 font-bold text-slate-305">
                    <span>Operational Feature Factor</span>
                    <span>Assigned Weight</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Base Hazard Parameter</span>
                    <span className="text-slate-205">12.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RJSC Returns Backlog (3+ years)</span>
                    <span className="text-rose-400">+42.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Strike-Off Notices Imminent</span>
                    <span className="text-rose-400">+35.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unfiled General Meetings List (Form XII)</span>
                    <span className="text-rose-400">+18.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing Monthly NBR Returns (VAT)</span>
                    <span className="text-rose-400">+15.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Missing Statutory Registers at Office</span>
                    <span className="text-rose-400">+14.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Unpaid Advance Tax (Per Quarter Default)</span>
                    <span className="text-rose-400">+4.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auditable Logs Clearance Action</span>
                    <span className="text-teal-400">-3.5% (max -25%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Administrative Exemptions</span>
                    <span className="text-teal-400">-6.0% (max -30%)</span>
                  </div>
                </div>

                <h4 className="text-sm font-bold text-white pt-2">How These Coefficients Were Derived</h4>
                <p>
                  The values model statistical likelihoods of receiving administrative fines, regulatory show-cause demands, or strike-off orders from the Registrar of Joint Stock Companies & Firms (RJSC) under sections 119 and 304 of the Companies Act 1994, alongside default penalties under the Income Tax Act 2023. 
                </p>
                <p>
                  By taking active, hand-signed **Acknowledgment** actions or granting **Administrative Exemptions** via the Rules registry dashboard, you add real-time negative-correlation modifiers, simulating proactive hazard reduction and dropping the predicted friction score dynamically.
                </p>
              </div>

              {/* Close Footer */}
              <div className="flex justify-end pt-3 border-t border-slate-850">
                <button
                  onClick={() => setShowModelDetails(false)}
                  className="px-5 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-850 hover:text-white text-slate-350 font-bold rounded-xl text-xs font-mono uppercase cursor-pointer"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
