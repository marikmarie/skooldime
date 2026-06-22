export type PaymentCategory = 'canteen' | 'uniform' | 'tuition' | 'library' | 'sports' | 'other';

export interface Student {
  cardId: string;
  name: string;
  classroom: string;
  currentBalance: number;
  dailyLimit: number;
  pinLessLimit: number; // PIN-less transactions under this amount
  parentName: string;
  parentPhone: string;
  pinCode: string; // 4-digit PIN
  cardStatus: 'active' | 'suspended';
  avatarSeed: string; // seed for avatar generator
}

export interface Transaction {
  id: string;
  amount: number;
  category: PaymentCategory;
  categoryLabel: string;
  timestamp: Date;
  studentName: string;
  studentCardId: string;
  status: 'completed' | 'pending' | 'failed';
  merchantName: string;
  referenceId: string;
}

export interface NotificationMsg {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'warning';
  timestamp: Date;
}
