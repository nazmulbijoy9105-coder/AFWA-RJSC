import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { X, Calendar, DollarSign, Users, Clock, ShieldAlert, Landmark, FileText, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (company: Company) => void;
  companyToEdit?: Company | null;
}

export default function CompanyModal({ isOpen, onClose, onSave, companyToEdit }: CompanyModalProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'registers' | 'meetings' | 'tax' | 'crisis'>('profile');
  const [formData, setFormData] = useState<Partial<Company>>({
    name: '',
    directorEmail: '',
    regNumber: '',
    incorporationDate: new Date().toISOString().split('T')[0],
    authorizedCapital: 10000000,
    paidUpCapital: 1000000,
    totalDirectors: 2,
    totalMembers: 2,
    totalBoardMeetings: 4,
    foreignShareholding: false,
    remittanceValue: 0,
    workPermitThresholdMet: true,
    
    registersKeptAtRegisteredOffice: true,
    registersIncomplete: false,
    coreRegistersMissing: false,
    registerOfLoansOrMortgagesMissing: false,
    hasUnregisteredCharge: false,
    chargeSatisfactionNotFiled: false,
    
    registeredOfficeChanged: false,
    registeredOfficeChangedFiledWithin28Days: true,
    
    boardResolutionsNotRecorded: false,
    egmHeld: false,
    egmNoticeDays: 21,
    
    agmHeldInCurrentFY: true,
    isFirstAGM: true,
    daysSinceIncorporation: 100,
    monthsSinceIncorporation: 3,
    firstAgmDefault: false,
    subsequentAgmDefault: false,
    agmNoticeDays: 21,
    agmQuorumMet: true,
    agmMinutesPrepared: true,
    auditorReappointedAtAGM: true,
    
    auditorAppointedWithin30Days: true,
    auditorIsEmployeeOrOfficer: false,
    auditCompletedBeforeAGM: true,
    agmHeldWithoutCompletedAudit: false,
    
    annualReturnFiled: true,
    annualReturnIncomplete: false,
    annualReturnBacklogYears: 0,
    
    directorAppointmentNotFiled14Days: false,
    directorDepartureNotFiled14Days: false,
    directorConsentNotFiled: false,
    directorMajorFilingIrregularityOver1Year: false,
    directorDisqualifiedAppointed: false,
    directorInterestInContractDisclosed: true,
    
    shareAllotmentFiledWithin30Days: true,
    shareCertificatesIssuedWithin60Days: false,
    capitalIncreaseFiledWithin30Days: true,
    sharesAllottedAtDiscount: false,
    sweatEquityBonusWithoutResolution: false,
    shareTransferNoForm117: false,
    stampDutyNotPaidOnTransfer: false,
    shareTransferNoBoardApproval: false,
    shareTransferViolatesAoARestriction: false,
    registerMembersNotUpdatedAfterTransfer: false,
    
    altNameNotRegistered: false,
    altMoAAoANotFiled: false,
    altReductionWithoutCourt: false,
    
    tinObtained: true,
    taxReturnFiled: true,
    advanceTaxQ1Paid: true,
    advanceTaxQ2Paid: true,
    advanceTaxQ3Paid: true,
    advanceTaxQ4Paid: true,
    tdsDepositedUpToDate: true,
    wealthStatementFiled: false,
    tradeLicenseActive: true,
    vatRegistered: false,
    vatMonthlyReturnsFiled: true,
    vatAnnualReturnFiled: true,
    outwardForeignRemittanceNoDocs: false,
    
    strikeOffNoticeReceived: false,
    strikeOffListPublished: false,
    showCauseNoticeReceived: false,
    notes: ''
  });

  useEffect(() => {
    if (companyToEdit) {
      setFormData(companyToEdit);
    } else {
      setFormData({
        id: 'comp-' + Math.random().toString(36).substr(2, 9),
        name: '',
        directorEmail: '',
        regNumber: '',
        incorporationDate: new Date().toISOString().split('T')[0],
        authorizedCapital: 10000005, // Slight differentiator to prevent overlap/redundancy
        paidUpCapital: 1000000,
        totalDirectors: 2,
        totalMembers: 2,
        totalBoardMeetings: 4,
        foreignShareholding: false,
        remittanceValue: 0,
        workPermitThresholdMet: true,
        
        registersKeptAtRegisteredOffice: true,
        registersIncomplete: false,
        coreRegistersMissing: false,
        registerOfLoansOrMortgagesMissing: false,
        hasUnregisteredCharge: false,
        chargeSatisfactionNotFiled: false,
        
        registeredOfficeChanged: false,
        registeredOfficeChangedFiledWithin28Days: true,
        
        boardResolutionsNotRecorded: false,
        egmHeld: false,
        egmNoticeDays: 21,
        
        agmHeldInCurrentFY: true,
        isFirstAGM: true,
        daysSinceIncorporation: 100,
        monthsSinceIncorporation: 3,
        firstAgmDefault: false,
        subsequentAgmDefault: false,
        agmNoticeDays: 21,
        agmQuorumMet: true,
        agmMinutesPrepared: true,
        auditorReappointedAtAGM: true,
        
        auditorAppointedWithin30Days: true,
        auditorIsEmployeeOrOfficer: false,
        auditCompletedBeforeAGM: true,
        agmHeldWithoutCompletedAudit: false,
        
        annualReturnFiled: true,
        annualReturnIncomplete: false,
        annualReturnBacklogYears: 0,
        
        directorAppointmentNotFiled14Days: false,
        directorDepartureNotFiled14Days: false,
        directorConsentNotFiled: false,
        directorMajorFilingIrregularityOver1Year: false,
        directorDisqualifiedAppointed: false,
        directorInterestInContractDisclosed: true,
        
        shareAllotmentFiledWithin30Days: true,
        shareCertificatesIssuedWithin60Days: false,
        capitalIncreaseFiledWithin30Days: true,
        sharesAllottedAtDiscount: false,
        sweatEquityBonusWithoutResolution: false,
        shareTransferNoForm117: false,
        stampDutyNotPaidOnTransfer: false,
        shareTransferNoBoardApproval: false,
        shareTransferViolatesAoARestriction: false,
        registerMembersNotUpdatedAfterTransfer: false,
        
        altNameNotRegistered: false,
        altMoAAoANotFiled: false,
        altReductionWithoutCourt: false,
        
        tinObtained: true,
        taxReturnFiled: true,
        advanceTaxQ1Paid: true,
        advanceTaxQ2Paid: true,
        advanceTaxQ3Paid: true,
        advanceTaxQ4Paid: true,
        tdsDepositedUpToDate: true,
        wealthStatementFiled: false,
        tradeLicenseActive: true,
        vatRegistered: false,
        vatMonthlyReturnsFiled: true,
        vatAnnualReturnFiled: true,
        outwardForeignRemittanceNoDocs: false,
        
        strikeOffNoticeReceived: false,
        strikeOffListPublished: false,
        showCauseNoticeReceived: false,
        notes: ''
      });
    }
  }, [companyToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    // Dynamically calculate days/months since incorporation to feed rule evaluation accurately
    const incDate = new Date(formData.incorporationDate || '');
    const diffTime = Math.abs(new Date().getTime() - incDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30.41);

    const updatedCompany: Company = {
      ...(formData as Company),
      daysSinceIncorporation: diffDays,
      monthsSinceIncorporation: diffMonths,
    };

    onSave(updatedCompany);
    onClose();
  };

  const updateField = (key: keyof Company, val: any) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const tabs = [
    { id: 'profile', name: 'Profile & Equity', icon: Landmark },
    { id: 'registers', name: 'Registers & Office', icon: FileText },
    { id: 'meetings', name: 'Meetings & Audit', icon: Clock },
    { id: 'tax', name: 'Tax & Treasury', icon: DollarSign },
    { id: 'crisis', name: 'Compliance Esc.', icon: ShieldAlert },
  ] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto selection:bg-teal-500/30 selection:text-teal-200">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          id="company-modal-dialog"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Landmark className="w-5 h-5 text-teal-400" />
                {companyToEdit ? 'Edit Company Parameters' : 'Onboard New Private Limited Company'}
              </h2>
              <p className="text-xs text-slate-400 font-mono mt-0.5">RJSC BANGLADESH COMPLIANCE DATA MATRIX</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg font-bold text-sm cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selection */}
          <div className="px-6 bg-slate-950/20 border-b border-slate-800 flex gap-2 overflow-x-auto py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono whitespace-nowrap cursor-pointer transition-all ${
                    activeTab === tab.id
                      ? 'bg-teal-500/10 border border-teal-500/20 text-teal-300'
                      : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* TAB: PROFILE & CAPITAL */}
            {activeTab === 'profile' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5" id="profile-pane">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Company Legal Name</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-200"
                    placeholder="e.g. Asia Capital BD Ltd."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Director's Email Address (Urgency Warnings)</label>
                  <input
                    type="email"
                    value={formData.directorEmail || ''}
                    onChange={(e) => updateField('directorEmail', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                    placeholder="e.g. director@company.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">RJSC Registration Number</label>
                  <input
                    type="text"
                    value={formData.regNumber || ''}
                    onChange={(e) => updateField('regNumber', e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2.5 text-sm text-slate-200 font-mono"
                    placeholder="e.g. C-12345/2026"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Date of Incorporation</label>
                  <div className="relative">
                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="date"
                      value={formData.incorporationDate}
                      onChange={(e) => updateField('incorporationDate', e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-mono"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Authorized Share Capital (BDT)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">Tk</span>
                    <input
                      type="number"
                      value={formData.authorizedCapital}
                      onChange={(e) => updateField('authorizedCapital', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-mono"
                      min="1"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Paid-Up Capital (BDT)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-mono">Tk</span>
                    <input
                      type="number"
                      value={formData.paidUpCapital}
                      onChange={(e) => updateField('paidUpCapital', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-mono"
                      min="1"
                    />
                  </div>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Foreign Shareholding Presence</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Requires Bank Encashment Verification</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.foreignShareholding || false}
                      onChange={(e) => updateField('foreignShareholding', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 rounded bg-slate-950 cursor-pointer"
                    />
                  </div>
                  {formData.foreignShareholding && (
                    <div className="mt-2 space-y-3 animation-fade-in">
                      <div>
                        <label className="block text-[10px] font-mono text-slate-400 mb-1 leading-normal uppercase">Total Inward Remittance Certificate Value (BDT)</label>
                        <input
                          type="number"
                          value={formData.remittanceValue || 0}
                          onChange={(e) => updateField('remittanceValue', Number(e.target.value))}
                          className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono"
                          placeholder="Sum of encashment certificates"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-300">Minimum USD 50k Workpermit threshold met?</span>
                        <input
                          type="checkbox"
                          checked={formData.workPermitThresholdMet || false}
                          onChange={(e) => updateField('workPermitThresholdMet', e.target.checked)}
                          className="w-3.5 h-3.5 text-teal-600 border-slate-800 rounded bg-slate-950 cursor-pointer"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Total Directors on Board</label>
                  <div className="relative">
                    <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                    <input
                      type="number"
                      value={formData.totalDirectors}
                      onChange={(e) => updateField('totalDirectors', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-200 font-mono"
                      min="1"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase font-semibold text-amber-400">Custom Workspace Admin Notes</label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => updateField('notes', e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-xl px-4 py-2 text-xs text-slate-300"
                    placeholder="Describe specific licensing delays or court cases..."
                  />
                </div>
              </div>
            )}

            {/* TAB: REGISTERS & OFFICE */}
            {activeTab === 'registers' && (
              <div className="space-y-4" id="registers-pane">
                <h3 className="text-sm font-semibold text-white font-sans tracking-tight border-b border-slate-800 pb-2">Statutory Register Books & Physical Office Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Registers Maintained at Registered Office</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Required under Section 34(2)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.registersKeptAtRegisteredOffice || false}
                      onChange={(e) => updateField('registersKeptAtRegisteredOffice', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Registers Incomplete or Untranscribed</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Lack of recent share transfer logs</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.registersIncomplete || false}
                      onChange={(e) => updateField('registersIncomplete', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Core Registers Completely Missing</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">No members ledger or shares stamps files</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.coreRegistersMissing || false}
                      onChange={(e) => updateField('coreRegistersMissing', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Register of Loans / Mortgages Missing</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Mandatory for bank borrowing registrations</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.registerOfLoansOrMortgagesMissing || false}
                      onChange={(e) => updateField('registerOfLoansOrMortgagesMissing', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white font-sans tracking-tight border-b border-slate-800 pt-4 pb-2">Mortgages, Charges & Relocations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 font-sans">Active Charge Outstanding (Unregistered)</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Mortgage not filed with RJSC within 30 days</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.hasUnregisteredCharge || false}
                      onChange={(e) => updateField('hasUnregisteredCharge', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Loan Repaid but Charge Satisfaction Unfiled</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Form XIX satisfaction backlog details</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.chargeSatisfactionNotFiled || false}
                      onChange={(e) => updateField('chargeSatisfactionNotFiled', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Physical Registered Office Relocated</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Office changed to new municipal address</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.registeredOfficeChanged || false}
                      onChange={(e) => updateField('registeredOfficeChanged', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  {formData.registeredOfficeChanged && (
                    <div className="bg-teal-500/5 border border-teal-500/20 p-4 rounded-xl flex items-center justify-between animation-fade-in">
                      <div>
                        <span className="text-xs font-semibold text-teal-300">Office Relocation Filed (28 Days)</span>
                        <p className="text-[10px] text-teal-400/80 font-mono leading-normal">Form VI registered on time under Sec 81</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={formData.registeredOfficeChangedFiledWithin28Days || false}
                        onChange={(e) => updateField('registeredOfficeChangedFiledWithin28Days', e.target.checked)}
                        className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB: MEETINGS & AUDIT */}
            {activeTab === 'meetings' && (
              <div className="space-y-4" id="meetings-pane">
                <h3 className="text-sm font-semibold text-white font-sans tracking-tight border-b border-slate-800 pb-2">Annual General Meeting (AGM) Execution</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">AGM Successfully Convened in Current FY</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Section 81 compliance confirmation</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.agmHeldInCurrentFY || false}
                      onChange={(e) => updateField('agmHeldInCurrentFY', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">This is the Company\'s First Annual Meeting</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Granted up to 18 months parameters</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.isFirstAGM || false}
                      onChange={(e) => updateField('isFirstAGM', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold text-slate-200">AGM Notice Period Days Served</span>
                        <p className="text-[10px] text-slate-400 font-mono leading-normal">Mandated 21 clear days under Sec 85</p>
                      </div>
                      <input
                        type="number"
                        value={formData.agmNoticeDays || 0}
                        onChange={(e) => updateField('agmNoticeDays', Number(e.target.value))}
                        className="w-20 bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-lg px-2 py-1 text-xs text-slate-200 font-mono text-right"
                      />
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Meeting Formally Quorum Met</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Minimum of 2 shareholders physically represent</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.agmQuorumMet || false}
                      onChange={(e) => updateField('agmQuorumMet', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">AGM Meeting Minutes Recorded</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Signed and stored in Minute Book logs</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.agmMinutesPrepared || false}
                      onChange={(e) => updateField('agmMinutesPrepared', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Auditor Formally Appointed/Reappointed</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Auditor renewed under Section 210(2)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.auditorReappointedAtAGM || false}
                      onChange={(e) => updateField('auditorReappointedAtAGM', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-white font-sans tracking-tight border-b border-slate-800 pt-4 pb-2">Auditor Qualifications & Workflows</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">First Auditor Appointed Within 30 Days</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Form VIII filed promptly post registration</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.auditorAppointedWithin30Days || false}
                      onChange={(e) => updateField('auditorAppointedWithin30Days', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Auditor possesses conflict of interest</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Is employee / controller partner under Sec 209</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.auditorIsEmployeeOrOfficer || false}
                      onChange={(e) => updateField('auditorIsEmployeeOrOfficer', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Audit Fully Completed Before AGM Notice</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Accounts signed under audit index report</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.auditCompletedBeforeAGM || false}
                      onChange={(e) => updateField('auditCompletedBeforeAGM', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">AGM Convened Without Auditor Signing</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Severe default of Section 151 (invalid session)</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.agmHeldWithoutCompletedAudit || false}
                      onChange={(e) => updateField('agmHeldWithoutCompletedAudit', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TAB: TAX & SECURE TREASURY */}
            {activeTab === 'tax' && (
              <div className="space-y-4" id="tax-pane">
                <h3 className="text-sm font-semibold text-white font-sans tracking-tight border-b border-slate-800 pb-2">National Board of Revenue (NBR) Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">TIN Active Profile Obtained</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Registered under Income Tax Act 2023</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.tinObtained || false}
                      onChange={(e) => updateField('tinObtained', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Current Corporate Tax Return Filed</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Submitted by national corporate due date</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.taxReturnFiled || false}
                      onChange={(e) => updateField('taxReturnFiled', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between col-span-1 md:col-span-2">
                    <span className="text-xs font-semibold text-slate-200">Quarterly Advance Corporate Tax Settlements</span>
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {['Q1', 'Q2', 'Q3', 'Q4'].map((q) => {
                        const key = `advanceTax${q}Paid` as keyof Company;
                        return (
                          <label key={q} className="bg-slate-950 border border-slate-800 p-2 rounded-lg flex flex-col py-3 items-center justify-center cursor-pointer">
                            <span className="text-[10px] font-mono text-slate-400">{q} Ticket</span>
                            <input
                              type="checkbox"
                              checked={!!formData[key]}
                              onChange={(e) => updateField(key, e.target.checked)}
                              className="w-3.5 h-3.5 mt-2 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">TDS Fully Deposited & Reconciled</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Tax deducted at source returns complete</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.tdsDepositedUpToDate || false}
                      onChange={(e) => updateField('tdsDepositedUpToDate', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Trade License Active</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Renewed municipality physical license</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.tradeLicenseActive || false}
                      onChange={(e) => updateField('tradeLicenseActive', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200 font-sans">VAT Business Identification Number (BIN)</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Registered under VAT Act 2012</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.vatRegistered || false}
                      onChange={(e) => updateField('vatRegistered', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  {formData.vatRegistered && (
                    <>
                      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between animation-fade-in">
                        <div>
                          <span className="text-xs font-semibold text-slate-200">VAT Monthly returns (Form 9.1)</span>
                          <p className="text-[10px] text-slate-400 font-mono leading-normal">Filed by 15th of current month</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.vatMonthlyReturnsFiled || false}
                          onChange={(e) => updateField('vatMonthlyReturnsFiled', e.target.checked)}
                          className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                        />
                      </div>
                      <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between animation-fade-in">
                        <div>
                          <span className="text-xs font-semibold text-slate-200">VAT Annual Audit Returns Filed</span>
                          <p className="text-[10px] text-slate-400 font-mono leading-normal">Closed and cross-verified indicators</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={formData.vatAnnualReturnFiled || false}
                          onChange={(e) => updateField('vatAnnualReturnFiled', e.target.checked)}
                          className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB: CRISIS & STATUS */}
            {activeTab === 'crisis' && (
              <div className="space-y-4" id="crisis-pane">
                <h3 className="text-sm font-semibold text-rose-400 font-sans tracking-tight border-b border-rose-950 pb-2">CRITICAL REGISTRY WARNINGS & ESCALATIONS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-rose-950/10 border border-rose-950/60 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-rose-300 font-sans">Formal Strike-Off Notice Received (Sec 304)</span>
                      <p className="text-[10px] text-rose-400 font-mono leading-normal">Regulatory notice for failure to file accounts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.strikeOffNoticeReceived || false}
                      onChange={(e) => updateField('strikeOffNoticeReceived', e.target.checked)}
                      className="w-4 h-4 text-rose-500 border-rose-800 rounded bg-slate-900 cursor-pointer focus:ring-rose-500"
                    />
                  </div>

                  <div className="bg-rose-950/10 border border-rose-950/60 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-rose-300 font-sans">Strike-Off List Published on Official Gazette</span>
                      <p className="text-[10px] text-rose-400 font-mono leading-normal">Public circular active. Dissolution risk high</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.strikeOffListPublished || false}
                      onChange={(e) => updateField('strikeOffListPublished', e.target.checked)}
                      className="w-4 h-4 text-rose-500 border-rose-800 rounded bg-slate-900 cursor-pointer focus:ring-rose-500"
                    />
                  </div>

                  <div className="bg-rose-950/10 border border-rose-950/60 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-rose-300 font-sans">Show Cause Notice Received for Defaults</span>
                      <p className="text-[10px] text-rose-400 font-mono leading-normal">Demands immediate representations at RJSC Office</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showCauseNoticeReceived || false}
                      onChange={(e) => updateField('showCauseNoticeReceived', e.target.checked)}
                      className="w-4 h-4 text-rose-500 border-rose-800 rounded bg-slate-900 cursor-pointer focus:ring-rose-500"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl">
                    <label className="block text-xs font-mono text-slate-400 mb-1 leading-normal uppercase">Annual Returns Filing Backlog Years</label>
                    <select
                      value={formData.annualReturnBacklogYears || 0}
                      onChange={(e) => updateField('annualReturnBacklogYears', Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 focus:outline-none rounded-lg px-3 py-2 text-xs text-slate-200 font-mono"
                    >
                      <option value="0">0 Years (Compliant)</option>
                      <option value="1">1 Year Default (Form XII delay)</option>
                      <option value="2">2 Years (High Penalties Active)</option>
                      <option value="3">3+ Years (Severe Strike-Off Triggered)</option>
                    </select>
                  </div>
                </div>

                <h3 className="text-sm font-semibold text-amber-500 font-sans tracking-tight border-b border-amber-950 pt-4 pb-2">Director & Share Capital Irregularities</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Disqualified Director Appointed (Sec 197)</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Convicted / bankrupt / unsanctioned board member</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.directorDisqualifiedAppointed || false}
                      onChange={(e) => updateField('directorDisqualifiedAppointed', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Shares Allotted at irregular Discount</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Contravenes Section 49 constraints</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.sharesAllottedAtDiscount || false}
                      onChange={(e) => updateField('sharesAllottedAtDiscount', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Capital Reduction Without Court Approval</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">Illegal cancellation of subscriber accounts</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.altReductionWithoutCourt || false}
                      onChange={(e) => updateField('altReductionWithoutCourt', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>

                  <div className="bg-slate-950/40 border border-slate-800 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-200">Outward FX Remitted Without Docs</span>
                      <p className="text-[10px] text-slate-400 font-mono leading-normal">No Bank encashment / Bangladesh Bank filings</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.outwardForeignRemittanceNoDocs || false}
                      onChange={(e) => updateField('outwardForeignRemittanceNoDocs', e.target.checked)}
                      className="w-4 h-4 text-teal-600 border-slate-800 bg-slate-950 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}

          </form>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
              ALL DATA WILL EVALUATE LIVE SECURELY
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-800 hover:bg-slate-800 hover:text-white rounded-xl text-xs font-mono text-slate-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-sans font-semibold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-teal-500/10 active:scale-[0.98]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save & Evaluate Matrix</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
