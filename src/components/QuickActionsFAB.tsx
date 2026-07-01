import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Sparkles,
  Smartphone,
  CreditCard,
  ArrowRightLeft,
  X,
  Camera,
  Loader2,
  CheckCircle2,
  Percent,
  TrendingUp,
  Plus,
  AlertCircle
} from 'lucide-react';
import { useToast } from './ToastContext';
import { LoggedInUser } from './Login';

interface QuickActionsFABProps {
  user: LoggedInUser;
}

export default function QuickActionsFAB({ user }: QuickActionsFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'SCAN_QR' | 'SEND_FUNDS' | 'LOAN_INQUIRY' | null>(null);
  const toast = useToast();

  // ── QR SCANNER SIMULATION STATE ──
  const [selectedStudentCode, setSelectedStudentCode] = useState('KPS-2026-004');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);
  const [payAmt, setPayAmt] = useState('3500');
  const [selectedItem, setSelectedItem] = useState('Rolex Roll (Chapati & Eggs)');

  // ── SEND & TOP UP STATE ──
  const [momoPhone, setMomoPhone] = useState(user.phone || '+256771000111');
  const [amount, setAmount] = useState('10000');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // ── CREDIT MATRIX STATE ──
  const [checkingScore, setCheckingScore] = useState(false);
  const [scoreResult, setScoreResult] = useState<any | null>(null);

  const toggleMenu = () => setIsOpen(!isOpen);

  // ── SIMULATE SCANNING QR ──
  const handleStartScan = () => {
    setScanning(true);
    setScanResult(null);
    setTimeout(() => {
      setScanning(false);
      // Mock student data lookup
      const studentsDb: Record<string, any> = {
        'KPS-2026-004': { name: 'Brian Mukasa', school: 'Kampala Parents Primary', balance: 25000, class: 'Primary 5' },
        'KPS-2026-012': { name: 'Joan Kembabazi', school: 'Kampala Parents Primary', balance: 12000, class: 'Primary 4' },
        'NMS-2026-088': { name: 'Aisha Nabakooza', school: 'Nakasero Model School', balance: 45000, class: 'Primary 6' }
      };
      const found = studentsDb[selectedStudentCode] || { name: 'Walk-In Student Card', school: 'Kampala Parents Primary', balance: 15000, class: 'Primary 3' };
      setScanResult(found);
      toast.success('Secure QR Card read successfully!');
    }, 1800);
  };

  const handleExecutePayment = () => {
    if (!scanResult) return;
    const price = parseInt(payAmt);
    if (scanResult.balance < price) {
      toast.error('Insufficient Pocket Money ledger balance!');
      return;
    }
    setScanResult((prev: any) => ({ ...prev, balance: prev.balance - price }));
    toast.success(`Paid ${price.toLocaleString()} UGX for ${selectedItem}! Instant School Commission split calculated.`);
    setActiveModal(null);
  };

  // ── SIMULATE MOMO SECURE SEND ──
  const handleSendFunds = (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSendSuccess(true);
      toast.success(`Successfully loaded ${parseInt(amount).toLocaleString()} UGX via Collecto MoMo Gateway.`);
    }, 2000);
  };

  // ── SIMULATE CREDIT SCORE ASSESSMENT ──
  const handleCheckScore = () => {
    setCheckingScore(true);
    setScoreResult(null);
    setTimeout(() => {
      setCheckingScore(false);
      // Generate realistic dynamic score
      const baseScore = user.role === 'VENDOR' ? 790 : user.role === 'PARENT' ? 710 : 640;
      setScoreResult({
        score: baseScore,
        grade: baseScore >= 750 ? 'EXCELLENT' : baseScore >= 680 ? 'GOOD' : 'AVERAGE',
        limit: baseScore >= 750 ? 100000 : baseScore >= 680 ? 50000 : 20000,
        rate: baseScore >= 750 ? '1.5%' : baseScore >= 680 ? '2.5%' : '4.0%',
        matrix: {
          repaymentHistory: '98%',
          utilization: '12%',
          activeDays30: '28 Days'
        }
      });
      toast.success('Real-time 30-day transaction score computed.');
    }, 1500);
  };

  const resetAllStates = () => {
    setScanResult(null);
    setScanning(false);
    setSendSuccess(false);
    setSending(false);
    setScoreResult(null);
    setCheckingScore(false);
  };

  return (
    <>
      {/* ── FAB BUTTON ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 font-sans">
        
        {/* Expanded actions list */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="flex flex-col gap-2 mb-2 bg-slate-900/95 backdrop-blur-md border border-slate-800/80 p-3.5 rounded-2xl shadow-2xl w-56 text-left"
            >
              <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-800/80 pb-2 mb-1.5 flex items-center justify-between">
                <span>Quick Ledger Portal</span>
                <Sparkles className="h-3.5 w-3.5 text-[#c7515e] animate-pulse" />
              </div>

              {/* Action: Scan Card QR */}
              <button
                onClick={() => {
                  resetAllStates();
                  setActiveModal('SCAN_QR');
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-3 p-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 transition-all group"
              >
                <div className="bg-[#c7515e]/10 group-hover:bg-[#c7515e]/20 p-2 rounded-lg text-[#c7515e] transition-colors">
                  <QrCode className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="group-hover:text-[#c7515e] transition-colors">Scan QR Card</div>
                  <div className="text-[9px] text-slate-500 font-medium">POS scan mock-up</div>
                </div>
              </button>

              {/* Action: Mobile Money Topup */}
              <button
                onClick={() => {
                  resetAllStates();
                  setActiveModal('SEND_FUNDS');
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-3 p-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 transition-all group"
              >
                <div className="bg-[#c7515e]/10 group-hover:bg-[#c7515e]/20 p-2 rounded-lg text-[#c7515e] transition-colors">
                  <ArrowRightLeft className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="group-hover:text-[#c7515e] transition-colors">Top Up Funds</div>
                  <div className="text-[9px] text-slate-500 font-medium">MoMo Collecto Gateway</div>
                </div>
              </button>

              {/* Action: Credit Score matrix */}
              <button
                onClick={() => {
                  resetAllStates();
                  setActiveModal('LOAN_INQUIRY');
                  setIsOpen(false);
                }}
                className="w-full text-left flex items-center gap-3 p-2 rounded-xl text-xs font-bold text-slate-200 hover:bg-white/5 transition-all group"
              >
                <div className="bg-[#c7515e]/10 group-hover:bg-[#c7515e]/20 p-2 rounded-lg text-[#c7515e] transition-colors">
                  <CreditCard className="h-4.5 w-4.5" />
                </div>
                <div>
                  <div className="group-hover:text-[#c7515e] transition-colors">Loan Inquiry</div>
                  <div className="text-[9px] text-slate-500 font-medium">Credit scoring matrix</div>
                </div>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Floating Trigger */}
        <button
          onClick={toggleMenu}
          className={`h-14 w-14 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 border border-[#c7515e]/20 hover:border-[#c7515e]/50 ${
            isOpen ? 'bg-slate-800 rotate-90' : 'bg-[#c7515e] shadow-[#c7515e]/25 hover:bg-[#b04753]'
          }`}
          style={{ cursor: 'pointer' }}
          title="Quick Actions Menu"
        >
          {isOpen ? (
            <X className="h-6 w-6 text-slate-300" />
          ) : (
            <Plus className="h-6 w-6 text-white" />
          )}
        </button>
      </div>

      {/* ── MODALS INTEGRATION ── */}
      <AnimatePresence>
        
        {/* 1. SCAN QR CARD OVERLAY SIMULATOR */}
        {activeModal === 'SCAN_QR' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-left space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#c7515e]/20 p-2.5 rounded-xl text-[#c7515e]">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Uganda Edu Pay POS Scan Simulator</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Offline-First QR Standard</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Scan box simulator */}
              {!scanResult && (
                <div className="space-y-4">
                  <div className="rounded-xl bg-slate-950 p-3 border border-slate-800 text-xs text-slate-300">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2 font-mono">Select Student QR to Scan</label>
                    <select
                      value={selectedStudentCode}
                      onChange={(e) => setSelectedStudentCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-800 bg-slate-900 p-2 text-xs text-slate-300 outline-none focus:border-[#c7515e]"
                    >
                      <option value="KPS-2026-004">KPS-2026-004 - Brian Mukasa (P5)</option>
                      <option value="KPS-2026-012">KPS-2026-012 - Joan Kembabazi (P4)</option>
                      <option value="NMS-2026-088">NMS-2026-088 - Aisha Nabakooza (P6)</option>
                    </select>
                  </div>

                  <div className="h-44 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center relative overflow-hidden">
                    {scanning ? (
                      <>
                        <motion.div
                          animate={{ y: [-60, 60] }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                          className="absolute left-10 right-10 h-0.5 bg-emerald-500 shadow-[0_0_12px_#10b981]"
                        />
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-7 w-7 text-emerald-400 animate-spin" />
                          <span className="text-[11px] text-emerald-400 font-mono tracking-wider uppercase animate-pulse">Reading Chip...</span>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={handleStartScan}
                        className="rounded-xl bg-[#c7515e] hover:bg-[#b04753] px-5 py-3 text-xs font-bold text-white shadow-lg transition active:scale-95 flex items-center gap-2"
                      >
                        <Camera className="h-4.5 w-4.5" />
                        Simulate Card Scanner
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Scan Results found & payment initiation */}
              {scanResult && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                      <div>
                        <h4 className="text-sm font-bold text-white">{scanResult.name}</h4>
                        <p className="text-[10px] text-slate-400 mt-0.5">{scanResult.school} ({scanResult.class})</p>
                      </div>
                      <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">Linked Card</span>
                    </div>

                    <div className="flex justify-between items-center py-1">
                      <span className="text-xs text-slate-500">Available Pocket Money:</span>
                      <span className="font-mono text-emerald-400 font-bold text-sm bg-emerald-400/10 px-2 py-0.5 rounded">
                        {scanResult.balance.toLocaleString()} UGX
                      </span>
                    </div>
                  </div>

                  {/* Payment controls mock */}
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Item Purchase</label>
                        <select
                          value={selectedItem}
                          onChange={(e) => {
                            setSelectedItem(e.target.value);
                            if (e.target.value.includes('chapati')) setPayAmt('3500');
                            else if (e.target.value.includes('Soda')) setPayAmt('2000');
                            else if (e.target.value.includes('Book')) setPayAmt('5000');
                          }}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none"
                        >
                          <option value="Rolex Roll (Chapati & Eggs)">Chapati Rolex - 3,500 UGX</option>
                          <option value="Cold Soda 350ml">Cold Soda - 2,000 UGX</option>
                          <option value="A4 Exercise Notebook">A4 Notebook - 5,000 UGX</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1">Price (UGX)</label>
                        <input
                          type="number"
                          value={payAmt}
                          onChange={(e) => setPayAmt(e.target.value)}
                          className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-300 outline-none font-mono font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                      <button
                        onClick={() => setScanResult(null)}
                        className="flex-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white py-2.5 transition"
                      >
                        Re-scan
                      </button>
                      <button
                        onClick={handleExecutePayment}
                        className="flex-1 rounded-xl bg-[#c7515e] hover:bg-[#b04753] text-xs font-bold text-white py-2.5 transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
                      >
                        Authorize Checkout
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 2. SEND & TOP UP FUNDS MODAL */}
        {activeModal === 'SEND_FUNDS' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-left space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#c7515e]/20 p-2.5 rounded-xl text-[#c7515e]">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Mobile Money Collecto Push Gateway</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Collecto Sandbox Protocol</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!sendSuccess ? (
                <form onSubmit={handleSendFunds} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Sender MoMo Number</label>
                    <input
                      type="text"
                      required
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      placeholder="+256771000111"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c7515e] font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 font-bold">Top-Up Amount (UGX)</label>
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs text-white outline-none focus:border-[#c7515e] font-mono font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full rounded-xl bg-[#c7515e] hover:bg-[#b04753] py-3 text-xs font-bold text-white transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#c7515e]/20 disabled:opacity-60"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Triggering Secure Push...
                      </>
                    ) : (
                      'Request MoMo Pin Verification'
                    )}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col items-center text-center p-4 space-y-4">
                  <div className="bg-emerald-500/10 p-3 rounded-full text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="h-10 w-10 animate-bounce" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Payment Received!</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      Collecto Gateway cleared {parseInt(amount).toLocaleString()} UGX ledger split. Your family wallets reflect updated balances.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="w-full rounded-xl bg-[#c7515e] hover:bg-[#b04753] py-2.5 text-xs font-bold text-white transition"
                  >
                    Close Portal
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* 3. CREDIT MATRIX LOAN INQUIRY MODAL */}
        {activeModal === 'LOAN_INQUIRY' && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 shadow-2xl text-left space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#c7515e]/20 p-2.5 rounded-xl text-[#c7515e]">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">30-Day Credit Matrix Scorer</h3>
                    <p className="text-[10px] text-slate-400 font-mono">Dynamic Ledger Analytics Engine</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveModal(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {!scoreResult ? (
                <div className="flex flex-col items-center text-center p-4 space-y-4">
                  <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs text-slate-300 leading-relaxed text-left w-full space-y-2">
                    <span className="font-bold text-[#c7515e] uppercase tracking-wider block text-[10px]">What is the Credit Scoring Matrix?</span>
                    <p>
                      Our Phase 1.5 system scans parent MoMo deposit frequencies and merchant sales volumes on school campuses to formulate credit score metrics instantly.
                    </p>
                  </div>

                  <button
                    onClick={handleCheckScore}
                    disabled={checkingScore}
                    className="w-full rounded-xl bg-[#c7515e] hover:bg-[#b04753] py-3 text-xs font-bold text-white transition active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-[#c7515e]/20 disabled:opacity-60"
                  >
                    {checkingScore ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Running Scorer Matrix...
                      </>
                    ) : (
                      'Check Micro-Loan Eligibility'
                    )}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-2">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Assessed Score</span>
                    <div className="text-3xl font-bold text-white flex items-center justify-center gap-1.5">
                      <span className="text-[#c7515e]">{scoreResult.score}</span>
                      <span className="text-slate-600 text-sm">/ 900</span>
                    </div>
                    <span className="inline-block text-[9px] font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-bold">
                      {scoreResult.grade} STANDING
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] uppercase">Eligible Limit</span>
                      <span className="text-white font-bold text-sm block mt-1">{scoreResult.limit.toLocaleString()} UGX</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500 block text-[9px] uppercase">Daily Interest</span>
                      <span className="text-[#c7515e] font-bold text-sm block mt-1">{scoreResult.rate}</span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-slate-950 p-4 border border-slate-800 text-xs space-y-2 text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Repayment Track Record:</span>
                      <span className="font-bold text-white">{scoreResult.matrix.repaymentHistory}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Active POS Days (30d):</span>
                      <span className="font-bold text-white">{scoreResult.matrix.activeDays30}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setScoreResult(null)}
                      className="flex-1 rounded-xl border border-slate-800 text-xs font-bold text-slate-400 hover:text-white py-2.5 transition"
                    >
                      Re-Calculate
                    </button>
                    <button
                      onClick={() => {
                        toast.success('Applying from quick-actions menu. Check the Loans dashboard panel.');
                        setActiveModal(null);
                      }}
                      className="flex-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-xs font-bold text-white py-2.5 transition active:scale-95 shadow-lg shadow-emerald-500/20"
                    >
                      Apply Instantly
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
        
      </AnimatePresence>
    </>
  );
}
