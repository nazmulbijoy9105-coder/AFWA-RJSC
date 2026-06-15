import { Rule, Company } from '../types';

export const COMPLIANCE_RULES: Rule[] = [
  // ================= STAGE 1 & 2: DEADLINES =================
  {
    id: 'AGM-001',
    name: 'First AGM Default',
    section: 'Section 81, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 20,
    category: 'Deadline',
    description: 'First AGM must be held within 18 months from the date of incorporation.',
    context: 'Under Section 81, failing to hold the first general meeting within 18 months constitutes a statutory default, requiring High Court condonation to regularize.',
    evaluate: (c: Company) => {
      // Dynamic fallback if manual flag firstAgmDefault is set, OR if timeline exceeded
      const isOverdue = c.isFirstAGM && c.daysSinceIncorporation > 548 && !c.agmHeldInCurrentFY;
      return { triggered: c.firstAgmDefault || isOverdue };
    }
  },
  {
    id: 'AGM-002',
    name: 'Subsequent AGM Default',
    section: 'Section 81, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 20,
    category: 'Deadline',
    description: 'An AGM must be held in every calendar year and within 15 months of the previous AGM.',
    context: 'Failure to call subsequent AGMs on time triggers daily fines and makes directors liable to penalties.',
    evaluate: (c: Company) => {
      return { triggered: !c.isFirstAGM && c.subsequentAgmDefault };
    }
  },
  {
    id: 'AGM-004',
    name: 'AGM Notice Missing',
    section: 'Section 85, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Deadline',
    description: 'AGM Notice must be served to all members and auditor.',
    context: 'The meeting notice must be sent to every registered shareholder. Omitting the notice renders the entire AGM proceedings invalid.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldInCurrentFY && c.agmNoticeDays === 0 };
    }
  },
  {
    id: 'AR-001',
    name: 'Annual Return Default — Single Year',
    section: 'Section 119, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 10,
    category: 'Deadline',
    description: 'Annual Return (Form XII & Schedule X) must be filed with RJSC within 30 days is the AGM.',
    context: 'Failing to file the annual return delays corporate records updates on public registry, inviting compliance notices and late filing fees.',
    evaluate: (c: Company) => {
      return { triggered: !c.annualReturnFiled && c.annualReturnBacklogYears === 1 };
    }
  },
  {
    id: 'AUD-001',
    name: 'First Auditor Not Appointed Within 30 Days',
    section: 'Section 210(1), Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 10,
    category: 'Deadline',
    description: 'First auditor must be appointed by directors within 30 days of registration.',
    context: 'A company must establish its auditing process post-incorporation by appointing an ICAB registered auditor and filing Form VIII with RJSC.',
    evaluate: (c: Company) => {
      return { triggered: !c.auditorAppointedWithin30Days };
    }
  },
  {
    id: 'CAP-002',
    name: 'Charge Not Registered With RJSC Within 30 Days',
    section: 'Section 87, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Mortgage/Charge creation must be registered with RJSC within 30 days.',
    context: 'Filing after 30 days requires an application for condonation of delay. Unregistered charges are void against liquidators.',
    evaluate: (c: Company) => {
      return { triggered: c.hasUnregisteredCharge };
    }
  },
  {
    id: 'CAP-003',
    name: 'Charge Satisfaction Not Filed',
    section: 'Section 87(2), Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 3,
    category: 'Deadline',
    description: 'Satisfaction of registered charge must be filed upon repayment of secured loans.',
    context: 'Failing to file satisfaction leaves the charge active on the public profile of the company, blocking bank facilities.',
    evaluate: (c: Company) => {
      return { triggered: c.chargeSatisfactionNotFiled };
    }
  },
  {
    id: 'CAP-004',
    name: 'Special Resolution Not Filed With RJSC',
    section: 'Section 87, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Deadline',
    description: 'Special resolutions must be filed within 15 days (Form VIII/Form VIII-A type RJSC filings).',
    context: 'Decisions like authorized capital increase or name alternation require Special Resolutions, which must be registered with RJSC within specified duration.',
    evaluate: (c: Company) => {
      return { triggered: c.specialResolutionNotFiled };
    }
  },
  {
    id: 'DIR-001',
    name: 'Director Appointment Not Filed Within 14 Days',
    section: 'Section 92, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 10,
    category: 'Deadline',
    description: 'New director appointment must be filed via Form XII within 14 days.',
    context: 'Delayed notification of changes in board composition invites penalties and creates audit discrepancies.',
    evaluate: (c: Company) => {
      return { triggered: c.directorAppointmentNotFiled14Days };
    }
  },
  {
    id: 'DIR-002',
    name: 'Director Departure Not Filed Within 14 Days',
    section: 'Section 92, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 10,
    category: 'Deadline',
    description: 'Director departure (resignation / death / removal) not filed via Form XII in 14 days.',
    context: 'Failure to register board departures leaves departed directors legally liable for ongoing company actions.',
    evaluate: (c: Company) => {
      return { triggered: c.directorDepartureNotFiled14Days };
    }
  },
  {
    id: 'DIR-005',
    name: 'Director Consent Not Filed — Form XII',
    section: 'Section 92, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Consent to act as director (Form IX) not filed alongside appointment updates.',
    context: 'A director must formally sign Form IX confirming their consent. Failing to upload this causes RJSC rejection of Form XII.',
    evaluate: (c: Company) => {
      return { triggered: c.directorConsentNotFiled };
    }
  },
  {
    id: 'INC-001',
    name: 'Certificate of Incorporation Not Obtained',
    section: 'Section 9, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Deadline',
    description: 'Failure to retrieve or maintain formal Certificate of Incorporation.',
    context: 'Without the valid COI under Section 9, the entity operates illegally and has no corporate shield or status.',
    evaluate: (c: Company) => {
      return { triggered: !c.regNumber };
    }
  },
  {
    id: 'INC-002',
    name: 'Memorandum and Articles Not Filed',
    section: 'Section 11, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'Deadline',
    description: 'MoA and AoA must be properly registered and updated on file at RJSC.',
    context: 'Under Section 11, these are the constitutional instruments. Failing to file them or having unauthorized overrides is an absolute black category default.',
    evaluate: (c: Company) => {
      return { triggered: c.altMoAAoANotFiled };
    }
  },
  {
    id: 'INC-007',
    name: 'Commencement of Business Certificate Missing',
    section: 'Section 10, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 12,
    category: 'Deadline',
    description: 'Commencement of business certificate is required for public companies, but many private companies fail checklist setups.',
    context: 'While strictly required for Public Ltd, commercial operations of Private entities without full registration proof trigger regulatory flags.',
    evaluate: (c: Company) => {
      return { triggered: c.isFirstAGM && c.daysSinceIncorporation > 180 && !c.agmHeldInCurrentFY && c.authorizedCapital > 50000000 && !c.tinObtained };
    }
  },
  {
    id: 'OFF-001',
    name: 'Change of Registered Office Not Filed Within 28 Days',
    section: 'Section 81, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 3,
    category: 'Deadline',
    description: 'Notice of relocation of critical business office must be filed with RJSC within 28 days via Form VI.',
    context: 'Every registered company has to maintain a physical principal place of business. Relocation remains legally un-notified without Form VI.',
    evaluate: (c: Company) => {
      return { triggered: c.registeredOfficeChanged && !c.registeredOfficeChangedFiledWithin28Days };
    }
  },
  {
    id: 'SH-001',
    name: 'Share Allotment Not Filed — Form XV',
    section: 'Section 50, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Deadline',
    description: 'Form XV for return of allotment must be filed within 30 days of the board allocation resolution.',
    context: 'Failing to notify the registrar results in shares being unlisted on corporate records, complicating member registry audits.',
    evaluate: (c: Company) => {
      return { triggered: !c.shareAllotmentFiledWithin30Days };
    }
  },
  {
    id: 'SH-002',
    name: 'Share Certificates Not Issued Within 60 Days',
    section: 'Section 46, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Physical Share Certificates must be signed, stamped under common seal, and delivered to subscribers within 60 days of allotment.',
    context: 'Shareholders have a legal right to certificates. Failure constitutes a statutory breach.',
    evaluate: (c: Company) => {
      return { triggered: c.shareCertificatesIssuedWithin60Days };
    }
  },
  {
    id: 'SH-003',
    name: 'Capital Increase Not Filed — Form IV',
    section: 'Section 52, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Deadline',
    description: 'Notice of increase in authorized share capital must be filed within 15-30 days via Form IV.',
    context: 'Without formal registration and stamp fee payment for Form IV, any increased share capital remains invalid in RJSC database.',
    evaluate: (c: Company) => {
      return { triggered: !c.capitalIncreaseFiledWithin30Days };
    }
  },
  {
    id: 'TAX-003',
    name: 'Tax Return Not Filed for Current Financial Year',
    section: 'Section 83, Income Tax Act 2023 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Deadline',
    description: 'Annual Corporate Income Tax returns must be filed with NBR by Tax Day (typically Jan 15 / next phase).',
    context: 'Failure triggers heavy compounding interest on corporate income, freeze of tax accounts, and potential criminal cases.',
    evaluate: (c: Company) => {
      return { triggered: !c.taxReturnFiled };
    }
  },
  {
    id: 'TAX-004',
    name: 'Advance Tax Q1 Not Paid',
    section: 'Section 74, Income Tax Act 2023 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Quarter 1 Advance corporate tax payment default.',
    context: 'Companies with expected tax liability must pay quarterly installments. Delay triggers interest charges.',
    evaluate: (c: Company) => {
      return { triggered: !c.advanceTaxQ1Paid && c.paidUpCapital > 5000000 };
    }
  },
  {
    id: 'TAX-005',
    name: 'Advance Tax Q2 Not Paid',
    section: 'Section 74, Income Tax Act 2023 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Quarter 2 Advance corporate tax payment default.',
    context: 'Required corporate tax pre-payment failure.',
    evaluate: (c: Company) => {
      return { triggered: !c.advanceTaxQ2Paid && c.paidUpCapital > 5000000 };
    }
  },
  {
    id: 'TAX-006',
    name: 'Advance Tax Q3 Not Paid',
    section: 'Section 74, Income Tax Act 2023 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Quarter 3 Advance corporate tax payment default.',
    context: 'Required corporate tax pre-payment failure.',
    evaluate: (c: Company) => {
      return { triggered: !c.advanceTaxQ3Paid && c.paidUpCapital > 5000000 };
    }
  },
  {
    id: 'TAX-007',
    name: 'Advance Tax Q4 Not Paid',
    section: 'Section 74, Income Tax Act 2023 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Quarter 4 Advance corporate tax payment default.',
    context: 'Required corporate tax pre-payment failure.',
    evaluate: (c: Company) => {
      return { triggered: !c.advanceTaxQ4Paid && c.paidUpCapital > 5000000 };
    }
  },
  {
    id: 'TAX-008',
    name: 'TDS Not Deposited Up to Date',
    section: 'Section 51, Income Tax Act 2023 (Bangladesh)',
    severity: 'RED',
    points: 10,
    category: 'Deadline',
    description: 'Tax Deducted at Source (TDS) from supplier invoices or salary must be deposited within 15 days.',
    context: 'Failure represents the misappropriation of state revenue under Section 51, leading to major personal fines of directors.',
    evaluate: (c: Company) => {
      return { triggered: !c.tdsDepositedUpToDate };
    }
  },
  {
    id: 'TL-001',
    name: 'Trade License Expired or Not Obtained',
    section: 'City Corporation / Municipality Act (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Annual trade license must be renewed, typically by June 30.',
    context: 'Operating commercial premises with an invalid license is a municipal offense and halts all physical operations.',
    evaluate: (c: Company) => {
      return { triggered: !c.tradeLicenseActive };
    }
  },
  {
    id: 'TR-004',
    name: 'Register of Members Not Updated After Transfer',
    section: 'Section 34, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Members Register must reflect share changes promptly is board approval of transfer.',
    context: 'A delay allows illegal voting by exited members and inaccurate reporting of active statutory members.',
    evaluate: (c: Company) => {
      return { triggered: c.registerMembersNotUpdatedAfterTransfer };
    }
  },
  {
    id: 'VAT-002',
    name: 'VAT Monthly Return Not Filed',
    section: 'Section 37, Value Added Tax Act 2012 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Deadline',
    description: 'Monthly VAT return (Form 9.1) must be filed by the 15th of the succeeding month.',
    context: 'A day-late filing generates a BDT 10,000 fine and suspends corporate BIN (Business Identification Number) status.',
    evaluate: (c: Company) => {
      return { triggered: c.vatRegistered && !c.vatMonthlyReturnsFiled };
    }
  },
  {
    id: 'VAT-003',
    name: 'VAT Annual Return Not Filed',
    section: 'Value Added Tax Act 2012 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Deadline',
    description: 'Annual corporate sales audit indicators of VAT discrepancies.',
    context: 'Failure blocks final clearance from local tax circle commissioner checks.',
    evaluate: (c: Company) => {
      return { triggered: c.vatRegistered && !c.vatAnnualReturnFiled };
    }
  },

  // ================= STAGE 3: THRESHOLD RULES =================
  {
    id: 'AGM-003',
    name: 'AGM Notice Defective — Insufficient Days',
    section: 'Section 85, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Threshold',
    description: 'AGM notice period is less than 21 clear days.',
    context: 'Section 85 dictates clear 21 days between notice dispatch and the meeting. Retrospective proxies or shorter notice violates the law.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldInCurrentFY && c.agmNoticeDays > 0 && c.agmNoticeDays < 21 };
    }
  },
  {
    id: 'AGM-005',
    name: 'AGM Quorum Not Met',
    section: 'Section 83(12), Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Threshold',
    description: 'AGM quorum fell below minimum registered limit (min 2 persons).',
    context: 'A general meeting without a minimum of two members present physically or by proxy is completely null and void.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldInCurrentFY && !c.agmQuorumMet };
    }
  },
  {
    id: 'AGM-006',
    name: 'AGM Minutes Not Prepared',
    section: 'Section 83, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Threshold',
    description: 'AGM Minutes are missing from physical records books.',
    context: 'Minutes of company general proceedings must be cleanly transcribed and hand-signed by the presiding chairman.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldInCurrentFY && !c.agmMinutesPrepared };
    }
  },
  {
    id: 'AR-004',
    name: 'Annual Return Filed But Incomplete',
    section: 'Section 119, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Threshold',
    description: 'Annual return missing central Schedule X elements (Auditor report copy, directors list, etc.).',
    context: 'Providing self-prepared balance sheets instead of peer ICAB certified auditor inputs violates statutory return requirements.',
    evaluate: (c: Company) => {
      return { triggered: c.annualReturnFiled && c.annualReturnIncomplete };
    }
  },
  {
    id: 'INC-003',
    name: 'Minimum Directors Not Appointed',
    section: 'Section 90(2), Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Threshold',
    description: 'Number of directors is lower than statutory minimum of two under Section 90(2).',
    context: 'If a Director withdraws, dies, or departs, the sole remaining director is barred from conducting regular operations until a replacement is appointed.',
    evaluate: (c: Company) => {
      return { triggered: c.totalDirectors < 2 };
    }
  },
  {
    id: 'INC-004',
    name: 'Paid-Up Capital Exceeds Authorized Capital',
    section: 'Section 150, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 20,
    category: 'Threshold',
    description: 'Paid-Up Capital exceeds registered Authorized Capital of the company.',
    context: 'This is a serious legal violation. A company cannot issue capital in excess of its authorized ceiling without raising it first via Special Resolution and paying registration fees.',
    evaluate: (c: Company) => {
      return { triggered: c.paidUpCapital > c.authorizedCapital };
    }
  },
  {
    id: 'REG-001',
    name: 'Statutory Registers Incomplete',
    section: 'Sections 34, 83, 87, 90, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Threshold',
    description: 'Company registers are unorganized or missing recent updates.',
    context: 'Failure to keep dynamic records updated (members, transfers, mortgages) represents a day-to-day regulatory default, inviting fines on inspection.',
    evaluate: (c: Company) => {
      return { triggered: c.registersIncomplete };
    }
  },
  {
    id: 'REG-002',
    name: 'Core Statutory Registers Missing',
    section: 'Sections 34, 83, 87, 90, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 10,
    category: 'Threshold',
    description: 'Primary register components (Register of Members, Dividends, Board Minutes Book) completely missing.',
    context: 'Total corporate default indicating compliance negligence. Exposes management directly to regulatory crackdowns.',
    evaluate: (c: Company) => {
      return { triggered: c.coreRegistersMissing };
    }
  },
  {
    id: 'REG-003',
    name: 'Registers Not Kept at Registered Office',
    section: 'Section 34(2), Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 3,
    category: 'Threshold',
    description: 'Required registers stored offsite or in third-party personal custody.',
    context: 'The law mandates that all statutory register files be safely housed at the company registered physical office for public audit view.',
    evaluate: (c: Company) => {
      return { triggered: !c.registersKeptAtRegisteredOffice };
    }
  },
  {
    id: 'TAX-001',
    name: 'Tax Identification Number (TIN) Not Obtained',
    section: 'Income Tax Act 2023 (Bangladesh)',
    severity: 'RED',
    points: 10,
    category: 'Threshold',
    description: 'The company has not registered a corporate TIN with NBR.',
    context: 'Without a TIN, the entity is a tax evader, cannot open commercial bank accounts, and cannot validate trade documents.',
    evaluate: (c: Company) => {
      return { triggered: !c.tinObtained };
    }
  },
  {
    id: 'TAX-009',
    name: 'Minimum Tax Not Paid',
    section: 'Section 82, Income Tax Act 2023 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Threshold',
    description: 'Corporate bank accounting transactions trigger minimum corporate tax default.',
    context: 'Under Section 82, minimum tax calculations are mandatory irrespective of physical operational losses.',
    evaluate: (c: Company) => {
      return { triggered: c.tinObtained && !c.taxReturnFiled && c.authorizedCapital > 10000000 };
    }
  },
  {
    id: 'TR-001',
    name: 'No Share Transfer Instrument — Form 117',
    section: 'Section 108, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Threshold',
    description: 'Share transfers executed without the mandatory Form 117 transfer instrument.',
    context: 'Form 117 contains the formal transfer agreement. Its omission makes any transfer null, failing subsequent audits.',
    evaluate: (c: Company) => {
      return { triggered: c.shareTransferNoForm117 };
    }
  },
  {
    id: 'TR-002',
    name: 'Stamp Duty Not Paid on Share Transfer',
    section: 'Stamp Act 1899 (Bangladesh), Schedule I, Item 62',
    severity: 'YELLOW',
    points: 5,
    category: 'Threshold',
    description: 'Stamp duty value on transfer instrument is unpaid or defective.',
    context: 'Shares cannot be registered in the members index unless the relevant share stamps are applied to Form 117 and canceled.',
    evaluate: (c: Company) => {
      return { triggered: c.stampDutyNotPaidOnTransfer };
    }
  },
  {
    id: 'TR-003',
    name: 'No Board Approval for Share Transfer',
    section: 'Section 47, Companies Act 1994 (Bangladesh); Articles of Association',
    severity: 'YELLOW',
    points: 8,
    category: 'Threshold',
    description: 'Board of Directors did not formally resolve to approve a member transfer.',
    context: 'Articles typically contain preemptive rights or board veto limits. Bypassing board approval invalidates the transaction.',
    evaluate: (c: Company) => {
      return { triggered: c.shareTransferNoBoardApproval };
    }
  },
  {
    id: 'TR-005',
    name: 'Share Transfer Violates AoA Restriction',
    section: 'Section 47, Companies Act 1994 (Bangladesh); Articles of Association',
    severity: 'BLACK',
    points: 15,
    category: 'Threshold',
    description: 'Share transfers carried out in direct conflict with explicit Article limitations.',
    context: 'Violations of preemption rights or transfers to unauthorized third parties violate contract, exposing transfers to cancellation.',
    evaluate: (c: Company) => {
      return { triggered: c.shareTransferViolatesAoARestriction };
    }
  },

  // ================= STAGE 4: ESCALATION & CRISIS =================
  {
    id: 'AR-002',
    name: 'Annual Return 2-Year Backlog',
    section: 'Sections 119 and 304, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 20,
    category: 'Escalation',
    description: 'Failure to file annual statutory records for two consecutive fiscal periods.',
    context: 'Escalated backlogs signal corporate dormancy to RJSC, prompting administrative compliance flags.',
    evaluate: (c: Company) => {
      return { triggered: c.annualReturnBacklogYears >= 2 };
    }
  },
  {
    id: 'AR-003',
    name: 'Annual Return 3-Year Backlog — Strike-Off Risk',
    section: 'Sections 119 and 304, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 20,
    category: 'Escalation',
    description: 'Severe statutory backlog — 3 or more consecutive years of missing annual filings.',
    context: 'Section 304 gives the registrar absolute authority to publish strike-off alerts on companies failing to file for three years.',
    evaluate: (c: Company) => {
      return { triggered: c.annualReturnBacklogYears >= 3 || c.strikeOffListPublished };
    }
  },
  {
    id: 'DIR-003',
    name: 'Major Director Filing Irregularity — Over 1 Year',
    section: 'Section 92, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Escalation',
    description: 'Failing to report directorship mutations or resignations to RJSC for over 1 year.',
    context: 'Delayed reporting misrepresents key credit controllers public profiles on registry data databases.',
    evaluate: (c: Company) => {
      return { triggered: c.directorMajorFilingIrregularityOver1Year };
    }
  },
  {
    id: 'ESC-001',
    name: 'Strike-Off Risk Elevated',
    section: 'Section 304, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Escalation',
    description: 'Company identified on potential dormancy list due to chronic compliance failures.',
    context: 'Formal administrative notices may be dispatched. Immediate legal intervention is required.',
    evaluate: (c: Company) => {
      return { triggered: c.strikeOffNoticeReceived || (c.annualReturnBacklogYears >= 2 && !c.agmHeldInCurrentFY) };
    }
  },
  {
    id: 'ESC-002',
    name: 'Strike-Off Imminent',
    section: 'Section 304, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'Escalation',
    description: 'Company name scheduled for deletion from the active registry.',
    context: 'The final RJSC warning phase before the gazette publication makes deletion final, dissolving the corporate shield.',
    evaluate: (c: Company) => {
      return { triggered: c.strikeOffImminent };
    }
  },
  {
    id: 'ESC-003',
    name: 'Corporate Rescue Mandatory — Systemic Failure',
    section: 'Section 304, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'Escalation',
    description: 'Company is deregistered or is facing severe multiple enforcement lawsuits.',
    context: 'Company status has turned dormant or struck off. High Court company bench petitions are mandatory for restoration.',
    evaluate: (c: Company) => {
      return { triggered: c.corporateRescueMandatory || (c.strikeOffImminent && c.annualReturnBacklogYears >= 3) };
    }
  },

  // ================= STAGE 5: DEPENDENCIES =================
  {
    id: 'AUD-002',
    name: 'Audit Not Completed Before AGM',
    section: 'Section 151, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 12,
    category: 'Dependency',
    description: 'Financial Statements not certified by auditor prior to calling the AGM.',
    context: 'Section 151 strictly forbids placing un-audited draft calculations at the AGM for shareholder vote approvals.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldInCurrentFY && !c.auditCompletedBeforeAGM };
    }
  },
  {
    id: 'AUD-003',
    name: 'AGM Held Without Completed Audit',
    section: 'Sections 151, 210, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'Dependency',
    description: 'AGM executed and adopted invalid, uncertified company accounts.',
    context: 'Adopting uncertified values violates secondary administrative guidelines. This is a black category corporate crime.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldWithoutCompletedAudit || (c.agmHeldInCurrentFY && !c.auditCompletedBeforeAGM && c.authorizedCapital > 1000000) };
    }
  },
  {
    id: 'AUD-004',
    name: 'Auditor Not Reappointed at AGM',
    section: 'Section 210(2), Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Dependency',
    description: 'AGM proceedings did not specify auditor appointment or renewal for next period.',
    context: 'A company cannot remain without an appointed statutory auditor. Default breaks audit sequences.',
    evaluate: (c: Company) => {
      return { triggered: c.agmHeldInCurrentFY && !c.auditorReappointedAtAGM };
    }
  },
  {
    id: 'DIR-004',
    name: 'Departed Director Still Active on RJSC Register',
    section: 'Section 92, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 10,
    category: 'Dependency',
    description: 'Resigned or removed director still displayed as active agent on public corporate index.',
    context: 'Fails to update RJSC records, making previous board members vulnerable to company debts and civil operations risks.',
    evaluate: (c: Company) => {
      return { triggered: c.directorDepartureNotFiled14Days && c.totalDirectors < 3 };
    }
  },

  // ================= STAGE 6: CASCADE & CONDITIONAL =================
  {
    id: 'CAP-001',
    name: 'Capital Alteration Without Proper Resolution',
    section: 'Section 54, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Cascade',
    description: 'Corporate capital adjustments performed without obtaining mandatory general shareholder approval.',
    context: 'A board resolution alone cannot authorize share splits, consolidations, or share cancellation.',
    evaluate: (c: Company) => {
      return { triggered: c.capitalAlterationWithoutResolution };
    }
  },
  {
    id: 'TR-006',
    name: 'Composite Irregular Transfer',
    section: 'Sections 34, 47, 108, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 10,
    category: 'Cascade',
    description: 'Transfer is invalid across multiple overlapping layers of checks (unpaid stamp duty AND missing form 117).',
    context: 'Cascading irregularities raise forensic audit concerns and freeze active share registers.',
    evaluate: (c: Company) => {
      return { triggered: c.shareTransferNoForm117 && c.stampDutyNotPaidOnTransfer };
    }
  },
  {
    id: 'INC-005',
    name: 'Encashment Certificate Missing — Foreign Shareholding',
    section: 'Section 150, Companies Act 1994; BIDA Foreign Investment Guidelines',
    severity: 'YELLOW',
    points: 8,
    category: 'Conditional',
    description: 'Foreign share subscriptions lacking mandatory bank encashment certificates.',
    context: 'To register shares in the name of a foreign subscriber, local banks must issue an encashment certificate confirming USD/foreign currency inflow.',
    evaluate: (c: Company) => {
      return { triggered: c.foreignShareholding && c.remittanceValue === 0 };
    }
  },
  {
    id: 'INC-006',
    name: 'Remittance Below Work Permit Threshold',
    section: 'BIDA Foreign Investment Act 1980; BOI Guidelines',
    severity: 'YELLOW',
    points: 5,
    category: 'Conditional',
    description: 'Foreign capital inflows fall below the minimum USD 50,000 required for director work permits.',
    context: 'Under Bangladesh Investment Development Authority (BIDA) rules, work permits require verification of specific FDI levels.',
    evaluate: (c: Company) => {
      return { triggered: c.foreignShareholding && !c.workPermitThresholdMet && c.remittanceValue < 4000000 };
    }
  },
  {
    id: 'TAX-002',
    name: 'VAT Registration Required But Not Obtained',
    section: 'Section 15, Value Added Tax Act 2012 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Conditional',
    description: 'Company turnover triggers a mandatory VAT Business Identification Number (BIN) requirement.',
    context: 'If corporate turnover exceeds statutory exemption thresholds, trading without BIN constitutes commercial tax evasion.',
    evaluate: (c: Company) => {
      return { triggered: !c.vatRegistered && c.authorizedCapital > 15000000 };
    }
  },

  // ================= STAGE 7: ADDITIONS (STRUCTURAL, GOVERNANCE, ETC.) =================
  {
    id: 'ALT-001',
    name: 'Change of Company Name Not Registered',
    section: 'Section 21, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Alteration',
    description: 'Using a modified corporate name commercially without official RJSC brand registration.',
    context: 'A company cannot trade under a name different from its certificate of incorporation unless approved by RJSC.',
    evaluate: (c: Company) => {
      return { triggered: c.altNameNotRegistered };
    }
  },
  {
    id: 'ALT-002',
    name: 'Alteration of MoA/AoA Not Filed with RJSC',
    section: 'Sections 13 & 14, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Alteration',
    description: 'Altering primary MoA business object clauses or Articles without RJSC notification and filing.',
    context: 'All alterations of company object clauses require High Court confirmation and subsequent RJSC registry record filing within 90 days.',
    evaluate: (c: Company) => {
      return { triggered: c.altMoAAoANotFiled };
    }
  },
  {
    id: 'ALT-003',
    name: 'Reduction of Share Capital Without Court Approval',
    section: 'Section 97, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'Alteration',
    description: 'Executing capital reduction or writing off values without mandatory High Court approval.',
    context: 'Reducing paid-up capital of any Private Ltd is legally void and ultra vires unless fully confirmed by the High Court company bench.',
    evaluate: (c: Company) => {
      return { triggered: c.altReductionWithoutCourt };
    }
  },
  {
    id: 'DIR-006',
    name: 'Disqualified Director Appointed',
    section: 'Section 197, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'Director',
    description: 'Appointing a director who has been disqualified under the Act (bankrupt, felon, child/minor, etc.).',
    context: 'Under Section 197, appointing a person who is bankrupt, of unsound mind, or convicted of criminal actions involves severe board liability.',
    evaluate: (c: Company) => {
      return { triggered: c.directorDisqualifiedAppointed };
    }
  },
  {
    id: 'DIR-007',
    name: 'Number of Directors Exceeds Statutory Maximum',
    section: 'Section 90, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 20,
    category: 'Director',
    description: 'Total number of directors exceeds the max limit authorized in the Articles of Association.',
    context: 'Exceeding directorship counts without updating Articles via Special Resolution makes recent resolutions invalid.',
    evaluate: (c: Company) => {
      return { triggered: c.totalDirectors > 20 };
    }
  },
  {
    id: 'DIR-008',
    name: 'Director\'s Interest in Contract Not Disclosed',
    section: 'Section 194, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Director',
    description: 'Failing to formally declare a director\'s personal interest in vendor agreements/contracts.',
    context: 'Section 194 makes general transactions voidable if personal interest is un-declared during active agenda voting.',
    evaluate: (c: Company) => {
      return { triggered: c.directorInterestInContractDisclosed };
    }
  },
  {
    id: 'BRD-001',
    name: 'Minimum Board Meetings Not Held',
    section: 'Section 97, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Board',
    description: 'Failing to execute at least four Board Meetings in a calendar year (one every quarter).',
    context: 'The directors must meet regularly. Going entire periods without formal reviews invites audit flags.',
    evaluate: (c: Company) => {
      return { triggered: c.totalBoardMeetings < 4 };
    }
  },
  {
    id: 'BRD-002',
    name: 'Board Resolutions Not Recorded in Minute Book',
    section: 'Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Board',
    description: 'Directorship decisions transcribed informally without statutory board minutes maintenance.',
    context: 'Decisions made over chats or emails require ratification inside formal minutes books to enjoy legitimate shielding.',
    evaluate: (c: Company) => {
      return { triggered: c.boardResolutionsNotRecorded };
    }
  },
  {
    id: 'BRD-003',
    name: 'EGM Defaults',
    section: 'Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Board',
    description: 'Executing an Extraordinary General Meeting (EGM) without satisfying the 21-day notice standard.',
    context: 'EGM notices require clear days of circularization. Defective EGMs risk invalidating specific core special resolutions.',
    evaluate: (c: Company) => {
      return { triggered: c.egmHeld && c.egmNoticeDays < 21 };
    }
  },
  {
    id: 'SH-004',
    name: 'Shares Allotted at a Discount',
    section: 'Section 49, Companies Act 1994 (Bangladesh)',
    severity: 'BLACK',
    points: 20,
    category: 'Share',
    description: 'Allocated company shares at values below the face/par value.',
    context: 'Discounted issues are strictly illegal and contractually void under Section 49, except under extreme, court-sanctioned situations.',
    evaluate: (c: Company) => {
      return { triggered: c.sharesAllottedAtDiscount };
    }
  },
  {
    id: 'SH-005',
    name: 'Issue of Sweat Equity / Bonus Shares Without Resolution',
    section: 'Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Share',
    description: 'Issuing bonus or capitalization shares without explicit Articles clearance and special general resolutions.',
    context: 'Startups often promise sweat equity without legal adjustments of shared reserves, leading to regulatory blocks.',
    evaluate: (c: Company) => {
      return { triggered: c.sweatEquityBonusWithoutResolution };
    }
  },
  {
    id: 'AUD-005',
    name: 'Auditor Qualification Disregarded',
    section: 'Section 209, Companies Act 1994 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Audit',
    description: 'Appointed an auditor who is legally disqualified from auditing this entity.',
    context: 'An auditor cannot be a key employee, secretary, parent, or partner of an officer of the company. It breaches independence indices.',
    evaluate: (c: Company) => {
      return { triggered: c.auditorIsEmployeeOrOfficer };
    }
  },
  {
    id: 'AUD-006',
    name: 'Form VIII Not Attached to Annual Return',
    section: 'Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 8,
    category: 'Audit',
    description: 'Form VIII (proof of auditor appointment) is not attached to annual return package.',
    context: 'RJSC registries routinely decline Annual Return packages if the Auditor Appointment notification is missing from corporate records.',
    evaluate: (c: Company) => {
      return { triggered: c.annualReturnFiled && !c.auditorAppointedWithin30Days };
    }
  },
  {
    id: 'REG-004',
    name: 'Register of Directors & Officers Incomplete',
    section: 'Section 115, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Registers',
    description: 'Register of Directors and Secretaries is missing essential details or residential history.',
    context: 'All alterations of board addresses, nationalities, or equity ratios must be kept in physically auditable records folders.',
    evaluate: (c: Company) => {
      return { triggered: c.registersIncomplete && c.totalDirectors > 2 };
    }
  },
  {
    id: 'REG-005',
    name: 'Register of Charges Not Maintained at Root Office',
    section: 'Section 87, Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Registers',
    description: 'Register of Charges (mortgages) is missing or unmaintained physically.',
    context: 'All mortgages created on assets must be transcribed in the Register of Charges inside the physical company office.',
    evaluate: (c: Company) => {
      return { triggered: c.hasUnregisteredCharge || c.registerOfLoansOrMortgagesMissing };
    }
  },
  {
    id: 'REG-006',
    name: 'Register of Loans & Corporate Investments Missing',
    section: 'Companies Act 1994 (Bangladesh)',
    severity: 'YELLOW',
    points: 5,
    category: 'Registers',
    description: 'Lack of dedicated register logs for loans or asset charges.',
    context: 'Even and clean ledgers are dynamic parameters. They are checked in regular audits.',
    evaluate: (c: Company) => {
      return { triggered: c.registerOfLoansOrMortgagesMissing };
    }
  },
  {
    id: 'TAX-010',
    name: 'Wealth Statement Not Filed',
    section: 'Income Tax Act 2023 (Bangladesh)',
    severity: 'RED',
    points: 15,
    category: 'Tax',
    description: 'Missing wealth statements for directors as triggered by company turnover thresholds.',
    context: 'Under high turnover brackets, NBR demands personal wealth assertions from board controllers.',
    evaluate: (c: Company) => {
      return { triggered: c.wealthStatementFiled };
    }
  },
  {
    id: 'FEX-001',
    name: 'Outward Foreign Remittance Without Proper Documentation',
    section: 'Foreign Exchange Regulation Act 1947 (Bangladesh)',
    severity: 'BLACK',
    points: 25,
    category: 'FEX',
    description: 'Foreign outward payments made without appropriate documentary approvals.',
    context: 'Transact outside legal BIDA, NBR, or Bangladesh Bank clearances results in laundering liabilities.',
    evaluate: (c: Company) => {
      return { triggered: c.outwardForeignRemittanceNoDocs };
    }
  }
];

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'Dhaka Tech Solutions Ltd.',
    regNumber: 'C-109845/2024',
    incorporationDate: '2024-01-15',
    authorizedCapital: 20000000,
    paidUpCapital: 5000000,
    totalDirectors: 3,
    totalMembers: 4,
    totalBoardMeetings: 5,
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
    daysSinceIncorporation: 516,
    monthsSinceIncorporation: 17,
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
    shareTransferNoBoardApproval: true,
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
    vatRegistered: true,
    vatMonthlyReturnsFiled: true,
    vatAnnualReturnFiled: true,
    outwardForeignRemittanceNoDocs: false,
    
    strikeOffNoticeReceived: false,
    strikeOffListPublished: false,
    showCauseNoticeReceived: false,
    strikeOffImminent: false,
    corporateRescueMandatory: false,
    specialResolutionNotFiled: false,
    capitalAlterationWithoutResolution: false,
    notes: 'In excellent standing. Keep audits regular.'
  },
  {
    id: 'comp-2',
    name: 'Bengal Apparel Sourcing Ltd.',
    regNumber: 'C-89234/2021',
    incorporationDate: '2021-06-10',
    authorizedCapital: 10000000,
    paidUpCapital: 12000000, // Trigger: Paid Up > Authorized
    totalDirectors: 1, // Trigger: Less than 2 directors
    totalMembers: 2,
    totalBoardMeetings: 1, // Trigger: Minimum board meetings < 4
    foreignShareholding: true,
    remittanceValue: 0, // Trigger: Foreign shareholding but encashment cert missing
    workPermitThresholdMet: false,
    
    registersKeptAtRegisteredOffice: false, // Trigger: Registers not kept at office
    registersIncomplete: true, // Trigger: Registers incomplete
    coreRegistersMissing: true, // Trigger: Core records missing
    registerOfLoansOrMortgagesMissing: true,
    hasUnregisteredCharge: true, // Trigger: Unregistered charge details
    chargeSatisfactionNotFiled: true,
    
    registeredOfficeChanged: true,
    registeredOfficeChangedFiledWithin28Days: false, // Trigger: Office change not filed within 28 days
    
    boardResolutionsNotRecorded: true,
    egmHeld: true,
    egmNoticeDays: 10, // Defective EGM Notice (<21 days)
    
    agmHeldInCurrentFY: false, // Trigger subsequent agm default
    isFirstAGM: false,
    daysSinceIncorporation: 1465,
    monthsSinceIncorporation: 48,
    firstAgmDefault: false,
    subsequentAgmDefault: true,
    agmNoticeDays: 0,
    agmQuorumMet: false,
    agmMinutesPrepared: false,
    auditorReappointedAtAGM: false,
    
    auditorAppointedWithin30Days: false,
    auditorIsEmployeeOrOfficer: true, // Disqualified auditor appointed
    auditCompletedBeforeAGM: false,
    agmHeldWithoutCompletedAudit: true, // AGM held without audit completed
    
    annualReturnFiled: false,
    annualReturnIncomplete: true,
    annualReturnBacklogYears: 3, // Severe Backlog - Strike off imminent
    
    directorAppointmentNotFiled14Days: true,
    directorDepartureNotFiled14Days: true,
    directorConsentNotFiled: true,
    directorMajorFilingIrregularityOver1Year: true,
    directorDisqualifiedAppointed: true, // Struck-off / Bankrupt director active
    directorInterestInContractDisclosed: false,
    
    shareAllotmentFiledWithin30Days: false,
    shareCertificatesIssuedWithin60Days: true,
    capitalIncreaseFiledWithin30Days: false,
    sharesAllottedAtDiscount: true, // Illegal discount share
    sweatEquityBonusWithoutResolution: true,
    shareTransferNoForm117: true,
    stampDutyNotPaidOnTransfer: true, // Unpaid Stamp duty
    shareTransferNoBoardApproval: true,
    shareTransferViolatesAoARestriction: true,
    registerMembersNotUpdatedAfterTransfer: true,
    
    altNameNotRegistered: true,
    altMoAAoANotFiled: true,
    altReductionWithoutCourt: true, // Illegal Capital reduction without court order
    
    tinObtained: false, // Trigger: No TIN
    taxReturnFiled: false,
    advanceTaxQ1Paid: false,
    advanceTaxQ2Paid: false,
    advanceTaxQ3Paid: false,
    advanceTaxQ4Paid: false,
    tdsDepositedUpToDate: false,
    wealthStatementFiled: true,
    tradeLicenseActive: false, // Expired Trade license
    vatRegistered: false,
    vatMonthlyReturnsFiled: false,
    vatAnnualReturnFiled: false,
    outwardForeignRemittanceNoDocs: true, // Severe foreign remittance violation
    
    strikeOffNoticeReceived: true,
    strikeOffListPublished: true,
    showCauseNoticeReceived: true,
    strikeOffImminent: true,
    corporateRescueMandatory: true,
    specialResolutionNotFiled: true,
    capitalAlterationWithoutResolution: true,
    notes: 'Severe multi-stage default across all legal and tax frameworks. Administrative strike-off alerts active.'
  }
];
