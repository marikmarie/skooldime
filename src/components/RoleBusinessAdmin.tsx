import React, { useEffect, useState } from 'react';
import { Landmark, Users, Sliders, RefreshCw, AlertTriangle, MapPin, UserPlus, Building, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { School, Vendor } from '../types';

export default function RoleBusinessAdmin() {
  const [schools, setSchools] = useState<School[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCommissionVendorId, setEditingCommissionVendorId] = useState<string | null>(null);
  const [customCommRate, setCustomCommRate] = useState<number>(1.0);
  const [activeBusinessTab, setActiveBusinessTab] = useState<'COMMISSIONS' | 'FRANCHISE_ADMIN' | 'RULES'>('COMMISSIONS');

  // Franchise Region is "Central"
  const region = 'Central';

  // Creation states
  const [agents, setAgents] = useState<any[]>([]);
  const [schoolName, setSchoolName] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [schoolComm, setSchoolComm] = useState(1.0);

  const [agentName, setAgentName] = useState('');
  const [agentUsername, setAgentUsername] = useState('');
  const [agentPhone, setAgentPhone] = useState('');

  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const schRes = await fetch('/api/schools');
      const schData = await schRes.json();
      setSchools(schData);

      const vendRes = await fetch('/api/vendors');
      const vendData = await vendRes.json();
      setVendors(vendData);

      const usersRes = await fetch('/api/users');
      const usersData = await usersRes.json();
      setAgents((usersData || []).filter((u: any) => u.role === 'AGENT' && u.region === region));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateCommission = (vendorId: string, currentRate: number) => {
    setEditingCommissionVendorId(vendorId);
    setCustomCommRate(currentRate);
  };

  const handleSaveCommission = async (vendorId: string) => {
    try {
      const res = await fetch('/api/vendors/update-commission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vendorId, schoolCommissionRate: customCommRate })
      });
      const data = await res.json();
      if (data.success) {
        setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, commissionRate: 100 - customCommRate } : v));
        setEditingCommissionVendorId(null);
        setSuccessMsg('Vendor commission matrix split updated successfully.');
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to update commission.');
        setTimeout(() => setErrorMsg(''), 3000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error saving commission split.');
      setTimeout(() => setErrorMsg(''), 3000);
    }
  };

  const handleCreateSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolName || !schoolCode) {
      setErrorMsg('School Name and unique School Code are required.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: schoolName,
          code: schoolCode,
          commissionRate: schoolComm,
          region
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`School "${schoolName}" created successfully!`);
        setSchoolName('');
        setSchoolCode('');
        setSchoolComm(1.0);
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to create school.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    }
  };

  const handleCreateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName || !agentUsername || !agentPhone) {
      setErrorMsg('All Agent fields are required.');
      return;
    }
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: agentName,
          username: agentUsername,
          phone: agentPhone,
          region
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Agent "${agentName}" registered successfully!`);
        setAgentName('');
        setAgentUsername('');
        setAgentPhone('');
        fetchData();
      } else {
        setErrorMsg(data.error || 'Failed to register agent.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error occurred.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200">
      
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 flex items-center justify-between hover:border-[#c7515e]/30 transition-all shadow-lg group">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Franchise Territory</span>
            <h4 className="text-xl font-bold text-white mt-1.5 tracking-tight">Uganda Central Region</h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] group-hover:scale-110 transition-transform">
            <MapPin className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 flex items-center justify-between hover:border-[#c7515e]/30 transition-all shadow-lg group">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Linked Schools</span>
            <h4 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{schools.length} <span className="text-sm font-medium text-gray-400 tracking-normal">Institutions</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] group-hover:scale-110 transition-transform">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-5 flex items-center justify-between hover:border-[#c7515e]/30 transition-all shadow-lg group">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Authorized POS Merchants</span>
            <h4 className="text-2xl font-bold text-white mt-1.5 tracking-tight">{vendors.length} <span className="text-sm font-medium text-gray-400 tracking-normal">Outlets</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e] group-hover:scale-110 transition-transform">
            <Users className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-lg">
        <button
          onClick={() => setActiveBusinessTab('COMMISSIONS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeBusinessTab === 'COMMISSIONS'
               ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
               : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>POS Splits</span>
        </button>
        <button
          onClick={() => setActiveBusinessTab('FRANCHISE_ADMIN')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeBusinessTab === 'FRANCHISE_ADMIN'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Franchise Setup</span>
        </button>
        <button
          onClick={() => setActiveBusinessTab('RULES')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeBusinessTab === 'RULES'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Territory Audit</span>
        </button>
      </div>

      {activeBusinessTab === 'COMMISSIONS' && (
        /* Commission Configuration Panels */
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl max-w-3xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                <Sliders className="h-4 w-4 text-[#c7515e]" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">Merchant-School Commissions</h3>
            </div>
            <button 
              onClick={fetchData} 
              className="text-gray-400 hover:text-[#c7515e] p-1.5 rounded-lg hover:bg-[#c7515e]/10 transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-[#c7515e]' : ''}`} />
            </button>
          </div>

          <div className="space-y-4">
            {vendors.map((vendor) => {
              const school = schools.find(s => s.id === vendor.schoolId);
              const currentSchoolRate = 100 - vendor.commissionRate;

              return (
                <div key={vendor.id} className="p-4 rounded-xl bg-[#06080E]/80 border border-white/5 hover:border-[#c7515e]/20 transition-colors space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-bold text-white">{vendor.name}</h4>
                      <p className="text-[11px] text-[#c7515e] font-medium mt-1">Campus: {school ? school.name : 'Unknown'}</p>
                    </div>
                    <span className="text-[10px] font-mono bg-[#c7515e]/10 text-[#c7515e] px-2.5 py-1 rounded-md uppercase font-bold tracking-wider">
                      {vendor.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-white/5">
                    <span className="text-gray-500 font-medium uppercase tracking-wider text-[10px]">School Revenue Slice:</span>
                    
                    {editingCommissionVendorId === vendor.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={customCommRate}
                          onChange={(e) => setCustomCommRate(Number(e.target.value))}
                          className="w-16 rounded border border-[#c7515e]/50 bg-[#06080E] px-2 py-1 text-right font-mono text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                          step="0.5"
                          min="0"
                          max="10"
                        />
                        <span className="text-gray-400 font-mono">%</span>
                        <button
                          onClick={() => handleSaveCommission(vendor.id)}
                          className="rounded-lg bg-[#c7515e] hover:bg-[#b04753] px-3 py-1 text-[11px] text-white font-bold transition-transform active:scale-95 shadow-lg shadow-[#c7515e]/20"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-white font-bold bg-white/5 px-2 py-0.5 rounded">{currentSchoolRate.toFixed(1)}%</span>
                        <button
                          onClick={() => handleUpdateCommission(vendor.id, currentSchoolRate)}
                          className="text-[11px] text-[#c7515e] hover:text-[#b04753] font-semibold transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeBusinessTab === 'FRANCHISE_ADMIN' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Create Forms */}
          <div className="lg:col-span-6 space-y-6">
            {/* Create School */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                <div className="p-1.5 rounded-lg bg-[#c7515e]/10 text-[#c7515e]">
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Register New School Campus</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Enrolls campus node under the {region} Franchise</p>
                </div>
              </div>

              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <form onSubmit={handleCreateSchool} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">School Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nakasero Model School"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Campus Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. NMS"
                      maxLength={5}
                      value={schoolCode}
                      onChange={(e) => setSchoolCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                      className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Custom Split rate %</label>
                    <input
                      type="number"
                      required
                      step="0.1"
                      value={schoolComm}
                      onChange={(e) => setSchoolComm(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white font-mono focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/15 flex items-center justify-center gap-2"
                >
                  <Building className="h-3.5 w-3.5" />
                  <span>Register Campus Node</span>
                </button>
              </form>
            </div>

            {/* Create Agent */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
                <div className="p-1.5 rounded-lg bg-[#c7515e]/10 text-[#c7515e]">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Register Field Operations Agent</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">Authorizes mobile field operations agent for {region} territory</p>
                </div>
              </div>

              <form onSubmit={handleCreateAgent} className="space-y-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Agent Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Peter Ssekabira"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Username</label>
                    <input
                      type="text"
                      required
                      placeholder="peter_agent"
                      value={agentUsername}
                      onChange={(e) => setAgentUsername(e.target.value.replace(/\s+/g, ''))}
                      className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                    <input
                      type="text"
                      required
                      placeholder="+256700000003"
                      value={agentPhone}
                      onChange={(e) => setAgentPhone(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/15 flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Register Field Agent</span>
                </button>
              </form>
            </div>
          </div>

          {/* Directory Column */}
          <div className="lg:col-span-6 space-y-6">
            {/* Territory Schools */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <Building className="h-4.5 w-4.5 text-[#c7515e]" />
                  <h3 className="text-xs font-bold text-white tracking-wide">Schools in Franchise Region ({region})</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded">{schools.length} Campuses</span>
              </div>

              <div className="space-y-2 max-h-55 overflow-y-auto scrollbar-thin">
                {schools.map((sch) => (
                  <div key={sch.id} className="p-3 rounded-xl bg-[#06080E]/80 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-white">{sch.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Code: {sch.code} <span className="opacity-40 mx-1">|</span> Region: {sch.region}</p>
                    </div>
                    <span className="text-[10px] font-mono font-bold text-[#c7515e] bg-[#c7515e]/5 px-2 py-1 rounded">{sch.commissionRate}% split</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Territory Agents */}
            <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <div className="flex items-center gap-2.5">
                  <Users className="h-4.5 w-4.5 text-[#c7515e]" />
                  <h3 className="text-xs font-bold text-white tracking-wide">Active Operational Field Agents</h3>
                </div>
                <span className="text-[10px] font-mono font-bold bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded">{agents.length} Agents</span>
              </div>

              <div className="space-y-2 max-h-55 overflow-y-auto scrollbar-thin">
                {agents.map((ag) => (
                  <div key={ag.id} className="p-3 rounded-xl bg-[#06080E]/80 border border-white/5 flex items-center justify-between text-xs hover:border-white/10 transition-colors">
                    <div>
                      <h4 className="font-bold text-white">{ag.name}</h4>
                      <p className="text-[10px] text-gray-500 font-mono mt-0.5">Username: {ag.username} <span className="opacity-40 mx-1">|</span> {ag.phone}</p>
                    </div>
                    <span className="text-[9px] font-mono font-bold bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded uppercase tracking-wider">{ag.region}</span>
                  </div>
                ))}
                {agents.length === 0 && (
                  <p className="text-center text-xs text-gray-500 py-4">No field agents registered under your franchise.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeBusinessTab === 'RULES' && (
        /* Territory Guidelines */
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-5 max-w-3xl">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-4">
            <div className="p-1.5 rounded-lg bg-gray-800">
              <AlertTriangle className="h-4 w-4 text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-white tracking-wide">Regional Audit Rules</h3>
          </div>
          
          <div className="space-y-5 text-sm text-gray-400 leading-relaxed">
            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <AlertTriangle className="h-5 w-5 text-[#c7515e] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-200 block mb-1">Agent Registration Limits</span>
                <span className="text-xs">Each region supports at most 10 operational agents. Commission modification controls are strictly isolated from field agents.</span>
              </div>
            </div>

            <div className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/5">
              <AlertTriangle className="h-5 w-5 text-[#c7515e] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-gray-200 block mb-1">School Revenue Settlements</span>
                <span className="text-xs">Settlements of commissions accumulated on school ledgers process automatically on the 1st of every calendar month.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}