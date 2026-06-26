import React, { useState } from 'react';
import { User, Lock, AlertTriangle } from 'lucide-react';

export interface LoggedInUser {
  id: string;
  username: string;
  role: 'SUPER_ADMIN' | 'BUSINESS_ADMIN' | 'AGENT' | 'SCHOOL_ADMIN' | 'VENDOR' | 'PARENT';
  name: string;
  phone: string;
  schoolId?: string;
}

interface LoginProps {
  onLoginSuccess: (user: LoggedInUser) => void;
}

const BRAND = '#c7515e';
const BRAND_HOVER = '#b8404d';
const BRAND_LIGHT = 'rgba(199,81,94,0.10)';

const mockUsers: Record<string, LoggedInUser> = {
  moses_parent:  { id: 'U6', username: 'moses_parent',  role: 'PARENT',         name: 'Moses Mukasa',             phone: '+256772444555' },
  superadmin:    { id: 'U1', username: 'superadmin',    role: 'SUPER_ADMIN',    name: 'Alinda Robert (HQ)',       phone: '+256700000001' },
  central_admin: { id: 'U2', username: 'central_admin', role: 'BUSINESS_ADMIN', name: 'Nakimbugwe Stella',        phone: '+256700000002' },
  agent_peter:   { id: 'U3', username: 'agent_peter',   role: 'AGENT',          name: 'Peter Ssekabira',          phone: '+256700000003' },
  kps_bursar:    { id: 'U4', username: 'kps_bursar',    role: 'SCHOOL_ADMIN',   name: 'Kato Charles (Bursar)',    phone: '+256700000004', schoolId: 'SCH1' },
  kps_canteen:   { id: 'U5', username: 'kps_canteen',   role: 'VENDOR',         name: 'Mama Betty Canteen',       phone: '+256700000005' },
};

const demoChips = [  
  'moses_parent',
  
  'kps_canteen',
  'superadmin',
  'central_admin',
  'agent_peter',
  'kps_bursar',
];

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeChip, setActiveChip] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setAuthError('Enter a username to continue.');
      return;
    }
    setAuthLoading(true);
    setAuthError('');

    const found = mockUsers[username.trim()];
    if (found) {
      onLoginSuccess(found);
    } else {
      onLoginSuccess({ 
        id: 'U_GUEST', 
        username: username.trim(), 
        role: 'PARENT', 
        name: username.trim(), 
        phone: '' 
      });
    }
    setAuthLoading(false);
  };

  const pickChip = (chip: string) => {
    setUsername(chip);
    setPassword('admin');
    setActiveChip(chip);
    setAuthError('');
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 57px)' }}>
      {/* Hero panel */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        background: '#1a0a0c',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(155deg, #2e0d12 0%, #0f0305 55%, #200810 100%)',
        }} />
        <img
          src="skooldime.png"
          alt=""
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.45 }}
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
        <div style={{
          position: 'absolute', top: -80, right: -80,
          width: 320, height: 320, borderRadius: '50%',
          background: 'rgba(199,81,94,0.14)', filter: 'blur(80px)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(12,3,5,0.95) 0%, rgba(12,3,5,0.3) 55%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 2, padding: '36px 36px 42px' }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: '#e07a85', letterSpacing: '1.3px', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 20, height: 1.5, background: BRAND, display: 'inline-block' }} />
            Uganda's School Fintech
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 500, color: '#fdf0f1', lineHeight: 1.22, marginBottom: 14, letterSpacing: '-0.5px' }}>
            Smart money for<br /><em style={{ fontStyle: 'normal', color: '#e07a85' }}>every school day</em>
          </h1>
          <p style={{ fontSize: 13, color: '#b8848a', lineHeight: 1.65, maxWidth: 340, marginBottom: 26 }}>
            Digital pocket money, instant commission splits, and micro-loans built for Ugandan educational networks.
          </p>
          <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
            {[['6', 'User roles'], ['UGX', 'Local currency'], ['0ms', 'Ledger splits']].map(([num, label], i) => (
              <React.Fragment key={label}>
                {i > 0 && <div style={{ width: 1, height: 32, background: 'rgba(199,81,94,0.2)' }} />}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 20, fontWeight: 500, color: '#fdf0f1' }}>{num}</span>
                  <span style={{ fontSize: 11, color: '#8a5059' }}>{label}</span>
                </div>
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Login panel */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '40px 36px',
        background: 'var(--surface-1, #ffffff)',
      }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <div style={{ marginBottom: 26 }}>
            <h2 style={{ fontSize: 20, fontWeight: 500, marginBottom: 6 }}>Sign in to your account</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary, #666)', lineHeight: 1.5 }}>
              Enter your credentials to access your portal and ledger.
            </p>
          </div>

          {authError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 7,
              background: 'rgba(220,38,38,0.06)', border: '0.5px solid rgba(220,38,38,0.22)',
              borderRadius: 8, padding: '9px 11px', marginBottom: 14,
              fontSize: 12, color: '#dc2626',
            }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* Username */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary, #555)', marginBottom: 6 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #aaa)' }} />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="e.g. moses_parent"
                  style={{
                    width: '100%', padding: '9px 12px 9px 34px',
                    border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8,
                    background: 'var(--surface-2, #fafaf8)',
                    color: 'var(--text-primary, #1a1a18)',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = '0 0 0 3px rgba(199,81,94,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-secondary, #555)', marginBottom: 6 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted, #aaa)' }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Any password"
                  style={{
                    width: '100%', padding: '9px 12px 9px 34px',
                    border: '0.5px solid rgba(0,0,0,0.15)', borderRadius: 8,
                    background: 'var(--surface-2, #fafaf8)',
                    color: 'var(--text-primary, #1a1a18)',
                    fontSize: 13, fontFamily: 'inherit', outline: 'none',
                  }}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = '0 0 0 3px rgba(199,81,94,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.15)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              style={{
                width: '100%', padding: '10px',
                background: authLoading ? BRAND_HOVER : BRAND,
                color: '#fff', border: 'none', borderRadius: 8,
                fontSize: 13, fontWeight: 500, cursor: authLoading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit', opacity: authLoading ? 0.7 : 1,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => { if (!authLoading) (e.currentTarget.style.background = BRAND_HOVER); }}
              onMouseLeave={e => { (e.currentTarget.style.background = authLoading ? BRAND_HOVER : BRAND); }}
            >
              {authLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px', color: 'var(--text-muted, #aaa)', fontSize: 11 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />
            Quick access
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(0,0,0,0.08)' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted, #aaa)', marginBottom: 10, fontWeight: 500 }}>
            Select a demo account
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {demoChips.map(chip => (
              <button
                key={chip}
                onClick={() => pickChip(chip)}
                style={{
                  padding: '5px 12px',
                  border: `0.5px solid ${activeChip === chip ? BRAND : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 20, fontSize: 11, fontFamily: 'monospace',
                  color: activeChip === chip ? BRAND : 'var(--text-secondary, #666)',
                  background: activeChip === chip ? BRAND_LIGHT : 'var(--surface-2, #fafaf8)',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  fontWeight: activeChip === chip ? 500 : 400,
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => {
                  if (activeChip !== chip) {
                    e.currentTarget.style.borderColor = BRAND;
                    e.currentTarget.style.color = BRAND;
                    e.currentTarget.style.background = BRAND_LIGHT;
                  }
                }}
                onMouseLeave={e => {
                  if (activeChip !== chip) {
                    e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)';
                    e.currentTarget.style.color = 'var(--text-secondary, #666)';
                    e.currentTarget.style.background = 'var(--surface-2, #fafaf8)';
                  }
                }}
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}