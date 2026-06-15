import { useState, useEffect } from 'react';
import { Company } from '../types';
import { FileText, Printer, Copy, Check, Download, AlertCircle, Landmark } from 'lucide-react';
import { motion } from 'motion/react';

interface FormsGeneratorProps {
  selectedCompany: Company;
}

type DocType = 'FormXII' | 'ScheduleX' | 'FormVIII';

export default function FormsGenerator({ selectedCompany }: FormsGeneratorProps) {
  const [selectedDoc, setSelectedDoc] = useState<DocType>('FormXII');
  const [copied, setCopied] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [signatoryName, setSignatoryName] = useState('');
  const [signatoryDesignation, setSignatoryDesignation] = useState('Managing Director');
  const [auditorName, setAuditorName] = useState('Rahman Rahman Huq FCA');
  const [shareValue, setShareValue] = useState('100'); // par value

  useEffect(() => {
    // Attempt sensible pre-populations
    setMeetingDate(selectedCompany.agmHeldInCurrentFY ? '2026-05-20' : new Date().toISOString().split('T')[0]);
    setSignatoryName(selectedCompany.totalDirectors > 0 ? 'M. N. Islam' : 'Authorised Director');
  }, [selectedCompany]);

  const handleCopy = () => {
    const docElement = document.getElementById('rendered-draft-document');
    if (docElement) {
      navigator.clipboard.writeText(docElement.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    const printContent = document.getElementById('rendered-draft-document')?.innerHTML;
    const originalContent = document.body.innerHTML;
    if (printContent) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Print RJSC Draft File</title>
              <style>
                body { font-family: monospace; padding: 40px; color: #000; background: #fff; line-height: 1.5; }
                .draft-header { text-align: center; margin-bottom: 30px; }
                .draft-section { margin-bottom: 20px; }
                .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                table, th, td { border: 1px solid #000; padding: 8px; text-align: left; }
                th { background-color: #f2f2f2; }
              </style>
            </head>
            <body>
              ${printContent}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden" id="forms-generator-panel">
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full pointer-events-none blur-3xl" />
      
      <div className="border-b border-slate-800 pb-5 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" />
            RJSC Interactive Document Draft Builder
          </h2>
          <p className="text-xs text-slate-400 font-mono mt-0.5 uppercase tracking-wide">AUTOMATIC DRAFT COMPRESSED XML / STAMP FILER</p>
        </div>

        {/* Doc type select */}
        <div className="flex bg-slate-950 border border-slate-805 p-1 rounded-xl font-mono text-xs max-w-fit">
          <button
            onClick={() => setSelectedDoc('FormXII')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
              selectedDoc === 'FormXII' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Form XII (Annual Return)
          </button>
          <button
            onClick={() => setSelectedDoc('ScheduleX')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
              selectedDoc === 'ScheduleX' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Schedule X (Members)
          </button>
          <button
            onClick={() => setSelectedDoc('FormVIII')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap cursor-pointer transition-all ${
              selectedDoc === 'FormVIII' ? 'bg-amber-500/10 text-amber-300 border border-amber-500/20' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Form VIII (Auditor)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Column: Input Panel */}
        <div className="xl:col-span-1 space-y-4 bg-slate-950 border border-slate-804 p-5 rounded-xl">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold block">Draft parameters</span>
          
          <div className="space-y-4 font-mono text-xs">
            <div>
              <label className="block text-slate-400 mb-1 leading-normal uppercase text-[10px]">Annual General Meeting (AGM) Date</label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 leading-normal uppercase text-[10px]">Signatory Director Name</label>
              <input
                type="text"
                value={signatoryName}
                onChange={(e) => setSignatoryName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
                placeholder="Name of Managing Director"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1 leading-normal uppercase text-[10px]">Signatory Designation</label>
              <select
                value={signatoryDesignation}
                onChange={(e) => setSignatoryDesignation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
              >
                <option value="Managing Director">Managing Director</option>
                <option value="Chairman of Board">Chairman of Board</option>
                <option value="Company Secretary">Company Secretary</option>
                <option value="Authorized Legal Counsel">Authorized Legal Counsel</option>
              </select>
            </div>

            {selectedDoc === 'FormVIII' && (
              <div>
                <label className="block text-slate-400 mb-1 leading-normal uppercase text-[10px]">Appointed Auditor Firm</label>
                <input
                  type="text"
                  value={auditorName}
                  onChange={(e) => setAuditorName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200"
                />
              </div>
            )}

            <div>
              <label className="block text-slate-400 mb-1 leading-normal uppercase text-[10px]">Share Face Value (BDT)</label>
              <input
                type="number"
                value={shareValue}
                onChange={(e) => setShareValue(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:outline-none rounded-lg px-3 py-2 text-slate-200 font-mono"
                min="10"
              />
            </div>

            <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-lg flex items-start gap-2 text-amber-300 flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400">RJSC Disclaimer</span>
              <p className="text-[10px] text-slate-400 leading-normal font-sans">
                These drafts represent administrative outputs based on Section 119 and Table F specifications. Always seek counsel with licensed ICAB / ICSB advocates for final registry filings.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Physical Paper-like Viewer */}
        <div className="xl:col-span-2 flex flex-col space-y-3">
          {/* Controls Bar */}
          <div className="flex justify-between items-center bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest leading-none font-bold">PAPER DRAFT VIEWPORT</span>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-1 px-2 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-teal-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={handlePrint}
                className="p-1 px-2 text-xs font-mono text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
            </div>
          </div>

          {/* Paper Doc Area */}
          <div className="bg-amber-50/5 text-amber-900/90 rounded-2xl h-[500px] overflow-y-auto border border-amber-950/20 shadow-inner relative select-text" id="paper-doc-viewport">
            {/* Stamp Border effect */}
            <div className="absolute top-0 left-0 right-0 h-4 bg-amber-500/20 pattern-stamp" />
            
            <div className="p-8 font-mono text-xs leading-relaxed text-slate-800 bg-[#faf6ef] min-h-full" id="rendered-draft-document">
              
              {/* FORM XII DRAFT */}
              {selectedDoc === 'FormXII' && (
                <div id="form-xii-print-block">
                  <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 font-sans tracking-wide">The Companies Act, 1994</h3>
                    <p className="text-[11px] text-slate-600 mt-1 uppercase font-bold tracking-widest">FORM XII</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide italic">See Section 119, Registrar of Joint Stock Companies</p>
                    <p className="text-[10px] text-slate-700 font-bold mt-2 font-sans tracking-tight">ANNUAL RETURN OF PRIVATE LIMITED COMPANY</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">1. COMPANY LEGAL BRAND</span>
                        <span className="text-slate-900 font-bold font-sans text-sm">{selectedCompany.name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">2. REGISTERED ID NUMBER</span>
                        <span className="text-slate-900 font-bold">{selectedCompany.regNumber || 'C-PENDING/2026'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-b border-slate-300 pb-3">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">3. DATE OF ANNUAL MEETING</span>
                        <span className="text-slate-950 font-bold">{meetingDate || 'Not Conceded'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold font-semibold text-rose-600">4. BOARD OF DIRECTORS</span>
                        <span className="text-slate-900 font-bold">{selectedCompany.totalDirectors} active members</span>
                      </div>
                    </div>

                    <div className="border-b border-slate-300 pb-3">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold font-semibold text-rose-600">5. LIABILITIES & CAPITAL DETAILS</span>
                      <table className="w-full mt-2 border-collapse border border-slate-400">
                        <thead>
                          <tr className="bg-slate-100">
                            <th className="border border-slate-400 p-1.5 font-bold uppercase text-[9px]">Capital Class</th>
                            <th className="border border-slate-400 p-1.5 font-bold uppercase text-[9px] text-right">Shares Count</th>
                            <th className="border border-slate-400 p-1.5 font-bold uppercase text-[9px] text-right">Total (Tk)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-sans">Authorized share capital</td>
                            <td className="border border-slate-400 p-1.5 text-right">{(selectedCompany.authorizedCapital / Number(shareValue)).toLocaleString()}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-bold">{selectedCompany.authorizedCapital.toLocaleString()}</td>
                          </tr>
                          <tr>
                            <td className="border border-slate-400 p-1.5 font-sans">Subscribed & Paid Up</td>
                            <td className="border border-slate-400 p-1.5 text-right">{(selectedCompany.paidUpCapital / Number(shareValue)).toLocaleString()}</td>
                            <td className="border border-slate-400 p-1.5 text-right font-bold">{selectedCompany.paidUpCapital.toLocaleString()}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-4 space-y-4">
                      <p className="text-[10px] text-slate-600 leading-relaxed text-justify font-sans">
                        I hereby declare that the company has not, since the date of the last return, issued any invitation to the public to subscribe for any shares of the company, and that the return contains correct facts up for inspection as required under the local Companies Act, 1994.
                      </p>

                      <div className="flex justify-between pt-8">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none">Dated at Dhaka</p>
                          <p className="text-slate-900 mt-1 font-bold">{new Date().toISOString().split('T')[0]}</p>
                        </div>
                        <div className="text-right">
                          <div className="w-40 border-b border-slate-400 h-10 ml-auto" />
                          <p className="text-xs text-slate-900 mt-1 font-bold">{signatoryName}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{signatoryDesignation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SCHEDULE X DRAFT */}
              {selectedDoc === 'ScheduleX' && (
                <div id="schedule-x-print-block">
                  <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 font-sans tracking-wide">The Companies Act, 1994</h3>
                    <p className="text-[11px] text-slate-600 mt-1 uppercase font-bold tracking-widest">SCHEDULE X</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide italic">See Section 119 and Table F, Companies Act 1994</p>
                    <p className="text-[10px] text-slate-700 font-bold mt-2 font-sans tracking-tight">LIST OF ACTIVE MEMBERS & SHAREHOLIDNG BALANCES</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-[10px] text-slate-700 font-sans">
                      List of persons holding shares in <strong>{selectedCompany.name}</strong> on the date of the Annual General Meeting held on {meetingDate || '2026-06-15'}.
                    </p>

                    <table className="w-full border-collapse border border-slate-400">
                      <thead>
                        <tr className="bg-slate-105/80 text-[10px]">
                          <th className="border border-slate-400 p-2 text-left font-bold uppercase">Folio No.</th>
                          <th className="border border-slate-400 p-2 text-left font-bold uppercase">Name & Residential Address</th>
                          <th className="border border-slate-400 p-2 text-right font-bold uppercase">Shares</th>
                          <th className="border border-slate-400 p-2 text-right font-bold uppercase">Total Value (Tk)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="border border-slate-400 p-2 text-slate-600">FOL-001</td>
                          <td className="border border-slate-400 p-2 font-sans">
                            <strong className="text-slate-900 block text-xs">M. N. Islam</strong>
                            <span className="text-[10px] text-slate-500">House 12, Road 4, Banani, Dhaka</span>
                          </td>
                          <td className="border border-slate-400 p-2 text-right">{((selectedCompany.paidUpCapital * 0.6) / Number(shareValue)).toLocaleString()}</td>
                          <td className="border border-slate-400 p-2 text-right font-bold">{(selectedCompany.paidUpCapital * 0.6).toLocaleString()}</td>
                        </tr>
                        <tr>
                          <td className="border border-slate-400 p-2 text-slate-600">FOL-002</td>
                          <td className="border border-slate-400 p-2 font-sans">
                            <strong className="text-slate-900 block text-xs">Nouri Begum</strong>
                            <span className="text-[10px] text-slate-500">Road 12, Section 2, Mirpur, Dhaka</span>
                          </td>
                          <td className="border border-slate-400 p-2 text-right">{((selectedCompany.paidUpCapital * 0.4) / Number(shareValue)).toLocaleString()}</td>
                          <td className="border border-slate-400 p-2 text-right font-bold">{(selectedCompany.paidUpCapital * 0.4).toLocaleString()}</td>
                        </tr>
                        <tr className="bg-slate-50 font-bold">
                          <td colSpan={2} className="border border-slate-400 p-2 text-right font-sans">TOTAL NOMINAL PAID CAPITAL</td>
                          <td className="border border-slate-400 p-2 text-right">{(selectedCompany.paidUpCapital / Number(shareValue)).toLocaleString()}</td>
                          <td className="border border-slate-400 p-2 text-right">{(selectedCompany.paidUpCapital).toLocaleString()}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div className="flex justify-between pt-10">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none">Verified By Secretary</p>
                        <div className="w-32 border-b border-slate-400 h-8 mt-1" />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none">Managing Director Signature</p>
                        <div className="w-32 border-b border-slate-400 h-8 mt-1 ml-auto" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FORM VIII DRAFT */}
              {selectedDoc === 'FormVIII' && (
                <div id="form-viii-print-block">
                  <div className="text-center border-b border-dashed border-slate-400 pb-4 mb-6">
                    <h3 className="text-sm font-black uppercase text-slate-900 font-sans tracking-wide">The Companies Act, 1994</h3>
                    <p className="text-[11px] text-slate-600 mt-1 uppercase font-bold tracking-widest">FORM VIII</p>
                    <p className="text-[10px] text-slate-500 mt-0.5 uppercase tracking-wide italic">See Section 210, Registrar of Joint Stock Companies</p>
                    <p className="text-[10px] text-slate-700 font-bold mt-2 font-sans tracking-tight">NOTIFICATION OF STATUTROY AUDITOR APPOINTMENT</p>
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs text-slate-800 leading-relaxed font-sans text-justify">
                      To,<br />
                      The Registrar of Joint Stock Companies and Firms,<br />
                      Dhaka, Bangladesh.
                    </p>

                    <p className="text-xs text-slate-800 leading-relaxed font-sans text-justify pt-2">
                      Notice is hereby given pursuant to <strong>Section 210(1)</strong> of the Companies Act, 1994 that the Board of Directors of <strong>{selectedCompany.name}</strong> has formally resolved to appoint statutory auditors for the company:
                    </p>

                    <div className="bg-white p-4 border border-slate-300 rounded-lg space-y-2">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-bold font-semibold">a. Auditor Registered Firm Name</span>
                        <strong className="text-slate-900 text-xs">{auditorName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-bold font-semibold">b. Professional Certification Body</span>
                        <span className="text-slate-800 text-xs">Institute of Chartered Accountants of Bangladesh (ICAB)</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase block font-bold font-semibold">c. Effective Tenure & Operations</span>
                        <span className="text-slate-800 text-xs">From appointment date until conclusion of first General AGM.</span>
                      </div>
                    </div>

                    <div className="pt-6 space-y-4">
                      <div className="flex justify-between pt-8">
                        <div>
                          <p className="text-[10px] text-slate-400 uppercase tracking-wider block leading-none">Place of Issue</p>
                          <p className="text-slate-900 mt-1 font-bold">Dhaka, Bangladesh</p>
                        </div>
                        <div className="text-right">
                          <div className="w-40 border-b border-slate-400 h-10 ml-auto" />
                          <p className="text-xs text-slate-900 mt-1 font-bold">{signatoryName}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{signatoryDesignation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
