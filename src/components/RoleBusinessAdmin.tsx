import React, { useEffect, useState } from 'react';
import { Landmark, Users, Sliders, RefreshCw, AlertTriangle, MapPin } from 'lucide-react';
import { School, Vendor } from '../types';

export default function RoleBusinessAdmin() {
  const [schools, setSchools] = useState<School[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCommissionVendorId, setEditingCommissionVendorId] = useState<string | null>(null);
  const [customCommRate, setCustomCommRate] = useState<number>(1.0);
  const [activeBusinessTab, setActiveBusinessTab] = useState<'COMMISSIONS' | 'RULES'>('COMMISSIONS');

  const fetchData = async () => {
    setLoading(true);
    try {
      const schRes = await fetch('/api/schools');
      const schData = await schRes.json();
      setSchools(schData);

      const vendRes = await fetch('/api/vendors');
      const vendData = await vendRes.json();
      setVendors(vendData);
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

  const handleSaveCommission = (vendorId: string) => {
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, commissionRate: 100 - customCommRate } : v));
    setEditingCommissionVendorId(null);
    console.log(`[Business Admin] Vendor commission split adjusted. School share set to ${customCommRate}%`);
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
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-md">
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