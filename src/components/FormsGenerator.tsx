import { useState, useEffect } from 'react';
import { Company } from '../types';
import { FileText, Printer, Copy, Check, Download, AlertCircle, Landmark } from 'lucide-react';
import { motion } from 'motion/react';
import { jsPDF } from 'jspdf';

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
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      // Page Dimensions
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let y = 20;

      // Helper functions
      const addHeader = (title: string, subtitle?: string, actText?: string) => {
        // RJSC Seal / Gov Accent band
        doc.setFillColor(11, 115, 71); // Deep forest green
        doc.rect(margin, y, pageWidth - (margin * 2), 3, 'F');
        y += 8;

        // Republic Header
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(30, 41, 59);
        doc.text("GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH", pageWidth / 2, y, { align: 'center' });
        y += 5;

        doc.setFontSize(8);
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('REGISTRAR OF JOINT STOCK COMPANIES AND FIRMS', pageWidth / 2, y, { align: 'center' });
        y += 8;

        // Title
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(11, 115, 71);
        doc.text(title, pageWidth / 2, y, { align: 'center' });
        y += 5;

        if (subtitle) {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(subtitle, pageWidth / 2, y, { align: 'center' });
          y += 5;
        }

        if (actText) {
          doc.setFont('Helvetica', 'italic');
          doc.setFontSize(8);
          doc.setTextColor(100, 116, 139);
          doc.text(actText, pageWidth / 2, y, { align: 'center' });
          y += 8;
        }

        // Decorative divider
        doc.setDrawColor(203, 213, 225);
        doc.line(margin, y, pageWidth - margin, y);
        y += 8;
      };

      const addFooter = () => {
        const totalPages = doc.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
          doc.setPage(i);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(148, 163, 184);
          
          // Horizontal line
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
          
          // Footer texts
          doc.text('AFWA RJSC Sentinel Automated Document Filing Assistant', margin, pageHeight - 10);
          doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
          doc.text('Subject to administrative review under Bangladesh Companies Act 1994', pageWidth / 2, pageHeight - 10, { align: 'center' });
        }
      };

      // Draw the PDF content based on selected doc type
      if (selectedDoc === 'FormXII') {
        addHeader(
          'FORM XII',
          'ANNUAL RETURN OF PRIVATE LIMITED COMPANY',
          'Under Section 119 of the Bangladesh Companies Act, 1994'
        );

        // Section 1: Company Profile
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('1. COMPANY PARTICULARS', margin, y);
        y += 5;

        // Table/Grid Border
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin, y, pageWidth - (margin * 2), 42); // 6 rows * 7mm = 42mm

        // Sub-grid lines and fields
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(7.5);
        
        const rowHeight = 7;
        const colWidth = (pageWidth - (margin * 2)) / 2;

        const drawCell = (xPos: number, yPos: number, w: number, label: string, val: string) => {
          doc.setFont('Helvetica', 'bold');
          doc.setTextColor(100, 116, 139);
          doc.text(label.toUpperCase(), xPos + 3, yPos + 4.5);
          doc.setFont('Helvetica', 'normal');
          doc.setTextColor(30, 41, 59);
          doc.text(val || 'N/A', xPos + 35, yPos + 4.5);
        };

        // Draw horizontal divider lines
        for (let r = 1; r < 6; r++) {
          doc.line(margin, y + (r * rowHeight), pageWidth - margin, y + (r * rowHeight));
        }
        // Vertical central divider
        doc.line(margin + colWidth, y, margin + colWidth, y + 42);

        drawCell(margin, y, colWidth, 'Company Name', selectedCompany.name);
        drawCell(margin + colWidth, y, colWidth, 'Registration No', selectedCompany.regNumber || 'C-PENDING/2026');
        
        drawCell(margin, y + rowHeight, colWidth, 'Meeting Date', meetingDate || 'Not Conceded');
        drawCell(margin + colWidth, y + rowHeight, colWidth, 'Incorporation', selectedCompany.incorporationDate || 'Not Recorded');

        drawCell(margin, y + (rowHeight * 2), colWidth, 'Fiscal Year End', selectedCompany.agmHeldInCurrentFY ? 'June 30, 2025' : 'December 31, 2025');
        drawCell(margin + colWidth, y + (rowHeight * 2), colWidth, 'Directors Count', `${selectedCompany.totalDirectors} Active`);

        drawCell(margin, y + (rowHeight * 3), colWidth, 'Industry Group', 'Commercial Industry');
        drawCell(margin + colWidth, y + (rowHeight * 3), colWidth, 'Total Members', `${selectedCompany.totalDirectors} Shareholders`);

        drawCell(margin, y + (rowHeight * 4), colWidth, 'Authorized Cap', `Tk. ${selectedCompany.authorizedCapital.toLocaleString()}`);
        drawCell(margin + colWidth, y + (rowHeight * 4), colWidth, 'Paid-up Capital', `Tk. ${selectedCompany.paidUpCapital.toLocaleString()}`);

        drawCell(margin, y + (rowHeight * 5), colWidth, 'Office Address', 'Dhaka Secretariat, Bangladesh');
        drawCell(margin + colWidth, y + (rowHeight * 5), colWidth, 'Country Office', 'Bangladesh');

        y += 48;

        // Section 2: Capital Table
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('2. LIABILITIES & NOMINAL CAPITAL DIVISION', margin, y);
        y += 5;

        // Table Headers
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('CAPITAL CLASS', margin + 3, y + 5);
        doc.text('SHARES (QTY)', margin + 70, y + 5, { align: 'right' });
        doc.text('FACE VALUE (Tk)', margin + 110, y + 5, { align: 'right' });
        doc.text('AGGREGATE AMOUNT (BDT)', pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 8;

        const drawTableRow = (label: string, qty: string, faceVal: string, total: string) => {
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y, pageWidth - margin, y);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(label, margin + 3, y + 5);
          doc.text(qty, margin + 70, y + 5, { align: 'right' });
          doc.text(faceVal, margin + 110, y + 5, { align: 'right' });
          doc.setFont('Helvetica', 'bold');
          doc.text(total, pageWidth - margin - 3, y + 5, { align: 'right' });
          y += 8;
        };

        const sharesAuth = (selectedCompany.authorizedCapital / Number(shareValue)).toLocaleString();
        const sharesPaid = (selectedCompany.paidUpCapital / Number(shareValue)).toLocaleString();

        drawTableRow('Authorized Share Capital', sharesAuth, `Tk. ${shareValue}`, `Tk. ${selectedCompany.authorizedCapital.toLocaleString()}`);
        drawTableRow('Subscribed & Paid-up Capital', sharesPaid, `Tk. ${shareValue}`, `Tk. ${selectedCompany.paidUpCapital.toLocaleString()}`);
        
        y += 8;

        // Section 3: Declaration & Verification
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('3. CORPORATE DECLARATION & RESOLUTIONS', margin, y);
        y += 5;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        const decText = 'I hereby declare, in the capacity of an authorised officer of this corporation, that the company has not, since the date of the last annual return or since incorporation, issued any active invitation to the general public to subscribe for any shares of the company, and that all details provided in this Form XII annual return correspond perfectly and represent active facts as verified under Section 119 of the Bangladesh Companies Act, 1994.';
        const splitDec = doc.splitTextToSize(decText, pageWidth - (margin * 2));
        doc.text(splitDec, margin, y);
        y += splitDec.length * 4.5 + 15;

        // Signatures
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Filing Location: RJSC Dhaka Secretariat Office', margin, y);
        doc.text(`Filing Date: ${new Date().toISOString().split('T')[0]}`, margin, y + 4);

        doc.setDrawColor(148, 163, 184);
        doc.line(pageWidth - margin - 55, y + 3, pageWidth - margin, y + 3);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(signatoryName, pageWidth - margin, y + 7, { align: 'right' });
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(115, 115, 115);
        doc.text(signatoryDesignation, pageWidth - margin, y + 11, { align: 'right' });

      } else if (selectedDoc === 'ScheduleX') {
        addHeader(
          'SCHEDULE X',
          'LIST OF ACTIVE MEMBERS & SHAREHOLDING BALANCES',
          'See Section 119 and Table F of the Bangladesh Companies Act, 1994'
        );

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        doc.text(`List of persons holding shares in ${selectedCompany.name} on the date of the Annual General Meeting held on ${meetingDate || '2026-06-15'}.`, margin, y);
        y += 8;

        // Table Setup
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('FOLIO NO.', margin + 3, y + 5);
        doc.text('MEMBER NAME & RESIDENTIAL ADDRESS', margin + 30, y + 5);
        doc.text('SHARES HELD', margin + 120, y + 5, { align: 'right' });
        doc.text('TOTAL PAID VALUE', pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 8;

        const drawMemberRow = (folio: string, name: string, addr: string, shares: string, value: string) => {
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, y, pageWidth - margin, y);
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(folio, margin + 3, y + 5);
          doc.text(name, margin + 30, y + 5);
          
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(addr, margin + 30, y + 9);

          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(30, 41, 59);
          doc.text(shares, margin + 120, y + 5, { align: 'right' });
          doc.setFont('Helvetica', 'bold');
          doc.text(value, pageWidth - margin - 3, y + 5, { align: 'right' });
          y += 14;
        };

        const rawVal1 = selectedCompany.paidUpCapital * 0.6;
        const rawVal2 = selectedCompany.paidUpCapital * 0.4;
        const sharesQty1 = ((rawVal1) / Number(shareValue)).toLocaleString();
        const sharesQty2 = ((rawVal2) / Number(shareValue)).toLocaleString();

        drawMemberRow('FOL-001', 'M. N. Islam', 'House 12, Road 4, Banani, Dhaka, Bangladesh', sharesQty1, `Tk. ${rawVal1.toLocaleString()}`);
        drawMemberRow('FOL-002', 'Nouri Begum', 'Road 12, Section 2, Mirpur, Dhaka, Bangladesh', sharesQty2, `Tk. ${rawVal2.toLocaleString()}`);

        // Section Total
        doc.setDrawColor(148, 163, 184);
        doc.line(margin, y, pageWidth - margin, y);
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y, pageWidth - (margin * 2), 8, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text('TOTAL NOMINAL PAID CAPITAL REGISTERED', margin + 3, y + 5);
        doc.text((selectedCompany.paidUpCapital / Number(shareValue)).toLocaleString(), margin + 120, y + 5, { align: 'right' });
        doc.text(`Tk. ${selectedCompany.paidUpCapital.toLocaleString()}`, pageWidth - margin - 3, y + 5, { align: 'right' });
        y += 20;

        // Signatures
        doc.setDrawColor(186, 230, 253);
        doc.line(margin, y, margin + 50, y);
        doc.line(pageWidth - margin - 50, y, pageWidth - margin, y);
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Verified By Secretary', margin + 25, y + 5, { align: 'center' });
        doc.text('Managing Director Signature', pageWidth - margin - 25, y + 5, { align: 'center' });

      } else if (selectedDoc === 'FormVIII') {
        addHeader(
          'FORM VIII',
          'NOTIFICATION OF STATUTORY AUDITOR APPOINTMENT',
          'Under Section 210 of the Bangladesh Companies Act, 1994'
        );

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        doc.text('To,\nThe Registrar of Joint Stock Companies and Firms,\nDhaka, Bangladesh.', margin, y);
        y += 15;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.setTextColor(30, 41, 59);
        const mainNotice = `Notice is hereby given pursuant to Section 210(1) of the Bangladesh Companies Act, 1994, that the Board of Directors of ${selectedCompany.name} has formally resolved to appoint statutory auditors for the company:`;
        const splitNotice = doc.splitTextToSize(mainNotice, pageWidth - (margin * 2));
        doc.text(splitNotice, margin, y);
        y += splitNotice.length * 4.5 + 8;

        // Detailed card
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, pageWidth - (margin * 2), 35, 'FD');

        const drawDetailLine = (label: string, content: string, yOfs: number) => {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(100, 116, 139);
          doc.text(label, margin + 5, y + yOfs);
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
          doc.text(content, margin + 5, y + yOfs + 4.5);
        };

        drawDetailLine('A. AUDITOR REGISTERED FIRM NAME', auditorName, 5);
        drawDetailLine('B. PROFESSIONAL CERTIFICATION BODY', 'Institute of Chartered Accountants of Bangladesh (ICAB)', 15);
        drawDetailLine('C. EFFECTIVE TENURE & OPERATIONS', 'From appointment date until conclusion of first General AGM.', 25);
        y += 42;

        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const decText = 'We verify that the statutory audit selection complied with internal board processes, conflicts of interest have been fully evaluated, and disclosure filings remain current in active state archives.';
        const splitDec = doc.splitTextToSize(decText, pageWidth - (margin * 2));
        doc.text(splitDec, margin, y);
        y += splitDec.length * 4.5 + 15;

        // Signatures
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text('Place: Dhaka, Bangladesh', margin, y);
        doc.text(`Date of Issue: ${new Date().toISOString().split('T')[0]}`, margin, y + 4);

        doc.setDrawColor(148, 163, 184);
        doc.line(pageWidth - margin - 55, y + 3, pageWidth - margin, y + 3);
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(30, 41, 59);
        doc.text(signatoryName, pageWidth - margin, y + 7, { align: 'right' });
        doc.setFont('Helvetica', 'normal');
        doc.setTextColor(115, 115, 115);
        doc.text(signatoryDesignation, pageWidth - margin, y + 11, { align: 'right' });
      }

      addFooter();

      // Trigger immediate download with A4 structure
      const safeDocName = selectedDoc.replace(/\s+/g, '_');
      const safeCompName = selectedCompany.name.replace(/[^a-zA-Z0-9]/g, '_');
      doc.save(`RJSC_${safeDocName}_${safeCompName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF document:', error);
    } finally {
      setIsDownloading(false);
    }
  };

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
              <button
                onClick={handleDownloadPDF}
                disabled={isDownloading}
                className="p-1 px-2 text-xs font-mono text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-55"
              >
                <Download className={`w-4 h-4 ${isDownloading ? 'animate-bounce' : ''}`} />
                <span>{isDownloading ? 'Generating...' : 'Download PDF'}</span>
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
