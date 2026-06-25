export type UserRole = 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'AGENT' | 'SCHOOL_ADMIN' | 'VENDOR' | 'PARENT' | 'STUDENT' | 'STAFF';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  phone: string;
  email?: string;
  nin?: string;
  schoolId?: string;
  avatarUrl?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  name: string;
  admissionNo: string;
  class: string;
  qrHash: string;
  pin: string; // 4-digit numeric PIN
  parentPhone: string;
  isLinked: boolean;
  avatarUrl: string;
  noPinLimit: number; // Max UGX spend per day/txn without a PIN
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  nin: string;
  kycTier: 1 | 2; // 1 = Basic, 2 = Verified (with NIN)
  walletBalance: number;
}

export interface School {
  id: string;
  name: string;
  region: string;
  code: string;
  commissionRate: number; // % fee kept by school for POS transactions (e.g., 1%)
}

export interface Vendor {
  id: string;
  name: string;
  schoolId: string; // bound to a school
  phone: string;
  type: 'INDEPENDENT' | 'CANTEEN' | 'BOOKSHOP' | 'UNIFORM';
  commissionRate: number; // split kept by vendor (e.g., 99%)
  deviceBound: boolean;
  fingerprint?: string;
}

export interface Wallet {
  id: string; // matches studentId, vendorId, parentId, etc.
  ownerId: string;
  ownerType: 'STUDENT' | 'VENDOR' | 'SCHOOL' | 'PLATFORM' | 'STAFF' | 'PARENT';
  balance: number;
  status: 'ACTIVE' | 'DORMANT' | 'SUSPENDED';
  lastTransactionDate: string;
}

export interface Transaction {
  id: string;
  referenceCode: string;
  senderWalletId: string;
  receiverWalletId: string;
  amount: number;
  fee: number;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'SPEND' | 'LOAN_DISBURSE' | 'LOAN_REPAY' | 'REFUND' | 'COMMISSION_SPLIT';
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  description: string;
  createdAt: string;
}

export interface LoanProduct {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  interestRate: number; // Flat interest % (e.g., 5%)
  durationDays: number;
  targetRole: 'VENDOR' | 'STAFF' | 'PARENT';
}

export interface Loan {
  id: string;
  productId: string;
  borrowerId: string;
  borrowerType: 'VENDOR' | 'STAFF' | 'PARENT';
  amount: number;
  interest: number;
  totalRepayable: number;
  amountPaid: number;
  status: 'ACTIVE' | 'PAID' | 'DEFAULTED';
  dueDate: string;
  createdAt: string;
}

export interface CatalogItem {
  id: string;
  vendorId: string;
  name: string;
  price: number;
  usageCount: number;
  category: 'FOOD' | 'STATIONERY' | 'CLOTHING' | 'OTHER';
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  ipAddress: string;
  oldValues?: string; // JSON string
  newValues?: string; // JSON string
  createdAt: string;
}

export interface CreditScore {
  id: string;
  ownerId: string;
  score: number; // 0 - 100
  factors: {
    txCount30Days: number;
    depositFrequency: number;
    repaymentHistory: string;
  };
}
