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

/**
 * Passwordless demo entry: one small button that reveals the three roles.
 * No credentials are stored or shown anywhere — picking a role signs in as
 * the matching seeded person in the isolated /demo app, with or without
 * production Supabase configuration. See `signInAsDemo` in AuthContext.
 */
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (restoringSession) return;
    const id = loginId.trim();
    if (!id) {
      setError('Enter your login ID.');
      return;
    }

    setLoading(true);
    setError('');
    setNotice('');
    const { error: err } = await signIn(id, password);
    if (err) {
      setError(err);
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
    const { error: err } = signInAsDemo(role);
    if (err) {
      // Surface the refusal in the form's error area.
      setError(err);
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
    <main aria-label="Pacific World School sign in" className="grid min-h-screen bg-forest-950 text-ink lg:grid-cols-[minmax(0,1.06fr)_minmax(30rem,0.94fr)]">
      <section aria-label="Pacific World School campus" className="relative hidden min-h-screen overflow-hidden lg:flex lg:flex-col lg:justify-between">
        <img
          src="/brand/campus-2.jpg"
          alt=""
          width="654"
          height="305"
          className="absolute inset-0 h-full w-full scale-[1.02] object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/35 via-forest-950/65 to-forest-950" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_12%,rgba(228,207,131,0.22),transparent_28rem)]" />

        <div className="relative z-10 flex items-center gap-3 px-10 py-9 xl:px-14">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-paper shadow-lift">
            <img src="/brand/pws-logo.png" alt="" width="311" height="435" className="h-11 w-auto object-contain" />
          </div>
          <div>
            <div className="font-display text-2xl font-medium text-paper">Pacific World School</div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.24em] text-gold">School administration</div>
          </div>
        </div>

        <div className="relative z-10 max-w-2xl px-10 pb-12 xl:px-14 xl:pb-16">
          <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-gold">Academic year 2026–27</p>
          <h2 className="mt-4 max-w-xl font-display text-5xl font-medium leading-[0.98] tracking-[-0.035em] text-paper xl:text-6xl">
            The school day, in one clear view.
          </h2>
          <p className="mt-6 max-w-lg text-sm leading-6 text-paper/70">
            Attendance, assignments, approvals, events and school records for authorised staff and students.
          </p>
          <div className="mt-8 h-px bg-gradient-to-r from-gold via-gold/30 to-transparent" aria-hidden="true" />
        </div>
      </section>

      <section className="relative flex min-h-screen flex-col bg-paper px-5 py-6 sm:px-8 lg:px-10 xl:px-14">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-bl-full bg-gold/10" aria-hidden="true" />
        <div className="relative flex items-center justify-between gap-4 lg:justify-end">
          <div className="flex items-center gap-2.5 lg:hidden">
            <img src="/brand/pws-logo.png" alt="" width="311" height="435" className="h-10 w-auto object-contain" />
            <div>
              <div className="font-display text-lg font-medium leading-none text-forest">Pacific World School</div>
              <div className="mt-1 text-[8px] font-extrabold uppercase tracking-[0.18em] text-moss">School ERP</div>
            </div>
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted">Secure access</span>
        </div>

        <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-10 sm:py-14">
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-moss">
              {isDemoPath ? 'Sample workspace' : 'School portal'}
            </p>
            <h1 className="font-display text-4xl font-medium leading-none tracking-[-0.03em] text-ink sm:text-5xl">
              {isDemoPath ? 'Explore the school demo' : 'Welcome back'}
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted">
              {isDemoPath
                ? 'Choose a role below. No account or password is required.'
                : 'Enter your school-issued login ID and password to continue.'}
            </p>
            <div className="heritage-rule mt-5" aria-hidden="true" />
          </div>

          {!isDemoPath && (showForm ? (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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
                <div className="flex items-stretch">
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
                    className="focus-ring flex w-12 shrink-0 items-center justify-center rounded-r-xl border border-l-0 border-border bg-parchment/40 text-muted transition-colors duration-150 hover:bg-parchment hover:text-ink"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-forest/30 accent-forest"
                  />
                  Remember Me
                </label>
                <button
                  type="button"
                  onClick={() => setNotice('Ask your school administrator to reset your password.')}
                  className="text-sm font-bold text-forest underline decoration-gold underline-offset-4"
                >
                  I forgot my password
                </button>
              </div>

              {notice && <p role="status" className="rounded-xl border border-blue-700/15 bg-blue-50 px-3.5 py-3 text-sm text-blue-900">{notice}</p>}
              {error && <p role="alert" className="rounded-xl border border-red-700/15 bg-red-50 px-3.5 py-3 text-sm font-semibold text-red-800">{error}</p>}

              <button
                type="submit"
                disabled={loading || restoringSession}
                className="focus-ring flex min-h-12 w-full items-center justify-center rounded-xl bg-forest px-8 text-sm font-extrabold text-paper shadow-card transition-[background-color,transform,box-shadow] duration-150 hover:bg-forest-900 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
              >
                {restoringSession ? 'Checking session...' : loading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          ) : (
            <div>
              <button
                type="button"
                onClick={openRememberedAccount}
                className="focus-ring flex w-full items-center gap-3 rounded-heritage border border-border bg-paper px-4 py-3.5 text-left shadow-card transition-[border-color,background-color,transform] duration-150 hover:border-forest/25 hover:bg-parchment/35 active:translate-y-px"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-forest text-sm font-extrabold text-gold">
                  {remembered ? getInitials(remembered) : ''}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold uppercase tracking-[0.04em] text-ink">{remembered?.fullName.trim() || remembered?.loginId}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted">{remembered?.loginId}</span>
                </span>
                <FiChevronRight className="ml-auto shrink-0 text-moss" size={18} />
              </button>
              <button
                type="button"
                onClick={useAnotherAccount}
                className="focus-ring mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-forest/25 text-sm font-bold text-muted transition-colors duration-150 hover:bg-parchment/50 hover:text-ink"
              >
                <FiPlus size={16} /> Use another account
              </button>
            </div>
          ))}

          <div className="mt-7 border-t border-border pt-6">
            <button
              type="button"
              onClick={() => setDemoOpen((open) => !open)}
              aria-expanded={demoOpen}
              className="focus-ring inline-flex min-h-11 items-center gap-2 rounded-full border border-forest/20 bg-paper px-4 text-sm font-extrabold text-forest transition-colors duration-150 hover:border-forest/35 hover:bg-parchment/40"
            >
              <FiPlay size={12} />
              Try a demo
              <FiChevronDown size={13} className={`transition-transform duration-150 ${demoOpen ? 'rotate-180' : ''}`} />
            </button>
            <p className="mt-2 text-xs leading-5 text-muted">Explore with sample data — no login needed.</p>

            {demoOpen && (
              <div role="group" aria-label="Choose a demo role" className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
                {DEMO_ROLES.map(({ role, label, Icon }) => isDemoPath ? (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleDemo(role)}
                    className="focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-parchment/35 px-3 text-xs font-extrabold text-forest transition-[border-color,background-color,transform] duration-150 hover:border-forest/30 hover:bg-gold/20 active:translate-y-px"
                  >
                    <Icon size={15} /> {label}
                  </button>
                ) : (
                  <a
                    key={role}
                    href={`/demo/dashboard?role=${role}`}
                    className="focus-ring flex min-h-14 items-center justify-center gap-2 rounded-xl border border-border bg-parchment/35 px-3 text-xs font-extrabold text-forest transition-[border-color,background-color,transform] duration-150 hover:border-forest/30 hover:bg-gold/20 active:translate-y-px"
                  >
                    <Icon size={15} /> {label}
                  </a>
                ))}
              </div>
            )}

            {isDemoPath && (
              <a href="/login" className="mt-5 inline-flex min-h-11 items-center text-sm font-extrabold text-forest underline decoration-gold underline-offset-4">
                School sign in
              </a>
            )}
          </div>
        </div>

        <div className="relative flex items-center justify-between gap-3 border-t border-border pt-4 text-[10px] font-bold text-muted">
          <span>Pacific World School ©2026</span>
          <span>Authorised access only</span>
        </div>
      </section>
    </main>
  );
}
