import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  GraduationCap, 
  TrendingUp, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Smartphone, 
  Users, 
  Coins, 
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { Student } from '../lib/types';

interface LandingHeroProps {
  students: Student[];
  onSelectRole: (role: 'admin' | 'vendor' | 'parent') => void;
}

export default function LandingHero({ students, onSelectRole }: LandingHeroProps) {
  const [activeTab, setActiveTab] = useState<'admin' | 'vendor' | 'parent'>('admin');

  // Hardcode generated image filename as per actual generator output to ensure loading
  const heroImageSrc = "/src/assets/images/skooldime_hero_illustration_1782142916377.jpg";

  const tabsInfo = {
    admin: {
      title: "School Bursar Portal",
      metric: "84,320,000 UGX Collections",
      accent: "Tuition Fees",
      desc: "Supervise school revenues, activate student smart cards, credit student allowances, and monitor live transaction audits.",
      actionLabel: "Launch Bursar Admin Dashboard",
      badge: "Accounts Supervisor",
      email: "admin@skooldime.com",
      credentialsCheat: "Cash counter control"
    },
    vendor: {
      title: "Canteen & Shop Merchant POS",
      metric: "PIN-less approvals < 12K UGX",
      accent: "Merchants",
      desc: "Simulate cash-register actions on physical handheld terminals. Enter amounts, scan child cards (NFC), and review printed invoices.",
      actionLabel: "Launch Cashier POS Register",
      badge: "Express Merchant POS",
      email: "vendor_canteen@skooldime.com",
      credentialsCheat: "NFC smart chip tap"
    },
    parent: {
      title: "Parent Wallet App",
      metric: "MTN & Airtel Local Pushes",
      accent: "Guardians",
      desc: "Top up children's pocket money instantly using Mobile Money rails, enforce daily spending ceilings, and view itemized shop timelines.",
      actionLabel: "Launch Parent Guardian Portal",
      badge: "Mobile Wallet Hub",
      email: "father_mugisha@gmail.com",
      credentialsCheat: "Allowance limits gov"
    }
  };

  const activeTabContent = tabsInfo[activeTab];

  return (
    <div className="space-y-16 py-6 font-sans">
      
      {/* Hero Header Jumbotron */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        
        {/* Left Side: Copywriting */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fcf2ed] border border-[#fceeec] text-[#d4805e] font-sans text-xs font-semibold uppercase tracking-wider animate-float">
            <Sparkles className="h-4 w-4" /> Seamless School Micro-Fintech
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-display font-bold text-slate-900 tracking-tight leading-[1.08]">
            School finance made <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#d4805e] to-[#e8956f]">
              completely cashless
            </span>
          </h1>

          <p className="text-slate-500 text-sm sm:text-base leading-relaxed max-w-lg">
            Skooldime facilitates frictionless micro-payouts for African schools. Link smart NFC wristbands, govern kids allowances with daily spending caps, and audit canteen logs in real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            <a 
              href="#sandbox_demo" 
              className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider text-center shadow-md transition-transform active:scale-[0.98] cursor-pointer"
            >
              Enter Cashless Sandbox ↓
            </a>
            <a 
              href="#how_it_works" 
              className="px-6 py-3.5 border border-slate-200 text-slate-700 hover:text-slate-950 font-sans hover:bg-slate-50 rounded-xl text-xs font-semibold text-center transition-all cursor-pointer"
            >
              How it Works
            </a>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-400 font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Bank-grade Ledger
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Offline Capable
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" /> MTN / Airtel MoMo
            </div>
          </div>
        </div>

        {/* Right Side: Generated Premium Fintech Illustration */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="relative p-3 bg-white border border-slate-150 rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden group">
            <img 
              src={heroImageSrc} 
              alt="SkoolDime Premium fintech illustration featuring school payment terminals, NFC cards and mobile balance tracking app screens" 
              className="w-full h-auto rounded-[2rem] shadow-xs object-cover transform duration-500 hover:scale-[1.01]"
              referrerPolicy="no-referrer"
            />
            {/* Soft decorative badge */}
            <div className="absolute bottom-6 right-6 bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-mono px-3 py-1.5 rounded-full uppercase tracking-wider font-semibold border border-slate-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" /> Live Terminal Sandbox Active
            </div>
          </div>
        </div>

      </section>


      {/* LANDING SECTION: INTERACTIVE DEMO ACCELERATORS SANDBOX */}
      <section id="sandbox_demo" className="py-8 space-y-8 scroll-mt-20">
        
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-mono font-bold text-[#d4805e] uppercase tracking-wider bg-[#fcf2ed] px-3 py-1 rounded-full">
            Simulation Playground
          </span>
          <h2 className="text-3xl font-display font-semibold text-slate-900">
            Select a Demo Workspace
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Experience both sides of SkoolDime's cashless finance ecosystem. Authenticate with pre-populated credentials instantly inside the sandbox.
          </p>
        </div>

        {/* TAB CONTROLLERS */}
        <div className="flex justify-center max-w-md mx-auto bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
          {(['admin', 'vendor', 'parent'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg capitalize transition-all cursor-pointer ${
                activeTab === tab 
                  ? 'bg-white text-slate-900 shadow-md border-transparent font-bold' 
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab === 'admin' ? 'Bursar Admin' : tab === 'vendor' ? 'Cashier POS' : 'Parent Port'}
            </button>
          ))}
        </div>

        {/* TAB PLAYGROUND CARD */}
        <div className="max-w-4xl mx-auto bg-white border border-slate-200/60 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          
          {/* Subtle colored shadow blur */}
          <div className="absolute top-0 right-0 h-44 w-44 bg-gradient-to-br from-[#e8956f]/10 to-transparent blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            
            {/* Left side Tab Info */}
            <div className="text-left space-y-4">
              <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#fcf2ed] text-[#d4805e] font-bold uppercase tracking-wider">
                {activeTabContent.badge}
              </span>
              
              <h3 className="text-2xl font-display font-semibold text-slate-900 leading-tight">
                {activeTabContent.title}
              </h3>
              
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">
                {activeTabContent.desc}
              </p>

              {/* Fake Auth Details card */}
              <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1 text-xs font-mono">
                <div className="flex justify-between items-center text-slate-400">
                  <span>Demo Identity:</span>
                  <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 px-1 rounded uppercase">{activeTabContent.credentialsCheat}</span>
                </div>
                <div className="text-slate-800 font-semibold truncate mt-1">
                  Email: <span className="text-[#d4805e]">{activeTabContent.email}</span>
                </div>
                <div className="text-slate-600">
                  Password: <span className="text-slate-800 font-bold">••••••••</span>
                </div>
              </div>

              <button
                onClick={() => onSelectRole(activeTab)}
                className="w-full sm:w-auto px-6 py-3 bg-slate-950 hover:bg-slate-900 text-white rounded-xl text-xs font-bold uppercase font-sans tracking-wider flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
              >
                {activeTabContent.actionLabel} <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Right side interactive card showcase */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/50 flex flex-col justify-between min-h-[220px] text-left">
              <div>
                <span className="text-[9px] font-mono uppercase text-[#d4805e] font-bold tracking-wider block">Real-time telemetry</span>
                <div className="text-3xl font-display font-bold text-slate-900 mt-2 font-mono leading-none">
                  {activeTabContent.metric}
                </div>
                <span className="text-xs text-slate-400 mt-1 block">Live Demo Environment metric</span>
              </div>

              {/* Showcase list based on tab */}
              <div className="border-t border-slate-200/80 pt-4 mt-6 space-y-2">
                <span className="text-[8px] font-mono font-bold text-slate-400 uppercase tracking-widest block font-bold">NFC Smart-Card Cheat sheet</span>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  {students.slice(0, 4).map(s => (
                    <div key={s.cardId} className="flex items-center gap-1.5 truncate">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="truncate">{s.name} ({s.classroom.split(' ')[0]})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>


      {/* HOW IT WORKS SECTION */}
      <section id="how_it_works" className="py-8 border-t border-slate-100 scroll-mt-20">
        
        <div className="text-center max-w-lg mx-auto space-y-2 mb-12">
          <h2 className="text-2xl font-display font-semibold text-slate-900">
            How Cashless Campus Works
          </h2>
          <p className="text-slate-500 text-xs sm:text-sm">
            Three simple layers that completely remove paper cash, credit cards, and expensive smartphones from student hands.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          
          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#fcf2ed] flex items-center justify-center text-[#d4805e] font-mono font-bold">
              1
            </div>
            <h4 className="text-base font-display font-semibold text-slate-900">
              Parents Wallet allowance Setup
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Parents load allowance funds using standard Mobile Money (MTN or Airtel Money). They define spending caps (such as 10,000 UGX daily Limit) inside our secure portal.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#fcf2ed] flex items-center justify-center text-[#d4805e] font-mono font-bold">
              2
            </div>
            <h4 className="text-base font-display font-semibold text-slate-900">
              NFC Cashless Chip Tapping
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              At the school canteen or supply stores, students tap their contactless NFC RFID smart card. Under-limit payments are approved instantly with no PIN-entry.
            </p>
          </div>

          <div className="space-y-3">
            <div className="h-10 w-10 rounded-xl bg-[#fcf2ed] flex items-center justify-center text-[#d4805e] font-mono font-bold">
              3
            </div>
            <h4 className="text-base font-display font-semibold text-slate-900">
              Direct Bursar & Parent timeline Auditing
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Bursars monitor combined revenue dashboards to track cashless volumes, audit fees, and issue over-the-counter card top-ups instantly. Parents receive sms notifications on spends.
            </p>
          </div>

        </div>

      </section>

    </div>
  );
}
