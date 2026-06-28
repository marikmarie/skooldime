import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, QrCode, ClipboardList, RefreshCw, Key, ArrowRight, 
  UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, Search, Plus, CreditCard, Banknote,
  Smartphone, Camera, User, TrendingUp, Users, BarChart3
} from 'lucide-react';
import { Student, CatalogItem, Transaction } from '../types';
import { useToast } from './ToastContext';
import { RecentTransactions } from './RecentTransactions';

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

  // New QR Camera Scanner state
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerTab, setScannerTab] = useState<'STUDENT' | 'PARENT'>('STUDENT');
  const [scannerStatus, setScannerStatus] = useState<'READY' | 'SCANNING' | 'DECODING' | 'SUCCESS'>('READY');
  const [detectedStudent, setDetectedStudent] = useState<any | null>(null);
  const [detectedParent, setDetectedParent] = useState<any | null>(null);
  const [scanFlash, setScanFlash] = useState(false);

  // Daily Transaction Summary state
  const [showBenchmark, setShowBenchmark] = useState(true);

  // RecentTransactions component synchronization trigger
  const [txRefreshTrigger, setTxRefreshTrigger] = useState(0);

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

      const txsRes = await fetch(`/api/pos/transactions/${currentVendor.id}`);
      const txsData = await txsRes.json();
      if (Array.isArray(txsData)) {
        const sorted = txsData.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
        setTransactions(sorted);
        setTxRefreshTrigger(prev => prev + 1);
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

  const playScanBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.log('Web Audio beep not supported or blocked:', e);
    }
  };

  const startStudentScan = (stud: Student) => {
    setDetectedStudent(stud);
    setDetectedParent(null);
    setScannerStatus('SCANNING');
    
    setTimeout(() => {
      setScannerStatus('DECODING');
      
      setTimeout(() => {
        setScanFlash(true);
        playScanBeep();
        
        setTimeout(() => {
          setScanFlash(false);
          handleScanQr(stud.qrHash);
          toast.success(`Student card decoded: ${stud.name}`);
          setScannerStatus('SUCCESS');
          
          setTimeout(() => {
            setShowScannerModal(false);
            setScannerStatus('READY');
            setDetectedStudent(null);
          }, 450);
        }, 120);
      }, 600);
    }, 700);
  };

  const startParentScan = (p: any) => {
    setDetectedParent(p);
    setDetectedStudent(null);
    setScannerStatus('SCANNING');
    
    setTimeout(() => {
      setScannerStatus('DECODING');
      
      setTimeout(() => {
        setScanFlash(true);
        playScanBeep();
        
        setTimeout(() => {
          setScanFlash(false);
          toast.success(`Parent QR resolved: ${p.name}`);
          setScannerStatus('SUCCESS');
        }, 120);
      }, 600);
    }, 700);
  };

  const selectParentChild = (stud: Student) => {
    handleScanQr(stud.qrHash);
    setShowScannerModal(false);
    setDetectedParent(null);
    setScannerStatus('READY');
    toast.success(`Selected student ${stud.name} linked to parent.`);
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
        setTxRefreshTrigger(prev => prev + 1);
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
        setTxRefreshTrigger(prev => prev + 1);

        setTimeout(() => {
          setTransactions(prev =>
            prev.map(t => t.id === data.transactionId ? { ...t, status: 'SUCCESS', description: 'Payout completed successfully' } : t)
          );
          setTxRefreshTrigger(prev => prev + 1);
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

  // DERIVED DAILY SUMMARY METRICS & TRENDS
  const todayStr = new Date().toISOString().split('T')[0];
  
  const todayTransactions = transactions.filter(t => {
    if (t.status !== 'SUCCESS') return false;
    const tDate = t.createdAt ? t.createdAt.split('T')[0] : '';
    return tDate === todayStr;
  });

  const todaySales = todayTransactions.filter(t => t.type === 'SPEND').reduce((sum, t) => sum + t.amount, 0);
  
  // Active unique students served today
  const todayStudentIds = new Set(
    todayTransactions
      .filter(t => t.senderWalletId && t.senderWalletId.includes('ST'))
      .map(t => t.senderWalletId)
  );
  const activeStudentsCount = todayStudentIds.size;
  
  const avgTicket = todayTransactions.filter(t => t.type === 'SPEND').length > 0 
    ? Math.round(todaySales / todayTransactions.filter(t => t.type === 'SPEND').length) 
    : 0;

  // Custom 2-hour interval timeblocks
  const getChartBlocks = () => {
    const blocks = [
      { label: '08:00 - 10:00', sales: 0, students: new Set<string>() },
      { label: '10:00 - 12:00', sales: 0, students: new Set<string>() },
      { label: '12:00 - 14:00', sales: 0, students: new Set<string>() },
      { label: '14:00 - 16:00', sales: 0, students: new Set<string>() },
      { label: '16:00 - 18:00', sales: 0, students: new Set<string>() },
      { label: '18:00 - 20:00', sales: 0, students: new Set<string>() },
    ];

    todayTransactions.forEach(t => {
      if (!t.createdAt || t.type !== 'SPEND') return;
      const date = new Date(t.createdAt);
      const hr = date.getHours();
      let idx = -1;
      if (hr >= 8 && hr < 10) idx = 0;
      else if (hr >= 10 && hr < 12) idx = 1;
      else if (hr >= 12 && hr < 14) idx = 2;
      else if (hr >= 14 && hr < 16) idx = 3;
      else if (hr >= 16 && hr < 18) idx = 4;
      else if (hr >= 18 && hr < 20) idx = 5;

      if (idx !== -1) {
        blocks[idx].sales += t.amount;
        if (t.senderWalletId) {
          blocks[idx].students.add(t.senderWalletId);
        }
      }
    });

    return blocks.map(b => ({
      label: b.label,
      sales: b.sales,
      studentsCount: b.students.size
    }));
  };

  const realChartData = getChartBlocks();

  // Benchmark typical trends
  const benchmarkSales = [15000, 35000, 80000, 10000, 50000, 20000];
  const benchmarkStudents = [8, 18, 35, 5, 24, 10];

  const salesChartData = realChartData.map((b, i) => ({
    label: b.label,
    live: b.sales,
    benchmark: benchmarkSales[i]
  }));

  const studentsChartData = realChartData.map((b, i) => ({
    label: b.label,
    live: b.studentsCount,
    benchmark: benchmarkStudents[i]
  }));

  // Dynamic scaling of charts
  const maxSalesVal = Math.max(...benchmarkSales, ...realChartData.map(b => b.sales), 10000);
  const maxStudentsVal = Math.max(...benchmarkStudents, ...realChartData.map(b => b.studentsCount), 5);

  const getPeakPeriodLabel = () => {
    let peakBlock = '08:00 - 10:00';
    let maxS = 0;
    
    realChartData.forEach(b => {
      if (b.sales > maxS) {
        maxS = b.sales;
        peakBlock = b.label;
      }
    });

    if (maxS > 0) return `${peakBlock.split(' ')[0]} Rush`;
    return '12:00 - 14:00 Lunch';
  };
  const peakPeriodLabel = getPeakPeriodLabel();

  return (
    <div className="space-y-6 text-slate-200">
      
      {/* POS Top Section: Main Work Area */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Scanner & Catalog (8 cols) */}
        <div className="xl:col-span-8 flex flex-col gap-6">
          
          {/* 1. Student Identity Scanner */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl overflow-hidden">
            <div className="bg-slate-800/50 border-b border-slate-800 p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="flex items-center gap-2">
                <QrCode className="h-5 w-5 text-[#c7515e]" />
                <h3 className="font-semibold text-slate-100">Customer Details</h3>
              </div>
              <div className="w-full sm:w-2/3 max-w-md flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <select
                    value={searchQr}
                    onChange={(e) => handleScanQr(e.target.value)}
                    className="w-full appearance-none rounded-lg border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-3 text-sm text-slate-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] transition-colors"
                  >
                    <option value="">Scan or Select Student QR...</option>
                    {allStudents.map((s) => (
                      <option key={s.id} value={s.qrHash}>{s.name} ({s.class})</option>
                    ))}
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => setShowScannerModal(true)}
                  className="rounded-lg bg-[#c7515e] hover:bg-[#b04753] px-3.5 py-2.5 text-xs font-bold text-white flex items-center gap-1.5 transition-all duration-150 active:scale-95 shadow-md shadow-[#c7515e]/15 border border-[#c7515e]/10 whitespace-nowrap"
                >
                  <QrCode className="h-4 w-4 animate-pulse" />
                  <span>Scan QR Card</span>
                </button>
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

      {/* DAILY TRANSACTION SUMMARY */}
      <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-xl p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#c7515e]/10 text-[#c7515e]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Daily Transaction Summary</h3>
              <p className="text-xs text-slate-400">Hourly sales volume & student traffic benchmarks for today ({new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                showBenchmark 
                  ? 'bg-[#c7515e]/10 text-[#c7515e] border-[#c7515e]/30' 
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {showBenchmark ? 'Hide' : 'Show'} Comparison Benchmark
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Today's Sales</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-emerald-400">{todaySales.toLocaleString()}</span>
              <span className="text-[10px] text-emerald-500 font-bold font-mono">UGX</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Shift Ledger
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Active Students</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-sky-400">{activeStudentsCount}</span>
              <span className="text-[10px] text-sky-500 font-bold">Served</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-sky-400"></span>
              Unique Cards Scanned
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Avg Ticket Size</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-slate-200">{avgTicket.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-bold font-mono">UGX</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Average spent per transaction
            </p>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Peak Canteen Hour</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-slate-200">{peakPeriodLabel}</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Based on shift volume density
            </p>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Sales Volume */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400"></span>
                Hourly Sales Volume (UGX)
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Real-time checkout receipts compared with typical benchmark days</p>
            </div>

            {/* Bars Area */}
            <div className="relative h-44 flex items-end justify-between pt-6 px-1 border-b border-slate-800">
              {/* Background grid */}
              <div className="absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-800/30 w-full"></div>
                <div className="border-t border-slate-800/30 w-full"></div>
                <div className="border-t border-slate-800/30 w-full"></div>
              </div>

              {salesChartData.map((d, idx) => {
                const livePct = maxSalesVal > 0 ? (d.live / maxSalesVal) * 100 : 0;
                const benchPct = maxSalesVal > 0 ? (d.benchmark / maxSalesVal) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group px-1">
                    {/* Tooltip */}
                    <div className="absolute -top-6 bg-slate-950 border border-slate-800 text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-xl text-center min-w-[120px]">
                      <p className="text-slate-400 font-bold font-mono text-[9px] mb-0.5">{d.label}</p>
                      <p className="text-emerald-400 font-bold font-mono">Live: {d.live.toLocaleString()} UGX</p>
                      {showBenchmark && <p className="text-slate-500 font-mono">Bench: {d.benchmark.toLocaleString()} UGX</p>}
                    </div>

                    {/* Bars Stack */}
                    <div className="flex items-end justify-center w-full h-full gap-1">
                      {showBenchmark && (
                        <div 
                          style={{ height: `${benchPct}%` }}
                          className="w-2 md:w-3 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-t border-t border-x border-emerald-500/10 transition-all duration-300"
                        />
                      )}
                      <div 
                        style={{ height: `${livePct}%` }}
                        className="w-2.5 md:w-3.5 bg-emerald-500 hover:bg-emerald-400 rounded-t shadow-[0_0_8px_rgba(16,185,129,0.2)] transition-all duration-300 relative"
                      >
                        {d.live > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-emerald-400 font-mono font-bold whitespace-nowrap">
                            {d.live >= 1000 ? `${(d.live / 1000).toFixed(0)}k` : d.live}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X Axis */}
            <div className="flex justify-between px-1 pt-2 text-[8px] md:text-[9px] font-mono text-slate-500">
              {salesChartData.map((d, idx) => (
                <div key={idx} className="flex-1 text-center truncate">{d.label.split(' ')[0]}</div>
              ))}
            </div>
          </div>

          {/* Chart 2: Active Student Counts */}
          <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
            <div className="mb-4">
              <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                Active Students Count
              </h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Distinct student card transactions processed per shift block</p>
            </div>

            {/* Bars Area */}
            <div className="relative h-44 flex items-end justify-between pt-6 px-1 border-b border-slate-800">
              {/* Background grid */}
              <div className="absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between pointer-events-none">
                <div className="border-t border-slate-800/30 w-full"></div>
                <div className="border-t border-slate-800/30 w-full"></div>
                <div className="border-t border-slate-800/30 w-full"></div>
              </div>

              {studentsChartData.map((d, idx) => {
                const livePct = maxStudentsVal > 0 ? (d.live / maxStudentsVal) * 100 : 0;
                const benchPct = maxStudentsVal > 0 ? (d.benchmark / maxStudentsVal) * 100 : 0;

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group px-1">
                    {/* Tooltip */}
                    <div className="absolute -top-6 bg-slate-950 border border-slate-800 text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-xl text-center min-w-[120px]">
                      <p className="text-slate-400 font-bold font-mono text-[9px] mb-0.5">{d.label}</p>
                      <p className="text-sky-400 font-bold font-mono">Live: {d.live} Students</p>
                      {showBenchmark && <p className="text-slate-500 font-mono">Bench: {d.benchmark} Students</p>}
                    </div>

                    {/* Bars Stack */}
                    <div className="flex items-end justify-center w-full h-full gap-1">
                      {showBenchmark && (
                        <div 
                          style={{ height: `${benchPct}%` }}
                          className="w-2 md:w-3 bg-sky-500/10 hover:bg-sky-500/20 rounded-t border-t border-x border-sky-500/10 transition-all duration-300"
                        />
                      )}
                      <div 
                        style={{ height: `${livePct}%` }}
                        className="w-2.5 md:w-3.5 bg-sky-400 hover:bg-sky-300 rounded-t shadow-[0_0_8px_rgba(56,189,248,0.2)] transition-all duration-300 relative"
                      >
                        {d.live > 0 && (
                          <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[8px] text-sky-400 font-mono font-bold whitespace-nowrap">
                            {d.live}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* X Axis */}
            <div className="flex justify-between px-1 pt-2 text-[8px] md:text-[9px] font-mono text-slate-500">
              {studentsChartData.map((d, idx) => (
                <div key={idx} className="flex-1 text-center truncate">{d.label.split(' ')[0]}</div>
              ))}
            </div>
          </div>

        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-5 mt-5 pt-3 border-t border-slate-800/80 text-[9px] md:text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-emerald-500"></span>
            <span>Live Sales Volume</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded bg-sky-400"></span>
            <span>Live Student Count</span>
          </div>
          {showBenchmark && (
            <>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-emerald-500/10 border border-emerald-500/20"></span>
                <span>Sales Benchmark</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded bg-sky-500/10 border border-sky-500/20"></span>
                <span>Student Traffic Benchmark</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* BOTTOM SECTION: Operations & Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-2">
        
        {/* Transaction History (8 cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <RecentTransactions 
            vendorId={vendor?.id || 'V1'} 
            refreshTrigger={txRefreshTrigger}
            triggerRefund={triggerRefund}
          />
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

      {/* QR CAMERA VIEWFINDER SIMULATOR MODAL */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <style>{`
            @keyframes scanLaser {
              0% { top: 4%; opacity: 0.3; }
              50% { top: 96%; opacity: 1; }
              100% { top: 4%; opacity: 0.3; }
            }
            @keyframes pulseMarker {
              0%, 100% { transform: scale(1); opacity: 0.6; }
              50% { transform: scale(1.08); opacity: 1; }
            }
            @keyframes scanBeepFlash {
              0% { background-color: rgba(16, 185, 129, 0); }
              15% { background-color: rgba(16, 185, 129, 0.35); }
              100% { background-color: rgba(16, 185, 129, 0); }
            }
            .laser-sweep {
              animation: scanLaser 2.2s infinite ease-in-out;
            }
            .viewfinder-corner {
              width: 24px;
              height: 24px;
              border-color: #c7515e;
              position: absolute;
            }
            .flash-active {
              animation: scanBeepFlash 0.5s ease-out forwards;
            }
          `}</style>

          <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 flex flex-col lg:flex-row h-[650px] lg:h-[550px]">
            
            {/* LEFT SIDE: VIEW FINDER (MIMIC CAMERA INTERFACE) */}
            <div className={`lg:w-1/2 bg-slate-950 relative flex flex-col justify-between p-6 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-800 transition-colors duration-300 ${scanFlash ? 'flash-active' : ''}`}>
              
              {/* Camera status indicators */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/5">
                  <span className={`h-2.5 w-2.5 rounded-full ${
                    scannerStatus === 'SUCCESS' ? 'bg-emerald-500 animate-ping' :
                    scannerStatus === 'DECODING' ? 'bg-amber-500 animate-spin' :
                    scannerStatus === 'SCANNING' ? 'bg-[#c7515e] animate-pulse' :
                    'bg-emerald-500 animate-pulse'
                  }`}></span>
                  <span className="text-[10px] font-mono text-slate-300 uppercase tracking-widest font-bold">
                    {scannerStatus === 'READY' && 'CAMERA: LIVE'}
                    {scannerStatus === 'SCANNING' && 'SCANNING OBJECT...'}
                    {scannerStatus === 'DECODING' && 'DECODING DATA...'}
                    {scannerStatus === 'SUCCESS' && 'DECODED SUCCESSFULLY'}
                  </span>
                </div>

                <div className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-mono text-slate-400">
                  FPS: 60 • 1080p
                </div>
              </div>

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="w-64 h-64 md:w-72 md:h-72 border border-dashed border-slate-800/60 rounded-3xl relative flex flex-col items-center justify-center bg-black/20">
                  
                  {/* Corners */}
                  <div className="viewfinder-corner top-0 left-0 border-t-4 border-l-4 rounded-tl-xl"></div>
                  <div className="viewfinder-corner top-0 right-0 border-t-4 border-r-4 rounded-tr-xl"></div>
                  <div className="viewfinder-corner bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl"></div>
                  <div className="viewfinder-corner bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl"></div>

                  {/* Laser Sweeper Line */}
                  {scannerStatus !== 'SUCCESS' && (
                    <div className="absolute left-4 right-4 h-1 bg-gradient-to-r from-transparent via-[#c7515e] to-transparent shadow-[0_0_12px_#c7515e] laser-sweep z-10"></div>
                  )}

                  {/* Content based on Scanner State */}
                  {scannerStatus === 'READY' && (
                    <div className="text-center p-4 space-y-2 z-10">
                      <Camera className="h-10 w-10 text-slate-600 mx-auto animate-pulse" />
                      <p className="text-xs font-semibold text-slate-300">Align QR Code to Scan</p>
                      <p className="text-[10px] text-slate-500">Position student ID card or parent payment screen inside the border</p>
                    </div>
                  )}

                  {scannerStatus === 'SCANNING' && (
                    <div className="text-center p-4 space-y-3 z-10">
                      <div className="w-12 h-12 rounded-full border-4 border-[#c7515e]/30 border-t-[#c7515e] animate-spin mx-auto"></div>
                      <p className="text-xs font-bold text-rose-400 uppercase tracking-widest animate-pulse">Capturing Image...</p>
                      <p className="text-[11px] font-mono text-slate-400">
                        {detectedStudent ? detectedStudent.name : detectedParent?.name}
                      </p>
                    </div>
                  )}

                  {scannerStatus === 'DECODING' && (
                    <div className="text-center p-4 space-y-3 z-10">
                      <RefreshCw className="h-10 w-10 text-amber-400 mx-auto animate-spin" />
                      <p className="text-xs font-bold text-amber-400 uppercase tracking-widest">Parsing QR Matrix...</p>
                      <p className="text-[10px] font-mono text-slate-500">Checking registry database...</p>
                    </div>
                  )}

                  {scannerStatus === 'SUCCESS' && (
                    <div className="text-center p-4 space-y-2 z-10 animate-in zoom-in-50 duration-200">
                      <CheckCircle2 className="h-14 w-14 text-emerald-400 mx-auto" />
                      <p className="text-sm font-bold text-emerald-400">Optical Match Succeeded!</p>
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-2 max-w-[200px] mx-auto">
                        <p className="text-xs font-bold text-white truncate">{detectedStudent ? detectedStudent.name : detectedParent?.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {detectedStudent ? `CARD: ${detectedStudent.qrHash}` : `PHONE: ${detectedParent?.phone}`}
                        </p>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Technical telemetry footer inside scanner */}
              <div className="flex justify-between items-end text-[9px] font-mono text-slate-600 z-10 border-t border-white/5 pt-3">
                <div className="space-y-0.5">
                  <p>SYS_MODEL: OP_V2_MIMIC</p>
                  <p>LENS_FOCUS: AUTOFOCUS</p>
                </div>
                <div className="text-right">
                  <p>STK_PUSH_TRIGGER: AUTO</p>
                  <p>AUDIO_GATEWAY: ACTIVE</p>
                </div>
              </div>

            </div>

            {/* RIGHT SIDE: CONTROLLER SHEET (TABBED INTERACTIVE SIMULATION SELECTION) */}
            <div className="lg:w-1/2 bg-slate-900 flex flex-col justify-between h-full p-6">
              
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-base text-white">Merchant Quick-Scan Controller</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Simulate scanning of customer identifiers physically</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowScannerModal(false);
                      setScannerStatus('READY');
                      setDetectedParent(null);
                      setDetectedStudent(null);
                    }}
                    className="text-slate-500 hover:text-white font-mono text-xs uppercase"
                  >
                    Close [X]
                  </button>
                </div>

                {/* Tab selections */}
                <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    onClick={() => {
                      setScannerTab('STUDENT');
                      setDetectedParent(null);
                      setScannerStatus('READY');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      scannerTab === 'STUDENT'
                        ? 'bg-[#c7515e] text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <User className="h-3.5 w-3.5" />
                    Student Cards
                  </button>
                  <button
                    onClick={() => {
                      setScannerTab('PARENT');
                      setDetectedParent(null);
                      setScannerStatus('READY');
                    }}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      scannerTab === 'PARENT'
                        ? 'bg-[#c7515e] text-white shadow-md'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    Parent App QR
                  </button>
                </div>

                {/* Tab Content body (Scrollable list of candidates) */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin max-h-[280px]">
                  {scannerTab === 'STUDENT' ? (
                    <div className="space-y-2">
                      <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Select card candidate to scan:</span>
                      
                      {allStudents.map((stud) => {
                        const isScanningThis = detectedStudent?.id === stud.id;
                        return (
                          <button
                            key={stud.id}
                            disabled={scannerStatus !== 'READY'}
                            onClick={() => startStudentScan(stud)}
                            className={`w-full text-left rounded-xl border p-3 flex items-center justify-between transition-all duration-150 ${
                              isScanningThis
                                ? 'bg-[#c7515e]/15 border-[#c7515e] ring-1 ring-[#c7515e]'
                                : 'bg-slate-950 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/60'
                            } ${scannerStatus !== 'READY' && !isScanningThis ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <img src={stud.avatarUrl} alt="" className="w-10 h-10 rounded-full border border-slate-800" referrerPolicy="no-referrer" />
                              <div>
                                <h4 className="text-xs font-bold text-white">{stud.name}</h4>
                                <p className="text-[10px] text-slate-400 mt-0.5">{stud.class} • No-PIN: {stud.noPinLimit.toLocaleString()} UGX</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-mono text-[10px] font-bold block bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded border border-[#c7515e]/15">
                                {stud.qrHash}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {detectedParent && scannerStatus === 'SUCCESS' ? (
                        // Parent is scanned successfully! Display options to select child
                        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
                          <div className="bg-slate-950 rounded-xl p-4 border border-emerald-500/20 space-y-1">
                            <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-widest block">Linked Family Account Identified</span>
                            <h4 className="text-sm font-black text-white">{detectedParent.name}</h4>
                            <p className="text-xs text-slate-400">{detectedParent.phone}</p>
                          </div>

                          <div className="space-y-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Choose child payment account to authorize billing:</span>
                            {allStudents.filter(s => s.parentPhone === detectedParent.phone).length === 0 ? (
                              <p className="text-xs text-slate-500 italic">No students linked to this parent account.</p>
                            ) : (
                              allStudents
                                .filter(s => s.parentPhone === detectedParent.phone)
                                .map((s) => (
                                  <button
                                    key={s.id}
                                    onClick={() => selectParentChild(s)}
                                    className="w-full text-left bg-slate-950 hover:bg-[#c7515e]/10 hover:border-[#c7515e]/50 border border-slate-800 rounded-lg p-3 flex items-center gap-3 transition-colors"
                                  >
                                    <img src={s.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-slate-800" referrerPolicy="no-referrer" />
                                    <div className="flex-1">
                                      <h5 className="text-xs font-bold text-slate-200">{s.name}</h5>
                                      <p className="text-[10px] text-slate-400">{s.class}</p>
                                    </div>
                                    <span className="text-emerald-400 font-mono text-xs font-bold">Pay Card &gt;&gt;</span>
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      ) : (
                        // Normal select parent screen
                        <>
                          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest block mb-1">Select Parent App QR code candidate to scan:</span>
                          {allParents.map((parent) => {
                            const isScanningThis = detectedParent?.id === parent.id;
                            return (
                              <button
                                key={parent.id}
                                disabled={scannerStatus !== 'READY'}
                                onClick={() => startParentScan(parent)}
                                className={`w-full text-left rounded-xl border p-3 flex items-center justify-between transition-all duration-150 ${
                                  isScanningThis
                                    ? 'bg-[#c7515e]/15 border-[#c7515e] ring-1 ring-[#c7515e]'
                                    : 'bg-slate-950 border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/60'
                                }  ${scannerStatus !== 'READY' && !isScanningThis ? 'opacity-40 cursor-not-allowed' : ''}`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                                    <User className="h-5 w-5 text-slate-400" />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-bold text-white">{parent.name}</h4>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{parent.phone} • Verification: Tier {parent.kycTier}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <span className="font-mono text-[9px] font-bold block bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/15">
                                    APP QR LINK
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>

              </div>

              {/* Back to main controller panel */}
              <div className="border-t border-slate-800 pt-4 flex gap-3">
                <button
                  onClick={() => {
                    setShowScannerModal(false);
                    setScannerStatus('READY');
                    setDetectedParent(null);
                    setDetectedStudent(null);
                  }}
                  className="flex-1 py-3 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
                >
                  Cancel Scanner
                </button>
                {scannerStatus !== 'READY' && (
                  <button
                    onClick={() => {
                      setScannerStatus('READY');
                      setDetectedParent(null);
                      setDetectedStudent(null);
                    }}
                    className="px-4 py-3 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 border border-rose-500/20 rounded-xl transition"
                  >
                    Reset Lens
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}