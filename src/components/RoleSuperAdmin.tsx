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
    <div className="space-y-6">
      {/* Overview stats bento */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Platform Escrow Balance</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">103,200 UGX</h4>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Active Schools</span>
            <h4 className="text-xl font-bold text-white mt-1">{schools.length} Institutions</h4>
          </div>
          <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Registered Merchants</span>
            <h4 className="text-xl font-bold text-white mt-1">{vendors.length} POS Outlets</h4>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
            <Users className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Global Micro-Loans</span>
            <h4 className="text-xl font-bold text-white mt-1">{loansEnabled ? 'Enabled' : 'Disabled'}</h4>
          </div>
          <button onClick={handleToggleLoans} className="text-purple-400 hover:text-purple-300">
            {loansEnabled ? <ToggleRight className="h-8 w-8 text-emerald-400" /> : <ToggleLeft className="h-8 w-8 text-gray-500" />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Schools & Commission configuration */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h3 className="text-sm font-medium text-gray-200">Registered Educational Networks</h3>
              <button onClick={fetchData} className="text-gray-400 hover:text-white p-1">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-400 font-mono">
                    <th className="pb-2.5">School Name</th>
                    <th className="pb-2.5">Region</th>
                    <th className="pb-2.5">Code</th>
                    <th className="pb-2.5">Split Fee %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-gray-300">
                  {schools.map((school) => (
                    <tr key={school.id}>
                      <td className="py-3 font-semibold text-white">{school.name}</td>
                      <td className="py-3">{school.region}</td>
                      <td className="py-3 font-mono text-gray-400">{school.code}</td>
                      <td className="py-3 text-emerald-400">{school.commissionRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Platform Controls */}
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
            <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3 mb-4">System Parameter Controls</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-gray-300">Platform Gateway Commission</h4>
                  <p className="text-[11px] text-gray-500 mt-0.5">Core transaction slice automatically processed on every POS checkout</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-16 rounded border border-white/10 bg-[#06080E] px-2 py-1 text-xs text-right text-gray-200 font-mono"
                    step="0.1"
                  />
                  <span className="text-xs text-gray-400">%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Audit Trail Logging */}
        <div className="lg:col-span-5">
          <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg h-[460px] flex flex-col">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-4 shrink-0">
              <FileText className="h-4 w-4 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-200">Immutable Audit Ledger</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="p-3 rounded-lg bg-[#06080E]/60 border border-white/5 space-y-1 text-xs">
                  <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono">
                    <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                    <span className="bg-purple-950/40 text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold text-[9px]">
                      {log.role}
                    </span>
                  </div>
                  <div className="text-gray-300 font-semibold">{log.action.replace(/_/g, ' ')}</div>
                  <div className="text-gray-500 text-[10px] font-mono">User: {log.userName} (IP: {log.ipAddress})</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
