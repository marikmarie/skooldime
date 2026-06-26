import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, QrCode, ClipboardList, RefreshCw, Key, ArrowRight, 
  UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, Search, Plus, CreditCard, Banknote,
  Smartphone
} from 'lucide-react';
import { Student, CatalogItem, Transaction } from '../types';
import { useToast } from './ToastContext';

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
  const [allParents, setAllParents] = useState<any[]>([]);
  
  // Custom manual item input
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  // POS scanning state
  const [scannedStudent, setScannedStudent] = useState<any | null>(null);
  const [searchQr, setSearchQr] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  
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

  // Dynamic QR Code Payment & Simulation states
  const [activeQrCode, setActiveQrCode] = useState<{ paymentUrl: string; referenceCode: string; amount: number } | null>(null);
  const [showSimModal, setShowSimModal] = useState(false);
  const [simFundingSource, setSimFundingSource] = useState<'STUDENT' | 'PARENT' | 'MOMO'>('MOMO');
  const [simStudentId, setSimStudentId] = useState('');
  const [simParentId, setSimParentId] = useState('');
  const [simPin, setSimPin] = useState('');
  const [simError, setSimError] = useState('');
  const [simLoading, setSimLoading] = useState(false);

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
      if (Array.isArray(studData)) {
        setAllStudents(studData);
        if (studData.length > 0) setSimStudentId(studData[0].id);
      }

      const parentRes = await fetch('/api/parents');
      const parentData = await parentRes.json();
      if (Array.isArray(parentData)) {
        setAllParents(parentData);
        if (parentData.length > 0) setSimParentId(parentData[0].id);
      }

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
    try {
      const res = await fetch(`/api/pos/scan/${qrHash}`);
      const data = await res.json();
      if (data.success) {
        setScannedStudent(data.student);
        setSearchQr(qrHash);
      } else {
        toast.error(data.error || 'Failed to scan student.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred while scanning student.');
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
    if (!scannedStudent) {
      toast.error('Please scan a Student QR Code card before checkout.');
      return;
    }
    if (cartTotal <= 0) {
      toast.error('Cart is empty.');
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
        toast.success(`Checkout approved! Receipt: ${data.referenceCode}. Loaded ${cartTotal.toLocaleString()} UGX ledger split.`);
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
        if (!pinCode) toast.error(data.error || 'Checkout failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePaymentQr = async () => {
    if (cartTotal <= 0) {
      toast.error('Cart is empty.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/pos/generate-payment-qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: vendor?.id || 'V1',
          amount: cartTotal,
          items: cart
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveQrCode({
          paymentUrl: data.paymentUrl,
          referenceCode: data.referenceCode,
          amount: data.amount
        });
      } else {
        toast.error(data.error || 'Failed to generate payment QR code.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred while generating QR.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!activeQrCode) return;
    
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/pos/payment-status/${activeQrCode.referenceCode}`);
        const data = await res.json();
        if (data.success && data.status === 'SUCCESS') {
          toast.success(`QR Payment successful! Reference: ${activeQrCode.referenceCode}. Loaded ${activeQrCode.amount.toLocaleString()} UGX ledger split.`);
          setCart([]);
          setActiveQrCode(null);
          
          const newTxn: Transaction = {
            id: `tx_pos_${Date.now()}`,
            referenceCode: data.referenceCode,
            senderWalletId: data.senderWalletId,
            receiverWalletId: data.receiverWalletId,
            amount: data.amount,
            fee: data.amount * 0.015,
            type: 'SPEND',
            status: 'SUCCESS',
            description: data.description,
            createdAt: new Date().toISOString()
          };
          setTransactions((prev) => [newTxn, ...prev]);
          fetchBaseData();
        }
      } catch (err) {
        console.error('QR Payment polling error:', err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeQrCode]);

  const handleSimulateCompletePayment = async () => {
    if (!activeQrCode) return;
    setSimError('');
    setSimLoading(true);
    try {
      const res = await fetch('/api/pos/complete-dynamic-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          refCode: activeQrCode.referenceCode,
          fundingSource: simFundingSource,
          studentId: simFundingSource === 'STUDENT' ? simStudentId : undefined,
          parentId: simFundingSource === 'PARENT' ? simParentId : undefined,
          pin: simPin
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowSimModal(false);
        setSimPin('');
        setSimError('');
      } else {
        setSimError(data.error || 'Failed to process simulated payment.');
      }
    } catch (e: any) {
      setSimError(e.message || 'Error occurred during simulation.');
    } finally {
      setSimLoading(false);
    }
  };

  const handleKeyboardClick = (num: string) => {
    if (enteredPin.length < 4) setEnteredPin((prev) => prev + num);
  };

  const handleKeyboardSubmit = () => {
    if (enteredPin.length === 4) executeCheckoutRequest(enteredPin);
  };

  const handleCloseRegister = () => {
    if (managerPin !== '1234') {
      toast.error('Invalid Manager Authorization PIN.');
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
    try {
      const res = await fetch('/api/pos/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactionId: refundTxnId, vendorPin: managerPin, vendorId: vendor?.id || 'V1' })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('POS transaction successfully refunded.');
        setTransactions(prev => prev.map(t => t.referenceCode === refundTxnId || t.id === refundTxnId ? { ...t, status: 'FAILED' } : t));
        setShowRefundModal(false);
        setManagerPin('');
        setRefundTxnId(null);
      } else {
        toast.error(data.error || 'Refund failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred during refund process.');
    }
  };

  const handleWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmt || !withdrawPhone) return;
    setLoading(true);
    try {
      const res = await fetch('/api/collecto/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId: vendor?.id || 'V1', amount: Number(withdrawAmt), phone: withdrawPhone })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
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
        toast.error(data.error || 'Withdrawal failed.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred during withdrawal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* POS Top Section: Main Work Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Scanner & Catalog (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* 1. Student Identity Scanner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="bg-slate-800/50 border-b border-slate-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#c7515e]" />
                <h3 className="font-semibold text-slate-100">Customer Details</h3>
              </div>
              <div className="w-1/2 max-w-xs relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  value={searchQr}
                  onChange={(e) => handleScanQr(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-slate-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] transition-colors"
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
                  <img src={scannedStudent.avatarUrl} alt="" className="w-16 h-16 rounded-full border-2 border-[#c7515e]/30 shadow-lg" referrerPolicy="no-referrer" />
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
                      <span className="text-[#c7515e] font-mono font-bold text-lg">{scannedStudent.noPinLimit.toLocaleString()} UGX</span>
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
                <Plus className="h-5 w-5 text-[#c7515e]" /> Quick Add Items
              </h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {catalog.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddToCart(item.name, item.price)}
                  className="relative overflow-hidden rounded-xl border border-slate-700 bg-slate-800 hover:bg-[#c7515e]/10 hover:border-[#c7515e]/50 p-4 text-left transition-all duration-200 active:scale-95 group flex flex-col justify-between h-24 shadow-sm"
                >
                  <span className="text-sm font-semibold text-slate-200 group-hover:text-[#c7515e] truncate w-full">{item.name}</span>
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
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none"
                  />
                </div>
                <div className="w-full sm:w-40 relative">
                  <input
                    type="number"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="Price (UGX)"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-2.5 text-sm text-slate-200 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none"
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
        <div className="xl:col-span-4 rounded-xl border border-slate-800 bg-slate-900 shadow-xl flex flex-col h-full min-h-[500px] max-h-[800px]">
          {activeQrCode ? (
            <div className="p-6 flex flex-col items-center justify-between h-full flex-1 space-y-6">
              <div className="text-center w-full">
                <div className="mx-auto bg-emerald-500/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                  <QrCode className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="font-bold text-lg text-white">Dynamic QR Payment</h3>
                <p className="text-xs text-slate-400 mt-1">Scan using parental or student mobile app to complete transaction.</p>
              </div>

              <div className="bg-white p-4 rounded-2xl shadow-xl flex flex-col items-center border-4 border-slate-800 animate-in fade-in duration-300">
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(activeQrCode.paymentUrl)}`} 
                  alt="Dynamic Payment QR Code" 
                  className="w-48 h-48"
                  onError={(e) => {
                    e.currentTarget.src = "https://placehold.co/220x220/ffffff/000000?text=QR+Code";
                  }}
                />
                <div className="mt-3 text-slate-900 font-mono font-bold text-xs tracking-wider bg-slate-100 px-3 py-1 rounded">
                  {activeQrCode.referenceCode}
                </div>
              </div>

              <div className="w-full space-y-4">
                <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest block mb-1">Total to Collect</span>
                  <span className="text-2xl font-mono font-black text-emerald-400">{activeQrCode.amount.toLocaleString()} <span className="text-xs text-emerald-600">UGX</span></span>
                  <div className="flex items-center justify-center gap-2 mt-3 text-xs text-[#c7515e] animate-pulse font-medium">
                    <span className="h-2 w-2 rounded-full bg-[#c7515e]"></span>
                    Awaiting customer checkout status...
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSimError('');
                      setSimPin('');
                      setShowSimModal(true);
                    }}
                    className="w-full py-3 bg-[#c7515e] hover:bg-[#b04753] hover:shadow-lg hover:shadow-[#c7515e]/25 active:scale-[0.98] transition-all text-xs font-bold text-white rounded-xl flex items-center justify-center gap-2"
                  >
                    <Smartphone className="h-4 w-4" />
                    Simulate Customer Scan & Pay
                  </button>

                  <button
                    onClick={() => setActiveQrCode(null)}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 active:scale-[0.98] transition-all text-xs font-semibold text-slate-400 hover:text-white rounded-xl"
                  >
                    Cancel QR & Back to Basket
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-[#c7515e]" />
                  <h3 className="font-semibold text-slate-100">Current Order</h3>
                </div>
                <span className="bg-[#c7515e]/20 text-[#c7515e] text-xs font-bold px-2.5 py-1 rounded-full">
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
                
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || !scannedStudent || loading}
                    className={`py-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 
                      ${cart.length === 0 || !scannedStudent 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-[#c7515e] hover:bg-[#b04753] hover:shadow-[#c7515e]/25 active:scale-[0.98]'}`}
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    {loading ? 'Processing...' : 'Card Checkout'}
                  </button>

                  <button
                    onClick={handleGeneratePaymentQr}
                    disabled={cart.length === 0 || loading}
                    className={`py-4 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-1.5 
                      ${cart.length === 0 
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                        : 'bg-emerald-600 hover:bg-emerald-500 hover:shadow-emerald-500/25 active:scale-[0.98]'}`}
                  >
                    <QrCode className="h-4 w-4" />
                    Generate QR
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Operations & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Transaction History (8 cols) */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-4">
            <ClipboardList className="h-5 w-5 text-[#c7515e]" />
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
              <div className="mx-auto bg-[#c7515e]/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-[#c7515e]" />
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
                className="rounded-xl bg-[#c7515e] hover:bg-[#b04753] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
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

      {/* Dynamic QR Customer Mobile Scanner Simulation Modal */}
      {showSimModal && activeQrCode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-[3rem] border-[12px] border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 ring-4 ring-slate-900/40">
            {/* Phone Speaker & Camera Cutout (Dynamic Notch) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span className="w-12 h-1 bg-slate-700 rounded-full"></span>
            </div>

            <div className="p-6 pt-10 text-slate-200 min-h-[520px] flex flex-col justify-between">
              {/* Simulated Phone Status Bar */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">
                <span>MTN-UG / Airtel</span>
                <span>12:00 PM</span>
              </div>

              {/* Simulated App Header */}
              <div className="text-center space-y-1 mb-4">
                <span className="text-[10px] font-bold text-[#c7515e] tracking-widest uppercase bg-[#c7515e]/10 px-2 py-0.5 rounded-full">skoolDime Pay</span>
                <h4 className="text-sm font-bold text-white tracking-wide">Secure QR Checkout</h4>
                <p className="text-[11px] text-slate-400">Scan payload resolved successfully.</p>
              </div>

              {/* Billing info */}
              <div className="bg-slate-900/80 border border-white/5 rounded-2xl p-4 space-y-2 mb-4 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Merchant:</span>
                  <span className="font-semibold text-white">{vendor?.name || 'Mama Betty Canteen'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-slate-300">{activeQrCode.referenceCode}</span>
                </div>
                <div className="border-t border-white/5 pt-2 flex justify-between items-center">
                  <span className="text-slate-400 font-medium">Billing Amount:</span>
                  <span className="text-base font-bold text-emerald-400 font-mono">{activeQrCode.amount.toLocaleString()} UGX</span>
                </div>
              </div>

              {/* Funding Source Segmented Tabs */}
              <div className="space-y-3 mb-4">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block">Choose Funding Wallet:</span>
                <div className="grid grid-cols-3 gap-1 bg-slate-900 p-1 rounded-xl border border-white/5">
                  {(['MOMO', 'STUDENT', 'PARENT'] as const).map((source) => (
                    <button
                      key={source}
                      type="button"
                      onClick={() => {
                        setSimFundingSource(source);
                        setSimPin('');
                        setSimError('');
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                        simFundingSource === source 
                          ? 'bg-[#c7515e] text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {source}
                    </button>
                  ))}
                </div>

                {simError && (
                  <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-[11px] text-rose-300 text-center font-medium">
                    {simError}
                  </div>
                )}

                {/* Conditional Inputs */}
                {simFundingSource === 'MOMO' && (
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-2">
                    <p className="text-[11px] text-slate-400 leading-relaxed text-center">
                      Simulates MTN MoMo or Airtel Money dynamic push. Enter any Ugandan phone to dispatch instant authorization prompt.
                    </p>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 0772123456"
                      defaultValue={userPhone}
                      className="w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-xs text-white text-center font-semibold focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none"
                    />
                  </div>
                )}

                {simFundingSource === 'STUDENT' && (
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-3">
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Select Student Debit Account</label>
                      <select
                        value={simStudentId}
                        onChange={(e) => setSimStudentId(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-xs text-slate-200 outline-none"
                      >
                        {allStudents.map((stud) => (
                          <option key={stud.id} value={stud.id}>
                            {stud.name} ({stud.class})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Enter Student PIN (Default 1234)</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={simPin}
                        onChange={(e) => setSimPin(e.target.value)}
                        placeholder="••••"
                        className="w-full rounded-lg border border-white/10 bg-slate-950 py-2 text-center text-sm font-bold tracking-[0.5em] text-white outline-none"
                      />
                    </div>
                  </div>
                )}

                {simFundingSource === 'PARENT' && (
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-white/5 space-y-3">
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Select Parent Funder</label>
                      <select
                        value={simParentId}
                        onChange={(e) => setSimParentId(e.target.value)}
                        className="w-full rounded-lg border border-white/10 bg-slate-950 p-2 text-xs text-slate-200 outline-none"
                      >
                        {allParents.map((parent) => (
                          <option key={parent.id} value={parent.id}>
                            {parent.name} ({parent.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[9px] text-slate-500 font-bold uppercase block mb-1">Enter Parent PIN (Default 1234)</label>
                      <input
                        type="password"
                        required
                        maxLength={4}
                        value={simPin}
                        onChange={(e) => setSimPin(e.target.value)}
                        placeholder="••••"
                        className="w-full rounded-lg border border-white/10 bg-slate-950 py-2 text-center text-sm font-bold tracking-[0.5em] text-white outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Buttons */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <button
                  onClick={handleSimulateCompletePayment}
                  disabled={simLoading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/10"
                >
                  {simLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-4 w-4" />
                  )}
                  {simLoading ? 'Authorizing...' : 'Slide to Authorize & Pay'}
                </button>
                <button
                  onClick={() => setShowSimModal(false)}
                  className="w-full py-2 text-[11px] text-slate-500 hover:text-slate-300 text-center font-medium"
                >
                  Dismiss / Cancel Scan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}