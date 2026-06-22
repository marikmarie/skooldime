export type RoleSummary = {
  title: string;
  value: string;
  description: string;
};

export type Transaction = {
  id: string;
  date: string;
  amount: string;
  status: "Success" | "Pending" | "Failed";
  partner: string;
  type: string;
};

export type Product = {
  name: string;
  price: number;
  sold: number;
  category: string;
};

export type StudentProfile = {
  name: string;
  class: string;
  balance: number;
  noPinLimit: number;
};

export type TrendPoint = {
  label: string;
  value: number;
};

export type CategoryBreakdown = {
  name: string;
  amount: number;
  color: string;
};

export const dashboardCards: RoleSummary[] = [
  {
    title: "Daily Volume",
    value: "2.4M UGX",
    description: "Payment volume processed across schools today",
  },
  {
    title: "Active Wallets",
    value: "1,428",
    description: "Parents, students, vendors, and staff wallets in use",
  },
  {
    title: "POS Sales",
    value: "384",
    description: "Successful point-of-sale transactions in the last 12 hours",
  },
  {
    title: "Loan Requests",
    value: "72",
    description: "Pending micro-loan applications awaiting review",
  },
];

export const revenueTrend: TrendPoint[] = [
  { label: "Mon", value: 180 },
  { label: "Tue", value: 240 },
  { label: "Wed", value: 210 },
  { label: "Thu", value: 320 },
  { label: "Fri", value: 280 },
  { label: "Sat", value: 360 },
  { label: "Sun", value: 420 },
];

export const categoryBreakdown: CategoryBreakdown[] = [
  { name: "Food & Canteen", amount: 92000, color: "#0f4c81" },
  { name: "Stationery", amount: 52000, color: "#1c71b7" },
  { name: "Transport", amount: 38000, color: "#2d6d9a" },
  { name: "Top-ups", amount: 66000, color: "#7c99bf" },
];

export const vendorProducts: Product[] = [
  { name: "Chapati", price: 1000, sold: 134, category: "Food" },
  { name: "Notebook", price: 2000, sold: 72, category: "Stationery" },
  { name: "Bottled Water", price: 500, sold: 203, category: "Drink" },
  { name: "Soda", price: 800, sold: 116, category: "Drink" },
  { name: "Bread", price: 1200, sold: 45, category: "Bakery" },
  { name: "Recharge Card", price: 1500, sold: 28, category: "Services" },
];

export const vendorCart = {
  student: "Brian K.",
  studentClass: "P6A",
  total: 4200,
  noPinLimit: 5000,
  allowedPinless: true,
};

export const parentProfile = {
  name: "Martha N.",
  walletBalance: 180000,
  balanceCurrency: "UGX",
  children: [
    { name: "Aisha N.", class: "S3B", wallet: 32000 },
    { name: "Joel N.", class: "P5A", wallet: 14500 },
  ],
  recentTransactions: [
    { id: "TXN-701", date: "2026-06-18", amount: "-1,200 UGX", status: "Success", partner: "Vendor POS", type: "School Lunch" },
    { id: "TXN-702", date: "2026-06-17", amount: "+50,000 UGX", status: "Success", partner: "MoMo Deposit", type: "Wallet Top-Up" },
    { id: "TXN-703", date: "2026-06-16", amount: "-3,500 UGX", status: "Success", partner: "Stationery Shop", type: "Supplies" },
  ] as Transaction[],
};

export const schoolAdminStats = {
  totalStudents: 1320,
  vendors: 14,
  kycVerified: 84,
  dailyVolume: "1.1M UGX",
  studentList: [
    { name: "Joel O.", class: "S2A", balance: 48000, noPinLimit: 2000 },
    { name: "Sarah K.", class: "P6C", balance: 21500, noPinLimit: 3000 },
    { name: "James M.", class: "S1B", balance: 114000, noPinLimit: 5000 },
  ] as StudentProfile[],
};

export const vendorSalesTrend: TrendPoint[] = [
  { label: "Mon", value: 34 },
  { label: "Tue", value: 48 },
  { label: "Wed", value: 54 },
  { label: "Thu", value: 38 },
  { label: "Fri", value: 64 },
  { label: "Sat", value: 82 },
  { label: "Sun", value: 74 },
];

export const parentSpendingTrend: TrendPoint[] = [
  { label: "Mon", value: 15 },
  { label: "Tue", value: 28 },
  { label: "Wed", value: 20 },
  { label: "Thu", value: 33 },
  { label: "Fri", value: 27 },
  { label: "Sat", value: 38 },
  { label: "Sun", value: 44 },
];

export const recentTransactions: Transaction[] = [
  { id: "TXN-601", date: "2026-06-19", amount: "-2,000 UGX", status: "Success", partner: "POS Vendor", type: "Meals" },
  { id: "TXN-602", date: "2026-06-19", amount: "-1,500 UGX", status: "Success", partner: "Stationery", type: "Supplies" },
  { id: "TXN-603", date: "2026-06-19", amount: "+10,000 UGX", status: "Pending", partner: "MoMo", type: "Deposit" },
  { id: "TXN-604", date: "2026-06-18", amount: "-4,600 UGX", status: "Success", partner: "POS Vendor", type: "Groceries" },
];
