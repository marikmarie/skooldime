import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { 
  User, Student, Parent, School, Vendor, Wallet, 
  Transaction, LoanProduct, Loan, CatalogItem, AuditLog, CreditScore 
} from './types';

// Database file path
const DB_FILE = path.join(process.cwd(), 'db.json');

// Helper to generate reference codes
function generateRef(type: string): string {
  return `${type}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
}

// Initial Database Structure
const initialDb = {
  users: [
    { id: 'u_admin', username: 'superadmin', role: 'SUPER_ADMIN', name: 'Alinda Robert (HQ)', phone: '+256770000000', email: 'admin@edutechmoney.ug' },
    { id: 'u_b_admin', username: 'central_admin', role: 'BUSINESS_ADMIN', name: 'Nakimbugwe Stella', phone: '+256771111222', email: 'stella@edutechmoney.ug' },
    { id: 'u_agent', username: 'agent_peter', role: 'AGENT', name: 'Peter Ssekabira', phone: '+256782555666' },
    { id: 'u_school', username: 'kps_bursar', role: 'SCHOOL_ADMIN', name: 'Kato Charles (Bursar)', phone: '+256773888999', schoolId: 'S1' },
    { id: 'u_vendor1', username: 'kps_canteen', role: 'VENDOR', name: 'Mama Betty Canteen', phone: '+256771000111', schoolId: 'S1' },
    { id: 'u_parent1', username: 'moses_parent', role: 'PARENT', name: 'Moses Mukasa', phone: '+256772444555' }
  ] as User[],
  schools: [
    { id: 'S1', name: 'Kampala Parents Primary School', region: 'Central Kampala', code: 'KPS01', commissionRate: 1 },
    { id: 'S2', name: 'Gayaza High School', region: 'Wakiso District', code: 'GHS02', commissionRate: 1 }
  ] as School[],
  vendors: [
    { id: 'V1', name: 'Mama Betty Canteen', schoolId: 'S1', phone: '+256771000111', type: 'CANTEEN', commissionRate: 99, deviceBound: true, fingerprint: 'device-fingerprint-123' },
    { id: 'V2', name: 'Gayaza Central Bookshop', schoolId: 'S2', phone: '+256772222333', type: 'BOOKSHOP', commissionRate: 99, deviceBound: false }
  ] as Vendor[],
  parents: [
    { id: 'P1', name: 'Moses Mukasa', phone: '+256772444555', nin: 'CM89021102A12', kycTier: 2, walletBalance: 350000 },
    { id: 'P2', name: 'Sarah Namubiru', phone: '+256782111222', nin: 'CF92015562B34', kycTier: 1, walletBalance: 80000 }
  ] as Parent[],
  students: [
    { id: 'ST1', schoolId: 'S1', name: 'Brian Mukasa', admissionNo: 'KPS-2026-004', class: 'Primary 5', qrHash: 'ST1_QR_9812', pin: '1234', parentPhone: '+256772444555', isLinked: true, avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120', noPinLimit: 5000 },
    { id: 'ST2', schoolId: 'S1', name: 'Patricia Mukasa', admissionNo: 'KPS-2026-005', class: 'Primary 3', qrHash: 'ST2_QR_4321', pin: '5678', parentPhone: '+256772444555', isLinked: true, avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120', noPinLimit: 2000 }
  ] as Student[],
  wallets: [
    { id: 'W_P1', ownerId: 'P1', ownerType: 'PARENT', balance: 350000, status: 'ACTIVE', lastTransactionDate: '2026-06-22T14:30:00Z' },
    { id: 'W_P2', ownerId: 'P2', ownerType: 'PARENT', balance: 80000, status: 'ACTIVE', lastTransactionDate: '2026-06-21T10:15:00Z' },
    { id: 'W_ST1', ownerId: 'ST1', ownerType: 'STUDENT', balance: 12000, status: 'ACTIVE', lastTransactionDate: '2026-06-23T08:00:00Z' },
    { id: 'W_ST2', ownerId: 'ST2', ownerType: 'STUDENT', balance: 4500, status: 'ACTIVE', lastTransactionDate: '2026-06-23T08:12:00Z' },
    { id: 'W_V1', ownerId: 'V1', ownerType: 'VENDOR', balance: 180000, status: 'ACTIVE', lastTransactionDate: '2026-06-23T09:30:00Z' },
    { id: 'W_V2', ownerId: 'V2', ownerType: 'VENDOR', balance: 0, status: 'ACTIVE', lastTransactionDate: '2026-06-20T17:45:00Z' },
    { id: 'W_S1', ownerId: 'S1', ownerType: 'SCHOOL', balance: 15000, status: 'ACTIVE', lastTransactionDate: '2026-06-23T09:30:00Z' },
    { id: 'W_S2', ownerId: 'S2', ownerType: 'SCHOOL', balance: 0, status: 'ACTIVE', lastTransactionDate: '2026-06-20T17:45:00Z' },
    { id: 'W_PLAT', ownerId: 'PLAT', ownerType: 'PLATFORM', balance: 3200, status: 'ACTIVE', lastTransactionDate: '2026-06-23T09:30:00Z' }
  ] as Wallet[],
  transactions: [
    { id: 'tx1', referenceCode: 'TXN-DEP-883A', senderWalletId: 'MOMO-AIRTEL', receiverWalletId: 'W_P1', amount: 400000, fee: 1500, type: 'DEPOSIT', status: 'SUCCESS', description: 'Collecto Top-Up Mobile Money Deposit', createdAt: '2026-06-22T14:30:00Z' },
    { id: 'tx2', referenceCode: 'TXN-ALL-99A1', senderWalletId: 'W_P1', receiverWalletId: 'W_ST1', amount: 15000, fee: 0, type: 'DEPOSIT', status: 'SUCCESS', description: 'Pocket Money Allocation', createdAt: '2026-06-23T08:00:00Z' },
    { id: 'tx3', referenceCode: 'TXN-POS-4412', senderWalletId: 'W_ST1', receiverWalletId: 'W_V1', amount: 2000, fee: 20, type: 'SPEND', status: 'SUCCESS', description: 'Bought 2 Chapatis at Mama Betty', createdAt: '2026-06-23T09:30:00Z' }
  ] as Transaction[],
  loanProducts: [
    { id: 'LP1', name: 'Vendor Restock Advance', description: 'Fast short-term capital to purchase canteen inventory. Repaid via auto-splits on sales.', minAmount: 50000, maxAmount: 300000, interestRate: 5, durationDays: 14, targetRole: 'VENDOR' },
    { id: 'LP2', name: 'Staff Emergency Float', description: 'Instant salary advance for school teachers & support staff.', minAmount: 100000, maxAmount: 1000000, interestRate: 7, durationDays: 30, targetRole: 'STAFF' },
    { id: 'LP3', name: 'Parent Fees Micro-Credit', description: 'Emergency school fees support to keep students in class.', minAmount: 50000, maxAmount: 500000, interestRate: 6, durationDays: 21, targetRole: 'PARENT' }
  ] as LoanProduct[],
  loans: [] as Loan[],
  catalogItems: [
    { id: 'c1', vendorId: 'V1', name: 'Rolex (Egg + Chapati)', price: 2000, usageCount: 65, category: 'FOOD' },
    { id: 'c2', vendorId: 'V1', name: 'Samosa (Meat)', price: 1000, usageCount: 42, category: 'FOOD' },
    { id: 'c3', vendorId: 'V1', name: 'Baking Book', price: 4000, usageCount: 15, category: 'STATIONERY' },
    { id: 'c4', vendorId: 'V1', name: 'School Pencil', price: 500, usageCount: 88, category: 'STATIONERY' },
    { id: 'c5', vendorId: 'V1', name: 'Mineral Water', price: 1000, usageCount: 30, category: 'FOOD' }
  ] as CatalogItem[],
  auditLogs: [
    { id: 'a1', userId: 'u_admin', userName: 'Alinda Robert', role: 'SUPER_ADMIN', action: 'SYSTEM_INITIALIZATION', ipAddress: '127.0.0.1', createdAt: '2026-06-23T06:00:00Z' }
  ] as AuditLog[],
  creditScores: [
    { id: 'cs1', ownerId: 'V1', score: 82, factors: { txCount30Days: 142, depositFrequency: 0, repaymentHistory: 'Excellent POS consistency' } },
    { id: 'cs2', ownerId: 'P1', score: 75, factors: { txCount30Days: 12, depositFrequency: 4, repaymentHistory: 'Consistent Top-ups' } }
  ] as CreditScore[],
  globalLoansEnabled: true
};

// Ensure database file exists
function loadDb(): typeof initialDb {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf-8');
      return initialDb;
    }
    const content = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    console.error('Error loading DB, returning memory initialDb:', e);
    return initialDb;
  }
}

function saveDb(data: typeof initialDb) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving DB:', e);
  }
}

// Global state instance
let db = loadDb();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middlewares
  app.use(express.json());

  // Log auditing helper
  const audit = (userId: string, userName: string, role: string, action: string, oldVal?: any, newVal?: any) => {
    const newLog: AuditLog = {
      id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId,
      userName,
      role: role as any,
      action,
      ipAddress: '127.0.0.1',
      oldValues: oldVal ? JSON.stringify(oldVal) : undefined,
      newValues: newVal ? JSON.stringify(newVal) : undefined,
      createdAt: new Date().toISOString()
    };
    db.auditLogs.unshift(newLog);
    if (db.auditLogs.length > 300) db.auditLogs.pop();
    saveDb(db);
  };

  // ----------------------------------------------------
  // SYSTEM & AUTH API
  // ----------------------------------------------------
  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', platform: 'EduTechMoney', timestamp: new Date() });
  });

  app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    // Simple matching for our seed users
    const user = db.users.find(u => u.username === username);
    if (user) {
      // In practice, check bcrypt password. Here we simulate success.
      return res.json({ success: true, user });
    }
    return res.status(401).json({ success: false, error: 'Invalid username or password.' });
  });
  app.get('/api/audit-logs', (req, res) => {
    res.json(db.auditLogs);
  });

  app.post('/api/setup/reset', (req, res) => {
    db = JSON.parse(JSON.stringify(initialDb));
    saveDb(db);
    audit('SYSTEM', 'System Daemon', 'SUPER_ADMIN', 'DATABASE_HARD_RESET');
    res.json({ success: true, message: 'Database reset to default template state.' });
  });

  app.get('/api/schools', (req, res) => {
    res.json(db.schools);
  });

  app.get('/api/vendors', (req, res) => {
    res.json(db.vendors);
  });

  app.get('/api/parents', (req, res) => {
    res.json(db.parents);
  });

  app.get('/api/students', (req, res) => {
    res.json(db.students);
  });

  // ----------------------------------------------------
  // IDENTITY & BULK UPLOAD ENGINE (3.1)
  // ----------------------------------------------------
  app.post('/api/students/bulk-upload', (req, res) => {
    const { rows, agentId, agentName } = req.body; // Array of student entries
    if (!rows || !Array.isArray(rows)) {
      return res.status(400).json({ success: false, error: 'Invalid CSV list payload.' });
    }

    const addedStudents: Student[] = [];
    let updatedCount = 0;
    let addedCount = 0;

    for (const row of rows) {
      // Keys: schoolId, admissionNo, name, class, parentName, parentPhone, parentNin
      const { schoolId, admissionNo, name, class: className, parentName, parentPhone, parentNin } = row;
      if (!schoolId || !admissionNo || !name || !parentPhone) continue;

      // 1. Process Parent Link
      let parent = db.parents.find(p => p.phone === parentPhone);
      if (!parent) {
        parent = {
          id: `P_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
          name: parentName || 'Unknown Guardian',
          phone: parentPhone,
          nin: parentNin || '',
          kycTier: parentNin ? 2 : 1,
          walletBalance: 0
        };
        db.parents.push(parent);
        
        // Create Parent Wallet
        db.wallets.push({
          id: `W_${parent.id}`,
          ownerId: parent.id,
          ownerType: 'PARENT',
          balance: 0,
          status: 'ACTIVE',
          lastTransactionDate: new Date().toISOString()
        });
        addedCount++;
      } else if (parentNin && parentNin !== parent.nin) {
        parent.nin = parentNin;
        parent.kycTier = 2;
        updatedCount++;
      }

      // 2. Process Student Link
      let student = db.students.find(s => s.schoolId === schoolId && s.admissionNo === admissionNo);
      if (!student) {
        student = {
          id: `ST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          schoolId,
          name,
          admissionNo,
          class: className || 'Unassigned',
          qrHash: `ST_QR_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          pin: '0000', // Default PIN must be reset
          parentPhone,
          isLinked: true,
          avatarUrl: `https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120`,
          noPinLimit: 2000
        };
        db.students.push(student);

        // Create student wallet
        db.wallets.push({
          id: `W_${student.id}`,
          ownerId: student.id,
          ownerType: 'STUDENT',
          balance: 0,
          status: 'ACTIVE',
          lastTransactionDate: new Date().toISOString()
        });
        addedStudents.push(student);
      } else {
        student.name = name;
        student.class = className || student.class;
        student.parentPhone = parentPhone;
      }
    }

    saveDb(db);
    audit(agentId || 'AGENT', agentName || 'Field Agent', 'AGENT', 'BULK_CSV_STUDENT_IMPORT', null, { addedStudentsCount: addedStudents.length });
    
    res.json({
      success: true,
      message: `Bulk sync complete. Loaded parent structures. Processed ${addedStudents.length} new student entries.`,
      addedCount,
      updatedCount
    });
  });

  // Reset Student PIN
  app.post('/api/students/reset-pin', (req, res) => {
    const { studentId, newPin, parentPhone } = req.body;
    if (!studentId || !newPin || newPin.length !== 4) {
      return res.status(400).json({ success: false, error: 'PIN must be exactly 4 digits.' });
    }

    const student = db.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }

    const oldPin = student.pin;
    student.pin = newPin;
    saveDb(db);

    audit('PARENT', `Parent linked to ${student.name}`, 'PARENT', 'RESET_STUDENT_PIN', { student: student.name, oldPin: '****' }, { newPin: '****' });
    res.json({ success: true, message: `PIN reset successfully. SMS notifications sent to ${student.parentPhone}.` });
  });

  // Configure No-PIN Limit
  app.post('/api/students/limit', (req, res) => {
    const { studentId, limit } = req.body;
    const student = db.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Student not found.' });
    }
    const oldLimit = student.noPinLimit;
    student.noPinLimit = Number(limit);
    saveDb(db);

    audit('PARENT', `Parent`, 'PARENT', 'SET_STUDENT_SPEND_LIMIT', { name: student.name, oldLimit }, { newLimit: limit });
    res.json({ success: true, message: `Pocket money transaction limit updated to ${Number(limit).toLocaleString()} UGX.` });
  });

  // Parent allocate pocket money
  app.post('/api/parents/allocate', (req, res) => {
    const { parentPhone, studentId, amount } = req.body;
    const numericAmount = Number(amount);
    if (numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Allocation amount must be greater than zero.' });
    }

    const parent = db.parents.find(p => p.phone === parentPhone);
    const student = db.students.find(s => s.id === studentId);

    if (!parent || !student) {
      return res.status(404).json({ success: false, error: 'Parent or Student index not found.' });
    }

    const parentWallet = db.wallets.find(w => w.ownerId === parent.id && w.ownerType === 'PARENT');
    const studentWallet = db.wallets.find(w => w.ownerId === student.id && w.ownerType === 'STUDENT');

    if (!parentWallet || !studentWallet) {
      return res.status(404).json({ success: false, error: 'Ledger wallets missing.' });
    }

    if (parentWallet.balance < numericAmount) {
      return res.status(400).json({ success: false, error: 'Insufficient Parent wallet balance. Please Top Up.' });
    }

    // Process Ledger Update inside transactions (ACID Compliance emulation)
    try {
      parentWallet.balance -= numericAmount;
      studentWallet.balance += numericAmount;
      parentWallet.lastTransactionDate = new Date().toISOString();
      studentWallet.lastTransactionDate = new Date().toISOString();

      // Log transaction
      const refCode = generateRef('TXN');
      db.transactions.push({
        id: `tx_${Date.now()}`,
        referenceCode: refCode,
        senderWalletId: parentWallet.id,
        receiverWalletId: studentWallet.id,
        amount: numericAmount,
        fee: 0,
        type: 'DEPOSIT',
        status: 'SUCCESS',
        description: `Pocket Money Allocated to ${student.name}`,
        createdAt: new Date().toISOString()
      });

      saveDb(db);
      audit('PARENT', parent.name, 'PARENT', 'ALLOCATE_POCKET_MONEY', null, { student: student.name, amount: numericAmount });

      res.json({ success: true, message: `Transferred ${numericAmount.toLocaleString()} UGX safely to ${student.name}.` });
    } catch (e: any) {
      res.status(500).json({ success: false, error: `Transactional failure: ${e.message}` });
    }
  });

  // ----------------------------------------------------
  // DYNAMIC POS & QR CASHIER WORKFLOW (3.3)
  // ----------------------------------------------------
  app.get('/api/pos/scan/:qrHash', (req, res) => {
    const { qrHash } = req.params;
    const student = db.students.find(s => s.qrHash === qrHash);
    if (!student) {
      return res.status(404).json({ success: false, error: 'Unknown QR card. Student registry match failed.' });
    }

    const wallet = db.wallets.find(w => w.ownerId === student.id && w.ownerType === 'STUDENT');
    res.json({
      success: true,
      student: {
        id: student.id,
        name: student.name,
        class: student.class,
        avatarUrl: student.avatarUrl,
        noPinLimit: student.noPinLimit,
        balance: wallet ? wallet.balance : 0
      }
    });
  });

  app.post('/api/pos/checkout', (req, res) => {
    const { studentId, vendorId, items, total, pin } = req.body;
    const checkoutTotal = Number(total);

    const student = db.students.find(s => s.id === studentId);
    const vendor = db.vendors.find(v => v.id === vendorId);

    if (!student || !vendor) {
      return res.status(404).json({ success: false, error: 'Required merchant or student nodes not found.' });
    }

    const studentWallet = db.wallets.find(w => w.ownerId === student.id && w.ownerType === 'STUDENT');
    const vendorWallet = db.wallets.find(w => w.ownerId === vendor.id && w.ownerType === 'VENDOR');
    const school = db.schools.find(s => s.id === vendor.schoolId);
    const schoolWallet = school ? db.wallets.find(w => w.ownerId === school.id && w.ownerType === 'SCHOOL') : null;
    const platformWallet = db.wallets.find(w => w.ownerType === 'PLATFORM');

    if (!studentWallet || !vendorWallet) {
      return res.status(404).json({ success: false, error: 'Transactional wallets missing.' });
    }

    if (studentWallet.status !== 'ACTIVE') {
      return res.status(400).json({ success: false, error: 'Student wallet is inactive or suspended.' });
    }

    if (studentWallet.balance < checkoutTotal) {
      return res.status(400).json({ success: false, error: `Insufficient pocket money balance. Card holds ${studentWallet.balance.toLocaleString()} UGX.` });
    }

    // Dynamic PIN verification
    if (checkoutTotal > student.noPinLimit) {
      if (!pin) {
        return res.status(400).json({ success: false, pinRequired: true, error: 'Transaction exceeds standard daily PIN-less limit. PIN required.' });
      }
      if (student.pin !== pin) {
        return res.status(400).json({ success: false, error: 'Invalid Student PIN code. Transaction unauthorized.' });
      }
    }

    // Process Transaction with split commission calculation (Section 4.2)
    try {
      const schoolCommRate = school ? school.commissionRate : 1; // e.g. 1%
      const platformCommRate = 0.5; // Fixed 0.5%
      
      const schoolPart = Math.floor((checkoutTotal * schoolCommRate) / 100);
      const platformPart = Math.floor((checkoutTotal * platformCommRate) / 100);
      const vendorPart = checkoutTotal - schoolPart - platformPart;

      // ACID Balance mutations
      studentWallet.balance -= checkoutTotal;
      vendorWallet.balance += vendorPart;
      
      if (schoolWallet && schoolPart > 0) {
        schoolWallet.balance += schoolPart;
        schoolWallet.lastTransactionDate = new Date().toISOString();
      }
      if (platformWallet && platformPart > 0) {
        platformWallet.balance += platformPart;
        platformWallet.lastTransactionDate = new Date().toISOString();
      }

      studentWallet.lastTransactionDate = new Date().toISOString();
      vendorWallet.lastTransactionDate = new Date().toISOString();

      // Record items purchases & bump usage count
      if (items && Array.isArray(items)) {
        for (const it of items) {
          let catalog = db.catalogItems.find(c => c.vendorId === vendorId && c.name.toLowerCase() === it.name.toLowerCase());
          if (catalog) {
            catalog.usageCount += Number(it.quantity || 1);
          } else {
            // Auto-saving Catalog Workflow (3.3)
            db.catalogItems.push({
              id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              vendorId,
              name: it.name,
              price: Number(it.price),
              usageCount: Number(it.quantity || 1),
              category: 'FOOD'
            });
          }
        }
      }

      const refCode = generateRef('TXN');
      db.transactions.push({
        id: `tx_${Date.now()}`,
        referenceCode: refCode,
        senderWalletId: studentWallet.id,
        receiverWalletId: vendorWallet.id,
        amount: checkoutTotal,
        fee: schoolPart + platformPart,
        type: 'SPEND',
        status: 'SUCCESS',
        description: `POS purchase at ${vendor.name}`,
        createdAt: new Date().toISOString()
      });

      // Platform commission log
      if (platformPart > 0) {
        db.transactions.push({
          id: `tx_plat_${Date.now()}`,
          referenceCode: refCode,
          senderWalletId: studentWallet.id,
          receiverWalletId: 'W_PLAT',
          amount: platformPart,
          fee: 0,
          type: 'COMMISSION_SPLIT',
          status: 'SUCCESS',
          description: `Platform 0.5% Commission share`,
          createdAt: new Date().toISOString()
        });
      }

      // School commission log
      if (schoolWallet && schoolPart > 0) {
        db.transactions.push({
          id: `tx_sch_${Date.now()}`,
          referenceCode: refCode,
          senderWalletId: studentWallet.id,
          receiverWalletId: schoolWallet.id,
          amount: schoolPart,
          fee: 0,
          type: 'COMMISSION_SPLIT',
          status: 'SUCCESS',
          description: `School ${schoolCommRate}% Commission share`,
          createdAt: new Date().toISOString()
        });
      }

      saveDb(db);
      audit('VENDOR', vendor.name, 'VENDOR', 'POS_SALE_COMPLETED', null, { student: student.name, total: checkoutTotal });

      res.json({
        success: true,
        referenceCode: refCode,
        message: 'Payment completed successfully.',
        newBalance: studentWallet.balance,
        vendorReceived: vendorPart
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: `Checkout process failed: ${e.message}` });
    }
  });

  app.get('/api/pos/catalog/:vendorId', (req, res) => {
    const { vendorId } = req.params;
    // Filter by merchant and sort by usageCount desc (Section 3.3)
    const items = db.catalogItems
      .filter(c => c.vendorId === vendorId)
      .sort((a, b) => b.usageCount - a.usageCount);
    res.json(items);
  });

  // Time-bound Refund System (3.4)
  app.post('/api/pos/refund', (req, res) => {
    const { transactionId, vendorPin, vendorId } = req.body;
    const txn = db.transactions.find(t => t.id === transactionId || t.referenceCode === transactionId);
    
    if (!txn) {
      return res.status(404).json({ success: false, error: 'Transaction record not found.' });
    }

    const vendor = db.vendors.find(v => v.id === vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Merchant registry missing.' });
    }

    // 24 Hours restriction Check
    const createdTime = new Date(txn.createdAt).getTime();
    const nowTime = new Date().getTime();
    const elapsedHrs = (nowTime - createdTime) / (1000 * 60 * 60);

    if (elapsedHrs > 24) {
      return res.status(400).json({ success: false, error: 'Refund window exceeded. Transaction occurred > 24 hours ago.' });
    }

    // Verify Vendor Admin PIN (mocking simple verification)
    if (vendorPin !== '1234') { // Default manager authorization PIN
      return res.status(401).json({ success: false, error: 'Invalid Manager PIN code. Refund unauthorized.' });
    }

    // Revert balance
    const senderWallet = db.wallets.find(w => w.id === txn.senderWalletId);
    const receiverWallet = db.wallets.find(w => w.id === txn.receiverWalletId);

    if (!senderWallet || !receiverWallet) {
      return res.status(400).json({ success: false, error: 'Unable to locate ledger wallets associated with this refund.' });
    }

    try {
      senderWallet.balance += txn.amount;
      receiverWallet.balance -= (txn.amount - txn.fee);

      txn.status = 'FAILED'; // Mark original failed/refunded
      
      db.transactions.push({
        id: `tx_ref_${Date.now()}`,
        referenceCode: generateRef('REF'),
        senderWalletId: receiverWallet.id,
        receiverWalletId: senderWallet.id,
        amount: txn.amount,
        fee: 0,
        type: 'REFUND',
        status: 'SUCCESS',
        description: `Refunded: Original ref ${txn.referenceCode}`,
        createdAt: new Date().toISOString()
      });

      saveDb(db);
      audit('VENDOR', vendor.name, 'VENDOR', 'POS_REFUND_EXECUTED', { amount: txn.amount }, { ref: txn.referenceCode });

      res.json({ success: true, message: 'Transaction fully refunded to Student card ledger.' });
    } catch (e: any) {
      res.status(500).json({ success: false, error: `Refund failed: ${e.message}` });
    }
  });

  // ----------------------------------------------------
  // COLLECTO POLLING PAYMENTS GATEWAY (6.0)
  // ----------------------------------------------------
  app.post('/api/collecto/deposit', (req, res) => {
    const { parentPhone, amount } = req.body;
    const numericAmount = Number(amount);

    const parent = db.parents.find(p => p.phone === parentPhone);
    if (!parent) {
      return res.status(404).json({ success: false, error: 'Parent wallet account not found.' });
    }

    const parentWallet = db.wallets.find(w => w.ownerId === parent.id && w.ownerType === 'PARENT');
    if (!parentWallet) {
      return res.status(404).json({ success: false, error: 'Wallet missing.' });
    }

    const txId = `tx_col_${Date.now()}`;
    const refCode = generateRef('COL-DEP');

    // Create Pending transaction
    db.transactions.push({
      id: txId,
      referenceCode: refCode,
      senderWalletId: 'COLLECTO_GATEWAY',
      receiverWalletId: parentWallet.id,
      amount: numericAmount,
      fee: 1000, // standard MoMo Fee
      type: 'DEPOSIT',
      status: 'PENDING',
      description: 'Pending Collecto MTN/Airtel STK Push',
      createdAt: new Date().toISOString()
    });

    saveDb(db);
    audit('PARENT', parent.name, 'PARENT', 'COLLECTO_STK_PUSH_INITIATED', null, { refCode, amount: numericAmount });

    res.json({
      success: true,
      transactionId: txId,
      referenceCode: refCode,
      message: 'STK push sent to your mobile phone. Enter MTN/Airtel PIN to authorize.'
    });
  });

  // Mock Collecto Gateway Polling Endpoint
  app.get('/api/collecto/status/:transactionId', (req, res) => {
    const { transactionId } = req.params;
    const txn = db.transactions.find(t => t.id === transactionId || t.referenceCode === transactionId);

    if (!txn) {
      return res.status(404).json({ success: false, error: 'Transaction not found.' });
    }

    if (txn.status === 'SUCCESS') {
      return res.json({ success: true, status: 'SUCCESS', transaction: txn });
    }

    // Simulate standard Collecto gateway polling delay (automatically approve on 2nd poll)
    // Realistically, STK push takes ~5 seconds. We mimic this by setting status to SUCCESS randomly or based on creation time elapsed.
    const createdTime = new Date(txn.createdAt).getTime();
    const elapsedSeconds = (Date.now() - createdTime) / 1000;

    if (elapsedSeconds > 3) {
      // Complete transaction (Idempotent locks checks)
      if (txn.status === 'PENDING') {
        const wallet = db.wallets.find(w => w.id === txn.receiverWalletId);
        if (wallet) {
          wallet.balance += txn.amount;
          wallet.lastTransactionDate = new Date().toISOString();
        }
        txn.status = 'SUCCESS';
        txn.description = 'Collecto Mobile Money Deposit Approved';
        saveDb(db);

        // Sync parent model balance
        if (wallet && wallet.ownerType === 'PARENT') {
          const parent = db.parents.find(p => p.id === wallet.ownerId);
          if (parent) parent.walletBalance = wallet.balance;
        }
        saveDb(db);
      }
      return res.json({ success: true, status: 'SUCCESS', transaction: txn });
    }

    return res.json({ success: true, status: 'PENDING' });
  });

  // Collecto Money OUT (Withdrawal)
  app.post('/api/collecto/withdraw', (req, res) => {
    const { vendorId, amount, phone } = req.body;
    const withdrawAmt = Number(amount);

    const vendor = db.vendors.find(v => v.id === vendorId);
    if (!vendor) {
      return res.status(404).json({ success: false, error: 'Vendor not registered.' });
    }

    const wallet = db.wallets.find(w => w.ownerId === vendorId && w.ownerType === 'VENDOR');
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Merchant wallet index missing.' });
    }

    if (wallet.balance < withdrawAmt) {
      return res.status(400).json({ success: false, error: 'Insufficient balance to withdraw requested funds.' });
    }

    try {
      // 1. Pre-deduct to prevent double spending
      wallet.balance -= withdrawAmt;
      wallet.lastTransactionDate = new Date().toISOString();

      const txId = `tx_col_w_${Date.now()}`;
      const refCode = generateRef('COL-WIT');

      db.transactions.push({
        id: txId,
        referenceCode: refCode,
        senderWalletId: wallet.id,
        receiverWalletId: 'COLLECTO_PAYOUT_GATEWAY',
        amount: withdrawAmt,
        fee: 1500, // payout standard charge
        type: 'WITHDRAWAL',
        status: 'PENDING',
        description: `Mobile Money Payout to ${phone}`,
        createdAt: new Date().toISOString()
      });

      saveDb(db);
      audit('VENDOR', vendor.name, 'VENDOR', 'COLLECTO_WITHDRAW_INITIATED', null, { refCode, amount: withdrawAmt });

      // In real life, Collecto cron resolves this. We trigger mock status resolver after 5 seconds
      res.json({
        success: true,
        transactionId: txId,
        referenceCode: refCode,
        message: `Payout request processed. Pree-deduction of ${withdrawAmt.toLocaleString()} UGX applied. Polling active.`
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: `Withdrawal crash: ${e.message}` });
    }
  });

  // ----------------------------------------------------
  // MICRO-LOANS & CREDIT ENGINE (7.0)
  // ----------------------------------------------------
  app.get('/api/loans/products', (req, res) => {
    res.json(db.loanProducts);
  });

  app.get('/api/loans/my-loans/:borrowerId', (req, res) => {
    const { borrowerId } = req.params;
    const loans = db.loans.filter(l => l.borrowerId === borrowerId);
    res.json(loans);
  });

  // Calculate Credit Score
  app.get('/api/loans/score/:borrowerId/:role', (req, res) => {
    const { borrowerId, role } = req.params;
    let scoreObj = db.creditScores.find(cs => cs.ownerId === borrowerId);

    if (!scoreObj) {
      // Generate standard score organically
      const basicScore = role === 'VENDOR' ? 78 : role === 'STAFF' ? 85 : 62;
      scoreObj = {
        id: `cs_${Date.now()}`,
        ownerId: borrowerId,
        score: basicScore,
        factors: {
          txCount30Days: role === 'VENDOR' ? 120 : 0,
          depositFrequency: role === 'PARENT' ? 5 : 0,
          repaymentHistory: 'Standard automatic system profile assessment'
        }
      };
      db.creditScores.push(scoreObj);
      saveDb(db);
    }

    res.json(scoreObj);
  });

  // Apply for Loan
  app.post('/api/loans/apply', (req, res) => {
    const { productId, borrowerId, borrowerType, amount } = req.body;
    const applyAmt = Number(amount);

    const product = db.loanProducts.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, error: 'Selected loan product not recognized.' });
    }

    if (applyAmt < product.minAmount || applyAmt > product.maxAmount) {
      return res.status(400).json({ success: false, error: `Invalid amount. Must range between ${product.minAmount.toLocaleString()} - ${product.maxAmount.toLocaleString()} UGX.` });
    }

    // Verify if already holds active loan
    const hasActive = db.loans.some(l => l.borrowerId === borrowerId && l.status === 'ACTIVE');
    if (hasActive) {
      return res.status(400).json({ success: false, error: 'You already have an outstanding active loan. Repay to clear.' });
    }

    // 1. Score verification
    let scoreObj = db.creditScores.find(cs => cs.ownerId === borrowerId);
    const score = scoreObj ? scoreObj.score : 65;
    if (score < 50) {
      return res.status(400).json({ success: false, error: `Credit rating score (${score}) insufficient. Minimal requirements is 50.` });
    }

    // 2. Disburse money directly to Wallet
    let wallet = db.wallets.find(w => w.ownerId === borrowerId);
    if (!wallet) {
      // Fallback create wallet
      wallet = {
        id: `W_${borrowerId}`,
        ownerId: borrowerId,
        ownerType: borrowerType,
        balance: 0,
        status: 'ACTIVE',
        lastTransactionDate: new Date().toISOString()
      };
      db.wallets.push(wallet);
    }

    try {
      const interest = Math.floor((applyAmt * product.interestRate) / 100);
      const totalRepayable = applyAmt + interest;
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + product.durationDays);

      const loan: Loan = {
        id: `loan_${Date.now()}`,
        productId,
        borrowerId,
        borrowerType,
        amount: applyAmt,
        interest,
        totalRepayable,
        amountPaid: 0,
        status: 'ACTIVE',
        dueDate: dueDate.toISOString(),
        createdAt: new Date().toISOString()
      };

      db.loans.push(loan);
      wallet.balance += applyAmt;
      wallet.lastTransactionDate = new Date().toISOString();

      // Transaction Ledger Record
      db.transactions.push({
        id: `tx_loan_dis_${Date.now()}`,
        referenceCode: generateRef('LON-DIS'),
        senderWalletId: 'PLAT_CREDIT_POOL',
        receiverWalletId: wallet.id,
        amount: applyAmt,
        fee: 0,
        type: 'LOAN_DISBURSE',
        status: 'SUCCESS',
        description: `Disbursement of ${product.name}`,
        createdAt: new Date().toISOString()
      });

      saveDb(db);
      audit(borrowerId, `Borrower: ${borrowerType}`, borrowerType, 'LOAN_DISBURSED', null, { amount: applyAmt, totalRepayable });

      res.json({
        success: true,
        message: `Congratulations! Your loan of ${applyAmt.toLocaleString()} UGX has been approved and disbursed instantly to your wallet.`,
        loan
      });
    } catch (e: any) {
      res.status(500).json({ success: false, error: `Loan disbursement failed: ${e.message}` });
    }
  });

  // Manual Loan Repayment
  app.post('/api/loans/repay', (req, res) => {
    const { loanId, amount } = req.body;
    const payAmt = Number(amount);

    const loan = db.loans.find(l => l.id === loanId);
    if (!loan) {
      return res.status(404).json({ success: false, error: 'Loan index missing.' });
    }

    const wallet = db.wallets.find(w => w.ownerId === loan.borrowerId);
    if (!wallet) {
      return res.status(404).json({ success: false, error: 'Borrower wallet not located.' });
    }

    const remaining = loan.totalRepayable - loan.amountPaid;
    if (wallet.balance < payAmt) {
      return res.status(400).json({ success: false, error: 'Insufficient wallet balance to process this loan repayment.' });
    }

    const finalPay = Math.min(payAmt, remaining);

    try {
      wallet.balance -= finalPay;
      loan.amountPaid += finalPay;
      wallet.lastTransactionDate = new Date().toISOString();

      if (loan.amountPaid >= loan.totalRepayable) {
        loan.status = 'PAID';
      }

      db.transactions.push({
        id: `tx_loan_rep_${Date.now()}`,
        referenceCode: generateRef('LON-REP'),
        senderWalletId: wallet.id,
        receiverWalletId: 'PLAT_CREDIT_POOL',
        amount: finalPay,
        fee: 0,
        type: 'LOAN_REPAY',
        status: 'SUCCESS',
        description: `Repayment for loan ID ${loan.id}`,
        createdAt: new Date().toISOString()
      });

      saveDb(db);
      audit(loan.borrowerId, 'Borrower', loan.borrowerType, 'LOAN_REPAYMENT_SUBMITTED', null, { amountRepaid: finalPay });

      res.json({ success: true, message: `Repayment of ${finalPay.toLocaleString()} UGX completed successfully.`, remaining: loan.totalRepayable - loan.amountPaid });
    } catch (e: any) {
      res.status(500).json({ success: false, error: `Repayment crash: ${e.message}` });
    }
  });

  // ----------------------------------------------------
  // VITE DEV SERVER / PRODUCTION CONFIG
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EduTechMoney Server running on port ${PORT}`);
  });
}

startServer();
