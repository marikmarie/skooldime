import React, { useState, useEffect } from 'react';
import { Smartphone, Shield, ArrowRightLeft, Landmark, RefreshCw, Key, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Parent, Student, Transaction } from '../types';

interface RoleParentProps {
  userPhone?: string;
}

export default function RoleParent({ userPhone = '+256772444555' }: RoleParentProps) {
  const [parent, setParent] = useState<Parent | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Top up states
  const [depositAmt, setDepositAmt] = useState('');
  const [depositPhone, setDepositPhone] = useState('');
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
        const currentParent = parentsList.find((p: any) => p.phone === userPhone); // Dynamic parent
        setParent(currentParent || null);

        if (currentParent) {
          const studRes = await fetch('/api/students');
          const studData = await studRes.json();
          if (Array.isArray(studData)) {
            // Get linked children (Brian & Patricia)
            const linked = studData.filter((s: Student) => s.parentPhone === currentParent.phone);
            setStudents(linked);
            if (linked.length > 0) setSelectedStudentId(linked[0].id);
          }
        }
      }

      // Fetch transaction logs
      const logsRes = await fetch('/api/audit-logs');
      // We can simulate transactions too
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
    setPollingMsg('Initiating Collecto STK Push... Check phone screen.');
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/collecto/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPhone: '+256772444555', amount: Number(depositAmt) })
      });
      const data = await res.json();
      if (data.success) {
        setPollingTxId(data.transactionId);
        startPolling(data.transactionId);
      } else {
        setErrorMsg(data.error || 'Failed to initiate deposit.');
        setLoading(false);
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during deposit request.');
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
          setSuccessMsg(`Deposit approved! credited ${Number(depositAmt).toLocaleString()} UGX to Parent wallet.`);
          setPollingTxId(null);
          setDepositAmt('');
          setLoading(false);
          fetchParentAndChildren();
        } else if (attempts > 5) {
          // Fallback timeout
          clearInterval(interval);
          setPollingTxId(null);
          setLoading(false);
          setErrorMsg('STK Push polling timed out. No approval received.');
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
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/parents/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPhone: '+256772444555',
          studentId: selectedStudentId,
          amount: Number(allocateAmt)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setAllocateAmt('');
        fetchParentAndChildren();
      } else {
        setErrorMsg(data.error || 'Failed to allocate pocket money.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during pocket money allocation.');
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
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await fetch('/api/students/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: pinStudentId,
          newPin,
          parentPhone: '+256772444555'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('Student PIN reset completed. Updated security matrix.');
        setShowPinModal(false);
        setNewPin('');
        fetchParentAndChildren();
      } else {
        setErrorMsg(data.error || 'Failed to reset PIN.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during PIN reset.');
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
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/students/limit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: limitStudentId, limit: Number(spendingLimit) })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setShowLimitModal(false);
        fetchParentAndChildren();
      } else {
        setErrorMsg(data.error || 'Failed to update spending limit.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during spending limit update.');
    }
  };

  if (!parent) return <div className="text-gray-400 text-xs">Loading Parent Portal Profile...</div>;

  return (
    <div className="space-y-6">
      
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-300">
          <span className="text-rose-400 shrink-0 text-base font-bold">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Indicators Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Parent Wallet */}
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Parent Fund Wallet Balance</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">{parent.walletBalance.toLocaleString()} UGX</h4>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        {/* Linked Accounts */}
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Linked Student Cards</span>
            <h4 className="text-xl font-bold text-white mt-1">{students.length} Active Siblings</h4>
          </div>
          <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>

        {/* Identity Verification */}
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">NIN Verification (KYC)</span>
            <h4 className="text-xl font-bold text-sky-400 mt-1">Tier 2 Verified</h4>
          </div>
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400">
            <Shield className="h-5 w-5" />
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Linked student ledger controls (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">Linked Family Ledger Control</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {students.map((stud) => (
                <div key={stud.id} className="p-4 rounded-xl bg-[#06080E]/60 border border-white/5 space-y-4">
                  <div className="flex items-center gap-3">
                    <img src={stud.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-xs font-bold text-white">{stud.name}</h4>
                      <p className="text-[10px] text-gray-500">{stud.class}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono py-2.5 border-y border-white/5">
                    <div>
                      <span className="text-gray-500 block">CARD CODE:</span>
                      <span className="text-gray-300 font-bold text-[11px]">{stud.qrHash}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">NO-PIN TRANSACTION LIMIT:</span>
                      <span className="text-sky-400 font-bold text-[11px]">{stud.noPinLimit.toLocaleString()} UGX</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => triggerPinReset(stud.id)}
                      className="flex-1 rounded border border-white/10 bg-white/5 hover:bg-white/10 py-1.5 text-center text-xs text-gray-300 font-semibold"
                    >
                      Reset card PIN
                    </button>
                    <button
                      onClick={() => triggerLimitModal(stud.id, stud.noPinLimit)}
                      className="flex-1 rounded border border-sky-500/20 bg-sky-500/5 hover:bg-sky-500/10 py-1.5 text-center text-xs text-sky-400 font-semibold"
                    >
                      Edit limits
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Allocate pocket money (3.2) */}
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <ArrowRightLeft className="h-4.5 w-4.5 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-200">Allocate pocket money ledger split</h3>
            </div>

            <form onSubmit={handleAllocateSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300"
              >
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input
                type="number"
                required
                value={allocateAmt}
                onChange={(e) => setAllocateAmt(e.target.value)}
                placeholder="Amount (UGX)"
                className="rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200"
              />
              <button
                type="submit"
                className="rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition active:scale-95"
              >
                Send pocket money
              </button>
            </form>
          </div>
        </div>

        {/* Top-Up via Collecto MoMo Gateway (4 cols) */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">Collecto payment gateway top-up (STK push)</h3>
          
          <form onSubmit={handleDepositSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">MoMo Number</label>
              <input
                type="text"
                required
                value={depositPhone}
                onChange={(e) => setDepositPhone(e.target.value)}
                placeholder="+256772444555"
                className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Top up Amount</label>
              <input
                type="number"
                required
                value={depositAmt}
                onChange={(e) => setDepositAmt(e.target.value)}
                placeholder="Amount UGX"
                className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200 font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2.5 text-xs font-semibold text-white transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  Processing...
                </>
              ) : 'Initiate Secure Deposit'}
            </button>
          </form>

          {loading && (
            <div className="rounded bg-[#06080E] p-3 text-[11px] text-amber-300 font-mono border border-amber-500/20 leading-relaxed text-center">
              {pollingMsg}
            </div>
          )}
        </div>

      </div>

      {/* Edit Spend Limit Modal */}
      {showLimitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-xl border border-white/10 bg-[#0F1424] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Shield className="h-5 w-5 text-sky-400" />
              <h4 className="text-sm font-semibold text-white">Adjust Daily spend limit</h4>
            </div>

            <form onSubmit={handleLimitSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">Max No-PIN Transaction Value (UGX)</label>
                <input
                  type="number"
                  required
                  value={spendingLimit}
                  onChange={(e) => setSpendingLimit(e.target.value)}
                  className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 font-mono"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowLimitModal(false)}
                  className="rounded border border-white/10 px-3 py-1.5 text-xs text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Save parameter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-xl border border-white/10 bg-[#0F1424] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Key className="h-5 w-5 text-purple-400" />
              <h4 className="text-sm font-semibold text-white">Secure 4-Digit PIN Update</h4>
            </div>

            <form onSubmit={handlePinResetSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono text-gray-400 block mb-1">New PIN code</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.p. 1234"
                  className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-center font-mono tracking-widest text-gray-300"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="rounded border border-white/10 px-3 py-1.5 text-xs text-gray-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white"
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
