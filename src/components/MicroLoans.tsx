import React, { useState, useEffect } from 'react';
import { Landmark, Award, ShieldAlert, CheckCircle, RefreshCw, BadgePercent, CircleDollarSign, AlertTriangle } from 'lucide-react';
import { LoanProduct, Loan, CreditScore } from '../types';

interface MicroLoansProps {
  defaultBorrowerId?: string;
  defaultBorrowerType?: 'VENDOR' | 'STAFF' | 'PARENT';
}

export default function MicroLoans({ 
  defaultBorrowerId = 'V1', 
  defaultBorrowerType = 'VENDOR' 
}: MicroLoansProps) {
  const [products, setProducts] = useState<LoanProduct[]>([]);
  const [activeLoans, setActiveLoans] = useState<Loan[]>([]);
  const [score, setScore] = useState<CreditScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Apply states
  const [selectedProduct, setSelectedProduct] = useState<LoanProduct | null>(null);
  const [borrowAmt, setBorrowAmt] = useState('');
  const [borrowerType, setBorrowerType] = useState<'VENDOR' | 'STAFF' | 'PARENT'>(defaultBorrowerType);
  const [borrowerId, setBorrowerId] = useState(defaultBorrowerId);

  useEffect(() => {
    setBorrowerId(defaultBorrowerId);
    setBorrowerType(defaultBorrowerType);
  }, [defaultBorrowerId, defaultBorrowerType]);

  const fetchLoanData = async () => {
    setLoading(true);
    try {
      const prodRes = await fetch('/api/loans/products');
      const prodData = await prodRes.json();
      if (Array.isArray(prodData)) {
        setProducts(prodData);
        if (prodData.length > 0) setSelectedProduct(prodData[0]);
      }

      // Fetch scores and active loans
      const scoreRes = await fetch(`/api/loans/score/${borrowerId}/${borrowerType}`);
      const scoreData = await scoreRes.json();
      setScore(scoreData);

      const activeRes = await fetch(`/api/loans/my-loans/${borrowerId}`);
      const activeData = await activeRes.json();
      if (Array.isArray(activeData)) {
        setActiveLoans(activeData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoanData();
  }, [borrowerId, borrowerType]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !borrowAmt) return;

    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedProduct.id,
          borrowerId,
          borrowerType,
          amount: Number(borrowAmt)
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setBorrowAmt('');
        fetchLoanData();
      } else {
        setErrorMsg(data.error || 'Failed to apply for loan.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during loan application.');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (loanId: string, repayAmount: number) => {
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/loans/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, amount: repayAmount })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        fetchLoanData();
      } else {
        setErrorMsg(data.error || 'Failed to process repayment.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during repayment process.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200">
      
      {/* System Messages */}
      {successMsg && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-sm text-emerald-300 shadow-lg">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-xl border border-[#c7515e]/30 bg-[#c7515e]/10 p-4 flex items-center gap-3 text-sm text-[#c7515e] shadow-lg">
          <AlertTriangle className="h-5 w-5 text-[#c7515e] shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* Profile Context for credit scoring */}
      <div className="flex flex-wrap items-center justify-between gap-5 bg-[#0B0F19] p-5 rounded-2xl border border-white/5 shadow-lg">
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">Credit Profile Context</span>
          <p className="text-sm text-gray-400 mt-1">Evaluating live metrics, repayment consistency, and loan eligibility limits.</p>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl bg-[#c7515e]/10 border border-[#c7515e]/20 px-4 py-2 text-sm text-[#c7515e] font-bold shadow-inner">
          <Award className="h-5 w-5" />
          <span>Active Profile: {borrowerType === 'PARENT' ? 'Parent' : 'Vendor'} ({borrowerId})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Loan Request Form */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl space-y-5 h-fit">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
              <CircleDollarSign className="h-5 w-5 text-[#c7515e]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">Apply for Micro-Credit Capital</h3>
          </div>

          <form onSubmit={handleApply} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Select Credit Product</label>
                <select
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) setSelectedProduct(prod);
                  }}
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-gray-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all appearance-none cursor-pointer"
                >
                  {products.filter(p => p.targetRole === borrowerType).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.interestRate}% Int)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Borrow Amount (UGX)</label>
                <input
                  type="number"
                  required
                  value={borrowAmt}
                  onChange={(e) => setBorrowAmt(e.target.value)}
                  placeholder={`Min: ${selectedProduct?.minAmount.toLocaleString()} UGX`}
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                />
              </div>
            </div>

            {selectedProduct && (
              <div className="rounded-xl bg-[#06080E]/80 border border-white/5 p-5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono tracking-widest font-bold mb-1">MATURITY WINDOW</span>
                  <span className="text-white font-bold">{selectedProduct.durationDays} Days duration</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono tracking-widest font-bold mb-1">INTEREST RATE</span>
                  <span className="text-[#c7515e] font-bold bg-[#c7515e]/10 px-2 py-0.5 rounded">{selectedProduct.interestRate}% flat rate</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-gray-500 block text-[10px] font-mono tracking-widest font-bold mb-1">REPAYMENT MODE</span>
                  <span className="text-gray-300 font-bold">POS auto-split sweeping</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !borrowAmt}
              className="w-full rounded-xl bg-[#c7515e] hover:bg-[#b04753] py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-[#c7515e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing Disbursement...' : 'Authorize Disbursement Request'}
            </button>
          </form>
        </div>

        {/* Credit Scoring Engine Card */}
        <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl h-fit">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
              <Award className="h-5 w-5 text-[#c7515e]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">System Credit Score</h3>
          </div>

          {score ? (
            <div className="text-center py-6 space-y-4">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-[#c7515e]/30 bg-[#c7515e]/10 shadow-[0_0_15px_rgba(199,81,94,0.2)]">
                <span className="text-3xl font-bold text-[#c7515e] font-mono tracking-tighter">{score.score}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[200px] mx-auto">
                Score derived from 30-day transaction loops. High consistency yields optimal credit bands.
              </p>
            </div>
          ) : (
            <div className="text-center py-10 text-sm font-medium text-gray-500 animate-pulse">
              Calculating credit score...
            </div>
          )}
        </div>

      </div>

      {/* Active Loan Ledgers */}
      <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl space-y-5">
        <h3 className="text-sm font-bold text-white tracking-wide border-b border-white/5 pb-4">Active Loan Ledgers</h3>
        
        {activeLoans.length === 0 ? (
          <div className="py-8 text-center text-sm font-medium text-gray-500 bg-[#06080E]/40 rounded-xl border border-white/5">
            No active outstanding loans for this profile.
          </div>
        ) : (
          <div className="space-y-4">
            {activeLoans.map((loan) => {
              const remaining = loan.totalRepayable - loan.amountPaid;
              return (
                <div key={loan.id} className="p-5 rounded-xl bg-[#06080E]/80 border border-white/5 hover:border-[#c7515e]/20 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-white text-sm">Loan ID: {loan.id}</span>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-[#c7515e]/10 text-[#c7515e] uppercase tracking-wider">
                        {loan.status}
                      </span>
                    </div>
                    <div className="text-gray-400 font-mono text-xs space-y-1.5 bg-white/5 p-3 rounded-lg inline-block">
                      <div><span className="text-gray-500">Principal:</span> {loan.amount.toLocaleString()} UGX</div>
                      <div><span className="text-gray-500">Interest:</span> {loan.interest.toLocaleString()} UGX</div>
                      <div><span className="text-gray-500">Due Date:</span> <span className="text-gray-300">{new Date(loan.dueDate).toLocaleDateString()}</span></div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto p-4 sm:p-0 rounded-lg sm:bg-transparent bg-white/5">
                    <div className="text-left sm:text-right">
                      <span className="text-gray-500 block text-[10px] font-mono tracking-widest font-bold mb-1">REMAINING DEBT</span>
                      <span className="text-emerald-400 font-bold font-mono text-lg">{remaining.toLocaleString()} UGX</span>
                    </div>
                    <button
                      onClick={() => handleRepay(loan.id, remaining)}
                      className="w-full sm:w-auto rounded-lg bg-[#c7515e] hover:bg-[#b04753] px-5 py-2.5 text-xs font-bold text-white transition-all active:scale-95 shadow-lg shadow-[#c7515e]/20"
                    >
                      Clear Debt
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}