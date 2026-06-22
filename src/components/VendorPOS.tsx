import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wifi, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  CreditCard, 
  Lock, 
  Smartphone, 
  Clipboard,
  DollarSign,
  Utensils,
  Shirt,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Student, PaymentCategory } from '../lib/types';

interface VendorPOSProps {
  students: Student[];
  onAddTransaction: (newTx: {
    amount: number;
    category: PaymentCategory;
    categoryLabel: string;
    studentName: string;
    studentCardId: string;
    merchantName: string;
  }) => 'approved' | 'nsf' | 'limits_exceeded' | 'suspended';
  onNavigateHome: () => void;
}

export default function VendorPOS({
  students,
  onAddTransaction,
  onNavigateHome
}: VendorPOSProps) {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [selectedCategory, setSelectedCategory] = useState<PaymentCategory>('canteen');
  const [checkoutStage, setCheckoutStage] = useState<'register' | 'nfc_tap' | 'pin_required' | 'receipt' | 'declined'>('register');
  
  // Transaction Context
  const [selectedStudentForTap, setSelectedStudentForTap] = useState<Student | null>(null);
  const [enteredPin, setEnteredPin] = useState<string>('');
  const [pinError, setPinError] = useState<string>('');
  const [declineReason, setDeclineReason] = useState<string>('');
  const [latestRefId, setLatestRefId] = useState<string>('');

  const activeCategoryLabel = {
    canteen: 'Canteen Combo Meal',
    uniform: 'School Crest Uniform',
    tuition: 'Term Installment',
    library: 'Stationery & Books',
    sports: 'Athletic Equipment',
    other: 'General Purchase'
  }[selectedCategory];

  const handleKeyPress = (num: string) => {
    if (amountStr === '0') {
      setAmountStr(num);
    } else {
      if (amountStr.length < 6) { // restrict to max realistic snack/item amount (999,999)
        setAmountStr(amountStr + num);
      }
    }
  };

  const handleBackspace = () => {
    if (amountStr.length <= 1) {
      setAmountStr('0');
    } else {
      setAmountStr(amountStr.slice(0, -1));
    }
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  const currentNumAmount = parseInt(amountStr, 10);

  const startCheckout = () => {
    if (currentNumAmount < 500) {
      alert("Minimum POS checkouts require at least 500 UGX");
      return;
    }
    // Advance to NFC Card scan state
    setCheckoutStage('nfc_tap');
    setSelectedStudentForTap(null);
    setEnteredPin('');
    setPinError('');
  };

  const handleCardTap = (student: Student) => {
    setSelectedStudentForTap(student);
    
    // 1. Guard for Suspended Cards
    if (student.cardStatus === 'suspended') {
      setDeclineReason(`Card ${student.cardId} blocked by School Administration`);
      setCheckoutStage('declined');
      return;
    }

    // 2. Guard for Wallet Balance Sufficient
    if (student.currentBalance < currentNumAmount) {
      setDeclineReason(`Insufficient Wallet Funds. Card Balance: ${student.currentBalance.toLocaleString()} UGX. Transaction: ${currentNumAmount.toLocaleString()} UGX.`);
      setCheckoutStage('declined');
      return;
    }

    // 3. Guard for Daily Spending Cap limits
    if (currentNumAmount > student.dailyLimit) {
      setDeclineReason(`Daily Spending Cap Breach. Requested: ${currentNumAmount.toLocaleString()} UGX. Student Daily Cap: ${student.dailyLimit.toLocaleString()} UGX.`);
      setCheckoutStage('declined');
      return;
    }

    // 4. Trigger security threshold guard (PIN-less vs PIN)
    if (currentNumAmount > student.pinLessLimit) {
      // Must prompt for parent PIN code
      setCheckoutStage('pin_required');
    } else {
      // PIN-less speed approval!
      processTransactionApproval(student);
    }
  };

  const processTransactionApproval = (student: Student) => {
    const result = onAddTransaction({
      amount: currentNumAmount,
      category: selectedCategory,
      categoryLabel: activeCategoryLabel,
      studentName: student.name,
      studentCardId: student.cardId,
      merchantName: 'Main School Canteen'
    });

    if (result === 'approved') {
      setLatestRefId('TXN-' + Math.floor(1000000 + Math.random() * 9000000));
      setCheckoutStage('receipt');
    } else if (result === 'suspended') {
      setDeclineReason('NFC smart card state is suspended or locked.');
      setCheckoutStage('declined');
    } else if (result === 'nsf') {
      setDeclineReason('Insufficient balance inside student cashless wallet.');
      setCheckoutStage('declined');
    } else {
      setDeclineReason('Daily spending limits or caps exceeded for today.');
      setCheckoutStage('declined');
    }
  };

  const handleVerifyPin = () => {
    if (selectedStudentForTap) {
      if (enteredPin === selectedStudentForTap.pinCode) {
        processTransactionApproval(selectedStudentForTap);
      } else {
        setPinError('Incorrect 4-digit Parent Security PIN. Look at cheat sheet!');
      }
    }
  };

  const handlePressPinDigit = (num: string) => {
    if (enteredPin.length < 4) {
      setEnteredPin(enteredPin + num);
      setPinError('');
    }
  };

  const handleRefund = () => {
    setAmountStr('0');
    setCheckoutStage('register');
    setSelectedStudentForTap(null);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Breadcrumb Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold uppercase tracking-wider">
              Offline Smart Gateways
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-slate-900">
            Pocket Merchant POS
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Simulate a physical NFC-integrated cashless point-of-sale device. Complete express transactions.
          </p>
        </div>

        <button 
          onClick={onNavigateHome}
          className="self-start md:self-auto px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-933 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
        >
          ← Exit Terminal
        </button>
      </div>

      {/* Responsive layout with layout columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Cheat sheet side instructions */}
        <div className="lg:col-span-4 bg-slate-50 border border-slate-200/60 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800 font-display font-semibold text-sm">
            <Sparkles className="h-4.5 w-4.5 text-[#d4805e]" /> POS Simulation Cheat Sheet
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            School children do not carry phones or cash! Instead, they carry custom SkoolDime <b>NFC keytags or smartcards</b> linked directly to parents wallets.
          </p>

          <div className="p-3.5 bg-white border border-slate-100 rounded-xl space-y-2">
            <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#d4805e]">Available Simulation Cards</span>
            <div className="space-y-2 divide-y divide-slate-100">
              {students.map(s => (
                <div key={s.cardId} className="pt-2 first:pt-0 text-xs">
                  <div className="flex justify-between font-medium text-slate-800">
                    <span>{s.name}</span>
                    <span className={`text-[9px] ${s.cardStatus === 'active' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {s.cardStatus === 'active' ? 'ACTIVE' : 'BLOCKED'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
                    <span>Bal: {s.currentBalance.toLocaleString()} UGX</span>
                    <span>Limit: {s.dailyLimit.toLocaleString()} UGX</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                    <span>Card Tap Code: <b>{s.cardId}</b></span>
                    <span>Parent PIN: <b className="text-slate-600 font-bold">{s.pinCode}</b></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 leading-normal bg-[#fcf2ed] border border-[#fcf2ed] p-3 rounded-xl">
            💡 <b>Try this test case:</b> Charge <span className="font-semibold text-slate-800">12,000 UGX</span> for a <b>Canteen meal</b>. Tap on <b>Kato Mugisha</b>. Because it exceeds Kato's PIN-less limit (8,000 UGX), the terminal will require you to type parent PIN <b className="text-slate-900">1482</b>!
          </div>
        </div>

        {/* The beautiful Virtual POS handheld Shell mock */}
        <div className="lg:col-span-8 flex justify-center">
          
          {/* Handheld Device Container */}
          <div className="w-full max-w-sm bg-slate-930 p-4 pb-6 rounded-[3rem] border-[10px] border-slate-900 shadow-2xl relative overflow-hidden bg-slate-950 text-white min-h-[580px] flex flex-col justify-between">
            <div className="absolute top-0 inset-x-0 h-4 bg-slate-900 flex justify-center z-20">
              <div className="w-16 h-3 bg-black rounded-b-md" /> {/* Phone Speaker */}
            </div>

            {/* Simulated Android Status Bar */}
            <div className="flex justify-between items-center px-4 pt-4 pb-2 text-[10px] font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3 text-emerald-500" /> SkoolDime_Terminal_2A
              </span>
              <span>15:42 • 100%</span>
            </div>

            {/* POS SCREEN */}
            <div className="bg-slate-900 mx-1.5 rounded-2xl p-4 flex-1 flex flex-col justify-between relative border border-slate-800">
              
              <AnimatePresence mode="wait">
                {/* 1. STAGE: REGISTER INPUT */}
                {checkoutStage === 'register' && (
                  <motion.div 
                    key="register_stage"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between space-y-4"
                  >
                    {/* Header selection info */}
                    <div className="text-center">
                      <span className="text-[9px] font-mono uppercase bg-[#fcf2ed]/10 text-[#d4805e] px-2 py-0.5 rounded-full font-semibold">
                        Cashless Checkout POS
                      </span>
                      <div className="text-2xl font-bold font-mono tracking-tight text-white mt-3 min-h-[36px]">
                        {currentNumAmount.toLocaleString()} <span className="text-xs text-slate-400">UGX</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 min-h-[16px]">
                        Charging for: {activeCategoryLabel}
                      </p>
                    </div>

                    {/* Category Fast Selection */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(['canteen', 'uniform', 'library', 'sports'] as PaymentCategory[]).map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`p-2.5 rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                            selectedCategory === cat 
                              ? 'border-[#d4805e] bg-[#fcf2ed]/15 text-[#d4805e]' 
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                          }`}
                        >
                          {cat === 'canteen' && <Utensils className="h-4.5 w-4.5" />}
                          {cat === 'uniform' && <Shirt className="h-4.5 w-4.5" />}
                          {cat === 'library' && <BookOpen className="h-4.5 w-4.5" />}
                          {cat === 'sports' && <CreditCard className="h-4.5 w-4.5" />}
                          <span className="text-[8px] font-semibold capitalize tracking-wide">{cat}</span>
                        </button>
                      ))}
                    </div>

                    {/* Digital Numeric Keypad */}
                    <div className="grid grid-cols-3 gap-1.5 bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                        <button
                          key={digit}
                          onClick={() => handleKeyPress(digit)}
                          className="h-10 text-sm font-bold font-mono bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                        >
                          {digit}
                        </button>
                      ))}
                      <button
                        onClick={handleClear}
                        className="h-10 text-xs font-semibold bg-red-950/40 hover:bg-red-950 text-red-400 border border-red-900/30 rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => handleKeyPress('0')}
                        className="h-10 text-sm font-bold font-mono bg-slate-900 border border-slate-800 hover:bg-slate-800 rounded-lg text-slate-100 flex items-center justify-center active:scale-95 transition-all cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        onClick={handleBackspace}
                        className="h-10 text-xs font-semibold bg-slate-800/60 hover:bg-slate-800 text-slate-300 rounded-lg flex items-center justify-center active:scale-95 cursor-pointer"
                      >
                        Backspace
                      </button>
                    </div>

                    {/* Checkout CTA */}
                    <button
                      onClick={startCheckout}
                      disabled={currentNumAmount <= 0}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-[#d4805e] to-[#e8956f] text-sm font-semibold text-white tracking-wide hover:shadow-lg disabled:opacity-50 active:scale-[0.99] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      Process Checkout <ArrowRight className="h-4 w-4" />
                    </button>
                  </motion.div>
                )}


                {/* 2. STAGE: NFC TAP NFC RADIATION PATTERN */}
                {checkoutStage === 'nfc_tap' && (
                  <motion.div 
                    key="nfc_stage"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    {/* NFC Reader Simulation Visuals */}
                    <div className="text-center pt-2">
                      <span className="text-xs font-mono text-[#d4805e] block mb-2 font-bold tracking-wide">TAP NFC CHILD ID CARD</span>
                      
                      {/* Radiating Rings Animation */}
                      <div className="relative h-24 w-24 mx-auto my-3 flex items-center justify-center">
                        <motion.div 
                          animate={{ scale: [1, 1.8], opacity: [0.6, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
                          className="absolute h-14 w-14 rounded-full border-2 border-[#d4805e]"
                        />
                        <motion.div 
                          animate={{ scale: [1, 1.4], opacity: [0.8, 0] }}
                          transition={{ repeat: Infinity, duration: 1.8, delay: 0.6, ease: "easeOut" }}
                          className="absolute h-14 w-14 rounded-full border border-[#e8956f]"
                        />
                        <div className="h-14 w-14 rounded-full bg-gradient-to-tr from-[#d4805e] to-[#e8956f] text-white flex items-center justify-center shadow-md border-2 border-slate-900 z-10 relative">
                          <Wifi className="h-6 w-6 animate-pulse" />
                        </div>
                      </div>
                      
                      <p className="text-[10px] text-slate-400 px-6 mt-1">
                        Awaiting card proximity. Touch one of the mock student cards from the cheat sheet below to scan:
                      </p>
                    </div>

                    {/* Touch Card Selector inside terminal */}
                    <div className="space-y-1.5 my-4 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[8px] font-mono font-semibold uppercase tracking-wider text-slate-500 block mb-1">Simulate Card Proximity (Tap Card)</span>
                      <div className="space-y-1 max-h-[140px] overflow-y-auto pr-1">
                        {students.map((student) => (
                          <button
                            key={student.cardId}
                            onClick={() => handleCardTap(student)}
                            className="w-full text-left p-2 bg-slate-900 hover:bg-slate-800 rounded-md border border-slate-800 hover:border-slate-700/80 transition-all flex items-center justify-between text-xs cursor-pointer group active:bg-slate-850"
                          >
                            <div>
                              <div className="font-semibold text-slate-100 group-hover:text-[#d4805e] transition-colors">{student.name}</div>
                              <div className="text-[9px] text-slate-400 font-mono mt-0.5">{student.cardId} • {student.classroom}</div>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-300">{student.currentBalance.toLocaleString()} UGX</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setCheckoutStage('register')}
                      className="w-full py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    >
                      ← Back to terminal
                    </button>
                  </motion.div>
                )}


                {/* 3. STAGE: PIN CONFIRMATION */}
                {checkoutStage === 'pin_required' && selectedStudentForTap && (
                  <motion.div 
                    key="pin_stage"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between space-y-4"
                  >
                    <div className="text-center">
                      <Lock className="h-6 w-6 text-amber-500 mx-auto" />
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 mt-1.5">Parent Security verification</h3>
                      <p className="text-[10px] text-slate-400 mt-1 px-4">
                        Charge of <b>{currentNumAmount.toLocaleString()} UGX</b> exceeds PIN-less threshold for <b>{selectedStudentForTap.name}</b>.
                      </p>
                    </div>

                    {/* Masked PIN Code input display */}
                    <div className="flex justify-center gap-3.5 my-2">
                      {[0, 1, 2, 3].map((index) => (
                        <div 
                          key={index} 
                          className={`h-9 w-9 rounded-lg border flex items-center justify-center font-mono text-lg font-bold ${
                            enteredPin.length > index 
                              ? 'border-[#d4805e] bg-[#fcf2ed]/5 text-[#d4805e]' 
                              : 'border-slate-800 bg-slate-950 text-slate-600'
                          }`}
                        >
                          {enteredPin.length > index ? '●' : ''}
                        </div>
                      ))}
                    </div>

                    {pinError && (
                      <p className="text-[10px] text-red-500 text-center font-semibold">{pinError}</p>
                    )}

                    {/* Numeric Pin Entry Pad */}
                    <div className="grid grid-cols-3 gap-1 px-4">
                      {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((val) => (
                        <button
                          key={val}
                          onClick={() => handlePressPinDigit(val)}
                          className="py-1.5 font-bold font-mono bg-slate-950 rounded-md border border-slate-800 text-slate-300 text-xs hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
                        >
                          {val}
                        </button>
                      ))}
                      <button
                        onClick={() => { setEnteredPin(''); setPinError(''); }}
                        className="py-1.5 text-[10px] font-semibold bg-red-950/20 text-red-400 rounded-md border border-red-950 hover:bg-red-950/40 cursor-pointer"
                      >
                        Clear
                      </button>
                      <button
                        onClick={() => handlePressPinDigit('0')}
                        className="py-1.5 font-bold font-mono bg-slate-950 rounded-md border border-slate-800 text-slate-300 text-xs hover:bg-slate-900 active:scale-95 transition-all cursor-pointer"
                      >
                        0
                      </button>
                      <button
                        onClick={handleVerifyPin}
                        disabled={enteredPin.length !== 4}
                        className="py-1.5 text-[10px] font-bold bg-[#d4805e] hover:bg-orange-800 text-white rounded-md transition-colors disabled:opacity-40 cursor-pointer"
                      >
                        Verify
                      </button>
                    </div>

                    <div className="text-[10px] text-center text-slate-500 italic bg-slate-950 p-1.5 rounded border border-slate-800">
                      Cheatsheet: Parent PIN for Kato is <b className="text-slate-300">1482</b>
                    </div>

                    <button
                      onClick={() => setCheckoutStage('nfc_tap')}
                      className="w-full py-1.5 bg-slate-950 text-slate-400 text-xs rounded transition-colors border border-slate-800 hover:text-white cursor-pointer"
                    >
                      ← Back to NFC Tap stage
                    </button>
                  </motion.div>
                )}


                {/* 4. STAGE: COMPLETED THERMAL RECEIPT SLIDEOUT */}
                {checkoutStage === 'receipt' && selectedStudentForTap && (
                  <motion.div 
                    key="receipt_stage"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col justify-between"
                  >
                    {/* Thermal Paper Animation container */}
                    <div className="bg-slate-950 p-2 rounded-xl flex-1 flex flex-col justify-center">
                      
                      <motion.div 
                        initial={{ y: -80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ type: "spring", damping: 14 }}
                        className="bg-white text-slate-950 p-4 rounded-md font-mono text-[9px] text-left relative overflow-hidden shadow-2xl max-w-[240px] mx-auto"
                      >
                        {/* Thermal Tear border styling */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500/10 to-amber-500/10" />
                        
                        <div className="text-center font-bold text-[10px] tracking-wide text-slate-900 border-b border-dashed border-slate-300 pb-2 mb-2">
                          *** SKOOLDIME ***
                          <p className="text-[7px] text-slate-500 font-normal mt-0.5">Skooldime Cashless High School</p>
                          <p className="text-[7px] text-slate-600 font-bold uppercase mt-1">APPROVED RECEIPT</p>
                        </div>

                        <div className="space-y-1 text-[8px]">
                          <div className="flex justify-between">
                            <span>TERMINAL ID:</span> <span className="font-bold">POS-#2A56</span>
                          </div>
                          <div className="flex justify-between">
                            <span>DATE:</span> <span>{new Date().toLocaleDateString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>TIME:</span> <span>{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>REF CODE:</span> <span className="font-bold">{latestRefId}</span>
                          </div>
                        </div>

                        <div className="border-t border-b border-dashed border-slate-300 py-1.5 my-2 space-y-1 text-[8px]">
                          <div className="flex justify-between font-bold text-slate-900">
                            <span>STUDENT:</span> <span>{selectedStudentForTap.name}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>ID CARD:</span> <span>{selectedStudentForTap.cardId}</span>
                          </div>
                          <div className="flex justify-between text-slate-500">
                            <span>CLASS:</span> <span>{selectedStudentForTap.classroom}</span>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between">
                            <span>{activeCategoryLabel}</span> <span className="font-bold">{currentNumAmount.toLocaleString()} UGX</span>
                          </div>
                        </div>

                        {/* Approved Stamp */}
                        <div className="mt-4 border-2 border-dashed border-emerald-600 text-emerald-600 font-bold text-[10px] tracking-widest text-center py-1 uppercase opacity-85 rounded-sm transform -rotate-3 select-none">
                          ✓ CASHLESS SUCCESS
                        </div>

                        <p className="text-[7px] font-sans text-center text-slate-400 mt-3 select-none">
                          No paper waste. Invoice transmitted instantly to parent wallet notifications.
                        </p>
                      </motion.div>
                    </div>

                    <button
                      onClick={handleRefund}
                      className="w-full mt-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg text-xs font-semibold hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="h-4 w-4" /> Next POS Check-out
                    </button>
                  </motion.div>
                )}


                {/* 5. STAGE: DECLINED / FAILURE ERROR */}
                {checkoutStage === 'declined' && (
                  <motion.div 
                    key="declined_stage"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 flex flex-col justify-between text-center pt-4"
                  >
                    <div className="space-y-3">
                      <div className="h-12 w-12 rounded-full bg-red-950/40 border border-red-900 text-red-500 flex items-center justify-center mx-auto">
                        <XCircle className="h-7 w-7" />
                      </div>
                      <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">TRANSACTION DENIED</h4>
                      
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2 text-left">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Declined Reason:</div>
                        <p className="text-xs text-slate-200 leading-relaxed leading-normal">{declineReason}</p>
                      </div>

                      {selectedStudentForTap && (
                        <div className="p-3 bg-red-950/10 border border-red-950/20 rounded-lg text-xs flex justify-between items-center text-slate-400">
                          <div>
                            <span className="block font-semibold text-slate-200">{selectedStudentForTap.name}</span>
                            <span className="text-[9px] font-mono">{selectedStudentForTap.cardId}</span>
                          </div>
                          <span className="font-mono text-slate-300 font-bold">{selectedStudentForTap.currentBalance.toLocaleString()} UGX</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleRefund}
                      className="w-full mt-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
                    >
                      ← Dismiss & Charge Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>

            {/* Tap-Card/Merchant Device physical speaker footer */}
            <div className="mt-3 flex justify-between items-center px-6">
              <div className="h-1 bg-slate-800 w-12 rounded-full" />
              <div className="h-7 w-7 rounded-full bg-gradient-to-t from-slate-900 to-slate-800 border border-slate-750 flex items-center justify-center text-slate-400 shadow-md">
                <Smartphone className="h-4.5 w-4.5 font-bold" />
              </div>
              <div className="h-1 bg-slate-800 w-12 rounded-full" />
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
