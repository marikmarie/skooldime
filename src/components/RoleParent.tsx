import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, ArrowRightLeft, Landmark, RefreshCw, Key, CheckCircle2, AlertTriangle, History, Search, ListFilter, Printer, Download } from 'lucide-react';
import { createPortal } from 'react-dom';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Parent, Student, Transaction } from '../types';
import { useToast } from './ToastContext';
import { QRCodeSVG } from 'qrcode.react';

interface RoleParentProps {
  userPhone?: string;
}

export default function RoleParent({ userPhone = '+256772444555' }: RoleParentProps) {
  const [parent, setParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeParentTab, setActiveParentTab] = useState<'CARDS' | 'FUNDS' | 'TRANSACTIONS'>('CARDS');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txSearchQuery, setTxSearchQuery] = useState('');
  const [txStatusFilter, setTxStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PENDING' | 'FAILED'>('ALL');
  const [txChildFilter, setTxChildFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  // Top up states
  const [depositAmt, setDepositAmt] = useState('');
  const [depositPhone, setDepositPhone] = useState(userPhone);
  const [pollingTxId, setPollingTxId] = useState<string | null>(null);
  const [pollingMsg, setPollingMsg] = useState('');

  // Allocate pocket money states
  const [allocateAmt, setAllocateAmt] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // PIN resetting
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinStudentId, setPinStudentId] = useState('');
  const [newPin, setNewPin] = useState('');

  // Daily spend parameters
  const [spendingLimit, setSpendingLimit] = useState('');
  const [limitStudentId, setLimitStudentId] = useState('');
  const [showLimitModal, setShowLimitModal] = useState(false);

  const fetchParentAndChildren = async () => {
    try {
      const parentRes = await fetch('/api/parents');
      const parentsList = await parentRes.json();
      if (Array.isArray(parentsList)) {
        const currentParent = parentsList.find((p: any) => p.phone === userPhone);
        setParent(currentParent || null);

        if (currentParent) {
          const studRes = await fetch('/api/students');
          const studData = await studRes.json();
          let linkedStudents: Student[] = [];
          if (Array.isArray(studData)) {
            linkedStudents = studData.filter((s: Student) => s.parentPhone === currentParent.phone);
            setStudents(linkedStudents);
            if (linkedStudents.length > 0) setSelectedStudentId(linkedStudents[0].id);
          }

          // Fetch all transactions
          const txRes = await fetch('/api/transactions');
          const txData = await txRes.json();
          if (Array.isArray(txData)) {
            // Filter transactions that belong to parent or linked students
            const filteredTx = txData.filter((t: any) => {
              const isParentWallet = t.senderWalletId === `W_${currentParent.id}` || t.receiverWalletId === `W_${currentParent.id}`;
              const isChildWallet = linkedStudents.some(s => t.senderWalletId === `W_${s.id}` || t.receiverWalletId === `W_${s.id}`);
              const mentionsParent = t.description?.toLowerCase().includes(currentParent.name.toLowerCase()) || t.description?.toLowerCase().includes(userPhone);
              const mentionsChild = linkedStudents.some(s => t.description?.toLowerCase().includes(s.name.toLowerCase()));
              return isParentWallet || isChildWallet || mentionsParent || mentionsChild;
            });
            // Sort by date descending
            filteredTx.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setTransactions(filteredTx);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchParentAndChildren();
  }, [userPhone]);

  // Collecto Polling Deposit (6.0)
  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmt || !depositPhone) return;

    setLoading(true);
    setPollingMsg('Initiating Collecto Push... Check phone screen.');

    try {
      const res = await fetch('/api/collecto/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPhone: userPhone, amount: Number(depositAmt) })
      });
      const data = await res.json();
      if (data.success) {
        setPollingTxId(data.transactionId);
        startPolling(data.transactionId);
      } else {
        toast.error(data.error || 'Failed to initiate deposit.');
        setLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during deposit request.');
      setLoading(false);
    }
  };

  const startPolling = (txId: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      setPollingMsg(`Polling Collecto API Gateway... Attempt ${attempts}`);
      try {
        const res = await fetch(`/api/collecto/status/${txId}`);
        const data = await res.json();
        if (data.status === 'SUCCESS') {
          clearInterval(interval);
          toast.success(`Deposit approved! Credited ${Number(depositAmt).toLocaleString()} UGX to Parent wallet.`);
          setPollingTxId(null);
          setDepositAmt('');
          setLoading(false);
          fetchParentAndChildren();
        } else if (attempts > 5) {
          clearInterval(interval);
          setPollingTxId(null);
          setLoading(false);
          toast.error('Collecto Push polling timed out. No approval received.');
        }
      } catch (e) {
        clearInterval(interval);
        setPollingTxId(null);
        setLoading(false);
        console.error(e);
      }
    }, 2000);
  };

  // Pocket Money Allocation (3.2 / 3.3)
  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allocateAmt || !selectedStudentId) return;

    try {
      const res = await fetch('/api/parents/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPhone: userPhone,
          studentId: selectedStudentId,
          amount: Number(allocateAmt)
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setAllocateAmt('');
        fetchParentAndChildren();
      } else {
        toast.error(data.error || 'Failed to allocate pocket money.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during pocket money allocation.');
    }
  };

  // Reset Student PIN (3.2)
  const triggerPinReset = (studentId: string) => {
    setPinStudentId(studentId);
    setShowPinModal(true);
  };

  const handlePinResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) return;

    try {
      const res = await fetch('/api/students/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: pinStudentId,
          newPin,
          parentPhone: userPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Student PIN reset completed. Updated security matrix.');
        setShowPinModal(false);
        setNewPin('');
        fetchParentAndChildren();
      } else {
        toast.error(data.error || 'Failed to reset PIN.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during PIN reset.');
    }
  };

  // Limit management (3.3)
  const triggerLimitModal = (studentId: string, currentLimit: number) => {
    setLimitStudentId(studentId);
    setSpendingLimit(currentLimit.toString());
    setShowLimitModal(true);
  };

  const handleLimitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/students/limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: limitStudentId, limit: Number(spendingLimit) })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowLimitModal(false);
        fetchParentAndChildren();
      } else {
        toast.error(data.error || 'Failed to update spending limit.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during spending limit update.');
    }
  };

  if (!parent) return (
    <div className="flex items-center justify-center h-40">
      <div className="text-[#c7515e] flex flex-col items-center gap-3">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="text-gray-400 text-xs font-medium tracking-wide">Loading Parent Portal...</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200 bg-transparent p-4 md:p-6 rounded-2xl border border-white/10 shadow-xl">
      
      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="rounded-2xl border border-white/10 bg-transparent p-5 flex items-center justify-between hover:border-[#ED0101]/30 transition-colors shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Parent Fund Balance</span>
            <h4 className="text-2xl font-extrabold text-white mt-1">{parent.walletBalance.toLocaleString()} <span className="text-sm font-medium text-gray-400">UGX</span></h4>
          </div>
          <div className="rounded-xl bg-[#ED0101]/10 p-3 text-[#ED0101]">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-transparent p-5 flex items-center justify-between hover:border-[#ED0101]/30 transition-colors shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Linked Student Cards</span>
            <h4 className="text-2xl font-extrabold text-white mt-1">{students.length} <span className="text-sm font-medium text-gray-400">Active</span></h4>
          </div>
          <div className="rounded-xl bg-[#ED0101]/10 p-3 text-[#ED0101]">
            <Smartphone className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-transparent p-5 flex items-center justify-between hover:border-[#ED0101]/30 transition-colors shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase font-bold tracking-widest">Identity Verification</span>
            <h4 className="text-2xl font-extrabold text-white mt-1">Tier 2 <span className="text-sm font-medium text-gray-400">Verified</span></h4>
          </div>
          <div className="rounded-xl bg-[#ED0101]/10 p-3 text-[#ED0101]">
            <Shield className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-transparent border border-white/10 p-1 rounded-xl max-w-xl">
        <button
          onClick={() => setActiveParentTab('CARDS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeParentTab === 'CARDS'
              ? 'bg-[#ED0101] text-white shadow-lg shadow-[#ED0101]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Family Cards</span>
        </button>
        <button
          onClick={() => setActiveParentTab('FUNDS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeParentTab === 'FUNDS'
              ? 'bg-[#ED0101] text-white shadow-lg shadow-[#ED0101]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Send & Top Up</span>
        </button>
        <button
          onClick={() => setActiveParentTab('TRANSACTIONS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeParentTab === 'TRANSACTIONS'
              ? 'bg-[#ED0101] text-white shadow-lg shadow-[#ED0101]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <History className="h-4 w-4" />
          <span>Ledger History</span>
        </button>
      </div>

      {activeParentTab === 'CARDS' && (
        <div className="rounded-2xl border border-white/10 bg-transparent p-4 sm:p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#ED0101]" />
            Linked Family Ledger Control
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.map((stud) => (
              <div key={stud.id} className="p-4 sm:p-5 rounded-xl bg-transparent border border-white/10 hover:border-[#ED0101]/40 transition-all space-y-4 shadow-md">
                <div className="flex items-center gap-4">
                  <img src={stud.avatarUrl} alt="" className="w-12 h-12 rounded-full border-2 border-[#ED0101]/30 shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{stud.name}</h4>
                    <p className="text-[11px] text-[#ED0101] font-medium">{stud.class}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono py-3 border-y border-white/10">
                  <div className="min-w-0">
                    <span className="text-gray-500 block mb-1">CARD CODE</span>
                    <span className="text-gray-200 font-bold text-[10px] bg-white/5 px-2 py-0.5 rounded truncate block" title={stud.qrHash}>{stud.qrHash}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500 block mb-1">CARD BALANCE</span>
                    <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded truncate block">{(stud.balance ?? 0).toLocaleString()} UGX</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500 block mb-1">NO-PIN LIMIT</span>
                    <span className="text-[#ED0101] font-bold text-[10px] bg-[#ED0101]/10 px-2 py-0.5 rounded truncate block">{stud.noPinLimit.toLocaleString()} UGX</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => triggerPinReset(stud.id)}
                    className="rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-2 text-center text-[10px] sm:text-xs text-gray-300 font-semibold transition-colors truncate"
                    title="Reset PIN"
                  >
                    Reset PIN
                  </button>
                  <button
                    onClick={() => triggerLimitModal(stud.id, stud.noPinLimit)}
                    className="rounded-lg border border-[#ED0101]/35 bg-[#ED0101]/10 hover:bg-[#ED0101]/20 py-2 text-center text-[10px] sm:text-xs text-[#ED0101] font-semibold transition-colors truncate"
                    title="Edit Limits"
                  >
                    Set Limits
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeParentTab === 'FUNDS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Allocate pocket money (7 cols) */}
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-transparent p-4 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="h-5 w-5 text-[#ED0101]" />
                <h3 className="text-sm font-bold text-gray-200">Credit Child's Card from Wallet</h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500 uppercase font-mono block">Your Wallet Balance</span>
                <span className="text-sm font-bold text-emerald-500 font-mono">
                  {parent ? parent.walletBalance.toLocaleString() : '0'} UGX
                </span>
              </div>
            </div>

            <div className="bg-transparent rounded-xl border border-white/10 p-3.5 mb-4">
              <p className="text-xs text-gray-400 leading-relaxed">
                🚀 <strong className="text-[#ED0101]">Direct Card Crediting:</strong> Allocate funds instantly from your personal <strong>Parent Wallet</strong> to credit your child's physical <strong>NFC Wallet Card</strong>. This transaction is free, safe, and immediate.
              </p>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Select Kid's Card</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-gray-200 focus:border-[#ED0101] focus:ring-1 focus:ring-[#ED0101] outline-none transition-all font-sans"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.class}) — Card: {s.qrHash} (Limit: {s.noPinLimit.toLocaleString()} UGX)
                    </option>
                  ))}
                </select>
                {selectedStudentId && (
                  <div className="mt-2 text-xs text-gray-400 flex justify-between px-1">
                    <span>Card Limit: <strong>{students.find(s => s.id === selectedStudentId)?.noPinLimit.toLocaleString()} UGX</strong></span>
                    <span>Card Identifier: <strong className="font-mono text-emerald-400">{students.find(s => s.id === selectedStudentId)?.qrHash}</strong></span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Amount to Credit (UGX)</label>
                <input
                  type="number"
                  required
                  value={allocateAmt}
                  onChange={(e) => setAllocateAmt(e.target.value)}
                  placeholder="e.g., 5000"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-gray-200 focus:border-[#ED0101] focus:ring-1 focus:ring-[#ED0101] outline-none transition-all font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#ED0101] hover:bg-[#c90000] py-2.5 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-[#ED0101]/20 flex items-center justify-center gap-2"
              >
                <ArrowRightLeft className="h-4 w-4" />
                <span>Credit Kid's Card Now</span>
              </button>
            </form>
          </div>

          {/* Top-Up via Collecto MoMo Gateway (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-transparent p-4 sm:p-6 shadow-xl h-fit space-y-5">
            <h3 className="text-sm font-bold text-gray-200 border-b border-white/10 pb-4 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#ED0101]" />
              Gateway Top-Up (Collecto Push)
            </h3>
            
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">MoMo Number</label>
                <input
                  type="text"
                  required
                  value={depositPhone}
                  onChange={(e) => setDepositPhone(e.target.value)}
                  placeholder="+256772444555"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-gray-200 font-mono focus:border-[#ED0101] focus:ring-1 focus:ring-[#ED0101] outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Top up Amount (UGX)</label>
                <input
                  type="number"
                  required
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(e.target.value)}
                  placeholder="0"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-gray-200 font-mono focus:border-[#ED0101] focus:ring-1 focus:ring-[#ED0101] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#ED0101] hover:bg-[#c90000] py-3 text-sm font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#ED0101]/20 disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Initiate Secure Deposit'}
              </button>
            </form>

            {loading && (
              <div className="rounded-lg bg-slate-900 p-4 text-[11px] text-[#ED0101] font-mono border border-[#ED0101]/20 leading-relaxed text-center animate-pulse">
                {pollingMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {activeParentTab === 'TRANSACTIONS' && (
        <div className="rounded-2xl border border-white/10 bg-transparent p-4 sm:p-6 shadow-xl space-y-5 animate-in fade-in duration-250">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <History className="h-5 w-5 text-[#ED0101]" />
              <h3 className="text-sm font-bold text-gray-200 uppercase tracking-wider">
                Family Transactions Ledger
              </h3>
            </div>
            <button
              onClick={fetchParentAndChildren}
              className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/5 bg-white/5 text-xs text-gray-400 hover:text-white transition"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync Ledger</span>
            </button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search description, reference..."
                value={txSearchQuery}
                onChange={(e) => setTxSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 text-white placeholder-gray-500 focus:border-[#ED0101] outline-none transition"
              />
            </div>

            {/* Child Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <ListFilter className="h-4 w-4" />
              </span>
              <select
                value={txChildFilter}
                onChange={(e) => setTxChildFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 text-white focus:border-[#ED0101] outline-none transition appearance-none cursor-pointer"
              >
                <option value="ALL">All Family Members</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.class})</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <ListFilter className="h-4 w-4" />
              </span>
              <select
                value={txStatusFilter}
                onChange={(e) => setTxStatusFilter(e.target.value as any)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-slate-900 text-white focus:border-[#ED0101] outline-none transition appearance-none cursor-pointer"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success Only</option>
                <option value="PENDING">Pending Only</option>
                <option value="FAILED">Failed Only</option>
              </select>
            </div>
          </div>

          {/* Transactions Table */}
          <div className="overflow-x-auto rounded-xl border border-white/5 max-h-100 scrollbar-thin">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 bg-white/1 text-gray-500 font-mono uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Date / Time</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {transactions
                  .filter(t => {
                    // Status Filter
                    if (txStatusFilter !== 'ALL' && t.status !== txStatusFilter) return false;
                    
                    // Child Filter
                    if (txChildFilter !== 'ALL') {
                      const isChildWallet = t.senderWalletId === `W_${txChildFilter}` || t.receiverWalletId === `W_${txChildFilter}`;
                      const childObj = students.find(s => s.id === txChildFilter);
                      const childName = childObj ? childObj.name.toLowerCase() : '';
                      const mentionsChild = childName && t.description?.toLowerCase().includes(childName);
                      if (!isChildWallet && !mentionsChild) return false;
                    }
                    
                    // Search Query
                    if (txSearchQuery) {
                      const q = txSearchQuery.toLowerCase();
                      const matchDesc = t.description?.toLowerCase().includes(q);
                      const matchId = t.id?.toLowerCase().includes(q) || t.referenceCode?.toLowerCase().includes(q);
                      const matchAmt = t.amount?.toString().includes(q);
                      if (!matchDesc && !matchId && !matchAmt) return false;
                    }
                    
                    return true;
                  })
                  .map((tx) => {
                    const isCredit = tx.receiverWalletId === `W_${parent?.id}` || tx.description?.toLowerCase().includes('deposit');
                    return (
                      <tr key={tx.id} className="hover:bg-white/1 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-gray-500 text-[10px] whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-white max-w-xs sm:max-w-md truncate" title={tx.description}>
                            {tx.description}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 font-mono text-gray-500 select-all">
                          {tx.referenceCode || tx.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase ${
                            tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15' :
                            tx.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/15'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className={`py-3.5 px-4 text-right font-mono font-bold ${
                          isCredit ? 'text-emerald-400' : 'text-gray-200'
                        }`}>
                          {isCredit ? '+' : '-'}{tx.amount.toLocaleString()} UGX
                        </td>
                      </tr>
                    );
                  })}
                {transactions
                  .filter(t => {
                    if (txStatusFilter !== 'ALL' && t.status !== txStatusFilter) return false;
                    if (txChildFilter !== 'ALL') {
                      const isChildWallet = t.senderWalletId === `W_${txChildFilter}` || t.receiverWalletId === `W_${txChildFilter}`;
                      const childObj = students.find(s => s.id === txChildFilter);
                      const childName = childObj ? childObj.name.toLowerCase() : '';
                      const mentionsChild = childName && t.description?.toLowerCase().includes(childName);
                      if (!isChildWallet && !mentionsChild) return false;
                    }
                    if (txSearchQuery) {
                      const q = txSearchQuery.toLowerCase();
                      const matchDesc = t.description?.toLowerCase().includes(q);
                      const matchId = t.id?.toLowerCase().includes(q) || t.referenceCode?.toLowerCase().includes(q);
                      const matchAmt = t.amount?.toString().includes(q);
                      if (!matchDesc && !matchId && !matchAmt) return false;
                    }
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-sm text-gray-500 font-medium">
                        No transactions matching the criteria.
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Spend Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0F1424] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 rounded-lg bg-[#c7515e]/10">
                <Shield className="h-5 w-5 text-[#c7515e]" />
              </div>
              <h4 className="text-base font-bold text-white">Adjust Daily Limit</h4>
            </div>

            <form onSubmit={handleLimitSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">Max No-PIN Transaction Value (UGX)</label>
                <input
                  type="number"
                  required
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-3 text-sm text-gray-200 font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#c7515e] hover:bg-[#b04753] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#c7515e]/20 transition-all active:scale-95"
                >
                  Save Amount
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0F1424] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-3">
              <div className="p-2 rounded-lg bg-[#c7515e]/10">
                <Key className="h-5 w-5 text-[#c7515e]" />
              </div>
              <h4 className="text-base font-bold text-white">Secure 4-Digit PIN Update</h4>
            </div>

            <form onSubmit={handlePinResetSubmit} className="space-y-5">
              <div>
                <label className="text-xs font-medium text-gray-400 block mb-2">New PIN Code</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.g., 1234"
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-3 text-lg text-center font-mono tracking-[0.5em] text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-semibold text-gray-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#c7515e] hover:bg-[#b04753] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#c7515e]/20 transition-all active:scale-95"
                >
                  Save PIN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     </div>
  );
}