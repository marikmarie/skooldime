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

// Beautiful crisp Vector SVG Logo for skoolDime
export const LogoSVG = ({ 
  className = "h-12 w-auto", 
  iconSize = 36, 
  fontSize = "text-2xl" 
}: { 
  className?: string; 
  iconSize?: number; 
  fontSize?: string 
}) => (
  <div className={`flex items-center gap-3 select-none ${className}`}>
    <svg width={iconSize} height={iconSize} viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
      <rect x="2" y="2" width="38" height="38" rx="10" fill="#06065C" />
      <path d="M12 21L21 12L30 21L21 30L12 21Z" fill="#ED0101" />
      <circle cx="21" cy="21" r="4" fill="#FFFFFF" />
      <path d="M16 17H26V19L21 23L16 17Z" fill="#FFFFFF" opacity="0.8" />
    </svg>
    <div className="flex flex-col text-left">
      <span className={`${fontSize} font-black tracking-tight flex items-center leading-none`} style={{ color: '#06065C' }}>
        skool<span style={{ color: '#ED0101' }}>Dime</span>
      </span>
      <span className="text-[8px] font-bold tracking-widest uppercase leading-none mt-1.5" style={{ color: 'rgba(6,6,92,0.6)', letterSpacing: '0.12em' }}>
        Uganda School Fintech
      </span>
    </div>
  </div>
);

const BRAND        = '#ED0101';
const BRAND_HOVER  = '#c90000';
const BRAND_LIGHT  = 'rgba(237,1,1,0.08)';
const BRAND_BORDER = 'rgba(237,1,1,0.25)';
const NAVY         = '#06065C';
const NAVY_LIGHT   = 'rgba(6,6,92,0.08)';

export default function Login({ onLoginSuccess }: LoginProps) {
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [authError, setAuthError]     = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [activeChip, setActiveChip]   = useState('');
  const [dbUsers, setDbUsers]         = useState<LoggedInUser[]>([]);

  React.useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        const data = await res.json();
        if (Array.isArray(data)) {
          setDbUsers(data);
        }
      } catch (err) {
        console.error('Failed to load database users:', err);
      }
    };
    fetchUsers();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername) { setAuthError('Enter a username to continue.'); return; }
    setAuthLoading(true);
    setAuthError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername })
      });
      const data = await res.json();
      if (data.success && data.user) {
        onLoginSuccess(data.user);
        setAuthLoading(false);
        return;
      } else {
        setAuthError(data.error || 'User not found in system database. Access denied.');
      }
    } catch (err: any) {
      console.error('API login error:', err);
      setAuthError('Connection error occurred during login. Please check database connection.');
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#f8fafc' }}>
      
      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 flex-1">
 
        {/* Hero panel */}
        <div className="hidden md:flex relative overflow-hidden flex-col justify-end" style={{ background: NAVY }}>
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(155deg, ${NAVY} 0%, #020220 55%, #0a0a40 100%)` }} />
          <img src="skooldime.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35 }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          <div style={{ position: 'absolute', top: -100, right: -100, width: 380, height: 380, borderRadius: '50%', background: 'rgba(237,1,1,0.18)', filter: 'blur(90px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, rgba(2,2,32,0.97) 0%, rgba(2,2,32,0.35) 55%, transparent 100%)` }} />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${BRAND} 0%, transparent 70%)` }} />
 
          <div style={{ position: 'relative', zIndex: 2, padding: '36px 36px 44px' }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: BRAND, letterSpacing: '1.6px', textTransform: 'uppercase', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 22, height: 2, background: BRAND, display: 'inline-block', borderRadius: 1 }} />
              Uganda's School Fintech
            </div>
            <h1 style={{ fontSize: 31, fontWeight: 600, color: '#ffffff', lineHeight: 1.2, marginBottom: 14, letterSpacing: '-0.5px' }}>
              Smart money for<br /><em style={{ fontStyle: 'normal', color: BRAND }}>every school day</em>
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, maxWidth: 340, marginBottom: 30 }}>
              Digital pocket money, instant commission splits, and micro-loans built for Ugandan educational networks.
            </p>
            <div style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 26 }}>
              {[['6', 'User roles'], ['UGX', 'Local currency'], ['0ms', 'Ledger splits']].map(([num, label], i) => (
                <React.Fragment key={label}>
                  {i > 0 && <div style={{ width: 1, height: 34, background: 'rgba(237,1,1,0.25)' }} />}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 21, fontWeight: 600, color: '#ffffff' }}>{num}</span>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', letterSpacing: '0.04em' }}>{label}</span>
                  </div>
                </React.Fragment>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {['PIN-secured cards', 'MoMo top-ups', 'Micro-loans'].map(tag => (
                <span key={tag} style={{ fontSize: 10, padding: '4px 10px', borderRadius: 20, border: `0.5px solid rgba(237,1,1,0.35)`, color: 'rgba(255,255,255,0.55)', background: 'rgba(237,1,1,0.08)', letterSpacing: '0.03em' }}>{tag}</span>
              ))}
            </div>
          </div>
        </div>
 
        {/* Login panel */}
        <div className="flex items-center justify-center p-6 md:p-10 bg-white border-t-4 md:border-t-0 md:border-l-4" style={{ borderColor: BRAND }}>
          <div style={{ width: '100%', maxWidth: 380 }}>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
              <LogoSVG className="mb-4" iconSize={48} fontSize="text-3xl" />
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: NAVY, textAlign: 'center' }}>Sign in to your account</h2>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
                Enter your credentials to access your portal and ledger.
              </p>
            </div>

          {authError && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: 'rgba(237,1,1,0.05)', border: `0.5px solid ${BRAND_BORDER}`, borderRadius: 8, padding: '9px 11px', marginBottom: 14, fontSize: 12, color: BRAND }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: NAVY, marginBottom: 6 }}>Username</label>
              <div style={{ position: 'relative' }}>
                <User size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="e.g. moses_parent" autoComplete="username"
                  style={{ width: '100%', padding: '9px 12px 9px 34px', border: `0.5px solid rgba(6,6,92,0.18)`, borderRadius: 8, background: '#fafaf8', color: '#1a1a18', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = '0 0 0 3px rgba(237,1,1,0.10)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(6,6,92,0.18)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: NAVY, marginBottom: 6 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#aaa' }} />
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Any password" autoComplete="current-password"
                  style={{ width: '100%', padding: '9px 12px 9px 34px', border: `0.5px solid rgba(6,6,92,0.18)`, borderRadius: 8, background: '#fafaf8', color: '#1a1a18', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => { e.target.style.borderColor = BRAND; e.target.style.boxShadow = '0 0 0 3px rgba(237,1,1,0.10)'; }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(6,6,92,0.18)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <button type="submit" disabled={authLoading}
              style={{ width: '100%', padding: '11px', background: authLoading ? BRAND_HOVER : BRAND, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: authLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: authLoading ? 0.75 : 1, transition: 'background 0.15s, transform 0.1s', letterSpacing: '0.02em' }}
              onMouseEnter={e => { if (!authLoading) e.currentTarget.style.background = BRAND_HOVER; }}
              onMouseLeave={e => { e.currentTarget.style.background = authLoading ? BRAND_HOVER : BRAND; }}
              onMouseDown={e => { e.currentTarget.style.transform = 'scale(0.99)'; }}
              onMouseUp={e => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {authLoading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 14px', color: '#bbb', fontSize: 11 }}>
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(6,6,92,0.10)' }} />
            Quick access
            <div style={{ flex: 1, height: '0.5px', background: 'rgba(6,6,92,0.10)' }} />
          </div>

          <div style={{ fontSize: 11, color: '#aaa', marginBottom: 10, fontWeight: 500 }}>Select a database account</div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {dbUsers.length === 0 ? (
              <span className="text-xs text-slate-400 italic animate-pulse">Loading active database registries...</span>
            ) : (
              dbUsers.map(userObj => {
                const active = activeChip === userObj.username;
                return (
                  <button key={userObj.id} onClick={() => pickChip(userObj.username)}
                    style={{ padding: '5px 12px', border: `0.5px solid ${active ? BRAND : 'rgba(6,6,92,0.15)'}`, borderRadius: 20, fontSize: 11, fontFamily: 'monospace', color: active ? BRAND : NAVY, background: active ? BRAND_LIGHT : NAVY_LIGHT, cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: active ? 600 : 400, transition: 'all 0.12s' }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.borderColor = BRAND; e.currentTarget.style.color = BRAND; e.currentTarget.style.background = BRAND_LIGHT; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.borderColor = 'rgba(6,6,92,0.15)'; e.currentTarget.style.color = NAVY; e.currentTarget.style.background = NAVY_LIGHT; } }}
                  >
                    {userObj.username}
                  </button>
                );
              })
            )}
          </div>

          <p style={{ fontSize: 11, color: '#bbb', marginTop: 24, margin: 0, lineHeight: 1.6 }}>
            Security Notice — All accounts are real ledger records stored in the SQLite database and fetched via secure API endpoints.
          </p>
        </div>
      </div>
    </div>
  </div>
);
}