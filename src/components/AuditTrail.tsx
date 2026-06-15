import React, { useState, useMemo } from 'react';
import { AuditTrailEntry, Company, UserSession } from '../types';
import { 
  FileClock, Search, AlertCircle, CheckCircle2, Eye, ShieldAlert, Trash2, 
  Download, FileSpreadsheet, RefreshCw, Layers, User, Tag, Clock, Calendar,
  Sparkles, BrainCircuit, Loader2, Copy, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AuditTrailProps {
  selectedCompany: Company;
  trail: AuditTrailEntry[];
  onClearTrail: () => void;
  session: UserSession;
}

export default function AuditTrail({ selectedCompany, trail, onClearTrail, session }: AuditTrailProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [showAllCompanies, setShowAllCompanies] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'rules'>('timeline');
  const [expandedRuleIds, setExpandedRuleIds] = useState<Record<string, boolean>>({});

  // Grouped rule history calculation
  const ruleHistories = useMemo(() => {
    const groups: Record<string, AuditTrailEntry[]> = {};
    
    // Sort trail oldest first for chronological progression inside each rule group
    const sortedBaseTrail = [...trail].sort((a, b) => new Date(a.timestamp).getTime() - b.timestamp.localeCompare(a.timestamp));
    
    sortedBaseTrail.forEach(item => {
      // Company match filter (Selected company or all)
      const companyMatches = showAllCompanies || item.companyId === selectedCompany.id;
      if (!companyMatches) return;
      
      // Search query filtering
      const matchesSearch = 
        item.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return;

      if (!groups[item.ruleId]) {
        groups[item.ruleId] = [];
      }
      groups[item.ruleId].push(item);
    });

    return Object.entries(groups).map(([ruleId, items]) => {
      const sortedItems = [...items].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      const latestItem = sortedItems[sortedItems.length - 1];
      
      return {
        ruleId,
        ruleName: latestItem.ruleName,
        companyId: latestItem.companyId,
        currentStatus: latestItem.action, // 'triggered' | 'acknowledged' | 'cleared'
        history: sortedItems,
        latestItem,
      };
    }).sort((a, b) => new Date(b.latestItem.timestamp).getTime() - new Date(a.latestItem.timestamp).getTime()); // sort by latest action first
  }, [trail, selectedCompany, searchQuery, showAllCompanies]);

  const filteredRuleHistories = useMemo(() => {
    return ruleHistories.filter(group => {
      if (filterAction === 'all') return true;
      return group.currentStatus === filterAction;
    });
  }, [ruleHistories, filterAction]);

  // Gemini Synthesis states
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [summaryReport, setSummaryReport] = useState<string | null>(null);
  const [analyzedLogsCount, setAnalyzedLogsCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateSummary = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setSummaryReport(null);
    setShowSummaryModal(true);
    
    const messages = [
      "Securing connection with compliance vector space...",
      "Chronologically indexing the previous 7 days of audit logs...",
      "Analyzing defaults & triggers against Bangladesh legal frameworks...",
      "Structuring professional executive recommendations via Gemini...",
      "Fine-tuning advisory outcomes for RJSC alignment..."
    ];
    
    let msgIndex = 0;
    setLoadingMessage(messages[0]);
    
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % messages.length;
      setLoadingMessage(messages[msgIndex]);
    }, 2200);

    try {
      const response = await fetch("/api/gemini/weekly-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedCompany.name,
          logs: trail
        })
      });

      const data = await response.json();
      clearInterval(interval);

      if (!response.ok) {
        if (data.error === "API_KEY_MISSING") {
          throw new Error("API_KEY_MISSING");
        }
        throw new Error(data.message || data.error || "Failed to make summary request.");
      }

      setSummaryReport(data.summary);
      setAnalyzedLogsCount(data.analyzedLogsCount || 0);
    } catch (err: any) {
      clearInterval(interval);
      if (err.message === "API_KEY_MISSING") {
        setErrorMessage("GEMINI_API_KEY_MISSING");
      } else {
        setErrorMessage(err.message || "An unexpected error occurred during report synthesis.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyReport = () => {
    if (!summaryReport) return;
    navigator.clipboard.writeText(summaryReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper Markdown custom parser
  const renderMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('### ')) {
        return <h4 key={i} className="text-white text-xs font-bold mt-4 mb-2 tracking-wide font-mono uppercase text-teal-400">{trimmed.slice(4)}</h4>;
      }
      if (trimmed.startsWith('## ')) {
        return <h3 key={i} className="text-white text-xs font-black mt-5 mb-3 tracking-wider font-sans border-b border-slate-800 pb-1.5 uppercase text-indigo-300">{trimmed.slice(3)}</h3>;
      }
      if (trimmed.startsWith('# ')) {
        return <h2 key={i} className="text-white text-sm font-black mt-6 mb-4 tracking-tight border-b border-slate-800 pb-2 uppercase text-white">{trimmed.slice(2)}</h2>;
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={i} className="text-slate-300 ml-4 list-disc text-xs leading-relaxed my-1">
            {parseBold(trimmed.slice(2))}
          </li>
        );
      }
      
      const matchNumbered = trimmed.match(/^(\d+)\.\s(.*)/);
      if (matchNumbered) {
        return (
          <div key={i} className="flex gap-2 text-xs text-slate-300 leading-relaxed my-1.5 pl-1">
            <span className="text-teal-400 font-bold font-mono shrink-0">{matchNumbered[1]}.</span>
            <div>{parseBold(matchNumbered[2])}</div>
          </div>
        );
      }
      
      if (trimmed === '') {
        return <div key={i} className="h-2" />;
      }

      return <p key={i} className="text-slate-300 text-xs leading-relaxed my-2">{parseBold(trimmed)}</p>;
    });
  };

  const parseBold = (text: string) => {
    const regex = /\*\*(.*?)\*\*/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;
    let key = 0;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      parts.push(<strong key={key++} className="text-white font-semibold font-sans">{match[1]}</strong>);
      lastIndex = regex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  // Filter trail rules
  const sortedAndFilteredTrail = useMemo(() => {
    let list = [...trail];
    
    // Sort by timestamp descending (newest first)
    list.sort((a, b) => new Date(b.timestamp).getTime() - a.timestamp.localeCompare(b.timestamp));

    return list.filter((item) => {
      // Company scoping
      const companyMatches = showAllCompanies || item.companyId === selectedCompany.id;
      
      // Search matching
      const matchesSearch = 
        item.ruleId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.ruleName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));

      // Action matching
      const matchesAction = filterAction === 'all' || item.action === filterAction;

      return companyMatches && matchesSearch && matchesAction;
    });
  }, [trail, selectedCompany, searchQuery, filterAction, showAllCompanies]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (sortedAndFilteredTrail.length === 0) return;
    
    const headers = ['Timestamp', 'Company ID', 'Rule ID', 'Rule Name', 'Action', 'Operator', 'Role', 'Notes'];
    const rows = sortedAndFilteredTrail.map(item => [
      item.timestamp,
      item.companyId,
      item.ruleId,
      item.ruleName.replace(/"/g, '""'),
      item.action.toUpperCase(),
      item.username,
      item.role,
      (item.notes || '').replace(/"/g, '""')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `COMPLIANCE_AUDIT_TRAIL_${selectedCompany.name.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6" id="audit-trail-workspace">
      {/* Header Summary Dashboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden" id="audit-trail-hero">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full pointer-events-none blur-3xl animate-pulse" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2.5 py-1 rounded-md tracking-wider inline-flex items-center gap-1.5 font-bold">
              <FileClock className="w-3.5 h-3.5" />
              Compliance Immutable Audit Logs
            </span>
            <h2 className="text-xl font-bold font-sans tracking-tight text-white flex items-center gap-2">
              Statutory Activity & Audit Trail
            </h2>
            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Provides an active, tamper-evident timeline log detailing when compliance defaults were triggered by model parameters, as well as timestamps and active accounts who cleared or acknowledged each violation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              onClick={handleGenerateSummary}
              className="p-2.5 px-4 rounded-xl bg-gradient-to-r from-teal-500/20 via-indigo-500/20 to-teal-500/10 border border-teal-500/40 hover:border-teal-400 hover:from-teal-500/30 hover:to-indigo-500/30 text-teal-300 hover:text-white font-mono text-xs flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(20,184,166,0.1)] active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>Weekly Summary</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={sortedAndFilteredTrail.length === 0}
              className="p-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 disabled:opacity-40 hover:text-white text-slate-300 font-mono text-xs flex items-center gap-2 transition-all cursor-pointer shadow-inner disabled:cursor-not-allowed"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export CSV Sheets</span>
            </button>
            <button
              onClick={onClearTrail}
              className="p-2.5 px-3 rounded-xl bg-slate-950 hover:bg-rose-950/20 border border-slate-800 hover:border-rose-900/40 text-slate-400 hover:text-rose-400 font-mono text-xs flex items-center gap-1.5 transition-all cursor-pointer"
              title="Reset Database Logs"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear History</span>
            </button>
          </div>
        </div>

        {/* Real-time stats indicators */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-950/40 border border-slate-850 px-4 py-3 rounded-xl">
            <span className="block text-[10px] font-mono text-slate-500 uppercase tracking-wider">Total Evaluated Actions</span>
            <span className="text-xl font-bold font-mono text-white mt-1 block">
              {trail.filter(t => t.companyId === selectedCompany.id).length}
            </span>
          </div>
          <div className="bg-rose-500/5 border border-rose-500/10 px-4 py-3 rounded-xl flex flex-col justify-between">
            <span className="block text-[10px] font-mono text-rose-400 uppercase tracking-wider">Trigger Events</span>
            <span className="text-xl font-bold font-mono text-rose-300 mt-1 block">
              {trail.filter(t => t.companyId === selectedCompany.id && t.action === 'triggered').length}
            </span>
          </div>
          <div className="bg-amber-500/5 border border-amber-500/10 px-4 py-3 rounded-xl flex flex-col justify-between">
            <span className="block text-[10px] font-mono text-amber-400 uppercase tracking-wider">Acknowledge Logs</span>
            <span className="text-xl font-bold font-mono text-amber-300 mt-1 block">
              {trail.filter(t => t.companyId === selectedCompany.id && t.action === 'acknowledged').length}
            </span>
          </div>
          <div className="bg-teal-500/5 border border-teal-500/10 px-4 py-3 rounded-xl flex flex-col justify-between">
            <span className="block text-[10px] font-mono text-teal-400 uppercase tracking-wider">Clear & Resolutions</span>
            <span className="text-xl font-bold font-mono text-teal-300 mt-1 block">
              {trail.filter(t => t.companyId === selectedCompany.id && t.action === 'cleared').length}
            </span>
          </div>
        </div>
      </div>

      {/* View Mode Switching System */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl max-w-fit font-mono text-[11px] gap-1" id="audit-trail-view-mode-tabs">
        <button
          onClick={() => setViewMode('timeline')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            viewMode === 'timeline'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span>Chronological Activity Timeline</span>
        </button>
        <button
          onClick={() => setViewMode('rules')}
          className={`px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
            viewMode === 'rules'
              ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
              : 'text-slate-400 hover:text-emerald-400'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-emerald-400" />
          <span>Compliance Rules History Matrix</span>
        </button>
      </div>

      {/* Interactive Controls Filter Belt */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between" id="trail-filter-belt">
        <div className="flex flex-col sm:flex-row gap-3 grow">
          {/* Search bar */}
          <div className="relative grow max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder={viewMode === 'rules' ? "Search rule history (code, title, operators...)" : "Search audit trail (code, rules, operators...)"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl pl-10 pr-4 py-2 text-xs text-slate-300 font-mono"
            />
          </div>

          {/* Action pills filter selection */}
          <div className="flex bg-slate-900 border border-slate-850 p-1 rounded-xl font-mono text-[11px] max-w-fit">
            <button
              onClick={() => setFilterAction('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterAction === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Statuses
            </button>
            <button
              onClick={() => setFilterAction('triggered')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterAction === 'triggered' ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {viewMode === 'rules' ? 'Active Violations' : 'Triggered'}
            </button>
            <button
              onClick={() => setFilterAction('acknowledged')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterAction === 'acknowledged' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Acknowledged
            </button>
            <button
              onClick={() => setFilterAction('cleared')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
                filterAction === 'cleared' ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Cleared / Resolved
            </button>
          </div>
        </div>

        {/* Toggle to show other entities */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAllCompanies(!showAllCompanies)}
            className={`px-3.5 py-2 rounded-xl text-xs font-mono border transition-all cursor-pointer flex items-center gap-1.5 ${
              showAllCompanies 
                ? 'bg-slate-900 border-teal-500/30 text-teal-300 font-bold' 
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:border-slate-800 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{showAllCompanies ? "Showing All Entities" : "Selected Entity Only"}</span>
          </button>
        </div>
      </div>

      {/* Main View Stream */}
      {viewMode === 'rules' ? (
        <div className="space-y-4" id="grouped-rules-compliance-ledger">
          {filteredRuleHistories.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-16 text-center select-none">
              <ShieldAlert className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-xs font-mono text-slate-500">
                No compliance rules fit the selected status in this audit ledger.
              </p>
              <p className="text-[10px] font-mono text-slate-600 max-w-sm mx-auto mt-2 leading-relaxed">
                Check other status filter pills (e.g. Cleared, Active Violations) or toggle company scope to view records.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <AnimatePresence initial={false}>
                {filteredRuleHistories.map((group) => {
                  const isExpanded = expandedRuleIds[group.ruleId] === true;
                  
                  // Status badges style
                  const statusColors = {
                    triggered: {
                      badge: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
                      label: 'Active Violation Defect',
                      icon: <AlertCircle className="w-3.5 h-3.5 text-rose-450" />
                    },
                    acknowledged: {
                      badge: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                      label: 'Officer Acknowledged',
                      icon: <Eye className="w-3.5 h-3.5 text-amber-500" />
                    },
                    cleared: {
                      badge: 'text-teal-400 bg-teal-500/10 border-teal-500/20',
                      label: 'Verified Fully Resolved',
                      icon: <CheckCircle2 className="w-3.5 h-3.5 text-teal-450" />
                    }
                  }[group.currentStatus] || {
                    badge: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                    label: 'Unknown',
                    icon: <AlertCircle className="w-3.5 h-3.5" />
                  };

                  return (
                    <motion.div
                      key={group.ruleId}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      className="bg-slate-900 border border-slate-850 p-5 rounded-2xl space-y-4 text-left hover:border-slate-800 hover:shadow-lg transition-all"
                      id={`rule-group-${group.ruleId}`}
                    >
                      {/* Top Header Card */}
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold bg-slate-950 px-2.5 py-1 rounded border border-slate-800 text-teal-400">
                            {group.ruleId}
                          </span>
                          <span className={`text-[10px] font-mono uppercase tracking-widest font-black px-2.5 py-1 rounded-md border flex items-center gap-1.5 ${statusColors.badge}`}>
                            {statusColors.icon}
                            <span>{statusColors.label}</span>
                          </span>
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {group.history.length} lifecycle {group.history.length === 1 ? 'event' : 'events'} recorded
                        </div>
                      </div>

                      {/* Rule details */}
                      <div className="space-y-1">
                        <h3 className="text-sm font-sans font-bold text-white tracking-tight">
                          {group.ruleName}
                        </h3>
                        <p className="text-[11px] font-mono text-slate-500">
                          Bangladesh Companies Act 1994 statutory obligation.
                        </p>
                      </div>

                      {/* Complete sequenced Step-by-Step flow */}
                      <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-3 font-mono text-xs">
                        <div className="text-[10px] uppercase font-bold text-slate-500 tracking-widest border-b border-slate-800 pb-2 flex items-center justify-between">
                          <span>Statutory Progression Stream</span>
                          <span className="text-[9px] text-slate-400">Oldest to Newest</span>
                        </div>
                        
                        <div className="relative pl-4 border-l border-slate-800 space-y-4 pt-1">
                          {group.history.map((evt, idx) => {
                            const evtColors = {
                              triggered: 'bg-rose-500 text-rose-500 border-rose-400/50',
                              acknowledged: 'bg-amber-500 text-amber-500 border-amber-405/50',
                              cleared: 'bg-teal-500 text-teal-500 border-teal-400/50',
                            }[evt.action];

                            return (
                              <div key={evt.id} className="relative text-[11px]" id={`progression-step-${evt.id}`}>
                                {/* Progression Marker Dot */}
                                <div className={`absolute -left-[20.5px] top-1 w-2.5 h-2.5 rounded-full border bg-slate-950 ${evtColors}`} />
                                
                                <div className="space-y-1.5">
                                  {/* Step details strip */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="capitalize font-bold text-slate-200">
                                        {evt.action === 'triggered' ? '🔴 Triggered Defect' : evt.action === 'acknowledged' ? '🟡 Filing Acknowledged' : '🟢 Verified Cleared'}
                                      </span>
                                      <span className="text-[10px] text-slate-600">by</span>
                                      <span className="text-[10px] text-slate-300 font-semibold bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded flex items-center gap-1.5">
                                        <User className="w-2.5 h-2.5 text-slate-500" />
                                        <span>{evt.username}</span>
                                        <span className="text-[8px] text-slate-500">[{evt.role}]</span>
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{new Date(evt.timestamp).toLocaleString()}</span>
                                    </div>
                                  </div>

                                  {/* Operator Notes details */}
                                  {evt.notes && (
                                    <p className="text-slate-400 font-sans text-xs italic bg-slate-900/40 p-2.5 border border-slate-850 rounded-lg pl-3 leading-normal">
                                      &ldquo;{evt.notes}&rdquo;
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4" id="trail-timeline-stream">
          {sortedAndFilteredTrail.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-16 text-center select-none">
              <FileClock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-xs font-mono text-slate-500">
                No audit logs captured for this scope matching parameters.
              </p>
              <p className="text-[10px] font-mono text-slate-600 max-w-sm mx-auto mt-2 leading-relaxed">
                Compliance events log automatically when the company defaults change, or manually when operators acknowledge specific rules.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 border-l-2 border-slate-850 space-y-4 ml-3" id="timeline-vanguard-connector-line">
              <AnimatePresence initial={false}>
                {sortedAndFilteredTrail.map((item, index) => {
                  let badgeStyle = 'text-rose-400 border-rose-500/20 bg-rose-500/5';
                  let iconBlock = <AlertCircle className="w-4 h-4" />;
                  let actionText = 'Violation Triggered';

                  if (item.action === 'acknowledged') {
                    badgeStyle = 'text-amber-400 border-amber-500/20 bg-amber-500/5';
                    iconBlock = <Eye className="w-4 h-4" />;
                    actionText = 'Acknowledge Signed';
                  } else if (item.action === 'cleared') {
                    badgeStyle = 'text-teal-400 border-teal-500/20 bg-teal-500/5';
                    iconBlock = <CheckCircle2 className="w-4 h-4" />;
                    actionText = 'Violation Resolved';
                  }

                  // Check relative time calculation or display absolute
                  const relativeTime = (() => {
                    try {
                      const elapsed = Date.now() - new Date(item.timestamp).getTime();
                      const seconds = Math.floor(elapsed / 1000);
                      const minutes = Math.floor(seconds / 60);
                      const hours = Math.floor(minutes / 60);
                      const days = Math.floor(hours / 24);

                      if (days > 0) return `${days}d ago`;
                      if (hours > 0) return `${hours}h ago`;
                      if (minutes > 0) return `${minutes}m ago`;
                      return 'just now';
                    } catch (e) {
                      return item.timestamp;
                    }
                  })();

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="relative group bg-slate-900 border border-slate-850/70 p-4.5 rounded-xl hover:bg-slate-900/80 hover:border-slate-800 transition-all"
                      id={`trail-card-${item.id}`}
                    >
                      {/* Circle Node on Timeline Left Line */}
                      <div className={`absolute -left-[31px] top-5 w-4 h-4 rounded-full border-2 bg-slate-950 flex items-center justify-center transition-transform group-hover:scale-110 ${
                        item.action === 'triggered' ? 'border-rose-500 text-rose-500' : 
                        item.action === 'acknowledged' ? 'border-amber-500 text-amber-500' : 'border-teal-500 text-teal-500'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          item.action === 'triggered' ? 'bg-rose-500' :
                          item.action === 'acknowledged' ? 'bg-amber-500' : 'bg-teal-500'
                        }`} />
                      </div>

                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 font-mono text-xs">
                        {/* Left Column info */}
                        <div className="grow space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border inline-flex items-center gap-1 leading-none ${badgeStyle}`}>
                              {iconBlock}
                              <span>{actionText}</span>
                            </span>

                            <span className="text-[10px] text-slate-500">
                              Code: <strong className="text-slate-400">{item.ruleId}</strong>
                            </span>

                            {showAllCompanies && (
                              <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded border border-slate-850 text-slate-400">
                                For selected: <strong>{item.companyId}</strong>
                              </span>
                            )}
                          </div>

                          <div className="space-y-0.5">
                            <h4 className="text-xs font-bold text-slate-200 tracking-tight leading-snug">
                              {item.ruleName}
                            </h4>
                            {item.notes && (
                              <p className="text-slate-400 font-sans text-xs italic bg-slate-950/40 p-2 border border-slate-850/40 rounded-lg mt-1 leading-normal">
                                &ldquo;{item.notes}&rdquo;
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Right Column: User Operator and Clock info */}
                        <div className="shrink-0 flex md:flex-col items-start md:items-end justify-between font-mono text-[10px] gap-2 md:gap-1.5 min-w-[150px] border-t md:border-t-0 border-slate-850/60 pt-2 md:pt-0">
                          {/* Specific User details */}
                          <div className="flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-md bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0">
                              <User className="w-3 h-3 text-slate-400" />
                            </div>
                            <div className="text-left md:text-right">
                              <span className="block text-slate-300 font-semibold leading-tight">{item.username}</span>
                              <span className="block text-[8px] text-slate-500 uppercase tracking-widest leading-none mt-0.5">Role: {item.role}</span>
                            </div>
                          </div>

                          {/* Relative / absolute clock */}
                          <div className="text-slate-500 flex items-center gap-1 select-none leading-none">
                            <Clock className="w-3 h-3 text-slate-600" />
                            <span className="font-semibold text-slate-400" title={item.timestamp}>{relativeTime}</span>
                            <span className="text-slate-600 text-[9px] hidden lg:inline">({item.timestamp.split('T')[0]})</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* WEEKLY COMPLIANCE BRIEFING SUMMARY MODAL */}
      <AnimatePresence>
        {showSummaryModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm" id="summary-modal-backdrop">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-2xl w-full relative overflow-hidden space-y-5 shadow-2xl h-[85vh] flex flex-col"
              id="weekly-summary-modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              {/* background watermark */}
              <div className="absolute top-0 right-0 p-4 select-none opacity-[0.02] pointer-events-none">
                <BrainCircuit className="w-44 h-44 text-teal-450" />
              </div>

              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                    <Sparkles className="w-5 h-5 text-teal-400 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-base font-bold text-white font-sans tracking-tight">
                      Weekly Compliance Executive Briefing
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono">
                      Powered by Gemini 3.5 Flash • Bangladesh Companies Act 1994 analysis
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="p-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-850 rounded-lg text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content Panel */}
              <div className="grow overflow-y-auto pr-1 space-y-4 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                {isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                    <div className="relative">
                      <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-xl animate-pulse" />
                      <Loader2 className="w-10 h-10 text-teal-400 animate-spin relative" />
                    </div>
                    <div className="space-y-1.5 max-w-md col-span-3">
                      <p className="text-xs font-mono text-teal-400 font-bold tracking-wider">{loadingMessage}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        This model is summarizing raw events, compiling statutory indicators, and crafting guidance.
                      </p>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                    {errorMessage === "GEMINI_API_KEY_MISSING" ? (
                      <>
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400">
                          <ShieldAlert className="w-8 h-8" />
                        </div>
                        <div className="space-y-2 max-w-md">
                          <h4 className="text-sm font-bold text-white font-sans">
                            API Key Setup Required
                          </h4>
                          <p className="text-xs text-slate-400 leading-normal font-sans">
                            The weekly summary assistant requires the <code className="bg-slate-950 px-1 py-0.5 rounded border border-slate-850 font-mono text-rose-300">GEMINI_API_KEY</code> environment variable to function.
                          </p>
                          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl text-left text-[11px] text-slate-400 font-mono space-y-1.5">
                            <span className="block font-bold text-slate-300">How to authorize:</span>
                            <p>1. Copy your Gemini API key from Google AI Studio.</p>
                            <p>2. Open the <strong className="text-white">Settings</strong> dialog (top right menu of your workspace editor).</p>
                            <p>3. Add a new secret called <strong className="text-teal-400">GEMINI_API_KEY</strong> with your key as the value.</p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 mb-2">
                          <AlertCircle className="w-8 h-8" />
                        </div>
                        <div className="space-y-1 max-w-md">
                          <h4 className="text-xs font-mono text-slate-400">Synthesis Failed</h4>
                          <p className="text-xs text-rose-400 font-bold font-mono">{errorMessage}</p>
                          <p className="text-[10px] text-slate-500 pt-2 font-mono">
                            Please check browser console for errors or retry. Verify server routing is healthy.
                          </p>
                        </div>
                        <button
                          onClick={handleGenerateSummary}
                          className="mt-4 p-2 px-4 bg-slate-950 border border-slate-850 text-slate-300 text-xs font-mono rounded-lg hover:border-slate-800 transition-all cursor-pointer font-bold"
                        >
                          <RefreshCw className="w-3.5 h-3.5 inline mr-1.5 text-teal-400 animate-spin" />
                          Retry Generation
                        </button>
                      </>
                    )}
                  </div>
                ) : summaryReport ? (
                  <div className="space-y-4" id="summarization-output-loaded">
                    {/* Summary Metadata Belt */}
                    <div className="bg-slate-950/80 border border-slate-850 p-3.5 rounded-xl grid grid-cols-2 lg:grid-cols-3 gap-3 text-[10px] font-mono text-slate-400 text-left">
                      <div>
                        <span className="block text-slate-500 uppercase tracking-widest font-bold">Subject Company:</span>
                        <span className="text-white font-sans font-black truncate block mt-0.5" title={selectedCompany.name}>
                          {selectedCompany.name}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase tracking-widest font-bold">Scope Period:</span>
                        <span className="text-teal-400 font-bold block mt-0.5">
                          Previous 7 Days Activity
                        </span>
                      </div>
                      <div className="col-span-2 lg:col-span-1">
                        <span className="block text-slate-500 uppercase tracking-widest font-bold">Audit Logs Analyzed:</span>
                        <span className="text-white block mt-0.5">
                          <strong className="text-white font-extrabold">{analyzedLogsCount} events</strong> compiled
                        </span>
                      </div>
                    </div>

                    {/* Rendered Text Report Panel */}
                    <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl text-left select-text relative">
                      <div className="absolute top-2 right-2 text-[8px] font-mono text-slate-600 bg-slate-950/80 p-1 px-1.5 border border-slate-900 rounded">
                        COMPLIANCE_MEMO_v1.0
                      </div>
                      
                      <div className="markdown-body divide-y divide-slate-900/40 space-y-4 text-left">
                        {renderMarkdown(summaryReport)}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Modal Footer with Actions */}
              {!isGenerating && !errorMessage && summaryReport && (
                <div className="flex gap-3 pt-3 border-t border-slate-850 justify-end font-mono text-xs shrink-0 bg-slate-900">
                  <button
                    onClick={handleCopyReport}
                    className="p-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-850 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 font-bold uppercase tracking-wide"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-teal-400" />
                        <span className="text-teal-400 font-extrabold">Copied Memo!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-400" />
                        <span>Copy Summary</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="p-2.5 px-5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                  >
                    Close Briefing
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
