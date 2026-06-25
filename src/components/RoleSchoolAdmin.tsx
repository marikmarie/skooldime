import React, { useState, useEffect } from 'react';
import { Landmark, Key, BarChart3, ShieldCheck, RefreshCw, Smartphone } from 'lucide-react';
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
    <div className="space-y-6">
      
      {successMsg && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3 text-xs text-emerald-300">
          <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-4 flex items-center gap-3 text-xs text-rose-300">
          <span className="text-rose-400 shrink-0 text-base font-bold">⚠️</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Campus Registered</span>
            <h4 className="text-xl font-bold text-white mt-1">Kampala Parents Primary</h4>
          </div>
          <div className="rounded-lg bg-sky-500/10 p-2.5 text-sky-400">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">School Revenue Ledger</span>
            <h4 className="text-xl font-bold text-emerald-400 mt-1">15,000 UGX</h4>
          </div>
          <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-400">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#0B0F19] p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-mono text-gray-500 uppercase font-bold tracking-widest">Monitored Students</span>
            <h4 className="text-xl font-bold text-white mt-1">{students.length} Accounts</h4>
          </div>
          <div className="rounded-lg bg-purple-500/10 p-2.5 text-purple-400">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Student Spend Analytics Table */}
        <div className="lg:col-span-8 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <h3 className="text-sm font-medium text-gray-200">Pocket Money Registry & PIN-State Monitor</h3>
            <button onClick={fetchStudents} className="text-gray-400 hover:text-white p-1">
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-mono">
                  <th className="pb-2.5">Student</th>
                  <th className="pb-2.5">Admission #</th>
                  <th className="pb-2.5">Class</th>
                  <th className="pb-2.5">Limit Setting</th>
                  <th className="pb-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-gray-300">
                {students.map((stud) => (
                  <tr key={stud.id}>
                    <td className="py-3 flex items-center gap-2.5">
                      <img src={stud.avatarUrl} alt="" className="w-7 h-7 rounded-full bg-white/10" referrerPolicy="no-referrer" />
                      <span className="font-semibold text-white">{stud.name}</span>
                    </td>
                    <td className="py-3 font-mono text-gray-400">{stud.admissionNo}</td>
                    <td className="py-3">{stud.class}</td>
                    <td className="py-3 font-mono text-gray-400">{stud.noPinLimit.toLocaleString()} UGX</td>
                    <td className="py-3">
                      <button
                        onClick={() => triggerOtp(stud)}
                        className="rounded border border-white/10 bg-white/5 hover:bg-white/10 px-2.5 py-1 text-gray-300 text-[11px] font-medium transition flex items-center gap-1"
                      >
                        <Key className="h-3 w-3" />
                        Reset PIN
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Operational Security Guide */}
        <div className="lg:col-span-4 rounded-xl border border-white/5 bg-[#0B0F19] p-5 shadow-lg space-y-4">
          <h3 className="text-sm font-medium text-gray-200 border-b border-white/5 pb-3">Institutional PIN reset security</h3>
          <p className="text-xs text-gray-400 leading-relaxed">
            In compliance with student financial privacy guidelines, School Admins are strictly forbidden from manual overrides.
          </p>
          <div className="rounded-lg bg-[#06080E]/60 border border-white/5 p-3.5 space-y-2 text-xs text-gray-400">
            <span className="text-gray-200 font-semibold block">Regulatory Sequence:</span>
            <ol className="list-decimal pl-4 space-y-1 text-[11px]">
              <li>Admin clicks "Reset PIN" which sends an encrypted OTP via Collecto SMS to the registered Parent phone number.</li>
              <li>Parent reads OTP to School Admin (verifying identity).</li>
              <li>Admin inputs OTP and types the new 4-digit PIN.</li>
            </ol>
          </div>
        </div>

      </div>

      {/* PIN Reset Modal (Simulated with OTP helper) */}
      {showPinModal && selectedStudent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-[#0F1424] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-3">
              <Key className="h-5 w-5 text-sky-400" />
              <h4 className="text-sm font-semibold text-white">Reset PIN: {selectedStudent.name}</h4>
            </div>

            <div className="rounded bg-[#06080E] p-3 text-[11px] font-mono text-amber-300 border border-amber-500/20 flex flex-col gap-1">
              <span className="font-semibold uppercase text-[9px] text-gray-500 tracking-wider">SMS Sim Gateway:</span>
              <span>Parent Phone: {selectedStudent.parentPhone}</span>
              <span className="text-white mt-1">SIMULATED SMS OTP CODE: <span className="text-emerald-400 font-bold">{simulatedOtp}</span></span>
            </div>

            <form onSubmit={handleResetPin} className="space-y-3.5">
              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">Parent OTP Challenge</label>
                <input
                  type="text"
                  required
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP code..."
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block">New 4-Digit Student PIN</label>
                <input
                  type="password"
                  required
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="e.p. 1234"
                  className="w-full mt-1 rounded border border-white/10 bg-[#06080E] px-3 py-1.5 text-xs text-gray-300 font-mono tracking-widest text-center"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="rounded border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-sky-600 hover:bg-sky-500 px-4 py-1.5 text-xs font-semibold text-white transition active:scale-95"
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
