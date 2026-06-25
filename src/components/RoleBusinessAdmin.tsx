import React, { useEffect, useState } from 'react';
import { Landmark, Users, Sliders, RefreshCw, BadgeAlert } from 'lucide-react';
import { School, Vendor } from '../types';

export default function RoleBusinessAdmin() {
  const [schools, setSchools] = useState<School[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCommissionVendorId, setEditingCommissionVendorId] = useState<string | null>(null);
  const [customCommRate, setCustomCommRate] = useState<number>(1.0);

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
    // Mock updating the state locally to show immediate change
    setVendors(prev => prev.map(v => v.id === vendorId ? { ...v, commissionRate: 100 - customCommRate } : v));
    setEditingCommissionVendorId(null);
    console.log(`[Business Admin] Vendor commission split adjusted. School share set to ${customCommRate}%`);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Franchise Territory</span>
            <h4 className="text-xl font-bold text-white mt-1">Uganda Central Region</h4>
          </div>
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Linked Schools</span>
            <h4 className="text-xl font-bold text-white mt-1">{schools.length} Schools</h4>
          </div>
          <div className="rounded-lg bg-indigo-500/10 p-2.5 text-indigo-400">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Authorized POS Merchants</span>
            <h4 className="text-xl font-bold text-white mt-1">{vendors.length} Outlets</h4>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
            <Users className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Commission Configuration Panels */}
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-400" />
              <h3 className="text-sm font-medium text-gray-200">Merchant-School Commissions (vendor_school_link)</h3>
            </div>
            <button onClick={fetchData} className="text-gray-400 hover:text-white p-1">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Adjust the institutional cut automatically split to the respective school ledger on checkouts. Remaining percentage defaults to the merchant.
          </p>

          <div className="space-y-4">
            {vendors.map((vendor) => {
              const school = schools.find(s => s.id === vendor.schoolId);
              const currentSchoolRate = 100 - vendor.commissionRate;

              return (
                <div key={vendor.id} className="p-4 rounded-lg bg-[#06080E]/60 border border-white/5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{vendor.name}</h4>
                      <p className="text-[10px] text-gray-500 mt-0.5">Campus: {school ? school.name : 'Unknown'}</p>
                    </div>
                    <span className="text-xs font-mono bg-sky-950/40 text-sky-400 px-2 py-0.5 rounded uppercase font-bold text-[9px]">
                      {vendor.type}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/5">
                    <span className="text-gray-400">School Revenue Slice:</span>
                    {editingCommissionVendorId === vendor.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={customCommRate}
                          onChange={(e) => setCustomCommRate(Number(e.target.value))}
                          className="w-12 rounded border border-white/10 bg-[#06080E] px-1.5 py-0.5 text-right font-mono text-xs text-gray-200"
                          step="0.5"
                          min="0"
                          max="10"
                        />
                        <span className="text-gray-400 font-mono">%</span>
                        <button
                          onClick={() => handleSaveCommission(vendor.id)}
                          className="rounded bg-sky-600 hover:bg-sky-500 px-2 py-0.5 text-[10px] text-white font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-200 font-bold">{currentSchoolRate.toFixed(1)}%</span>
                        <button
                          onClick={() => handleUpdateCommission(vendor.id, currentSchoolRate)}
                          className="text-[10px] text-sky-400 hover:underline"
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

        {/* Territory Guidelines */}
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">Regional Audit Rules</h3>
          
          <div className="space-y-3.5 text-xs text-gray-400 leading-relaxed">
            <div className="flex gap-3">
              <BadgeAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-200 block">Agent Registration Limits</span>
                <span>Each region supports at most 10 operational agents. Commission modification controls are strictly isolated from fields agents.</span>
              </div>
            </div>

            <div className="flex gap-3">
              <BadgeAlert className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-gray-200 block">School Revenue Settlements</span>
                <span>Settlements of commissions accumulated on school ledgers process automatically on the 1st of every calendar month.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
