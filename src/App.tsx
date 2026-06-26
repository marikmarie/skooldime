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
import {
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  LogOut,
} from 'lucide-react';

const BRAND = '#c7515e';
const BRAND_LIGHT = 'rgba(199,81,94,0.10)';
const BRAND_BORDER = 'rgba(199,81,94,0.28)';

export default function App() {
  const [user, setUser] = useState<LoggedInUser | null>(null);
  const [userSubTab, setUserSubTab] = useState<'DASHBOARD' | 'LOANS'>('DASHBOARD');

  const [resetId, setResetId] = useState(0);
  const [resetLoading, setResetLoading] = useState(false);
  const [globalSuccess, setGlobalSuccess] = useState('');
  const [globalError, setGlobalError] = useState('');

  const handleResetDb = async () => {
    setResetLoading(true);
    setGlobalSuccess('');
    setGlobalError('');
    try {
      const res = await fetch('/api/setup/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setResetId(prev => prev + 1);
        setGlobalSuccess('Database successfully reset.');
        setTimeout(() => setGlobalSuccess(''), 5000);
      } else {
        setGlobalError(data.error || 'Failed to reset database.');
      }
    } catch (e: any) {
      setGlobalError(e.message || 'Error occurred during database reset.');
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

      {/* ── Header ─────────────────────────────────────────────── */}
      <header
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 24px',
          borderBottom: '0.5px solid rgba(0,0,0,0.08)',
          background: 'var(--surface-1, #ffffff)',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: BRAND,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, color: '#fff', fontSize: 15, overflow: 'hidden',
          }}>
            <img
              src="logo.png"
              alt="skoolDime"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <span style={{ position: 'absolute' }}>S</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: '-0.3px' }}>
            <span style={{ color: BRAND }}>skool</span>Dime
          </span>
          {user && (
            <span style={{
              fontSize: 10, fontWeight: 500,
              background: BRAND_LIGHT, color: BRAND, border: `0.5px solid ${BRAND_BORDER}`,
              borderRadius: 20, padding: '3px 10px',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: BRAND, display: 'inline-block' }} />
              Authorized
            </span>
          )}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {user && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--surface-2, #fafaf8)',
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
              <div>
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
          )}

          {/* <button
            onClick={handleResetDb}
            disabled={resetLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8,
              border: '0.5px solid rgba(0,0,0,0.12)',
              background: 'var(--surface-2, #fafaf8)',
              color: 'var(--text-secondary, #555)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
              opacity: resetLoading ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: resetLoading ? 'spin 1s linear infinite' : 'none' }} />
            Reset state
          </button> */}
        </div>
      </header>

      {/* ── Global banners ──────────────────────────────────────── */}
      {globalSuccess && (
        <div style={{
          margin: '12px 24px 0', borderRadius: 8,
          background: 'rgba(16,185,129,0.07)', border: '0.5px solid rgba(16,185,129,0.25)',
          padding: '10px 14px', fontSize: 12, color: '#059669',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <CheckCircle2 size={15} /> {globalSuccess}
        </div>
      )}
      {globalError && (
        <div style={{
          margin: '12px 24px 0', borderRadius: 8,
          background: 'rgba(239,68,68,0.07)', border: '0.5px solid rgba(239,68,68,0.22)',
          padding: '10px 14px', fontSize: 12, color: '#dc2626',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={15} /> {globalError}
        </div>
      )}

      {/* ── Main Routing Content ────────────────────────────────── */}
      {!user ? (
        <Login onLoginSuccess={handleLoginSuccess} />
      ) : (
        /* ── Logged-in dashboard ─────────────────────────────── */
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 48px' }}>

          {/* Sub-tabs for Parent / Vendor */}
          {(user.role === 'PARENT' || user.role === 'VENDOR') && (
            <div style={{ display: 'flex', borderBottom: '0.5px solid rgba(0,0,0,0.08)', marginBottom: 20, gap: 2 }}>
              { SuffixedTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setUserSubTab(tab)}
                  style={{
                    padding: '10px 20px', fontSize: 12, fontWeight: 500,
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
              <div style={{ padding: '24px 28px' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
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
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

const SuffixedTabs = ['DASHBOARD', 'LOANS'] as const;