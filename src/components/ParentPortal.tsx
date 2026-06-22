import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Coins, 
  Lock, 
  Bell, 
  Settings, 
  CreditCard, 
  ChevronRight, 
  Plus, 
  Sliders, 
  User, 
  Phone, 
  TrendingDown, 
  CheckCircle2, 
  Smartphone, 
  AlertCircle,
  Wifi,
  Utensils,
  Shirt,
  BookOpen
} from 'lucide-react';
import { Student, Transaction, PaymentCategory } from '../lib/types';

interface ParentPortalProps {
  students: Student[];
  transactions: Transaction[];
  onUpdateAllowanceSettings: (cardId: string, dailyLimit: number, pinLessLimit: number) => void;
  onTopUpWallet: (cardId: string, amount: number) => void;
  onNavigateHome: () => void;
}

export default function ParentPortal({
  students,
  transactions,
  onUpdateAllowanceSettings,
  onTopUpWallet,
  onNavigateHome
}: ParentPortalProps) {
  // Let the user simulate their parent account
  const parents = [
    { name: "Florence Mugisha", phone: "+256 772 123456", childrenIds: ["SD-9082-K"] }, // Kato Mugisha
    { name: "Sarah Namubiru", phone: "+256 701 987654", childrenIds: ["SD-4412-B"] },  // Babirye
    { name: "Arthur Okello", phone: "+256 782 555666", childrenIds: ["SD-8801-O"] }    // Okello Derrick
  ];

  const [selectedParentIdx, setSelectedParentIdx] = useState(0);
  const currentParent = parents[selectedParentIdx];

  // Selected child index for details
  const parentChildren = students.filter(s => currentParent.childrenIds.includes(s.cardId));
  const [selectedChildId, setSelectedChildId] = useState<string>(parentChildren[0]?.cardId || '');

  // If parent changed, reset selected children ids
  const child = students.find(s => s.cardId === selectedChildId) || parentChildren[0];

  // Dynamic limits adjustments states
  const [tempDailyLimit, setTempDailyLimit] = useState<number>(child?.dailyLimit || 15000);
  const [tempPinlessLimit, setTempPinlessLimit] = useState<number>(child?.pinLessLimit || 8000);

  // Sync state if child switches
  const handleChildSelect = (cardId: string) => {
    setSelectedChildId(cardId);
    const selectedChild = students.find(s => s.cardId === cardId);
    if (selectedChild) {
      setTempDailyLimit(selectedChild.dailyLimit);
      setTempPinlessLimit(selectedChild.pinLessLimit);
    }
  };

  // Mobile Money Deposit states
  const [mobileCarrier, setMobileCarrier] = useState<'mtn' | 'airtel'>('mtn');
  const [momoPhone, setMomoPhone] = useState<string>(currentParent.phone);
  const [momoAmount, setMomoAmount] = useState<string>('25000');
  const [momoStage, setMomoStage] = useState<'idle' | 'ussd_pin_prompt' | 'processing' | 'success' | 'error'>('idle');
  const [momoPin, setMomoPin] = useState<string>('');
  const [depositError, setDepositError] = useState<string>('');

  // Active top-up notification toasts
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Filter local transactions for *this* parent's kids
  const parentTransactions = transactions.filter(tx => currentParent.childrenIds.includes(tx.studentCardId));

  const handleApplyLimits = () => {
    if (!child) return;
    if (tempDailyLimit < 2000) {
      alert("Minimum daily limit permitted is 2,000 UGX");
      return;
    }
    if (tempPinlessLimit > tempDailyLimit) {
      alert("NFC PIN-less bypass limit cannot exceed the daily spending cap.");
      return;
    }
    onUpdateAllowanceSettings(child.cardId, tempDailyLimit, tempPinlessLimit);
    setNotificationMsg(`Saved: Daily allowances and limits updated for ${child.name}.`);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const startMomoTopUp = () => {
    const numAmt = parseInt(momoAmount, 10);
    if (isNaN(numAmt) || numAmt < 1000) {
      setDepositError("Minimum Mobile Money top-up is 1,000 UGX.");
      return;
    }
    if (numAmt > 350000) {
      setDepositError("Maximum Mobile Money transfer is 350,000 UGX.");
      return;
    }
    setDepositError('');
    setMomoPin('');
    setMomoStage('ussd_pin_prompt');
  };

  const handleSimulateMoMoSuccess = () => {
    if (momoPin.length < 4) {
      setDepositError('For secure authorization, enter your 5-digit Mobile Money PIN.');
      return;
    }
    setMomoStage('processing');
    setDepositError('');

    setTimeout(() => {
      if (child) {
        onTopUpWallet(child.cardId, parseInt(momoAmount, 10));
        setMomoStage('success');
        setNotificationMsg(`MoMo Push: Paid ${parseInt(momoAmount, 10).toLocaleString()} UGX via ${mobileCarrier.toUpperCase()}.`);
        setTimeout(() => setNotificationMsg(null), 4000);
      }
    }, 2200);
  };

  const triggerResetMomoForm = () => {
    setMomoStage('idle');
    setMomoPin('');
  };

  return (
    <div className="space-y-8 pb-12 font-sans">
      
      {/* Dynamic Slide notifications */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 bg-slate-900 text-white px-5 py-4 rounded-xl shadow-2xl border border-amber-500/20 flex items-center gap-3 max-w-sm"
          >
            <div className="h-8 w-8 rounded-full bg-[#fcf2ed] flex items-center justify-center text-[#d4805e]">
              <Bell className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-xs text-slate-400 font-mono">Mobile Notification</p>
              <p className="text-sm font-medium text-slate-100">{notificationMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile selector bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-orange-50 text-[#d4805e] font-semibold uppercase tracking-wider">
              Secure Parent Portal
            </span>
          </div>
          <h1 className="text-3xl font-display font-semibold text-slate-900">
            Pocket Wallet Manager
          </h1>
          <p className="text-slate-500 text-sm mt-0.51">
            Oversee allowance limits, schedule pockets, top up child keycards, and audit school expenditure timelines.
          </p>
        </div>

        <div className="flex items-center gap-3.5">
          <div className="bg-slate-50 border border-slate-200/50 px-3.5 py-1.5 rounded-lg text-xs flex items-center gap-2">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500 font-medium font-mono">Current Parent:</span>
            <select 
              value={selectedParentIdx} 
              onChange={(e) => {
                const idx = parseInt(e.target.value);
                setSelectedParentIdx(idx);
                // Auto switch selected child ID if parent changes
                const newParent = parents[idx];
                const firstKidForNewParent = students.find(s => newParent.childrenIds.includes(s.cardId));
                if (firstKidForNewParent) {
                  handleChildSelect(firstKidForNewParent.cardId);
                }
              }}
              className="bg-transparent text-slate-800 font-bold focus:outline-hidden cursor-pointer"
            >
              {parents.map((p, idx) => (
                <option key={idx} value={idx}>{p.name}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={onNavigateHome}
            className="px-4 py-2 border border-slate-200 text-slate-600 hover:text-slate-950 text-sm font-medium rounded-lg hover:bg-slate-50 transition-all cursor-pointer"
          >
            ← Exit Portal
          </button>
        </div>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* CARDS LIST & DYNAMIC SETTINGS GOVERNOR */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Children Quick Carousel */}
          <div className="space-y-3">
            <h3 className="font-display font-medium text-slate-900 text-sm uppercase tracking-wider">Linked Children Cards</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {parentChildren.map((kid) => {
                const isSelected = kid.cardId === child?.cardId;
                return (
                  <button
                    key={kid.cardId}
                    onClick={() => handleChildSelect(kid.cardId)}
                    className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between h-44 cursor-pointer select-none glow-hover ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg' 
                        : 'bg-white border-slate-100 text-slate-800 hover:border-slate-200'
                    }`}
                  >
                    {/* Simulated NFC Antenna wave lines */}
                    <div className="absolute right-4 top-4 text-slate-400 opacity-25">
                      <Wifi className="h-10 w-10 rotate-90" />
                    </div>

                    <div className="flex justify-between items-start w-full relative z-10">
                      <div>
                        <span className={`text-[9px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-full ${
                          isSelected ? 'bg-amber-500/20 text-[#e8956f]' : 'bg-slate-50 text-slate-600'
                        }`}>
                          {kid.classroom}
                        </span>
                        <h4 className="text-lg font-display font-semibold mt-1.5">{kid.name}</h4>
                        <p className={`text-[10px] font-mono mt-0.5 ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>ID: {kid.cardId}</p>
                      </div>

                      <div className="h-9 w-9 rounded-full bg-[#fcf2ed] flex items-center justify-center font-bold text-[#d4805e]">
                        {kid.name.charAt(0)}
                      </div>
                    </div>

                    <div className="relative z-10">
                      <span className={`text-[9px] uppercase tracking-wider block font-semibold ${isSelected ? 'text-slate-400' : 'text-slate-400'}`}>
                        Allowance Card Balance
                      </span>
                      <div className="flex items-baseline gap-1.5 mt-0.5">
                        <span className="text-xl font-bold font-mono">{kid.currentBalance.toLocaleString()}</span>
                        <span className="text-xs font-semibold text-slate-300">UGX</span>
                      </div>
                    </div>

                    {/* Active/Suspended Tag */}
                    <div className={`absolute top-4 right-4 text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      kid.cardStatus === 'active' 
                        ? 'bg-emerald-500/10 text-emerald-400' 
                        : 'bg-red-500/10 text-red-400 font-semibold'
                    }`}>
                      {kid.cardStatus === 'active' ? '● ACTIVE' : '⚠ BLOCKED'}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* DYNAMIC SETTINGS GOVERNOR PANEL */}
          {child && (
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2 text-slate-900 font-display font-medium text-lg">
                  <Sliders className="h-5 w-5 text-[#d4805e]" /> Spend Limit Governor
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Set daily micro-spending boundaries and limits. Transactions exceeding this will be blocked instantly.
                </p>
              </div>

              <div className="space-y-6">
                
                {/* Daily Spending Cap Limit Slider */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-semibold text-slate-700">Daily Spending cap</span>
                    <span className="font-mono font-bold text-slate-900 text-base">{tempDailyLimit.toLocaleString()} UGX</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="2000" 
                    max="50000" 
                    step="1000"
                    value={tempDailyLimit} 
                    onChange={(e) => setTempDailyLimit(parseInt(e.target.value))}
                    className="w-full accent-[#d4805e] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono font-semibold">
                    <span>2,000 UGX</span>
                    <span>25,000 UGX</span>
                    <span>50,000 UGX</span>
                  </div>
                </div>

                {/* PIN-less transaction ceiling */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="font-semibold text-slate-700 block">PIN-less Security bypass limit</span>
                      <span className="text-[11px] text-slate-400 font-normal">Transactions under this require no Parent PIN at checkouts.</span>
                    </div>
                    <span className="font-mono font-bold text-slate-900 text-base">{tempPinlessLimit.toLocaleString()} UGX</span>
                  </div>
                  
                  <input 
                    type="range" 
                    min="1000" 
                    max="20000" 
                    step="500"
                    value={tempPinlessLimit} 
                    onChange={(e) => setTempPinlessLimit(parseInt(e.target.value))}
                    className="w-full accent-[#d4805e] h-1.5 bg-slate-100 rounded-lg appearance-none cursor-ew-resize"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono font-semibold">
                    <span>1,000 UGX</span>
                    <span>10,000 UGX</span>
                    <span>20,000 UGX</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-50 gap-4">
                  <div className="flex items-center gap-2 bg-amber-50 p-2.5 rounded-xl text-amber-800 text-[11px]">
                    <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600" />
                    <span>Always ensure your kids know their unique 4-digit PIN (<b>{child.pinCode}</b>) for high-value buys.</span>
                  </div>

                  <button
                    onClick={handleApplyLimits}
                    className="px-5 py-2.5 bg-[#d4805e] hover:bg-[#b86948] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shrink-0"
                  >
                    Apply Allowance Policy
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* Child spending history timelines audit */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="font-display font-medium text-slate-900 text-lg">Purchase Log Feed</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time alerts of transactions on school campuses matching child accounts.</p>
            </div>

            <div className="space-y-3.5 max-h-[220px] overflow-y-auto pr-1">
              {parentTransactions.length > 0 ? (
                parentTransactions.map((tx) => (
                  <div key={tx.id} className="flex justify-between items-center text-xs p-3 hover:bg-slate-50 border border-slate-50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#fcf2ed] flex items-center justify-center text-[#d4805e] shrink-0 font-medium">
                        {tx.category === 'canteen' && <Utensils className="h-4 w-4" />}
                        {tx.category === 'uniform' && <Shirt className="h-4 w-4" />}
                        {tx.category === 'library' && <BookOpen className="h-4 w-4" />}
                        {!(['canteen', 'uniform', 'library'].includes(tx.category)) && <Coins className="h-4 w-4" />}
                      </div>

                      <div>
                        <div className="font-semibold text-slate-800">{tx.categoryLabel}</div>
                        <p className="text-[10px] text-slate-400 mt-0.5">{tx.studentName} bought at {tx.merchantName}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-mono text-slate-900 font-bold block">{tx.amount.toLocaleString()} UGX</span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-100">
                  No active cashless logs captured for your children this week.
                </div>
              )}
            </div>
          </div>

        </div>


        {/* UGANDA MOBILE MONEY DEPOSIT TERMINALS SIDEBAR */}
        <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-display font-medium text-slate-900 text-lg">Top Up Allowance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Direct checkout via MTN MoMo or Airtel Money Ugandan Mobile Pay rails.</p>
          </div>

          <AnimatePresence mode="wait">
            {momoStage === 'idle' && (
              <motion.div 
                key="top_up_form_stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4 text-xs text-left text-slate-700"
              >
                {/* Select Carrier */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Select Carrier</span>
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* MTN Selector */}
                    <button
                      onClick={() => setMobileCarrier('mtn')}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        mobileCarrier === 'mtn' 
                          ? 'border-[#fcb813] bg-[#fcb813]/5 text-amber-900' 
                          : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span className="text-[11px] font-bold font-mono tracking-wider">MTN MoMo</span>
                      <span className="text-[9px] font-medium opacity-70">Push Service</span>
                    </button>

                    {/* Airtel Selector */}
                    <button
                      onClick={() => setMobileCarrier('airtel')}
                      className={`p-3 rounded-lg border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        mobileCarrier === 'airtel' 
                          ? 'border-[#ff0000] bg-[#ff0000]/5 text-red-900' 
                          : 'border-slate-100 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <span className="text-[11px] font-bold font-mono tracking-wider">AIRTEL MONEY</span>
                      <span className="text-[9px] font-medium opacity-70">Airtel Pay</span>
                    </button>
                  </div>
                </div>

                {/* Mobile Money Phone Input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Mobile Money Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
                    <input 
                      type="text" 
                      placeholder="+256 7xx xxxxxx"
                      value={momoPhone}
                      onChange={(e) => setMomoPhone(e.target.value)}
                      className="w-full bg-slate-50 text-slate-900 pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden font-mono font-semibold"
                    />
                  </div>
                </div>

                {/* Amount to Top Up */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Top Up Amount (UGX)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Amount in Ugandan Shillings"
                      value={momoAmount}
                      onChange={(e) => {
                        setMomoAmount(e.target.value);
                        setDepositError('');
                      }}
                      className="w-full bg-slate-50 text-slate-900 font-mono font-bold pl-4 pr-14 py-2.5 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-[#d4805e]"
                    />
                    <span className="absolute right-3.5 top-2.5 text-xs font-mono font-semibold text-slate-400">UGX</span>
                  </div>
                  {depositError && (
                    <span className="text-[10px] text-red-500 font-semibold flex items-center gap-1 mt-1">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {depositError}
                    </span>
                  )}
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Presets</span>
                  <div className="grid grid-cols-3 gap-2">
                    {['15000', '25000', '50000'].map((preset) => (
                      <button
                        key={preset}
                        onClick={() => {
                          setMomoAmount(preset);
                          setDepositError('');
                        }}
                        className={`py-1.5 text-xs px-2 border rounded-md font-mono font-semibold text-center transition-colors cursor-pointer ${
                          momoAmount === preset 
                            ? 'bg-[#d4805e] border-[#d4805e] text-white animate-pulse' 
                            : 'bg-slate-50 border-slate-150 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {parseInt(preset).toLocaleString()} UGX
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={startMomoTopUp}
                  className={`w-full py-3.5 rounded-xl font-bold tracking-wider text-sm transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                    mobileCarrier === 'mtn' 
                      ? 'bg-[#fcb813] hover:bg-[#e4a40d] text-amber-950 font-bold' 
                      : 'bg-[#ff0000] hover:bg-[#dd0000] text-white font-bold'
                  }`}
                >
                  Initiate MoMo Top-Up <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            {/* USSD OVER COUNTER DIALOG POPUP */}
            {momoStage === 'ussd_pin_prompt' && (
              <motion.div 
                key="ussd_stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="bg-slate-950 text-slate-100 p-5 rounded-2xl border border-slate-800 space-y-4 text-xs font-mono relative overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1" style={{ backgroundColor: mobileCarrier === 'mtn' ? '#fcb813' : '#ff0000' }} />
                
                <div className="text-center">
                  <Smartphone className="h-6 w-6 text-slate-400 mx-auto" />
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Simulated USSD Push Request</p>
                  <p className="text-slate-200 mt-1">Authorise cashless collection of <b>{parseInt(momoAmount).toLocaleString()} UGX</b> from your SIM card.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-slate-400 uppercase tracking-wider block font-semibold">Enter 5-digit USSD MoMo PIN</label>
                  <input 
                    type="password" 
                    maxLength={5}
                    placeholder="•••••"
                    value={momoPin}
                    onChange={(e) => {
                      setMomoPin(e.target.value);
                      setDepositError('');
                    }}
                    className="w-full bg-slate-900 border border-slate-800 text-center font-bold tracking-[1em] text-lg py-2.5 rounded-lg text-white focus:outline-hidden"
                  />
                  {depositError && (
                    <span className="text-[9px] text-red-500 font-semibold block text-center">{depositError}</span>
                  )}
                </div>

                {/* Custom numeric pin code assist */}
                <div className="grid grid-cols-3 gap-1 px-4 py-1 bg-slate-900 rounded-lg">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
                    <button
                      key={n}
                      onClick={() => {
                        if (momoPin.length < 5) {
                          setMomoPin(momoPin + n);
                          setDepositError('');
                        }
                      }}
                      className="py-1.5 font-bold font-mono bg-slate-950 hover:bg-slate-800 rounded border border-slate-800/60 text-slate-300 text-xs cursor-pointer"
                    >
                      {n}
                    </button>
                  ))}
                  <button
                    onClick={() => { setMomoPin(''); setDepositError(''); }}
                    className="py-1.5 text-[9px] font-semibold bg-red-950/25 border border-red-900 rounded text-red-400 cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => {
                      if (momoPin.length < 5) {
                        setMomoPin(momoPin + '0');
                        setDepositError('');
                      }
                    }}
                    className="py-1.5 font-bold font-mono bg-slate-950 hover:bg-slate-800 rounded border border-slate-800/60 text-slate-300 text-xs cursor-pointer"
                  >
                    0
                  </button>
                  <button
                    onClick={handleSimulateMoMoSuccess}
                    className="py-1.5 text-[9px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded cursor-pointer"
                  >
                    OK
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setMomoStage('idle')}
                    className="flex-1 py-2 text-[10px] text-center border border-slate-800 text-slate-400 font-semibold rounded hover:bg-slate-900 cursor-pointer"
                  >
                    Cancel Push
                  </button>
                </div>
              </motion.div>
            )}

            {/* PROCESSING SECURE HANDSHAKES */}
            {momoStage === 'processing' && (
              <motion.div 
                key="processing_stage"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-6 text-center space-y-4"
              >
                {/* Spinner */}
                <div className="relative h-12 w-12 mx-auto">
                  <div className="absolute inset-0 rounded-full border-4 border-slate-100" />
                  <div className="absolute inset-0 rounded-full border-4 border-slate-900 border-t-transparent animate-spin" />
                </div>
                <h4 className="font-semibold text-slate-700 text-sm">Authorising Mobile Pay...</h4>
                <p className="text-xs text-slate-400 leading-normal px-4">Establishing secure USSD handshake with {mobileCarrier.toUpperCase()} Cashless Gateways.</p>
              </motion.div>
            )}

            {/* SUCCESS TRANSACTION APPROVED */}
            {momoStage === 'success' && (
              <motion.div 
                key="success_stage"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="text-center p-6 space-y-4 border border-emerald-100 rounded-2xl bg-emerald-50/10"
              >
                <div className="h-10 w-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto animate-bounce">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-slate-900 text-base">Top-Up Successful!</h4>
                <p className="text-xs text-slate-600 leading-snug px-2 leading-relaxed">
                  Funds have been loaded directly into <b>{child?.name}</b>'s NFC Cashless card balances in real-time.
                </p>

                <button
                  onClick={triggerResetMomoForm}
                  className="w-full py-2.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
                >
                  Done
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}