import React, { useState, useEffect } from 'react';
import { Users, FileDown, UploadCloud, CheckCircle2, UserPlus, RefreshCw, AlertTriangle } from 'lucide-react';
import { School, Student } from '../types';
import { useToast } from './ToastContext';

export default function RoleAgent() {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeAgentTab, setActiveAgentTab] = useState<'REGISTRATION' | 'REGISTRIES'>('REGISTRATION');
  const [loading, setLoading] = useState(false);
  const [csvText, setCsvText] = useState('');
  const toast = useToast();

  // Single form state
  const [studentName, setStudentName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentNin, setParentNin] = useState('');

  const fetchBaseData = async () => {
    try {
      const schRes = await fetch('/api/schools');
      const schData = await schRes.json();
      if (Array.isArray(schData)) {
        setSchools(schData);
        if (schData.length > 0) setSchoolId(schData[0].id);
      }

      const studRes = await fetch('/api/students');
      const studData = await studRes.json();
      if (Array.isArray(studData)) setStudents(studData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  const loadDemoCsv = () => {
    const demo = 
`KPS01,KPS-2026-009,Joan Kembabazi,Primary 6,David Mugisha,+256779998811,CM91122334A23
KPS01,KPS-2026-010,Timothy Mukasa,Primary 4,Moses Mukasa,+256772444555,CM89021102A12
GHS02,GHS-2026-102,Angella Namara,Senior 2,Justine Namara,+256782555444,CF90088112C45`;
    setCsvText(demo);
  };

  const handleCsvSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    setLoading(true);

    // Parse CSV rows
    const lines = csvText.split('\n');
    const rows = [];
    for (const line of lines) {
      if (!line.trim()) continue;
      const parts = line.split(',');
      if (parts.length >= 4) {
        // Find matching school by code (or fallback)
        const schoolCode = parts[0].trim();
        const foundSchool = schools.find(s => s.code === schoolCode || s.id === schoolCode);
        const activeSchoolId = foundSchool ? foundSchool.id : (schools[0]?.id || 'S1');

        rows.push({
          schoolId: activeSchoolId,
          admissionNo: parts[1]?.trim(),
          name: parts[2]?.trim(),
          class: parts[3]?.trim(),
          parentName: parts[4]?.trim() || 'Parent',
          parentPhone: parts[5]?.trim() || '+256770000000',
          parentNin: parts[6]?.trim() || ''
        });
      }
    }

    try {
      const res = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows,
          agentId: 'u_agent',
          agentName: 'Peter Ssekabira'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setCsvText('');
        fetchBaseData();
      } else {
        toast.error(data.error || 'Failed to bulk upload students.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during bulk upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName || !admissionNo || !parentPhone) {
      toast.error('Student Name, Admission No, and Parent Phone are required.');
      return;
    }

    setLoading(true);

    const payload = {
      rows: [
        {
          schoolId,
          admissionNo,
          name: studentName,
          class: studentClass || 'Primary 1',
          parentName,
          parentPhone,
          parentNin
        }
      ],
      agentId: 'u_agent',
      agentName: 'Peter Ssekabira'
    };

    try {
      const res = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Student "${studentName}" registered successfully.`);
        // Reset form
        setStudentName('');
        setAdmissionNo('');
        setStudentClass('');
        setParentName('');
        setParentPhone('');
        setParentNin('');
        fetchBaseData();
      } else {
        toast.error(data.error || 'Failed to register student.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200">
      
      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-md">
        <button
          onClick={() => setActiveAgentTab('REGISTRATION')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeAgentTab === 'REGISTRATION'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <UserPlus className="h-4 w-4" />
          <span>Student Intake</span>
        </button>
        <button
          onClick={() => setActiveAgentTab('REGISTRIES')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeAgentTab === 'REGISTRIES'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Directories</span>
        </button>
      </div>

      {activeAgentTab === 'REGISTRATION' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Bulk Upload CSV Engine */}
          <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl flex flex-col justify-between h-fit">
            <div>
              <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5">
                <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                  <UploadCloud className="h-5 w-5 text-[#c7515e]" />
                </div>
                <h3 className="text-sm font-bold text-white tracking-wide">Bulk Upsert Student CSV Engine</h3>
              </div>

              <div className="text-xs font-mono text-gray-400 bg-[#06080E]/80 p-4 rounded-xl border border-white/5 mb-5 leading-relaxed shadow-inner">
                <span className="font-bold text-[#c7515e] tracking-widest uppercase text-[10px]">CSV Header Guide:</span><br />
                <code className="text-gray-300 mt-1 block">SchoolCode, AdmissionNo, StudentName, Class, GuardianName, GuardianPhone, GuardianNIN</code>
              </div>

              <form onSubmit={handleCsvSubmit} className="space-y-5">
                <textarea
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  rows={6}
                  placeholder="e.g. KPS01,KPS-2026-004,Joan Kembabazi,Primary 5,Mugisha,+256779998811,..."
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] p-4 font-mono text-sm text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all placeholder-gray-600"
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={loadDemoCsv}
                    className="text-sm text-[#c7515e] hover:text-[#b04753] hover:underline flex items-center gap-1.5 font-bold transition-colors"
                  >
                    <FileDown className="h-4 w-4" />
                    Load Demo School CSV
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !csvText.trim()}
                    className={`w-full sm:w-auto rounded-xl bg-[#c7515e] hover:bg-[#b04753] px-6 py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-[#c7515e]/20 ${
                      loading || !csvText.trim() ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? 'Processing Upload...' : 'Execute Bulk CSV Import'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Register Single Student */}
          <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl h-fit">
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5">
              <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                <UserPlus className="h-5 w-5 text-[#c7515e]" />
              </div>
              <h3 className="text-sm font-bold text-white tracking-wide">Register Student & Parent Link</h3>
            </div>

            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Campus Target</label>
                <select
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-gray-300 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all appearance-none cursor-pointer"
                >
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Student Name</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Brian Mukasa"
                    className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Admission No.</label>
                  <input
                    type="text"
                    value={admissionNo}
                    onChange={(e) => setAdmissionNo(e.target.value)}
                    placeholder="KPS-2026-004"
                    className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Class / Grade</label>
                  <input
                    type="text"
                    value={studentClass}
                    onChange={(e) => setStudentClass(e.target.value)}
                    placeholder="Primary 5"
                    className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Parent Phone</label>
                  <input
                    type="text"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                    placeholder="+256772444555"
                    className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Parent Name</label>
                  <input
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    placeholder="Moses Mukasa"
                    className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Parent NIN (KYC 2)</label>
                  <input
                    type="text"
                    value={parentNin}
                    onChange={(e) => setParentNin(e.target.value)}
                    placeholder="CM89021102A12"
                    className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-6 rounded-xl bg-[#c7515e] hover:bg-[#b04753] py-3 text-sm font-bold text-white transition-all active:scale-95 shadow-lg shadow-[#c7515e]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Records...' : 'Submit Entry & Link'}
              </button>
            </form>
          </div>

        </div>
      )}

      {activeAgentTab === 'REGISTRIES' && (
        /* Live student registries */
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-5">
            <h3 className="text-sm font-bold text-white tracking-wide">Active Campus Student Registries</h3>
            <button onClick={fetchBaseData} className="text-gray-400 hover:text-[#c7515e] p-1.5 rounded-lg hover:bg-[#c7515e]/10 transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-x-auto max-h-[450px] scrollbar-thin">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-bold">Student Name</th>
                  <th className="pb-3 font-bold">Admission #</th>
                  <th className="pb-3 font-bold">Class</th>
                  <th className="pb-3 font-bold">Linked Parent Phone</th>
                  <th className="pb-3 font-bold">Secure QR Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold text-white">{student.name}</td>
                    <td className="py-3 font-mono text-gray-400 text-xs">{student.admissionNo}</td>
                    <td className="py-3 text-xs">{student.class}</td>
                    <td className="py-3 text-gray-400 text-xs">{student.parentPhone}</td>
                    <td className="py-3 font-mono text-[#c7515e] text-[10px] font-bold">{student.qrHash}</td>
                  </tr>
                ))}
                {students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-sm font-medium text-gray-500">
                      No student records found in the registry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}