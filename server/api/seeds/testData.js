import mongoose from 'mongoose';
import { Lead } from '../models/Lead.js';
import { Application } from '../models/Application.js';
import { Offer } from '../models/Offer.js';
import { logger } from '../utils/logger.js';

const TEST_IDS = {
  leads: [
    new mongoose.Types.ObjectId('aaa000000000000000000001'),
    new mongoose.Types.ObjectId('aaa000000000000000000002'),
    new mongoose.Types.ObjectId('aaa000000000000000000003'),
    new mongoose.Types.ObjectId('aaa000000000000000000004'),
    new mongoose.Types.ObjectId('aaa000000000000000000005'),
  ],
  apps: [
    new mongoose.Types.ObjectId('bbb000000000000000000001'),
    new mongoose.Types.ObjectId('bbb000000000000000000002'),
    new mongoose.Types.ObjectId('bbb000000000000000000003'),
    new mongoose.Types.ObjectId('bbb000000000000000000004'),
    new mongoose.Types.ObjectId('bbb000000000000000000005'),
  ],
};

const TEST_LEADS = [
  { _id: TEST_IDS.leads[0], formType: 'form1', firstName: 'Rahul', lastName: 'Sharma', email: 'rahul.sharma@test.com', phone: '9876543210', employmentStatus: 'employed', monthlyIncome: 85000, loanAmount: 500000, status: 'application_created' },
  { _id: TEST_IDS.leads[1], formType: 'form1', firstName: 'Priya', lastName: 'Patel', email: 'priya.patel@test.com', phone: '9876543211', employmentStatus: 'self-employed', monthlyIncome: 120000, loanAmount: 300000, status: 'application_created' },
  { _id: TEST_IDS.leads[2], formType: 'form2', firstName: 'Amit', lastName: 'Kumar', email: 'amit.kumar@test.com', phone: '9876543212', employmentStatus: 'employed', monthlyIncome: 45000, loanAmount: 200000, status: 'application_created' },
  { _id: TEST_IDS.leads[3], formType: 'form1', firstName: 'Deepika', lastName: 'Reddy', email: 'deepika.reddy@test.com', phone: '9876543213', employmentStatus: 'employed', monthlyIncome: 150000, loanAmount: 1000000, status: 'application_created' },
  { _id: TEST_IDS.leads[4], formType: 'form3', firstName: 'Vikram', lastName: 'Singh', email: 'vikram.singh@test.com', phone: '9876543214', employmentStatus: 'employed', monthlyIncome: 65000, loanAmount: 400000, status: 'application_created' },
];

const TEST_APPLICATIONS = [
  { _id: TEST_IDS.apps[0], leadId: TEST_IDS.leads[0], applicationNumber: 'TEST-MULTI-001', status: 'offers_available' },
  { _id: TEST_IDS.apps[1], leadId: TEST_IDS.leads[1], applicationNumber: 'TEST-SINGLE-002', status: 'offers_available' },
  { _id: TEST_IDS.apps[2], leadId: TEST_IDS.leads[2], applicationNumber: 'TEST-EMPTY-003', status: 'bre_completed' },
  { _id: TEST_IDS.apps[3], leadId: TEST_IDS.leads[3], applicationNumber: 'TEST-MANY-004', status: 'offers_available' },
  { _id: TEST_IDS.apps[4], leadId: TEST_IDS.leads[4], applicationNumber: 'TEST-MIXED-005', status: 'offers_available' },
];

const TEST_OFFERS = [
  { applicationId: TEST_IDS.apps[0], lenderId: 'HDFC-001', lenderName: 'HDFC Bank', loanAmount: 500000, interestRate: 10.5, termMonths: 36, monthlyPayment: 16215, apr: 10.5, offerType: 'pre-approved', status: 'available', offerData: { features: ['No processing fee', 'Quick disbursal', 'Flexible tenure'] } },
  { applicationId: TEST_IDS.apps[0], lenderId: 'ICICI-001', lenderName: 'ICICI Bank', loanAmount: 480000, interestRate: 11.0, termMonths: 48, monthlyPayment: 12440, apr: 11.0, offerType: 'standard', status: 'available', offerData: { features: ['Zero foreclosure charges', 'Online tracking'] } },
  { applicationId: TEST_IDS.apps[0], lenderId: 'SBI-001', lenderName: 'State Bank of India', loanAmount: 500000, interestRate: 9.8, termMonths: 60, monthlyPayment: 10560, apr: 9.8, offerType: 'conditional', status: 'available', offerData: { features: ['Lowest EMI', 'Government backed', 'No hidden charges'] } },

  { applicationId: TEST_IDS.apps[1], lenderId: 'AXIS-001', lenderName: 'Axis Bank', loanAmount: 300000, interestRate: 11.5, termMonths: 24, monthlyPayment: 14050, apr: 11.5, offerType: 'pre-approved', status: 'available', offerData: { features: ['Instant approval', 'Minimal documentation'] } },

  { applicationId: TEST_IDS.apps[3], lenderId: 'HDFC-002', lenderName: 'HDFC Bank', loanAmount: 1000000, interestRate: 9.5, termMonths: 60, monthlyPayment: 20980, apr: 9.5, offerType: 'pre-approved', status: 'available', offerData: { features: ['Premium customer rate', 'Dedicated RM', 'Priority processing'] } },
  { applicationId: TEST_IDS.apps[3], lenderId: 'ICICI-002', lenderName: 'ICICI Bank', loanAmount: 950000, interestRate: 10.0, termMonths: 48, monthlyPayment: 24090, apr: 10.0, offerType: 'standard', status: 'available', offerData: { features: ['Cashback offer', 'Online management'] } },
  { applicationId: TEST_IDS.apps[3], lenderId: 'SBI-002', lenderName: 'State Bank of India', loanAmount: 1000000, interestRate: 9.2, termMonths: 72, monthlyPayment: 17750, apr: 9.2, offerType: 'conditional', status: 'available', offerData: { features: ['Longest tenure', 'Lowest rate', 'Government backed'] } },
  { applicationId: TEST_IDS.apps[3], lenderId: 'KOTAK-001', lenderName: 'Kotak Mahindra Bank', loanAmount: 900000, interestRate: 10.8, termMonths: 36, monthlyPayment: 29300, apr: 10.8, offerType: 'standard', status: 'available', offerData: { features: ['Fast processing', 'Digital journey'] } },
  { applicationId: TEST_IDS.apps[3], lenderId: 'BAJAJ-001', lenderName: 'Bajaj Finserv', loanAmount: 800000, interestRate: 12.0, termMonths: 48, monthlyPayment: 21070, apr: 12.0, offerType: 'standard', status: 'available', offerData: { features: ['Flexi loan option', 'Part-payment allowed'] } },
  { applicationId: TEST_IDS.apps[3], lenderId: 'TATA-001', lenderName: 'Tata Capital', loanAmount: 750000, interestRate: 11.5, termMonths: 36, monthlyPayment: 24720, apr: 11.5, offerType: 'conditional', status: 'available', offerData: { features: ['Doorstep service', 'Quick disbursal'] } },
  { applicationId: TEST_IDS.apps[3], lenderId: 'YES-001', lenderName: 'Yes Bank', loanAmount: 850000, interestRate: 10.5, termMonths: 60, monthlyPayment: 18290, apr: 10.5, offerType: 'pre-approved', status: 'available', offerData: { features: ['Balance transfer option', 'Top-up facility'] } },

  { applicationId: TEST_IDS.apps[4], lenderId: 'HDFC-003', lenderName: 'HDFC Bank', loanAmount: 400000, interestRate: 10.0, termMonths: 36, monthlyPayment: 12903, apr: 10.0, offerType: 'pre-approved', status: 'available', offerData: { features: ['Salary account benefit', 'Insurance included'] } },
  { applicationId: TEST_IDS.apps[4], lenderId: 'NBFC-001', lenderName: 'Muthoot Finance', loanAmount: 350000, interestRate: 14.5, termMonths: 24, monthlyPayment: 16900, apr: 14.5, offerType: 'standard', status: 'available', offerData: { features: ['Gold loan option', 'Same day disbursal'] } },
  { applicationId: TEST_IDS.apps[4], lenderId: 'PEER-001', lenderName: 'LendingKart', loanAmount: 250000, interestRate: 16.0, termMonths: 12, monthlyPayment: 22650, apr: 16.0, offerType: 'conditional', status: 'available', offerData: { features: ['No collateral', 'Business loan', 'Flexible repayment'] } },
];

export const VARIANT_INFO = [
  { id: TEST_IDS.apps[0].toString(), label: 'Multiple Offers', description: '3 offers from major banks (HDFC, ICICI, SBI) with different rates and tenures', scenario: 'happy_path', offerCount: 3, phone: '9876543210' },
  { id: TEST_IDS.apps[1].toString(), label: 'Single Offer', description: '1 pre-approved offer from Axis Bank — minimal case', scenario: 'single', offerCount: 1, phone: '9876543211' },
  { id: TEST_IDS.apps[2].toString(), label: 'No Offers', description: 'Application processed but no offers generated — empty state', scenario: 'empty', offerCount: 0, phone: '9876543212' },
  { id: TEST_IDS.apps[3].toString(), label: 'Many Offers', description: '7 offers from banks and NBFCs — stress test with scrolling', scenario: 'stress', offerCount: 7, phone: '9876543213' },
  { id: TEST_IDS.apps[4].toString(), label: 'Mixed Types', description: '3 offers: pre-approved, standard, and conditional from different lender types', scenario: 'mixed', offerCount: 3, phone: '9876543214' },
];

export async function seedTestData() {
  try {
    const existingApp = await Application.findById(TEST_IDS.apps[0]);
    if (existingApp) {
      logger.info('Test seed data already exists, skipping seed');
      return VARIANT_INFO;
    }

    for (const lead of TEST_LEADS) {
      await Lead.findOneAndUpdate(
        { _id: lead._id },
        lead,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    logger.info(`Seeded ${TEST_LEADS.length} test leads`);

    for (const app of TEST_APPLICATIONS) {
      await Application.findOneAndUpdate(
        { _id: app._id },
        app,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }
    logger.info(`Seeded ${TEST_APPLICATIONS.length} test applications`);

    const testAppIds = TEST_IDS.apps;
    await Offer.deleteMany({ applicationId: { $in: testAppIds } });
    for (const offer of TEST_OFFERS) {
      await Offer.create(offer);
    }
    logger.info(`Seeded ${TEST_OFFERS.length} test offers`);

    logger.info('Test seed data created successfully', {
      variants: VARIANT_INFO.map(v => `${v.label} (${v.id})`),
    });

    return VARIANT_INFO;
  } catch (error) {
    logger.error('Failed to seed test data', { error: error.message, stack: error.stack });
    throw error;
  }
}
