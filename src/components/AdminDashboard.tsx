import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  Search, 
  Coins, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  Filter, 
  CreditCard, 
  Plus, 
  Lock, 
  Unlock, 
  ArrowUpRight, 
  Utensils, 
  Shirt, 
  BookOpen, 
  GraduationCap, 
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { Student, Transaction, PaymentCategory } from '../lib/types';

interface AdminDashboardProps {
  students: Student[];
  transactions: Transaction[];
  onToggleCardStatus: (cardId: string) => void;
  onTopUpWallet: (cardId: string, amount: number) => void;
  onNavigateHome: () => void;
}

export default function AdminDashboard({
  students,
  transactions,
  onToggleCardStatus,
  onTopUpWallet,
  onNavigateHome,
}: AdminDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('All');
  const [selectedStatus, setSelectedStatus] = useState<string>('All');
  
  // Top-Up Dialog state
  const [showTopUpModal, setShowTopUpModal] = useState<string | null>(null); // holds student cardId
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [topUpError, setTopUpError] = useState<string>('');

  // Local state for success notification
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Extract distinct classroom list for filtering
  const classes = ['All', ...Array.from(new Set(students.map(s => s.classroom)))];

  // Filters
  const filteredStudents = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          s.cardId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.parentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All' || s.classroom === selectedClass;
    const matchesStatus = selectedStatus === 'All' || s.cardStatus === selectedStatus;
    
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Calculate high-fidelity metrics
  const totalBalanceInCirculation = students.reduce((acc, s) => acc + s.currentBalance, 0);
  const totalTransactionsCount = transactions.length;
  const totalVolumeToday = transactions
    .filter(tx => tx.timestamp.toDateString() === new Date().toDateString() && tx.status === 'completed')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // Mock monthly revenue for SVG Graph
  const chartData = [
    { month: 'Jan', fees: 28000000, pos: 5200000 },
    { month: 'Feb', fees: 45000000, pos: 8900000 },
    { month: 'Mar', fees: 62000000, pos: 12400000 },
    { month: 'Apr', fees: 38000000, pos: 9100000 },
    { month: 'May', fees: 71000000, pos: 15600000 },
    { month: 'Jun', fees: 84320000, pos: 18105000 },
  ];

  const maxVal = 100000000; // max value for charting scale (100M UGX)

  const handleOpenTopUp = (cardId: string) => {
    setShowTopUpModal(cardId);
    setTopUpAmount('10000');
    setTopUpError('');
  };

  const handleExecuteTopUp = () => {
    const numAmt = parseInt(topUpAmount, 10);
    if (isNaN(numAmt) || numAmt <= 0) {
      setTopUpError('Specify a valid dynamic amount above 0 UGX.');
      return;
    }
    if (numAmt > 500000) {
      setSuccessMsg(null);
      setTopUpError('Safety deposit threshold is capped at 500k UGX.');
      return;
    }

    if (showTopUpModal) {
      const student = students.find(s => s.cardId === showTopUpModal);
      onTopUpWallet(showTopUpModal, numAmt);
      setShowTopUpModal(null);
      setSuccessMsg(`Cash Top-Up: Credited ${numAmt.toLocaleString()} UGX to ${student?.name}'s card.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const getCategoryIcon = (category: PaymentCategory) => {
    switch (category) {
      case 'canteen': return <Utensils className="h-4 w-4 text-emerald-600" />;
      case 'uniform': return <Shirt className="h-4 w-4 text-purple-600" />;
      case 'tuition': return <GraduationCap className="h-4 w-4 text-amber-600" />;
      case 'library': return <BookOpen className="h-4 w-4 text-sky-600" />;
      case 'sports': return <Activity className="h-4 w-4 text-rose-600" />;
      default: return <Coins className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Toast Notifier */}
      <AnimatePresence>
        {successMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 border border-emerald-500/20 text-white px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 font-sans max-w-sm"
          >
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">System Broadcast</p>
              <p className="text-sm font-medium text-slate-100">{successMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 font-semibold uppercase tracking-wider">
              Fintech Supervisor Hub
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-slate-900">
            School Cashless Terminal
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Admin console for auditing terminal systems, managing student NFC cards, and top-ups.
          </p>
        </div>

        <button 
          onClick={onNavigateHome}
          className="self-start md:self-auto px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-930 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
        >
          ← Exit Terminal
        </button>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-xs transition-hover hover:border-slate-200">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[#fcf2ed] rounded-lg text-[#d4805e]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              +14% <ArrowUpRight className="h-3 w-3" />
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium font-sans uppercase tracking-wider">Total Fee Collections</span>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1">84,320,000 UGX</p>
            <span className="text-xs text-slate-500 mt-1 block">Term Cumulative</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-xs transition-hover hover:border-slate-200">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[#fcf2ed] rounded-lg text-[#d4805e]">
              <Coins className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">
              Stable
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium font-sans uppercase tracking-wider">Wallet Reserves</span>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1">
              {totalBalanceInCirculation.toLocaleString()} UGX
            </p>
            <span className="text-xs text-slate-500 mt-1 block">In circulation inside wallets</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-xs transition-hover hover:border-slate-200">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[#fcf2ed] rounded-lg text-[#d4805e]">
              <TrendingUp className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
              +8.2% today
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium font-sans uppercase tracking-wider">POS Payments Today</span>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1">
              {totalVolumeToday > 0 ? `${totalVolumeToday.toLocaleString()} UGX` : "24,800 UGX"}
            </p>
            <span className="text-xs text-slate-500 mt-1 block">Fast PIN-less merchant approvals</span>
          </div>
        </div>

        <div className="p-5 bg-white border border-slate-100 rounded-xl shadow-xs transition-hover hover:border-slate-200">
          <div className="flex justify-between items-start">
            <div className="p-2.5 bg-[#fcf2ed] rounded-lg text-[#d4805e]">
              <Users className="h-6 w-6" />
            </div>
            <span className="text-xs font-mono text-[#d4805e] bg-amber-50 px-2 py-0.5 rounded-full">
              94.6% Active
            </span>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-400 font-medium font-sans uppercase tracking-wider">Registered Cards</span>
            <p className="text-2xl font-bold font-display text-slate-900 mt-1">{students.length} Accounts</p>
            <span className="text-xs text-slate-500 mt-1 block">NFC IDs linked to parents</span>
          </div>
        </div>
      </div>

      {/* Analytics SVG Graph */}
      <div className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
          <div>
            <h3 className="font-display font-medium text-slate-900 text-lg">Fintech Cashless Growth Trend</h3>
            <p className="text-xs text-slate-500">Comparison of Tuition payments vs Cashless POS shop sales across school periods.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-3 w-3 rounded-xs bg-[#d4805e]" /> Tuition (UGX)
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <span className="h-3 w-3 rounded-xs bg-slate-900" /> POS Terminals Volume (UGX)
            </span>
          </div>
        </div>

        {/* Custom SVG Drawing chart for performance/portability instead of relying on slow library initialization */}
        <div className="w-full overflow-x-auto">
          <div className="min-w-[600px] h-64 pt-4 flex flex-col justify-between">
            <div className="relative flex-1 flex items-end justify-between border-b border-slate-100 pb-1 px-8 gap-12">
              {/* Chart Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                <div className="w-full border-t border-slate-100/50 h-0" />
                <div className="w-full border-t border-slate-100/50 h-0" />
                <div className="w-full border-t border-slate-100/50 h-0" />
                <div className="w-full border-t border-slate-100/50 h-0" />
              </div>

              {chartData.map((data) => {
                const heightFees = `${(data.fees / maxVal) * 100}%`;
                const heightPos = `${(data.pos / maxVal) * 100}%`;
                return (
                  <div key={data.month} className="flex-1 flex flex-col items-center group relative z-10">
                    <div className="w-full flex justify-center items-end gap-2.5 h-44">
                      {/* Tuition Bar */}
                      <div className="relative w-7 flex justify-center group-hover:scale-y-105 transition-all">
                        <div 
                          style={{ height: heightFees }}
                          className="w-full rounded-t-sm bg-gradient-to-t from-[#d4805e] to-[#e8956f]"
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white font-mono text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                          Fees: {(data.fees / 1000000).toFixed(1)}M UGX
                        </div>
                      </div>

                      {/* POS Bar */}
                      <div className="relative w-7 flex justify-center group-hover:scale-y-105 transition-all">
                        <div 
                          style={{ height: heightPos }}
                          className="w-full rounded-t-sm bg-slate-900"
                        />
                        {/* Tooltip */}
                        <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white font-mono text-[10px] px-2 py-1 rounded shadow-lg whitespace-nowrap z-20 pointer-events-none">
                          POS: {(data.pos / 1000000).toFixed(1)}M UGX
                        </div>
                      </div>
                    </div>
                    {/* Month Label */}
                    <span className="text-xs font-mono font-medium text-slate-500 mt-2">{data.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Card management & recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 columns: Student Accounts manager */}
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-display font-medium text-slate-900 text-lg">Cashless Card Registry</h3>
              <p className="text-xs text-slate-500">Search student smart cards, view balances, dynamic spending caps, and manual cashier entries.</p>
            </div>
            
            <div className="flex items-center gap-1.5 self-start sm:self-auto bg-amber-50 text-[#d4805e] px-3 py-1 rounded-lg text-xs font-semibold font-mono uppercase">
              <ShieldCheck className="h-4 w-4" /> Secure Auth Layer
            </div>
          </div>

          {/* Filtering row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                placeholder="Name, card ID, parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2 text-sm border border-slate-100 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#d4805e] focus:border-transparent"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-sm">
              <Filter className="h-4 w-4 text-slate-400" />
              <select 
                value={selectedClass} 
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-transparent text-slate-600 focus:outline-hidden w-full"
              >
                {classes.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Classes' : c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg text-sm">
              <CreditCard className="h-4 w-4 text-slate-400" />
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-transparent text-slate-600 focus:outline-hidden w-full"
              >
                <option value="All">All Card Statuses</option>
                <option value="active">Active Cards</option>
                <option value="suspended">Suspended Cards</option>
              </select>
            </div>
          </div>

          {/* Table/Card grid */}
          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {filteredStudents.length > 0 ? (
              filteredStudents.map((student) => {
                const maxCap = student.dailyLimit;
                return (
                  <motion.div 
                    layout
                    key={student.cardId}
                    className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-all ${
                      student.cardStatus === 'active' 
                        ? 'bg-slate-50/50 border-slate-100 hover:border-slate-200' 
                        : 'bg-red-50/20 border-red-100 hover:border-red-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar container */}
                      <div className="h-10 w-10 rounded-full bg-[#fcf2ed] flex items-center justify-center font-bold text-[#d4805e]">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-slate-900 text-sm">{student.name}</h4>
                          <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                            student.cardStatus === 'active' 
                              ? 'bg-emerald-50 text-emerald-700' 
                              : 'bg-red-50 text-red-600'
                          }`}>
                            {student.cardStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{student.classroom} • <span className="font-mono">{student.cardId}</span></p>
                        <p className="text-[11px] text-slate-400">Parent: {student.parentName} ({student.parentPhone})</p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-start sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block sm:text-right">Wallet Balance</span>
                        <span className="text-base font-bold text-slate-900 font-mono sm:text-right block">
                          {student.currentBalance.toLocaleString()} UGX
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block sm:text-right mt-0.5 mt-auto">
                        Daily Limit: <span className="font-semibold font-mono">{maxCap.toLocaleString()}</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2 sm:mt-0">
                      {/* Top Up trigger */}
                      <button
                        onClick={() => handleOpenTopUp(student.cardId)}
                        disabled={student.cardStatus === 'suspended'}
                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-3.5 w-3.5" /> Top-Up
                      </button>

                      {/* Toggle card status */}
                      <button
                        onClick={() => onToggleCardStatus(student.cardId)}
                        className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer ${
                          student.cardStatus === 'active'
                            ? 'border-red-100 text-red-600 hover:bg-red-50'
                            : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={student.cardStatus === 'active' ? 'Suspend Student Card' : 'Activate Student Card'}
                      >
                        {student.cardStatus === 'active' ? (
                          <span className="flex items-center gap-1 font-semibold px-1"><Lock className="h-3.5 w-3.5" /> Block</span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold px-1"><Unlock className="h-3.5 w-3.5" /> Unblock</span>
                        )}
                      </button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                <AlertCircle className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-500">No student smart cards found matching your filter criteria.</p>
                <button 
                  onClick={() => { setSearchTerm(''); setSelectedClass('All'); setSelectedStatus('All'); }}
                  className="text-xs text-[#d4805e] underline font-semibold mt-1"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 column: Recent transaction audits */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs flex flex-col h-[560px]">
          <div className="border-b border-slate-100 pb-4 mb-4">
            <h3 className="font-display font-medium text-slate-900 text-lg">Real-time Payments</h3>
            <p className="text-xs text-slate-500">Live feed of cash register actions and fee payouts across this terminal group.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 font-sans">
            {transactions.slice(0, 10).map((tx) => (
              <div key={tx.id} className="text-xs flex gap-3 p-2.5 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100">
                <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center shrink-0 border border-slate-100">
                  {getCategoryIcon(tx.category)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="font-medium text-slate-800 truncate block">{tx.studentName}</span>
                    <span className="font-mono text-slate-900 font-bold shrink-0">{tx.amount.toLocaleString()} UGX</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span className="truncate">{tx.categoryLabel}</span>
                    <span className="font-mono text-[9px] text-[#d4805e] bg-[#fcf2ed] px-1.5 py-0.2 rounded-xs font-semibold">{tx.id.toUpperCase()}</span>
                  </div>

                  <div className="text-[10px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                    <span>{new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    <span className="text-slate-500">{tx.merchantName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Manual Cash deposit / Top-Up Modal dialog simulation */}
      <AnimatePresence>
        {showTopUpModal && (() => {
          const student = students.find(s => s.cardId === showTopUpModal);
          if (!student) return null;
          return (
            <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div 
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border text-left border-slate-100 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5"
              >
                <div>
                  <div className="h-10 w-10 rounded-full bg-[#fcf2ed] flex items-center justify-center text-[#d4805e] font-bold text-sm mb-3">
                    {student.name.charAt(0)}
                  </div>
                  <h3 className="text-lg font-display font-medium text-slate-900">Virtual OTC Cash Top-Up</h3>
                  <p className="text-xs text-slate-500 mt-1">Bursar Cash Terminal: Feed money into student smart cards securely. Verify current cash deposits.</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div className="text-xs text-slate-400">Cardholder Student:</div>
                  <div className="text-sm font-semibold text-slate-800">{student.name}</div>
                  <div className="text-xs text-slate-500 font-mono">ID: {student.cardId} | Classroom: {student.classroom}</div>
                  <div className="text-xs text-slate-500 font-semibold mt-1">
                    Current balance: <span className="text-slate-900 font-bold">{student.currentBalance.toLocaleString()} UGX</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-semibold uppercase tracking-wider block">Cash Deposit Amount (UGX)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Amount in Ugandan Shillings"
                      value={topUpAmount}
                      onChange={(e) => {
                        setTopUpAmount(e.target.value);
                        setTopUpError('');
                      }}
                      className="w-full bg-slate-50 text-slate-900 font-mono font-bold pl-4 pr-14 py-3 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#d4805e]"
                    />
                    <span className="absolute right-3.5 top-3 text-xs font-mono font-semibold text-slate-400">UGX</span>
                  </div>
                  {topUpError && (
                    <p className="text-xs text-red-500 font-semibold mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 shrink-0" /> {topUpError}
                    </p>
                  )}
                </div>

                {/* Hot preset values */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Quick Presets</span>
                  <div className="grid grid-cols-4 gap-2">
                    {['5000', '10000', '25000', '50000'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setTopUpAmount(preset);
                          setTopUpError('');
                        }}
                        className={`py-1.5 text-xs font-mono border rounded-md font-semibold transition-colors cursor-pointer ${
                          topUpAmount === preset 
                            ? 'bg-[#d4805e] border-[#d4805e] text-white' 
                            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {parseInt(preset).toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-3">
                  <button 
                    onClick={() => setShowTopUpModal(null)}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleExecuteTopUp}
                    className="flex-1 py-2.5 bg-[#d4805e] hover:bg-[#c36f4d] text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    Confirm Top-Up
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
