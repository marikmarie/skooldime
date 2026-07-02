import React, { useState, useEffect } from 'react';
import jsQR from 'jsqr';
import { 
  ShoppingCart, QrCode, ClipboardList, RefreshCw, Key, ArrowRight, 
  UserCheck, AlertTriangle, ShieldCheck, CheckCircle2, Search, Plus, CreditCard, Banknote,
  Smartphone, Camera, User, TrendingUp, Users, BarChart3, X, Menu, Trash2, ChevronUp, ChevronDown, Minus
} from 'lucide-react';
import { Student, CatalogItem, Transaction } from '../types';
import { useToast } from './ToastContext';
import { RecentTransactions } from './RecentTransactions';
import { QRCodeSVG } from 'qrcode.react';
import MicroLoans from './MicroLoans';

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
  const [activeTerminalTab, setActiveTerminalTab] = useState<'POS' | 'CATALOG' | 'ANALYTICS' | 'HISTORY' | 'LOANS'>('POS');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  
  // Custom manual item input
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  
  // Catalog Management Form
  const [catalogNewName, setCatalogNewName] = useState('');
  const [catalogNewPrice, setCatalogNewPrice] = useState('');
  const [catalogNewCategory, setCatalogNewCategory] = useState<'FOOD' | 'STATIONERY' | 'CLOTHING' | 'OTHER'>('FOOD');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  
  // Catalog search & Simulation candidates search
  const [searchCatalogQuery, setSearchCatalogQuery] = useState('');
  
  // POS scanning state
  const [scannedStudent, setScannedStudent] = useState<any | null>(null);
  const [searchQr, setSearchQr] = useState('');
  const [searchQrInput, setSearchQrInput] = useState('');
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

  // Dynamic QR Code Payment
  const [activeQrCode, setActiveQrCode] = useState<{ paymentUrl: string; referenceCode: string; amount: number } | null>(null);

  // New QR Camera Scanner state
  const [scannerStatus, setScannerStatus] = useState<'READY' | 'SCANNING' | 'DECODING' | 'SUCCESS'>('READY');
  const [detectedStudent, setDetectedStudent] = useState<any | null>(null);
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

  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const [webcamStream, setWebcamStream] = useState<MediaStream | null>(null);

  // Keep refs of state to keep the animation loop uninterrupted
  const scannerStatusRef = React.useRef(scannerStatus);
  useEffect(() => {
    scannerStatusRef.current = scannerStatus;
  }, [scannerStatus]);

  const allStudentsRef = React.useRef(allStudents);
  useEffect(() => {
    allStudentsRef.current = allStudents;
  }, [allStudents]);

  const showScanDialogRef = React.useRef(showScanDialog);
  useEffect(() => {
    showScanDialogRef.current = showScanDialog;
  }, [showScanDialog]);

  useEffect(() => {
    if (!isWebcamActive) return;

    let animationFrameId: number;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d', { willReadFrequently: true });
    let lastScanTime = 0;

    const scanFrame = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          try {
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: "dontInvert"
            });

            if (code && code.data) {
              const now = Date.now();
              // Prevent scanning trigger if we scanned recently or are busy
              if (now - lastScanTime > 3000 && scannerStatusRef.current === 'READY') {
                lastScanTime = now;
                const qrHash = code.data.trim();
                
                // Find matching student
                const matchedStudent = allStudentsRef.current.find(
                  s => s.qrHash === qrHash || s.id === qrHash || qrHash.includes(s.qrHash)
                );
                
                setScannerStatus('DECODING');
                setScanFlash(true);
                playScanBeep();
                
                setTimeout(() => {
                  setScanFlash(false);
                  
                  if (showScanDialogRef.current) {
                    // Active camera scan checkout!
                    if (matchedStudent) {
                      setScanStatus('READING');
                      executeCheckoutRequest(null, matchedStudent);
                    } else {
                      toast.error('Student QR not recognized in student registry.');
                    }
                    setScannerStatus('SUCCESS');
                    setTimeout(() => {
                      setScannerStatus('READY');
                    }, 1000);
                  } else {
                    // Normal idle scan
                    handleScanQr(qrHash).then(() => {
                      setScannerStatus('SUCCESS');
                      if (matchedStudent) {
                        setDetectedStudent(matchedStudent);
                        toast.success(`Camera Card Detected: ${matchedStudent.name}`);
                      } else {
                        toast.success(`Camera QR Detected: ${qrHash}`);
                      }
                      
                      setTimeout(() => {
                        setScannerStatus('READY');
                        setDetectedStudent(null);
                      }, 1800);
                    });
                  }
                }, 500);
              }
            }
          } catch (e) {
            console.error('jsQR frame parsing error:', e);
          }
        }
      }
      
      if (isWebcamActive) {
        animationFrameId = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameId = requestAnimationFrame(scanFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isWebcamActive]);

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      setWebcamStream(stream);
      setIsWebcamActive(true);
      toast.success('Canteen terminal camera activated successfully.');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (e) {
      console.error('Webcam failed to start:', e);
      toast.error('Camera blocked or not available in this browser sandbox. Using high-fidelity digital scanner simulation.');
      setIsWebcamActive(false);
    }
  };

  const stopWebcam = () => {
    if (webcamStream) {
      webcamStream.getTracks().forEach(track => track.stop());
      setWebcamStream(null);
    }
    setIsWebcamActive(false);
  };

  useEffect(() => {
    return () => {
      if (webcamStream) {
        webcamStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [webcamStream]);

  useEffect(() => {
    if (showScanDialog) {
      startWebcam();
    } else {
      stopWebcam();
    }
  }, [showScanDialog]);

  const triggerCardScan = (stud: Student) => {
    setDetectedStudent(stud);
    setScannerStatus('SCANNING');
    
    setTimeout(() => {
      setScannerStatus('DECODING');
      
      setTimeout(() => {
        setScanFlash(true);
        playScanBeep();
        
        setTimeout(() => {
          setScanFlash(false);
          handleScanQr(stud.qrHash);
          setScannerStatus('SUCCESS');
          toast.success(`Physical card swiped: ${stud.name}`);
          
          setTimeout(() => {
            setScannerStatus('READY');
            setDetectedStudent(null);
          }, 800);
        }, 120);
      }, 500);
    }, 400);
  };

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

  const handleAddCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catalogNewName || !catalogNewPrice || !catalogNewCategory) {
      toast.error('Please enter name, price, and category.');
      return;
    }
    const targetVendorId = vendor?.id || 'V1';
    setLoading(true);
    try {
      const res = await fetch('/api/pos/catalog/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendorId: targetVendorId,
          name: catalogNewName,
          price: Number(catalogNewPrice),
          category: catalogNewCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Successfully added ${catalogNewName} to catalog!`);
        setCatalog(prev => [data.item, ...prev]);
        setCatalogNewName('');
        setCatalogNewPrice('');
      } else {
        toast.error(data.error || 'Failed to add item to catalog.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred while saving item.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCatalogItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item from your catalog?')) {
      return;
    }
    const targetVendorId = vendor?.id || 'V1';
    setLoading(true);
    try {
      const res = await fetch('/api/pos/catalog/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: itemId,
          vendorId: targetVendorId
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted successfully!');
        setCatalog(prev => prev.filter(item => item.id !== itemId));
      } else {
        toast.error(data.error || 'Failed to delete item.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error deleting item.');
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
    <div className="space-y-6 text-slate-800 relative">
      
      {/* Dynamic Slide-out Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex z-50 animate-in fade-in duration-150">
          {/* Sidebar Area */}
          <div className="w-68 max-w-[85vw] text-white h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200" style={{ backgroundColor: '#06065C' }}>
            <div>
              {/* Sidebar Header */}
              <div className="p-5 border-b border-[#040440]/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#040440] text-white shadow-sm">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-100">Canteen POS</h4>
                    <p className="text-[10px] text-slate-300 truncate w-36">
                      {vendor?.name || 'Mama Betty Canteen'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-slate-300 hover:text-white p-1 text-sm font-semibold"
                >
                  ✕
                </button>
              </div>

              {/* Sidebar Links */}
              <div className="p-4 space-y-1">
                {[
                  { tab: 'POS', label: 'POS Checkout', icon: ShoppingCart },
                  { tab: 'CATALOG', label: 'Manage Products', icon: Plus },
                  { tab: 'ANALYTICS', label: 'Shift Sales', icon: BarChart3 },
                  { tab: 'HISTORY', label: 'Ledger & MoMo', icon: Banknote },
                  { tab: 'LOANS', label: 'Apply for Micro-Loans', icon: ClipboardList },
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTerminalTab === item.tab;
                  return (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => {
                        setActiveTerminalTab(item.tab as any);
                        setIsSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#040440] text-white shadow-md'
                          : 'text-slate-300 hover:text-white hover:bg-[#040440]/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-[#040440]/40 text-center" style={{ backgroundColor: 'rgba(4, 4, 64, 0.4)' }}>
              <p className="text-[10px] text-slate-400 font-mono">
                Terminal ID: {vendor?.id || 'V1'}
              </p>
            </div>
          </div>

          {/* Touch target to dismiss sidebar */}
          <div className="flex-1" onClick={() => setIsSidebarOpen(false)} />
        </div>
      )}

      {/* Sliding Cart Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-end justify-center z-45 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl border-t border-slate-200 overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
            {/* Drawer Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-slate-700" />
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Current Shopping Cart</h4>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-sm"
              >
                ✕
              </button>
            </div>

            {/* Scrollable list of items */}
            <div className="max-h-[50vh] overflow-y-auto px-5 py-4 space-y-3 scrollbar-thin">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Your cart is empty. Add items from the canteen catalog!
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.name} className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <h5 className="text-xs font-bold text-slate-800 truncate">{item.name}</h5>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {item.price.toLocaleString()} UGX × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Plus/Minus quantity control */}
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(item.name)}
                          className="px-2 py-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-[10px] font-black transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-slate-800 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item.name, item.price)}
                          className="px-2 py-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 text-[10px] font-black transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      <span className="text-xs font-mono font-bold text-slate-800 w-20 text-right">
                        {(item.price * item.quantity).toLocaleString()} UGX
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setCart(prev => prev.filter(c => c.name !== item.name));
                        }}
                        className="text-slate-400 hover:text-brand p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Drawer Footer */}
            <div className="px-5 py-5 border-t border-slate-100 bg-slate-50 space-y-4">
              <div className="flex justify-between items-center text-slate-800">
                <span className="text-xs font-bold text-slate-500">Order Subtotal:</span>
                <span className="text-base font-extrabold font-mono text-slate-900">
                  {cartTotal.toLocaleString()} UGX
                </span>
              </div>

              {/* Checkout Action Button */}
              <div className="grid grid-cols-1 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(false);
                    setShowScanDialog(true);
                  }}
                  disabled={cart.length === 0}
                  className={`w-full py-3.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all ${
                    cart.length === 0
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                      : 'bg-[#ED0101] hover:bg-[#c90000] text-white active:scale-98 shadow-md'
                  }`}
                >
                  <CreditCard className="h-4 w-4" />
                  <span>Scan Card to Pay</span>
                </button>

                <button
                  type="button"
                  onClick={handleGeneratePaymentQr}
                  disabled={cart.length === 0 || loading}
                  className={`w-full py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all border ${
                    cart.length === 0 || loading
                      ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100 active:scale-98'
                  }`}
                >
                  <QrCode className="h-4 w-4" />
                  <span>Generate Family Payment QR</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* POS Top Header - Universal for all views inside POS component */}
      <div className="flex items-center justify-between text-white rounded-2xl p-4 shadow-sm border border-[#040440]/10 mb-4" style={{ backgroundColor: '#06065C' }}>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 hover:bg-[#040440] rounded-xl transition-all active:scale-95 text-slate-200"
            title="Open POS Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-xs font-extrabold uppercase tracking-widest text-white">
              {activeTerminalTab === 'POS' ? 'POS Checkout' : activeTerminalTab === 'CATALOG' ? 'Manage Products' : activeTerminalTab === 'ANALYTICS' ? 'Shift Sales' : activeTerminalTab === 'HISTORY' ? 'Ledger & MoMo' : 'Micro-Loans'}
            </span>
            <span className="text-[10px] text-slate-300 font-mono font-medium">
              {vendor?.name || 'Mama Betty Canteen'}
            </span>
          </div>
        </div>

        {/* Right side status / compact cart indicator */}
        <div className="flex items-center gap-2">
          {activeTerminalTab === 'POS' && (
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 hover:bg-[#040440]/80 rounded-xl transition-all active:scale-95 text-white"
              style={{ backgroundColor: '#040440' }}
              title="View Order Basket"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.reduce((sum, item) => sum + item.quantity, 0) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center font-mono">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {activeTerminalTab === 'POS' && (
        <div className="space-y-5 animate-in fade-in duration-200 pb-16">
          {/* SEARCH & FILTER CHIPS CONTAINER */}
          <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchCatalogQuery}
                onChange={(e) => setSearchCatalogQuery(e.target.value)}
                placeholder="Search catalog items..."
                className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-12 text-xs text-slate-800 focus:border-slate-300 outline-none transition shadow-xs"
              />
              <button
                type="button"
                onClick={() => {
                  if (cart.length === 0) {
                    toast.error('Your cart is empty. Add items to cart before scanning a card!');
                    return;
                  }
                  setShowScanDialog(true);
                }}
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${
                  cart.length > 0 
                    ? 'bg-[#06065C]/10 text-[#06065C] hover:bg-[#06065C] hover:text-white' 
                    : 'text-slate-300 hover:text-slate-500'
                }`}
                title="Scan Customer Card"
              >
                <CreditCard className="h-4 w-4" />
              </button>
            </div>

            {/* Category Chips scroll list */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1 flex-nowrap">
              {[
                { id: 'ALL', label: 'All Items' },
                { id: 'FOOD', label: 'Food & Drinks' },
                { id: 'STATIONERY', label: 'Stationery' },
                { id: 'CLOTHING', label: 'Clothing' },
                { id: 'OTHER', label: 'Other' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#06065C] text-white shadow-sm font-extrabold'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* MAIN ITEMS GRID SECTION */}
          <div>
            {catalog.filter(item => {
              const matchesSearch = item.name.toLowerCase().includes(searchCatalogQuery.toLowerCase());
              const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
              return matchesSearch && matchesCategory;
            }).length === 0 ? (
              /* No matching items message */
              <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-4 shadow-xs">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">No items match your criteria</p>
                  <p className="text-xs text-slate-400 mt-1">Select another category or clear your search query to see available products.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchCatalogQuery('');
                    setSelectedCategory('ALL');
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              /* Display items catalog list */
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {catalog
                  .filter(item => {
                    const matchesSearch = item.name.toLowerCase().includes(searchCatalogQuery.toLowerCase());
                    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((item) => {
                    // Generate a nice visual identifier count representing standard popularity/frequency
                    const popularityCode = item.usageCount || (Math.floor((item.price % 9) * 11) + 21);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleAddToCart(item.name, item.price);
                          toast.success(`Added ${item.name} to cart`);
                        }}
                        className="relative rounded-xl border border-slate-200 bg-white hover:border-slate-300 p-3.5 text-left transition-all hover:shadow-xs active:scale-98 flex flex-col justify-between h-24 overflow-hidden group"
                      >
                        {/* Top Right Popularity Rating Indicator Badge */}
                        <span className="absolute top-2.5 right-2.5 text-[8px] font-mono font-extrabold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                          {popularityCode}
                        </span>

                        <span className="text-xs font-bold text-slate-800 leading-snug pr-7 group-hover:text-[#06065C] transition-colors block line-clamp-2">
                          {item.name}
                        </span>

                        <span className="text-[11px] font-mono font-extrabold text-slate-600 bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-100 w-fit">
                          {item.price.toLocaleString()} UGX
                        </span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* STICKY FLOATING CART SUMMARY BOTTOM BAR ON PORTAL */}
      {cart.length > 0 && activeTerminalTab === 'POS' && !isCartOpen && (
        <div className="fixed bottom-0 inset-x-0 text-white border-t border-[#040440]/30 p-3.5 z-40 animate-in slide-in-from-bottom duration-300" style={{ backgroundColor: '#06065C' }}>
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="bg-[#040440] text-white px-2.5 py-1 rounded-full text-xs font-black font-mono">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
              </span>
              <div>
                <p className="text-[9px] text-slate-300 uppercase tracking-widest font-bold">Total Bill</p>
                <p className="text-sm font-extrabold font-mono text-emerald-400">
                  {cartTotal.toLocaleString()} UGX
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="bg-white hover:bg-slate-100 text-[#06065C] px-4.5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg active:scale-95"
            >
              <span>View Order & Scan</span>
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {activeTerminalTab === 'ANALYTICS' && (
        /* DAILY TRANSACTION SUMMARY */
        <div className="rounded-xl border border-slate-800 bg-transparent shadow-xl p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#ED0101]/10 text-[#ED0101]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-800">Daily Transaction Summary</h3>
              <p className="text-xs text-slate-500">Hourly sales volume & student traffic benchmarks for today ({new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })})</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-lg border transition-all duration-150 active:scale-95 flex items-center gap-1.5 ${
                showBenchmark 
                  ? 'bg-[#ED0101]/10 text-[#ED0101] border-[#ED0101]/30' 
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:text-slate-800 hover:bg-slate-200'
              }`}
            >
              <TrendingUp className="h-3.5 w-3.5" />
              {showBenchmark ? 'Hide' : 'Show'} Comparison Benchmark
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-transparent border border-slate-800/80 rounded-xl p-4">
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

          <div className="bg-transparent border border-slate-800/80 rounded-xl p-4">
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

          <div className="bg-transparent border border-slate-800/80 rounded-xl p-4">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest block mb-1">Avg Ticket Size</span>
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-mono font-black text-slate-200">{avgTicket.toLocaleString()}</span>
              <span className="text-[10px] text-slate-400 font-bold font-mono">UGX</span>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              Average spent per transaction
            </p>
          </div>

          <div className="bg-transparent border border-slate-800/80 rounded-xl p-4">
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
          <div className="bg-transparent border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
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
          <div className="bg-transparent border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
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

      {activeTerminalTab === 'CATALOG' && (
        <div className="space-y-6 animate-in fade-in duration-200 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left side: Add Product Form (5 columns) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-fit space-y-4">
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#06065C]">Add Product to Menu</h3>
                <p className="text-xs text-slate-500 mt-1">Populate your school canteen catalog so students can add them to card checkout baskets.</p>
              </div>

              <form onSubmit={handleAddCatalogItem} className="space-y-4 pt-2">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Product Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rolex, Samosa, HB Pencil"
                    value={catalogNewName}
                    onChange={(e) => setCatalogNewName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-slate-300 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Unit Price (UGX)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 1500"
                    value={catalogNewPrice}
                    onChange={(e) => setCatalogNewPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-slate-300 focus:bg-white transition-colors font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Category</label>
                  <select
                    value={catalogNewCategory}
                    onChange={(e) => setCatalogNewCategory(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-800 outline-none focus:border-slate-300 focus:bg-white transition-colors"
                  >
                    <option value="FOOD">Food & Drinks</option>
                    <option value="STATIONERY">Stationery</option>
                    <option value="CLOTHING">Clothing</option>
                    <option value="OTHER">Other Accessories</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-[#06065C] hover:bg-[#040440] text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>{loading ? 'Adding Product...' : 'Add Item to Catalog'}</span>
                </button>
              </form>
            </div>

            {/* Right side: Catalog List & Search (7 columns) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">Current Catalog</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Active menu items in your register ({catalog.length} items)</p>
                </div>
                
                {/* Search query inside catalog list */}
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search catalog..."
                    value={catalogSearchQuery}
                    onChange={(e) => setCatalogSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-[11px] text-slate-800 outline-none focus:border-slate-300 focus:bg-white transition"
                  />
                </div>
              </div>

              {/* List table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-2">Name</th>
                      <th className="pb-2">Category</th>
                      <th className="pb-2 text-right">Price</th>
                      <th className="pb-2 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {catalog.filter(item => 
                      item.name.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                    ).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-xs text-slate-400 italic">
                          No products found matching "{catalogSearchQuery}"
                        </td>
                      </tr>
                    ) : (
                      catalog
                        .filter(item => 
                          item.name.toLowerCase().includes(catalogSearchQuery.toLowerCase())
                        )
                        .map((item) => (
                          <tr key={item.id} className="text-xs hover:bg-slate-50 transition-colors">
                            <td className="py-3 font-bold text-slate-800">{item.name}</td>
                            <td className="py-3 text-slate-500 font-medium">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold">
                                {item.category}
                              </span>
                            </td>
                            <td className="py-3 text-right font-bold font-mono text-slate-800">
                              {item.price.toLocaleString()} UGX
                            </td>
                            <td className="py-3 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteCatalogItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors"
                                title="Delete product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {activeTerminalTab === 'LOANS' && (
        <div className="animate-in fade-in duration-200 pb-16">
          <MicroLoans defaultBorrowerId={vendor?.id || 'V1'} defaultBorrowerType="VENDOR" />
        </div>
      )}

      {/* MODALS */}
      
      {/* PIN Authorization Modal */}
      {showPinModal && pinRequiredStudent && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-85 rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="text-center mb-6">
              <div className="mx-auto bg-[#06065C]/10 w-12 h-12 rounded-full flex items-center justify-center mb-3">
                <ShieldCheck className="h-6 w-6 text-[#06065C]" />
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
                className="rounded-xl bg-[#06065C] hover:bg-[#040440] text-white font-bold text-sm shadow-md active:scale-95 transition-all"
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
      {activeQrCode && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl animate-in fade-in zoom-in duration-200 text-center space-y-5">
            <div className="flex flex-col items-center">
              <span className="text-[10px] font-bold text-[#06065C] tracking-widest uppercase bg-[#06065C]/5 px-2 py-0.5 rounded-full">skoolDime Pay</span>
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

            {/* Cancel Actions */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setActiveQrCode(null)}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-slate-800 transition bg-slate-100 rounded-xl font-bold border border-slate-200 hover:bg-slate-150"
              >
                Cancel / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONTACTLESS CAMERA QR CODE & STUDENT CARD SCANNER DIALOG */}
      {showScanDialog && (
        <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-[#ED0101] animate-pulse" />
                <h4 className="font-extrabold text-slate-800 text-sm">POS Camera Card Scanner</h4>
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
              <div className="text-center py-8 space-y-3 animate-pulse">
                <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#ED0101] animate-spin mx-auto"></div>
                <p className="text-xs text-slate-700 font-extrabold uppercase tracking-wider">Authorizing instant payment ledger split...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Real Live Camera Scanner Feed! */}
                <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-slate-950 flex flex-col items-center justify-center">
                  {isWebcamActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="p-4 text-center text-slate-400 text-xs">
                      <p className="font-semibold mb-1">Canteen camera is starting...</p>
                      <p className="text-[10px] text-slate-500">Hold student card QR up to the scanner to process instantly.</p>
                    </div>
                  )}

                  {/* High-tech Scanning Overlays */}
                  <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 flex items-center justify-center">
                    <div className="w-4/5 h-0.5 bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.8)] absolute top-1/2 -translate-y-1/2 animate-bounce" style={{ animationDuration: '2s' }} />
                    <div className="border border-emerald-400/50 w-28 h-28 rounded-md opacity-40 flex items-center justify-center">
                      <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-black/60 px-1 py-0.5 rounded">ALIGN QR</span>
                    </div>
                  </div>
                </div>

                <div className="text-center border-t border-slate-100 pt-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-[10px] font-mono text-slate-600">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>SCANNER ACTIVE — HOLD CARD TO CAMERA</span>
                  </div>
                </div>

                {/* Simulated tap list for testing/fallbacks */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Manual / Simulator Backup</span>
                    <span className="text-[9px] text-slate-400">Click student to simulate scan</span>
                  </div>

                  {/* Card Search input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={scanSearchQuery}
                      onChange={(e) => setScanSearchQuery(e.target.value)}
                      placeholder="Search students..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-800 focus:border-slate-300 outline-none transition-colors"
                    />
                  </div>

                  {/* Simulated RFID tag cards list */}
                  <div className="max-h-40 overflow-y-auto pr-1 space-y-2 scrollbar-thin">
                    {allStudents.filter(stud =>
                      stud.name.toLowerCase().includes(scanSearchQuery.toLowerCase()) ||
                      stud.class.toLowerCase().includes(scanSearchQuery.toLowerCase())
                    ).length === 0 ? (
                      <div className="text-center py-6 text-slate-400 text-xs italic">
                        No students found matching "{scanSearchQuery}"
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
                              // Delay slightly for physical scan response simulation
                              await new Promise(r => setTimeout(r, 600));
                              executeCheckoutRequest(null, stud);
                            }}
                            className="w-full text-left rounded-lg border border-slate-200 hover:border-[#ED0101]/40 p-2.5 flex items-center justify-between hover:bg-[#ED0101]/5 transition"
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-700">
                                {stud.name.charAt(0)}
                              </div>
                              <div>
                                <h5 className="text-xs font-bold text-slate-850">{stud.name}</h5>
                                <p className="text-[10px] text-slate-500">{stud.class}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono text-white bg-[#ED0101] hover:bg-[#c90000] px-2.5 py-1 rounded-md font-bold transition">
                              SIMULATE SCAN
                            </span>
                          </button>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}