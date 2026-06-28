import React, { useState } from 'react';
import Login, { LoggedInUser } from './components/Login'; // Adjust path if Login is placed in a components directory
import { ErrorBoundary } from './components/ErrorBoundary';
import RoleSuperAdmin from './components/RoleSuperAdmin';
import RoleBusinessAdmin from './components/RoleBusinessAdmin';
import RoleAgent from './components/RoleAgent';
import RoleSchoolAdmin from './components/RoleSchoolAdmin';
import RoleVendorPOS from './components/RoleVendorPOS';
import RoleParent from './components/RoleParent';
import MicroLoans from './components/MicroLoans';
import QuickActionsFAB from './components/QuickActionsFAB';
import { useToast } from './components/ToastContext';
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

const BRAND = '#ED0101';
const BRAND_LIGHT = 'rgba(237,1,1,0.08)';
const BRAND_BORDER = 'rgba(237,1,1,0.25)';
const NAVY = '#06065C';

export default function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [userSubTab, setUserSubTab] = useState<'DASHBOARD' | 'LOANS'>('DASHBOARD');
  const toast = useToast();

  const [resetId, setResetId] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);

  const handleResetDb = async () => {
    setResetLoading(true);
    try {
      const res = await fetch('/api/setup/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetId(prev => prev + 1);
        toast.success('Database successfully reset.');
      } else {
        toast.error(data.error || 'Failed to reset database.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Error occurred during database reset.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleLoginSuccess = (loggedInUser: LoggedInUser) => {
    setUser(loggedInUser);
    setUserSubTab('DASHBOARD');
  };

  const roleLabel = (role: LoggedInUser['role']) =>
    role.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="min-h-screen font-sans" style={{ background: 'var(--surface-0, #f5f5f3)', color: 'var(--text-primary, #1a1a18)' }}>

      {/* ── Main Routing Content ────────────────────────────────── */}
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        /* ── Logged-in dashboard ─────────────────────────────── */
        <div className="max-w-[1200px] mx-auto px-4 py-6 md:p-6 pb-12">

          {/* Inner Dashboard Header (Subtle, custom-contained, no full navbar) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-black/5">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="logo.png"
                alt="Logo"
                style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              <span style={{
                fontSize: 11, fontWeight: 600,
                background: BRAND_LIGHT, color: BRAND, border: `0.5px solid ${BRAND_BORDER}`,
                borderRadius: 20, padding: '4px 12px',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, display: 'inline-block' }} />
                Authorized Portal
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--surface-1, #ffffff)',
                border: '0.5px solid rgba(0,0,0,0.08)',
                borderRadius: 10, padding: '6px 14px 6px 8px',
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: 8,
                  background: BRAND_LIGHT, color: BRAND,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 600, fontSize: 11,
                }}>
                  {user.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{user.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted, #888)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {roleLabel(user.role)}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Sign out"
                  style={{
                    marginLeft: 6, padding: 6, borderRadius: 6, border: 'none',
                    background: 'transparent', cursor: 'pointer', color: 'var(--text-muted, #888)',
                    display: 'flex', alignItems: 'center',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = BRAND)}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted, #888)')}
                >
                  <LogOut size={15} />
                </button>
              </div>
            </div>
          </div>

          {/* Sub-tabs for Parent / Vendor */}
          {(user.role === 'PARENT' || user.role === 'VENDOR') && (
            <div className="flex border-b border-black/10 mb-5 overflow-x-auto scrollbar-none whitespace-nowrap gap-1">
              { SuffixedTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setUserSubTab(tab)}
                  style={{
                    padding: '10px 14px', fontSize: 13, fontWeight: 500,
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontFamily: 'inherit',
                    borderBottom: `2px solid ${userSubTab === tab ? BRAND : 'transparent'}`,
                    color: userSubTab === tab ? BRAND : 'var(--text-secondary, #666)',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab === 'DASHBOARD'
                    ? (user.role === 'PARENT' ? 'Parent Portal' : 'Merchant POS Counter')
                    : 'Apply for Micro-Loans'}
                </button>
              ))}
            </div>
          )}

          {/* Dashboard panel */}
          <div style={{
            borderRadius: 16, border: '0.5px solid rgba(0,0,0,0.08)',
            background: 'var(--surface-1, #ffffff)',
            minHeight: 400, overflow: 'hidden',
          }}>
            <ErrorBoundary key={`${user.role}_${userSubTab}_${resetId}`}>
              <div className="p-4 md:p-6 lg:p-8">
                {user.role === 'SUPER_ADMIN'    && <RoleSuperAdmin />}
                {user.role === 'BUSINESS_ADMIN' && <RoleBusinessAdmin />}
                {user.role === 'AGENT'          && <RoleAgent />}
                {user.role === 'SCHOOL_ADMIN'   && <RoleSchoolAdmin />}

                {user.role === 'VENDOR' && (
                  userSubTab === 'DASHBOARD'
                    ? <RoleVendorPOS userPhone={user.phone} />
                    : <MicroLoans defaultBorrowerId="V1" defaultBorrowerType="VENDOR" />
                )}

                {user.role === 'PARENT' && (
                  userSubTab === 'DASHBOARD'
                    ? <RoleParent userPhone={user.phone} />
                    : <MicroLoans defaultBorrowerId="P1" defaultBorrowerType="PARENT" />
                )}
              </div>
            </ErrorBoundary>
          </div>

          {/* Footer info strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-5">
            {[
              ['Collecto Gateway Protocol', 'All mobile money deposits and payouts initiate asynchronously. Auto-polling prevents blocking and resolves state idempotently.'],
              ['Atomic Ledger Splits', 'Commission allocations (Platform & Institutional School Shares) process instantly upon POS scans, ensuring zero balance drift.'],
              ['Credit Scoring Matrix', 'Loans (Phase 1.5) analyze real-time 30-day POS checkout consistency before instant ledger disbursement.'],
            ].map(([title, body]) => (
              <div key={title} style={{
                padding: '14px 16px', borderRadius: 10,
                background: 'var(--surface-1, #fff)',
                border: '0.5px solid rgba(0,0,0,0.08)',
              }}>
                <div style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: BRAND, marginBottom: 6 }}>
                  {title}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary, #666)', lineHeight: 1.6 }}>
                  {body}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions Floating Portal */}
          <QuickActionsFAB user={user} />
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const SuffixedTabs = ['DASHBOARD', 'LOANS'] as const;