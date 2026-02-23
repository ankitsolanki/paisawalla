import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import PincodeLender from '../models/PincodeLender.js';
import Lender from '../models/Lender.js';
import LenderRule from '../models/LenderRule.js';
import { logger } from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSETS_DIR = path.resolve(__dirname, '../../../../attached_assets');

function parseCSV(content) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length === 0) return [];
  const headers = parseCSVLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => {
      obj[h.trim()] = (values[i] || '').trim();
    });
    return obj;
  });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseLoanAmount(str) {
  if (!str) return 0;
  const lower = str.toLowerCase().replace(/,/g, '');
  const match = lower.match(/([\d.]+)\s*lac/i);
  if (match) return parseFloat(match[1]) * 100000;
  const numMatch = lower.match(/([\d.]+)/);
  if (numMatch) return parseFloat(numMatch[1]);
  return 0;
}

function parseTenureMonths(str) {
  if (!str) return 0;
  const monthMatch = str.match(/([\d]+)\s*month/i);
  if (monthMatch) return parseInt(monthMatch[1]);
  const numMatch = str.match(/([\d]+)/);
  if (numMatch) return parseInt(numMatch[1]);
  return 0;
}

function parseROI(str) {
  if (!str) return 0;
  const match = str.match(/([\d.]+)%/);
  if (match) return parseFloat(match[1]);
  const numMatch = str.match(/([\d.]+)/);
  if (numMatch) return parseFloat(numMatch[1]);
  return 0;
}

async function seedPincodes() {
  const filePath = path.join(ASSETS_DIR, 'pincode.csv');
  if (!fs.existsSync(filePath)) {
    throw new Error('Pincode CSV file not found');
  }
  return seedPincodesFromFile(filePath);
}

async function seedPincodesFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const rows = parseCSV(content);

  logger.info(`Parsed ${rows.length} pincode rows`);

  await PincodeLender.deleteMany({});

  const lenderColumns = ['Prefr', 'ABFL', 'Hero Fincorp', 'Poonwalla Stpl'];
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const docs = [];

    for (const row of batch) {
      const pincode = row['Pincode'];
      if (!pincode) continue;

      for (const lender of lenderColumns) {
        const isServiceable = (row[lender] || '').toLowerCase() === 'yes';
        if (isServiceable) {
          docs.push({
            pincode: String(pincode),
            lenderName: lender,
            isServiceable: true,
          });
        }
      }
    }

    if (docs.length > 0) {
      await PincodeLender.insertMany(docs, { ordered: false }).catch(err => {
        if (err.code !== 11000) throw err;
      });
      inserted += docs.length;
    }

    if ((i + BATCH_SIZE) % 5000 === 0 || i + BATCH_SIZE >= rows.length) {
      logger.info(`Pincode progress: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length} rows processed, ${inserted} records inserted`);
    }
  }

  logger.info(`Pincode seeding complete: ${inserted} records`);
}

async function seedLenders() {
  await Lender.deleteMany({});

  const lenders = [
    { name: 'Prefr', displayName: 'Prefr', maxLoanAmount: 500000, maxTenureMonths: 48, minRoi: 17.99, isActive: true, isFallback: false },
    { name: 'ABFL', displayName: 'Aditya Birla Finance', maxLoanAmount: 600000, maxTenureMonths: 60, minRoi: 16, isActive: true, isFallback: false },
    { name: 'Hero Fincorp', displayName: 'Hero FinCorp', maxLoanAmount: 500000, maxTenureMonths: 36, minRoi: 19, isActive: true, isFallback: false },
    { name: 'Poonwalla Stpl', displayName: 'Poonawalla Fincorp', maxLoanAmount: 500000, maxTenureMonths: 36, minRoi: 11.5, isActive: true, isFallback: false },
    { name: 'Mpokket', displayName: 'Mpokket', maxLoanAmount: 30000, maxTenureMonths: 12, minRoi: 24, isActive: true, isFallback: true },
  ];

  await Lender.insertMany(lenders);
  logger.info(`Seeded ${lenders.length} lenders`);
}

async function seedLenderRules() {
  await LenderRule.deleteMany({});

  const lenderFiles = [
    { file: 'Prefr_1771495415954.csv', lender: 'Prefr' },
    { file: 'ABFL_1771495415955.csv', lender: 'ABFL' },
    { file: 'HeroFincorp_1771495415955.csv', lender: 'Hero Fincorp' },
    { file: 'Poonawalla_1771495415955.csv', lender: 'Poonwalla Stpl' },
  ];

  for (const { file, lender } of lenderFiles) {
    const filePath = path.join(ASSETS_DIR, file);
    if (!fs.existsSync(filePath)) {
      logger.warn(`CSV file not found for ${lender}, skipping rules`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rows = parseCSV(content);

    logger.info(`Seeding ${rows.length} rules for ${lender}`);

    const docs = rows.map(row => {
      const srNoParsed = parseInt(row['Sr. No.'] || '0', 10);
      return {
        lenderName: lender,
        srNo: isNaN(srNoParsed) ? 0 : srNoParsed,
        creditRule: (row['Credit Rule'] || '').trim(),
        logicalDescription: (row['Logical Description'] || '').trim(),
        policyCode: (row['Policy Code'] || '').trim(),
        decision: (row['Decision'] || '').trim(),
        ruleConfig: {
          logicalDescription: (row['Logical Description'] || '').trim(),
          experianLogic: (row['Experian Logic'] || '').trim(),
          policyCode: (row['Policy Code'] || '').trim(),
          lenderName: lender,
        },
      };
    });

    if (docs.length > 0) {
      await LenderRule.insertMany(docs);
    }

    logger.info(`${lender}: ${docs.length} rules seeded`);
  }
}

export async function seedAllLenderData() {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn('MongoDB not connected, skipping lender data seeding');
      return;
    }

    logger.info('Starting lender data seeding to MongoDB...');
    await seedLenders();
    await seedPincodes();
    await seedLenderRules();

    const pinCount = await PincodeLender.countDocuments();
    const lenderCount = await Lender.countDocuments();
    const ruleCount = await LenderRule.countDocuments();
    logger.info(`Lender seeding complete: ${lenderCount} lenders, ${pinCount} pincode records, ${ruleCount} rules`);
  } catch (err) {
    logger.error('Lender data seeding failed', { error: err.message, stack: err.stack });
    throw err;
  }
}

if (process.argv[1] && process.argv[1].includes('seedLenderData')) {
  import('../config/env.js').then(({ env }) => {
    import('../config/db.js').then(({ connectDB }) => {
      connectDB().then(() => {
        seedAllLenderData().then(() => {
          logger.info('Standalone seeding complete');
          process.exit(0);
        }).catch(err => {
          logger.error('Standalone seeding failed', { error: err.message });
          process.exit(1);
        });
      });
    });
  });
}
