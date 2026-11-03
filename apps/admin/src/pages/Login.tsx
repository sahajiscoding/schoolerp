import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signIn(loginId, password);
    if (err) {
      setError(err);
      setLoading(false);
      return;
    }
    navigate('/dashboard');
  };

  return (
    <div className="flex h-screen items-center center bg-sand">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-sand/30">
        <h1 className="text-2xl font-bold text-ink mb-2 text-center">Pacific World School</h1>
        <p className="text-muted text-center mb-8">Admin sign in</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Login ID</label>
            <input
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="e.g. ADMIN001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-ink mb-1">Password</label>
            <input
              type="password"
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-terracotta"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-terracotta text-white rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
