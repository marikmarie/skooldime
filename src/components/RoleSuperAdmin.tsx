import React, { useEffect, useState } from 'react';
import { Shield, Users, Landmark, FileText, ToggleLeft, ToggleRight, DollarSign, RefreshCw } from 'lucide-react';
import { School, Vendor, AuditLog, Transaction } from '../types';

export default function RoleSuperAdmin() {
  const [schools, setSchools] = useState<School[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loansEnabled, setLoansEnabled] = useState(true);
  const [commissionRate, setCommissionRate] = useState(0.5);
  const [loading, setLoading] = useState(false);

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

      // Extract all transactions from the server state by looking at parent wallets and other balances
      // Or we can just mock aggregate indicators
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleLoans = () => {
    setLoansEnabled(!loansEnabled);
    console.log(`[Super Admin] Global Loan Matrix toggled to: ${!loansEnabled}`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200">
      
      {/* Overview stats bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/[0.02]">
          <div>
            <span className="text-[10px] font-mono text-[#c7515e] uppercase font-bold tracking-widest">Platform Escrow</span>
            <h4 className="text-xl font-bold text-white mt-1">103,200 <span className="text-sm text-gray-500 font-mono">UGX</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] shadow-inner">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/[0.02]">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Active Schools</span>
            <h4 className="text-xl font-bold text-white mt-1">{schools.length} <span className="text-sm text-gray-500 font-normal">Institutions</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] shadow-inner">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/[0.02]">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Merchants</span>
            <h4 className="text-xl font-bold text-white mt-1">{vendors.length} <span className="text-sm text-gray-500 font-normal">POS Outlets</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] shadow-inner">
            <Users className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between transition-all hover:bg-white/[0.02]">
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Schools & Commission configuration */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl">
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

            <div className="overflow-x-auto max-h-[300px] scrollbar-thin">
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
                    <tr key={school.id} className="hover:bg-white/[0.02] transition-colors">
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
          <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5">
              <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                <Shield className="h-5 w-5 text-[#c7515e]" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">System Parameter Controls</h3>
            </div>
            
            <div className="space-y-5 bg-[#06080E]/50 p-5 rounded-xl border border-white/5 shadow-inner">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-gray-200">Platform Gateway Commission</h4>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Core transaction slice automatically processed on every POS checkout</p>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-20 rounded-lg border border-white/10 bg-[#0B0F19] px-3 py-2 text-sm text-right text-white font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all shadow-inner"
                    step="0.1"
                  />
                  <span className="text-sm font-bold text-gray-500">%</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Audit Trail Logging */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl h-[650px] flex flex-col">
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
        </div>

      </div>
    </div>
  );
}