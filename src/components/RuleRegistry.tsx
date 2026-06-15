import { useState, useMemo } from 'react';
import { Rule, Company, UserSession, AuditTrailEntry } from '../types';
import { COMPLIANCE_RULES } from '../data/rules';
import { 
  Search, Eye, AlertTriangle, ShieldCheck, HelpCircle, ChevronRight, Scale, 
  CheckCircle2, User, Play 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface RuleRegistryProps {
  selectedCompany: Company;
  session: UserSession;
  trail: AuditTrailEntry[];
  onLogAction: (ruleId: string, ruleName: string, action: 'acknowledged' | 'cleared' | 'triggered', notes?: string) => void;
  bypassedRuleIds: string[];
  onToggleBypass: (ruleId: string) => void;
}

export default function RuleRegistry({ 
  selectedCompany, 
  session, 
  trail, 
  onLogAction, 
  bypassedRuleIds, 
  onToggleBypass 
}: RuleRegistryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterTriggered, setFilterTriggered] = useState<boolean | null>(null);
  const [expandedRuleId, setExpandedRuleId] = useState<string | null>(null);
  
  // Note inputs for manual operator logs
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const categories = useMemo(() => {
    const list = new Set(COMPLIANCE_RULES.map((r) => r.category));
    return ['all', ...Array.from(list)];
  }, []);

  const evaluatedRules = useMemo(() => {
    return COMPLIANCE_RULES.map((rule) => {
      const evaluation = rule.evaluate(selectedCompany);
      const isBypassed = bypassedRuleIds.includes(rule.id);
      return {
        ...rule,
        triggered: isBypassed ? false : evaluation.triggered,
        wasTriggeredBeforeBypass: evaluation.triggered,
        isBypassed,
        evalNotes: evaluation.notes,
      };
    });
  }, [selectedCompany, bypassedRuleIds]);

  const stats = useMemo(() => {
    let score = 0;
    let redCount = 0;
    let yellowCount = 0;
    let blackCount = 0;

    evaluatedRules.forEach((r) => {
      if (r.triggered) {
        score += r.points;
        if (r.severity === 'RED') redCount++;
        else if (r.severity === 'YELLOW') yellowCount++;
        else if (r.severity === 'BLACK') blackCount++;
      }
    });

    return {
      severityScore: score,
      redCount,
      yellowCount,
      blackCount,
      totalRulesCount: COMPLIANCE_RULES.length,
      triggeredCount: redCount + yellowCount + blackCount,
    };
  }, [evaluatedRules]);

  const filteredRules = useMemo(() => {
    return evaluatedRules.filter((rule) => {
      const matchesSearch =
        rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        rule.section.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;

      const matchesTriggered =
        filterTriggered === null || (filterTriggered === true ? rule.triggered : !rule.triggered);

      return matchesSearch && matchesCategory && matchesTriggered;
    });
  }, [evaluatedRules, searchQuery, selectedCategory, filterTriggered]);

  const toggleExpand = (id: string) => {
    setExpandedRuleId(expandedRuleId === id ? null : id);
  };

  const handleLogActionLocal = (ruleId: string, ruleName: string, action: 'acknowledged' | 'cleared') => {
    const notes = noteInputs[ruleId] || '';
    onLogAction(ruleId, ruleName, action, notes || `${action === 'acknowledged' ? 'In-registry validation signed' : 'Manual override check signed.'}`);
    
    // Clear notes field
    setNoteInputs(prev => ({ ...prev, [ruleId]: '' }));
  };

  const handleToggleBypassLocal = (ruleId: string, ruleName: string, currentlyBypassed: boolean) => {
    const notes = noteInputs[ruleId] || '';
    if (currentlyBypassed) {
      // Restoring default checks
      onLogAction(ruleId, ruleName, 'triggered', notes || 'Manual clearance override revoked. Standard rule checks active.');
    } else {
      // Signing override
      onLogAction(ruleId, ruleName, 'cleared', notes || 'Administrative override clearance authorized by manager.');
    }
    onToggleBypass(ruleId);
    
    // Clear notes field
    setNoteInputs(prev => ({ ...prev, [ruleId]: '' }));
  };

  return (
    <div className="space-y-6" id="rule-registry-component">
      {/* Risk Assessment Summary Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden" id="compliance-scoring-bento">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-full pointer-events-none blur-3xl" />
        
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-md tracking-wider">
              RJSC ILRMF v2.0 Compliance Algorithm
            </span>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white">
              Rules Evaluation & Risk Registry
            </h2>
            <p className="text-sm text-slate-400 max-w-xl">
              Calculates structural, procedural, and tax indicators under the Companies Act 1994, mapping active parameters into corresponding legally-binding risk points.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-950 border border-slate-800/80 p-4 rounded-xl min-w-[280px]">
            <div className="text-center grow border-r border-slate-800/60 pr-4">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Active Defaults</span>
              <span className="text-2xl font-black font-mono text-slate-100 mt-1 block">
                {stats.triggeredCount} <span className="text-xs text-slate-500">/ {stats.totalRulesCount}</span>
              </span>
            </div>
            <div className="text-center grow">
              <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Penalty Points</span>
              <span className={`text-2xl font-black font-mono mt-1 block ${
                stats.severityScore > 100
                  ? 'text-rose-400'
                  : stats.severityScore > 35
                  ? 'text-amber-400'
                  : 'text-teal-400'
              }`}>
                {stats.severityScore} <span className="text-xs text-slate-500">/ 599</span>
              </span>
            </div>
          </div>
        </div>

        {/* Mini Counters Grid */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/60">
          <div className="bg-rose-500/5 border border-rose-500/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs font-mono text-rose-300">RED Violations (High Risk)</span>
            <span className="text-sm font-black font-mono text-rose-400">{stats.redCount}</span>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs font-mono text-amber-300">YELLOW Defaults (Form Deadlines)</span>
            <span className="text-sm font-black font-mono text-amber-400">{stats.yellowCount}</span>
          </div>
          <div className="bg-fuchsia-500/5 border border-fuchsia-500/10 px-4 py-2.5 rounded-xl flex items-center justify-between">
            <span className="text-xs font-mono text-fuchsia-300">BLACK Overrides (Null & Void)</span>
            <span className="text-sm font-black font-mono text-fuchsia-400">{stats.blackCount}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative grow">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search by rule code, name, section (e.g., Sec 81)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200"
            />
          </div>

          {/* Quick Trigger Status Filter */}
          <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 font-mono text-xs max-w-fit">
            <button
              onClick={() => setFilterTriggered(null)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterTriggered === null ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Rules ({evaluatedRules.length})
            </button>
            <button
              onClick={() => setFilterTriggered(true)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterTriggered === true ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Triggered ({evaluatedRules.filter((r) => r.triggered).length})
            </button>
            <button
              onClick={() => setFilterTriggered(false)}
              className={`px-3.5 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterTriggered === false ? 'bg-teal-500/10 text-teal-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Compliant ({evaluatedRules.filter((r) => !r.triggered).length})
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 py-1 overflow-x-auto border-b border-slate-800/40">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-lg font-mono text-xs whitespace-nowrap cursor-pointer transition-all ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              {cat === 'all' ? 'All Classes' : `${cat} Module`}
            </button>
          ))}
        </div>
      </div>

      {/* Rules Registry Cards Stack */}
      <div className="space-y-3" id="rules-cards-stack">
        {filteredRules.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-12 text-center text-slate-500 font-mono text-sm">
            No rules matching search or category filters found in the active database.
          </div>
        ) : (
          filteredRules.map((rule) => {
            // Find relative logs for this specific rule in this company to show operator tags
            const ruleLogs = trail.filter(
              t => t.companyId === selectedCompany.id && t.ruleId === rule.id
            );

            return (
              <motion.div
                layout="position"
                key={rule.id}
                onClick={() => toggleExpand(rule.id)}
                className={`bg-slate-900 border transition-all rounded-xl cursor-pointer select-none relative overflow-hidden ${
                  rule.isBypassed
                    ? 'border-indigo-950 hover:bg-indigo-950/5 hover:border-indigo-900'
                    : rule.triggered
                    ? 'border-rose-950 hover:bg-rose-950/5 hover:border-rose-900/60 shadow-[0_0_12px_rgba(244,63,94,0.02)]'
                    : 'border-slate-800/80 hover:bg-slate-800/20 hover:border-slate-700/60'
                }`}
                id={`rule-card-${rule.id}`}
              >
                {/* Visual Bypass Label watermark overlay */}
                {rule.isBypassed && (
                  <div className="absolute top-0 right-0 h-1.5 bg-indigo-500 w-full" />
                )}

                <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className={`mt-0.5 rounded-lg p-2 border flex items-center justify-center shrink-0 ${
                      rule.isBypassed
                        ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                        : rule.triggered
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                        : 'bg-teal-500/10 border-teal-500/20 text-teal-400'
                    }`}>
                      {rule.isBypassed ? <CheckCircle2 className="w-5 h-5 text-indigo-400" /> : rule.triggered ? <AlertTriangle className="w-5 h-5 animate-pulse" /> : <ShieldCheck className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold tracking-wider text-slate-500">{rule.id}</span>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border uppercase tracking-wide font-semibold ${
                          rule.severity === 'RED'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            : rule.severity === 'BLACK'
                            ? 'bg-fuchsia-950/40 border-fuchsia-500/20 text-fuchsia-300'
                            : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                        }`}>
                          {rule.severity} ({rule.points} pts)
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-2 py-0.5 rounded">
                          {rule.category}
                        </span>
                        {rule.isBypassed && (
                          <span className="text-[9px] font-mono bg-indigo-950/65 border border-indigo-500/30 text-indigo-300 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider">
                            Supervisor Cleared
                          </span>
                        )}
                        {ruleLogs.some(l => l.action === 'acknowledged') && (
                          <span className="text-[9px] font-mono bg-amber-500/5 border border-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded-md">
                            Ack Present
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-slate-200 font-sans tracking-tight leading-snug">
                        {rule.name}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {rule.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 md:self-center">
                    <div className="text-right font-mono">
                      <span className="block text-[10px] text-slate-500 uppercase tracking-widest leading-none">status</span>
                      <span className={`text-xs font-bold uppercase tracking-wider block mt-1 ${
                        rule.isBypassed ? 'text-indigo-400' : rule.triggered ? 'text-rose-400' : 'text-teal-400'
                      }`}>
                        {rule.isBypassed ? 'Cleared (Bypassed)' : rule.triggered ? 'Default Detected' : 'Compliant'}
                      </span>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-slate-500 transition-transform ${
                      expandedRuleId === rule.id ? 'rotate-90 text-slate-300' : ''
                    }`} />
                  </div>
                </div>

                {/* Expanded content detailing law and legal context */}
                <AnimatePresence>
                  {expandedRuleId === rule.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden bg-slate-950/40 border-t border-slate-800/80"
                    >
                      <div className="p-5 space-y-4 text-xs font-mono">
                        {/* Section details */}
                        <div className="flex items-start gap-2 text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                          <Scale className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-widest">statutory provision source</span>
                            <span className="text-xs text-slate-300 font-semibold">{rule.section}</span>
                          </div>
                        </div>

                        {/* Explanation */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] text-slate-500 block uppercase tracking-widest leading-none font-bold">legal context & rjsc procedure</span>
                          <p className="text-slate-400 leading-relaxed font-sans text-xs">
                            {rule.context}
                          </p>
                        </div>

                        {/* Evaluation Trigger parameters */}
                        {rule.wasTriggeredBeforeBypass && !rule.isBypassed && (
                          <div className="border border-rose-955 bg-rose-950/10 p-3 rounded-lg text-rose-300 space-y-1 font-sans">
                            <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest font-bold block">operational indicator trigger rationale</span>
                            <p className="text-xs">
                              Triggered based on the core company parameters entered. Ensure necessary filings (Form VIII, Form XII, or Schedule X) are processed, or log an official acknowledgment / supervisor clearance.
                            </p>
                          </div>
                        )}

                        {/* Real-time Inline Operator Action Center */}
                        <div className="border border-slate-850 bg-slate-900/50 p-4 rounded-xl space-y-3" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                            <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-teal-400" />
                              Operator Verification Console
                            </span>
                            <span className="text-[9px] text-slate-500">{ruleLogs.length} action logs</span>
                          </div>

                          {/* Rule Logs List */}
                          {ruleLogs.length > 0 && (
                            <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {ruleLogs.map((log) => (
                                <div key={log.id} className="bg-slate-950 border border-slate-900 p-2 rounded-lg flex items-start gap-2 justify-between">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase text-[8px] font-mono ${
                                        log.action === 'triggered' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                        log.action === 'acknowledged' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                        'bg-teal-500/10 text-teal-400 border border-teal-500/20'
                                      }`}>
                                        {log.action}
                                      </span>
                                      <span className="text-[10px] text-slate-300 italic font-sans">
                                        &ldquo;{log.notes}&rdquo;
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-right text-[8px] text-slate-500 font-mono flex flex-col justify-center select-none">
                                    <span className="text-slate-400 text-[10px] font-semibold">{log.username}</span>
                                    <span>{log.timestamp.split('T')[1].substring(0, 5)} - {log.timestamp.split('T')[0]}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Forms */}
                          {session.role === 'spectator' ? (
                            <p className="text-[10px] text-amber-500 italic font-sans">
                              * Spectator Account: Read-only access limits manual log audits or administrative clearance overrides.
                            </p>
                          ) : (
                            <div className="space-y-3 pt-1">
                              <div className="space-y-1">
                                <label className="block text-[9px] text-slate-500 uppercase tracking-wider font-bold">Notes / Verification Comments</label>
                                <input
                                  type="text"
                                  placeholder="Enter clearance details or acknowledgment justification..."
                                  value={noteInputs[rule.id] || ''}
                                  onChange={(e) => setNoteInputs({ ...noteInputs, [rule.id]: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-300 font-sans"
                                />
                              </div>

                              <div className="flex flex-wrap gap-2 justify-end">
                                {/* Acknowledge default */}
                                {rule.wasTriggeredBeforeBypass && !rule.isBypassed && (
                                  <button
                                    onClick={() => handleLogActionLocal(rule.id, rule.name, 'acknowledged')}
                                    className="p-1.5 px-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-slate-950 text-amber-300 rounded-lg text-[10px] font-bold font-mono transition-all cursor-pointer uppercase"
                                  >
                                    Acknowledge Violation
                                  </button>
                                )}

                                {/* Clearance override toggling */}
                                {rule.wasTriggeredBeforeBypass && (
                                  <button
                                    onClick={() => handleToggleBypassLocal(rule.id, rule.name, rule.isBypassed)}
                                    className={`p-1.5 px-3 rounded-lg text-[10px] font-bold font-mono transition-all border cursor-pointer uppercase ${
                                      rule.isBypassed
                                        ? 'bg-slate-800 border-slate-700 hover:bg-rose-500/10 hover:border-rose-500/20 text-slate-300 hover:text-rose-400'
                                        : 'bg-indigo-600/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-600 hover:text-white'
                                    }`}
                                  >
                                    {rule.isBypassed ? "Revoke Exemption Override" : "Sign Clearance Exemption"}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
