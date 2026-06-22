// change

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  School, 
  Coins, 
  TrendingUp, 
  Users, 
  Settings, 
  UserPlus, 
  HelpCircle, 
  ShieldCheck, 
  ArrowRight,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { Student, Transaction, PaymentCategory } from './lib/types';
import { INITIAL_STUDENTS, INITIAL_TRANSACTIONS } from './lib/data';
import LandingHero from './components/LandingHero';
import AdminDashboard from './components/AdminDashboard';
import VendorPOS from './components/VendorPOS';
import ParentPortal from './components/ParentPortal';

export default function App() {
  const [activeRole, setActiveRole] = useState<'home' | 'admin' | 'vendor' | 'parent'>('home');
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Global Card Status Toggle handler
  const handleToggleCardStatus = (cardId: string) => {
    setStudents(prev => prev.map(student => {
      if (student.cardId === cardId) {
        return {
          ...student,
          cardStatus: student.cardStatus === 'active' ? 'suspended' : 'active'
        };
      }
      return student;
    }));
  };

  // Global OTC Cash Top-Up or Mobile Money Crediting handler
  const handleTopUpWallet = (cardId: string, amount: number) => {
    setStudents(prev => prev.map(student => {
      if (student.cardId === cardId) {
        return {
          ...student,
          currentBalance: student.currentBalance + amount
        };
      }
      return student;
    }));
  };

  // Update allowances caps and rules for children
  const handleUpdateAllowanceSettings = (cardId: string, dailyLimit: number, pinLessLimit: number) => {
    setStudents(prev => prev.map(student => {
      if (student.cardId === cardId) {
        return {
          ...student,
          dailyLimit,
          pinLessLimit
        };
      }
      return student;
    }));
  };

  // Add a new cashless terminal transaction
  const handleAddTransaction = (newTx: {
    amount: number;
    category: PaymentCategory;
    categoryLabel: string;
    studentName: string;
    studentCardId: string;
    merchantName: string;
  }): 'approved' | 'nsf' | 'limits_exceeded' | 'suspended' => {
    
    // Find current student
    const studentIndex = students.findIndex(s => s.cardId === newTx.studentCardId);
    if (studentIndex === -1) return 'suspended';
    
    const student = students[studentIndex];

    // Card status validation
    if (student.cardStatus === 'suspended') {
      return 'suspended';
    }

    // Insufficient Funds balance check
    if (student.currentBalance < newTx.amount) {
      return 'nsf';
    }

    // Daily Spending cap compliance check
    if (newTx.amount > student.dailyLimit) {
      return 'limits_exceeded';
    }

    // Process balances decrease
    setStudents(prev => prev.map(s => {
      if (s.cardId === student.cardId) {
        return {
          ...s,
          currentBalance: s.currentBalance - newTx.amount
        };
      }
      return s;
    }));

    // Append to transactions array in real-time
    const transactionRecord: Transaction = {
      id: 'tx-' + Math.floor(1007 + Math.random() * 9000),
      amount: newTx.amount,
      category: newTx.category,
      categoryLabel: newTx.categoryLabel,
      timestamp: new Date(),
      studentName: student.name,
      studentCardId: student.cardId,
      status: 'completed',
      merchantName: newTx.merchantName,
      referenceId: 'TXN-' + Math.floor(1000000 + Math.random() * 9000000)
    };

    setTransactions(prev => [transactionRecord, ...prev]);
    return 'approved';
  };

  return (
    <div id="skooldime_app_root" className="min-h-screen flex flex-col bg-slate-50 text-slate-800 selection:bg-[#fcf2ed] selection:text-[#d4805e]">
      
      {/* Universal Floating Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
          
          {/* Logo Brand Brand */}
          <button 
            onClick={() => setActiveRole('home')}
            className="flex items-center gap-3 group text-left cursor-pointer"
          >
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#d4805e] to-[#e8956f] text-white font-display font-semibold text-lg shadow-sm group-hover:scale-105 transition-transform">
              S
            </div>
            <div>
              <span className="font-display font-bold text-slate-900 tracking-tight text-lg block">SkoolDime</span>
              <span className="text-[10px] font-mono font-medium text-slate-400 mt-0.5 block uppercase tracking-wider">Cashless Schooling</span>
            </div>
          </button>

          {/* Quick Active workspace indicators (Anchor routing simulator) */}
          <nav className="hidden lg:flex items-center gap-1.5 font-sans text-xs font-semibold">
            <button 
              onClick={() => setActiveRole('home')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                activeRole === 'home' 
                  ? 'bg-slate-100/80 text-slate-900 font-bold' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              Public Hub
            </button>
            <span className="h-3 w-px bg-slate-200" />
            <button 
              onClick={() => setActiveRole('admin')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeRole === 'admin' 
                  ? 'bg-slate-100/80 text-[#d4805e] font-bold' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Users className="h-3.5 w-3.5" /> School Admin
            </button>
            <button 
              onClick={() => setActiveRole('vendor')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeRole === 'vendor' 
                  ? 'bg-slate-100/80 text-[#d4805e] font-bold' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" /> Cashier POS
            </button>
            <button 
              onClick={() => setActiveRole('parent')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeRole === 'parent' 
                  ? 'bg-slate-100/80 text-[#d4805e] font-bold' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/50'
              }`}
            >
              <Coins className="h-3.5 w-3.5" /> Parent Portal
            </button>
          </nav>

          {/* Quick Launcher drop indicator */}
          <div className="flex items-center gap-2">
            
            {/* Live Flag accent for localization */}
            <div className="flex h-5 items-center gap-0.5 border border-slate-200 px-1.5 py-0.5 rounded bg-slate-50 font-mono text-[9px] text-slate-400 font-semibold uppercase">
              {/* Uganda flag colors simulation: Black, Yellow, Red, Black, Yellow, Red */}
              <div className="flex gap-[1px] h-3.5">
                <span className="w-[1.5px] bg-black" />
                <span className="w-[1.5px] bg-[#fcc419]" />
                <span className="w-[1.5px] bg-[#e03131]" />
              </div>
              <span className="ml-1 tracking-wider text-slate-500">UGX • UG</span>
            </div>

            <button 
              onClick={() => {
                if (activeRole === 'home') {
                  const selector = document.getElementById('sandbox_demo');
                  selector?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  setActiveRole('home');
                }
              }}
              className="px-4 py-2 bg-[#d4805e] hover:bg-[#c36f4d] text-white text-xs font-semibold rounded-lg shadow-xs active:scale-[0.98] transition-all flex items-center gap-1 hover:shadow-md cursor-pointer"
            >
              {activeRole === 'home' ? 'Open Sandbox' : 'Home Portal'} <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Primary Layout Frame */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeRole}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full"
          >
            {activeRole === 'home' && (
              <LandingHero 
                students={students} 
                onSelectRole={(role) => setActiveRole(role)} 
              />
            )}

            {activeRole === 'admin' && (
              <AdminDashboard 
                students={students} 
                transactions={transactions} 
                onToggleCardStatus={handleToggleCardStatus}
                onTopUpWallet={handleTopUpWallet}
                onNavigateHome={() => setActiveRole('home')}
              />
            )}

            {activeRole === 'vendor' && (
              <VendorPOS 
                students={students} 
                onAddTransaction={handleAddTransaction}
                onNavigateHome={() => setActiveRole('home')}
              />
            )}

            {activeRole === 'parent' && (
              <ParentPortal 
                students={students} 
                transactions={transactions} 
                onUpdateAllowanceSettings={handleUpdateAllowanceSettings}
                onTopUpWallet={handleTopUpWallet}
                onNavigateHome={() => setActiveRole('home')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Immersive Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4 md:col-span-2 text-left">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 flex items-center justify-center rounded-xl bg-gradient-to-br from-[#d4805e] to-[#e8956f] text-white font-display font-medium text-base">
                S
              </div>
              <span className="font-display font-bold text-[#e8956f] tracking-tight text-lg">SkoolDime</span>
            </div>
            <p className="text-xs text-slate-400 leading-normal max-w-sm">
              Securing school microfinance for educational institutions across East Africa. Fully integrated with Mobile Money USSD rails, smart keytags, and robust bursary analytics engines.
            </p>
            <p className="text-[10px] text-slate-500 font-mono">
              Demo Environment © {new Date().getFullYear()} SkoolDime Inc. All simulating gateways approved.
            </p>
          </div>

          <div className="text-left space-y-2.5">
            <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Fintech Architecture</h5>
            <ul className="text-xs text-slate-400 space-y-2">
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveRole('admin')}>Bursar Ledger Supervisor</li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveRole('vendor')}>Handheld Android POS Simulator</li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveRole('parent')}>Parent Wallet Allowance Gov</li>
              <li className="hover:text-white cursor-pointer" onClick={() => setActiveRole('home')}>Micro-Payment Sandbox</li>
            </ul>
          </div>

          <div className="text-left space-y-2.5">
            <h5 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider">Ugandan Mobile Rails</h5>
            <ul className="text-xs text-slate-400 space-y-2">
              <li>MTN MoMo API USSD Push</li>
              <li>Airtel Money Merchant Codes</li>
              <li>NFC Contactless RFID Chips</li>
              <li>PIN-less Speed Approvals Cap</li>
            </ul>
          </div>

        </div>
      </footer>

    </div>
  );
}
