import fs from 'fs';
import path from 'path';
import url from 'url';

const DB_FILE = path.resolve(process.cwd(), 'db.json');
const TEMPLATE_FILE = path.resolve(process.cwd(), 'db.template.json');

const DEFAULT_SCHOOLS = [
  { id: 'S1', name: 'Kampala Parents Primary', region: 'Central', code: 'KPS', commissionRate: 1.0 },
  { id: 'S2', name: 'Nakasero Model School', region: 'Central', code: 'NMS', commissionRate: 1.2 },
  { id: 'S3', name: 'Gayaza High School', region: 'Central', code: 'GHS', commissionRate: 0.8 }
];

const DEFAULT_VENDORS = [
  { id: 'V1', name: 'Mama Betty Canteen', schoolId: 'S1', phone: '+256700000005', type: 'CANTEEN', commissionRate: 98.5, deviceBound: true },
  { id: 'V2', name: 'Elite Bookshop', schoolId: 'S1', phone: '+256700000101', type: 'BOOKSHOP', commissionRate: 98.0, deviceBound: true },
  { id: 'V3', name: 'Nakasero Snacks', schoolId: 'S2', phone: '+256700000202', type: 'CANTEEN', commissionRate: 99.0, deviceBound: true }
];

const DEFAULT_USERS = [
  { id: 'U1', username: 'superadmin', role: 'SUPER_ADMIN', name: 'Alinda Robert (HQ)', phone: '+256700000001' },
  { id: 'U2', username: 'central_admin', role: 'BUSINESS_ADMIN', name: 'Nakimbugwe Stella', phone: '+256700000002', region: 'Central' },
  { id: 'U3', username: 'agent_peter', role: 'AGENT', name: 'Peter Ssekabira', phone: '+256700000003', region: 'Central' },
  { id: 'U4', username: 'kps_bursar', role: 'SCHOOL_ADMIN', name: 'Kato Charles (Bursar)', phone: '+256700000004', schoolId: 'S1' },
  { id: 'U5', username: 'kps_canteen', role: 'VENDOR', name: 'Mama Betty Canteen', phone: '+256700000005', schoolId: 'S1', vendorId: 'V1' },
  { id: 'U6', username: 'moses_parent', role: 'PARENT', name: 'Moses Mukasa', phone: '+256772444555' }
];

const DEFAULT_LOAN_PRODUCTS = [
  { id: 'lp1', name: 'School Fees Advance', description: 'Urgent funding to cover school fees with quick repayment terms.', minAmount: 50000, maxAmount: 500000, interestRate: 5, durationDays: 30, targetRole: 'PARENT' },
  { id: 'lp2', name: 'Merchant Inventory Capital', description: 'Stock finance for registered canteens and bookstores.', minAmount: 100000, maxAmount: 1000000, interestRate: 3, durationDays: 15, targetRole: 'VENDOR' },
  { id: 'lp3', name: 'Staff Salary Advance', description: 'Emergency salary loan for registered teachers and administration.', minAmount: 50000, maxAmount: 300000, interestRate: 4, durationDays: 30, targetRole: 'STAFF' }
];

const DEFAULT_STAFF = [
  { id: 'STF1', name: 'Nalwanga Florence', role: 'TEACHER', email: 'florence@kps.ac.ug', phone: '+256771122334', status: 'ACTIVE' },
  { id: 'STF2', name: 'Otim Douglas', role: 'WARDEN', email: 'douglas@kps.ac.ug', phone: '+256781234567', status: 'ACTIVE' },
  { id: 'STF3', name: 'Kato Charles', role: 'BURSAR', email: 'charles@kps.ac.ug', phone: '+256700000004', status: 'ACTIVE' }
];

const DEFAULT_SYSTEM_SETTINGS = {
  loansEnabled: true,
  commissionRate: 0.5
};

function load_db() {
  let db: any = {};
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      db = {};
    }
  } else if (fs.existsSync(TEMPLATE_FILE)) {
    try {
      fs.copyFileSync(TEMPLATE_FILE, DB_FILE);
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    } catch (e) {
      db = {};
    }
  } else {
    // Attempt fallback from data.json or data.template.json
    const sourceData = path.resolve(process.cwd(), 'data.json');
    const sourceTemplate = path.resolve(process.cwd(), 'data.template.json');
    if (fs.existsSync(sourceData)) {
      try {
        fs.copyFileSync(sourceData, DB_FILE);
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        db = {};
      }
    } else if (fs.existsSync(sourceTemplate)) {
      try {
        fs.copyFileSync(sourceTemplate, DB_FILE);
        db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
      } catch (e) {
        db = {};
      }
    }
  }

  // Self-heal and seed all missing properties
  let changed = false;
  if (!db.schools || db.schools.length === 0) { db.schools = DEFAULT_SCHOOLS; changed = true; }
  if (!db.vendors || db.vendors.length === 0) { db.vendors = DEFAULT_VENDORS; changed = true; }
  if (!db.users || db.users.length === 0) { db.users = DEFAULT_USERS; changed = true; }
  if (!db.loanProducts || db.loanProducts.length === 0) { db.loanProducts = DEFAULT_LOAN_PRODUCTS; changed = true; }
  if (!db.staff || db.staff.length === 0) { db.staff = DEFAULT_STAFF; changed = true; }
  if (!db.systemSettings) { db.systemSettings = DEFAULT_SYSTEM_SETTINGS; changed = true; }
  if (!db.parents) { db.parents = []; changed = true; }
  if (!db.students) { db.students = []; changed = true; }
  if (!db.wallets) { db.wallets = []; changed = true; }
  if (!db.auditLogs) { db.auditLogs = []; changed = true; }
  if (!db.creditScores) { db.creditScores = []; changed = true; }
  if (!db.transactions) { db.transactions = []; changed = true; }

  if (changed) {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  }
  return db;
}

function save_db(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function generate_ref(prefix: string) {
  return `${prefix}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
}

function audit(userId: string, userName: string, role: string, action: string, oldVal?: any, newVal?: any) {
  const db = load_db();
  const newLog = {
    id: `a_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    userId,
    userName,
    role,
    action,
    ipAddress: '127.0.0.1',
    oldValues: oldVal ? JSON.stringify(oldVal) : null,
    newValues: newVal ? JSON.stringify(newVal) : null,
    createdAt: new Date().toISOString()
  };
  if (!db.auditLogs) {
    db.auditLogs = [];
  }
  db.auditLogs.unshift(newLog);
  if (db.auditLogs.length > 300) {
    db.auditLogs.pop();
  }
  save_db(db);
}

export function devApiMiddleware(req: any, res: any, next: any) {
  const parsedUrl = url.parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';
  const method = req.method || 'GET';

  if (!pathname.startsWith('/api')) {
    return next();
  }

  res.setHeader('Content-Type', 'application/json');

  const getBody = (): Promise<any> => {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
    });
  };

  const sendJson = (data: any, status = 200) => {
    res.statusCode = status;
    res.end(JSON.stringify(data));
  };

  const sendError = (message: string, status = 400) => {
    res.statusCode = status;
    res.end(JSON.stringify({ success: false, error: message }));
  };

  // GET ROUTES
  if (method === 'GET') {
    if (pathname === '/api/health') {
      return sendJson({
        status: 'healthy',
        platform: 'EduTechMoney',
        timestamp: new Date().toISOString()
      });
    }

    if (pathname === '/api/audit-logs') {
      const db = load_db();
      return sendJson(db.auditLogs || []);
    }

    if (pathname === '/api/schools') {
      const db = load_db();
      return sendJson(db.schools || []);
    }

    if (pathname === '/api/vendors') {
      const db = load_db();
      return sendJson(db.vendors || []);
    }

    if (pathname === '/api/parents') {
      const db = load_db();
      return sendJson(db.parents || []);
    }

    if (pathname === '/api/students') {
      const db = load_db();
      return sendJson(db.students || []);
    }

    if (pathname === '/api/system/settings') {
      const db = load_db();
      return sendJson(db.systemSettings || { loansEnabled: true, commissionRate: 0.5 });
    }

    if (pathname === '/api/users') {
      const db = load_db();
      return sendJson(db.users || []);
    }

    if (pathname === '/api/transactions') {
      const db = load_db();
      return sendJson(db.transactions || []);
    }

    if (pathname === '/api/staff') {
      const db = load_db();
      return sendJson(db.staff || []);
    }

    if (pathname.startsWith('/api/pos/scan/')) {
      const qrHash = pathname.split('/').pop() || '';
      const db = load_db();
      const student = (db.students || []).find((s: any) => s.qrHash === qrHash);
      if (!student) {
        return sendError('Unknown QR card. Student registry match failed.', 404);
      }
      const wallet = (db.wallets || []).find((w: any) => w.ownerId === student.id && w.ownerType === 'STUDENT');
      const balance = wallet ? wallet.balance : 0;
      return sendJson({
        success: true,
        student: {
          id: student.id,
          name: student.name,
          class: student.class,
          avatarUrl: student.avatarUrl,
          noPinLimit: student.noPinLimit,
          balance
        }
      });
    }

    if (pathname.startsWith('/api/pos/catalog/')) {
      const vendorId = pathname.split('/').pop() || '';
      const db = load_db();
      const items = (db.catalogItems || []).filter((c: any) => c.vendorId === vendorId);
      items.sort((a: any, b: any) => (b.usageCount || 0) - (a.usageCount || 0));
      return sendJson(items);
    }

    if (pathname.startsWith('/api/pos/payment-status/')) {
      const refCode = pathname.split('/').pop() || '';
      const db = load_db();
      const txn = (db.transactions || []).find((t: any) => t.referenceCode === refCode || t.id === refCode);
      if (!txn) {
        return sendError('Dynamic payment request not found.', 404);
      }
      return sendJson({
        success: true,
        id: txn.id,
        referenceCode: txn.referenceCode,
        amount: txn.amount,
        status: txn.status,
        senderWalletId: txn.senderWalletId || '',
        receiverWalletId: txn.receiverWalletId || '',
        description: txn.description || '',
        createdAt: txn.createdAt || ''
      });
    }

    if (pathname.startsWith('/api/pos/transactions/')) {
      const vendorId = pathname.split('/').pop() || '';
      const db = load_db();
      const txs = (db.transactions || []).filter((t: any) => 
        t.receiverWalletId === `W_${vendorId}` || 
        t.senderWalletId === `W_${vendorId}` ||
        t.receiverWalletId === vendorId ||
        t.senderWalletId === vendorId
      );
      return sendJson(txs);
    }

    if (pathname.startsWith('/api/collecto/status/')) {
      (async () => {
        const transactionId = pathname.split('/').pop() || '';
        const db = load_db();
        const txnIdx = (db.transactions || []).findIndex((t: any) => t.id === transactionId || t.referenceCode === transactionId);
        if (txnIdx === -1) {
          return sendError('Transaction not found.', 404);
        }
        const txn = db.transactions[txnIdx];
        if (txn.status === 'SUCCESS') {
          return sendJson({ success: true, status: 'SUCCESS', transaction: txn });
        }
        if (txn.status === 'FAILED') {
          return sendJson({ success: true, status: 'FAILED', transaction: txn });
        }

        const username = process.env.COLLECTO_USERNAME;
        const apiKey = process.env.COLLECTO_API_KEY;
        const isReal = txn.realIntegration && txn.collectoTxId;

        if (isReal && username && apiKey) {
          try {
            const url = `https://collecto.cissytech.com/api/${encodeURIComponent(username)}/requestToPayStatus`;
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
              },
              body: JSON.stringify({ transactionId: txn.collectoTxId })
            });
            const resData: any = await response.json();
            const statusStr = (resData.status || 'pending').toLowerCase();

            if (statusStr === 'successful' || statusStr === 'success') {
              if (db.transactions[txnIdx].status === 'PENDING') {
                const walletIdx = (db.wallets || []).findIndex((w: any) => w.id === txn.receiverWalletId);
                if (walletIdx !== -1) {
                  db.wallets[walletIdx].balance += txn.amount;
                  db.wallets[walletIdx].lastTransactionDate = new Date().toISOString();
                  if (db.wallets[walletIdx].ownerType === 'PARENT') {
                    const pIdx = (db.parents || []).findIndex((p: any) => p.id === db.wallets[walletIdx].ownerId);
                    if (pIdx !== -1) {
                      db.parents[pIdx].walletBalance = db.wallets[walletIdx].balance;
                    }
                  }
                }
                db.transactions[txnIdx].status = 'SUCCESS';
                db.transactions[txnIdx].description = 'Approved via real-time Collecto Gateway';
                save_db(db);
              }
              return sendJson({ success: true, status: 'SUCCESS', transaction: db.transactions[txnIdx], realIntegration: true });
            } else if (statusStr === 'failed' || statusStr === 'failed_payment' || statusStr === 'rejected') {
              if (db.transactions[txnIdx].status === 'PENDING') {
                db.transactions[txnIdx].status = 'FAILED';
                db.transactions[txnIdx].description = 'Declined/failed on Collecto gateway';
                save_db(db);
              }
              return sendJson({ success: true, status: 'FAILED', transaction: db.transactions[txnIdx], realIntegration: true });
            } else {
              return sendJson({ success: true, status: 'PENDING', realIntegration: true });
            }
          } catch (e: any) {
            return sendJson({ success: true, status: 'PENDING', error: e.message, realIntegration: true });
          }
        }

        // Mock Simulation Polling
        const created = new Date(txn.createdAt).getTime();
        const elapsed = Date.now() - created;

        if (elapsed > 3000) {
          if (txn.status === 'PENDING') {
            const walletIdx = (db.wallets || []).findIndex((w: any) => w.id === txn.receiverWalletId);
            if (walletIdx !== -1) {
              db.wallets[walletIdx].balance += txn.amount;
              db.wallets[walletIdx].lastTransactionDate = new Date().toISOString();
              if (db.wallets[walletIdx].ownerType === 'PARENT') {
                const pIdx = (db.parents || []).findIndex((p: any) => p.id === db.wallets[walletIdx].ownerId);
                if (pIdx !== -1) {
                  db.parents[pIdx].walletBalance = db.wallets[walletIdx].balance;
                }
              }
            }
            db.transactions[txnIdx].status = 'SUCCESS';
            db.transactions[txnIdx].description = 'Collecto Mobile Money Deposit Approved';
            save_db(db);
          }
          return sendJson({ success: true, status: 'SUCCESS', transaction: db.transactions[txnIdx] });
        }
        return sendJson({ success: true, status: 'PENDING' });
      })();
      return;
    }

    if (pathname === '/api/loans/products') {
      const db = load_db();
      return sendJson(db.loanProducts || []);
    }

    if (pathname.startsWith('/api/loans/my-loans/')) {
      const borrowerId = pathname.split('/').pop() || '';
      const db = load_db();
      const loans = (db.loans || []).filter((l: any) => l.borrowerId === borrowerId);
      return sendJson(loans);
    }

    if (pathname.startsWith('/api/loans/score/')) {
      const parts = pathname.split('/');
      const borrowerId = parts[parts.length - 2] || '';
      const role = parts[parts.length - 1] || '';
      const db = load_db();
      let scoreObj = (db.creditScores || []).find((cs: any) => cs.ownerId === borrowerId);
      if (!scoreObj) {
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
        if (!db.creditScores) db.creditScores = [];
        db.creditScores.push(scoreObj);
        save_db(db);
      }
      return sendJson(scoreObj);
    }
  }

  // POST ROUTES
  if (method === 'POST') {
    getBody().then(async (input) => {
      if (pathname === '/api/auth/login') {
        const db = load_db();
        const username = input.username || '';
        const found = (db.users || []).find((u: any) => u.username === username);
        if (found) {
          return sendJson({ success: true, user: found });
        } else {
          return sendError('Invalid username or password.', 401);
        }
      }

      if (pathname === '/api/system/settings') {
        const db = load_db();
        const { loansEnabled, commissionRate } = input;
        db.systemSettings = {
          loansEnabled: loansEnabled !== undefined ? loansEnabled : db.systemSettings.loansEnabled,
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : db.systemSettings.commissionRate
        };
        save_db(db);
        audit('SUPER_ADMIN', 'Alinda Robert (HQ)', 'SUPER_ADMIN', 'UPDATE_GLOBAL_SETTINGS', null, db.systemSettings);
        return sendJson({ success: true, message: 'Global system parameters updated.' });
      }

      if (pathname === '/api/users/create') {
        const db = load_db();
        const { name, username, phone, role, region, schoolId } = input;
        if (!username || !role || !name) {
          return sendError('Name, username and role are required.', 400);
        }
        const exists = (db.users || []).some((u: any) => u.username === username);
        if (exists) {
          return sendError('Username already taken.', 400);
        }
        const newUser = {
          id: `U_${Date.now()}`,
          name,
          username,
          phone: phone || '',
          role,
          region,
          schoolId
        };
        if (!db.users) db.users = [];
        db.users.push(newUser);
        save_db(db);
        audit('SUPER_ADMIN', 'Alinda Robert (HQ)', 'SUPER_ADMIN', `CREATE_USER_${role}`, null, newUser);
        return sendJson({ success: true, user: newUser, message: `Account created successfully.` });
      }

      if (pathname === '/api/schools') {
        const db = load_db();
        const { name, region, code, commissionRate } = input;
        if (!name || !code) {
          return sendError('School name and code are required.', 400);
        }
        const id = `SCH_${Date.now()}`;
        const newSchool = {
          id,
          name,
          region: region || 'Central',
          code,
          commissionRate: commissionRate !== undefined ? Number(commissionRate) : 1.0
        };
        if (!db.schools) db.schools = [];
        db.schools.push(newSchool);

        // Create school wallet
        if (!db.wallets) db.wallets = [];
        db.wallets.push({
          id: `W_${id}`,
          ownerId: id,
          ownerType: 'SCHOOL',
          balance: 0,
          status: 'ACTIVE',
          lastTransactionDate: new Date().toISOString()
        });

        // Create school admin login user automatically
        const adminUsername = `${code.toLowerCase()}_bursar`;
        const exists = (db.users || []).some((u: any) => u.username === adminUsername);
        if (!exists) {
          const newSchoolUser = {
            id: `U_${Date.now()}_sch`,
            username: adminUsername,
            role: 'SCHOOL_ADMIN',
            name: `${name} Bursar`,
            phone: '+256700000000',
            schoolId: id
          };
          if (!db.users) db.users = [];
          db.users.push(newSchoolUser);
        }

        save_db(db);
        audit('BUSINESS_ADMIN', 'Nakimbugwe Stella', 'BUSINESS_ADMIN', 'CREATE_SCHOOL', null, newSchool);
        return sendJson({ success: true, school: newSchool, message: `School ${name} created successfully.` });
      }

      if (pathname === '/api/agents') {
        const db = load_db();
        const { name, username, phone, region } = input;
        if (!name || !username) {
          return sendError('Agent name and username are required.', 400);
        }
        const id = `U_${Date.now()}`;
        const newAgent = {
          id,
          username,
          role: 'AGENT',
          name,
          phone: phone || '',
          region: region || 'Central'
        };
        if (!db.users) db.users = [];
        db.users.push(newAgent);
        save_db(db);
        audit('BUSINESS_ADMIN', 'Nakimbugwe Stella', 'BUSINESS_ADMIN', 'CREATE_AGENT', null, newAgent);
        return sendJson({ success: true, agent: newAgent, message: `Agent ${name} registered successfully.` });
      }

      if (pathname === '/api/vendors/update-commission') {
        const db = load_db();
        const { vendorId, schoolCommissionRate } = input;
        if (!vendorId) {
          return sendError('Vendor ID is required.', 400);
        }
        const idx = (db.vendors || []).findIndex((v: any) => v.id === vendorId);
        if (idx === -1) {
          return sendError('Vendor not found.', 404);
        }
        db.vendors[idx].commissionRate = 100 - Number(schoolCommissionRate);
        save_db(db);
        audit('BUSINESS_ADMIN', 'Nakimbugwe Stella', 'BUSINESS_ADMIN', 'UPDATE_VENDOR_COMMISSION', null, { vendorId, schoolCommissionRate });
        return sendJson({ success: true, message: `Commission split updated successfully.` });
      }

      if (pathname === '/api/staff') {
        const db = load_db();
        const { name, role, email, phone } = input;
        if (!name || !role) {
          return sendError('Staff name and role are required.', 400);
        }
        const newStaff = {
          id: `STF_${Date.now()}`,
          name,
          role,
          email: email || '',
          phone: phone || '',
          status: 'ACTIVE'
        };
        if (!db.staff) db.staff = [];
        db.staff.push(newStaff);
        save_db(db);
        audit('SCHOOL_ADMIN', 'Kato Charles (Bursar)', 'SCHOOL_ADMIN', 'ADD_STAFF', null, newStaff);
        return sendJson({ success: true, staff: newStaff, message: `Staff member ${name} registered successfully.` });
      }

      if (pathname === '/api/parents/create-or-update') {
        const db = load_db();
        const { id, name, phone, nin } = input;
        if (!name || !phone) return sendError('Name and Phone are required.', 400);

        if (id) {
          const idx = (db.parents || []).findIndex((p: any) => p.id === id);
          if (idx !== -1) {
            db.parents[idx] = { ...db.parents[idx], name, phone, nin: nin || db.parents[idx].nin, kycTier: nin ? 2 : db.parents[idx].kycTier };
            save_db(db);
            audit('AGENT', 'Peter Ssekabira', 'AGENT', 'UPDATE_PARENT', null, db.parents[idx]);
            return sendJson({ success: true, message: 'Parent updated successfully.', parent: db.parents[idx] });
          }
          return sendError('Parent not found.', 404);
        } else {
          const parentId = `P_${Date.now()}`;
          const newParent = {
            id: parentId,
            name,
            phone,
            nin: nin || '',
            kycTier: nin ? 2 : 1,
            walletBalance: 0
          };
          if (!db.parents) db.parents = [];
          db.parents.push(newParent);
          if (!db.wallets) db.wallets = [];
          db.wallets.push({
            id: `W_${parentId}`,
            ownerId: parentId,
            ownerType: 'PARENT',
            balance: 0,
            status: 'ACTIVE',
            lastTransactionDate: new Date().toISOString()
          });

          // Automatically provision a PARENT login user in db.users
          const parentUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const uExists = (db.users || []).some((u: any) => u.username === parentUsername);
          if (!uExists) {
            const newParentUser = {
              id: `U_${Date.now()}_p`,
              username: parentUsername,
              role: 'PARENT',
              name,
              phone
            };
            if (!db.users) db.users = [];
            db.users.push(newParentUser);
          }

          save_db(db);
          audit('AGENT', 'Peter Ssekabira', 'AGENT', 'CREATE_PARENT', null, newParent);
          return sendJson({ success: true, message: 'Parent created successfully.', parent: newParent });
        }
      }

      if (pathname === '/api/vendors/create-or-update') {
        const db = load_db();
        const { id, name, schoolId, phone, type, commissionRate } = input;
        if (!name || !schoolId || !phone) return sendError('Name, School, and Phone are required.', 400);

        if (id) {
          const idx = (db.vendors || []).findIndex((v: any) => v.id === id);
          if (idx !== -1) {
            db.vendors[idx] = { ...db.vendors[idx], name, schoolId, phone, type: type || 'CANTEEN', commissionRate: commissionRate !== undefined ? Number(commissionRate) : db.vendors[idx].commissionRate };
            save_db(db);
            audit('AGENT', 'Peter Ssekabira', 'AGENT', 'UPDATE_VENDOR', null, db.vendors[idx]);
            return sendJson({ success: true, message: 'Vendor updated successfully.', vendor: db.vendors[idx] });
          }
          return sendError('Vendor not found.', 404);
        } else {
          const vendorId = `V_${Date.now()}`;
          const newVendor = {
            id: vendorId,
            name,
            schoolId,
            phone,
            type: type || 'CANTEEN',
            commissionRate: commissionRate !== undefined ? Number(commissionRate) : 98.5,
            deviceBound: true
          };
          if (!db.vendors) db.vendors = [];
          db.vendors.push(newVendor);
          if (!db.wallets) db.wallets = [];
          db.wallets.push({
            id: `W_${vendorId}`,
            ownerId: vendorId,
            ownerType: 'VENDOR',
            balance: 0,
            status: 'ACTIVE',
            lastTransactionDate: new Date().toISOString()
          });

          // Automatically provision a VENDOR login user in db.users
          const vendorUsername = name.toLowerCase().replace(/[^a-z0-9]/g, '_');
          const uExists = (db.users || []).some((u: any) => u.username === vendorUsername);
          if (!uExists) {
            const newVendorUser = {
              id: `U_${Date.now()}_v`,
              username: vendorUsername,
              role: 'VENDOR',
              name,
              phone,
              schoolId,
              vendorId
            };
            if (!db.users) db.users = [];
            db.users.push(newVendorUser);
          }

          save_db(db);
          audit('AGENT', 'Peter Ssekabira', 'AGENT', 'CREATE_VENDOR', null, newVendor);
          return sendJson({ success: true, message: 'Vendor created successfully.', vendor: newVendor });
        }
      }

      if (pathname === '/api/parents/delete') {
        const db = load_db();
        const { id } = input;
        const idx = (db.parents || []).findIndex((p: any) => p.id === id);
        if (idx !== -1) {
          const removed = db.parents.splice(idx, 1)[0];
          save_db(db);
          audit('AGENT', 'Peter Ssekabira', 'AGENT', 'DELETE_PARENT', removed, null);
          return sendJson({ success: true, message: 'Parent deleted successfully.' });
        }
        return sendError('Parent not found.', 404);
      }

      if (pathname === '/api/vendors/delete') {
        const db = load_db();
        const { id } = input;
        const idx = (db.vendors || []).findIndex((v: any) => v.id === id);
        if (idx !== -1) {
          const removed = db.vendors.splice(idx, 1)[0];
          save_db(db);
          audit('AGENT', 'Peter Ssekabira', 'AGENT', 'DELETE_VENDOR', removed, null);
          return sendJson({ success: true, message: 'Vendor deleted successfully.' });
        }
        return sendError('Vendor not found.', 404);
      }

      if (pathname === '/api/students/delete') {
        const db = load_db();
        const { id } = input;
        const idx = (db.students || []).findIndex((s: any) => s.id === id);
        if (idx !== -1) {
          const removed = db.students.splice(idx, 1)[0];
          save_db(db);
          audit('AGENT', 'Peter Ssekabira', 'AGENT', 'DELETE_STUDENT', removed, null);
          return sendJson({ success: true, message: 'Student deleted successfully.' });
        }
        return sendError('Student not found.', 404);
      }

      if (pathname === '/api/students/update-link-status') {
        const db = load_db();
        const { studentId, isLinked, otpChallenge } = input;
        if (!studentId) return sendError('Student ID is required.', 400);

        if (otpChallenge !== '1234' && otpChallenge !== '4321') {
          return sendError('Invalid guardian approval OTP challenge code. Enter 1234 or 4321.', 400);
        }

        const idx = (db.students || []).findIndex((s: any) => s.id === studentId);
        if (idx === -1) return sendError('Student not found.', 404);

        const oldStatus = db.students[idx].isLinked;
        db.students[idx].isLinked = !!isLinked;
        save_db(db);
        audit('AGENT', 'Peter Ssekabira', 'AGENT', 'MODIFY_PARENT_STUDENT_LINK', { studentId, oldStatus }, { isLinked });
        return sendJson({ success: true, message: `Student link updated to ${isLinked ? 'LINKED' : 'UNLINKED'} successfully.` });
      }

      if (pathname === '/api/setup/reset') {
        if (fs.existsSync(TEMPLATE_FILE)) {
          fs.copyFileSync(TEMPLATE_FILE, DB_FILE);
          audit('SYSTEM', 'System Daemon', 'SUPER_ADMIN', 'DATABASE_HARD_RESET');
          return sendJson({ success: true, message: 'Database reset to default template state.' });
        } else {
          return sendError('Database template backup not found.', 500);
        }
      }

      if (pathname === '/api/students/bulk-upload') {
        const db = load_db();
        const rows = input.rows;
        const agentId = input.agentId || 'AGENT';
        const agentName = input.agentName || 'Field Agent';

        if (!Array.isArray(rows)) {
          return sendError('Invalid CSV list payload.', 400);
        }

        let updatedCount = 0;
        let addedCount = 0;
        const addedStudents = [];

        if (!db.parents) db.parents = [];
        if (!db.wallets) db.wallets = [];
        if (!db.students) db.students = [];

        for (const row of rows) {
          const { schoolId, admissionNo, name, class: className = 'Unassigned', parentName = 'Unknown Guardian', parentPhone, parentNin } = row;
          if (!schoolId || !admissionNo || !name || !parentPhone) continue;

          let parentIdx = db.parents.findIndex((p: any) => p.phone === parentPhone);
          if (parentIdx === -1) {
            const parentId = `P_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
            const newParent = {
              id: parentId,
              name: parentName,
              phone: parentPhone,
              nin: parentNin || '',
              kycTier: parentNin ? 2 : 1,
              walletBalance: 0
            };
            db.parents.push(newParent);
            db.wallets.push({
              id: `W_${parentId}`,
              ownerId: parentId,
              ownerType: 'PARENT',
              balance: 0,
              status: 'ACTIVE',
              lastTransactionDate: new Date().toISOString()
            });
            parentIdx = db.parents.length - 1;
            addedCount++;
          } else if (parentNin && parentNin !== db.parents[parentIdx].nin) {
            db.parents[parentIdx].nin = parentNin;
            db.parents[parentIdx].kycTier = 2;
            updatedCount++;
          }

          let studentIdx = db.students.findIndex((s: any) => s.schoolId === schoolId && s.admissionNo === admissionNo);
          if (studentIdx === -1) {
            const studentId = `ST_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const newStudent = {
              id: studentId,
              schoolId,
              name,
              admissionNo,
              class: className,
              qrHash: `ST_QR_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
              pin: '0000',
              parentPhone,
              isLinked: true,
              avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120',
              noPinLimit: 2000
            };
            db.students.push(newStudent);
            db.wallets.push({
              id: `W_${studentId}`,
              ownerId: studentId,
              ownerType: 'STUDENT',
              balance: 0,
              status: 'ACTIVE',
              lastTransactionDate: new Date().toISOString()
            });
            addedStudents.push(newStudent);
          } else {
            db.students[studentIdx].name = name;
            db.students[studentIdx].class = className;
            db.students[studentIdx].parentPhone = parentPhone;
          }
        }

        save_db(db);
        audit(agentId, agentName, 'AGENT', 'BULK_CSV_STUDENT_IMPORT', null, { addedStudentsCount: addedStudents.length });

        return sendJson({
          success: true,
          message: `Bulk sync complete. Loaded parent structures. Processed ${addedStudents.length} new student entries.`,
          addedCount,
          updatedCount
        });
      }

      if (pathname === '/api/students/reset-pin') {
        const db = load_db();
        const { studentId, newPin } = input;
        if (!studentId || !newPin || newPin.length !== 4) {
          return sendError('PIN must be exactly 4 digits.', 400);
        }
        const sIdx = (db.students || []).findIndex((s: any) => s.id === studentId);
        if (sIdx === -1) {
          return sendError('Student not found.', 404);
        }
        const studentName = db.students[sIdx].name;
        db.students[sIdx].pin = newPin;
        save_db(db);

        audit('PARENT', `Parent linked to ${studentName}`, 'PARENT', 'RESET_STUDENT_PIN', { student: studentName, oldPin: '****' }, { newPin: '****' });
        return sendJson({ success: true, message: `PIN reset successfully. SMS notifications sent to ${db.students[sIdx].parentPhone}.` });
      }

      if (pathname === '/api/students/limit') {
        const db = load_db();
        const { studentId, limit } = input;
        const sIdx = (db.students || []).findIndex((s: any) => s.id === studentId);
        if (sIdx === -1) {
          return sendError('Student not found.', 404);
        }
        const oldLimit = db.students[sIdx].noPinLimit;
        db.students[sIdx].noPinLimit = parseInt(limit, 10);
        save_db(db);

        audit('PARENT', 'Parent', 'PARENT', 'SET_STUDENT_SPEND_LIMIT', { name: db.students[sIdx].name, oldLimit }, { newLimit: limit });
        return sendJson({ success: true, message: `Pocket money transaction limit updated to ${Number(limit).toLocaleString()} UGX.` });
      }

      if (pathname === '/api/parents/allocate') {
        const db = load_db();
        const { parentPhone, studentId, amount } = input;
        const amt = parseInt(amount, 10);
        if (amt <= 0) {
          return sendError('Allocation amount must be greater than zero.', 400);
        }

        const parent = (db.parents || []).find((p: any) => p.phone === parentPhone);
        const student = (db.students || []).find((s: any) => s.id === studentId);
        if (!parent || !student) {
          return sendError('Parent or Student index not found.', 404);
        }

        const parentWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === parent.id && w.ownerType === 'PARENT');
        const studentWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === student.id && w.ownerType === 'STUDENT');

        if (parentWalletIdx === -1 || studentWalletIdx === -1) {
          return sendError('Ledger wallets missing.', 404);
        }

        if (db.wallets[parentWalletIdx].balance < amt) {
          return sendError('Insufficient Parent wallet balance. Please Top Up.', 400);
        }

        db.wallets[parentWalletIdx].balance -= amt;
        db.wallets[studentWalletIdx].balance += amt;
        db.wallets[parentWalletIdx].lastTransactionDate = new Date().toISOString();
        db.wallets[studentWalletIdx].lastTransactionDate = new Date().toISOString();

        const refCode = generate_ref('TXN');
        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: `tx_${Date.now()}`,
          referenceCode: refCode,
          senderWalletId: db.wallets[parentWalletIdx].id,
          receiverWalletId: db.wallets[studentWalletIdx].id,
          amount: amt,
          fee: 0,
          type: 'DEPOSIT',
          status: 'SUCCESS',
          description: `Pocket Money Allocated to ${student.name}`,
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit('PARENT', parent.name, 'PARENT', 'ALLOCATE_POCKET_MONEY', null, { student: student.name, amount: amt });

        return sendJson({ success: true, message: `Transferred ${amt.toLocaleString()} UGX safely to ${student.name}.` });
      }

      if (pathname === '/api/pos/checkout') {
        const db = load_db();
        const { studentId, vendorId, items, total, pin } = input;
        const amt = parseInt(total, 10);

        const student = (db.students || []).find((s: any) => s.id === studentId);
        const vendor = (db.vendors || []).find((v: any) => v.id === vendorId);

        if (!student || !vendor) {
          return sendError('Required merchant or student nodes not found.', 404);
        }

        const studentWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === student.id && w.ownerType === 'STUDENT');
        const vendorWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === vendor.id && w.ownerType === 'VENDOR');
        const platformWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerType === 'PLATFORM');

        const school = (db.schools || []).find((s: any) => s.id === vendor.schoolId);
        const schoolWalletIdx = school ? (db.wallets || []).findIndex((w: any) => w.ownerId === school.id && w.ownerType === 'SCHOOL') : -1;

        if (studentWalletIdx === -1 || vendorWalletIdx === -1) {
          return sendError('Transactional wallets missing.', 404);
        }

        if (db.wallets[studentWalletIdx].status !== 'ACTIVE') {
          return sendError('Student wallet is inactive or suspended.', 400);
        }

        if (db.wallets[studentWalletIdx].balance < amt) {
          return sendError(`Insufficient pocket money balance. Card holds ${db.wallets[studentWalletIdx].balance.toLocaleString()} UGX.`, 400);
        }

        if (amt > student.noPinLimit) {
          if (!pin) {
            res.statusCode = 400;
            return res.end(JSON.stringify({ success: false, pinRequired: true, error: 'Transaction exceeds standard daily PIN-less limit. PIN required.' }));
          }
          if (student.pin !== pin) {
            return sendError('Invalid Student PIN code. Transaction unauthorized.', 400);
          }
        }

        const schoolCommRate = school ? school.commissionRate : 1;
        const platformCommRate = 0.5;

        const schoolPart = Math.floor((amt * schoolCommRate) / 100);
        const platformPart = Math.floor((amt * platformCommRate) / 100);
        const vendorPart = amt - schoolPart - platformPart;

        db.wallets[studentWalletIdx].balance -= amt;
        db.wallets[vendorWalletIdx].balance += vendorPart;

        if (schoolWalletIdx !== -1 && schoolPart > 0) {
          db.wallets[schoolWalletIdx].balance += schoolPart;
          db.wallets[schoolWalletIdx].lastTransactionDate = new Date().toISOString();
        }
        if (platformWalletIdx !== -1 && platformPart > 0) {
          db.wallets[platformWalletIdx].balance += platformPart;
          db.wallets[platformWalletIdx].lastTransactionDate = new Date().toISOString();
        }

        db.wallets[studentWalletIdx].lastTransactionDate = new Date().toISOString();
        db.wallets[vendorWalletIdx].lastTransactionDate = new Date().toISOString();

        if (!db.catalogItems) db.catalogItems = [];
        for (const it of (items || [])) {
          const catIdx = db.catalogItems.findIndex((c: any) => c.vendorId === vendorId && c.name.toLowerCase() === it.name.toLowerCase());
          if (catIdx !== -1) {
            db.catalogItems[catIdx].usageCount += (it.quantity || 1);
          } else {
            db.catalogItems.push({
              id: `c_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
              vendorId,
              name: it.name,
              price: parseInt(it.price, 10),
              usageCount: parseInt(it.quantity || 1, 10),
              category: 'FOOD'
            });
          }
        }

        const refCode = generate_ref('TXN');
        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: `tx_${Date.now()}`,
          referenceCode: refCode,
          senderWalletId: db.wallets[studentWalletIdx].id,
          receiverWalletId: db.wallets[vendorWalletIdx].id,
          amount: amt,
          fee: schoolPart + platformPart,
          type: 'SPEND',
          status: 'SUCCESS',
          description: `POS purchase at ${vendor.name}`,
          createdAt: new Date().toISOString()
        });

        if (platformPart > 0) {
          db.transactions.push({
            id: `tx_plat_${Date.now()}`,
            referenceCode: refCode,
            senderWalletId: db.wallets[studentWalletIdx].id,
            receiverWalletId: 'W_PLAT',
            amount: platformPart,
            fee: 0,
            type: 'COMMISSION_SPLIT',
            status: 'SUCCESS',
            description: 'Platform 0.5% Commission share',
            createdAt: new Date().toISOString()
          });
        }

        if (schoolWalletIdx !== -1 && schoolPart > 0) {
          db.transactions.push({
            id: `tx_sch_${Date.now()}`,
            referenceCode: refCode,
            senderWalletId: db.wallets[studentWalletIdx].id,
            receiverWalletId: db.wallets[schoolWalletIdx].id,
            amount: schoolPart,
            fee: 0,
            type: 'COMMISSION_SPLIT',
            status: 'SUCCESS',
            description: `School ${schoolCommRate}% Commission share`,
            createdAt: new Date().toISOString()
          });
        }

        save_db(db);
        audit('VENDOR', vendor.name, 'VENDOR', 'POS_SALE_COMPLETED', null, { student: student.name, total: amt });

        return sendJson({
          success: true,
          referenceCode: refCode,
          message: 'Payment completed successfully.',
          newBalance: db.wallets[studentWalletIdx].balance,
          vendorReceived: vendorPart
        });
      }

      if (pathname === '/api/pos/refund') {
        const db = load_db();
        const { transactionId, vendorPin, vendorId } = input;
        const txnIdx = (db.transactions || []).findIndex((t: any) => t.id === transactionId || t.referenceCode === transactionId);
        if (txnIdx === -1) {
          return sendError('Transaction record not found.', 404);
        }

        const txn = db.transactions[txnIdx];
        const vendor = (db.vendors || []).find((v: any) => v.id === vendorId);
        if (!vendor) {
          return sendError('Merchant registry missing.', 404);
        }

        const elapsed = Date.now() - new Date(txn.createdAt).getTime();
        if (elapsed > 86400000) {
          return sendError('Refund window exceeded. Transaction occurred > 24 hours ago.', 400);
        }

        if (vendorPin !== '1234') {
          return sendError('Invalid Manager PIN code. Refund unauthorized.', 401);
        }

        const senderWalletIdx = (db.wallets || []).findIndex((w: any) => w.id === txn.senderWalletId);
        const receiverWalletIdx = (db.wallets || []).findIndex((w: any) => w.id === txn.receiverWalletId);

        if (senderWalletIdx === -1 || receiverWalletIdx === -1) {
          return sendError('Unable to locate ledger wallets associated with this refund.', 400);
        }

        db.wallets[senderWalletIdx].balance += txn.amount;
        db.wallets[receiverWalletIdx].balance -= (txn.amount - (txn.fee || 0));

        db.transactions[txnIdx].status = 'FAILED';
        db.transactions.push({
          id: `tx_ref_${Date.now()}`,
          referenceCode: generate_ref('REF'),
          senderWalletId: db.wallets[receiverWalletIdx].id,
          receiverWalletId: db.wallets[senderWalletIdx].id,
          amount: txn.amount,
          fee: 0,
          type: 'REFUND',
          status: 'SUCCESS',
          description: `Refunded: Original ref ${txn.referenceCode}`,
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit('VENDOR', vendor.name, 'VENDOR', 'POS_REFUND_EXECUTED', { amount: txn.amount }, { ref: txn.referenceCode });

        return sendJson({ success: true, message: 'Transaction fully refunded to Student card ledger.' });
      }

      if (pathname === '/api/collecto/deposit') {
        const db = load_db();
        const { parentPhone, amount } = input;
        const amt = parseInt(amount, 10);

        const parent = (db.parents || []).find((p: any) => p.phone === parentPhone);
        if (!parent) {
          return sendError('Parent wallet account not found.', 404);
        }

        const walletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === parent.id && w.ownerType === 'PARENT');
        if (walletIdx === -1) {
          return sendError('Wallet missing.', 404);
        }

        const txId = `tx_col_${Date.now()}`;
        const refCode = generate_ref('COL-DEP');

        const username = process.env.COLLECTO_USERNAME;
        const apiKey = process.env.COLLECTO_API_KEY;

        if (username && apiKey) {
          try {
            const url = `https://collecto.cissytech.com/api/${encodeURIComponent(username)}/requestToPay`;
            const response = await fetch(url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey
              },
              body: JSON.stringify({
                paymentOption: 'mobilemoney',
                phone: parentPhone.replace('+', ''),
                amount: amt,
                reference: refCode
              })
            });

            const resData: any = await response.json();
            if (response.ok && (resData.status || resData.transactionId)) {
              const collectoId = resData.transactionId || refCode;

              if (!db.transactions) db.transactions = [];
              db.transactions.push({
                id: txId,
                referenceCode: refCode,
                collectoTxId: collectoId,
                senderWalletId: 'COLLECTO_GATEWAY',
                receiverWalletId: db.wallets[walletIdx].id,
                amount: amt,
                fee: 1000,
                type: 'DEPOSIT',
                status: 'PENDING',
                description: 'Pending Collecto MTN/Airtel Push',
                createdAt: new Date().toISOString(),
                realIntegration: true
              });

              save_db(db);
              audit('PARENT', parent.name, 'PARENT', 'COLLECTO_REAL_PUSH_INITIATED', null, { refCode, amount: amt, collectoTxId: collectoId });

              return sendJson({
                success: true,
                transactionId: txId,
                referenceCode: refCode,
                collectoTxId: collectoId,
                realIntegration: true,
                message: 'Collecto push successfully initiated. Please enter your mobile money PIN to authorize.'
              });
            } else {
              return sendError(resData.message || `Collecto gateway returned error state (HTTP ${response.status})`, 400);
            }
          } catch (e: any) {
            return sendError(`Failed to connect to Collecto: ${e.message}`, 500);
          }
        }

        // Mock / Simulation Fallback
        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: txId,
          referenceCode: refCode,
          senderWalletId: 'COLLECTO_GATEWAY',
          receiverWalletId: db.wallets[walletIdx].id,
          amount: amt,
          fee: 1000,
          type: 'DEPOSIT',
          status: 'PENDING',
          description: 'Pending Collecto MTN/Airtel Push',
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit('PARENT', parent.name, 'PARENT', 'COLLECTO_PUSH_INITIATED', null, { refCode, amount: amt });

        return sendJson({
          success: true,
          transactionId: txId,
          referenceCode: refCode,
          message: 'Collecto push sent to your mobile phone. Enter MTN/Airtel PIN to authorize.'
        });
      }

      if (pathname === '/api/collecto/withdraw') {
        const db = load_db();
        const { vendorId, amount, phone } = input;
        const amt = parseInt(amount, 10);

        const vendor = (db.vendors || []).find((v: any) => v.id === vendorId);
        if (!vendor) {
          return sendError('Vendor not registered.', 404);
        }

        const walletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === vendorId && w.ownerType === 'VENDOR');
        if (walletIdx === -1) {
          return sendError('Merchant wallet index missing.', 404);
        }

        if (db.wallets[walletIdx].balance < amt) {
          return sendError('Insufficient balance to withdraw requested funds.', 400);
        }

        db.wallets[walletIdx].balance -= amt;
        db.wallets[walletIdx].lastTransactionDate = new Date().toISOString();

        const txId = `tx_col_w_${Date.now()}`;
        const refCode = generate_ref('COL-WIT');

        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: txId,
          referenceCode: refCode,
          senderWalletId: db.wallets[walletIdx].id,
          receiverWalletId: 'COLLECTO_PAYOUT_GATEWAY',
          amount: amt,
          fee: 1500,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          description: `Mobile Money Payout to ${phone}`,
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit('VENDOR', vendor.name, 'VENDOR', 'COLLECTO_WITHDRAW_INITIATED', null, { refCode, amount: amt });

        return sendJson({
          success: true,
          transactionId: txId,
          referenceCode: refCode,
          message: `Payout request processed. Pre-deduction of ${amt.toLocaleString()} UGX applied. Polling active.`
        });
      }

      if (pathname === '/api/loans/apply') {
        const db = load_db();
        const { productId, borrowerId, borrowerType, amount } = input;
        const amt = parseInt(amount, 10);

        const product = (db.loanProducts || []).find((p: any) => p.id === productId);
        if (!product) {
          return sendError('Selected loan product not recognized.', 404);
        }

        if (amt < product.minAmount || amt > product.maxAmount) {
          return sendError(`Invalid amount. Must range between ${product.minAmount.toLocaleString()} - ${product.maxAmount.toLocaleString()} UGX.`, 400);
        }

        const hasActive = (db.loans || []).some((l: any) => l.borrowerId === borrowerId && l.status === 'ACTIVE');
        if (hasActive) {
          return sendError('You already have an outstanding active loan. Repay to clear.', 400);
        }

        const scoreObj = (db.creditScores || []).find((cs: any) => cs.ownerId === borrowerId);
        const score = scoreObj ? scoreObj.score : 65;

        if (score < 50) {
          return sendError(`Credit rating score (${score}) insufficient. Minimal requirements is 50.`, 400);
        }

        let walletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === borrowerId);
        if (walletIdx === -1) {
          if (!db.wallets) db.wallets = [];
          db.wallets.push({
            id: `W_${borrowerId}`,
            ownerId: borrowerId,
            ownerType: borrowerType,
            balance: 0,
            status: 'ACTIVE',
            lastTransactionDate: new Date().toISOString()
          });
          walletIdx = db.wallets.length - 1;
        }

        const interest = Math.floor((amt * product.interestRate) / 100);
        const totalRepayable = amt + interest;
        const dueDate = new Date(Date.now() + product.durationDays * 86400000).toISOString();

        const loan = {
          id: `loan_${Date.now()}`,
          productId,
          borrowerId,
          borrowerType,
          amount: amt,
          interest,
          totalRepayable,
          amountPaid: 0,
          status: 'ACTIVE',
          dueDate,
          createdAt: new Date().toISOString()
        };

        if (!db.loans) db.loans = [];
        db.loans.push(loan);
        db.wallets[walletIdx].balance += amt;
        db.wallets[walletIdx].lastTransactionDate = new Date().toISOString();

        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: `tx_loan_dis_${Date.now()}`,
          referenceCode: generate_ref('LON-DIS'),
          senderWalletId: 'PLAT_CREDIT_POOL',
          receiverWalletId: db.wallets[walletIdx].id,
          amount: amt,
          fee: 0,
          type: 'LOAN_DISBURSE',
          status: 'SUCCESS',
          description: `Disbursement of ${product.name || 'Micro Loan'}`,
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit(borrowerId, `Borrower: ${borrowerType}`, borrowerType, 'LOAN_DISBURSED', null, { amount: amt, totalRepayable });

        return sendJson({
          success: true,
          message: `Congratulations! Your loan of ${amt.toLocaleString()} UGX has been approved and disbursed instantly to your wallet.`,
          loan
        });
      }

      if (pathname === '/api/loans/repay') {
        const db = load_db();
        const { loanId, amount } = input;
        const amt = parseInt(amount, 10);

        const loanIdx = (db.loans || []).findIndex((l: any) => l.id === loanId);
        if (loanIdx === -1) {
          return sendError('Loan index missing.', 404);
        }

        const loan = db.loans[loanIdx];
        const walletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === loan.borrowerId);
        if (walletIdx === -1) {
          return sendError('Borrower wallet not located.', 404);
        }

        const remaining = loan.totalRepayable - loan.amountPaid;
        if (db.wallets[walletIdx].balance < amt) {
          return sendError('Insufficient wallet balance to process this loan repayment.', 400);
        }

        const finalPay = Math.min(amt, remaining);
        db.wallets[walletIdx].balance -= finalPay;
        db.loans[loanIdx].amountPaid += finalPay;
        db.wallets[walletIdx].lastTransactionDate = new Date().toISOString();

        if (db.loans[loanIdx].amountPaid >= db.loans[loanIdx].totalRepayable) {
          db.loans[loanIdx].status = 'PAID';
        }

        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: `tx_loan_rep_${Date.now()}`,
          referenceCode: generate_ref('LON-REP'),
          senderWalletId: db.wallets[walletIdx].id,
          receiverWalletId: 'PLAT_CREDIT_POOL',
          amount: finalPay,
          fee: 0,
          type: 'LOAN_REPAY',
          status: 'SUCCESS',
          description: `Repayment for loan ID ${loan.id}`,
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit(loan.borrowerId, 'Borrower', loan.borrowerType || 'PARENT', 'LOAN_REPAYMENT_SUBMITTED', null, { amountRepaid: finalPay });

        return sendJson({
          success: true,
          message: `Repayment of ${finalPay.toLocaleString()} UGX completed successfully.`,
          remaining: db.loans[loanIdx].totalRepayable - db.loans[loanIdx].amountPaid
        });
      }

      if (pathname === '/api/pos/generate-payment-qr') {
        const db = load_db();
        const { vendorId, amount, items } = input;
        const amt = parseInt(amount, 10);

        if (!vendorId || amt <= 0) {
          return sendError('Invalid merchant or checkout amount.', 400);
        }

        const vendor = (db.vendors || []).find((v: any) => v.id === vendorId);
        if (!vendor) {
          return sendError('Merchant vendor not found.', 404);
        }

        const txId = `tx_qr_${Date.now()}`;
        const refCode = generate_ref('QR-PAY');

        let descItems = 'POS Purchase';
        if (Array.isArray(items) && items.length > 0) {
          descItems = items.map((it: any) => `${it.name} x${it.quantity || 1}`).join(', ');
        }

        if (!db.transactions) db.transactions = [];
        db.transactions.push({
          id: txId,
          referenceCode: refCode,
          senderWalletId: 'PENDING_SCAN_PAY',
          receiverWalletId: `W_${vendorId}`,
          amount: amt,
          fee: Math.floor(amt * 0.015),
          type: 'SPEND',
          status: 'PENDING',
          description: `POS QR Pay: ${descItems}`,
          createdAt: new Date().toISOString()
        });

        save_db(db);
        audit('VENDOR', vendor.name, 'VENDOR', 'DYNAMIC_QR_CODE_GENERATED', { amount: amt }, { refCode });

        const host = req.headers.host || 'localhost:3000';
        const proto = req.headers['x-forwarded-proto'] || 'http';
        const paymentUrl = `${proto}://${host}/pay?ref=${refCode}`;

        return sendJson({
          success: true,
          transactionId: txId,
          referenceCode: refCode,
          paymentUrl,
          amount: amt
        });
      }

      if (pathname === '/api/pos/complete-dynamic-payment') {
        const db = load_db();
        const { refCode, fundingSource, studentId, parentId, pin } = input;

        const txnIdx = (db.transactions || []).findIndex((t: any) => t.referenceCode === refCode);
        if (txnIdx === -1) {
          return sendError('Dynamic transaction request not found.', 404);
        }

        const txn = db.transactions[txnIdx];
        if (txn.status === 'SUCCESS') {
          return sendError('Payment has already been completed.', 400);
        }
        if (txn.status !== 'PENDING') {
          return sendError('Transaction is not in pending state.', 400);
        }

        const receiverWalletIdx = (db.wallets || []).findIndex((w: any) => w.id === txn.receiverWalletId);
        const vendor = (db.vendors || []).find((v: any) => `W_${v.id}` === txn.receiverWalletId);

        if (receiverWalletIdx === -1 || !vendor) {
          return sendError('Receiver merchant wallet is unavailable.', 404);
        }

        const school = (db.schools || []).find((s: any) => s.id === vendor.schoolId);
        const schoolWalletIdx = school ? (db.wallets || []).findIndex((w: any) => w.ownerId === school.id && w.ownerType === 'SCHOOL') : -1;
        const platformWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerType === 'PLATFORM');

        const schoolCommRate = school ? school.commissionRate : 1;
        const platformCommRate = 0.5;

        const schoolPart = Math.floor((txn.amount * schoolCommRate) / 100);
        const platformPart = Math.floor((txn.amount * platformCommRate) / 100);
        const vendorPart = txn.amount - schoolPart - platformPart;

        if (fundingSource === 'MOMO') {
          db.wallets[receiverWalletIdx].balance += vendorPart;
          db.wallets[receiverWalletIdx].lastTransactionDate = new Date().toISOString();

          if (schoolWalletIdx !== -1 && schoolPart > 0) {
            db.wallets[schoolWalletIdx].balance += schoolPart;
            db.wallets[schoolWalletIdx].lastTransactionDate = new Date().toISOString();
          }
          if (platformWalletIdx !== -1 && platformPart > 0) {
            db.wallets[platformWalletIdx].balance += platformPart;
            db.wallets[platformWalletIdx].lastTransactionDate = new Date().toISOString();
          }

          db.transactions[txnIdx].senderWalletId = 'MOMO-PAY-INTEGRATION';
          db.transactions[txnIdx].status = 'SUCCESS';
          db.transactions[txnIdx].description = `Dynamic QR Pay (MoMo Cash Out): ${txn.description}`;

          save_db(db);
          audit('VENDOR', vendor.name, 'VENDOR', 'DYNAMIC_QR_PAY_MOMO_COMPLETED', { amount: txn.amount }, { refCode });

          return sendJson({
            success: true,
            message: `Payment of ${txn.amount.toLocaleString()} UGX completed successfully via Mobile Money!`
          });
        }

        if (fundingSource === 'STUDENT') {
          const student = (db.students || []).find((s: any) => s.id === studentId);
          if (!student) {
            return sendError('Student card account not found.', 404);
          }
          if (student.pin !== pin) {
            return sendError('Invalid 4-digit Student PIN code.', 401);
          }

          const studentWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === student.id && w.ownerType === 'STUDENT');
          if (studentWalletIdx === -1) {
            return sendError('Student wallet ledger not found.', 404);
          }

          if (db.wallets[studentWalletIdx].balance < txn.amount) {
            return sendError(`Insufficient pocket money balance. Card holds ${db.wallets[studentWalletIdx].balance.toLocaleString()} UGX.`, 400);
          }

          db.wallets[studentWalletIdx].balance -= txn.amount;
          db.wallets[studentWalletIdx].lastTransactionDate = new Date().toISOString();

          db.wallets[receiverWalletIdx].balance += vendorPart;
          db.wallets[receiverWalletIdx].lastTransactionDate = new Date().toISOString();

          if (schoolWalletIdx !== -1 && schoolPart > 0) {
            db.wallets[schoolWalletIdx].balance += schoolPart;
            db.wallets[schoolWalletIdx].lastTransactionDate = new Date().toISOString();
          }
          if (platformWalletIdx !== -1 && platformPart > 0) {
            db.wallets[platformWalletIdx].balance += platformPart;
            db.wallets[platformWalletIdx].lastTransactionDate = new Date().toISOString();
          }

          db.transactions[txnIdx].senderWalletId = db.wallets[studentWalletIdx].id;
          db.transactions[txnIdx].status = 'SUCCESS';
          db.transactions[txnIdx].description = `Dynamic QR Pay (Student Debit): ${txn.description}`;

          save_db(db);
          audit('STUDENT', student.name, 'STUDENT', 'DYNAMIC_QR_PAY_DEBITED', { amount: txn.amount }, { refCode });

          return sendJson({
            success: true,
            message: `Payment of ${txn.amount.toLocaleString()} UGX successfully authorized! debited from ${student.name}'s card.`
          });
        }

        if (fundingSource === 'PARENT') {
          const parent = (db.parents || []).find((p: any) => p.id === parentId);
          if (!parent) {
            return sendError('Parent wallet account not found.', 404);
          }
          if (pin !== '1234') {
            return sendError('Invalid 4-digit Parent PIN code.', 401);
          }

          const parentWalletIdx = (db.wallets || []).findIndex((w: any) => w.ownerId === parent.id && w.ownerType === 'PARENT');
          if (parentWalletIdx === -1) {
            return sendError('Parent wallet ledger not found.', 404);
          }

          if (db.wallets[parentWalletIdx].balance < txn.amount) {
            return sendError(`Insufficient parent wallet balance. Available: ${db.wallets[parentWalletIdx].balance.toLocaleString()} UGX.`, 400);
          }

          db.wallets[parentWalletIdx].balance -= txn.amount;
          db.wallets[parentWalletIdx].lastTransactionDate = new Date().toISOString();

          db.wallets[receiverWalletIdx].balance += vendorPart;
          db.wallets[receiverWalletIdx].lastTransactionDate = new Date().toISOString();

          if (schoolWalletIdx !== -1 && schoolPart > 0) {
            db.wallets[schoolWalletIdx].balance += schoolPart;
            db.wallets[schoolWalletIdx].lastTransactionDate = new Date().toISOString();
          }
          if (platformWalletIdx !== -1 && platformPart > 0) {
            db.wallets[platformWalletIdx].balance += platformPart;
            db.wallets[platformWalletIdx].lastTransactionDate = new Date().toISOString();
          }

          db.transactions[txnIdx].senderWalletId = db.wallets[parentWalletIdx].id;
          db.transactions[txnIdx].status = 'SUCCESS';
          db.transactions[txnIdx].description = `Dynamic QR Pay (Parent Debit): ${txn.description}`;

          save_db(db);
          audit('PARENT', parent.name, 'PARENT', 'DYNAMIC_QR_PAY_PARENT_DEBITED', { amount: txn.amount }, { refCode });

          return sendJson({
            success: true,
            message: `Payment of ${txn.amount.toLocaleString()} UGX completed successfully! debited from ${parent.name}'s parent wallet.`
          });
        }

        return sendError('Unknown funding source method.', 400);
      }
    });
  }
}
