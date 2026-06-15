import React, { useState } from 'react';
import { SentEmail, Company } from '../types';
import { Mail, Clock, ShieldAlert, ChevronDown, ChevronUp, CheckCircle, ExternalLink, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DirectorEmailLogsProps {
  selectedCompany: Company;
  sentEmails: SentEmail[];
}

export default function DirectorEmailLogs({ selectedCompany, sentEmails }: DirectorEmailLogsProps) {
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  // Filter emails belonging to the current selected company
  const companyEmails = sentEmails.filter(email => email.companyId === selectedCompany.id);

  const toggleExpand = (id: string) => {
    if (expandedEmailId === id) {
      setExpandedEmailId(null);
    } else {
      setExpandedEmailId(id);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6" id="emails-notification-hub">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs font-bold font-mono text-red-400 uppercase tracking-widest bg-red-950/40 border border-red-900/30 px-2 py-0.5 rounded">
              Firebase Cloud Function Trigger
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-teal-400" />
            Director Urgency Dispatch Hub
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            Tracks automatic compliance mail alerts dispatched to <strong className="text-slate-300 font-mono">{selectedCompany.directorEmail || `director@${selectedCompany.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`}</strong>. When a <span className="text-red-400 font-semibold font-mono bg-red-950/20 px-1 rounded border border-red-900/10">RED</span> severity rule changes to <code className="text-slate-300">triggered</code>, the background trigger generates custom, urgent statutory warnings via the Gemini GenAI model and pushes notification summaries instantly.
          </p>
        </div>
      </div>

      {companyEmails.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl space-y-3">
          <div className="mx-auto w-10 h-10 rounded-full bg-slate-950 flex items-center justify-center border border-slate-800">
            <Mail className="w-5 h-5 text-slate-600" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-300">No Urgency Alert Emails Triggered Yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Emails will register here automatically once any RED-severity rule is breached on the Rules Desk. Try editing the company parameters to trigger a RED compliance breach.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-2 pb-1">
            <span>Dispatched Alert Logs ({companyEmails.length})</span>
            <span>Status: Active Listener</span>
          </div>

          <div className="divide-y divide-slate-800/60 border border-slate-800 rounded-xl overflow-hidden bg-slate-950/40">
            {companyEmails.map((email) => {
              const isExpanded = expandedEmailId === email.id;
              
              return (
                <div key={email.id} className="transition-all hover:bg-slate-900/30">
                  {/* Summary Bar */}
                  <div 
                    onClick={() => toggleExpand(email.id)}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 cursor-pointer select-none"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-1 w-7 h-7 rounded-lg bg-red-950/40 border border-red-900/30 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-mono font-bold text-red-400 bg-red-950/20 border border-red-900/20 px-1.5 py-0.5 rounded">
                            {email.ruleId}
                          </span>
                          <span className="text-xs font-semibold text-slate-200 truncate">
                            {email.ruleName}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                          <span className="text-[10px] font-mono text-slate-400">To:</span> 
                          <span className="text-teal-400 font-mono truncate">{email.directorEmail}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(email.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <span className="flex items-center gap-1 bg-emerald-950/30 border border-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                        <CheckCircle className="w-3 h-3" />
                        Dispatched
                      </span>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </div>

                  {/* Expanded Email Contents */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden bg-slate-950/80 border-t border-slate-855"
                      >
                        <div className="p-5 space-y-4 text-left selection:bg-teal-500/30">
                          
                          {/* Subject Header */}
                          <div className="space-y-1 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">EMAIL SUBJECT</span>
                            <p className="text-xs font-semibold text-slate-200 font-mono">
                              {email.subject}
                            </p>
                          </div>

                          {/* Email Body */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">GENERATED MESSAGE BODY</span>
                            <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl text-slate-300 font-sans text-xs leading-relaxed space-y-3 whitespace-pre-line max-h-96 overflow-y-auto">
                              {email.body}
                            </div>
                          </div>

                          {/* Interactive Simulated Direct Action */}
                          {(() => {
                            const match = email.body.match(/id=(tra_[a-z0-9]+)/i);
                            const matchedAuditId = match ? match[1] : null;
                            if (matchedAuditId) {
                              return (
                                <div className="p-3 bg-teal-950/20 border border-teal-900/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                                  <div className="space-y-0.5">
                                    <p className="font-mono text-teal-400 font-bold">Interactive Deep-Link Detected</p>
                                    <p className="text-[10px] text-slate-400 font-sans">Simulation engine exposes a clickable path for testing the Director's link routing.</p>
                                  </div>
                                  <a 
                                    href={`/?tab=trail&id=${matchedAuditId}&companyId=${email.companyId}`}
                                    className="p-1 px-3.5 py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-mono font-bold text-[10px] uppercase flex items-center justify-center gap-1.5 transition-all text-center self-start sm:self-auto cursor-pointer"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                    <span>Follow Deep-Link</span>
                                  </a>
                                </div>
                              );
                            }
                            return null;
                          })()}

                          {/* Trigger Metadata */}
                          <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-slate-500 border-t border-slate-900 pt-3">
                            <span>UID: {email.id}</span>
                            <span>Engine: Gemini AI Auto-Draft (Swiss Compliance)</span>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
