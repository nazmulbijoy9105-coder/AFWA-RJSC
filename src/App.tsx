import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Company, UserSession, AuditTrailEntry, SentEmail } from './types';
import { COMPLIANCE_RULES, MOCK_COMPANIES } from './data/rules';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs 
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase';

// Custom Components
import AuthSim from './components/AuthSim';
import CompanyModal from './components/CompanyModal';
import RuleRegistry from './components/RuleRegistry';
import TimelineTracker from './components/TimelineTracker';
import FormsGenerator from './components/FormsGenerator';
import AuditTrail from './components/AuditTrail';
import PredictiveRiskForecast from './components/PredictiveRiskForecast';
import StatutoryChat from './components/StatutoryChat';
import SubscriptionDesk from './components/SubscriptionDesk';
import ComplianceAnalytics from './components/ComplianceAnalytics';
import DirectorEmailLogs from './components/DirectorEmailLogs';

// Icons
import {
  Plus, Edit3, Trash2, Calendar, AlertTriangle, ShieldCheck, Scale,
  BookOpen, Clock, FileCheck, Terminal, HelpCircle, FileText, ChevronRight, FileClock, Sparkles, TrendingUp, Mail
} from 'lucide-react';

export default function App() {
  // Authentication State
  const [session, setSession] = useState<UserSession>({
    username: '',
    role: 'spectator',
    isLoggedIn: false
  });

  // State: List of companies
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  
  // State: Compliance manual trails and overrides mapping companyId -> bypassed rules list
  const [trail, setTrail] = useState<AuditTrailEntry[]>([]);
  const [bypassedRules, setBypassedRules] = useState<Record<string, string[]>>({});
  const [sentEmails, setSentEmails] = useState<SentEmail[]>([]);

  // State: Modals & Editing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [companyToEdit, setCompanyToEdit] = useState<Company | null>(null);

  // State: Deep linkage for direct audit trails
  const [deepLinkId, setDeepLinkId] = useState<string | null>(null);

  // Synchronize with URL Query Parameters for direct deep linking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      const id = params.get('id');
      const companyId = params.get('companyId');

      if (tab === 'audit' || tab === 'timeline' || tab === 'drafts' || tab === 'trail' || tab === 'subscription' || tab === 'analytics' || tab === 'emails') {
        setActiveTab(tab as any);
      }
      if (companyId && companies.some(c => c.id === companyId)) {
        setSelectedCompanyId(companyId);
      }
      if (id) {
        setDeepLinkId(id);
      }
    }
  }, [companies]);

  // State: Active Dashboard Segment View
  const [activeTab, setActiveTab ] = useState<'audit' | 'timeline' | 'drafts' | 'trail' | 'subscription' | 'analytics' | 'emails'>('audit');

  // Terminal Logs Sim State
  const [logs, setLogs] = useState<string[]>([
    'SYSTEM: RJSC Compliance Vanguard online.',
    'SECURITY: Cloud-backed core active.'
  ]);

  // Helper log addition
  const addLog = (msg: string) => {
    setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev.slice(0, 15)]);
  };

  // Listen to Firestore changes in real-time when authenticated
  useEffect(() => {
    if (!session.isLoggedIn) {
      setCompanies([]);
      setTrail([]);
      setBypassedRules({});
      return;
    }

    addLog('DATABASE: Accessing statutory indices in continuous secure sync mode...');

    // 1. Sync Companies
    const unsubscribeCompanies = onSnapshot(collection(db, 'companies'), async (snapshot) => {
      try {
        const companyList: Company[] = [];
        snapshot.forEach((docSnap) => {
          companyList.push(docSnap.data() as Company);
        });
        
        if (companyList.length === 0) {
          // DATABASE SEEDING
          addLog('DB SEEDING: Creating fallback default indices...');
          for (const fallbackComp of MOCK_COMPANIES) {
            await setDoc(doc(db, 'companies', fallbackComp.id), fallbackComp);
          }
        } else {
          setCompanies(companyList);
          // Auto-select first company if none is selected
          if (!selectedCompanyId || !companyList.some(c => c.id === selectedCompanyId)) {
            setSelectedCompanyId(companyList[0].id);
          }
        }
      } catch (err) {
        console.error("Firestore listening error on companies:", err);
      }
    }, (error) => {
      console.warn("Unable to read firestore companies, fall back to mock:", error);
    });

    // 2. Sync Audit Trails
    const unsubscribeTrails = onSnapshot(collection(db, 'auditTrails'), async (snapshot) => {
      try {
        const trailList: AuditTrailEntry[] = [];
        snapshot.forEach((docSnap) => {
          trailList.push(docSnap.data() as AuditTrailEntry);
        });
        
        // Sort chronologically descending
        trailList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        
        if (trailList.length === 0) {
          // DATABASE SEEDING for trails
          const seededTrail: AuditTrailEntry[] = [
            {
              id: 'tra_seed01',
              companyId: 'COM-1',
              ruleId: 'INC-1.13',
              ruleName: 'Corporate TIN Registration',
              action: 'cleared',
              timestamp: '2026-06-12T10:15:30.000Z',
              username: 'compliance_manager@dhakallp.com',
              role: 'admin',
              notes: 'TIN verification completed. Online tax credentials linked correctly.'
            },
            {
              id: 'tra_seed02',
              companyId: 'COM-1',
              ruleId: 'PRE-2.1',
              ruleName: 'First Auditor Appointment (Form VIII)',
              action: 'acknowledged',
              timestamp: '2026-06-13T14:24:10.000Z',
              username: 'compliance_manager@dhakallp.com',
              role: 'admin',
              notes: 'Directorship has contacted Rahman Rahman Huq FCA. Form VIII signing is scheduled next Wednesday.'
            },
            {
              id: 'tra_seed03',
              companyId: 'COM-2',
              ruleId: 'ANN-3.3',
              ruleName: 'Form XII & Schedule X Filings',
              action: 'triggered',
              timestamp: '2026-06-14T09:00:00.000Z',
              username: session.username || 'compliance_officer@vanguard.com',
              role: session.role || 'compliance_officer',
              notes: 'Annual Return backlog triggered automatically by the system due to financial year transition.'
            }
          ];
          for (const item of seededTrail) {
            await setDoc(doc(db, 'auditTrails', item.id), item);
          }
        } else {
          setTrail(trailList);
        }
      } catch (err) {
        console.error("Firestore loading error on auditTrails:", err);
      }
    }, (error) => {
      console.warn("Unable to read firestore trails:", error);
    });

    // 3. Sync Bypassed Exception rules
    const unsubscribeBypasses = onSnapshot(collection(db, 'bypassedRules'), (snapshot) => {
      try {
        const record: Record<string, string[]> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data.companyId && data.bypassedRuleIds) {
            record[data.companyId] = data.bypassedRuleIds;
          }
        });
        setBypassedRules(record);
      } catch (err) {
        console.error("Firestore loading error on bypassedRules:", err);
      }
    }, (error) => {
      console.warn("Unable to read firestore bypasses:", error);
    });

    // 4. Sync Sent Emails (From Automated trigger)
    const unsubscribeSentEmails = onSnapshot(collection(db, 'sentEmails'), (snapshot) => {
      try {
        const emailList: SentEmail[] = [];
        snapshot.forEach((docSnap) => {
          emailList.push(docSnap.data() as SentEmail);
        });
        emailList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setSentEmails(emailList);
      } catch (err) {
        console.error("Firestore loading error on sentEmails:", err);
      }
    }, (error) => {
      console.warn("Unable to read firestore sentEmails:", error);
    });

    return () => {
      unsubscribeCompanies();
      unsubscribeTrails();
      unsubscribeBypasses();
      unsubscribeSentEmails();
    };
  }, [session.isLoggedIn, session.username]);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId) || companies[0];
  }, [companies, selectedCompanyId]);

  // Log action callback inside RuleRegistry clicks
  const handleLogAction = async (ruleId: string, ruleName: string, action: 'acknowledged' | 'cleared' | 'triggered', notes?: string) => {
    const newEntry: AuditTrailEntry = {
      id: 'tra_' + Math.random().toString(36).substring(2, 9),
      companyId: selectedCompanyId,
      ruleId,
      ruleName,
      action,
      timestamp: new Date().toISOString(),
      username: session.username,
      role: session.role,
      notes: notes || ''
    };
    
    try {
      await setDoc(doc(db, 'auditTrails', newEntry.id), newEntry);
      addLog(`Logged action: "${ruleId}" marked ${action} in company history database.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `auditTrails/${newEntry.id}`);
    }
  };

  // Exemption / Override bypass toggling callback
  const handleToggleBypass = async (ruleId: string) => {
    const list = bypassedRules[selectedCompanyId] || [];
    let updatedList;
    if (list.includes(ruleId)) {
      updatedList = list.filter(id => id !== ruleId);
    } else {
      updatedList = [...list, ruleId];
    }
    
    try {
      await setDoc(doc(db, 'bypassedRules', selectedCompanyId), {
        companyId: selectedCompanyId,
        bypassedRuleIds: updatedList
      });
      addLog(`Toggled waiver for rule override: ${ruleId}`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bypassedRules/${selectedCompanyId}`);
    }
  };

  // Delete all audit trails for active company
  const handleClearTrail = async () => {
    if (confirm('Are you sure you want to purge all immutable compliance logs for this company? This action is irreversible.')) {
      const targets = trail.filter(t => t.companyId === selectedCompanyId);
      for (const t of targets) {
        try {
          await deleteDoc(doc(db, 'auditTrails', t.id));
        } catch (err) {
          handleFirestoreError(err, OperationType.DELETE, `auditTrails/${t.id}`);
        }
      }
      addLog('Purged historical logs database for the current entity.');
    }
  };

  // Onboard or Edit company save handler (with automatic trigger shifting tracking!)
  const handleSaveCompany = async (company: Company) => {
    const oldCompany = companies.find((c) => c.id === company.id);
    const exists = companies.some((c) => c.id === company.id);

    try {
      await setDoc(doc(db, 'companies', company.id), company);
      if (exists) {
        addLog(`Updated variables for company: ${company.name}`);
      } else {
        setSelectedCompanyId(company.id);
        addLog(`Onboarded new Private entity: ${company.name}`);
      }

      // Dynamic Parameter Shift tracking:
      if (oldCompany) {
        const differentialTriggers: AuditTrailEntry[] = [];
        COMPLIANCE_RULES.forEach((rule) => {
          const wasTriggered = rule.evaluate(oldCompany).triggered;
          const isTriggered = rule.evaluate(company).triggered;

          if (wasTriggered && !isTriggered) {
            // Rule has been resolved (cleared!)
            differentialTriggers.push({
              id: 'tra_' + Math.random().toString(36).substring(2, 9),
              companyId: company.id,
              ruleId: rule.id,
              ruleName: rule.name,
              action: 'cleared',
              timestamp: new Date().toISOString(),
              username: session.username,
              role: session.role,
              notes: 'System verified: Defect resolved via parameters shift (updated filings).'
            });
          } else if (!wasTriggered && isTriggered) {
            // Rule is newly triggered (new default!)
            differentialTriggers.push({
              id: 'tra_' + Math.random().toString(36).substring(2, 9),
              companyId: company.id,
              ruleId: rule.id,
              ruleName: rule.name,
              action: 'triggered',
              timestamp: new Date().toISOString(),
              username: session.username,
              role: session.role,
              notes: 'System flag: Defect triggered due to company parameters modification.'
            });
          }
        });

        for (const diffItem of differentialTriggers) {
          await setDoc(doc(db, 'auditTrails', diffItem.id), diffItem);
        }

        if (differentialTriggers.length > 0) {
          addLog(`Audit engine written ${differentialTriggers.length} automated change tracking logs.`);
        }
      } else {
        // Setup initial triggers record for newly onboarded client
        const initialTriggers: AuditTrailEntry[] = [];
        COMPLIANCE_RULES.forEach((rule) => {
          const evaluated = rule.evaluate(company);
          if (evaluated.triggered) {
            initialTriggers.push({
              id: 'tra_' + Math.random().toString(36).substring(2, 9),
              companyId: company.id,
              ruleId: rule.id,
              ruleName: rule.name,
              action: 'triggered',
              timestamp: new Date().toISOString(),
              username: session.username,
              role: session.role,
              notes: `Initial default registered on corporate onboarding: ${evaluated.notes || ''}`
            });
          }
        });
        
        for (const trigItem of initialTriggers) {
          await setDoc(doc(db, 'auditTrails', trigItem.id), trigItem);
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `companies/${company.id}`);
    }
  };

  // Delete company handler
  const handleDeleteCompany = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (companies.length <= 1) {
      alert('Keep at least one company registered to run audits.');
      return;
    }
    if (confirm('Are you sure you want to remove this entity from active audits?')) {
      try {
        await deleteDoc(doc(db, 'companies', id));
        // Prune bypass list
        await deleteDoc(doc(db, 'bypassedRules', id));
        
        const remaining = companies.filter(c => c.id !== id);
        if (remaining.length > 0) {
          setSelectedCompanyId(remaining[0].id);
        }
        addLog('Cleared company registry log.');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `companies/${id}`);
      }
    }
  };

  // Risk & Defaults calculations for sidebar stats
  const selectedCompanySummary = useMemo(() => {
    if (!selectedCompany) return { score: 0, breaches: 0, status: 'No Company' };
    
    let score = 0;
    let breaches = 0;
    const currentBypassedList = bypassedRules[selectedCompany.id] || [];
    
    COMPLIANCE_RULES.forEach((rule) => {
      // If rule is bypassed, it counts as compliant (0 score, not triggered)
      if (currentBypassedList.includes(rule.id)) return;

      if (rule.evaluate(selectedCompany).triggered) {
        score += rule.points;
        breaches++;
      }
    });

    let riskTier = 'Fully Compliant';
    if (score > 100) riskTier = 'Strike-Off Risk / Restorations';
    else if (score > 35) riskTier = 'Elevated Filing Defaults';
    else if (score > 0) riskTier = 'Minor Form Backlogs';

    return {
      score,
      breaches,
      riskTier
    };
  }, [selectedCompany, bypassedRules]);

  // Handle opening parameters editor
  const handleEditCompany = () => {
    setCompanyToEdit(selectedCompany);
    setIsModalOpen(true);
  };

  // Handle opening empty onboards wizard
  const handleAddCompany = () => {
    setCompanyToEdit(null);
    setIsModalOpen(true);
  };

  return (
    <AuthSim session={session} onUpdateSession={setSession}>
      <main className="grow grid grid-cols-1 lg:grid-cols-4 items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-850" id="vanguard-dashboard">
        
        {/* Left Drawer / Sidebar: Entity Navigator & Risk Gauge */}
        <section className="lg:col-span-1 bg-slate-900/50 p-5 flex flex-col justify-between space-y-6" id="dashboard-sidebar-panels">
          <div className="space-y-6">
            
            {/* Entity Selector Header */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">REGISTRY CLIENTS ({companies.length})</span>
              <button
                onClick={handleAddCompany}
                className="p-1.5 bg-teal-500/10 border border-teal-500/20 hover:bg-teal-500 hover:text-slate-950 rounded-xl text-teal-400 transition-all font-mono text-xs flex items-center gap-1 cursor-pointer shadow-sm active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Onboard</span>
              </button>
            </div>

            {/* List of Managed Companies */}
            <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1" id="comapnies-list-scrollbar">
              {companies.map((c) => {
                const isSelected = c.id === selectedCompanyId;
                
                // Real-time mini score indicator for sidebar cards (respect bypass states!)
                let compScore = 0;
                const companyBypass = bypassedRules[c.id] || [];
                COMPLIANCE_RULES.forEach((r) => { 
                  if (!companyBypass.includes(r.id) && r.evaluate(c).triggered) {
                    compScore += r.points; 
                  }
                });

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCompanyId(c.id);
                      addLog(`Targeted company evaluation: ${c.name}`);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 group relative overflow-hidden ${
                      isSelected
                        ? 'bg-slate-900 border-teal-500/30'
                        : 'bg-slate-950/40 border-slate-850 hover:bg-slate-900/40 hover:border-slate-800'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-teal-500" />
                    )}

                    <div className="grow space-y-1">
                      <h3 className="text-xs font-bold font-sans text-slate-200 group-hover:text-white line-clamp-1">
                        {c.name}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span>{c.regNumber || 'No ID'}</span>
                        <span>•</span>
                        <span className={`font-semibold ${compScore > 100 ? 'text-rose-400' : compScore > 0 ? 'text-amber-400' : 'text-teal-400'}`}>
                          {compScore} pts
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteCompany(c.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Company Real-time Risk Dial */}
            {selectedCompany && (
              <motion.div 
                className="bg-slate-950/60 border border-slate-850 rounded-xl p-4.5 space-y-4" 
                id="realtime-risk-scorecard"
                key={`${selectedCompany.id}-${selectedCompanySummary.score}`}
                initial={{ scale: 0.98, borderColor: 'rgba(51, 65, 85, 0.5)' }}
                animate={{ scale: 1, borderColor: 'rgba(51, 65, 85, 0.9)' }}
                transition={{ duration: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Active Risk Tier</span>
                    <h3 className="text-sm font-extrabold text-white font-sans mt-0.5">{selectedCompanySummary.riskTier}</h3>
                  </div>
                  <button
                    onClick={handleEditCompany}
                    className="p-1.5 py-1 text-[10px] font-mono bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-lg flex items-center gap-1 cursor-pointer font-bold uppercase transition-all"
                  >
                    <Edit3 className="w-3 h-3 text-teal-400" />
                    <span>Parameters</span>
                  </button>
                </div>

                {/* Score scale block */}
                <div className="space-y-1.5 pt-2 border-t border-slate-900">
                  <div className="flex justify-between text-[10px] font-mono text-slate-500 uppercase leading-none">
                    <span>Severity Penalty Points</span>
                    <span>Max 599</span>
                  </div>
                  
                  {/* Gauge bar with smooth motion transition */}
                  <div className="h-2 bg-slate-900 rounded-full overflow-hidden flex relative">
                    <motion.div
                      className={`h-full rounded-full ${
                        selectedCompanySummary.score > 100
                          ? 'bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                          : selectedCompanySummary.score > 35
                          ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                          : selectedCompanySummary.score > 0
                          ? 'bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]'
                          : 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.5)]'
                      }`}
                      style={{ originX: 0 }}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (selectedCompanySummary.score / 599) * 100)}%` }}
                      transition={{ type: 'spring', stiffness: 80, damping: 15, delay: 0.1 }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] font-mono text-slate-400">
                    <span>Defaults: <strong>{selectedCompanySummary.breaches} triggers</strong></span>
                    <motion.span 
                      className="text-white font-bold"
                      initial={{ scale: 0.9, opacity: 0.8 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {selectedCompanySummary.score} penalty score
                    </motion.span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Predictive Machine Learning-Inspired Risk Forecast Callout */}
            {selectedCompany && (
              <PredictiveRiskForecast
                selectedCompany={selectedCompany}
                trail={trail}
                bypassedRuleIds={bypassedRules[selectedCompanyId] || []}
              />
            )}

            {/* Upcoming Calendar Reminders */}
            <div className="space-y-2.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold block">Next Filing Timelines</span>
              <div className="space-y-2 text-xs font-mono" id="reminders-feed">
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <span className="text-slate-300">Form XII Annual Submission</span>
                  </div>
                  <span className="text-[10px] text-slate-500">In 30 days</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600" />
                    <span className="text-slate-300">Q1 Corp Advance Tax due</span>
                  </div>
                  <span className="text-[10px] text-slate-500">In 45 days</span>
                </div>
                <div className="bg-slate-950/40 p-2.5 rounded-lg border border-slate-900 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span className="text-slate-300">Monthly VAT return (BIN)</span>
                  </div>
                  <span className="text-[10px] text-slate-500">Every 15th</span>
                </div>
              </div>
            </div>

          </div>

          {/* Bottom active Terminal Log console */}
          <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl font-mono text-[10px] space-y-2 self-stretch" id="terminal-feed">
            <div className="flex items-center justify-between text-slate-500 border-b border-slate-900 pb-1.5 uppercase tracking-widest">
              <span className="flex items-center gap-1 font-bold">
                <Terminal className="w-3.5 h-3.5 text-teal-400" />
                terminal log console
              </span>
              <div className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            </div>
            <div className="space-y-1.5 max-h-[85px] overflow-y-auto text-slate-400 selection:bg-teal-500/30">
              {logs.map((log, idx) => (
                <div key={idx} className="leading-snug text-left truncate">
                  {log}
                </div>
              ))}
            </div>
          </div>

        </section>

        {/* Right Tabbed Contents: Operations workspace */}
        <section className="lg:col-span-3 p-6 flex flex-col space-y-6 bg-slate-950/10" id="dashboard-workspace-desk">
          
          {/* Tab switches with our newly integrated Immutable Audit Trail tab! */}
          <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-2xl max-w-fit font-mono text-xs overflow-x-auto">
            <button
              onClick={() => {
                setActiveTab('audit');
                addLog('Command Section: Audit Matrix Registry');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'audit'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Scale className="w-4 h-4 text-teal-400" />
              <span>Rules Audit Desk</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('timeline');
                addLog('Command Section: Vanguard Lifecycle Roadmap');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'timeline'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-teal-400" />
              <span>Filing Lifecycle Roadmap</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('drafts');
                addLog('Command Section: Statutory Document Draft Builder');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'drafts'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4 text-teal-400" />
              <span>Form Drafts Station</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('trail');
                addLog('Command Section: Immutable Activity Audit Trail');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'trail'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileClock className="w-4 h-4 text-teal-400" />
              <span>Immutable Audit Trail</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('analytics');
                addLog('Command Section: Compliance Health Analytics Dashboard');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'analytics'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-705 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Compliance Analytics</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('subscription');
                addLog('Command Section: Subscription Plans Desk');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'subscription'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>AFWA Subscription</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('emails');
                addLog('Command Section: Urgency Alert Emails Log');
              }}
              className={`px-5 py-2 rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'emails'
                  ? 'bg-slate-850 text-white font-semibold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Director Email Logs</span>
            </button>
          </div>

          {/* Render Active View tab */}
          <div className="grow">
            {activeTab === 'subscription' ? (
              <SubscriptionDesk 
                session={session} 
                onUpdateSession={setSession} 
                onAddLog={addLog} 
              />
            ) : selectedCompany ? (
              <>
                {activeTab === 'audit' && (
                  <RuleRegistry 
                    selectedCompany={selectedCompany} 
                    session={session}
                    trail={trail}
                    onLogAction={handleLogAction}
                    bypassedRuleIds={bypassedRules[selectedCompanyId] || []}
                    onToggleBypass={handleToggleBypass}
                  />
                )}
                {activeTab === 'timeline' && (
                  <TimelineTracker selectedCompany={selectedCompany} />
                )}
                {activeTab === 'drafts' && (
                  <FormsGenerator selectedCompany={selectedCompany} />
                )}
                {activeTab === 'trail' && (
                  <AuditTrail 
                    selectedCompany={selectedCompany} 
                    trail={trail}
                    onClearTrail={handleClearTrail}
                    session={session}
                    initialSearchQuery={deepLinkId || ''}
                  />
                )}
                {activeTab === 'analytics' && (
                  <ComplianceAnalytics selectedCompany={selectedCompany} allCompanies={companies} />
                )}
                {activeTab === 'emails' && (
                  <DirectorEmailLogs 
                    selectedCompany={selectedCompany} 
                    sentEmails={sentEmails} 
                  />
                )}
              </>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400 font-mono text-sm shadow">
                Onboard a company on the left panel to begin compliance audits.
              </div>
            )}
          </div>

        </section>

      </main>

      {/* Global Interactive Parameters Onboarding / Edit wizard modal */}
      <CompanyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCompany}
        companyToEdit={companyToEdit}
      />

      {/* Floating Statutory Chat with Gemini API */}
      {selectedCompany && <StatutoryChat company={selectedCompany} />}
    </AuthSim>
  );
}
