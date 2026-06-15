import { useState, useMemo } from 'react';
import { Company } from '../types';
import { Landmark, RefreshCw, Calendar, AlertOctagon, HelpCircle, CheckCircle, Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface TimelineTrackerProps {
  selectedCompany: Company;
}

interface Step {
  id: string;
  name: string;
  legalBasis: string;
  desc: string;
  check: (c: Company) => { status: 'all_good' | 'pending' | 'warning' | 'not_applicable'; notes: string };
}

interface Stage {
  title: string;
  subtitle: string;
  desc: string;
  steps: Step[];
}

export default function TimelineTracker({ selectedCompany }: TimelineTrackerProps) {
  const [activeStageIdx, setActiveStageIdx] = useState<number>(2); // Default to Stage 3 Annual Compliance is most recurring

  const stages: Stage[] = [
    {
      title: 'Stage 1: Incorporation',
      subtitle: 'One-time registration process (~7-14 days)',
      desc: 'Initial company formation requirements under the Bangladesh Companies Act 1994, preceding physical commercial trade launch.',
      steps: [
        {
          id: 'INC-1.1',
          name: 'Name Clearance',
          legalBasis: 'RJSC online portal',
          desc: 'Securing an approved unique name from the registrar before drafting and signing constitutional documents.',
          check: (c) => ({
            status: c.regNumber ? 'all_good' : 'warning',
            notes: c.regNumber ? `Completed. Entity registered as ${c.name}.` : 'Pending. Initiate online portal clearance.'
          })
        },
        {
          id: 'INC-1.2',
          name: 'Memorandum of Association Drafting',
          legalBasis: 'Stamp Act 1899',
          desc: 'Drafting core objects clause & liability limits, including subscribing to physical stamp duty clearances.',
          check: (c) => ({
            status: !c.altMoAAoANotFiled ? 'all_good' : 'warning',
            notes: !c.altMoAAoANotFiled ? 'Registered MoA updated on RJSC portal.' : 'Warning: Unfiled / unregistered object amendments.'
          })
        },
        {
          id: 'INC-1.3',
          name: 'Articles of Association Formulation',
          legalBasis: 'Table F of Schedule I, CA 1994',
          desc: 'Drafting internal operational bylaws, board veto powers, and directorship appointment regulations.',
          check: (c) => ({
            status: !c.altMoAAoANotFiled ? 'all_good' : 'warning',
            notes: !c.altMoAAoANotFiled ? 'Articles of Association validated.' : 'Warning: Overrides contradicting standard Table F guidelines.'
          })
        },
        {
          id: 'INC-1.12',
          name: 'Share Certificates Issuance',
          legalBasis: 'Section 46, CA 1994',
          desc: 'Printing, embossing corporate common seal, and dispatching physical certificates to shareholders within 60 days.',
          check: (c) => ({
            status: !c.shareCertificatesIssuedWithin60Days ? 'all_good' : 'warning',
            notes: !c.shareCertificatesIssuedWithin60Days ? 'Dispatched to subscribers within 60 days of allocation.' : 'Delayed. Outstanding unissued certificates trigger penalties.'
          })
        },
        {
          id: 'INC-1.13',
          name: 'Corporate TIN Registration',
          legalBasis: 'Income Tax Act 2023',
          desc: 'Registering with the National Board of Revenue (NBR) to secure an active corporate Taxpayer Identification Number.',
          check: (c) => ({
            status: c.tinObtained ? 'all_good' : 'warning',
            notes: c.tinObtained ? 'Corporate TIN successfully registered.' : 'Critical default. Open corporate accounts and file zero returns are blocked.'
          })
        },
        {
          id: 'INC-1.14',
          name: 'Trade License Procurement',
          legalBasis: 'City Corporation / Municipality Acts',
          desc: 'Acquiring physical commercial permits from municipal wards based on registered office location.',
          check: (c) => ({
            status: c.tradeLicenseActive ? 'all_good' : 'warning',
            notes: c.tradeLicenseActive ? 'Permit active for the current fiscal cycle.' : 'Expired or missing license. Operatives vulnerable to code citations.'
          })
        }
      ]
    },
    {
      title: 'Stage 2: Pre-First-AGM',
      subtitle: 'Post-incorporation setup (Up to 18 months)',
      desc: 'Critical statutory logs, bank accounts validation, and key auditor notifications following active incorporation.',
      steps: [
        {
          id: 'PRE-2.1',
          name: 'First Auditor Appointment',
          legalBasis: 'Section 210(1), CA 1994',
          desc: 'Directorship appointment of certified statutory auditor within 30 days of registration, filing Form VIII.',
          check: (c) => ({
            status: c.auditorAppointedWithin30Days ? 'all_good' : 'warning',
            notes: c.auditorAppointedWithin30Days ? 'Auditor appointed. Form VIII filed with registrar.' : 'Default detected. Auditor appointment must be registered within 30 days.'
          })
        },
        {
          id: 'PRE-2.2',
          name: 'Statutory Registers Setup',
          legalBasis: 'Sections 34, 83, 87, 90, CA 1994',
          desc: 'Setting up manual binding books for Members, Directors, Transfers, Charges, and Board Minutes.',
          check: (c) => {
            if (c.coreRegistersMissing) return { status: 'warning', notes: 'Critical Default. Core registers completely missing.' };
            if (c.registersIncomplete) return { status: 'pending', notes: 'Action Needed. Physical ledgers incomplete.' };
            return { status: 'all_good', notes: 'All 9 statutory books housed securely at registered office.' };
          }
        },
        {
          id: 'PRE-2.3',
          name: 'First AGM Notice Dispatch',
          legalBasis: 'Section 85, CA 1994',
          desc: 'Formulating and conveying general meeting invitations to members at least 21 clear days in advance.',
          check: (c) => {
            if (!c.isFirstAGM) return { status: 'not_applicable', notes: 'N/A. This is for subsequent AGM periods.' };
            if (c.agmNoticeDays === 0) return { status: 'warning', notes: 'Defect: Notice omitted.' };
            if (c.agmNoticeDays < 21) return { status: 'warning', notes: `Notice period insufficient (${c.agmNoticeDays} days instead of 21 clear days).` };
            return { status: 'all_good', notes: 'Compliant circular was served 21 days prior.' };
          }
        }
      ]
    },
    {
      title: 'Stage 3: Annual Compliance Cycle',
      subtitle: 'Recurring obligations (Every Financial Year)',
      desc: 'Mandatory annual routine consisting of auditing, calling general meetings, and filing Annual returns with RJSC.',
      steps: [
        {
          id: 'ANN-3.1',
          name: 'Audit Fieldwork & Report Signing',
          legalBasis: 'Section 151, CA 1994',
          desc: 'Statutory audit of balance sheet and profit & loss statements by an ICAB member before presenting to members.',
          check: (c) => {
            if (c.agmHeldWithoutCompletedAudit) return { status: 'warning', notes: 'High Risk. Accounts adopted in violation under uncertified drafts.' };
            if (c.auditCompletedBeforeAGM) return { status: 'all_good', notes: 'Report fully signed and dated before AGM circulars.' };
            return { status: 'pending', notes: 'Outstanding audit reports.' };
          }
        },
        {
          id: 'ANN-3.2',
          name: 'AGM Conduct & Quorum Validation',
          legalBasis: 'Section 81 & 83(12), CA 1994',
          desc: 'Convening shareholders annually (max 15 months since previous) with a minimum presence of two members.',
          check: (c) => {
            if (c.subsequentAgmDefault) return { status: 'warning', notes: 'Overdue subsequent AGM. Triggers statutory fines.' };
            if (!c.agmQuorumMet) return { status: 'warning', notes: 'Defective AGM: Quorum not met.' };
            if (!c.agmMinutesPrepared) return { status: 'pending', notes: 'Proceedings executed but final written minutes un-transcribed.' };
            return { status: 'all_good', notes: 'Meeting successfully adopted accounts and elected board on time.' };
          }
        },
        {
          id: 'ANN-3.3',
          name: 'Form XII & Schedule X Filings',
          legalBasis: 'Section 119, CA 1994',
          desc: 'Constructing and uploading Annual Return forms on the RJSC portal within 30 days is the AGM session.',
          check: (c) => {
            if (c.annualReturnBacklogYears >= 3) return { status: 'warning', notes: 'Severe Backlog (3+ Years). Active Strike-off threat triggered.' };
            if (c.annualReturnBacklogYears >= 1) return { status: 'pending', notes: `${c.annualReturnBacklogYears} outstanding Return package backlog.` };
            if (c.annualReturnIncomplete) return { status: 'warning', notes: 'Forms submitted but rejected due to missing attachments.' };
            return { status: 'all_good', notes: 'Filing successfully acknowledged by the registrar.' };
          }
        },
        {
          id: 'ANN-3.10',
          name: 'Quarterly Advance Tax Payments',
          legalBasis: 'Section 74, Income Tax Act 2023',
          desc: 'Paying advance corporate taxes in 4 scheduled annual installments based on previous year income parameters.',
          check: (c) => {
            const unpaid = [
              !c.advanceTaxQ1Paid && 'Q1',
              !c.advanceTaxQ2Paid && 'Q2',
              !c.advanceTaxQ3Paid && 'Q3',
              !c.advanceTaxQ4Paid && 'Q4'
            ].filter(Boolean);
            if (unpaid.length > 0) return { status: 'pending', notes: `Outstanding payments: ${unpaid.join(', ')}.` };
            return { status: 'all_good', notes: 'All quarterly tax tickets settled.' };
          }
        }
      ]
    },
    {
      title: 'Stage 4: Structural Changes',
      subtitle: 'Event-based filing operations',
      desc: 'Triggered upon operational modifications like renaming, altering capital limits, changing directors, or asset mortgages.',
      steps: [
        {
          id: 'STR-4.1',
          name: 'Authorized Capital Increments',
          legalBasis: 'Section 52 & 54, CA 1994',
          desc: 'Altering share structure limit by calling an EGM, passing a Special Resolution, and filing Form IV within 15 days.',
          check: (c) => {
            if (c.paidUpCapital > c.authorizedCapital) return { status: 'warning', notes: 'Invalid Structure! Paid Up exceeded authorized ceiling. Complete Form IV.' };
            return { status: 'all_good', notes: 'Authorized Capital meets operational requirements safely.' };
          }
        },
        {
          id: 'STR-4.2',
          name: 'Directors Board Mutations',
          legalBasis: 'Section 92, CA 1994',
          desc: 'Reporting director resignations, removals, deaths, or additional appointments to RJSC within 14 days.',
          check: (c) => {
            if (c.directorAppointmentNotFiled14Days || c.directorDepartureNotFiled14Days) {
              return { status: 'warning', notes: 'Late Board filers detected. Form XII is overdue.' };
            }
            return { status: 'all_good', notes: 'RJSC register matches active physical board members.' };
          }
        }
      ]
    },
    {
      title: 'Stage 5: Default / Rescue',
      subtitle: 'Administrative Enforcement & Restoration',
      desc: 'Enforcement actions launched by RJSC upon compliance omissions, culminating in public strike-off or court petition rescues.',
      steps: [
        {
          id: 'DEF-5.1',
          name: 'Dormancy / Strike-Off Mitigation',
          legalBasis: 'Section 304, CA 1994',
          desc: 'Mitigating strike-off notices issued by RJSC due to backlog, requiring immediate statutory updates filing.',
          check: (c) => {
            if (c.strikeOffImminent) return { status: 'warning', notes: 'Severe Danger. Name deletion scheduled. Urgent physical presentation required.' };
            if (c.strikeOffNoticeReceived) return { status: 'warning', notes: 'Compliance warning active. Represent company at RJSC office immediately.' };
            return { status: 'all_good', notes: 'Company operates in active clean standing with registrar indexes.' };
          }
        },
        {
          id: 'DEF-5.8',
          name: 'High Court Condonation Petitions',
          legalBasis: 'Section 81 & 449, CA 1994',
          desc: 'Filing legal restoration petitions before the High Court company bench to condone delayed AGMs.',
          check: (c) => {
            if (c.corporateRescueMandatory || (c.subsequentAgmDefault && c.annualReturnBacklogYears >= 2)) {
              return { status: 'warning', notes: 'High Court company bench intervention is mandatory to regularize files.' };
            }
            return { status: 'all_good', notes: 'Standard filing channels are open. No judicial recourse required.' };
          }
        }
      ]
    }
  ];

  // Evaluate steps for active stage
  const currentStage = stages[activeStageIdx];

  const processedSteps = useMemo(() => {
    return currentStage.steps.map(step => {
      const evaluation = step.check(selectedCompany);
      return {
        ...step,
        status: evaluation.status,
        notes: evaluation.notes
      };
    });
  }, [currentStage, selectedCompany]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden" id="timeline-tracker-container">
      <div className="absolute top-0 left-0 w-32 h-32 bg-teal-500/5 rounded-full pointer-events-none blur-3xl" />
      
      <div className="border-b border-slate-800 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-teal-400" />
            Vanguard Lifecycle & Filings Timeline
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5 uppercase tracking-wide">COMPLIANCE MAP FOR {selectedCompany.name}</p>
        </div>
        
        {/* Stage selection switcher */}
        <div className="flex bg-slate-950 border border-slate-800/80 p-1 rounded-xl overflow-x-auto max-w-fit">
          {stages.map((stg, idx) => (
            <button
              key={stg.title}
              onClick={() => setActiveStageIdx(idx)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap cursor-pointer transition-all ${
                activeStageIdx === idx
                  ? 'bg-slate-850 text-white border border-slate-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              Stage {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Card: Stage Context */}
        <div className="lg:col-span-1 bg-slate-950 border border-slate-800/60 rounded-xl p-5 relative overflow-hidden">
          <div className="space-y-4">
            <div className="text-xs font-mono text-teal-400 font-bold uppercase tracking-wider">active lifecycle scope</div>
            <h3 className="text-base font-bold text-white font-sans">{currentStage.title}</h3>
            <span className="block text-[11px] font-mono text-slate-400 leading-snug">{currentStage.subtitle}</span>
            <p className="text-xs text-slate-400 font-sans leading-relaxed pt-2">
              {currentStage.desc}
            </p>
            <div className="pt-4 border-t border-slate-850 flex items-center gap-2.5">
              <Landmark className="w-4 h-4 text-slate-500" />
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">rjsc standard process map</span>
            </div>
          </div>
        </div>

        {/* Right Cards: Custom Steps Checklist */}
        <div className="lg:col-span-2 space-y-3">
          {processedSteps.map((step) => (
            <div
              key={step.id}
              className={`p-4 border rounded-xl flex flex-col md:flex-row md:items-start justify-between gap-4 transition-all ${
                step.status === 'warning'
                  ? 'border-rose-955 bg-rose-950/5'
                  : step.status === 'pending'
                  ? 'border-amber-955 bg-amber-950/5'
                  : step.status === 'not_applicable'
                  ? 'border-slate-800 opacity-60 bg-slate-950/20'
                  : 'border-teal-955 bg-teal-950/5'
              }`}
              id={`step-indicator-${step.id}`}
            >
              <div className="space-y-1 md:max-w-[70%]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded uppercase font-bold">
                    {step.id}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    Source: {step.legalBasis}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-slate-200 tracking-tight font-sans">
                  {step.name}
                </h4>
                <p className="text-xs text-slate-400 font-sans leading-normal">
                  {step.desc}
                </p>
                <div className="text-[11px] font-mono text-slate-300 mt-2.5 pt-2 border-t border-slate-800/20">
                  <span className="text-slate-500 mr-1 uppercase tracking-widest font-bold">compliance logs:</span>
                  <span className={step.status === 'warning' ? 'text-rose-300' : step.status === 'pending' ? 'text-amber-300' : 'text-teal-300'}>
                    {step.notes}
                  </span>
                </div>
              </div>

              {/* Status Pill Badge */}
              <div className="flex items-center gap-2 self-start md:self-center font-mono">
                <div className={`rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1.5 ${
                  step.status === 'warning'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : step.status === 'pending'
                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    : step.status === 'not_applicable'
                    ? 'bg-slate-950 border-slate-800 text-slate-500'
                    : 'bg-teal-500/10 border-teal-500/20 text-teal-300'
                }`}>
                  {step.status === 'warning' && (
                    <>
                      <AlertOctagon className="w-3.5 h-3.5" />
                      <span>Irregular</span>
                    </>
                  )}
                  {step.status === 'pending' && (
                    <>
                      <Clock className="w-3.5 h-3.5" />
                      <span>Action Req</span>
                    </>
                  )}
                  {step.status === 'not_applicable' && (
                    <span>Not Applicable</span>
                  )}
                  {step.status === 'all_good' && (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Validated</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
