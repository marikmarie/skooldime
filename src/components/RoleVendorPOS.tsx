import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, QrCode, ClipboardList, RefreshCw, Key, ArrowRight, 
  UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, Search, Plus, CreditCard, Banknote
} from 'lucide-react';
import { Student, CatalogItem, Transaction } from '../types';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

interface RoleVendorPOSProps {
  userPhone?: string;
}

export default function RoleVendorPOS({ userPhone = '+256771000111' }: RoleVendorPOSProps) {
  const [vendor, setVendor] = useState<any>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  // Custom manual item input
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  // POS scanning state
  const [scannedStudent, setScannedStudent] = useState<any | null>(null);
  const [searchQr, setSearchQr] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Pin & Auth
  const [showPinModal, setShowPinModal] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');

  // Shift & Refund
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showZReport, setShowZReport] = useState(false);
  const [zReportData, setZReportData] = useState<any | null>(null);
  const [managerPin, setManagerPin] = useState('');
  const [refundTxnId, setRefundTxnId] = useState<string | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

  // Withdrawal state
  const [withdrawAmt, setWithdrawAmt] = useState('');
  const [withdrawPhone, setWithdrawPhone] = useState('');
  const [merchantBalance, setMerchantBalance] = useState(180000);

  const fetchBaseData = async () => {
    try {
      const vendorsRes = await fetch('/api/vendors');
      const vendorsList = await vendorsRes.json();
      let currentVendor = { id: 'V1', name: 'Mama Betty Canteen', schoolId: 'S1', phone: '+256771000111' };
      if (Array.isArray(vendorsList)) {
        const found = vendorsList.find((v: any) => v.phone === userPhone);
        if (found) currentVendor = found;
      }
      setVendor(currentVendor);

      const catRes = await fetch(`/api/pos/catalog/${currentVendor.id}`);
      const catData = await catRes.json();
      if (Array.isArray(catData)) setCatalog(catData);

      const studRes = await fetch('/api/students');
      const studData = await studRes.json();
      if (Array.isArray(studData)) setAllStudents(studData);

    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, [userPhone]);

  const handleScanQr = async (qrHash: string) => {
    if (!qrHash) return;
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch(`/api/pos/scan/${qrHash}`);
      const data = await res.json();
      if (data.success) {
        setScannedStudent(data.student);
        setSearchQr(qrHash);
      } else {
        setErrorMsg(data.error || 'Failed to scan student.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred while scanning student.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (name: string, price: number) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.name === name);
      if (existing) {
        return prev.map((item) =>
          item.name === name ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { name, price, quantity: 1 }];
    });
  };

  const handleRemoveFromCart = (name: string) => {
    setCart((prev) => prev.filter(item => item.name !== name));
  };

  const handleCustomAddToCart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName || !customPrice) return;
    handleAddToCart(customName, Number(customPrice));
    setCustomName('');
    setCustomPrice('');
  };

  const cartTotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    setSuccessMsg('');
    setErrorMsg('');
    if (!scannedStudent) {
      setErrorMsg('Please scan a Student QR Code card before checkout.');
      return;
    }
    if (cartTotal <= 0) {
      setErrorMsg('Cart is empty.');
      return;
    }
    if (cartTotal > scannedStudent.noPinLimit) {
      setShowPinModal(true);
      return;
    }
    executeCheckoutRequest(null);
  };

  const executeCheckoutRequest = async (pinCode: string | null) => {
    setLoading(true);
    setPinError('');
    setErrorMsg('');

    const payload = {
      studentId: scannedStudent.id,
      vendorId: vendor?.id || 'V1',
      items: cart,
      total: cartTotal,
      pin: pinCode
    };

    try {
      const res = await fetch('/api/pos/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Checkout approved! Receipt: ${data.referenceCode}. Loaded ${cartTotal.toLocaleString()} UGX ledger split.`);
        setCart([]);
        setScannedStudent(null);
        setSearchQr('');
        setShowPinModal(false);
        setEnteredPin('');
        
        const newTxn: Transaction = {
          id: `tx_pos_${Date.now()}`,
          referenceCode: data.referenceCode,
          senderWalletId: `W_${payload.studentId}`,
          receiverWalletId: vendor ? `W_${vendor.id}` : 'W_V1',
          amount: cartTotal,
          fee: cartTotal * 0.015,
          type: 'SPEND',
          status: 'SUCCESS',
          description: `POS purchase at ${vendor?.name || 'Merchant'}`,
          createdAt: new Date().toISOString()
        };
        setTransactions((prev) => [newTxn, ...prev]);
        setMerchantBalance(prev => prev + data.vendorReceived);
        fetchBaseData();
      } else if (data.pinRequired) {
        setShowPinModal(true);
      } else {
        setPinError(data.error);
        if (!pinCode) setErrorMsg(data.error || 'Checkout failed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboardClick = (num: string) => {
    if (enteredPin.length < 4) setEnteredPin((prev) => prev + num);
  };

  const handleKeyboardSubmit = () => {
    if (enteredPin.length === 4) executeCheckoutRequest(enteredPin);
  };

  const handleCloseRegister = () => {
    setErrorMsg('');
    if (managerPin !== '1234') {
      setErrorMsg('Invalid Manager Authorization PIN.');
      return;
    }
    const totalSales = transactions.filter(t => t.status === 'SUCCESS').reduce((acc, t) => acc + t.amount, 0);
    const totalRefunds = transactions.filter(t => t.status === 'FAILED').reduce((acc, t) => acc + t.amount, 0);
    
    setZReportData({
      timestamp: new Date().toISOString(),
      registerId: 'REG-KP-001',
      operator: 'Mama Betty Canteen',
      totalSales,
      totalRefunds,
      netSales: totalSales - totalRefunds,
      txnCount: transactions.length
    });
    setShowZReport(true);
    setManagerPin('');
  };

  const triggerRefund = (txnId: string) => {
    setRefundTxnId(txnId);
    setShowRefundModal(true);
  };

  const handleRefundSubmit = async () => {
    if (!refundTxnId) return;
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/pos/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: refundTxnId, vendorPin: managerPin, vendorId: vendor?.id || 'V1' })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('POS transaction successfully refunded.');
        setTransactions(prev => prev.map(t => t.referenceCode === refundTxnId || t.id === refundTxnId ? { ...t, status: 'FAILED' } : t));
        setShowRefundModal(false);
        setManagerPin('');
        setRefundTxnId(null);
      } else {
        setErrorMsg(data.error || 'Refund failed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred during refund process.');
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmt || !withdrawPhone) return;
    setLoading(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      const res = await fetch('/api/collecto/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor?.id || 'V1', amount: Number(withdrawAmt), phone: withdrawPhone })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setMerchantBalance(prev => prev - Number(withdrawAmt));
        setWithdrawAmt('');
        
        const wTxn: Transaction = {
          id: data.transactionId,
          referenceCode: data.referenceCode,
          senderWalletId: vendor ? `W_${vendor.id}` : 'W_V1',
          receiverWalletId: 'COLLECTO_PAYOUT_GATEWAY',
          amount: Number(withdrawAmt),
          fee: 1500,
          type: 'WITHDRAWAL',
          status: 'PENDING',
          description: 'Payout to Mobile Money',
          createdAt: new Date().toISOString()
        };
        setTransactions(prev => [wTxn, ...prev]);

        setTimeout(() => {
          setTransactions(prev =>
            prev.map(t => t.id === data.transactionId ? { ...t, status: 'SUCCESS', description: 'Payout completed successfully' } : t)
          );
        }, 5000);
      } else {
        setErrorMsg(data.error || 'Withdrawal failed.');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error occurred during withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* Notifications */}
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 flex items-center gap-3 text-sm text-emerald-200 shadow-sm">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 flex items-center gap-3 text-sm text-rose-200 shadow-sm">
          <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}

      {/* POS Top Section: Main Work Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Scanner & Catalog (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* 1. Student Identity Scanner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="bg-slate-800/50 border-b border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-indigo-400" />
                <h3 className="font-semibold text-slate-100">Customer Details</h3>
              </div>
              <div className="w-1/2 max-w-xs relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  value={searchQr}
                  onChange={(e) => handleScanQr(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
                >
                  <option value="">Scan or Select Student QR...</option>
                  {allStudents.map((s) => (
                    <option key={s.id} value={s.qrHash}>{s.name} ({s.class})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5">
              {scannedStudent ? (
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <img src={scannedStudent.avatarUrl} alt="" className="w-16 h-16 rounded-full border-2 border-indigo-500/30 shadow-lg" referrerPolicy="no-referrer" />
                  <div className="flex-1 text-center sm:text-left">
                    <h4 className="text-lg font-bold text-white">{scannedStudent.name}</h4>
                    <p className="text-sm text-slate-400">{scannedStudent.class}</p>
                  </div>
                  <div className="flex gap-4 w-full sm:w-auto">
                    <div className="bg-slate-950 rounded-lg p-3 flex-1 border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold tracking-wider block mb-1 uppercase">Available Balance</span>
                      <span className="text-emerald-400 font-mono font-bold text-lg">{scannedStudent.balance.toLocaleString()} UGX</span>
                    </div>
                    <div className="bg-slate-950 rounded-lg p-3 flex-1 border border-slate-800">
                      <span className="text-[10px] text-slate-500 font-bold tracking-wider block mb-1 uppercase">PIN-less Limit</span>
                      <span className="text-indigo-400 font-mono font-bold text-lg">{scannedStudent.noPinLimit.toLocaleString()} UGX</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-800 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-slate-400" />
                  </div>
                  <p>Awaiting customer card scan...</p>
                </div>
              )}
            </div>
          </div>

          {/* 2. Fast-Tap Catalog */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Plus className="h-5 w-5 text-indigo-400" /> Quick Add Items
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddToCart(item.name, item.price)}
                  className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 hover:bg-indigo-600/10 hover:border-indigo-500/50 p-4 text-left transition-all duration-200 active:scale-95 group flex flex-col justify-between h-24 shadow-sm"
                >
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-indigo-300 truncate w-full">{item.name}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-400/10 self-start px-2 py-1 rounded">{item.price.toLocaleString()} UGX</span>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-5 border-t border-slate-800">
              <form onSubmit={handleCustomAddToCart} className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    required
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter custom item name..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="w-full sm:w-40 relative">
                  <input
                    type="number"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Price (UGX)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 px-6 py-2.5 text-sm font-semibold text-white transition duration-200 whitespace-nowrap"
                >
                  Add Custom
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Basket & Checkout (4 cols) */}
        <div className="xl:col-span-4 rounded-xl border border-slate-800 bg-slate-900 shadow-xl flex flex-col h-full max-h-[800px]">
          <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-indigo-400" />
              <h3 className="font-semibold text-slate-100">Current Order</h3>
            </div>
            <span className="bg-indigo-500/20 text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full">
              {cart.reduce((a, c) => a + c.quantity, 0)} Items
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 py-10">
                <ShoppingCart className="h-10 w-10 opacity-20" />
                <p className="text-sm">Basket is empty</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center bg-slate-950 border border-slate-800 rounded-lg p-3 group">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200 text-sm">{item.name}</span>
                    <span className="text-slate-500 font-mono text-[11px]">{item.price.toLocaleString()} x {item.quantity}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="font-mono font-bold text-slate-100">{(item.price * item.quantity).toLocaleString()}</span>
                    <button onClick={() => handleRemoveFromCart(item.name)} className="text-[10px] text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity uppercase font-bold">Remove</button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-slate-800/50 border-t border-slate-800 space-y-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-slate-400 font-medium">Total Amount</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{cartTotal.toLocaleString()} <span className="text-sm text-emerald-600">UGX</span></span>
            </div>
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || !scannedStudent || loading}
              className={`w-full py-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 
                ${cart.length === 0 || !scannedStudent 
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                  : 'bg-indigo-600 hover:bg-indigo-500 hover:shadow-indigo-500/25 active:scale-[0.98]'}`}
            >
              {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
              {loading ? 'Processing...' : 'Complete Payment'}
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: Operations & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Transaction History (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
            <ClipboardList className="h-5 w-5 text-indigo-400" />
            <h3 className="font-semibold text-slate-100">Recent Transactions</h3>
          </div>
          <div className="overflow-x-auto max-h-64 scrollbar-thin">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-medium">Receipt Ref</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Type / Status</th>
                  <th className="pb-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.length === 0 ? (
                  <tr><td colSpan={4} className="py-4 text-center text-slate-500 text-sm">No transactions yet for this shift.</td></tr>
                ) : (
                  transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="py-3 font-mono text-slate-300 text-xs">{txn.referenceCode}</td>
                      <td className="py-3 font-bold text-white text-xs">{txn.amount.toLocaleString()} UGX</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide ${
                          txn.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                          txn.status === 'PENDING' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {txn.type} • {txn.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {txn.status === 'SUCCESS' && txn.type === 'SPEND' && (
                          <button
                            onClick={() => triggerRefund(txn.referenceCode)}
                            className="text-[11px] text-rose-400 hover:text-rose-300 font-medium bg-rose-400/10 px-2 py-1 rounded border border-rose-400/20 transition-colors"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Management Controls (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* MoMo Withdrawal Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                <Banknote className="h-5 w-5 text-emerald-400" /> Cash Out
              </h3>
              <div className="text-right flex flex-col">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Balance</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">{merchantBalance.toLocaleString()} UGX</span>
              </div>
            </div>
            
            <form onSubmit={handleWithdrawal} className="space-y-3">
              <input
                type="number"
                required
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                placeholder="Amount to withdraw"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <input
                type="text"
                required
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="Mobile Money Number (e.g. 077...)"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-emerald-600/10 border border-emerald-500/50 hover:bg-emerald-600 hover:text-white py-2.5 text-sm font-semibold text-emerald-400 transition active:scale-95"
              >
                {loading ? 'Processing...' : 'Transfer to MoMo'}
              </button>
            </form>
          </div>

          {/* EOD Register Close */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
            <h3 className="font-semibold text-slate-100 border-b border-slate-800 pb-3 mb-4">Shift End (Z-Report)</h3>
            <div className="space-y-3">
              <input
                type="password"
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="Manager PIN (1234)"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 text-center tracking-[0.5em] font-mono outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
              <button
                onClick={handleCloseRegister}
                className="w-full rounded-lg bg-rose-600/10 hover:bg-rose-600 border border-rose-500/30 text-rose-400 hover:text-white py-2.5 text-sm font-semibold transition active:scale-95"
              >
                Close Register & Print Report
              </button>
            </div>

            {zReportData && (
              <div className="mt-4 rounded-lg bg-slate-950 border border-slate-800 p-4 font-mono text-[11px] text-slate-400 space-y-1.5 shadow-inner">
                <span className="font-bold text-slate-200 block uppercase tracking-widest text-[10px] border-b border-slate-800 pb-2 mb-2">=== Z-REPORT GENERATED ===</span>
                <div className="flex justify-between"><span>Date:</span> <span>{new Date(zReportData.timestamp).toLocaleDateString()}</span></div>
                <div className="flex justify-between"><span>Register ID:</span> <span>{zReportData.registerId}</span></div>
                <div className="flex justify-between mt-2 pt-2 border-t border-slate-800 border-dashed">
                  <span>Net Sales:</span> <span className="text-emerald-400 font-bold">{zReportData.netSales.toLocaleString()} UGX</span>
                </div>
                <div className="flex justify-between"><span>Txn Count:</span> <span>{zReportData.txnCount}</span></div>
                <div className="text-center text-[9px] text-slate-600 mt-4 pt-2 border-t border-slate-800">EduTechMoney POS System</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODALS */}
      
      {/* PIN Authorization Modal */}
      {showPinModal && scannedStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-[340px] rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto bg-indigo-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-indigo-400" />
              </div>
              <h4 className="text-lg font-bold text-white">Enter Student PIN</h4>
              <p className="text-xs text-slate-400 mt-1">Required for amounts over {scannedStudent.noPinLimit.toLocaleString()} UGX</p>
            </div>

            {pinError && (
              <div className="mb-4 p-2 bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 rounded text-center font-medium">
                {pinError}
              </div>
            )}

            <div className="mb-6 rounded-xl bg-slate-950 border border-slate-800 py-4 text-center text-2xl font-mono tracking-[1em] pl-[1em] text-white shadow-inner">
              {enteredPin ? enteredPin.replace(/./g, '•') : <span className="opacity-0">.</span>}
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleKeyboardClick(n)}
                  className="rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 py-3 text-lg font-semibold text-white shadow-sm active:scale-95 transition-all"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setEnteredPin('')}
                className="rounded-xl bg-slate-800/50 border border-slate-700/50 text-rose-400 py-3 text-sm font-semibold active:scale-95 transition-all"
              >
                CLEAR
              </button>
              <button
                onClick={() => handleKeyboardClick('0')}
                className="rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 py-3 text-lg font-semibold text-white shadow-sm active:scale-95 transition-all"
              >
                0
              </button>
              <button
                onClick={handleKeyboardSubmit}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md active:scale-95 transition-all"
              >
                OK
              </button>
            </div>
            
            <div className="text-[10px] font-mono text-slate-500 text-center mb-4">
              Simulation Note: Default PIN is 1234
            </div>
            
            <button
              onClick={() => { setShowPinModal(false); setEnteredPin(''); }}
              className="w-full text-xs text-slate-500 hover:text-slate-300 transition-colors text-center"
            >
              Cancel Transaction
            </button>
          </div>
        </div>
      )}

      {/* Refund Manager Authorization Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center mb-5">
              <div className="bg-rose-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <h4 className="text-base font-bold text-white">Authorize Refund</h4>
              <p className="text-xs text-slate-400 mt-2">Enter manager PIN to void this receipt.</p>
            </div>

            <div className="space-y-4">
              <input
                type="password"
                required
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="PIN"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-center tracking-[1em] font-mono text-white outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 shadow-inner"
              />

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowRefundModal(false); setManagerPin(''); }}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-semibold text-slate-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRefundSubmit}
                  className="flex-1 rounded-lg bg-rose-600 hover:bg-rose-500 py-2.5 text-xs font-semibold text-white shadow-md transition-colors"
                >
                  Confirm Void
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}