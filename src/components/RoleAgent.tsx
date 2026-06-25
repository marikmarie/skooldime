import React, { useState, useEffect } from 'react';
import { Users, FileDown, UploadCloud, CheckCircle2, UserPlus, RefreshCw } from 'lucide-react';
import { School, Student } from '../types';

export default function RoleAgent() {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [csvText, setCsvText] = useState('');

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
    setSuccessMsg('');
    setErrorMsg('');

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
        setSuccessMsg(data.message);
        setCsvText('');
        fetchBaseData();
      } else {
        setErrorMsg(data.error || 'Failed to bulk upload students.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during bulk upload.');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    if (!studentName || !admissionNo || !parentPhone) {
      setErrorMsg('Student Name, Admission No, and Parent Phone are required.');
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
        setSuccessMsg(`Student "${studentName}" registered successfully.`);
        // Reset form
        setStudentName('');
        setAdmissionNo('');
        setStudentClass('');
        setParentName('');
        setParentPhone('');
        setParentNin('');
        fetchBaseData();
      } else {
        setErrorMsg(data.error || 'Failed to register student.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during registration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Alert message */}
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3 text-xs text-emerald-300">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-300">
          <span className="text-rose-400 shrink-0 text-base font-bold">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Bulk Upload CSV Engine (3.1) */}
        <div className="lg:col-span-7 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2.5 border-b border-white/5 pb-3 mb-4">
              <UploadCloud className="h-4.5 w-4.5 text-purple-400" />
              <h3 className="text-sm font-medium text-gray-200">Bulk Upsert Student CSV Engine</h3>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed mb-4">
              Paste standard comma-separated student arrays below. The parser automates identity lookup for both parents and student entities, binding their ledger limits dynamically.
            </p>

            <div className="text-[10px] font-mono text-gray-500 bg-[#06080E] p-2.5 rounded border border-white/5 mb-4 leading-normal">
              <span className="font-bold text-gray-300">CSV Header Guide:</span><br />
              <code>SchoolCode, AdmissionNo, StudentName, Class, GuardianName, GuardianPhone, GuardianNIN</code>
            </div>

            <form onSubmit={handleCsvSubmit} className="space-y-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                rows={6}
                placeholder="e.p. KPS01,KPS-2026-004,Joan Kembabazi,Primary 5,Mugisha,+256779998811,..."
                className="w-full rounded-lg border border-white/5 bg-[#06080E] p-3.5 font-mono text-xs text-gray-200 focus:outline-none focus:border-purple-500/50"
              />

              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={loadDemoCsv}
                  className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <FileDown className="h-3.5 w-3.5" />
                  Load Demo School CSV
                </button>
                <button
                  type="submit"
                  disabled={loading || !csvText.trim()}
                  className={`rounded-lg bg-purple-600 hover:bg-purple-500 px-5 py-2 text-xs font-semibold text-white transition active:scale-95 ${
                    loading || !csvText.trim() ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Processing Upload...' : 'Execute Bulk CSV Import'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Register Single Student */}
        <div className="lg:col-span-5 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
          <div className="flex items-center gap-2.5 border-b border-white/5 pb-3 mb-4">
            <UserPlus className="h-4.5 w-4.5 text-sky-400" />
            <h3 className="text-sm font-medium text-gray-200">Register Student & Parent Link</h3>
          </div>

          <form onSubmit={handleSingleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Campus Target</label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300"
              >
                {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Student Name</label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Brian Mukasa"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Admission No.</label>
                <input
                  type="text"
                  value={admissionNo}
                  onChange={(e) => setAdmissionNo(e.target.value)}
                  placeholder="KPS-2026-004"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Class / Grade</label>
                <input
                  type="text"
                  value={studentClass}
                  onChange={(e) => setStudentClass(e.target.value)}
                  placeholder="Primary 5"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Parent Phone</label>
                <input
                  type="text"
                  value={parentPhone}
                  onChange={(e) => setParentPhone(e.target.value)}
                  placeholder="+256772444555"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Parent Name</label>
                <input
                  type="text"
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder="Moses Mukasa"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">Parent NIN (KYC 2)</label>
                <input
                  type="text"
                  value={parentNin}
                  onChange={(e) => setParentNin(e.target.value)}
                  placeholder="CM89021102A12"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 placeholder-gray-600"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-3 rounded-lg bg-sky-600 hover:bg-sky-500 py-2 text-xs font-semibold text-white transition active:scale-95"
            >
              {loading ? 'Creating Records...' : 'Submit Entry & Link'}
            </button>
          </form>
        </div>

      </div>

      {/* Live student registries */}
      <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
        <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
          <h3 className="text-sm font-medium text-gray-200">Active Campus Student registries</h3>
          <button onClick={fetchBaseData} className="text-gray-400 hover:text-white p-1">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto max-h-60 scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-mono">
                <th className="pb-2.5">Student Name</th>
                <th className="pb-2.5">Admission #</th>
                <th className="pb-2.5">Class</th>
                <th className="pb-2.5">Linked Parent Phone</th>
                <th className="pb-2.5">Secure QR Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="py-2.5 font-medium text-white">{student.name}</td>
                  <td className="py-2.5 font-mono text-gray-400">{student.admissionNo}</td>
                  <td className="py-2.5">{student.class}</td>
                  <td className="py-2.5 text-gray-400">{student.parentPhone}</td>
                  <td className="py-2.5 font-mono text-sky-400 text-[10px]">{student.qrHash}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
