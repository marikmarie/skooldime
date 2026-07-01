import React, { useState, useEffect } from 'react';
import { Users, FileDown, UploadCloud, CheckCircle2, UserPlus, RefreshCw, AlertTriangle, Edit, Trash2, Key, Link2, ShieldAlert, Search } from 'lucide-react';
import { School, Student, Parent, Vendor } from '../types';
import { useToast } from './ToastContext';

export default function RoleAgent() {
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<Parent[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);

  const [activeAgentTab, setActiveAgentTab] = useState<'REGISTRATION' | 'REGISTRIES' | 'LINKS'>('REGISTRATION');
  const [activeRegTab, setActiveRegTab] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [studentSearch, setStudentSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  const [vendorSearch, setVendorSearch] = useState('');
  const [directoryTab, setDirectoryTab] = useState<'STUDENTS' | 'PARENTS' | 'VENDORS'>('STUDENTS');
  const [loading, setLoading] = useState(false);
  const [csvText, setCsvText] = useState('');
  const toast = useToast();

  // Single form student intake state
  const [studentName, setStudentName] = useState('');
  const [admissionNo, setAdmissionNo] = useState('');
  const [studentClass, setStudentClass] = useState('');
  const [schoolId, setSchoolId] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentNin, setParentNin] = useState('');

  // Parent CRUD Modal state
  const [showParentModal, setShowParentModal] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const [pName, setPName] = useState('');
  const [pPhone, setPPhone] = useState('');
  const [pNin, setPNin] = useState('');

  // Vendor CRUD Modal state
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [vName, setVName] = useState('');
  const [vPhone, setVPhone] = useState('');
  const [vSchoolId, setVSchoolId] = useState('');
  const [vType, setVType] = useState('CANTEEN');

  // Student CRUD Modal state
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [sName, setSName] = useState('');
  const [sClass, setSClass] = useState('');

  // Link Locking OTP state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkStudent, setLinkStudent] = useState<Student | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [linkTargetStatus, setLinkTargetStatus] = useState(true);

  const fetchBaseData = async () => {
    try {
      const schRes = await fetch('/api/schools');
      const schData = await schRes.json();
      if (Array.isArray(schData)) {
        setSchools(schData);
        if (schData.length > 0) {
          setSchoolId(schData[0].id);
          setVSchoolId(schData[0].id);
        }
      }

      const studRes = await fetch('/api/students');
      const studData = await studRes.json();
      if (Array.isArray(studData)) setStudents(studData);

      const parentRes = await fetch('/api/parents');
      const parentData = await parentRes.json();
      if (Array.isArray(parentData)) setParents(parentData);

      const vendRes = await fetch('/api/vendors');
      const vendData = await vendRes.json();
      if (Array.isArray(vendData)) setVendors(vendData);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  // Parent Save/Edit handler
  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pName || !pPhone) {
      toast.error('Parent Name and Phone number are required.');
      return;
    }
    try {
      const res = await fetch('/api/parents/create-or-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingParent?.id || null,
          name: pName,
          phone: pPhone,
          nin: pNin
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowParentModal(false);
        setEditingParent(null);
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Vendor Save/Edit handler
  const handleSaveVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vName || !vPhone || !vSchoolId) {
      toast.error('Vendor Name, Campus, and Phone are required.');
      return;
    }
    try {
      const res = await fetch('/api/vendors/create-or-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingVendor?.id || null,
          name: vName,
          schoolId: vSchoolId,
          phone: vPhone,
          type: vType
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowVendorModal(false);
        setEditingVendor(null);
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Student Edit handler
  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName || !sClass) {
      toast.error('Student Name and Class are required.');
      return;
    }
    // Bulk endpoint serves as registration, we can just save back via custom endpoint or handle it
    try {
      const res = await fetch('/api/students/bulk-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: [{
            schoolId: editingStudent?.schoolId,
            admissionNo: editingStudent?.admissionNo,
            name: sName,
            class: sClass,
            parentPhone: editingStudent?.parentPhone,
            parentName: editingStudent?.parentName
          }],
          agentId: 'u_agent',
          agentName: 'Peter Ssekabira'
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Student record edited successfully.');
        setShowStudentModal(false);
        setEditingStudent(null);
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Deletion Handlers
  const handleDeleteParent = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this parent account? All student connections will be unlinked.')) return;
    try {
      const res = await fetch('/api/parents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if (!window.confirm('Are you sure you want to retire this Vendor POS Outlet?')) return;
    try {
      const res = await fetch('/api/vendors/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    if (!window.confirm('Are you sure you want to deregister this student from the campus ledger?')) return;
    try {
      const res = await fetch('/api/students/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Link modification OTP trigger
  const triggerLinkChange = (student: Student, targetLinkedStatus: boolean) => {
    setLinkStudent(student);
    setLinkTargetStatus(targetLinkedStatus);
    setOtpCode('');
    setShowLinkModal(true);
    console.log(`[Agent] Link verification OTP dispatched to parent at ${student.parentPhone}. Code is 1234 or 4321.`);
  };

  const handleVerifyLinkOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkStudent) return;
    if (otpCode !== '1234' && otpCode !== '4321') {
      toast.error('Invalid parent OTP challenge verification.');
      return;
    }
    try {
      const res = await fetch('/api/students/update-link-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: linkStudent.id,
          isLinked: linkTargetStatus,
          otpChallenge: otpCode
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowLinkModal(false);
        setLinkStudent(null);
        setOtpCode('');
        fetchBaseData();
      } else {
        toast.error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

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
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200 bg-[#06080E] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl">
      
      {/* Dashboard Sub-Tabs */}
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-lg">
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
        <button
          onClick={() => setActiveAgentTab('LINKS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeAgentTab === 'LINKS'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Link2 className="h-4 w-4" />
          <span>Link Lock/Unlock</span>
        </button>
      </div>

      {activeAgentTab === 'REGISTRATION' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sub-tab selection for Single Student vs Bulk Upload */}
          <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-sm shrink-0">
            <button
              onClick={() => setActiveRegTab('SINGLE')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeRegTab === 'SINGLE'
                  ? 'bg-[#c7515e]/15 text-[#c7515e] border border-[#c7515e]/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Single Intake Form
            </button>
            <button
              onClick={() => setActiveRegTab('BULK')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                activeRegTab === 'BULK'
                  ? 'bg-[#c7515e]/15 text-[#c7515e] border border-[#c7515e]/20'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Bulk Upload CSV
            </button>
          </div>

          <div className="grid grid-cols-1 gap-6 max-w-3xl">
            {activeRegTab === 'BULK' && (
              /* Bulk Upload CSV Engine */
              <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5">
                    <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                      <UploadCloud className="h-5 w-5 text-[#c7515e]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#06065C] tracking-wide">Bulk Upsert Student CSV Engine</h3>
                      <p className="text-[11px] text-gray-500 mt-0.5">Import multiple student and parent linkage records instantly</p>
                    </div>
                  </div>

                  <div className="text-[11px] font-mono text-gray-400 bg-[#06080E]/80 p-4 rounded-xl border border-white/5 mb-5 leading-relaxed shadow-inner">
                    <span className="font-bold text-[#c7515e] tracking-widest uppercase text-[10px]">CSV Header Guide:</span><br />
                    <code className="text-gray-300 mt-1 block overflow-x-auto whitespace-nowrap py-1 scrollbar-thin">
                      SchoolCode, AdmissionNo, StudentName, Class, GuardianName, GuardianPhone, GuardianNIN
                    </code>
                  </div>

                  <form onSubmit={handleCsvSubmit} className="space-y-5">
                    <textarea
                      value={csvText}
                      onChange={(e) => setCsvText(e.target.value)}
                      rows={6}
                      placeholder="e.g. KPS01,KPS-2026-004,Joan Kembabazi,Primary 5,Mugisha,+256779998811,..."
                      className="w-full rounded-lg border border-white/10 bg-[#06080E] p-4 font-mono text-sm text-slate-800 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all placeholder-gray-600"
                    />

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <button
                        type="button"
                        onClick={loadDemoCsv}
                        className="text-xs text-[#c7515e] hover:text-[#b04753] hover:underline flex items-center gap-1.5 font-bold transition-colors"
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
            )}

            {activeRegTab === 'SINGLE' && (
              /* Register Single Student */
              <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl">
                <div className="flex items-center gap-2.5 border-b border-white/5 pb-4 mb-5">
                  <div className="p-1.5 rounded-lg bg-[#c7515e]/10">
                    <UserPlus className="h-5 w-5 text-[#c7515e]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#06065C] tracking-wide">Register Student & Parent Link</h3>
                    <p className="text-[11px] text-gray-500 mt-0.5">Create a single student record with automated SMS PIN delivery</p>
                  </div>
                </div>

                <form onSubmit={handleSingleSubmit} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Campus Target</label>
                    <select
                      value={schoolId}
                      onChange={(e) => setSchoolId(e.target.value)}
                      className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all appearance-none cursor-pointer"
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
                        className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Admission No.</label>
                      <input
                        type="text"
                        value={admissionNo}
                        onChange={(e) => setAdmissionNo(e.target.value)}
                        placeholder="KPS-2026-004"
                        className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
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
                        className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Parent Phone</label>
                      <input
                        type="text"
                        value={parentPhone}
                        onChange={(e) => setParentPhone(e.target.value)}
                        placeholder="+256772444555"
                        className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
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
                        className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider font-bold block mb-2">Parent NIN (KYC 2)</label>
                      <input
                        type="text"
                        value={parentNin}
                        onChange={(e) => setParentNin(e.target.value)}
                        placeholder="CM89021102A12"
                        className="w-full rounded-lg border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-slate-800 placeholder-gray-600 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition-all"
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
            )}
          </div>
        </div>
      )}

      {activeAgentTab === 'REGISTRIES' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Segmented Directory Switcher */}
          <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-sm shrink-0">
            {(['STUDENTS', 'PARENTS', 'VENDORS'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setDirectoryTab(tab)}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  directoryTab === tab
                    ? 'bg-[#c7515e]/15 text-[#c7515e] border border-[#c7515e]/20'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {tab.toLowerCase()}
              </button>
            ))}
          </div>

          {/* Directory Panel */}
          <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-[#c7515e]" />
                <h3 className="text-sm font-bold text-white tracking-wide uppercase">
                  {directoryTab} DIRECTORY LEDGER
                </h3>
              </div>
              <div className="flex items-center gap-3">
                {directoryTab === 'PARENTS' && (
                  <button
                    onClick={() => {
                      setEditingParent(null);
                      setPName('');
                      setPPhone('');
                      setPNin('');
                      setShowParentModal(true);
                    }}
                    className="rounded-lg bg-[#c7515e] hover:bg-[#a13f4a] px-3.5 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow"
                  >
                    + Register Parent
                  </button>
                )}
                {directoryTab === 'VENDORS' && (
                  <button
                    onClick={() => {
                      setEditingVendor(null);
                      setVName('');
                      setVPhone('');
                      setVType('CANTEEN');
                      if (schools.length > 0) setVSchoolId(schools[0].id);
                      setShowVendorModal(true);
                    }}
                    className="rounded-lg bg-[#c7515e] hover:bg-[#a13f4a] px-3.5 py-1.5 text-xs font-bold text-white transition active:scale-95 shadow"
                  >
                    + Register Vendor
                  </button>
                )}
                <button
                  onClick={fetchBaseData}
                  className="text-gray-400 hover:text-[#c7515e] p-1.5 rounded-lg hover:bg-[#c7515e]/10 transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Real-time search bar */}
            <div className="relative pb-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder={
                  directoryTab === 'STUDENTS' ? "Search students by name, class, admission code, parent..." :
                  directoryTab === 'PARENTS' ? "Search parents by name, phone, National ID (NIN)..." :
                  "Search vendors by name, phone, type..."
                }
                value={
                  directoryTab === 'STUDENTS' ? studentSearch :
                  directoryTab === 'PARENTS' ? parentSearch :
                  vendorSearch
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (directoryTab === 'STUDENTS') setStudentSearch(val);
                  else if (directoryTab === 'PARENTS') setParentSearch(val);
                  else setVendorSearch(val);
                }}
                className="w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border border-white/10 bg-[#06080E] text-white placeholder-gray-500 focus:border-[#c7515e] outline-none transition"
              />
            </div>

            {/* Render selected directory segment */}
            {directoryTab === 'STUDENTS' && (
              <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-3 font-bold">Student Name</th>
                      <th className="pb-3 font-bold">Admission #</th>
                      <th className="pb-3 font-bold">Class</th>
                      <th className="pb-3 font-bold">Linked Parent</th>
                      <th className="pb-3 font-bold">Secure QR Hash</th>
                      <th className="pb-3 font-bold text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {students
                      .filter(s => {
                        if (!studentSearch) return true;
                        const q = studentSearch.toLowerCase();
                        return (
                          s.name.toLowerCase().includes(q) ||
                          s.admissionNo.toLowerCase().includes(q) ||
                          s.class.toLowerCase().includes(q) ||
                          s.parentPhone?.toLowerCase().includes(q) ||
                          s.parentName?.toLowerCase().includes(q)
                        );
                      })
                      .map((student) => (
                        <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-bold text-white">{student.name}</td>
                          <td className="py-3 font-mono text-gray-400 text-xs">{student.admissionNo}</td>
                          <td className="py-3 text-xs">{student.class}</td>
                          <td className="py-3 text-gray-400 text-xs">{student.parentName} ({student.parentPhone})</td>
                          <td className="py-3 font-mono text-[#c7515e] text-[10px] font-bold">{student.qrHash}</td>
                          <td className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => {
                                  setEditingStudent(student);
                                  setSName(student.name);
                                  setSClass(student.class);
                                  setShowStudentModal(true);
                                }}
                                className="text-gray-400 hover:text-white"
                                title="Edit Student"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(student.id)}
                                className="text-gray-500 hover:text-rose-500"
                                title="Delete Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {students.filter(s => {
                      if (!studentSearch) return true;
                      const q = studentSearch.toLowerCase();
                      return (
                        s.name.toLowerCase().includes(q) ||
                        s.admissionNo.toLowerCase().includes(q) ||
                        s.class.toLowerCase().includes(q) ||
                        s.parentPhone?.toLowerCase().includes(q) ||
                        s.parentName?.toLowerCase().includes(q)
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-sm font-medium text-gray-500">
                          No student records matched search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {directoryTab === 'PARENTS' && (
              <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-3 font-bold">Parent Name</th>
                      <th className="pb-3 font-bold">Primary Phone</th>
                      <th className="pb-3 font-bold">National ID (NIN)</th>
                      <th className="pb-3 font-bold">Linked Balance</th>
                      <th className="pb-3 font-bold text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {parents
                      .filter(p => {
                        if (!parentSearch) return true;
                        const q = parentSearch.toLowerCase();
                        return (
                          p.name.toLowerCase().includes(q) ||
                          p.phone?.toLowerCase().includes(q) ||
                          (p.nin && p.nin.toLowerCase().includes(q))
                        );
                      })
                      .map((parent) => (
                        <tr key={parent.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="py-3 font-bold text-white">{parent.name}</td>
                          <td className="py-3 font-mono text-gray-400 text-xs">{parent.phone}</td>
                          <td className="py-3 text-xs font-mono">{parent.nin || 'Not Provided'}</td>
                          <td className="py-3 text-xs font-mono text-[#c7515e] font-bold">
                            {parent.walletBalance?.toLocaleString() || 0} UGX
                          </td>
                          <td className="py-3 text-right pr-4">
                            <div className="flex items-center justify-end gap-2.5">
                              <button
                                onClick={() => {
                                  setEditingParent(parent);
                                  setPName(parent.name);
                                  setPPhone(parent.phone);
                                  setPNin(parent.nin || '');
                                  setShowParentModal(true);
                                }}
                                className="text-gray-400 hover:text-white"
                                title="Edit Parent"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteParent(parent.id)}
                                className="text-gray-500 hover:text-rose-500"
                                title="Delete Parent"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {parents.filter(p => {
                      if (!parentSearch) return true;
                      const q = parentSearch.toLowerCase();
                      return (
                        p.name.toLowerCase().includes(q) ||
                        p.phone?.toLowerCase().includes(q) ||
                        (p.nin && p.nin.toLowerCase().includes(q))
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm font-medium text-gray-500">
                          No parent records matched search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {directoryTab === 'VENDORS' && (
              <div className="overflow-x-auto max-h-[400px] scrollbar-thin">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                      <th className="pb-3 font-bold">Vendor Name</th>
                      <th className="pb-3 font-bold">Campus Location</th>
                      <th className="pb-3 font-bold">Contact Phone</th>
                      <th className="pb-3 font-bold">Category</th>
                      <th className="pb-3 font-bold text-right pr-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-gray-300">
                    {vendors
                      .filter(v => {
                        if (!vendorSearch) return true;
                        const q = vendorSearch.toLowerCase();
                        const associatedSchool = schools.find((s) => s.id === v.schoolId);
                        return (
                          v.name.toLowerCase().includes(q) ||
                          v.phone?.toLowerCase().includes(q) ||
                          v.type?.toLowerCase().includes(q) ||
                          (associatedSchool && associatedSchool.name.toLowerCase().includes(q))
                        );
                      })
                      .map((vendor) => {
                        const associatedSchool = schools.find((s) => s.id === vendor.schoolId);
                        return (
                          <tr key={vendor.id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 font-bold text-white">{vendor.name}</td>
                            <td className="py-3 text-xs">{associatedSchool?.name || 'Unknown Campus'}</td>
                            <td className="py-3 font-mono text-gray-400 text-xs">{vendor.phone}</td>
                            <td className="py-3 text-xs">
                              <span className="bg-[#c7515e]/10 text-[#c7515e] px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                                {vendor.type || 'CANTEEN'}
                              </span>
                            </td>
                            <td className="py-3 text-right pr-4">
                              <div className="flex items-center justify-end gap-2.5">
                                <button
                                  onClick={() => {
                                    setEditingVendor(vendor);
                                    setVName(vendor.name);
                                    setVSchoolId(vendor.schoolId);
                                    setVPhone(vendor.phone);
                                    setVType(vendor.type || 'CANTEEN');
                                    setShowVendorModal(true);
                                  }}
                                  className="text-gray-400 hover:text-white"
                                  title="Edit Vendor"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteVendor(vendor.id)}
                                  className="text-gray-500 hover:text-rose-500"
                                  title="Delete Vendor"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    {vendors.filter(v => {
                      if (!vendorSearch) return true;
                      const q = vendorSearch.toLowerCase();
                      const associatedSchool = schools.find((s) => s.id === v.schoolId);
                      return (
                        v.name.toLowerCase().includes(q) ||
                        v.phone?.toLowerCase().includes(q) ||
                        v.type?.toLowerCase().includes(q) ||
                        (associatedSchool && associatedSchool.name.toLowerCase().includes(q))
                      );
                    }).length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm font-medium text-gray-500">
                          No merchant vendors matched search query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeAgentTab === 'LINKS' && (
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-4">
          <div className="border-b border-white/5 pb-4 mb-2 flex items-center gap-2.5">
            <Link2 className="h-5 w-5 text-[#c7515e]" />
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Parent-Student Ledger Link Master</h3>
              <p className="text-xs text-gray-500 mt-1">Requires real-time Parent OTP approval to authorize or de-authorize account links.</p>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[450px] scrollbar-thin">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-mono text-[10px] uppercase tracking-wider">
                  <th className="pb-3 font-bold">Student</th>
                  <th className="pb-3 font-bold">Campus</th>
                  <th className="pb-3 font-bold">Parent Name</th>
                  <th className="pb-3 font-bold">Parent Phone</th>
                  <th className="pb-3 font-bold">Status</th>
                  <th className="pb-3 font-bold text-right pr-4">Secure Link Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {students.map((student) => {
                  const linkedStatus = student.isLinked !== false; // Default to true if undefined
                  const associatedSchool = schools.find((s) => s.id === student.schoolId);
                  return (
                    <tr key={student.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-bold text-white">{student.name}</td>
                      <td className="py-3 text-xs">{associatedSchool?.name || 'General Campus'}</td>
                      <td className="py-3 text-xs text-gray-400">{student.parentName}</td>
                      <td className="py-3 font-mono text-xs text-gray-400">{student.parentPhone}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                          linkedStatus 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/10'
                        }`}>
                          {linkedStatus ? 'LINK SECURED' : 'UNLINKED / SUSPENDED'}
                        </span>
                      </td>
                      <td className="py-3 text-right pr-4">
                        {linkedStatus ? (
                          <button
                            onClick={() => triggerLinkChange(student, false)}
                            className="rounded-lg bg-rose-500/15 border border-rose-500/25 text-rose-400 hover:bg-rose-500/25 px-3 py-1 text-xs font-bold transition active:scale-95"
                          >
                            Break Link (OTP Req)
                          </button>
                        ) : (
                          <button
                            onClick={() => triggerLinkChange(student, true)}
                            className="rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 px-3 py-1 text-xs font-bold transition active:scale-95"
                          >
                            Enable Link (OTP Req)
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= MODALS AND POPUPS ================= */}

      {/* Parent Modal */}
      {showParentModal && (
        <div className="fixed inset-0 z-50 bg-[#06080E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
              {editingParent ? 'Edit Parent Account' : 'Register Parent Account'}
            </h3>
            <form onSubmit={handleSaveParent} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Parent Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="Moses Mukasa"
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+256772444555"
                    value={pPhone}
                    onChange={(e) => setPPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">National ID (NIN)</label>
                  <input
                    type="text"
                    placeholder="CM89021102A12"
                    value={pNin}
                    onChange={(e) => setPNin(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                  />
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowParentModal(false)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] px-5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
                >
                  Save Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Vendor Modal */}
      {showVendorModal && (
        <div className="fixed inset-0 z-50 bg-[#06080E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
              {editingVendor ? 'Edit Vendor POS Outlet' : 'Register Vendor POS Outlet'}
            </h3>
            <form onSubmit={handleSaveVendor} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Shop / POS Name</label>
                <input
                  type="text"
                  required
                  placeholder="KPS Campus Canteen A"
                  value={vName}
                  onChange={(e) => setVName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Campus Campus Link</label>
                <select
                  value={vSchoolId}
                  onChange={(e) => setVSchoolId(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-gray-300 focus:border-[#c7515e] outline-none transition cursor-pointer"
                >
                  {schools.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">POS Phone Line</label>
                  <input
                    type="text"
                    required
                    placeholder="+256782111222"
                    value={vPhone}
                    onChange={(e) => setVPhone(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">POS Category</label>
                  <select
                    value={vType}
                    onChange={(e) => setVType(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-gray-300 focus:border-[#c7515e] outline-none transition cursor-pointer"
                  >
                    <option value="CANTEEN">School Canteen</option>
                    <option value="UNIFORMS">Uniform Store</option>
                    <option value="STATIONERY">Stationery Shop</option>
                    <option value="FEES_COLLECTOR">Fees Bursar</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVendorModal(false)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] px-5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
                >
                  Save POS Outlet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Modal */}
      {showStudentModal && (
        <div className="fixed inset-0 z-50 bg-[#06080E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-white/5 pb-3">
              Modify Student Ledger Record
            </h3>
            <form onSubmit={handleSaveStudent} className="space-y-4">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Student Full Name</label>
                <input
                  type="text"
                  required
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                />
              </div>
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block mb-1.5">Class / Form</label>
                <input
                  type="text"
                  required
                  value={sClass}
                  onChange={(e) => setSClass(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-white focus:border-[#c7515e] outline-none transition"
                />
              </div>
              <div className="flex items-center justify-end gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowStudentModal(false)}
                  className="rounded-xl bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-bold text-gray-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] px-5 py-2 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Secure OTP Challenge Modal for Parents */}
      {showLinkModal && (
        <div className="fixed inset-0 z-50 bg-[#06080E]/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B0F19] p-6 shadow-2xl space-y-5 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-[#c7515e]/10 flex items-center justify-center text-[#c7515e]">
              <ShieldAlert className="h-6 w-6" />
            </div>
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Parent OTP Authorization</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Modifying ledger connection for student <strong className="text-gray-300">{linkStudent?.name}</strong>.
                An SMS approval OTP request was dispatched to <strong className="text-gray-300">{linkStudent?.parentPhone}</strong>.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono">
              [DEMO GUARDIAN PASSCODE: <strong>1234</strong> or <strong>4321</strong>]
            </div>

            <form onSubmit={handleVerifyLinkOTP} className="space-y-4">
              <input
                type="text"
                required
                maxLength={4}
                placeholder="Enter 4-Digit Passcode"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center rounded-xl border border-white/10 bg-[#06080E] px-4 py-3 text-sm text-white font-mono tracking-[1em] focus:border-[#c7515e] outline-none transition"
              />

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowLinkModal(false)}
                  className="flex-1 rounded-xl bg-white/5 hover:bg-white/10 py-2.5 text-xs font-bold text-gray-300 transition"
                >
                  Decline
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-[#c7515e] hover:bg-[#a13f4a] py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
                >
                  Verify OTP
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}