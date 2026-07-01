import React, { useState, useEffect } from 'react';
import { Landmark, Key, BarChart3, ShieldCheck, RefreshCw, Smartphone, AlertTriangle, Users, UserPlus, Mail, Phone, CheckCircle, Trash2, Search, CreditCard, Printer, CheckSquare, Square } from 'lucide-react';
import { Student } from '../types';
import { useToast } from './ToastContext';
import StudentBulkUploader from './StudentBulkUploader';
import { QRCodeSVG } from 'qrcode.react';

export default function RoleSchoolAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  
  // School Admin sub-tab
  const [activeTab, setActiveTab] = useState<'STUDENTS' | 'STAFF' | 'CARDS'>('STUDENTS');
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [staff, setStaff] = useState<any[]>([]);

  // Staff creation form states
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState('Bursar');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');

  const toast = useToast();

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter students by school S1 (Kampala Parents) for this School Admin
        const filtered = data.filter((s: Student) => s.schoolId === 'S1');
        setStudents(filtered);
        setSelectedCardIds(filtered.map(s => s.id));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const res = await fetch('/api/staff');
      const data = await res.json();
      if (Array.isArray(data)) {
        setStaff(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchStaff();
  }, []);

  const triggerOtp = (student: Student) => {
    setSelectedStudent(student);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(otp);
    setOtpSent(true);
    setShowPinModal(true);
    console.log(`[School Admin] OTP Triggered for Parent at ${student.parentPhone}. Code is: ${otp}`);
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || newPin.length !== 4) return;

    if (enteredOtp !== simulatedOtp) {
      toast.error('Invalid simulated parent OTP challenge.');
      return;
    }

    try {
      const res = await fetch('/api/students/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          newPin,
          parentPhone: selectedStudent.parentPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`PIN reset successfully for ${selectedStudent.name}.`);
        setShowPinModal(false);
        setNewPin('');
        setEnteredOtp('');
        setOtpSent(false);
        fetchStudents();
      } else {
        toast.error(data.error || 'Failed to reset PIN.');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'Error occurred during PIN reset.');
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName || !staffPhone) {
      toast.error('Staff Name and Phone number are required.');
      return;
    }
    try {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: staffName,
          role: staffRole,
          phone: staffPhone,
          email: staffEmail
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Staff member "${staffName}" registered successfully.`);
        setStaffName('');
        setStaffPhone('');
        setStaffEmail('');
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to add staff member.');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!window.confirm('Are you sure you want to dismiss this staff member?')) return;
    try {
      const res = await fetch('/api/staff/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Staff member removed successfully.');
        fetchStaff();
      } else {
        toast.error(data.error || 'Failed to remove staff member.');
      }
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans antialiased text-gray-200 bg-[#06080E] p-4 md:p-6 rounded-2xl border border-white/5 shadow-xl">
      
      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Campus Registered</span>
            <h4 className="text-lg font-bold text-[#06065C]">Kampala Parents Primary</h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">School Revenue Ledger</span>
            <h4 className="text-2xl font-bold text-[#06065C]">15,000 <span className="text-sm text-gray-500">UGX</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Monitored Students</span>
            <h4 className="text-2xl font-bold text-[#06065C]">{students.length} <span className="text-sm text-gray-500">Accounts</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Smartphone className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Campus Sub-Tabs Switcher */}
      <div className="flex bg-[#0B0F19]/60 border border-white/5 p-1 rounded-xl max-w-md shrink-0">
        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeTab === 'STUDENTS'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Smartphone className="h-4 w-4" />
          <span>Students & PINs</span>
        </button>
        <button
          onClick={() => setActiveTab('STAFF')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeTab === 'STAFF'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>Manage Staff</span>
        </button>
        <button
          onClick={() => setActiveTab('CARDS')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wide uppercase transition-all ${
            activeTab === 'CARDS'
              ? 'bg-[#c7515e] text-white shadow-lg shadow-[#c7515e]/20'
              : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
          }`}
        >
          <CreditCard className="h-4 w-4" />
          <span>Student Cards</span>
        </button>
      </div>

      {activeTab === 'STUDENTS' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Student Spend Analytics Table */}
          <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <h3 className="text-sm font-bold text-[#06065C] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#c7515e]" />
                Pocket Money Registry & PIN Monitor
              </h3>
              <button 
                onClick={fetchStudents} 
                className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-white/5 transition"
                title="Refresh Registry"
              >
                <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin text-[#c7515e]' : ''}`} />
              </button>
            </div>

            {/* Real-time search bar */}
            <div className="relative mb-4">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search students by name, admission #, class..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-[#06080E] text-slate-800 placeholder-gray-500 focus:border-[#c7515e] outline-none transition"
              />
            </div>

            <div className="overflow-x-auto min-h-[300px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    <th className="pb-3 px-2">Student</th>
                    <th className="pb-3 px-2">Admission #</th>
                    <th className="pb-3 px-2">Class</th>
                    <th className="pb-3 px-2">Limit Setting</th>
                    <th className="pb-3 px-2">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {students
                    .filter(stud => {
                      if (!studentSearch) return true;
                      const q = studentSearch.toLowerCase();
                      return (
                        stud.name.toLowerCase().includes(q) ||
                        stud.admissionNo.toLowerCase().includes(q) ||
                        stud.class.toLowerCase().includes(q)
                      );
                    })
                    .map((stud) => (
                      <tr key={stud.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-2 flex items-center gap-3">
                          <img src={stud.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                          <span className="font-bold text-[#06065C]">{stud.name}</span>
                        </td>
                        <td className="py-4 px-2 font-mono text-gray-400 text-xs">{stud.admissionNo}</td>
                        <td className="py-4 px-2 text-xs">{stud.class}</td>
                        <td className="py-4 px-2 font-mono text-emerald-400 text-xs">{stud.noPinLimit.toLocaleString()} UGX</td>
                        <td className="py-4 px-2">
                          <button
                            onClick={() => triggerOtp(stud)}
                            className="rounded-lg border border-[#c7515e]/30 bg-[#c7515e]/10 hover:bg-[#c7515e] hover:text-white px-3 py-1.5 text-[#c7515e] text-xs font-semibold transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            <Key className="h-3.5 w-3.5" />
                            Reset PIN
                          </button>
                        </td>
                      </tr>
                    ))}
                  {students.filter(stud => {
                    if (!studentSearch) return true;
                    const q = studentSearch.toLowerCase();
                    return (
                      stud.name.toLowerCase().includes(q) ||
                      stud.admissionNo.toLowerCase().includes(q) ||
                      stud.class.toLowerCase().includes(q)
                    );
                  }).length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">
                        {students.length === 0 ? "No students registered to this campus." : "No student records matched search query."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Operational Security Guide */}
          <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldCheck className="h-5 w-5 text-amber-400" />
              <h3 className="text-sm font-bold text-[#06065C]">Institutional PIN Security</h3>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              In compliance with student financial privacy guidelines, School Admins are strictly forbidden from manual overrides.
            </p>
            <div className="rounded-xl bg-[#06080E] border border-white/5 p-5 space-y-3">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block border-b border-white/5 pb-2 mb-3">Regulatory Sequence</span>
              <ol className="list-decimal pl-4 space-y-2 text-xs text-gray-300">
                <li>Admin clicks <span className="font-semibold text-[#ED0101]">"Reset PIN"</span> which sends an encrypted OTP via Collecto SMS to the registered Parent phone number.</li>
                <li>Parent reads OTP to School Admin (verifying identity).</li>
                <li>Admin inputs OTP and types the new 4-digit PIN.</li>
              </ol>
            </div>
          </div>

          {/* Bulk Student Enrollment CSV Center */}
          <div className="lg:col-span-12">
            <StudentBulkUploader onUploadSuccess={fetchStudents} />
          </div>

        </div>
      )}

      {activeTab === 'STAFF' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Staff List Table */}
          <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="text-sm font-bold text-[#06065C] flex items-center gap-2">
                <Users className="h-5 w-5 text-[#c7515e]" />
                Institutional Staff & Faculty Directory
              </h3>
              <button 
                onClick={fetchStaff} 
                className="text-gray-400 hover:text-gray-200 p-2 rounded-lg hover:bg-white/5 transition"
                title="Refresh Staff"
              >
                <RefreshCw className="h-4.5 w-4.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-[10px] text-gray-500 uppercase tracking-wider font-bold">
                    <th className="pb-3 px-2">Staff Member</th>
                    <th className="pb-3 px-2">Assigned Role</th>
                    <th className="pb-3 px-2">Primary Phone</th>
                    <th className="pb-3 px-2">Email Address</th>
                    <th className="pb-3 px-2 text-right pr-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-sm text-gray-300">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-2 font-bold text-[#06065C]">{s.name}</td>
                      <td className="py-4 px-2 text-xs">
                        <span className="bg-[#c7515e]/15 text-[#c7515e] border border-[#c7515e]/10 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                          {s.role}
                        </span>
                      </td>
                      <td className="py-4 px-2 font-mono text-gray-400 text-xs">{s.phone}</td>
                      <td className="py-4 px-2 text-xs text-gray-400">{s.email || 'N/A'}</td>
                      <td className="py-4 px-2 text-right pr-4">
                        <button
                          onClick={() => handleDeleteStaff(s.id)}
                          className="text-gray-500 hover:text-rose-500 transition-colors p-1"
                          title="Dismiss Staff"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">No registered institutional staff members.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Staff Member Form */}
          <div className="lg:col-span-4 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl space-y-4 h-fit">
            <div className="flex items-center gap-2 border-b border-white/5 pb-4">
              <UserPlus className="h-5 w-5 text-[#c7515e]" />
              <h3 className="text-sm font-bold text-[#06065C]">Enroll Staff Member</h3>
            </div>
            
            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    placeholder="e.g. Juliet Nabassa"
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-slate-800 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Campus Role</label>
                <select
                  value={staffRole}
                  onChange={(e) => setStaffRole(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-slate-800 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition cursor-pointer appearance-none"
                >
                  <option value="Bursar">School Bursar</option>
                  <option value="Teacher">Senior Teacher</option>
                  <option value="Registrar">Campus Registrar</option>
                  <option value="Dean">Dean of Students</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Phone Line</label>
                <div className="relative">
                  <span className="absolute left-3 top-3.5 text-xs font-mono text-gray-500">+256</span>
                  <input
                    type="text"
                    required
                    value={staffPhone}
                    onChange={(e) => setStaffPhone(e.target.value)}
                    placeholder="772345678"
                    className="w-full rounded-xl border border-white/10 bg-[#06080E] pl-12 pr-4 py-2.5 text-xs text-slate-800 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Email Address (Optional)</label>
                <input
                  type="email"
                  value={staffEmail}
                  onChange={(e) => setStaffEmail(e.target.value)}
                  placeholder="juliet@school.ac.ug"
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-xs text-slate-800 focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#c7515e] hover:bg-[#b04753] py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
              >
                Add Staff to Roster
              </button>
            </form>
          </div>
        </div>
      )}

      {activeTab === 'CARDS' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-4 sm:p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-[#c7515e]" />
                  NFC QR Card Generator & Publisher
                </h3>
                <p className="text-xs text-gray-400 mt-1">Batch print cards with unique secure scan QR codes and student photographs.</p>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (selectedCardIds.length === students.length) {
                      setSelectedCardIds([]);
                    } else {
                      setSelectedCardIds(students.map(s => s.id));
                    }
                  }}
                  className="rounded-lg border border-white/10 hover:bg-white/5 px-3 py-2 text-xs text-gray-300 font-semibold transition"
                >
                  {selectedCardIds.length === students.length ? "Deselect All" : "Select All"}
                </button>
                <button
                  onClick={() => {
                    if (selectedCardIds.length === 0) {
                      toast.error("Please select at least one card to print.");
                      return;
                    }
                    window.print();
                  }}
                  disabled={selectedCardIds.length === 0}
                  className="rounded-lg bg-[#c7515e] hover:bg-[#b04753] disabled:opacity-40 disabled:hover:bg-[#c7515e] px-4 py-2 text-xs font-bold text-white transition flex items-center gap-1.5 shadow-md shadow-[#c7515e]/20"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Selected ({selectedCardIds.length})</span>
                </button>
              </div>
            </div>

            {/* Quick search inside Card Generator */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search students to generate cards..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-white/10 bg-[#06080E] text-white placeholder-gray-500 focus:border-[#c7515e] outline-none transition"
              />
            </div>

            {/* Grid of Card Previews */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students
                .filter(s => {
                  if (!studentSearch) return true;
                  const q = studentSearch.toLowerCase();
                  return (
                    s.name.toLowerCase().includes(q) ||
                    s.admissionNo.toLowerCase().includes(q) ||
                    s.class.toLowerCase().includes(q)
                  );
                })
                .map((student) => {
                  const isSelected = selectedCardIds.includes(student.id);
                  return (
                    <div 
                      key={student.id} 
                      className={`relative rounded-2xl p-2 transition-all ${
                        isSelected 
                          ? 'bg-[#c7515e]/5 border-2 border-[#c7515e]' 
                          : 'bg-white border border-white/5 hover:border-white/10'
                      }`}
                    >
                      {/* Selection indicator & overlay controls */}
                      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedCardIds(prev => 
                              prev.includes(student.id) 
                                ? prev.filter(id => id !== student.id)
                                : [...prev, student.id]
                            );
                          }}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition active:scale-95"
                          title={isSelected ? "Deselect Card" : "Select Card"}
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-400" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCardIds([student.id]);
                            setTimeout(() => {
                              window.print();
                            }, 100);
                          }}
                          className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white backdrop-blur-sm transition active:scale-95"
                          title="Print Single Card"
                        >
                          <Printer className="h-4 w-4 text-[#c7515e]" />
                        </button>
                      </div>

                      {/* Card Content Mockup */}
                      <div className="w-full h-[210px] rounded-xl bg-gradient-to-br from-[#06065C] to-[#040440] text-white p-4 flex flex-col justify-between relative overflow-hidden select-none">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#ED0101]/10 rounded-full blur-2xl pointer-events-none" />
                        
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 rounded-full bg-[#ED0101] flex items-center justify-center font-bold text-[8px] text-white">K</div>
                            <div>
                              <h5 className="text-[8px] font-bold uppercase tracking-widest text-white leading-none">Kampala Parents</h5>
                              <span className="text-[6px] text-[#ED0101] tracking-wider uppercase font-bold leading-none">Primary School</span>
                            </div>
                          </div>
                          <span className="text-[7px] bg-[#ED0101] text-white font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase">
                            Student Wallet
                          </span>
                        </div>

                        {/* Middle photo/info */}
                        <div className="flex items-center gap-3 py-1.5 flex-1">
                          <div className="w-14 h-14 rounded-lg border border-white/20 bg-white/5 overflow-hidden shrink-0 flex items-center justify-center shadow-inner relative">
                            <img src={student.avatarUrl} alt="" className="w-full h-full object-cover animate-fade-in" referrerPolicy="no-referrer" />
                          </div>
                          <div className="flex-1 min-w-0 space-y-0.5">
                            <h4 className="text-xs font-bold text-white leading-tight truncate">{student.name}</h4>
                            <div className="space-y-0.5 text-[9px] text-slate-300 font-mono">
                              <div><span className="text-slate-400">CLASS:</span> <span className="text-white font-semibold">{student.class}</span></div>
                              <div><span className="text-slate-400">ADM:</span> <span className="text-white font-semibold">{student.admissionNo}</span></div>
                            </div>
                          </div>
                          <div className="bg-white p-1 rounded-lg shrink-0 border border-white/20 flex items-center justify-center" style={{ width: '48px', height: '48px' }}>
                            <QRCodeSVG value={student.qrHash} size={40} level="H" />
                          </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/15 pt-1 flex items-center justify-between text-[7px] font-mono text-slate-400">
                          <div className="flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                            <span>NFC / SCAN READY</span>
                          </div>
                          <span className="text-white font-bold">{student.qrHash}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              
              {students.length === 0 && (
                <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                  No students registered to generate cards for.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PIN Reset Modal (Simulated with OTP helper) */}
      {showPinModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0F1424] p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="bg-[#c7515e]/20 p-2 rounded-full">
                <Key className="h-5 w-5 text-[#c7515e]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Reset PIN</h4>
                <p className="text-xs text-gray-400">{selectedStudent.name}</p>
              </div>
            </div>

            <div className="rounded-xl bg-[#06080E] p-4 border border-[#c7515e]/20 flex flex-col gap-1.5">
              <span className="font-bold uppercase text-[10px] text-[#c7515e] tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="h-3 w-3" /> SMS Sim Gateway
              </span>
              <span className="text-xs text-gray-400">Target: {selectedStudent.parentPhone}</span>
              <span className="text-xs text-white mt-1">SIMULATED OTP CODE: <span className="text-emerald-400 font-mono font-bold text-sm bg-emerald-400/10 px-1.5 py-0.5 rounded ml-1">{simulatedOtp}</span></span>
            </div>

            <form onSubmit={handleResetPin} className="space-y-4 pt-2">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Parent OTP Challenge</label>
                <input
                  type="text"
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code..."
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-sm text-white focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">New 4-Digit Student PIN</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="• • • •"
                  className="w-full rounded-xl border border-white/10 bg-[#06080E] px-4 py-2.5 text-lg text-white font-mono tracking-[1em] text-center focus:border-[#c7515e] focus:ring-1 focus:ring-[#c7515e] outline-none transition placeholder:tracking-normal placeholder:text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#c7515e] hover:bg-[#a6434e] px-5 py-2.5 text-xs font-bold text-white transition active:scale-95 shadow-lg shadow-[#c7515e]/20"
                >
                  Authorize PIN Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT TARGET CONTAINER */}
      <div id="printable-cards-container">
        <div className="print-card-grid">
          {students
            .filter(s => selectedCardIds.includes(s.id))
            .map(student => (
              <div 
                key={student.id} 
                className="print-card p-4 border-2 border-[#06065C] rounded-2xl bg-white w-[350px] h-[220px] flex flex-col justify-between overflow-hidden"
                style={{
                  printColorAdjust: 'exact',
                  WebkitPrintColorAdjust: 'exact',
                  boxSizing: 'border-box'
                }}
              >
                {/* Card header */}
                <div className="flex items-center justify-between border-b-2 border-[#06065C]/20 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-[#ED0101] flex items-center justify-center font-bold text-[10px] text-white">K</div>
                    <div>
                      <h5 className="text-[10px] font-bold uppercase tracking-widest text-[#06065C] leading-none" style={{ margin: 0 }}>Kampala Parents</h5>
                      <span className="text-[7px] text-[#ED0101] tracking-wider uppercase font-bold leading-none" style={{ display: 'block', marginTop: '2px' }}>Primary School</span>
                    </div>
                  </div>
                  <span className="text-[8px] bg-[#ED0101] text-white font-bold px-2 py-0.5 rounded-full tracking-wider uppercase">
                    Student Wallet
                  </span>
                </div>

                {/* Card content */}
                <div className="flex items-center gap-4 py-2 flex-1">
                  <div className="w-16 h-16 rounded-xl border-2 border-[#06065C]/20 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center">
                    <img 
                      src={student.avatarUrl} 
                      alt="" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                      style={{ display: 'block', width: '100%', height: '100%' }} 
                    />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-sm font-extrabold text-[#06065C] leading-tight truncate" style={{ margin: 0 }}>{student.name}</h4>
                    <div className="space-y-0.5 text-[10px] text-[#334155] font-mono">
                      <div><span style={{ color: '#64748b' }}>CLASS:</span> <strong className="text-[#06065C]">{student.class}</strong></div>
                      <div><span style={{ color: '#64748b' }}>ADM NO:</span> <strong className="text-[#06065C]">{student.admissionNo}</strong></div>
                    </div>
                  </div>
                  <div className="bg-white p-1 rounded-lg shrink-0 border-2 border-[#06065C]/10 flex items-center justify-center" style={{ width: '64px', height: '64px' }}>
                    <QRCodeSVG 
                      value={student.qrHash} 
                      size={56} 
                      level="H"
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>

                {/* Card footer */}
                <div className="border-t-2 border-[#06065C]/15 pt-2 flex items-center justify-between text-[8px] font-mono text-[#475569]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" style={{ display: 'inline-block' }} />
                    <span className="font-bold text-[#06065C]">NFC / SECURE CARD</span>
                  </div>
                  <span className="text-[#ED0101] font-bold font-mono">{student.qrHash}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

    </div>
  );
}