export interface Company {
  id: string;
  name: string;
  directorEmail?: string; // Target email address for RED severity compliance actions
  regNumber: string;
  incorporationDate: string; // YYYY-MM-DD
  authorizedCapital: number; // BDT
  paidUpCapital: number; // BDT
  totalDirectors: number;
  totalMembers: number;
  totalBoardMeetings: number; // in the last FY
  foreignShareholding: boolean;
  remittanceValue: number; // BDT, if foreign
  workPermitThresholdMet: boolean;
  
  // Register Checks
  registersKeptAtRegisteredOffice: boolean;
  registersIncomplete: boolean;
  coreRegistersMissing: boolean;
  registerOfLoansOrMortgagesMissing: boolean;
  hasUnregisteredCharge: boolean;
  chargeSatisfactionNotFiled: boolean;
  
  // Office checks
  registeredOfficeChanged: boolean;
  registeredOfficeChangedFiledWithin28Days: boolean;

  // Board Meeting checks
  boardResolutionsNotRecorded: boolean;
  egmHeld: boolean;
  egmNoticeDays: number; // Days of EGM notice

  // AGM Module
  agmHeldInCurrentFY: boolean;
  isFirstAGM: boolean;
  daysSinceIncorporation: number; // Calculated dynamically
  monthsSinceIncorporation: number; // Calculated dynamically
  firstAgmDefault: boolean; // Over 18 months and not held
  subsequentAgmDefault: boolean; // Over 15 months since last AGM
  agmNoticeDays: number; // Days of AGM notice (should be 21 clear days)
  agmQuorumMet: boolean; // Quorum check (min 2 persons)
  agmMinutesPrepared: boolean;
  auditorReappointedAtAGM: boolean;

  // Audit Module
  auditorAppointedWithin30Days: boolean; // Form VIII
  auditorIsEmployeeOrOfficer: boolean; // Disqualified auditor (Sec 209)
  auditCompletedBeforeAGM: boolean;
  agmHeldWithoutCompletedAudit: boolean;

  // Annual Return Module
  annualReturnFiled: boolean;
  annualReturnIncomplete: boolean;
  annualReturnBacklogYears: number; // 0, 1, 2, or 3+ years

  // Director Module
  directorAppointmentNotFiled14Days: boolean;
  directorDepartureNotFiled14Days: boolean;
  directorConsentNotFiled: boolean; // Form XII consent
  directorMajorFilingIrregularityOver1Year: boolean;
  directorDisqualifiedAppointed: boolean; // Undischarged bankrupt, convicted etc.
  directorInterestInContractDisclosed: boolean;

  // Share Capital Module
  shareAllotmentFiledWithin30Days: boolean; // Form XV
  shareCertificatesIssuedWithin60Days: boolean;
  capitalIncreaseFiledWithin30Days: boolean; // Form IV
  sharesAllottedAtDiscount: boolean; // Strictly illegal (Sec 49)
  sweatEquityBonusWithoutResolution: boolean; // No proper resolution
  shareTransferNoForm117: boolean;
  stampDutyNotPaidOnTransfer: boolean;
  shareTransferNoBoardApproval: boolean;
  shareTransferViolatesAoARestriction: boolean;
  registerMembersNotUpdatedAfterTransfer: boolean;

  // Structural Alteration
  altNameNotRegistered: boolean; // Sec 21
  altMoAAoANotFiled: boolean; // Sec 13 & 14
  altReductionWithoutCourt: boolean; // Sec 97

  // Tax and Foreign Exchange Module
  tinObtained: boolean;
  taxReturnFiled: boolean;
  advanceTaxQ1Paid: boolean;
  advanceTaxQ2Paid: boolean;
  advanceTaxQ3Paid: boolean;
  advanceTaxQ4Paid: boolean;
  tdsDepositedUpToDate: boolean;
  wealthStatementFiled: boolean; // if turnover triggers it
  tradeLicenseActive: boolean;
  vatRegistered: boolean;
  vatMonthlyReturnsFiled: boolean;
  vatAnnualReturnFiled: boolean;
  outwardForeignRemittanceNoDocs: boolean;

  // Escalation & Crisis Module
  strikeOffNoticeReceived: boolean;
  strikeOffListPublished: boolean;
  showCauseNoticeReceived: boolean;
  strikeOffImminent: boolean;
  corporateRescueMandatory: boolean;
  specialResolutionNotFiled: boolean;
  capitalAlterationWithoutResolution: boolean;

  // Custom User status
  notes?: string;
  adminNotes?: string;
}

export type RuleCategory =
  | 'Deadline'
  | 'Threshold'
  | 'Escalation'
  | 'Dependency'
  | 'Cascade'
  | 'Conditional'
  | 'Alteration'
  | 'Director'
  | 'Board'
  | 'Share'
  | 'Audit'
  | 'Registers'
  | 'Tax'
  | 'FEX';

export interface Rule {
  id: string; // e.g. AGM-001
  name: string;
  section: string; // Act Section details
  severity: 'RED' | 'YELLOW' | 'BLACK';
  points: number;
  category: RuleCategory;
  description: string;
  context: string;
  evaluate: (company: Company) => { triggered: boolean; notes?: string };
}

export interface UserSession {
  username: string;
  role: 'admin' | 'compliance_officer' | 'spectator';
  isLoggedIn: boolean;
  userType?: 'company' | 'lawfirm' | 'spectator';
  subscriptionPlan?: 'free' | 'pro_company' | 'pro_lawfirm';
}

export interface AuditTrailEntry {
  id: string;
  companyId: string;
  ruleId: string;
  ruleName: string;
  action: 'triggered' | 'acknowledged' | 'cleared';
  timestamp: string; // ISO format or formatted string
  username: string;
  role: string;
  notes?: string;
}

export interface SentEmail {
  id: string;
  companyId: string;
  companyName: string;
  directorEmail: string;
  ruleId: string;
  ruleName: string;
  subject: string;
  body: string;
  timestamp: string;
}

