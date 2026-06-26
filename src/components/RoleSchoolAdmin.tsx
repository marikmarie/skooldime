import React, { useState, useEffect } from 'react';
import { Landmark, Key, BarChart3, ShieldCheck, RefreshCw, Smartphone, AlertTriangle } from 'lucide-react';
import { Student } from '../types';

export default function RoleSchoolAdmin() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/students');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Filter students by school S1 (Kampala Parents) for this School Admin
        setStudents(data.filter((s: Student) => s.schoolId === 'S1'));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const triggerOtp = (student: Student) => {
    setSelectedStudent(student);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    setSimulatedOtp(otp);
    setOtpSent(true);
    setShowPinModal(true);
    setSuccessMsg('');
    console.log(`[School Admin] OTP Triggered for Parent at ${student.parentPhone}. Code is: ${otp}`);
  };

  const handleResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');
    if (!selectedStudent || newPin.length !== 4) return;

    if (enteredOtp !== simulatedOtp) {
      setErrorMsg('Invalid simulated parent OTP challenge.');
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
        setSuccessMsg(`PIN reset successfully for ${selectedStudent.name}.`);
        setShowPinModal(false);
        setNewPin('');
        setEnteredOtp('');
        setOtpSent(false);
        fetchStudents();
      } else {
        setErrorMsg(data.error || 'Failed to reset PIN.');
      }
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || 'Error occurred during PIN reset.');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      
      {/* Notifications */}
      {(successMsg || errorMsg) && (
        <div className={`rounded-xl p-4 flex items-center gap-3 text-xs ${successMsg ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'}`}>
          {successMsg ? <ShieldCheck className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
          <span className="font-medium">{successMsg || errorMsg}</span>
        </div>
      )}

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Campus Registered</span>
            <h4 className="text-lg font-bold text-white">Kampala Parents Primary</h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Landmark className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">School Revenue Ledger</span>
            <h4 className="text-2xl font-bold text-white">15,000 <span className="text-sm text-gray-500">UGX</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <BarChart3 className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Monitored Students</span>
            <h4 className="text-2xl font-bold text-white">{students.length} <span className="text-sm text-gray-500">Accounts</span></h4>
          </div>
          <div className="rounded-xl bg-[#c7515e]/10 p-3 text-[#c7515e]">
            <Smartphone className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Student Spend Analytics Table */}
        <div className="lg:col-span-8 rounded-2xl border border-white/5 bg-[#0B0F19] p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-[#c7515e]" />
              Pocket Money Registry & PIN Monitor
            </h3>
            <button 
              onClick={fetchStudents} 
              className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/5 transition"
              title="Refresh Registry"
            >
              <RefreshCw className={`h-4.5 w-4.5 ${loading ? 'animate-spin text-[#c7515e]' : ''}`} />
            </button>
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
                {students.map((stud) => (
                  <tr key={stud.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-4 px-2 flex items-center gap-3">
                      <img src={stud.avatarUrl} alt="" className="w-8 h-8 rounded-full border border-white/10" referrerPolicy="no-referrer" />
                      <span className="font-semibold text-white">{stud.name}</span>
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
                {students.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-500 text-xs">No students registered to this campus.</td>
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
            <h3 className="text-sm font-bold text-white">Institutional PIN Security</h3>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            In compliance with student financial privacy guidelines, School Admins are strictly forbidden from manual overrides.
          </p>
          <div className="rounded-xl bg-[#06080E] border border-white/5 p-5 space-y-3">
            <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold block border-b border-white/5 pb-2 mb-3">Regulatory Sequence</span>
            <ol className="list-decimal pl-4 space-y-2 text-xs text-gray-300">
              <li>Admin clicks <span className="font-semibold text-white">"Reset PIN"</span> which sends an encrypted OTP via Collecto SMS to the registered Parent phone number.</li>
              <li>Parent reads OTP to School Admin (verifying identity).</li>
              <li>Admin inputs OTP and types the new 4-digit PIN.</li>
            </ol>
          </div>
        </div>

      </div>

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

    </div>
  );
}