import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiBookOpen,
  FiChevronDown,
  FiChevronRight,
  FiEye,
  FiEyeOff,
  FiPlay,
  FiPlus,
  FiShield,
  FiUser,
} from 'react-icons/fi';
import type { Role } from '@schoolerp/shared';
import { useAuth } from '../contexts/AuthContext';
import { isDemoPath } from '../lib/demo';
import { supabase } from '../lib/supabase';

const REMEMBERED_ACCOUNT_KEY = 'pws.rememberedAccount';

const DEMO_ROLES: { role: Role; label: string; Icon: typeof FiShield }[] = [
  { role: 'admin', label: 'Admin', Icon: FiShield },
  { role: 'teacher', label: 'Teacher', Icon: FiBookOpen },
  { role: 'student', label: 'Student', Icon: FiUser },
];

type RememberedAccount = {
  loginId: string;
  fullName: string;
};

function readRememberedAccount(): RememberedAccount | null {
  if (isDemoPath) return null;
  try {
    const raw = localStorage.getItem(REMEMBERED_ACCOUNT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RememberedAccount;
    return parsed?.loginId ? parsed : null;
  } catch {
    return null;
  }
}

function getInitials(account: RememberedAccount) {
  const source = account.fullName.trim() || account.loginId.trim();
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export default function Login() {
  const { signIn, signInAsDemo, loading: restoringSession } = useAuth();
  const navigate = useNavigate();
  const [remembered] = useState<RememberedAccount | null>(readRememberedAccount);
  const [showForm, setShowForm] = useState(() => !readRememberedAccount());
  const [demoOpen, setDemoOpen] = useState(isDemoPath);
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const loginIdRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const rememberAccount = async (id: string) => {
    let fullName = '';
    try {
      if (supabase) {
        const { data: userData } = await supabase.auth.getUser();
        if (userData.user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', userData.user.id)
            .single();
          const profile = data as { full_name: string } | null;
          fullName = profile?.full_name ?? '';
        }
      }
    } catch {
      // The login ID alone is still worth remembering.
    }
    try {
      localStorage.setItem(
        REMEMBERED_ACCOUNT_KEY,
        JSON.stringify({ loginId: id, fullName } satisfies RememberedAccount),
      );
    } catch {
      // Storage may be unavailable; sign-in still succeeds.
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (restoringSession) return;
    const id = loginId.trim();
    if (!id) {
      setError('Enter your login ID.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    const { error: signInError } = await signIn(id, password);
    if (signInError) {
      setError(signInError);
      setLoading(false);
      return;
    }

    if (rememberMe) {
      await rememberAccount(id);
    } else {
      try {
        localStorage.removeItem(REMEMBERED_ACCOUNT_KEY);
      } catch {
        // Ignore unavailable storage.
      }
    }
    navigate('/dashboard');
  };

  const handleDemo = (role: Role) => {
    const { error: demoError } = signInAsDemo(role);
    if (demoError) {
      setError(demoError);
      setShowForm(true);
      return;
    }
    if (isDemoPath) navigate('/dashboard');
  };

  const openRememberedAccount = () => {
    if (!remembered) return;
    setLoginId(remembered.loginId);
    setPassword('');
    setError('');
    setNotice('');
    setShowForm(true);
    requestAnimationFrame(() => passwordRef.current?.focus());
  };

  const useAnotherAccount = () => {
    setLoginId('');
    setPassword('');
    setError('');
    setNotice('');
    setShowForm(true);
    requestAnimationFrame(() => loginIdRef.current?.focus());
  };

  return (
    <main aria-label="Pacific World School sign in" className="grid min-h-screen bg-daylight text-ink lg:grid-cols-[minmax(29rem,0.92fr)_minmax(34rem,1.08fr)]">
      <section className="order-2 flex min-h-[calc(100vh-10rem)] flex-col bg-paper px-5 py-6 sm:px-10 lg:order-1 lg:min-h-screen lg:px-[clamp(2.5rem,6vw,6rem)] lg:py-8">
        <div className="flex items-center gap-3">
          <img src="/brand/pws-logo.png" alt="Pacific World School" width="311" height="435" className="h-12 w-9 object-contain" />
          <div>
            <p className="font-display text-lg font-semibold leading-none text-ink">Pacific World School</p>
            <p className="mt-1 text-[0.62rem] font-bold uppercase tracking-[0.17em] text-muted">School console</p>
          </div>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 lg:py-14">
          <p className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-terracotta-700">
            {isDemoPath ? 'Sample-data entry' : 'School sign in'}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2.55rem,6vw,4.5rem)] font-semibold leading-[0.91] tracking-[-0.045em] text-ink">
            Welcome to your school day
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-6 text-muted">
            {isDemoPath
              ? 'Choose a role to explore the console with sample data. No school records are changed.'
              : 'Use your school-issued login ID to open the tools and records available to your role.'}
          </p>

          {!isDemoPath && (
            showForm ? (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
                <div>
                  <label htmlFor="login-id" className="field-label">Your Email/ UserId</label>
                  <input
                    ref={loginIdRef}
                    id="login-id"
                    name="loginId"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={loginId}
                    onChange={(event) => setLoginId(event.target.value)}
                    className="field-control"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="field-label">Your Password</label>
                  <div className="flex">
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="field-control rounded-r-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="focus-ring flex min-w-12 items-center justify-center rounded-r-[10px] border border-l-0 border-olive/20 bg-paper text-muted transition-colors hover:bg-daylight hover:text-ink"
                    >
                      {showPassword ? <FiEyeOff size={18} aria-hidden="true" /> : <FiEye size={18} aria-hidden="true" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm text-muted">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-olive/40 accent-olive"
                    />
                    Remember Me
                  </label>
                  <button
                    type="button"
                    onClick={() => setNotice('Ask your school administrator to reset your password.')}
                    className="focus-ring rounded text-sm font-semibold text-deep-olive underline decoration-olive/25 underline-offset-4 hover:text-olive"
                  >
                    I forgot my password
                  </button>
                </div>

                {notice && <p role="status" className="rounded-[10px] bg-leaf/35 px-3 py-2 text-sm text-deep-olive">{notice}</p>}
                {error && <p role="alert" className="rounded-[10px] border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || restoringSession}
                  className="focus-ring flex min-h-12 w-full items-center justify-center rounded-[11px] bg-olive px-6 text-sm font-bold text-white shadow-card transition-[background-color,box-shadow] hover:bg-deep-olive disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {restoringSession ? 'Checking session...' : loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <div className="mt-8">
                <button
                  type="button"
                  onClick={openRememberedAccount}
                  className="surface-paper focus-ring flex min-h-20 w-full items-center gap-3 px-4 py-3.5 text-left transition-[border-color,box-shadow] hover:border-olive/30 hover:shadow-card"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-leaf/60 text-sm font-bold text-deep-olive">
                    {remembered ? getInitials(remembered) : ''}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-ink">{remembered?.fullName.trim() || remembered?.loginId}</span>
                    <span className="block truncate text-xs text-muted">{remembered?.loginId}</span>
                  </span>
                  <FiChevronRight className="ml-auto shrink-0 text-olive" size={18} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={useAnotherAccount}
                  className="focus-ring mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-campus border border-dashed border-olive/30 bg-daylight/60 text-sm font-semibold text-deep-olive transition-colors hover:bg-leaf/30"
                >
                  <FiPlus size={16} aria-hidden="true" />
                  Use another account
                </button>
              </div>
            )
          )}

          <section className="mt-7 rounded-campus border border-terracotta/20 bg-clay/40 p-4" aria-labelledby="demo-entry-title">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 id="demo-entry-title" className="font-display text-lg font-semibold text-ink">Explore the school demo</h2>
                <p className="mt-0.5 text-xs leading-5 text-muted">Sample data only. No account or password required.</p>
              </div>
              <button
                type="button"
                onClick={() => setDemoOpen((open) => !open)}
                aria-expanded={demoOpen}
                aria-controls="demo-role-options"
                className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-terracotta/30 bg-paper px-4 text-sm font-bold text-deep-olive shadow-sm transition-colors hover:border-terracotta hover:bg-terracotta-50"
              >
                <FiPlay size={12} aria-hidden="true" />
                Try a demo
                <FiChevronDown size={13} aria-hidden="true" className={`transition-transform duration-200 ${demoOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {demoOpen && (
              <div id="demo-role-options" role="group" aria-label="Choose a demo role" className="mt-4 grid grid-cols-3 gap-2">
                {DEMO_ROLES.map(({ role, label, Icon }) => isDemoPath ? (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleDemo(role)}
                    className="focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] border border-olive/15 bg-paper px-2 py-2 text-xs font-bold text-deep-olive transition-[background-color,border-color,color] hover:border-olive hover:bg-olive hover:text-white sm:flex-row"
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </button>
                ) : (
                  <a
                    key={role}
                    href={`/demo/dashboard?role=${role}`}
                    className="focus-ring flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] border border-olive/15 bg-paper px-2 py-2 text-xs font-bold text-deep-olive transition-[background-color,border-color,color] hover:border-olive hover:bg-olive hover:text-white sm:flex-row"
                  >
                    <Icon size={14} aria-hidden="true" />
                    {label}
                  </a>
                ))}
              </div>
            )}

            {isDemoPath && (
              <a href="/login" className="focus-ring mt-4 inline-block rounded text-sm font-bold text-deep-olive underline decoration-olive/30 underline-offset-4">
                School sign in
              </a>
            )}
          </section>
        </div>

        <p className="text-xs text-muted">Pacific World School ©2026</p>
      </section>

      <section aria-label="Pacific World School campus" className="relative order-1 h-40 overflow-hidden bg-deep-olive lg:order-2 lg:h-auto lg:min-h-screen">
        <img
          src="/brand/campus-2.jpg"
          alt=""
          width="654"
          height="305"
          className="campus-image-reveal h-full w-full object-cover object-center lg:absolute lg:inset-0"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/10 to-transparent lg:bg-gradient-to-br lg:from-ink/75 lg:via-ink/15 lg:to-olive/25" />
        <div className="absolute inset-x-0 bottom-0 hidden p-[clamp(2rem,5vw,5rem)] text-white lg:block">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.22em] text-white/70">Pacific World School</p>
          <h2 className="mt-3 max-w-xl font-display text-[clamp(2.8rem,5vw,5.6rem)] font-semibold leading-[0.9] tracking-[-0.045em]">
            The school day, in one clear view.
          </h2>
          <p className="mt-5 max-w-md text-sm leading-6 text-white/78">Learning, communication and school operations remain connected to the role you sign in with.</p>
        </div>
      </section>
    </main>
  );
}
