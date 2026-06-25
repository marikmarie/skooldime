import React, { useState } from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import RoleSuperAdmin from './components/RoleSuperAdmin';
import RoleBusinessAdmin from './components/RoleBusinessAdmin';
import RoleAgent from './components/RoleAgent';
import RoleSchoolAdmin from './components/RoleSchoolAdmin';
import RoleVendorPOS from './components/RoleVendorPOS';
import RoleParent from './components/RoleParent';
import MicroLoans from './components/MicroLoans';
import { 
  Landmark, 
  Shield, 
  Users, 
  ShoppingCart, 
  Home, 
  RefreshCw, 
  Layers, 
  CheckCircle2, 
  AlertTriangle,
  Lock,
  User,
  LogOut,
  Sparkles,
  Info
} from 'lucide-react';

interface LoggedInUser {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'AGENT' | 'SCHOOL_ADMIN' | 'VENDOR' | 'PARENT';
  name: string;
  phone: string;
  schoolId?: string;
}

export default function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [userSubTab, setUserSubTab] = useState<'DASHBOARD' | 'LOANS'>('DASHBOARD');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  const [resetId, setResetId] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');

  const handleResetDb = async () => {
    setResetLoading(true);
    setGlobalSuccess('');
    setGlobalError('');
    try {
      const res = await fetch('/api/setup/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        console.log('[System] State databases successfully seeded to initial templates.');
        setResetId(prev => prev + 1);
        setGlobalSuccess('Database successfully reset.');
        setTimeout(() => setGlobalSuccess(''), 5000);
      } else {
        setGlobalError(data.error || 'Failed to reset database.');
      }
    } catch (e: any) {
      console.error(e);
      setGlobalError(e.message || 'Error occurred during database reset.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setAuthError('Please enter a username.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setUserSubTab('DASHBOARD');
      } else {
        setAuthError(data.error || 'Invalid username or password.');
      }
    } catch (e: any) {
      console.error(e);
      setAuthError('Authentication server offline. Ensure setup runs on port 3000.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setUsername('');
    setPassword('');
    setAuthError('');
  };

  const demoAccounts = [
    {
      role: 'SUPER_ADMIN',
      label: 'Super Admin',
      username: 'superadmin',
      name: 'Alinda Robert (HQ)',
      desc: 'Platform parameters, system-wide transaction ledger auditing and operational analytics.',
      icon: Shield,
      bg: 'bg-rose-50/70 border-rose-200/80 hover:bg-rose-50 text-slate-800 hover:border-rose-400/80 shadow-sm'
    },
    {
      role: 'BUSINESS_ADMIN',
      label: 'Business Admin',
      username: 'central_admin',
      name: 'Nakimbugwe Stella',
      desc: 'Verify parent NIN data, control school splits, and approve institutional commissions.',
      icon: Layers,
      bg: 'bg-amber-50/70 border-amber-200/80 hover:bg-amber-50 text-slate-800 hover:border-amber-400/80 shadow-sm'
    },
    {
      role: 'AGENT',
      label: 'Field Agent',
      username: 'agent_peter',
      name: 'Peter Ssekabira',
      desc: 'Register primary schools, setup physical terminals and bulk upload registered students.',
      icon: Users,
      bg: 'bg-emerald-50/70 border-emerald-200/80 hover:bg-emerald-50 text-slate-800 hover:border-emerald-400/80 shadow-sm'
    },
    {
      role: 'SCHOOL_ADMIN',
      label: 'School Admin',
      username: 'kps_bursar',
      name: 'Kato Charles (Bursar)',
      desc: 'Institutional analytics, verify parent challenge tokens, and reset child cards PINs.',
      icon: Landmark,
      bg: 'bg-blue-50/70 border-blue-200/80 hover:bg-blue-50 text-slate-800 hover:border-blue-400/80 shadow-sm'
    },
    {
      role: 'VENDOR',
      label: 'Vendor POS',
      username: 'kps_canteen',
      name: 'Mama Betty Canteen',
      desc: 'Accept child card scanned sales, process refunds, Z-reports, and withdraw ledger funds.',
      icon: ShoppingCart,
      bg: 'bg-indigo-50/70 border-indigo-200/80 hover:bg-indigo-50 text-slate-800 hover:border-indigo-400/80 shadow-sm'
    },
    {
      role: 'PARENT',
      label: 'Parent Portal',
      username: 'moses_parent',
      name: 'Moses Mukasa',
      desc: 'Top up wallet, allocate child pocket money allowance, manage daily limits, and apply for loans.',
      icon: Home,
      bg: 'bg-violet-50/70 border-violet-200/80 hover:bg-violet-50 text-slate-800 hover:border-violet-400/80 shadow-sm'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-brand/30 selection:text-white pb-12">
      {/* Background radial accent with requested brand theme color */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[350px] w-[600px] rounded-full bg-brand/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-6 space-y-8">
        
        {/* Header Section */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand shadow-lg shadow-brand/20 font-mono font-bold text-white text-lg">
              E
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">EduTechMoney</h1>
                {user && (
                  <span className="rounded-full bg-brand/10 px-2.5 py-0.5 text-[10px] font-semibold text-brand border border-brand/15 flex items-center gap-1 font-mono">
                    <span className="h-1 w-1 rounded-full bg-brand animate-pulse" />
                    Authorized
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 mt-0.5">Digital Pocket Money, Commission Splits & Micro-Loans for Ugandan Educational Networks</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {user && (
              <div className="flex items-center gap-3 bg-white rounded-xl border border-slate-200 p-2 pr-4 shadow-sm">
                <div className="h-8 w-8 rounded-lg bg-brand/10 flex items-center justify-center font-bold text-xs text-brand">
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-bold text-slate-800">{user.name}</div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{user.role.replace('_', ' ')}</div>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 rounded-lg p-1.5 text-slate-500 hover:text-brand hover:bg-brand/10 transition active:scale-95"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleResetDb}
              disabled={resetLoading}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-slate-950 text-slate-700 px-3.5 py-1.5 text-xs font-semibold transition active:scale-95 shadow font-mono"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${resetLoading ? 'animate-spin' : ''}`} />
              Reset State
            </button>
          </div>
        </header>

        {globalSuccess && (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3 text-xs text-emerald-300 animate-fadeIn">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span>{globalSuccess}</span>
          </div>
        )}

        {globalError && (
          <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-300 animate-fadeIn">
            <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{globalError}</span>
          </div>
        )}

        {/* Auth / Login Landing Page */}
        {!user ? (
          <div className="space-y-10 py-4 max-w-4xl mx-auto">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Secure User Authentication Portal</h2>
              <p className="text-sm text-gray-400 max-w-lg mx-auto">
                Sign in to view your specific ledger balances, transactions, and manage security options.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Login Form Card */}
              <div className="md:col-span-5 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl space-y-5">
                <div className="flex items-center gap-2 border-b border-white/5 pb-4">
                  <Lock className="h-4 w-4 text-brand" />
                  <span className="text-sm font-semibold text-gray-200">Sign In to Your Profile</span>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {authError && (
                    <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-300 flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                      <span>{authError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400">Username</label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="e.g., moses_parent"
                        className="w-full rounded-lg border border-white/5 bg-[#141C2F] pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-400">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Any password"
                        className="w-full rounded-lg border border-white/5 bg-[#141C2F] pl-9 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full rounded-lg bg-brand hover:bg-brand-hover text-white py-2.5 text-sm font-bold shadow transition active:scale-95 disabled:opacity-50"
                  >
                    {authLoading ? 'Signing in...' : 'Sign In'}
                  </button>
                </form>
              </div>

              {/* Sample Credentials Helper Directory */}
              <div className="md:col-span-7 space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono uppercase text-gray-500 tracking-wider">
                  <Sparkles className="h-4 w-4 text-brand" />
                  <span>Interactive Credentials Directory</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">
                  Click any profile card below to instantly load its simulated credentials into the login portal.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {demoAccounts.map((acc) => {
                    const Icon = acc.icon;
                    return (
                      <button
                        key={acc.role}
                        onClick={() => {
                          setUsername(acc.username);
                          setPassword('admin');
                          setAuthError('');
                        }}
                        className={`text-left rounded-xl border p-4 transition active:scale-[0.98] flex gap-3 group relative overflow-hidden ${acc.bg}`}
                      >
                        <div className="rounded-lg bg-brand/10 p-2 text-brand group-hover:scale-110 transition duration-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-900">{acc.label}</span>
                            <span className="text-[9px] font-mono text-brand/80 px-1.5 py-0.5 rounded bg-brand/10 uppercase tracking-wide">
                              Click
                            </span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded inline-block">
                            {acc.username}
                          </div>
                          <p className="text-[10px] text-slate-600 leading-normal pt-1">
                            {acc.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Logged In Dashboard Views */
          <div className="space-y-6">
            
            {/* Contextual Sub-tab switchers for Parent and Vendor roles to access Loans cleanly */}
            {(user.role === 'PARENT' || user.role === 'VENDOR') && (
              <div className="flex border-b border-slate-200 gap-1">
                <button
                  onClick={() => setUserSubTab('DASHBOARD')}
                  className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition duration-200 ${
                    userSubTab === 'DASHBOARD'
                      ? 'border-brand text-brand bg-brand/[0.04]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {user.role === 'PARENT' ? 'Parent Portal Dashboard' : 'Merchant POS Counter'}
                </button>
                <button
                  onClick={() => setUserSubTab('LOANS')}
                  className={`px-5 py-2.5 text-xs font-semibold border-b-2 transition duration-200 ${
                    userSubTab === 'LOANS'
                      ? 'border-brand text-brand bg-brand/[0.04]'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Apply for Micro-Loans
                </button>
              </div>
            )}

            {/* Dynamic Panel wrapper with error boundary safety */}
            <main className="rounded-2xl border border-white/5 bg-[#080B15] p-1.5 min-h-[400px]">
              <ErrorBoundary key={`${user.role}_${userSubTab}_${resetId}`}>
                <div className="p-4 md:p-6">
                  {user.role === 'SUPER_ADMIN' && <RoleSuperAdmin />}
                  {user.role === 'BUSINESS_ADMIN' && <RoleBusinessAdmin />}
                  {user.role === 'AGENT' && <RoleAgent />}
                  {user.role === 'SCHOOL_ADMIN' && <RoleSchoolAdmin />}
                  
                  {user.role === 'VENDOR' && (
                    userSubTab === 'DASHBOARD' 
                      ? <RoleVendorPOS userPhone={user.phone} /> 
                      : <MicroLoans defaultBorrowerId="V1" defaultBorrowerType="VENDOR" />
                  )}

                  {user.role === 'PARENT' && (
                    userSubTab === 'DASHBOARD' 
                      ? <RoleParent userPhone={user.phone} /> 
                      : <MicroLoans defaultBorrowerId="P1" defaultBorrowerType="PARENT" />
                  )}
                </div>
              </ErrorBoundary>
            </main>

            {/* Technical Highlights Footer */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/5 pt-6 text-[11px] text-gray-400 font-mono leading-relaxed">
              <div className="p-4 rounded-xl bg-[#0B0F19]/40 border border-white/5 space-y-1">
                <span className="font-bold text-gray-300 block uppercase text-[10px]">Collecto Gateway Protocol</span>
                <span>All mobile money stk-deposits and payouts initiate asynchronously. Auto-polling prevents blocking and resolves state idempotently.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0F19]/40 border border-white/5 space-y-1">
                <span className="font-bold text-gray-300 block uppercase text-[10px]">Atomic ledger Splits</span>
                <span>Commission allocations (Platform & Institutional School Shares) process instantly upon POS scans, ensuring zero balance drift.</span>
              </div>
              <div className="p-4 rounded-xl bg-[#0B0F19]/40 border border-white/5 space-y-1">
                <span className="font-bold text-gray-300 block uppercase text-[10px]">Credit Scoring Matrix</span>
                <span>Loans (Phase 1.5) analyze real-time 30-day POS checkout consistency before instant ledger disbursement.</span>
              </div>
            </section>
          </div>
        )}

      </div>
    </div>
  );
}
