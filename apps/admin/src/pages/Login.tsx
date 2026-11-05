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
  const { signIn, signInAsDemo } = useAuth();
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
    <div className="grid min-h-screen w-full grid-cols-1 bg-white text-ink md:grid-cols-2">
      <div className="flex min-h-screen flex-col justify-between bg-white p-4 md:p-8">
        <h1 className="text-xl font-bold text-ink md:text-2xl">PACIFIC WORLD SCHOOL</h1>

        <div className="mx-auto flex w-full max-w-lg flex-grow flex-col items-center justify-center">
          <div className="w-full">
            <div className="mb-4 flex flex-col items-center justify-center text-center md:mb-6">
              <img
                src="/brand/pws-logo.png"
                alt="Pacific World School"
                className="mx-auto h-auto w-[80px] select-none md:w-[100px]"
              />
              <h3 className="mb-1 text-xl font-semibold text-ink md:text-2xl">
                {isDemoPath ? 'Explore the school demo' : 'Login to your account'}
              </h3>
              <p className="text-xs text-slate-500 md:text-sm">
                {isDemoPath ? 'Choose a role below. No account or password required.' : 'Welcome back, Please enter your email & password to continue.'}
              </p>
            </div>

            {!isDemoPath && (showForm ? (
              <form
                onSubmit={handleSubmit}
                className="mx-auto w-full max-w-[400px] space-y-6"
                noValidate
              >
                <div>
                  <label
                    htmlFor="login-id"
                    className="mb-2 block text-sm font-medium text-ink"
                  >
                    Your Email/ UserId
                  </label>
                  <input
                    ref={loginIdRef}
                    id="login-id"
                    name="loginId"
                    type="text"
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={false}
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-ink shadow-sm transition-colors placeholder:text-slate-400 focus:border-olive focus:outline-none focus:ring-1 focus:ring-olive"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-ink"
                  >
                    Your Password
                  </label>
                  <div className="flex items-center">
                    <input
                      ref={passwordRef}
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-9 w-full rounded-e-none rounded-md border border-slate-300 bg-white px-3 text-sm text-ink shadow-sm transition-colors placeholder:text-slate-400 focus:border-olive focus:outline-none focus:ring-1 focus:ring-olive"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="flex h-9 w-10 shrink-0 items-center justify-center rounded-e-md border border-l-0 border-slate-300 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-olive"
                    >
                      {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-400 accent-olive"
                    />
                    <span className="text-sm text-slate-500">Remember Me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setNotice('Ask your school administrator to reset your password.')
                    }
                    className="text-sm text-olive hover:underline"
                  >
                    I forgot my password
                  </button>
                </div>

                {notice && (
                  <p role="status" className="text-sm text-slate-500">
                    {notice}
                  </p>
                )}

                {error && (
                  <p role="alert" className="text-sm text-red-600">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="h-10 w-full rounded-md bg-olive px-8 text-center text-sm font-medium text-white shadow transition-colors hover:bg-olive/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>
            ) : (
              <div className="mx-auto w-full max-w-[400px]">
                <button
                  type="button"
                  onClick={openRememberedAccount}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-600">
                    {remembered ? getInitials(remembered) : ''}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium uppercase text-ink">
                      {remembered?.fullName.trim() || remembered?.loginId}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {remembered?.loginId}
                    </span>
                  </span>
                  <FiChevronRight className="ml-auto shrink-0 text-slate-400" size={18} />
                </button>
                <button
                  type="button"
                  onClick={useAnotherAccount}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-slate-300 bg-white py-4 text-sm text-slate-500 transition-colors hover:bg-slate-50 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-olive/40"
                >
                  <FiPlus size={16} />
                  Use another account
                </button>
              </div>
            ))}

            <div className="mx-auto mt-6 w-full max-w-[400px] text-center">
              <button
                type="button"
                onClick={() => setDemoOpen((open) => !open)}
                aria-expanded={demoOpen}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-olive shadow-sm transition-colors hover:border-olive hover:text-olive focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-olive"
              >
                <FiPlay size={11} />
                Try a demo
                <FiChevronDown
                  size={12}
                  className={`transition-transform ${demoOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {demoOpen && (
                <div
                  role="group"
                  aria-label="Choose a demo role"
                  className="mt-3 flex items-center justify-center gap-2"
                >
                  {DEMO_ROLES.map(({ role, label, Icon }) => isDemoPath ? (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleDemo(role)}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-olive hover:bg-olive hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-olive"
                    >
                      <Icon size={12} />
                      {label}
                    </button>
                  ) : (
                    <a
                      key={role}
                      href={`/demo/dashboard?role=${role}`}
                      className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 shadow-sm transition-colors hover:border-olive hover:bg-olive hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-olive"
                    >
                      <Icon size={12} />
                      {label}
                    </a>
                  ))}
                </div>
              )}
              <p className="mt-2 text-[11px] text-slate-400">
                Explore with sample data — no login needed.
              </p>
              {isDemoPath && (
                <a href="/login" className="mt-3 inline-block text-sm font-medium text-olive underline">
                  School sign in
                </a>
              )}
            </div>
          </div>
        </div>

        <p className="text-xs capitalize text-slate-500 md:text-sm">
          Pacific World School ©2026
        </p>
      </div>

      <section
        aria-label="Pacific World School campus"
        className="relative hidden min-h-screen flex-col items-start justify-start overflow-hidden md:flex"
      >
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/brand/campus-2.jpg')" }}
          />
          <div
            className="absolute inset-0 bg-cover bg-center campus-crossfade"
            style={{ backgroundImage: "url('/brand/campus-1.jpg')" }}
          />
          <div className="absolute inset-0 bg-black/40" />
        </div>

        <div className="relative z-10 w-full px-6 pt-4 lg:px-10 lg:pt-6">
          <div className="rounded-2xl border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-md transition-all duration-300 hover:bg-white/15 lg:p-8">
            <h1 className="mb-4 border-b border-white/30 pb-4 text-2xl font-semibold text-white md:text-3xl">
              Digital Excellence in Every Student&apos;s Achievement
            </h1>
            <p className="pt-5 text-sm font-normal text-white md:text-base">
              Tailored for PACIFIC WORLD SCHOOL, our innovative platform transforms the way
              student report cards are created, offering a seamless and efficient digital
              solution. Empowering teachers and students with technology that celebrates
              academic success with precision and ease.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
