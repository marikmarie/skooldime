import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, ArrowRightLeft, Landmark, RefreshCw, Key, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Parent, Student, Transaction } from '../types';
import { useToast } from './ToastContext';

interface RoleParentProps {
  userPhone?: string;
}

export default function RoleParent({ userPhone = '+256772444555' }: RoleParentProps) {
  const [parent, setParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeParentTab, setActiveParentTab] = useState<'CARDS' | 'FUNDS'>('CARDS');
  // const [transactions, setTransactions] = useState<Transaction[]>([]); // Kept for future use
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
          if (Array.isArray(studData)) {
            const linked = studData.filter((s: Student) => s.parentPhone === currentParent.phone);
            setStudents(linked);
            if (linked.length > 0) setSelectedStudentId(linked[0].id);
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
    <div className="space-y-6 max-w-7xl mx-auto">
      
      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 flex items-center justify-between hover:border-[#c7515e]/30 transition-colors shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Parent Fund Balance</span>
            <h4 className="text-2xl font-bold text-white mt-1">{parent.walletBalance.toLocaleString()} <span className="text-sm font-medium text-gray-400">UGX</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 flex items-center justify-between hover:border-[#c7515e]/30 transition-colors shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Linked Student Cards</span>
            <h4 className="text-2xl font-bold text-white mt-1">{students.length} <span className="text-sm font-medium text-gray-400">Active</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Smartphone className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 flex items-center justify-between hover:border-[#c7515e]/30 transition-colors shadow-lg">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Identity Verification</span>
            <h4 className="text-2xl font-bold text-white mt-1">Tier 2 <span className="text-sm font-medium text-gray-400">Verified</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Shield className="h-6 w-6" />
          </div>
        </div>

      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveParentTab('CARDS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeParentTab === 'CARDS'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
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
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <ArrowRightLeft className="h-4 w-4" />
          <span>Send & Top Up</span>
        </button>
      </div>

      {activeParentTab === 'CARDS' && (
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-5">
          <h3 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-4 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-[#c7515e]" />
            Linked Family Ledger Control
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {students.map((stud) => (
              <div key={stud.id} className="p-4 sm:p-5 rounded-xl bg-[#06080E]/80 border border-white/5 hover:border-[#c7515e]/20 transition-all space-y-4">
                <div className="flex items-center gap-4">
                  <img src={stud.avatarUrl} alt="" className="w-12 h-12 rounded-full border-2 border-[#c7515e]/30 shrink-0" referrerPolicy="no-referrer" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate">{stud.name}</h4>
                    <p className="text-[11px] text-[#c7515e] font-medium">{stud.class}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px] font-mono py-3 border-y border-white/5">
                  <div className="min-w-0">
                    <span className="text-gray-500 block mb-1">CARD CODE</span>
                    <span className="text-gray-200 font-bold text-[10px] sm:text-[11px] bg-white/5 px-2 py-0.5 rounded truncate block">{stud.qrHash}</span>
                  </div>
                  <div className="min-w-0">
                    <span className="text-gray-500 block mb-1">NO-PIN LIMIT</span>
                    <span className="text-[#c7515e] font-bold text-[10px] sm:text-[11px] bg-[#c7515e]/10 px-2 py-0.5 rounded truncate block">{stud.noPinLimit.toLocaleString()} UGX</span>
                  </div>
                </div>

                <div className="flex gap-2 sm:gap-3">
                  <button
                    onClick={() => triggerPinReset(stud.id)}
                    className="flex-1 rounded-lg border border-white/10 bg-transparent hover:bg-white/5 py-2 text-center text-xs text-gray-300 font-semibold transition-colors"
                  >
                    Reset PIN
                  </button>
                  <button
                    onClick={() => triggerLimitModal(stud.id, stud.noPinLimit)}
                    className="flex-1 rounded-lg border border-[#c7515e]/30 bg-[#c7515e]/10 hover:bg-[#c7515e]/20 py-2 text-center text-xs text-[#c7515e] font-semibold transition-colors"
                  >
                    Edit Limits
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
          <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-5">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <ArrowRightLeft className="h-5 w-5 text-[#c7515e]" />
              <h3 className="text-sm font-bold text-gray-200">Allocate Pocket Money</h3>
            </div>

            <form onSubmit={handleAllocateSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-gray-200 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                >
                  {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Amount (UGX)</label>
                <input
                  type="number"
                  required
                  value={allocateAmt}
                  onChange={(e) => setAllocateAmt(e.target.value)}
                  placeholder="e.g., 5000"
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-gray-200 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#c7515e] hover:bg-[#b04753] py-2.5 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-[#c7515e]/20"
              >
                Send Funds
              </button>
            </form>
          </div>

          {/* Top-Up via Collecto MoMo Gateway (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl h-fit space-y-5">
            <h3 className="text-sm font-bold text-gray-200 border-b border-white/5 pb-4 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-[#c7515e]" />
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
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-gray-200 font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
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
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-gray-200 font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#c7515e] hover:bg-[#b04753] py-3 text-sm font-bold text-white transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#c7515e]/20 disabled:opacity-70 disabled:active:scale-100"
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
              <div className="rounded-lg bg-[#06080E] p-4 text-[11px] text-[#c7515e] font-mono border border-[#c7515e]/20 leading-relaxed text-center animate-pulse">
                {pollingMsg}
              </div>
            )}
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