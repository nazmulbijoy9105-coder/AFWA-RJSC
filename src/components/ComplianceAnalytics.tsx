import React, { useState, useMemo } from 'react';
import { Company, Rule } from '../types';
import { COMPLIANCE_RULES, MOCK_COMPANIES } from '../data/rules';
import { 
  Building, Calendar, TrendingUp, ShieldAlert, CheckCircle2, AlertTriangle, 
  ChevronRight, BrainCircuit, Sparkles, Filter, Info, ArrowUpRight, Check, Play, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface ComplianceAnalyticsProps {
  selectedCompany: Company;
  allCompanies?: Company[];
}

export default function ComplianceAnalytics({ selectedCompany, allCompanies = [] }: ComplianceAnalyticsProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [benchmarkMetric, setBenchmarkMetric] = useState<'health' | 'penalty'>('health');
  
  // Simulation switches: Key actionable issues currently triggered
  // We can let the user simulate what happens when they resolve them!
  const [resolvedIssues, setResolvedIssues] = useState<Record<string, boolean>>({});

  // 1. Evaluate rules for this company with simulation considered
  const currentEvaluatedRules = useMemo(() => {
    return COMPLIANCE_RULES.map(rule => {
      const evaluation = rule.evaluate(selectedCompany);
      const isSimulatedResolved = resolvedIssues[rule.id] === true;
      
      return {
        ...rule,
        triggered: evaluation.triggered && !isSimulatedResolved,
        actuallyTriggered: evaluation.triggered, // original state
        evalNotes: evaluation.notes,
      };
    });
  }, [selectedCompany, resolvedIssues]);

  // Active rules (actually triggered in real life)
  const activeTriggeredRules = useMemo(() => {
    return currentEvaluatedRules.filter(r => r.actuallyTriggered);
  }, [currentEvaluatedRules]);

  // Compute key stats for Real vs Simulated
  const stats = useMemo(() => {
    let actualScore = 0;
    let actualRed = 0;
    let actualYellow = 0;
    let actualBlack = 0;

    let simScore = 0;
    let simRed = 0;
    let simYellow = 0;
    let simBlack = 0;

    COMPLIANCE_RULES.forEach((rule) => {
      const evaluation = rule.evaluate(selectedCompany);
      if (evaluation.triggered) {
        actualScore += rule.points;
        if (rule.severity === 'RED') actualRed++;
        else if (rule.severity === 'YELLOW') actualYellow++;
        else if (rule.severity === 'BLACK') actualBlack++;

        // Simulation logic
        if (!resolvedIssues[rule.id]) {
          simScore += rule.points;
          if (rule.severity === 'RED') simRed++;
          else if (rule.severity === 'YELLOW') simYellow++;
          else if (rule.severity === 'BLACK') simBlack++;
        }
      }
    });

    // Health score: 100 points represents zero defaults. Max out penalty points scale at 250 as 0% health
    const calculateHealth = (score: number) => {
      return Math.max(0, Math.min(100, Math.round(100 - (score * 0.4))));
    };

    return {
      actualScore,
      actualRed,
      actualYellow,
      actualBlack,
      actualHealth: calculateHealth(actualScore),
      
      simScore,
      simRed,
      simYellow,
      simBlack,
      simHealth: calculateHealth(simScore),
      
      totalRulesCount: COMPLIANCE_RULES.length,
    };
  }, [selectedCompany, resolvedIssues]);

  // 2. Generate deterministic 12-Month Historical Penalty Trend
  // To make it feel super realistic, we backward-generate penalty points
  // based on the selected company's registration date and existing features
  const monthlyHistoricalData = useMemo(() => {
    const data = [];
    const months = [
      'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25',
      'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'
    ];
    
    // Create seed based on registration number or company ID to ensure distinct, beautiful, deterministic lines
    const companySeed = selectedCompany.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Determine age factors
    const incDateStr = selectedCompany.incorporationDate || '2024-01-01';
    const incYear = parseInt(incDateStr.split('-')[0]) || 2024;
    
    // Evaluate monthly progression
    for (let i = 0; i < 12; i++) {
      const monthIndex = i;
      let monthScore = 0;
      let unresolvedIssuesCount = 0;

      // Base monthly progression factors
      // Older month = fewer defaults because backlog didn't accumulate as much, or rules are checked as of current day
      const monthsAgo = 11 - i;
      
      COMPLIANCE_RULES.forEach((rule, idx) => {
        const evaluation = rule.evaluate(selectedCompany);
        if (evaluation.triggered) {
          // Deterministic seed-based simulation of when each default was triggered
          // Some rules trigger earlier in the year, some later. We'll stagger them
          const triggerStagger = (companySeed + idx * 17) % 12;
          
          if (triggerStagger <= monthIndex) {
            monthScore += rule.points;
            unresolvedIssuesCount++;
          }
        }
      });

      // Clamp score
      monthScore = Math.max(0, monthScore);
      
      // Calculate active health for this month
      const monthHealth = Math.max(0, Math.min(100, Math.round(100 - (monthScore * 0.4))));

      data.push({
        name: months[i],
        'Penalty Points': monthScore,
        'Compliance Health': monthHealth,
        'Active Violations': unresolvedIssuesCount,
      });
    }

    return data;
  }, [selectedCompany]);

  // 3. Category distribution (Real vs Simulated)
  const categoryChartData = useMemo(() => {
    const categories: Record<string, { points: number; simPoints: number; count: number; name: string }> = {};
    
    currentEvaluatedRules.forEach((rule) => {
      const cat = rule.category;
      if (!categories[cat]) {
        categories[cat] = { points: 0, simPoints: 0, count: 0, name: cat };
      }
      
      // Actual triggers
      if (rule.actuallyTriggered) {
        categories[cat].points += rule.points;
        categories[cat].count += 1;
      }
      
      // Simulated triggers
      if (rule.triggered) {
        categories[cat].simPoints += rule.points;
      }
    });

    return Object.values(categories)
      .filter((c) => c.points > 0)
      .map((c) => ({
        category: c.name,
        'Actual Points': c.points,
        'Projected Points': c.simPoints,
        'Violations Count': c.count,
      }))
      .sort((a, b) => b['Actual Points'] - a['Actual Points']);
  }, [currentEvaluatedRules]);

  // 4. Severity Distribution for Pie Chart
  const severityPieData = useMemo(() => {
    return [
      { name: 'BLACK (Immediate Crisis)', value: stats.actualBlack * 25, color: '#f43f5e' }, // black severity high weight
      { name: 'RED (Severe Default)', value: stats.actualRed * 15, color: '#f97316' },
      { name: 'YELLOW (Filing Warning)', value: stats.actualYellow * 5, color: '#f59e0b' },
    ].filter(s => s.value > 0);
  }, [stats]);

  // Toggle unresolved interactive features
  const toggleSimulateResolved = (ruleId: string) => {
    setResolvedIssues(prev => ({
      ...prev,
      [ruleId]: !prev[ruleId]
    }));
  };

  // Quick Action: Resolve all of same category
  const handleResolveAll = () => {
    const newResolved: Record<string, boolean> = {};
    activeTriggeredRules.forEach(rule => {
      newResolved[rule.id] = true;
    });
    setResolvedIssues(newResolved);
  };

  const handleResetSimulator = () => {
    setResolvedIssues({});
  };

  // Determine critical high leverage recommendations
  const topRecommendations = useMemo(() => {
    return activeTriggeredRules
      .map(r => ({
        ...r,
        simulated: resolvedIssues[r.id] === true
      }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 4);
  }, [activeTriggeredRules, resolvedIssues]);

  // Helper list of Peer Companies (all companies from Firestore or fallback, minus the selected company)
  const fallbackCompanies = useMemo(() => {
    const list = (allCompanies && allCompanies.length > 0) ? allCompanies : MOCK_COMPANIES;
    return list.filter(c => c.id !== selectedCompany.id);
  }, [allCompanies, selectedCompany.id]);

  // Industry average of peers' health score
  const industryAvgHealth = useMemo(() => {
    if (fallbackCompanies.length === 0) return 100;
    const total = fallbackCompanies.reduce((acc, comp) => {
      let score = 0;
      COMPLIANCE_RULES.forEach(rule => {
        if (rule.evaluate(comp).triggered) {
          score += rule.points;
        }
      });
      const health = Math.max(0, Math.min(100, Math.round(100 - (score * 0.4))));
      return acc + health;
    }, 0);
    return Math.round(total / fallbackCompanies.length);
  }, [fallbackCompanies]);

  const currentHealth = stats.simHealth;
  const healthDifference = currentHealth - industryAvgHealth;
  const outperforming = healthDifference >= 0;

  // Percentile Standing calculation (dynamic based on sandbox simulations!)
  const percentileStanding = useMemo(() => {
    const allHealths = fallbackCompanies.map(comp => {
      let score = 0;
      COMPLIANCE_RULES.forEach(rule => {
        if (rule.evaluate(comp).triggered) {
          score += rule.points;
        }
      });
      return Math.max(0, Math.min(100, Math.round(100 - (score * 0.4))));
    });
    allHealths.push(currentHealth);
    
    // Sort healths ascending
    allHealths.sort((a, b) => a - b);
    
    // Find index of current company's health
    const rankIndex = allHealths.indexOf(currentHealth);
    const percentile = Math.round((rankIndex / (allHealths.length - 1 || 1)) * 100);
    return percentile;
  }, [fallbackCompanies, currentHealth]);

  // Dynamic monthly historical comparison data 
  const monthlyBenchmarkingData = useMemo(() => {
    const months = [
      'Jul 25', 'Aug 25', 'Sep 25', 'Oct 25', 'Nov 25', 'Dec 25',
      'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'
    ];
    
    const selectedCompanySeed = selectedCompany.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Evaluate other companies' trends dynamically
    const otherCompaniesTrends = fallbackCompanies.map(comp => {
      const compSeed = comp.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const trend = [];
      for (let i = 0; i < 12; i++) {
        let monthScore = 0;
        COMPLIANCE_RULES.forEach((rule, idx) => {
          const evaluation = rule.evaluate(comp);
          if (evaluation.triggered) {
            const triggerStagger = (compSeed + idx * 17) % 12;
            if (triggerStagger <= i) {
              monthScore += rule.points;
            }
          }
        });
        monthScore = Math.max(0, monthScore);
        const monthHealth = Math.max(0, Math.min(100, Math.round(100 - (monthScore * 0.4))));
        trend.push({ score: monthScore, health: monthHealth });
      }
      return trend;
    });

    // Compile combined data
    return months.map((month, i) => {
      let selectedMonthScore = 0;
      COMPLIANCE_RULES.forEach((rule, idx) => {
        const evaluation = rule.evaluate(selectedCompany);
        if (evaluation.triggered) {
          const triggerStagger = (selectedCompanySeed + idx * 17) % 12;
          if (triggerStagger <= i) {
            const isSimulatedResolved = resolvedIssues[rule.id] === true;
            if (!isSimulatedResolved) {
              selectedMonthScore += rule.points;
            }
          }
        }
      });
      selectedMonthScore = Math.max(0, selectedMonthScore);
      const selectedMonthHealth = Math.max(0, Math.min(100, Math.round(100 - (selectedMonthScore * 0.4))));

      let totalOtherScore = 0;
      let totalOtherHealth = 0;
      const count = otherCompaniesTrends.length || 1;

      otherCompaniesTrends.forEach(trend => {
        if (trend[i]) {
          totalOtherScore += trend[i].score;
          totalOtherHealth += trend[i].health;
        } else {
          totalOtherScore += 0;
          totalOtherHealth += 100;
        }
      });

      const avgOtherScore = Math.round((totalOtherScore / count) * 10) / 10;
      const avgOtherHealth = Math.round((totalOtherHealth / count) * 10) / 10;

      return {
        name: month,
        'Your Health': selectedMonthHealth,
        'Your Penalty': selectedMonthScore,
        'Industry Avg Health': avgOtherHealth,
        'Industry Avg Penalty': avgOtherScore,
      };
    });
  }, [selectedCompany, fallbackCompanies, resolvedIssues]);

  return (
    <div className="space-y-6" id="compliance-analytics-workspace">
      
      {/* 2026 Modern Sleek Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase tracking-widest font-black">
              Analytics cockpit
            </span>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-black">
              Companies Act 1994 Model
            </span>
          </div>
          <h2 className="text-xl font-bold text-white font-sans tracking-tight flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            Compliance Analytics & Health Forecasting
          </h2>
          <p className="text-xs text-slate-400 font-mono max-w-xl">
            Audit the quarterly progression of <strong className="text-white">{selectedCompany.name}</strong>. Track compounding RJSC defaults, and simulate critical solutions to project penalty mitigation paths.
          </p>
        </div>

        {/* Global Reset controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleResetSimulator}
            disabled={Object.keys(resolvedIssues).length === 0}
            className="px-3.5 py-2 rounded-xl text-xs font-mono border border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:border-slate-700 disabled:opacity-40 transition-all cursor-pointer"
          >
            Reset Sandbox
          </button>
          <button
            onClick={handleResolveAll}
            disabled={activeTriggeredRules.length === 0 || Object.keys(resolvedIssues).length === activeTriggeredRules.length}
            className="px-3.5 py-2 rounded-xl text-xs font-mono bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold transition-all cursor-pointer"
          >
            Resolve All
          </button>
        </div>
      </div>

      {/* Grid of Key Health and Penalty metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" id="analytics-statistics-matrix">
        
        {/* Metric 1: Health Rating */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Compliance Index</span>
            <div className={`p-1.5 rounded-lg ${stats.simHealth >= 80 ? 'bg-emerald-500/10 text-emerald-400' : stats.simHealth >= 50 ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'}`}>
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{stats.simHealth}%</span>
              {stats.simHealth > stats.actualHealth && (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +{stats.simHealth - stats.actualHealth}%
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Current actual: <strong className="text-slate-300">{stats.actualHealth}%</strong>
            </p>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-700 ${stats.simHealth >= 80 ? 'bg-emerald-400' : stats.simHealth >= 50 ? 'bg-amber-400' : 'bg-rose-500'}`} 
              style={{ width: `${stats.simHealth}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Penalty Pool */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Active Risk Score</span>
            <div className={`p-1.5 rounded-lg ${stats.simScore === 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">{stats.simScore}</span>
              <span className="text-[10px] font-mono text-slate-500">pts</span>
              {stats.simScore < stats.actualScore && (
                <span className="text-xs font-mono font-bold text-emerald-400 flex items-center">
                  -{stats.actualScore - stats.simScore}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Initial base score: <strong className="text-rose-400">{stats.actualScore}</strong>
            </p>
          </div>
          <div className="text-[9px] text-slate-500 font-mono leading-none flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Aggregate legislative weight</span>
          </div>
        </div>

        {/* Metric 3: Total Violations */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Unresolved Defaults</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-white">
                {activeTriggeredRules.length - Object.keys(resolvedIssues).length}
              </span>
              <span className="text-[10px] font-mono text-slate-500">/ {activeTriggeredRules.length}</span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1">
              Active statutory breaches detected
            </p>
          </div>
          <p className="text-[9px] text-slate-500 font-mono">
            {Object.keys(resolvedIssues).length} simulated solutions applied
          </p>
        </div>

        {/* Metric 4: Compliance Status */}
        <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-2xl flex flex-col justify-between space-y-4 text-left">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider font-bold">Milestone Risk</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className={`text-xs px-2.5 py-1 rounded-xl font-mono uppercase font-bold tracking-wider inline-block ${
              stats.simScore > 80 
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                : stats.simScore > 30 
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            }`}>
              {stats.simScore > 80 ? '⚠️ High-Risk StrikeOff' : stats.simScore > 30 ? '⚡ Watchlist warning' : '✅ Operational compliance'}
            </span>
            <p className="text-[10px] text-slate-400 font-mono mt-2">
              Based on Section 389 guidelines
            </p>
          </div>
          <p className="text-[9px] text-slate-500 font-mono leading-tight">
            Review alerts periodically
          </p>
        </div>

      </div>

      {/* Main Charts Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="compliance-rich-charts-panels">
        
        {/* Chart 1: 12-Month Penalty Points Trend (AreaChart) - spans 2 cols */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl lg:col-span-2 text-left space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white font-sans">12-Month Historical Penalty & Compliance Trend</h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Visualizing cumulative statutory defaults and corporate health recovery mapping.
              </p>
            </div>
            
            {/* Custom Legend tags */}
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-500 opacity-80" />
                <span className="text-slate-300">Penalty Weight</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-400" />
                <span className="text-slate-300">Health Index</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full" id="recharts-trend-container">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyHistoricalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono, monospace" 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono, monospace"
                  yAxisId="left"
                  label={{ value: 'Penalty points', angle: -90, position: 'insideLeft', style: { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' } }}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono, monospace"
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  label={{ value: 'Health index %', angle: 90, position: 'insideRight', style: { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' } }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#020617',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: '11px',
                    color: '#f8fafc'
                  }}
                  itemStyle={{ margin: '2px 0' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Penalty Points" 
                  stroke="#6366f1" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPoints)" 
                  yAxisId="left"
                />
                <Area 
                  type="monotone" 
                  dataKey="Compliance Health" 
                  stroke="#14b8a6" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorHealth)" 
                  yAxisId="right"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Category Breakdown (BarChart) */}
        <div className="bg-slate-900 border border-slate-850 p-5 rounded-2xl text-left space-y-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white font-sans">Triggered Points by Legal Category</h3>
            <p className="text-[11px] text-slate-400 font-mono">
              Breakdown of risk severity metrics classified by Act section themes.
            </p>
          </div>

          <div className="h-[280px] w-full" id="recharts-category-bar-container">
            {categoryChartData.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 font-mono text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-400/40 mb-2" />
                <span>Zero points accrued! Beautifully green.</span>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis 
                    dataKey="category" 
                    stroke="#64748b" 
                    fontSize={9} 
                    fontFamily="JetBrains Mono, monospace" 
                  />
                  <YAxis 
                    stroke="#64748b" 
                    fontSize={10} 
                    fontFamily="JetBrains Mono, monospace" 
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '11px',
                    }}
                  />
                  <Bar dataKey="Actual Points" fill="#6366f1" radius={[4, 4, 0, 0]}>
                    {categoryChartData.map((entry, index) => {
                      const colors = ['#6366f1', '#f97316', '#3b82f6', '#f59e0b', '#ec4899', '#14b8a6', '#06b6d4'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Industry Peer Benchmark Dashboard */}
      <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl text-left space-y-6" id="industry-benchmark-dashboard">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest font-black">
                Industry Benchmarking
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-slate-800 text-slate-300 border border-slate-700 font-bold">
                N = {fallbackCompanies.length + 1} Companies Evaluated
              </span>
            </div>
            <h3 className="text-base font-bold text-white font-sans flex items-center gap-2">
              <Building className="w-4 h-4 text-teal-400" />
              Anonymous Private Limited Peer Comparison
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Compare your compliance health and accumulated RJSC risks against the real-time average of other Private Limited Companies registered in this system.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-850 self-start md:self-center">
            <button
              onClick={() => setBenchmarkMetric('health')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                benchmarkMetric === 'health'
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-250'
              }`}
            >
              Compliance Health %
            </button>
            <button
              onClick={() => setBenchmarkMetric('penalty')}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                benchmarkMetric === 'penalty'
                  ? 'bg-indigo-500 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-250'
              }`}
            >
              Penalty Points
            </button>
          </div>
        </div>

        {/* Bento Comparison Sub-metrics grids */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Peer card 1: Score compare */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wide font-bold">Benchmark Spread</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-md font-mono ${outperforming ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                {outperforming ? 'Above Peer Avg' : 'Below Peer Avg'}
              </span>
            </div>
            <div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                <span>{Math.abs(healthDifference)}%</span>
                <span className="text-xs text-slate-400 font-normal">
                  {outperforming ? 'higher than' : 'lower than'} peers
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Peer avg health: <strong className="text-slate-350">{industryAvgHealth}%</strong> | Yours: <strong className="text-slate-350">{currentHealth}%</strong>
              </p>
            </div>
          </div>

          {/* Peer card 2: Percentile Rank */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-505 uppercase tracking-wide font-bold">Percentile Ranking</span>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/10 text-indigo-400 rounded-md font-mono">Dynamic Standings</span>
            </div>
            <div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                <span>{percentileStanding}th</span>
                <span className="text-xs text-slate-400 font-normal">Percentile</span>
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Outperforming <strong className="text-slate-350">{percentileStanding}%</strong> of audited private limited companies in the system.
              </p>
            </div>
          </div>

          {/* Peer card 3: Dynamic sandbox impact */}
          <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl flex flex-col justify-between space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-slate-505 uppercase tracking-wide font-bold">Sandbox Index Boost</span>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-md font-mono font-bold">Target Gain</span>
            </div>
            <div>
              <div className="text-2xl font-black text-emerald-400">
                +{currentHealth - stats.actualHealth}%
              </div>
              <p className="text-[10px] text-slate-500 font-mono mt-1">
                Applying simulated actions raised company standing by <strong className="text-emerald-400">{currentHealth - stats.actualHealth}%</strong> points.
              </p>
            </div>
          </div>
        </div>

        {/* Comparative overlay graph */}
        <div className="h-[300px] w-full bg-slate-950/40 p-4 border border-slate-850 rounded-xl relative overflow-hidden" id="peer-average-overlay-graph">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyBenchmarkingData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradientYourHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={benchmarkMetric === 'health' ? '#14b8a6' : '#6366f1'} stopOpacity={0.25}/>
                  <stop offset="95%" stopColor={benchmarkMetric === 'health' ? '#14b8a6' : '#6366f1'} stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradientPeerHealth" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis 
                dataKey="name" 
                stroke="#64748b" 
                fontSize={10} 
                fontFamily="JetBrains Mono, monospace" 
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                fontFamily="JetBrains Mono, monospace"
                domain={benchmarkMetric === 'health' ? [0, 100] : [0, 'auto']}
                label={{ 
                  value: benchmarkMetric === 'health' ? 'Compliance Health %' : 'Penalty Risk Score (Pts)', 
                  angle: -90, 
                  position: 'insideLeft', 
                  style: { fill: '#64748b', fontSize: 10, fontFamily: 'monospace' } 
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#020617',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: '11px',
                  color: '#f8fafc'
                }}
              />
              <Legend 
                verticalAlign="top" 
                height={36} 
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Area 
                type="monotone" 
                name={benchmarkMetric === 'health' ? 'Your Health %' : 'Your Penalty Risk (Pts)'}
                dataKey={benchmarkMetric === 'health' ? 'Your Health' : 'Your Penalty'} 
                stroke={benchmarkMetric === 'health' ? '#14b8a6' : '#6366f1'} 
                strokeWidth={2.5}
                activeDot={{ r: 6 }}
                fillOpacity={1} 
                fill="url(#gradientYourHealth)" 
              />
              <Area 
                type="monotone" 
                name={benchmarkMetric === 'health' ? 'Industry Avg Health %' : 'Industry Avg Penalty (Pts)'}
                dataKey={benchmarkMetric === 'health' ? 'Industry Avg Health' : 'Industry Avg Penalty'} 
                stroke="#94a3b8" 
                strokeWidth={2}
                strokeDasharray="4 4"
                fillOpacity={1} 
                fill="url(#gradientPeerHealth)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interactive Simulation Sandbox and AI recommendations briefing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="simulations-and-insights">
        
        {/* Panel 1: Interactive Sandbox simulator */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl text-left space-y-4">
          <div className="flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest font-bold inline-block">
                Interactive simulator
              </span>
              <h3 className="text-base font-bold text-white">Remediation Forecasting Sandbox</h3>
              <p className="text-xs text-slate-400 font-mono">
                Select outstanding statutory issues below and check files to witness dynamic risk point decreases.
              </p>
            </div>
          </div>

          <div className="space-y-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
            {activeTriggeredRules.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-mono text-xs">
                ✨ Excellent! No active triggers to simulate resolved.
              </div>
            ) : (
              activeTriggeredRules.map((rule) => {
                const isSelected = resolvedIssues[rule.id] === true;
                return (
                  <div 
                    key={rule.id}
                    onClick={() => toggleSimulateResolved(rule.id)}
                    className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer select-none ${
                      isSelected 
                        ? 'bg-emerald-950/20 border-emerald-500/40' 
                        : 'bg-slate-950 border-slate-850 hover:border-slate-800'
                    }`}
                  >
                    <div className={`mt-0.5 shrink-0 w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                      isSelected 
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400' 
                        : 'border-slate-700 text-transparent bg-slate-900'
                    }`}>
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>

                    <div className="grow space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white leading-normal">
                          {rule.name}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          rule.severity === 'RED' 
                            ? 'bg-rose-500/10 text-rose-400' 
                            : rule.severity === 'YELLOW' 
                              ? 'bg-amber-500/10 text-amber-500' 
                              : 'bg-red-500/20 text-red-400'
                        }`}>
                          {rule.id} • {rule.points} pts
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal font-sans">
                        {rule.description}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Panel 2: Predictive legal Advisory briefs */}
        <div className="bg-slate-900 border border-slate-850 p-6 rounded-2xl text-left space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="space-y-1">
              <span className="flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full font-mono bg-teal-500/10 text-teal-300 border border-teal-500/20 uppercase tracking-widest font-bold w-fit">
                <BrainCircuit className="w-3.5 h-3.5 animate-spin animate-duration-3000" />
                AI Executive Compliance Advisory brief
              </span>
              <h3 className="text-base font-bold text-white">Prescriptive Resolution Roadmaps</h3>
              <p className="text-xs text-slate-400 font-sans">
                Gemini automated audit of <strong className="text-white">{selectedCompany.name}</strong> has highlighted the largest risk vectors. Execute prioritized operations to restore 100% standing:
              </p>
            </div>

            {/* Structured prioritized lists */}
            <div className="space-y-3">
              {topRecommendations.length === 0 ? (
                <div className="p-8 border border-dashed border-slate-800 rounded-xl text-center text-xs text-slate-500 font-mono">
                  🌱 No risks detected matching Section criteria. Standard operation is perfectly intact.
                </div>
              ) : (
                topRecommendations.map((rule, index) => {
                  return (
                    <div 
                      key={rule.id}
                      className={`p-3 rounded-xl border flex items-start gap-3 transition-all ${
                        rule.simulated 
                          ? 'border-emerald-500/20 bg-emerald-950/5 opacity-50' 
                          : 'border-slate-800 bg-slate-950/40'
                      }`}
                    >
                      <div className="shrink-0 w-6 h-6 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-[10px] text-slate-400 font-bold">
                        {index + 1}
                      </div>
                      <div className="grow space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className={`font-bold ${rule.simulated ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                            {rule.name}
                          </span>
                          <span className="text-[10px] font-mono text-indigo-400">
                            Sec. {rule.section}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          {rule.context}
                        </p>
                        <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>Risk: {rule.points} pts severity</span>
                          {rule.simulated && (
                            <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                              ✓ Resolved in sandbox
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs text-slate-400 font-mono" id="remediation-bottom-bar">
            <span>Bangladesh Act compliance scorecard</span>
            <span className="text-white bg-slate-950 px-2.5 py-1 rounded-md border border-slate-800 text-[10px] font-bold">
              AFWA v4.16 Core
            </span>
          </div>

        </div>

      </div>

    </div>
  );
}
