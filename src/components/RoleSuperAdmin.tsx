import React, { useEffect, useState } from 'react';
import { Shield, Users, Landmark, FileText, ToggleLeft, ToggleRight, DollarSign, RefreshCw, UserPlus, Globe, CheckCircle, AlertCircle } from 'lucide-react';
import { School, Vendor, AuditLog, Transaction } from '../types';

export default function RoleSuperAdmin() {
  const [schools, setSchools] = useState<School[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loansEnabled, setLoansEnabled] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0.5);
  const [loading, setLoading] = useState(false);
  const [activeSuperTab, setActiveSuperTab] = useState<'NETWORKS' | 'AUDIT_LOGS'>('NETWORKS');

  // Business Admin Creation state
  const [businessAdmins, setBusinessAdmins] = useState<any[]>([]);
  const [baName, setBaName] = useState('');
  const [baUsername, setBaUsername] = useState('');
  const [baPhone, setBaPhone] = useState('');
  const [baRegion, setBaRegion] = useState('Central');
  const [creationSuccess, setCreationSuccess] = useState('');
  const [creationError, setCreationError] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const schRes = await fetch('/api/schools');
      const schData = await schRes.json();
      setSchools(schData);

      const vendRes = await fetch('/api/vendors');
      const vendData = await vendRes.json();
      setVendors(vendData);

      const logRes = await fetch('/api/audit-logs');
      const logData = await logRes.json();
      setLogs(logData);

      const settingsRes = await fetch('/api/system/settings');
      const settingsData = await settingsRes.json();
      setLoansEnabled(settingsData.loansEnabled);
      setCommissionRate(settingsData.commissionRate);

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setBusinessAdmins((usersData || []).filter((u: any) => u.role === 'BUSINESS_ADMIN'));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveSettings = async (enabled: boolean, rate: number) => {
    try {
      await fetch('/api/system/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loansEnabled: enabled, commissionRate: rate })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleLoans = () => {
    const nextVal = !loansEnabled;
    setLoansEnabled(nextVal);
    saveSettings(nextVal, commissionRate);
    console.log(`[Super Admin] Global Loan Matrix toggled to: ${nextVal}`);
  };

  const handleUpdateCommission = (rate: number) => {
    setCommissionRate(rate);
  };

  const handleSaveCommissionRate = async () => {
    await saveSettings(loansEnabled, commissionRate);
    setCreationSuccess('Platform commission rate updated and saved successfully.');
    setTimeout(() => setCreationSuccess(''), 3000);
    fetchData();
  };

  const handleCreateBusinessAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baName || !baUsername || !baPhone) {
      setCreationError('All fields are required to register a Business Admin.');
      return;
    }
    setCreationError('');
    setCreationSuccess('');

    try {
      const res = await fetch('/api/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: baName,
          username: baUsername,
          phone: baPhone,
          role: 'BUSINESS_ADMIN',
          region: baRegion
        })
      });
      const data = await res.json();
      if (data.success) {
        setCreationSuccess(`Business Admin "${baName}" created successfully!`);
        setBaName('');
        setBaUsername('');
        setBaPhone('');
        fetchData();
      } else {
        setCreationError(data.error || 'Failed to create Business Admin.');
      }
    } catch (e: any) {
      setCreationError(e.message || 'Error occurred.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200">
      
      {/* Overview stats bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/2">
          <div>
            <span className="text-[10px] font-mono text-[#c7515e] uppercase font-bold tracking-widest">Platform Escrow</span>
            <h4 className="text-xl font-bold text-white mt-1">103,200 <span className="text-sm text-gray-500 font-mono">UGX</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/2">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Active Schools</span>
            <h4 className="text-xl font-bold text-white mt-1">{schools.length} <span className="text-sm text-gray-500 font-normal">Institutions</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] shadow-inner">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/2">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Merchants</span>
            <h4 className="text-xl font-bold text-white mt-1">{vendors.length} <span className="text-sm text-gray-500 font-normal">POS Outlets</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] shadow-inner">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/2">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Global Micro-Loans</span>
            <h4 className="text-xl font-bold text-white mt-1">{loansEnabled ? 'Enabled' : 'Disabled'}</h4>
          </div>
          <button 
            onClick={handleToggleLoans} 
            className="hover:scale-105 transition-transform active:scale-95 outline-none"
          >
            {loansEnabled ? (
              <ToggleRight className="h-10 w-10 text-[#c7515e] drop-shadow-[0_0_8px_rgba(199,81,94,0.4)]" />
            ) : (
              <ToggleLeft className="h-10 w-10 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveSuperTab('NETWORKS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeSuperTab === 'NETWORKS'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Landmark className="h-4 w-4" />
          <span>Networks & Rates</span>
        </button>
        <button
          onClick={() => setActiveSuperTab('AUDIT_LOGS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeSuperTab === 'AUDIT_LOGS'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>Audit Trails</span>
        </button>
      </div>

      {activeSuperTab === 'NETWORKS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Educational Networks and Parameters */}
          <div className="lg:col-span-7 space-y-6">
            {/* Schools & Commission configuration */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                    <Landmark className="h-5 w-5 text-[#c7515e]" />
                  </div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Registered Educational Networks</h3>
                </div>
                <button 
                  onClick={fetchData} 
                  className="text-gray-400 hover:text-[#c7515e] p-1.5 rounded-lg hover:bg-[#c7515e]/10 transition-colors"
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto max-h-62.5 scrollbar-thin">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-3 font-bold">School Name</th>
                      <th className="pb-3 font-bold">Region</th>
                      <th className="pb-3 font-bold">Code</th>
                      <th className="pb-3 font-bold text-right pr-4">Split Fee %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {schools.map((school) => (
                      <tr key={school.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-3 font-bold text-white">{school.name}</td>
                        <td className="py-3 text-xs">{school.region}</td>
                        <td className="py-3 font-mono text-gray-400 text-xs">{school.code}</td>
                        <td className="py-3 font-mono text-[#c7515e] text-xs font-bold text-right pr-4">{school.commissionRate}%</td>
                      </tr>
                    ))}
                    {schools.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm font-medium text-gray-500">
                          No registered networks found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Platform Controls */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5">
                <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                  <Shield className="h-5 w-5 text-[#c7515e]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">System Parameter Controls</h3>
              </div>
              
              <div className="space-y-5 bg-[#06080E]/50 p-5 rounded-xl border border-white/5 shadow-inner">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-200">Platform Gateway Commission</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">Core transaction slice automatically processed on every POS checkout</p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 self-end">
                    <input
                      type="number"
                      value={commissionRate}
                      onChange={(e) => handleUpdateCommission(Number(e.target.value))}
                      className="w-20 rounded-lg border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-right text-white font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all shadow-inner"
                      step="0.1"
                    />
                    <span className="text-sm font-bold text-gray-500">%</span>
                    <button
                      onClick={handleSaveCommissionRate}
                      className="ml-2 rounded-lg bg-[#c7515e] hover:bg-[#a13f4a] px-4 py-2 text-xs font-bold text-white transition-transform active:scale-95 shadow shadow-[#c7515e]/15"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Manage Business Admins */}
          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                  <UserPlus className="h-5 w-5 text-[#c7515e]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">Provision Regional Business Admin</h3>
              </div>

              {creationSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{creationSuccess}</span>
                </div>
              )}

              {creationError && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{creationError}</span>
                </div>
              )}

              <form onSubmit={handleCreateBusinessAdmin} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Admin Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Nakimbugwe Stella"
                    value={baName}
                    onChange={(e) => setBaName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="stella_admin"
                      value={baUsername}
                      onChange={(e) => setBaUsername(e.target.value.replace(/\s+/g, ''))}
                      className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+256700000002"
                      value={baPhone}
                      onChange={(e) => setBaPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Territory Region (Franchise)</label>
                  <select
                    value={baRegion}
                    onChange={(e) => setBaRegion(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-gray-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition cursor-pointer appearance-none"
                  >
                    <option value="Central">Central Region (Kampala)</option>
                    <option value="Eastern">Eastern Region (Jinja)</option>
                    <option value="Western">Western Region (Mbarara)</option>
                    <option value="Northern">Northern Region (Gulu)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/15 flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Authorize Regional Franchise Admin</span>
                </button>
              </form>
            </div>

            {/* Registered Regional Admins Directory */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-3">
                <Globe className="h-4.5 w-4.5 text-[#c7515e]" />
                <h3 className="text-xs font-bold text-white tracking-wide">Registered Franchise Admins</h3>
              </div>

              <div className="space-y-2.5 max-h-55 overflow-y-auto scrollbar-thin">
                {businessAdmins.map((ba) => (
                  <div key={ba.id} className="p-3 rounded-xl bg-[#06080E]/80 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors shadow-inner">
                    <div>
                      <h4 className="font-bold text-white">{ba.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Username: {ba.username} <span className="opacity-40 mx-1">|</span> {ba.phone}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded uppercase tracking-wider">{ba.region}</span>
                  </div>
                ))}
                {businessAdmins.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-4">No regional franchise admins provisioned yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSuperTab === 'AUDIT_LOGS' && (
        /* Audit Trail Logging */
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl max-w-3xl flex flex-col h-125">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5 shrink-0">
            <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
              <FileText className="h-5 w-5 text-[#c7515e]" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">Immutable Audit Ledger</h3>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-xl bg-[#06080E]/80 border border-white/5 space-y-1.5 text-xs shadow-inner hover:border-white/10 transition-colors">
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                  <span className="bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                    {log.role}
                  </span>
                </div>
                <div className="text-gray-200 font-bold">{log.action.replace(/_/g, ' ')}</div>
                <div className="text-gray-500 text-[10px] font-mono mt-1">
                  User: {log.userName} <span className="opacity-40 mx-1">|</span> IP: {log.ipAddress}
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-sm font-medium text-gray-500">
                No log records captured yet.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}