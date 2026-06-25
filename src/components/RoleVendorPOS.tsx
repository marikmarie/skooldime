import React, { useState, useEffect } from 'react';
import { ShoppingCart, QrCode, ClipboardList, RefreshCw, Key, ArrowRight, UserCheck, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
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
      // Find dynamic vendor corresponding to userPhone
      const vendorsRes = await fetch('/api/vendors');
      const vendorsList = await vendorsRes.json();
      let currentVendor = { id: 'V1', name: 'Mama Betty Canteen', schoolId: 'S1', phone: '+256771000111' }; // fallback
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

      // Fetch audit/recent spend transactions
      const logRes = await fetch('/api/audit-logs'); // we can also pull standard transactions if available
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
        console.log(`[POS Scanner] Scanned student QR. Identity: ${data.student.name}, limit: ${data.student.noPinLimit}`);
      } else {
        setErrorMsg(data.error || 'Failed to scan student.');
      }
    } catch (e: any) {
      console.error(e);
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

    // Check limit parameters (Section 3.3)
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
        
        // Add transaction to local log for display
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
        if (!pinCode) {
          setErrorMsg(data.error || 'Checkout failed.');
        }
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyboardClick = (num: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin((prev) => prev + num);
    }
  };

  const handleKeyboardSubmit = () => {
    if (enteredPin.length === 4) {
      executeCheckoutRequest(enteredPin);
    }
  };

  // Close Register (Z-Report Generation) (3.4)
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

  // Refund Transaction (3.4)
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
        body: JSON.stringify({
          transactionId: refundTxnId,
          vendorPin: managerPin,
          vendorId: vendor?.id || 'V1'
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('POS transaction successfully refunded.');
        setTransactions(prev =>
          prev.map(t => t.referenceCode === refundTxnId || t.id === refundTxnId ? { ...t, status: 'FAILED' } : t)
        );
        setShowRefundModal(false);
        setManagerPin('');
        setRefundTxnId(null);
      } else {
        setErrorMsg(data.error || 'Refund failed.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during refund process.');
    }
  };

  // Withdraw money via Collecto Gateway
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
        body: JSON.stringify({
          vendorId: vendor?.id || 'V1',
          amount: Number(withdrawAmt),
          phone: withdrawPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        setMerchantBalance(prev => prev - Number(withdrawAmt));
        setWithdrawAmt('');
        
        // Add pending withdraw transaction
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

        // Start simulated payout polling resolution
        setTimeout(() => {
          setTransactions(prev =>
            prev.map(t => t.id === data.transactionId ? { ...t, status: 'SUCCESS', description: 'Payout completed successfully' } : t)
          );
        }, 5000);

      } else {
        setErrorMsg(data.error || 'Withdrawal failed.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during withdrawal.');
    } finally {
      setLoading(false);
    }
  };

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

      {/* Cashier Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Checkout basket left (7 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Basket list */}
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-4.5 w-4.5 text-purple-400" />
                <h3 className="text-sm font-medium text-gray-200">Terminal Checkout Register</h3>
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">{cart.length} items in basket</span>
            </div>

            {/* Cart display */}
            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-gray-500 gap-2">
                <ShoppingCart className="h-6 w-6 stroke-[1.2]" />
                <span className="text-xs">Cart is empty. Tap standard catalog buttons below to add items.</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-thin">
                {cart.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-[#06080E]/40 border border-white/5 rounded-lg p-2.5 text-xs">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-semibold text-white">{item.name}</span>
                      <span className="text-gray-500 font-mono text-[10px]">{item.price.toLocaleString()} UGX</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400">×{item.quantity}</span>
                      <span className="font-mono text-white">{(item.price * item.quantity).toLocaleString()} UGX</span>
                    </div>
                  </div>
                ))}

                <div className="flex justify-between items-center border-t border-white/5 pt-3.5 mt-2">
                  <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">Checkout Total:</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">{cartTotal.toLocaleString()} UGX</span>
                </div>
              </div>
            )}
          </div>

          {/* Quick tap button catalog (3.3) */}
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
            <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">Fast-Tap Items Catalog (Popular)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddToCart(item.name, item.price)}
                  className="rounded-xl border border-white/5 bg-[#0D1222] hover:bg-purple-600/10 hover:border-purple-500/20 p-3.5 text-left transition duration-200 active:scale-95 flex flex-col justify-between h-20 group"
                >
                  <span className="text-xs font-semibold text-gray-200 group-hover:text-purple-400 truncate w-full">{item.name}</span>
                  <span className="text-[11px] font-mono text-emerald-400">{item.price.toLocaleString()} UGX</span>
                </button>
              ))}
            </div>

            {/* Custom product catalog addition (3.3) */}
            <form onSubmit={handleCustomAddToCart} className="flex flex-col sm:flex-row gap-2.5 pt-4 border-t border-white/5">
              <input
                type="text"
                required
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Custom Item (e.p. Chapati)"
                className="flex-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200"
              />
              <input
                type="number"
                required
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
                placeholder="Price UGX"
                className="w-full sm:w-28 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200"
              />
              <button
                type="submit"
                className="rounded-lg bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-xs font-semibold text-white transition duration-200"
              >
                + Basket
              </button>
            </form>
          </div>

        </div>

        {/* QR scanner simulation (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <QrCode className="h-4.5 w-4.5 text-sky-400" />
              <h3 className="text-sm font-medium text-gray-200">Simulation Card Scanner</h3>
            </div>

            <p className="text-xs text-gray-400">
              Pick an active campus student to simulate tapping their physical static QR code card on the cashier terminal.
            </p>

            <div className="space-y-3">
              <select
                value={searchQr}
                onChange={(e) => handleScanQr(e.target.value)}
                className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-2 text-xs text-gray-300"
              >
                <option value="">-- Choose Student to scan --</option>
                {allStudents.map((s) => (
                  <option key={s.id} value={s.qrHash}>{s.name} ({s.class})</option>
                ))}
              </select>

              {scannedStudent ? (
                <div className="rounded-lg bg-[#06080E]/60 border border-white/5 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <img src={scannedStudent.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                    <div>
                      <h4 className="text-xs font-semibold text-white">{scannedStudent.name}</h4>
                      <p className="text-[10px] text-gray-500">{scannedStudent.class}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-2 border-t border-white/5">
                    <div>
                      <span className="text-gray-500 block">CARD BALANCE:</span>
                      <span className="text-emerald-400 font-bold">{scannedStudent.balance.toLocaleString()} UGX</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">DAILY PIN-LESS LIMIT:</span>
                      <span className="text-gray-300 font-bold">{scannedStudent.noPinLimit.toLocaleString()} UGX</span>
                    </div>
                  </div>

                  <button
                    onClick={handleCheckout}
                    className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 py-2 text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 active:scale-95"
                  >
                    Confirm & Complete POS Checkout
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/5 p-6 flex flex-col items-center justify-center text-gray-500 text-xs text-center gap-2">
                  <UserCheck className="h-5 w-5 stroke-[1.2]" />
                  <span>Terminal reader idle. Tap student card.</span>
                </div>
              )}
            </div>
          </div>

          {/* MoMo Withdrawals Panel */}
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-3">
            <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-2.5">Collecto Withdrawal (Payout)</h3>
            <div className="text-xs flex justify-between items-center">
              <span className="text-gray-400">POS Canteen Balance:</span>
              <span className="font-mono font-bold text-emerald-400">{merchantBalance.toLocaleString()} UGX</span>
            </div>
            
            <form onSubmit={handleWithdrawal} className="space-y-2.5 pt-2">
              <input
                type="number"
                required
                value={withdrawAmt}
                onChange={(e) => setWithdrawAmt(e.target.value)}
                placeholder="Withdraw Amount (UGX)"
                className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200"
              />
              <input
                type="text"
                required
                value={withdrawPhone}
                onChange={(e) => setWithdrawPhone(e.target.value)}
                placeholder="MTN/Airtel MoMo (+2567...)"
                className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200"
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-sky-600 hover:bg-sky-500 py-2 text-xs font-semibold text-white transition active:scale-95"
              >
                {loading ? 'Processing...' : 'Withdraw to Mobile Money'}
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* POS Transactions list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent purchases log */}
        <div className="lg:col-span-8 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4">
            <ClipboardList className="h-4.5 w-4.5 text-purple-400" />
            <h3 className="text-sm font-medium text-gray-200">Terminal Shift Sales Feed</h3>
          </div>

          <div className="overflow-x-auto max-h-60 scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-mono">
                  <th className="pb-2">Receipt #</th>
                  <th className="pb-2">Value</th>
                  <th className="pb-2">Commission Deducted</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {transactions.map((txn) => (
                  <tr key={txn.id}>
                    <td className="py-2.5 font-mono text-gray-400">{txn.referenceCode}</td>
                    <td className="py-2.5 font-bold text-white">{txn.amount.toLocaleString()} UGX</td>
                    <td className="py-2.5 font-mono text-amber-400">1.5% split</td>
                    <td className="py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        txn.status === 'SUCCESS' ? 'bg-emerald-950/40 text-emerald-400' : 'bg-rose-950/40 text-rose-400'
                      }`}>
                        {txn.status}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {txn.status === 'SUCCESS' && (
                        <button
                          onClick={() => triggerRefund(txn.referenceCode)}
                          className="text-[10px] text-rose-400 hover:underline font-medium"
                        >
                          Refund txn
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EOD Register Close Panel (3.4) */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">EOD shift reconciliation (Z-Reports)</h3>
          
          <div className="space-y-3">
            <input
              type="password"
              value={managerPin}
              onChange={(e) => setManagerPin(e.target.value)}
              placeholder="Enter Cashier Manager PIN (1234)"
              className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-2 text-xs text-gray-200 font-mono text-center tracking-widest"
            />
            <button
              onClick={handleCloseRegister}
              className="w-full rounded bg-rose-600/10 hover:bg-rose-600 border border-rose-500/20 text-rose-400 hover:text-white py-2 text-xs font-semibold transition active:scale-95"
            >
              Reconcile Shift & Print Z-Report
            </button>
          </div>

          {zReportData && (
            <div className="rounded-lg bg-black/40 border border-white/5 p-3.5 font-mono text-[11px] text-gray-400 space-y-1">
              <span className="font-bold text-gray-300 block uppercase tracking-wider text-[9px] border-b border-white/5 pb-1 mb-1.5">Z-Report Receipt</span>
              <div>Date: {new Date(zReportData.timestamp).toLocaleDateString()}</div>
              <div>Shift Net Sales: <span className="text-emerald-400 font-bold">{zReportData.netSales.toLocaleString()} UGX</span></div>
              <div>Sales Count: {zReportData.txnCount} txns</div>
              <div className="text-[9px] text-gray-600 mt-2">EduTechMoney POS Registry Module</div>
            </div>
          )}
        </div>

      </div>

      {/* Keypad Modal for Student authorization */}
      {showPinModal && scannedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-xl border border-white/10 bg-[#0F1424] p-5 shadow-2xl flex flex-col gap-4">
            <div className="text-center">
              <Key className="h-6 w-6 text-purple-400 mx-auto mb-1.5" />
              <h4 className="text-sm font-bold text-white">Authorization PIN Required</h4>
              <p className="text-[10px] text-gray-400 mt-0.5">Checkout exceeds PIN-less limit of {scannedStudent.noPinLimit.toLocaleString()} UGX</p>
            </div>

            {pinError && (
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-300 rounded text-center font-semibold">
                {pinError}
              </div>
            )}

            <div className="rounded bg-black/40 border border-white/5 py-2.5 text-center text-lg font-mono tracking-[1em] pl-[1em] text-white">
              {enteredPin ? enteredPin.replace(/./g, '•') : ' '}
            </div>

            {/* Simulated parent helper */}
            <div className="text-[9px] font-mono text-amber-300 text-center bg-[#06080E] p-1.5 rounded">
              Simulated PIN is: <span className="font-bold">1234</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
                <button
                  key={n}
                  onClick={() => handleKeyboardClick(n)}
                  className="rounded bg-[#06080E] border border-white/5 hover:bg-white/5 py-2.5 text-sm font-semibold text-white active:bg-purple-600/15"
                >
                  {n}
                </button>
              ))}
              <button
                onClick={() => setEnteredPin('')}
                className="rounded bg-rose-950/20 text-rose-400 py-2.5 text-xs font-semibold"
              >
                Clear
              </button>
              <button
                onClick={() => handleKeyboardClick('0')}
                className="rounded bg-[#06080E] border border-white/5 py-2.5 text-sm font-semibold text-white"
              >
                0
              </button>
              <button
                onClick={handleKeyboardSubmit}
                className="rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center"
              >
                OK
              </button>
            </div>
            
            <button
              onClick={() => { setShowPinModal(false); setEnteredPin(''); }}
              className="text-[11px] text-gray-500 hover:text-white underline text-center"
            >
              Cancel transaction
            </button>
          </div>
        </div>
      )}

      {/* Refund authorization modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xs rounded-xl border border-white/10 bg-[#0F1424] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <AlertTriangle className="h-5 w-5 text-rose-400" />
              <h4 className="text-sm font-semibold text-white">Revert & Refund Purchase</h4>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              To revert balance, enter the Canteen Cashier Manager Authorization PIN.
            </p>

            <div className="text-[10px] font-mono text-amber-300 bg-[#06080E] p-2 rounded">
              Simulated Manager PIN is: <span className="font-bold">1234</span>
            </div>

            <div className="space-y-3">
              <input
                type="password"
                required
                value={managerPin}
                onChange={(e) => setManagerPin(e.target.value)}
                placeholder="Manager PIN"
                className="w-full rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-200 text-center font-mono tracking-widest"
              />

              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowRefundModal(false); setManagerPin(''); }}
                  className="rounded border border-white/10 px-3 py-1.5 text-xs text-gray-400"
                >
                  Close
                </button>
                <button
                  onClick={handleRefundSubmit}
                  className="rounded bg-rose-600 hover:bg-rose-500 px-4 py-1.5 text-xs font-semibold text-white"
                >
                  Confirm Revert
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
