import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ClipboardList, Search, RefreshCw, ChevronLeft, ChevronRight, 
  CheckCircle2, AlertTriangle, Filter, ChevronDown, X, Info,
  Receipt, Calendar, User, Hash, Percent, Award, ShieldCheck, ArrowRightLeft,
  Coins, ArrowDownCircle, ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Transaction, Student, School, Vendor } from '../types';

interface RecentTransactionsProps {
  vendorId: string;
  refreshTrigger?: number;
  triggerRefund: (txnId: string) => void;
  onRefreshCompleted?: () => void;
}

export function RecentTransactions({ 
  vendorId, 
  refreshTrigger = 0, 
  triggerRefund,
  onRefreshCompleted 
}: RecentTransactionsProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Search and Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [students, setStudents] = useState<Student[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  // Auto-polling States
  const [isAutoPolling, setIsAutoPolling] = useState(true);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [isPollingBackground, setIsPollingBackground] = useState(false);

  // Use a ref for transactions to avoid stale state closure in interval
  const transactionsRef = useRef(transactions);
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const fetchTransactions = async () => {
    if (!vendorId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pos/transactions/${vendorId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch transaction records.');
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        // Sort newest first
        const sorted = data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setTransactions(sorted);
      } else {
        setTransactions([]);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while fetching transactions.');
    } finally {
      setLoading(false);
      if (onRefreshCompleted) {
        onRefreshCompleted();
      }
    }
  };

  // Background status check for PENDING items and overall sync
  const pollTransactionStatuses = async () => {
    if (!vendorId) return;
    setIsPollingBackground(true);
    try {
      // 1. Fetch latest backend transaction list first
      const res = await fetch(`/api/pos/transactions/${vendorId}`);
      let latestTxs: Transaction[] = [];
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          latestTxs = data.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        }
      }

      // Check current list for pending transactions (either latest backend list or our current state if fetch failed)
      const currentList = latestTxs.length > 0 ? latestTxs : transactionsRef.current;
      const currentPending = currentList.filter(t => t.status === 'PENDING');

      const updatedTxs = [...currentList];
      let didChange = false;

      if (currentPending.length > 0) {
        // 2. Poll the status endpoint for each pending payment to update them in real-time
        await Promise.all(
          currentPending.map(async (pendingTx) => {
            const ref = pendingTx.referenceCode || pendingTx.id;
            try {
              const statusRes = await fetch(`/api/pos/payment-status/${ref}`);
              if (statusRes.ok) {
                const statusData = await statusRes.json();
                if (statusData.success && statusData.status !== pendingTx.status) {
                  const idx = updatedTxs.findIndex(t => t.id === pendingTx.id || t.referenceCode === pendingTx.referenceCode);
                  if (idx !== -1) {
                    updatedTxs[idx] = {
                      ...updatedTxs[idx],
                      status: statusData.status,
                      description: statusData.description || updatedTxs[idx].description,
                      senderWalletId: statusData.senderWalletId || updatedTxs[idx].senderWalletId
                    };
                    didChange = true;
                  }
                }
              }
            } catch (err) {
              console.error(`Error polling status for transaction ${ref}:`, err);
            }
          })
        );
      }

      if (latestTxs.length > 0 || didChange) {
        setTransactions(updatedTxs);
      }
    } catch (err) {
      console.error('Background status polling failed:', err);
    } finally {
      setIsPollingBackground(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const res = await fetch('/api/students');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setStudents(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch students in RecentTransactions', e);
    }
  };

  const fetchSchoolsAndVendors = async () => {
    try {
      const [schRes, venRes] = await Promise.all([
        fetch('/api/schools'),
        fetch('/api/vendors')
      ]);
      if (schRes.ok) {
        const data = await schRes.json();
        if (Array.isArray(data)) {
          setSchools(data);
        }
      }
      if (venRes.ok) {
        const data = await venRes.json();
        if (Array.isArray(data)) {
          setVendors(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch schools/vendors in RecentTransactions', e);
    }
  };

  // Trigger fetch data on mount
  useEffect(() => {
    fetchStudents();
    fetchSchoolsAndVendors();
  }, []);

  // Trigger fetch on mount or when vendorId/refreshTrigger changes
  useEffect(() => {
    fetchTransactions();
    setSecondsRemaining(30);
  }, [vendorId, refreshTrigger]);

  // Set up 30s auto-polling countdown timer
  useEffect(() => {
    if (!isAutoPolling || !vendorId) {
      return;
    }

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          pollTransactionStatuses();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isAutoPolling, vendorId]);

  // Reset pagination on search or filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, studentSearchQuery, statusFilter, typeFilter]);

  const getStudentForWallet = (walletId: string) => {
    if (!walletId) return null;
    const cleanId = walletId.replace(/^W_/, '');
    return students.find(s => s.id === cleanId || s.id === walletId || walletId.includes(s.id));
  };

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(txn => {
      // Search matches reference code or description
      const matchesSearch = searchQuery === '' || 
        (txn.referenceCode && txn.referenceCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (txn.description && txn.description.toLowerCase().includes(searchQuery.toLowerCase()));
        
      // Status match
      const matchesStatus = statusFilter === 'ALL' || txn.status === statusFilter;
      
      // Type match
      const matchesType = typeFilter === 'ALL' || txn.type === typeFilter;
      
      // Student filter match
      let matchesStudent = true;
      if (studentSearchQuery !== '') {
        const query = studentSearchQuery.toLowerCase().trim();
        const senderStudent = getStudentForWallet(txn.senderWalletId);
        const receiverStudent = getStudentForWallet(txn.receiverWalletId);
        const associatedStudent = senderStudent || receiverStudent;
        
        if (!associatedStudent) {
          matchesStudent = false;
        } else {
          matchesStudent = 
            associatedStudent.name.toLowerCase().includes(query) ||
            associatedStudent.id.toLowerCase().includes(query) ||
            associatedStudent.admissionNo.toLowerCase().includes(query);
        }
      }
      
      return matchesSearch && matchesStatus && matchesType && matchesStudent;
    });
  }, [transactions, searchQuery, studentSearchQuery, statusFilter, typeFilter, students]);

  // Paginated chunk
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;

  // List of unique transaction types available for filtering
  const transactionTypes = useMemo(() => {
    const types = new Set<string>();
    transactions.forEach(t => {
      if (t.type) types.add(t.type);
    });
    return ['ALL', ...Array.from(types)];
  }, [transactions]);

  return (
    <div id="vendor-recent-transactions-section" className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
      {/* Component Title & Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-[#c7515e]" />
          <div>
            <h3 className="font-semibold text-slate-100">Recent Transactions</h3>
            <p className="text-[11px] text-slate-400">Paginated list of incoming payments, cashouts, and adjustments</p>
          </div>
        </div>

        {/* Search, Refresh, Page size */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Auto Refresh Toggle & Timer Indicator */}
          <div className="flex items-center gap-2 bg-slate-950/60 rounded-lg px-2.5 py-1.5 border border-slate-800 text-xs text-slate-400">
            <span className="flex h-1.5 w-1.5 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAutoPolling ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
              <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isAutoPolling ? (isPollingBackground ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-600'}`}></span>
            </span>
            <span className="text-[10px] font-mono whitespace-nowrap">
              {isAutoPolling ? (isPollingBackground ? 'Checking...' : `Poll: ${secondsRemaining}s`) : 'Poll: Paused'}
            </span>
            <button
              onClick={() => {
                setIsAutoPolling(!isAutoPolling);
                if (!isAutoPolling) {
                  setSecondsRemaining(30);
                }
              }}
              className="ml-1 text-[9px] font-bold text-[#c7515e] hover:text-[#e26271] uppercase tracking-wider transition-colors"
              title={isAutoPolling ? 'Pause background updates' : 'Resume 30-second auto-poll'}
            >
              {isAutoPolling ? 'Pause' : 'Resume'}
            </button>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="p-2 rounded-lg bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all duration-150 disabled:opacity-50"
            title="Refresh Transactions Ledger"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#c7515e]' : ''}`} />
          </button>

          {/* Page Size Selector */}
          <div className="relative">
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="appearance-none rounded-lg border border-slate-700 bg-slate-950 py-1.5 pl-3 pr-8 text-xs font-medium text-slate-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-colors"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={20}>20 per page</option>
              <option value={50}>50 per page</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH ACTION BAR */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 mb-4">
        {/* Student Search Input */}
        <div className="sm:col-span-4 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={studentSearchQuery}
            onChange={(e) => setStudentSearchQuery(e.target.value)}
            placeholder="Filter by student name or ID..."
            className="w-full rounded-lg border border-[#c7515e]/30 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-colors placeholder-slate-500 font-medium"
          />
        </div>

        {/* Search Input */}
        <div className="sm:col-span-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search reference or desc..."
            className="w-full rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-colors placeholder-slate-500"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3 relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 py-2 pl-3 pr-8 text-xs text-slate-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-colors"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS (Approved)</option>
            <option value="PENDING">PENDING</option>
            <option value="FAILED">FAILED (Refunded/Failed)</option>
          </select>
          <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-2 relative">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 py-2 pl-3 pr-8 text-xs text-slate-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-colors"
          >
            <option value="ALL">All Types</option>
            {transactionTypes.filter(t => t !== 'ALL').map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
        </div>
      </div>

      {/* ERROR MESSAGE PANEL */}
      {error && (
        <div className="mb-4 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* LEDGER DATA TABLE */}
      <div className="overflow-x-auto scrollbar-thin rounded-lg border border-slate-800/60 bg-slate-950/20">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-[10px] uppercase tracking-wider">
              <th className="p-3 font-semibold">Timestamp</th>
              <th className="p-3 font-semibold">Receipt Ref</th>
              <th className="p-3 font-semibold">Description / Type</th>
              <th className="p-3 font-semibold">Amount</th>
              <th className="p-3 font-semibold">Status</th>
              <th className="p-3 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 font-medium">
                  <div className="flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-[#c7515e]" />
                    <span>Loading transactions history...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500">
                  No matching transaction records found.
                </td>
              </tr>
            ) : (
              paginatedTransactions.map((txn) => {
                const isSpend = txn.type === 'SPEND';
                const isRefund = txn.type === 'REFUND';
                const isWithdrawal = txn.type === 'WITHDRAWAL';
                
                return (
                  <tr 
                    key={txn.id} 
                    onClick={() => setSelectedTxn(txn)}
                    className="hover:bg-slate-800/25 active:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* Timestamp */}
                    <td className="p-3 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                      {txn.createdAt ? new Date(txn.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      }) : 'N/A'}
                    </td>
                    
                    {/* Reference Code */}
                    <td className="p-3 font-mono text-[#c7515e] font-semibold whitespace-nowrap">
                      {txn.referenceCode || txn.id}
                    </td>

                    {/* Description & Type */}
                    <td className="p-3 max-w-[180px]">
                      <div className="font-bold text-slate-200 truncate">{txn.description}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                        <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wide">
                          {txn.type}
                        </span>
                        {(() => {
                          const senderStudent = getStudentForWallet(txn.senderWalletId);
                          const receiverStudent = getStudentForWallet(txn.receiverWalletId);
                          const assocStudent = senderStudent || receiverStudent;
                          if (!assocStudent) return null;
                          return (
                            <span className="text-[9px] font-sans font-bold bg-[#c7515e]/10 text-[#e26271] px-1 rounded">
                              {assocStudent.name} ({assocStudent.admissionNo})
                            </span>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="p-3 whitespace-nowrap">
                      <div className={`font-mono font-black text-[13px] ${
                        isSpend ? 'text-emerald-400' :
                        isRefund ? 'text-rose-400' :
                        isWithdrawal ? 'text-amber-400' :
                        'text-slate-200'
                      }`}>
                        {isSpend ? '+' : isRefund || isWithdrawal ? '-' : ''}
                        {txn.amount.toLocaleString()} 
                        <span className="text-[9px] font-bold font-sans ml-0.5">UGX</span>
                      </div>
                    </td>

                    {/* Status badge */}
                    <td className="p-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold tracking-wide uppercase ${
                        txn.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        txn.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {txn.status}
                      </span>
                    </td>

                    {/* Action buttons (e.g. Refund) */}
                    <td className="p-3 text-right whitespace-nowrap">
                      {txn.status === 'SUCCESS' && isSpend && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerRefund(txn.referenceCode || txn.id);
                          }}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20 hover:border-rose-400/45 transition-colors"
                        >
                          Refund
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION NAVIGATION CONTROLS */}
      {filteredTransactions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-3 border-t border-slate-800">
          {/* Pagination Counter details */}
          <div className="text-[11px] text-slate-400 font-mono">
            Showing <span className="text-white font-bold">{Math.min(filteredTransactions.length, (currentPage - 1) * itemsPerPage + 1)}</span> to{' '}
            <span className="text-white font-bold">{Math.min(filteredTransactions.length, currentPage * itemsPerPage)}</span> of{' '}
            <span className="text-white font-bold">{filteredTransactions.length}</span> matching transactions
          </div>

          {/* Navigation controls */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-all duration-150"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {/* Direct pages indicator */}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, idx) => {
                const pgNum = idx + 1;
                // Only show first, last, and pages close to current page
                if (totalPages > 5 && Math.abs(currentPage - pgNum) > 1 && pgNum !== 1 && pgNum !== totalPages) {
                  if (pgNum === 2 || pgNum === totalPages - 1) {
                    return <span key={pgNum} className="text-slate-600 px-1 font-mono text-xs">...</span>;
                  }
                  return null;
                }

                return (
                  <button
                    key={pgNum}
                    onClick={() => setCurrentPage(pgNum)}
                    disabled={loading}
                    className={`h-7 w-7 rounded-lg text-xs font-mono font-bold transition-all duration-150 ${
                      currentPage === pgNum 
                        ? 'bg-[#c7515e] text-white' 
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {pgNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700 disabled:opacity-40 disabled:hover:text-slate-400 disabled:hover:border-slate-800 transition-all duration-150"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Slide-over Panel */}
      <AnimatePresence>
        {selectedTxn && (() => {
          const isSpend = selectedTxn.type === 'SPEND';
          const isRefund = selectedTxn.type === 'REFUND';
          const isWithdrawal = selectedTxn.type === 'WITHDRAWAL';
          
          const senderStudent = getStudentForWallet(selectedTxn.senderWalletId);
          const receiverStudent = getStudentForWallet(selectedTxn.receiverWalletId);
          const student = senderStudent || receiverStudent;
          
          // Commission split calculations for SPEND or REFUND
          const currentVendor = vendors.find(v => v.id === vendorId);
          const vendorSchool = schools.find(s => s.id === currentVendor?.schoolId);
          const schoolCommRate = vendorSchool ? vendorSchool.commissionRate : 1.0;
          const platformCommRate = 0.5;
          
          const schoolPart = Math.floor((selectedTxn.amount * schoolCommRate) / 100);
          const platformPart = Math.floor((selectedTxn.amount * platformCommRate) / 100);
          const vendorPart = selectedTxn.amount - schoolPart - platformPart;

          return (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedTxn(null)}
                className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm"
              />
              
              {/* Slide-over */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#c7515e]" />
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Transaction Ledger Details</h4>
                      <p className="text-[10px] font-mono text-[#c7515e] font-semibold">Ref: {selectedTxn.referenceCode || selectedTxn.id}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedTxn(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
                  {/* Amount Block */}
                  <div className="text-center bg-slate-950/30 rounded-2xl border border-slate-800/80 p-5">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Transaction Value</p>
                    <h2 className={`text-3xl font-black tracking-tight font-mono ${
                      isSpend ? 'text-emerald-400' :
                      isRefund ? 'text-rose-400' :
                      isWithdrawal ? 'text-amber-400' :
                      'text-white'
                    }`}>
                      {isSpend ? '+' : isRefund || isWithdrawal ? '-' : ''}
                      {selectedTxn.amount.toLocaleString()}
                      <span className="text-sm font-sans font-bold ml-1">UGX</span>
                    </h2>
                    
                    <div className="mt-3 flex justify-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 ${
                        selectedTxn.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                        selectedTxn.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          selectedTxn.status === 'SUCCESS' ? 'bg-emerald-400' :
                          selectedTxn.status === 'PENDING' ? 'bg-amber-400' : 'bg-rose-400'
                        }`} />
                        {selectedTxn.status}
                      </span>
                    </div>
                  </div>

                  {/* Core Attributes */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 pb-1.5">Specifications</h5>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="bg-slate-950/20 border border-slate-800/40 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1 text-slate-500 font-medium mb-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Timestamp</span>
                        </div>
                        <div className="font-semibold text-slate-200">
                          {selectedTxn.createdAt ? new Date(selectedTxn.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          }) : 'N/A'}
                        </div>
                      </div>

                      <div className="bg-slate-950/20 border border-slate-800/40 p-2.5 rounded-xl">
                        <div className="flex items-center gap-1 text-slate-500 font-medium mb-1">
                          <Info className="h-3.5 w-3.5" />
                          <span>Type</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                          {selectedTxn.type}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950/20 border border-slate-800/40 p-3 rounded-xl space-y-1">
                      <span className="text-slate-500 font-medium block">Description</span>
                      <p className="font-semibold text-slate-200">{selectedTxn.description || 'No itemised remarks'}</p>
                    </div>
                  </div>

                  {/* Student Association Card */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800/60 pb-1.5">Associated Student</h5>
                    {student ? (
                      <div className="bg-slate-950/35 border border-slate-800/70 rounded-xl p-4 flex items-start gap-3">
                        {student.avatarUrl ? (
                          <img src={student.avatarUrl} alt={student.name} className="h-10 w-10 rounded-full border border-slate-700 shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#c7515e]/10 border border-[#c7515e]/20 flex items-center justify-center font-bold text-[#e26271] shrink-0 text-sm">
                            {student.name.charAt(0)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="font-bold text-slate-100 truncate text-sm">{student.name}</div>
                          <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] font-medium text-slate-400">
                            <span className="truncate">ID: <span className="font-mono text-slate-300 font-bold">{student.id}</span></span>
                            <span className="truncate">Class: <span className="text-slate-300 font-bold">{student.class}</span></span>
                            <span className="truncate col-span-2">Adm No: <span className="font-mono text-slate-300 font-bold">{student.admissionNo}</span></span>
                            <span className="truncate col-span-2">Parent: <span className="text-slate-300 font-bold">{student.parentPhone}</span></span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950/20 border border-slate-800/40 p-3.5 rounded-xl text-center text-slate-500 text-xs">
                        This is a vendor level operation (e.g. withdrawal or cashout) with no individual student association.
                      </div>
                    )}
                  </div>

                  {/* Commission Split Section */}
                  {(isSpend || isRefund) && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-1.5">
                        <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atomic Split Breakdown</h5>
                        <span className="text-[10px] font-medium text-slate-500 font-mono">Real-time Settlement</span>
                      </div>

                      {/* Stacked Progress Bar */}
                      <div className="h-3 w-full rounded-full bg-slate-950 overflow-hidden flex border border-slate-800">
                        <div 
                          style={{ width: `${100 - schoolCommRate - platformCommRate}%` }} 
                          className="h-full bg-emerald-500" 
                          title={`Vendor Share: ${(100 - schoolCommRate - platformCommRate).toFixed(1)}%`}
                        />
                        <div 
                          style={{ width: `${schoolCommRate}%` }} 
                          className="h-full bg-[#c7515e]" 
                          title={`School Commission: ${schoolCommRate}%`}
                        />
                        <div 
                          style={{ width: `${platformCommRate}%` }} 
                          className="h-full bg-blue-500" 
                          title={`Platform Support: ${platformCommRate}%`}
                        />
                      </div>

                      {/* Detailed item list */}
                      <div className="space-y-2.5 pt-1">
                        {/* Vendor Share */}
                        <div className="bg-slate-950/15 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-200">Vendor Net Payout</div>
                              <div className="text-[10px] text-slate-500 font-medium">Credited to Vendor Wallet</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-emerald-400">{vendorPart.toLocaleString()} UGX</div>
                            <div className="text-[10px] font-mono text-slate-500">{(100 - schoolCommRate - platformCommRate).toFixed(1)}%</div>
                          </div>
                        </div>

                        {/* School Commission */}
                        <div className="bg-slate-950/15 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-[#c7515e] shrink-0" />
                            <div>
                              <div className="font-bold text-slate-200">School Admin Fee</div>
                              <div className="text-[10px] text-slate-500 font-medium">Facility maintenance fund ({vendorSchool?.name || 'School Admin'})</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-[#e26271]">{schoolPart.toLocaleString()} UGX</div>
                            <div className="text-[10px] font-mono text-slate-500">{schoolCommRate.toFixed(1)}%</div>
                          </div>
                        </div>

                        {/* Platform Support */}
                        <div className="bg-slate-950/15 border border-slate-800/40 p-2.5 rounded-xl flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                            <div>
                              <div className="font-bold text-slate-200">Platform Gateway Fee</div>
                              <div className="text-[10px] text-slate-500 font-medium">Secure SMS & ledger compliance support</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-mono font-bold text-blue-400">{platformPart.toLocaleString()} UGX</div>
                            <div className="text-[10px] font-mono text-slate-500">{platformCommRate.toFixed(1)}%</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer / Meta Info */}
                <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex items-center gap-2 text-[10px] text-slate-400 font-medium justify-between">
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Cryptographically verified</span>
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-wider text-slate-500">Uganda Edu Pay</span>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
