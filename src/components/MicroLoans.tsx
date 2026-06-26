import React, { useState, useEffect } from 'react';
import { Landmark, Award, ShieldAlert, CheckCircle, RefreshCw, BadgePercent, CircleDollarSign } from 'lucide-react';
import { LoanProduct, Loan, CreditScore } from '../types';
import { useToast } from './ToastContext';

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
  const toast = useToast();
  
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
        toast.success(data.message);
        setBorrowAmt('');
        fetchLoanData();
      } else {
        toast.error(data.error || 'Failed to apply for loan.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during loan application.');
    } finally {
      setLoading(false);
    }
  };

  const handleRepay = async (loanId: string, repayAmount: number) => {
    try {
      const res = await fetch('/api/loans/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loanId, amount: repayAmount })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchLoanData();
      } else {
        toast.error(data.error || 'Failed to process repayment.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during repayment process.');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Profile Context for credit scoring */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#0B0F19] p-4 rounded-xl border border-white/5">
        <div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest font-bold">Credit Profile Context</span>
          <p className="text-xs text-gray-400 mt-0.5">Evaluating live metrics, repayment consistency, and loan eligibility limits for your authenticated profile.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#141C2F] border border-white/5 px-3 py-1.5 text-xs text-brand font-medium">
          <Award className="h-4 w-4" />
          <span>Active Borrower Profile: {borrowerType === 'PARENT' ? 'Parent' : 'Vendor'} ({borrowerId})</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Loan Request Form */}
        <div className="lg:col-span-8 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3">
            <CircleDollarSign className="h-4.5 w-4.5 text-[#c7515e]" />
            <h3 className="text-sm font-medium text-gray-200">Apply for Micro-Credit Capital</h3>
          </div>

          <form onSubmit={handleApply} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1.5">Select Credit Product</label>
                <select
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) setSelectedProduct(prod);
                  }}
                  className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-2 text-xs text-gray-300"
                >
                  {products.filter(p => p.targetRole === borrowerType).map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.interestRate}% Int)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase block mb-1.5">Borrow Amount (UGX)</label>
                <input
                  type="number"
                  required
                  value={borrowAmt}
                  onChange={(e) => setBorrowAmt(e.target.value)}
                  placeholder={`Min: ${selectedProduct?.minAmount.toLocaleString()} UGX`}
                  className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-2 text-xs text-gray-200 font-mono"
                />
              </div>
            </div>

            {selectedProduct && (
              <div className="rounded-lg bg-[#06080E]/60 border border-white/5 p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">MATURITY WINDOW:</span>
                  <span className="text-white font-semibold">{selectedProduct.durationDays} Days duration</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-[10px] font-mono">INTEREST RATE:</span>
                  <span className="text-[#c7515e] font-bold">{selectedProduct.interestRate}% flat rate</span>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <span className="text-gray-500 block text-[10px] font-mono">COMMISSIONS REPAYMENT:</span>
                  <span className="text-amber-400 font-bold">POS auto-split sweeping</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !borrowAmt}
              className="w-full rounded-lg bg-[#c7515e] hover:bg-[#b04753] py-2 text-xs font-semibold text-white transition active:scale-95"
            >
              {loading ? 'Disbursing loan...' : 'Authorize Disbursement Request'}
            </button>
          </form>
        </div>

        {/* Credit Scoring Engine Card */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Award className="h-4.5 w-4.5 text-[#c7515e]" />
              <h3 className="text-sm font-medium text-gray-200">System Credit Score</h3>
            </div>

            {score ? (
              <div className="text-center py-4 space-y-2.5">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full border-4 border-[#c7515e]/20 bg-[#c7515e]/5">
                  <span className="text-2xl font-bold text-[#c7515e] font-mono">{score.score}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-xs mx-auto">
                  Score derived from 30-day transaction loops. High consistency yields optimal credit bands.
                </p>
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-gray-500">Calculating credit score...</div>
            )}
          </div>
        </div>

      </div>

      {/* Active Loan Ledgers */}
      <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
        <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">Active Loan Ledgers</h3>
        
        {activeLoans.length === 0 ? (
          <div className="py-6 text-center text-xs text-gray-500">
            No active outstanding loans for this profile.
          </div>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((loan) => {
              const remaining = loan.totalRepayable - loan.amountPaid;
              return (
                <div key={loan.id} className="p-4 rounded-xl bg-[#06080E]/60 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">Active Loan ID: {loan.id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950/40 text-amber-400 uppercase">
                        {loan.status}
                      </span>
                    </div>
                    <div className="text-gray-500 font-mono text-[11px] space-y-0.5">
                      <div>Principal Borrowed: {loan.amount.toLocaleString()} UGX</div>
                      <div>Interest: {loan.interest.toLocaleString()} UGX (Total: {loan.totalRepayable.toLocaleString()})</div>
                      <div>Due Date: {new Date(loan.dueDate).toLocaleDateString()}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                    <div className="text-right">
                      <span className="text-gray-500 block text-[10px] font-mono">REMAINING DEBT:</span>
                      <span className="text-emerald-400 font-bold font-mono text-sm">{remaining.toLocaleString()} UGX</span>
                    </div>
                    <button
                      onClick={() => handleRepay(loan.id, remaining)}
                      className="rounded bg-[#c7515e] hover:bg-[#b04753] px-4 py-1.5 text-xs font-semibold text-white transition active:scale-95"
                    >
                      Clear Debt (Repay)
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
