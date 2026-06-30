import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, QrCode, ClipboardList, RefreshCw, Key, ArrowRight, 
  UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, Search, Plus, CreditCard, Banknote,
  Smartphone, Camera, User, TrendingUp, Users, BarChart3, X
} from 'lucide-react';
import { Student, CatalogItem, Transaction } from '../types';
import { useToast } from './ToastContext';
import { RecentTransactions } from './RecentTransactions';
import { QRCodeSVG } from 'qrcode.react';

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
  const [activeTerminalTab, setActiveTerminalTab] = useState<'POS' | 'ANALYTICS' | 'HISTORY'>('POS');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allParents, setAllParents] = useState<any[]>([]);
  
  // Custom manual item input
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  // Catalog search & Simulation candidates search
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  
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

  // Simplified Card Scan Dialog States
  const [showScanDialog, setShowScanDialog] = useState(false);
  const [scanStatus, setScanStatus] = useState<'READY' | 'READING' | 'SUCCESS' | 'DECLINED'>('READY');
  const [scanDeclineMessage, setScanDeclineMessage] = useState('');
  const [pinRequiredStudent, setPinRequiredStudent] = useState<Student | null>(null);
  const [scanSearchQuery, setScanSearchQuery] = useState('');

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
    if (cartTotal <= 0) {
      toast.error('Cart is empty.');
      return;
    }
    setShowScanDialog(true);
  };

  const executeCheckoutRequest = async (pinCode: string | null, studentToPay: Student) => {
    setLoading(true);
    setPinError('');

    const payload = {
      studentId: studentToPay.id,
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
        setShowScanDialog(false);
        setScanStatus('READY');
        
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
        setPinRequiredStudent(studentToPay);
        setShowPinModal(true);
      } else {
        setPinError(data.error);
        if (!pinCode) {
          setScanDeclineMessage(data.error || 'Checkout failed.');
          setScanStatus('DECLINED');
        } else {
          toast.error(data.error || 'Checkout failed.');
        }
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
    if (enteredPin.length === 4 && pinRequiredStudent) {
      executeCheckoutRequest(enteredPin, pinRequiredStudent);
    }
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
    <div className="space-y-6 text-slate-800">
      
      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-slate-100 border border-slate-200 p-1 rounded-xl max-w-lg mb-6">
        <button
          type="button"
          onClick={() => setActiveTerminalTab('POS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeTerminalTab === 'POS'
              ? 'bg-[#06065C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          <span>POS Checkout</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTerminalTab('ANALYTICS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeTerminalTab === 'ANALYTICS'
              ? 'bg-[#06065C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <BarChart3 className="h-4.5 w-4.5" />
          <span>Shift Sales</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTerminalTab('HISTORY')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeTerminalTab === 'HISTORY'
              ? 'bg-[#06065C] text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Banknote className="h-4.5 w-4.5" />
          <span>Ledger & MoMo</span>
        </button>
      </div>

      {activeTerminalTab === 'POS' && (
        /* POS Top Section: Main Work Area (Scanner on left, Catalog on right) */
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
          {/* LEFT COLUMN: Optical Scanner Terminal, Active Student profile, and Shopping Cart (5 cols) */}
          <div className="xl:col-span-5 flex flex-col gap-6">

            {/* ACTIVE RFID / QR OPTICAL TERMINAL */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
              <style>{`
                @keyframes scanLaser {
                  0% { top: 4%; opacity: 0.3; }
                  50% { top: 96%; opacity: 1; }
                  100% { top: 4%; opacity: 0.3; }
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
                  width: 20px;
                  height: 20px;
                  border-color: #ED0101;
                  position: absolute;
                }
                .flash-active {
                  animation: scanBeepFlash 0.5s ease-out forwards;
                }
              `}</style>

              {/* Header */}
              <div className="bg-white border-b border-slate-150 px-5 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-red-50 text-[#ED0101] border border-red-100">
                    <Camera className="h-4.5 w-4.5 text-[#ED0101] animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 tracking-tight text-sm">Active RFID / QR Optical Terminal</h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Dual-stream merchant scanner terminal for student cards & parent devices</p>
                  </div>
                </div>
                
                {/* Active telemetry label */}
                <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] font-mono text-slate-700 font-bold tracking-wider">TERMINAL_ACTIVE</span>
                </div>
              </div>

              {/* Viewfinder Stream Viewport (Full width inside left col card) */}
              <div className="p-5 border-b border-slate-100">
                <div className={`w-full bg-slate-900 rounded-xl relative flex flex-col justify-between p-5 min-h-60 overflow-hidden transition-colors duration-300 ${scanFlash ? 'flash-active' : ''}`}>
                  {/* Status Indicator overlay */}
                  <div className="flex items-center justify-between z-10">
                    <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/5">
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        scannerStatus === 'SUCCESS' ? 'bg-emerald-500 animate-ping' :
                        scannerStatus === 'DECODING' ? 'bg-amber-500 animate-spin' :
                        scannerStatus === 'SCANNING' ? 'bg-red-500 animate-pulse' :
                        'bg-emerald-500 animate-pulse'
                      }`}></span>
                      <span className="text-[9px] font-mono text-slate-300 uppercase tracking-widest font-black">
                        {scannerStatus === 'READY' && 'CAMERA_LIVE'}
                        {scannerStatus === 'SCANNING' && 'CAPTURING...'}
                        {scannerStatus === 'DECODING' && 'DECODING...'}
                        {scannerStatus === 'SUCCESS' && 'VERIFIED!'}
                      </span>
                    </div>

                    <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-slate-400">
                      60FPS • 1080P
                    </div>
                  </div>

                  {/* Viewfinder Target Reticle */}
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <div className="w-40 h-40 border border-dashed border-slate-700 rounded-2xl relative flex flex-col items-center justify-center bg-black/25">
                      
                      {/* Viewfinder Corners */}
                      <div className="viewfinder-corner top-0 left-0 border-t-4 border-l-4 rounded-tl-xl"></div>
                      <div className="viewfinder-corner top-0 right-0 border-t-4 border-r-4 rounded-tr-xl"></div>
                      <div className="viewfinder-corner bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl"></div>
                      <div className="viewfinder-corner bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl"></div>

                      {/* Laser Sweep Line */}
                      {scannerStatus !== 'SUCCESS' && (
                        <div className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_8px_#ff0000] laser-sweep z-10"></div>
                      )}

                      {/* Content based on Scanner State */}
                      {scannerStatus === 'READY' && (
                        <div className="text-center p-3 space-y-2 z-10">
                          <QrCode className="h-8 w-8 text-slate-400 mx-auto animate-pulse" />
                          <p className="text-[11px] font-bold text-slate-200">Ready to Scan</p>
                          <p className="text-[9px] text-slate-400 leading-tight">Tap the simulation button below to trigger card swiping</p>
                        </div>
                      )}

                      {scannerStatus === 'SCANNING' && (
                        <div className="text-center p-3 space-y-2 z-10">
                          <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin mx-auto"></div>
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest animate-pulse">Scanning Code...</p>
                        </div>
                      )}

                      {scannerStatus === 'DECODING' && (
                        <div className="text-center p-3 space-y-2 z-10">
                          <RefreshCw className="h-8 w-8 text-amber-400 mx-auto animate-spin" />
                          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Decoding ledger...</p>
                        </div>
                      )}

                      {scannerStatus === 'SUCCESS' && (
                        <div className="text-center p-3 space-y-1.5 z-10 animate-in zoom-in-75 duration-150">
                          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
                          <p className="text-xs font-bold text-emerald-400">Match Succeeded!</p>
                          <p className="text-[9px] font-mono text-slate-300 truncate max-w-36">
                            {detectedStudent ? detectedStudent.name : detectedParent?.name}
                          </p>
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Simulation Scan Trigger Button Overlaid / Stacked */}
                  <div className="flex justify-center z-20 pb-1 mt-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setShowScannerModal(true);
                        setDetectedStudent(null);
                        setDetectedParent(null);
                        setScannerStatus('READY');
                      }}
                      className="px-4 py-2 bg-[#06065C] hover:bg-[#040440] text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-1.5 transform active:scale-95"
                    >
                      <CreditCard className="h-4 w-4 text-white" />
                      Simulate Card / QR Tap
                    </button>
                  </div>
                </div>
              </div>

              {/* Verified Profile Card display underneath active scanner */}
              <div className="p-5 bg-slate-50/50">
                {scannedStudent ? (
                  <div className="flex flex-col items-stretch gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="flex items-center gap-3">
                      <img 
                        src={scannedStudent.avatarUrl} 
                        alt={scannedStudent.name} 
                        className="w-11 h-11 rounded-full border border-slate-200" 
                        referrerPolicy="no-referrer" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="font-bold text-slate-800 text-xs truncate">{scannedStudent.name}</h4>
                          <span className="text-[9px] bg-red-50 text-[#ED0101] font-mono px-1.5 py-0.5 rounded border border-red-100 font-bold whitespace-nowrap">
                            LOADED
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{scannedStudent.class} • ID: <span className="font-mono text-slate-700 font-bold">{scannedStudent.qrHash}</span></p>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-2.5 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Account Balance</span>
                        <span className="text-sm font-mono font-black text-slate-800">{(scannedStudent.balance || 0).toLocaleString()} UGX</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setScannedStudent(null);
                          setSearchQr('');
                          toast.success('Student session ended. Terminal cleared.');
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-[10px] font-bold transition-colors border border-slate-200"
                      >
                        Clear Session
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2.5 py-4 text-slate-500 text-xs border border-dashed border-slate-200 rounded-xl bg-white">
                    <UserCheck className="h-4 w-4 text-slate-400" />
                    <span>No active card swiped</span>
                  </div>
                )}
              </div>
            </div>

            {/* ORDER BASKET CARD (Positioned elegantly on the left column under scanner) */}
            <div className="flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-5 min-h-110 shadow-sm">
              <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">Current Order</span>
                  <span className="text-[11px] font-mono text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full font-bold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
                  </span>
                </div>
                
                {/* Basket list */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-96 scrollbar-thin">
                  {cart.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Basket is empty. Select canteen menu items on the right.
                    </div>
                  ) : (
                    cart.map((item) => (
                      <div key={item.name} className="flex justify-between items-center border-b border-slate-100 py-2.5">
                        <div className="flex-1 min-w-0 pr-2">
                          <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {item.price.toLocaleString()} UGX x {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-700">
                            {(item.price * item.quantity).toLocaleString()} UGX
                          </span>
                          <button
                            onClick={() => handleRemoveFromCart(item.name)}
                            className="text-slate-400 hover:text-[#ED0101] p-1 text-xs font-bold font-mono"
                            title="Remove item"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Pay trigger section */}
                <div className="border-t border-slate-200 pt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-600">Total Amount:</span>
                    <span className="text-base font-bold text-slate-900 font-mono">
                      {cartTotal.toLocaleString()} UGX
                    </span>
                  </div>
                  
                  {scannedStudent ? (
                    <button
                      type="button"
                      onClick={() => executeCheckoutRequest(null, scannedStudent)}
                      disabled={cart.length === 0 || loading}
                      className={`w-full py-3.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                        cart.length === 0 || loading
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-98 shadow-sm shadow-emerald-600/10'
                      }`}
                    >
                      {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                      Charge {scannedStudent.name}'s Card
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleCheckout}
                      disabled={cart.length === 0}
                      className={`w-full py-3.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                        cart.length === 0
                          ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-[#ED0101] text-white hover:bg-[#d60000] active:scale-98 shadow-sm shadow-[#ED0101]/10'
                      }`}
                    >
                      <CreditCard className="h-4 w-4" /> Scan Card to Pay
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleGeneratePaymentQr}
                    disabled={cart.length === 0 || loading}
                    className={`w-full py-2.5 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all border ${
                      cart.length === 0 || loading
                        ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 active:scale-98'
                    }`}
                  >
                    <QrCode className="h-4 w-4" />
                    Generate Family Payment QR
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Searchable Catalog & Custom Amount additions (7 cols) */}
          <div className="xl:col-span-7 flex flex-col gap-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            
            {/* Header with real-time searching input */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h3 className="font-bold text-base text-slate-800 tracking-tight">Canteen Inventory</h3>
                <p className="text-xs text-slate-500 mt-0.5">Select items to build the customer's order basket</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={searchCatalogQuery}
                  onChange={(e) => {
                    setSearchCatalogQuery(e.target.value);
                    setCustomName(e.target.value);
                  }}
                  placeholder="Search catalog items..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-8 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-300 outline-none transition-colors"
                />
                {searchCatalogQuery && (
                  <button
                    onClick={() => {
                      setSearchCatalogQuery('');
                      setCustomName('');
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    X
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Items Grid (No background or heavy colors) */}
            {catalog.filter(item => item.name.toLowerCase().includes(searchCatalogQuery.toLowerCase())).length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center space-y-4 bg-transparent">
                <p className="text-xs text-slate-500">No registered menu items match "{searchCatalogQuery}".</p>
                {searchCatalogQuery && (
                  <div className="max-w-xs mx-auto p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-[11px] text-slate-500 mb-2">Instantly add a custom ticket for this search:</p>
                    <button
                      onClick={() => {
                        const priceNum = parseInt(customPrice) || 1000;
                        handleAddToCart(searchCatalogQuery, priceNum);
                        toast.success(`Custom item "${searchCatalogQuery}" added to basket.`);
                      }}
                      className="w-full py-1.5 bg-[#06065C] hover:bg-[#040440] text-white text-[10px] font-bold rounded-md transition"
                    >
                      Add "{searchCatalogQuery}" to Basket (1,000 UGX)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {catalog
                  .filter(item => item.name.toLowerCase().includes(searchCatalogQuery.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleAddToCart(item.name, item.price)}
                      className="rounded-lg border border-slate-200 bg-white hover:border-slate-300 p-3.5 text-left transition-all active:scale-98 flex flex-col justify-between h-20 shadow-xs"
                    >
                      <span className="text-xs font-bold text-slate-800 truncate w-full">{item.name}</span>
                      <span className="text-[11px] font-mono font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.price.toLocaleString()} UGX
                      </span>
                    </button>
                  ))}
              </div>
            )}

            {/* CUSTOM TICKET ENTRY FORM (Clean and integrated) */}
            <form onSubmit={handleCustomAddToCart} className="border-t border-slate-200 pt-6 mt-4 flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-1 space-y-1.5 w-full">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Custom Ticket Name</label>
                <input
                  type="text"
                  required
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Snack Pack, Stationery Extra"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-300 outline-none transition-colors"
                />
              </div>
              <div className="w-full sm:w-44 space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Price (UGX)</label>
                <input
                  type="number"
                  required
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  placeholder="Amount"
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:border-slate-300 outline-none transition-colors"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-[#06065C] hover:bg-[#040440] text-white px-5 py-2 text-xs font-bold transition-all whitespace-nowrap w-full sm:w-auto flex items-center justify-center gap-1.5 h-9"
              >
                <Plus className="h-4 w-4 text-white" /> Add Custom
              </button>
            </form>

          </div>

        </div>
      )}

      {activeTerminalTab === 'ANALYTICS' && (
        /* DAILY TRANSACTION SUMMARY */
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
                    <div className="absolute -top-6 bg-slate-950 border border-slate-800 text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-xl text-center min-w-30">
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
                    <div className="absolute -top-6 bg-slate-950 border border-slate-800 text-[10px] rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-10 shadow-xl text-center min-w-30">
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
      )}

      {activeTerminalTab === 'HISTORY' && (
        /* BOTTOM SECTION: Operations & Logs */
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
      )}

      {/* MODALS */}
      
      {/* PIN Authorization Modal */}
      {showPinModal && pinRequiredStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-85 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto bg-[#c7515e]/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-[#c7515e]" />
              </div>
              <h4 className="text-lg font-bold text-white">Enter Student PIN</h4>
              <p className="text-xs text-slate-400 mt-1">Required for amounts over {pinRequiredStudent.noPinLimit.toLocaleString()} UGX</p>
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

      {/* Dynamic QR Code Presentation Modal */}
      {activeQrCode && !showSimModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center space-y-5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#ED0101] tracking-widest uppercase bg-red-50 px-2 py-0.5 rounded-full">skoolDime Pay</span>
              <h4 className="text-base font-black text-slate-800 mt-2">Dynamic Checkout QR</h4>
              <p className="text-xs text-slate-500 mt-1">Scan this QR from a parent app or student device to authorize instantly</p>
            </div>

            {/* QR SVG Drawing */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center justify-center space-y-3">
              <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-xs">
                <QRCodeSVG value={activeQrCode.paymentUrl} size={180} />
              </div>
              <div className="font-mono text-xs text-slate-750 font-bold bg-slate-200/50 px-3 py-1 rounded">
                Ref: {activeQrCode.referenceCode}
              </div>
              <p className="text-xs font-bold text-slate-700">Amount: <span className="font-mono text-slate-900 font-bold">{activeQrCode.amount.toLocaleString()} UGX</span></p>
            </div>

            {/* Simulated actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setShowSimModal(true)}
                className="w-full py-3 bg-[#ED0101] hover:bg-[#d60000] text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-98 shadow-md"
              >
                <Smartphone className="h-4 w-4" /> Simulate Parent App Scan
              </button>
              <button
                type="button"
                onClick={() => setActiveQrCode(null)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 transition"
              >
                Cancel / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic QR Customer Mobile Scanner Simulation Modal */}
      {showSimModal && activeQrCode && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-[3rem] border-12 border-slate-800 bg-slate-950 shadow-2xl relative overflow-hidden animate-in fade-in zoom-in duration-300 ring-4 ring-slate-900/40">
            {/* Phone Speaker & Camera Cutout (Dynamic Notch) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-50 flex items-center justify-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
              <span className="w-12 h-1 bg-slate-700 rounded-full"></span>
            </div>

            <div className="p-6 pt-10 text-slate-200 min-h-130 flex flex-col justify-between">
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

      {/* CONTACTLESS RFID CARD READER DIALOG */}
      {showScanDialog && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-slate-700" />
                <h4 className="font-bold text-slate-800 text-sm">Tap Contactless Card</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowScanDialog(false);
                  setScanStatus('READY');
                  setScanDeclineMessage('');
                }}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {scanStatus === 'DECLINED' ? (
              <div className="space-y-4 py-3 text-center">
                <div className="mx-auto bg-rose-50 w-12 h-12 rounded-full flex items-center justify-center text-rose-600">
                  <X className="h-6 w-6" />
                </div>
                <div className="space-y-1">
                  <h5 className="font-bold text-slate-850 text-sm">Payment Declined</h5>
                  <p className="text-xs text-rose-650 font-medium">
                    {scanDeclineMessage || 'Insufficient Card Balance.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScanStatus('READY');
                    setScanDeclineMessage('');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition w-full"
                >
                  Try Another Card
                </button>
              </div>
            ) : scanStatus === 'READING' ? (
              <div className="text-center py-8 space-y-3">
                <div className="w-10 h-10 rounded-full border-2 border-slate-200 border-t-slate-800 animate-spin mx-auto"></div>
                <p className="text-xs text-slate-500 font-medium">Authorizing payment on ledger...</p>
              </div>
            ) : (
              /* AWAITING CARD: Simulated list of RFID Student cards for the cashier to trigger simulated tap */
              <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed">
                  Search and click a roster card to simulate tapping it against the canteen's terminal.
                </p>

                {/* Card Search input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={scanSearchQuery}
                    onChange={(e) => setScanSearchQuery(e.target.value)}
                    placeholder="Search card serial by name..."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-slate-300 outline-none transition-colors"
                  />
                </div>

                {/* Simulated RFID tag cards list */}
                <div className="max-h-64 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                  {allStudents.filter(stud =>
                    stud.name.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                    stud.class.toLowerCase().includes(scanSearchQuery.toLowerCase())
                  ).length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs italic">
                      No card found matching "{scanSearchQuery}"
                    </div>
                  ) : (
                    allStudents
                      .filter(stud =>
                        stud.name.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                        stud.class.toLowerCase().includes(scanSearchQuery.toLowerCase())
                      )
                      .map((stud) => (
                        <button
                          key={stud.id}
                          type="button"
                          onClick={async () => {
                            setScanStatus('READING');
                            // Delay slightly for physical tap response simulation
                            await new Promise(r => setTimeout(r, 600));
                            executeCheckoutRequest(null, stud);
                          }}
                          className="w-full text-left rounded-lg border border-slate-200 hover:border-slate-300 p-2.5 flex items-center justify-between hover:bg-slate-50 transition"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700">
                              {stud.name.charAt(0)}
                            </div>
                            <div>
                              <h5 className="text-xs font-bold text-slate-800">{stud.name}</h5>
                              <p className="text-[10px] text-slate-400">{stud.class}</p>
                            </div>
                          </div>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded font-bold">
                            TAP CARD
                          </span>
                        </button>
                      ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulation NFC/QR Scanner Modal */}
      {showScannerModal && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h4 className="text-base font-bold text-slate-800">Simulate Physical Card / QR Scan</h4>
                <p className="text-xs text-slate-500">Tap a student's contactless RFID card or scan a parent's QR code</p>
              </div>
              <button
                type="button"
                onClick={() => setShowScannerModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Tabs for Student and Parent */}
            <div className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setScannerTab('STUDENT');
                  setDetectedParent(null);
                  setScannerStatus('READY');
                  setCandidateSearchQuery('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  scannerTab === 'STUDENT'
                    ? 'bg-[#06065C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-850 hover:bg-white/50'
                }`}
              >
                <User className="h-3.5 w-3.5" />
                Students
              </button>
              <button
                type="button"
                onClick={() => {
                  setScannerTab('PARENT');
                  setDetectedParent(null);
                  setScannerStatus('READY');
                  setCandidateSearchQuery('');
                }}
                className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  scannerTab === 'PARENT'
                    ? 'bg-[#06065C] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-850 hover:bg-white/50'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                Parents
              </button>
            </div>

            {/* candidate search field */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={candidateSearchQuery}
                onChange={(e) => setCandidateSearchQuery(e.target.value)}
                placeholder={scannerTab === 'STUDENT' ? "Search student class or name..." : "Search parent name or phone..."}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-2.5 text-xs text-slate-800 focus:border-slate-300 outline-none transition-colors"
              />
            </div>

            {/* Candidate List Container */}
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
              {scannerTab === 'STUDENT' ? (
                allStudents.filter(stud => 
                  stud.name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                  stud.class.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                  stud.admissionNo.toLowerCase().includes(candidateSearchQuery.toLowerCase())
                ).length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs italic">
                    No students match "{candidateSearchQuery}"
                  </div>
                ) : (
                  allStudents
                    .filter(stud => 
                      stud.name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                      stud.class.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                      stud.admissionNo.toLowerCase().includes(candidateSearchQuery.toLowerCase())
                    )
                    .map((stud) => {
                      const isScanningThis = detectedStudent?.id === stud.id;
                      return (
                        <button
                          key={stud.id}
                          type="button"
                          disabled={scannerStatus !== 'READY'}
                          onClick={() => startStudentScan(stud)}
                          className={`w-full text-left rounded-xl border p-2.5 flex items-center justify-between transition-all duration-150 ${
                            isScanningThis
                              ? 'bg-red-50 border-red-200'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          } ${scannerStatus !== 'READY' && !isScanningThis ? 'opacity-40 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <img src={stud.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                            <div>
                              <h4 className="text-xs font-bold text-slate-800 leading-tight">{stud.name}</h4>
                              <p className="text-[10px] text-slate-500 mt-0.5">{stud.class} • Bal: {(stud.balance || 0).toLocaleString()} UGX</p>
                            </div>
                          </div>
                          <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                            {stud.qrHash}
                          </span>
                        </button>
                      );
                    })
                )
              ) : (
                detectedParent && scannerStatus === 'SUCCESS' ? (
                  // Parent scanned successfully, choose child
                  <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider block">Parent Identified</span>
                        <h4 className="text-xs font-bold text-slate-800">{detectedParent.name}</h4>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setDetectedParent(null);
                          setScannerStatus('READY');
                        }}
                        className="text-[10px] text-slate-500 hover:text-slate-850"
                      >
                        [Change]
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-500 font-bold uppercase block mb-1">Select linked student child:</span>
                      {allStudents.filter(s => s.parentPhone === detectedParent.phone).length === 0 ? (
                        <p className="text-xs text-slate-400 italic p-2 bg-slate-50 rounded border border-slate-200">No students linked to this account.</p>
                      ) : (
                        allStudents
                          .filter(s => s.parentPhone === detectedParent.phone)
                          .map((s) => (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => selectParentChild(s)}
                              className="w-full text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg p-2.5 flex items-center justify-between transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <img src={s.avatarUrl} alt="" className="w-7 h-7 rounded-full border border-slate-200" referrerPolicy="no-referrer" />
                                <div>
                                  <h5 className="text-xs font-bold text-slate-800">{s.name}</h5>
                                  <p className="text-[9px] text-slate-500">{s.class}</p>
                                </div>
                              </div>
                              <span className="text-[#06065C] font-mono text-[10px] font-bold">Select Child &gt;</span>
                            </button>
                          ))
                      )}
                    </div>
                  </div>
                ) : (
                  allParents.filter(p => 
                    p.name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                    p.phone.includes(candidateSearchQuery)
                  ).length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs italic">
                      No parents match "{candidateSearchQuery}"
                    </div>
                  ) : (
                    allParents
                      .filter(p => 
                        p.name.toLowerCase().includes(candidateSearchQuery.toLowerCase()) ||
                        p.phone.includes(candidateSearchQuery)
                      )
                      .map((parent) => {
                        const isScanningThis = detectedParent?.id === parent.id;
                        return (
                          <button
                            key={parent.id}
                            type="button"
                            disabled={scannerStatus !== 'READY'}
                            onClick={() => startParentScan(parent)}
                            className={`w-full text-left rounded-xl border p-2.5 flex items-center justify-between transition-all duration-150 ${
                              isScanningThis
                                ? 'bg-red-50 border-red-200'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                            } ${scannerStatus !== 'READY' && !isScanningThis ? 'opacity-40 cursor-not-allowed' : ''}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                                <User className="h-4 w-4 text-slate-500" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800 leading-tight">{parent.name}</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5">{parent.phone}</p>
                              </div>
                            </div>
                            <span className="font-mono text-[9px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200">
                              APP QR
                            </span>
                          </button>
                        );
                      })
                  )
                )
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}