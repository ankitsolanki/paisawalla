import PincodeLender from '../models/PincodeLender.js';
import Lender from '../models/Lender.js';
import { logger } from '../utils/logger.js';

const UNSECURED_ACCOUNT_TYPES = [
  '10', '12', '05', '08', '40', '41', '43', '51', '52', '53', '54',
  '14', '09', '06', '60', '55', '56', '57', '58', '35', '16', '19',
  '20', '18', '36', '37', '38', '39', '61', '00',
];

const ALL_LOAN_ACCOUNT_TYPES = [
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '13', '15',
  '17', '32', '33', '34', '39', '40', '41', '42', '45', '46', '47',
  '50', '51', '52', '53', '54', '59', '60', '61', '69', '70',
];

const UNSECURED_ENQUIRY_REASONS = [
  '0', '5', '6', '8', '9', '10', '12', '14', '16', '18', '19', '20',
  '40', '41', '43', '51', '52', '53', '54', '55', '56', '57', '58',
  '60', '33', '35', '36',
];

function monthsBetween(dateStr, now) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  const months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  return Math.abs(months);
}

function daysBetween(dateStr, now) {
  if (!dateStr) return Infinity;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return Infinity;
  return Math.abs(Math.floor((now - d) / (1000 * 60 * 60 * 24)));
}

function calculateAge(dob) {
  if (!dob) return null;
  const d = new Date(dob);
  if (isNaN(d.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    age--;
  }
  return age;
}

class LenderRuleEngine {
  async getServiceableLenders(pincode) {
    const docs = await PincodeLender.find({ pincode: String(pincode), isServiceable: true }).lean();
    return docs.map(d => d.lenderName);
  }

  async getLenderDetails() {
    const docs = await Lender.find({ isActive: true }).lean();
    const map = {};
    for (const doc of docs) {
      map[doc.name] = {
        name: doc.name,
        display_name: doc.displayName,
        max_loan_amount: doc.maxLoanAmount,
        max_tenure_months: doc.maxTenureMonths,
        min_roi: doc.minRoi,
        is_active: doc.isActive,
        is_fallback: doc.isFallback,
      };
    }
    return map;
  }

  async evaluateApplicant(applicantData) {
    const {
      dateOfBirth,
      employmentStatus,
      grossIncome,
      creditScore,
      pincode,
      bureauData,
    } = applicantData;

    const now = new Date();
    const age = calculateAge(dateOfBirth);
    const empStatus = (employmentStatus || '').toUpperCase();
    const isSalaried = empStatus === 'S' || empStatus === 'SALARIED' || empStatus === 'EMPLOYED';
    const isSelfEmployed = empStatus === 'SE' || empStatus === 'SELF_EMPLOYED' || empStatus === 'SELF-EMPLOYED' || empStatus === 'SELFEMPLOYED' || empStatus === 'BUSINESS';
    const isValidEmployment = isSalaried || isSelfEmployed;
    const income = parseFloat(grossIncome) || 0;
    const score = parseInt(creditScore) || 0;

    const serviceableLenders = await this.getServiceableLenders(pincode);
    const lenderDetails = await this.getLenderDetails();

    const results = {
      eligible: [],
      ineligible: [],
      decisionMode: process.env.DECISION_MODE || 'ECV',
      applicantSummary: {
        age,
        employmentStatus: empStatus,
        isValidEmployment,
        income,
        creditScore: score,
        pincode,
      },
    };

    const lendersToEvaluate = ['Prefr', 'ABFL', 'Hero Fincorp', 'Poonwalla Stpl'];

    for (const lenderName of lendersToEvaluate) {
      const lender = lenderDetails[lenderName];
      if (!lender) continue;

      const isPincodeServiceable = serviceableLenders.includes(lenderName);
      if (!isPincodeServiceable) {
        results.ineligible.push({
          lender: lenderName,
          displayName: lender.display_name,
          reason: 'PIN code not serviceable',
          declineCodes: ['PINCODE'],
        });
        continue;
      }

      const declineReasons = [];
      const declineCodes = [];

      switch (lenderName) {
        case 'Prefr':
          this._evaluatePrefr(age, isValidEmployment, income, score, bureauData, now, declineReasons, declineCodes);
          break;
        case 'ABFL':
          this._evaluateABFL(age, isValidEmployment, income, score, bureauData, now, declineReasons, declineCodes);
          break;
        case 'Hero Fincorp':
          this._evaluateHeroFincorp(age, isValidEmployment, income, score, bureauData, now, declineReasons, declineCodes);
          break;
        case 'Poonwalla Stpl':
          this._evaluatePoonawalla(age, isValidEmployment, income, score, bureauData, now, declineReasons, declineCodes);
          break;
      }

      if (declineReasons.length === 0) {
        results.eligible.push({
          lender: lenderName,
          displayName: lender.display_name,
          maxLoanAmount: parseFloat(lender.max_loan_amount),
          maxTenureMonths: lender.max_tenure_months,
          minRoi: parseFloat(lender.min_roi),
        });
      } else {
        results.ineligible.push({
          lender: lenderName,
          displayName: lender.display_name,
          reason: declineReasons.join('; '),
          declineCodes,
        });
      }
    }

    if (results.eligible.length === 0) {
      const mpokket = lenderDetails['Mpokket'];
      if (mpokket) {
        results.eligible.push({
          lender: 'Mpokket',
          displayName: mpokket.display_name,
          maxLoanAmount: parseFloat(mpokket.max_loan_amount),
          maxTenureMonths: mpokket.max_tenure_months,
          minRoi: parseFloat(mpokket.min_roi),
          isFallback: true,
        });
      }
    }

    return results;
  }

  _evaluatePrefr(age, isValidEmployment, income, score, bureau, now, reasons, codes) {
    if (age !== null && (age < 23 || age > 56)) {
      reasons.push(`Age ${age} not in range 23-56`);
      codes.push('D015');
    }
    if (!isValidEmployment) {
      reasons.push('Employment must be Salaried or Self-Employed');
      codes.push('D008');
    }
    if (income <= 25000) {
      reasons.push(`Income ${income} below minimum 25000`);
      codes.push('D016');
    }
    if (score < 745) {
      reasons.push(`Credit score ${score} below 745 (Experian equivalent of CIBIL 725)`);
      codes.push('D017');
    }
    if (!bureau) return;

    this._checkWriteOffSuitFiled(bureau, reasons, codes, 'D004');
    this._checkDPD30In12Months(bureau, now, reasons, codes, 'D001');
    this._checkDPD60In24Months(bureau, now, reasons, codes, 'D018', false);
    this._checkDPD90In36Months(bureau, now, reasons, codes, 'D019', false);
    this._checkOverdueAmounts(bureau, reasons, codes, 'D005');
    this._checkLatestDPDWith3MonthPayment(bureau, now, reasons, codes, 'D020');
    this._checkUnsecuredLoansOpened6Months(bureau, now, reasons, codes, 'D021');
    this._checkActiveUnsecuredLoans(bureau, now, reasons, codes, 'D022');
    this._checkUnsecuredEnquiries1Month(bureau, now, reasons, codes, 'D023');
    this._checkPLOpened3Months(bureau, now, reasons, codes, 'D024');
    this._checkOpenPLAccounts(bureau, reasons, codes, 'D025');
    this._checkNTC(bureau, reasons, codes, 'D014');
  }

  _evaluateABFL(age, isValidEmployment, income, score, bureau, now, reasons, codes) {
    if (score < 700) {
      reasons.push(`Credit score ${score} below 700`);
      codes.push('D006');
    }
    if (age !== null && (age < 23 || age > 55)) {
      reasons.push(`Age ${age} not in range 23-55`);
      codes.push('D007');
    }
    if (!isValidEmployment) {
      reasons.push('Employment must be Salaried or Self-Employed');
      codes.push('D008');
    }
    if (income < 25000) {
      reasons.push(`Income ${income} below minimum 25000`);
      codes.push('D009');
    }
    if (!bureau) return;

    this._checkDPD30In12Months(bureau, now, reasons, codes, 'D001');
    this._checkDPD60In24Months(bureau, now, reasons, codes, 'D002', true);
    this._checkDPD90In36Months(bureau, now, reasons, codes, 'D003', true);
    this._checkWriteOffSuitFiled(bureau, reasons, codes, 'D004');
    this._checkOverdueAmounts(bureau, reasons, codes, 'D005');
  }

  _evaluateHeroFincorp(age, isValidEmployment, income, score, bureau, now, reasons, codes) {
    if (!isValidEmployment) {
      reasons.push('Employment must be Salaried or Self-Employed');
      codes.push('D008');
    }
    if (age !== null && (age < 21 || age > 58)) {
      reasons.push(`Age ${age} not in range 21-58`);
      codes.push('D010');
    }
    if (income < 15000) {
      reasons.push(`Income ${income} below minimum 15000`);
      codes.push('D011');
    }
    if (score < 725) {
      reasons.push(`Credit score ${score} below 725`);
      codes.push('D012');
    }
    if (!bureau) return;

    this._checkNoDPD3Months(bureau, now, reasons, codes, 'D013');
    this._checkNTC(bureau, reasons, codes, 'D014');
    this._checkActiveLoansCount(bureau, reasons, codes, 'D034');
  }

  _evaluatePoonawalla(age, isValidEmployment, income, score, bureau, now, reasons, codes) {
    if (age !== null && (age < 25 || age > 55)) {
      reasons.push(`Age ${age} not in range 25-55`);
      codes.push('D026');
    }
    if (score < 740) {
      reasons.push(`Credit score ${score} below 740 (Experian equivalent of CIBIL 720)`);
      codes.push('D027');
    }
    if (!bureau) return;

    this._checkMinBureauVintage(bureau, now, reasons, codes, 'D028');
    this._checkNoDPD6Months(bureau, now, reasons, codes, 'D029');
    this._checkDPD30Limit7to12Months(bureau, now, reasons, codes, 'D030');
    this._checkNoDPD90In12Months(bureau, now, reasons, codes, 'D031');
    this._checkWriteOffSuitFiledPoonawalla(bureau, reasons, codes, 'D032');
    this._checkUSLEnquiries3Months(bureau, now, reasons, codes, 'D033');
  }

  _checkWriteOffSuitFiled(bureau, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const swdStatus = String(acct.suitFiledWillfulDefaultWrittenOffStatus || '');
      const suitFiled = String(acct.suitFiledWilfulDefault || '');
      const writtenOff = String(acct.writtenOffSettledStatus || '');

      if (['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'].includes(swdStatus)) {
        reasons.push('Write-off/Suit filed/Wilful defaulter/Settled status found');
        codes.push(code);
        return;
      }
      if (['01', '02', '03'].includes(suitFiled)) {
        reasons.push('Suit filed / Wilful default found');
        codes.push(code);
        return;
      }
      if (['00', '02', '03', '04', '06'].includes(writtenOff)) {
        reasons.push('Written-off/Settled status found');
        codes.push(code);
        return;
      }
    }
  }

  _checkWriteOffSuitFiledPoonawalla(bureau, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const swdStatus = String(acct.suitFiledWillfulDefaultWrittenOffStatus || '');
      if (['00', '01', '02', '03', '04', '05', '06', '07', '08', '09'].includes(swdStatus)) {
        reasons.push('LSS/DBT/Restructured/Write-off/Settled/Legal/SUB status found');
        codes.push(code);
        return;
      }
    }
  }

  _checkDPD30In12Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 12 && (parseInt(h.dpd) || 0) >= 30) {
          reasons.push('DPD >= 30 found in last 12 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkDPD60In24Months(bureau, now, reasons, codes, code, excludeCCKCCGold) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      if (excludeCCKCCGold) {
        const acctType = String(acct.accountType || '');
        if (['10', '36', '07'].includes(acctType)) continue;
      }
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 24 && (parseInt(h.dpd) || 0) >= 60) {
          reasons.push('DPD >= 60 found in last 24 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkDPD90In36Months(bureau, now, reasons, codes, code, excludeCCKCCGold) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      if (excludeCCKCCGold) {
        const acctType = String(acct.accountType || '');
        if (['10', '36', '07'].includes(acctType)) continue;
      }
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 36 && (parseInt(h.dpd) || 0) >= 90) {
          reasons.push('DPD >= 90 found in last 36 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkOverdueAmounts(bureau, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const acctType = String(acct.accountType || '');
      const amountPastDue = parseFloat(acct.amountPastDue) || 0;
      if (acctType === '10' && amountPastDue > 10000) {
        reasons.push(`Overdue amount ${amountPastDue} > 10000 for Credit Card`);
        codes.push(code);
        return;
      }
      if (acctType !== '10' && amountPastDue > 5000) {
        reasons.push(`Overdue amount ${amountPastDue} > 5000 for tradeline`);
        codes.push(code);
        return;
      }
    }
  }

  _checkLatestDPDWith3MonthPayment(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const amountPastDue = parseFloat(acct.amountPastDue) || 0;
      if (amountPastDue <= 0) continue;
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 3 && (parseInt(h.dpd) || 0) > 0) {
          reasons.push('DPD > 0 with overdue > 0 in last 3 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkUnsecuredLoansOpened6Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    let count50k = 0;
    let count10k = 0;

    for (const acct of accounts) {
      const acctType = String(acct.accountType || '');
      if (!UNSECURED_ACCOUNT_TYPES.includes(acctType)) continue;
      const openDate = acct.openDate;
      if (!openDate) continue;
      const months = monthsBetween(openDate, now);
      if (months > 6) continue;
      const currentBalance = parseFloat(acct.currentBalance) || 0;
      if (currentBalance < 5000) continue;
      const loanAmount = parseFloat(acct.highestCreditOrLoanAmount) || 0;
      if (loanAmount >= 50000) count50k++;
      if (loanAmount >= 10000) count10k++;
    }

    if (count50k > 1 || count10k > 2) {
      reasons.push(`Too many unsecured loans opened in last 6 months (>=50K: ${count50k}, >=10K: ${count10k})`);
      codes.push(code);
    }
  }

  _checkActiveUnsecuredLoans(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    let count = 0;
    for (const acct of accounts) {
      const acctType = String(acct.accountType || '');
      if (!UNSECURED_ACCOUNT_TYPES.includes(acctType)) continue;
      if (acct.dateClosed) continue;
      const loanAmount = parseFloat(acct.highestCreditOrLoanAmount) || 0;
      if (loanAmount < 50000) continue;
      const currentBalance = parseFloat(acct.currentBalance) || 0;
      if (currentBalance < 5000) continue;
      const reportDate = acct.dateReported;
      if (reportDate && monthsBetween(reportDate, now) > 6) continue;
      count++;
    }
    if (count > 3) {
      reasons.push(`Active unsecured loans (>=50K) count ${count} exceeds 3`);
      codes.push(code);
    }
  }

  _checkUnsecuredEnquiries1Month(bureau, now, reasons, codes, code) {
    const enquiries = bureau.enquiries || [];
    let count = 0;
    for (const enq of enquiries) {
      const reason = String(enq.enquiryReason || '');
      if (!UNSECURED_ENQUIRY_REASONS.includes(reason)) continue;
      const days = daysBetween(enq.dateOfRequest, now);
      if (days < 30) count++;
    }
    if (count > 5) {
      reasons.push(`Unsecured loan enquiries in last 1 month: ${count} (max 5)`);
      codes.push(code);
    }
  }

  _checkPLOpened3Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    let count = 0;
    for (const acct of accounts) {
      const acctType = String(acct.accountType || '');
      if (acctType !== '05' && acctType !== '5') continue;
      const openDate = acct.openDate;
      if (!openDate) continue;
      const months = monthsBetween(openDate, now);
      if (months > 3) continue;
      const loanAmount = parseFloat(acct.highestCreditOrLoanAmount || acct.creditLimitAmount) || 0;
      if (loanAmount > 50000) count++;
    }
    if (count > 1) {
      reasons.push(`PL > 50K opened in last 3 months: ${count} (max 1)`);
      codes.push(code);
    }
  }

  _checkOpenPLAccounts(bureau, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    let count = 0;
    for (const acct of accounts) {
      const acctType = String(acct.accountType || '');
      if (acctType !== '05' && acctType !== '5') continue;
      if (!acct.dateClosed) count++;
    }
    if (count > 5) {
      reasons.push(`Open PL accounts: ${count} (max 5)`);
      codes.push(code);
    }
  }

  _checkNTC(bureau, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    if (accounts.length === 0) {
      reasons.push('NTC (New To Credit) - no tradelines found');
      codes.push(code);
    }
  }

  _checkNoDPD3Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 3 && (parseInt(h.dpd) || 0) > 0) {
          reasons.push('DPD > 0 found in last 3 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkActiveLoansCount(bureau, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    let count = 0;
    for (const acct of accounts) {
      const acctType = String(acct.accountType || '');
      if (!ALL_LOAN_ACCOUNT_TYPES.includes(acctType)) continue;
      if (!acct.dateClosed) count++;
    }
    if (count > 5) {
      reasons.push(`Active loans count ${count} exceeds 5`);
      codes.push(code);
    }
  }

  _checkMinBureauVintage(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    if (accounts.length === 0) return;
    let oldestOpenDate = null;
    for (const acct of accounts) {
      if (acct.openDate) {
        const d = new Date(acct.openDate);
        if (!isNaN(d.getTime())) {
          if (!oldestOpenDate || d < oldestOpenDate) {
            oldestOpenDate = d;
          }
        }
      }
    }
    if (oldestOpenDate) {
      const vintage = monthsBetween(oldestOpenDate, now);
      if (vintage < 12) {
        reasons.push(`Bureau vintage ${vintage} months, minimum 12 required`);
        codes.push(code);
      }
    }
  }

  _checkNoDPD6Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 6 && (parseInt(h.dpd) || 0) > 0) {
          reasons.push('DPD > 0 found in last 6 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkDPD30Limit7to12Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    let count = 0;
    for (const acct of accounts) {
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        const dpd = parseInt(h.dpd) || 0;
        if (months > 6 && months <= 12 && dpd > 0 && dpd < 30) {
          count++;
        }
      }
    }
    if (count > 2) {
      reasons.push(`DPD (1-30) occurrences in months 7-12: ${count} (max 2)`);
      codes.push(code);
    }
  }

  _checkNoDPD90In12Months(bureau, now, reasons, codes, code) {
    const accounts = bureau.accounts || [];
    for (const acct of accounts) {
      const history = acct.paymentHistory || [];
      for (const h of history) {
        const months = monthsBetween(h.date, now);
        if (months <= 12 && (parseInt(h.dpd) || 0) >= 90) {
          reasons.push('DPD >= 90 found in last 12 months');
          codes.push(code);
          return;
        }
      }
    }
  }

  _checkUSLEnquiries3Months(bureau, now, reasons, codes, code) {
    const enquiries = bureau.enquiries || [];
    let count = 0;
    for (const enq of enquiries) {
      const reason = String(enq.enquiryReason || '');
      if (!UNSECURED_ENQUIRY_REASONS.includes(reason)) continue;
      const months = monthsBetween(enq.dateOfRequest, now);
      if (months <= 3) count++;
    }
    if (count > 6) {
      reasons.push(`USL enquiries in last 3 months: ${count} (max 6)`);
      codes.push(code);
    }
  }
}

export const lenderRuleEngine = new LenderRuleEngine();
