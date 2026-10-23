import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Film, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const redirectUrl = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login(email, password);
      navigate(redirectUrl);
    } catch (err) {
      console.error('Login error:', err);
      setError(err.response?.data?.detail || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-[#FEFCE8] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <Link to="/" className="inline-flex items-center justify-center space-x-2">
          <div className="w-10 h-10 rounded-xl bg-[#E11D48] flex items-center justify-center text-white shadow-md shadow-[#FECDD3]">
            <Film className="w-5 h-5" />
          </div>
          <span className="text-2xl font-bold text-[#881337]">
            Cinem<span className="text-[#E11D48]">AI</span>
          </span>
        </Link>
        <h2 className="text-xl font-extrabold text-[#881337]">
          Sign In to Your Account
        </h2>
        <p className="text-xs text-[#713F12]">
          Access AI Sentiment Intelligence, PDF Vault, and Critic Network
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-[#FFFBEB] border border-[#FECDD3] py-8 px-6 sm:px-10 rounded-2xl shadow-sm space-y-6">
          {error && (
            <div className="p-3 rounded-xl bg-[#FFE4E6] border border-[#FCA5A5] text-[#881337] text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E11D48]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] placeholder-[#881337]/45 focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E11D48]" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] placeholder-[#881337]/45 focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#FECDD3] transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick Demo Login Credentials */}
          <div className="pt-4 border-t border-[#FECDD3] space-y-2">
            <span className="text-[11px] font-bold text-[#881337] uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#E11D48]" />
              Quick Demo Accounts:
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickDemo('admin@cinemai.com', 'admin123')}
                className="py-1.5 px-2 bg-[#FEFCE8] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-lg text-[10px] font-bold text-[#881337] transition-colors"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('critic@cinemai.com', 'critic123')}
                className="py-1.5 px-2 bg-[#FEFCE8] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-lg text-[10px] font-bold text-[#881337] transition-colors"
              >
                Critic
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('user@cinemai.com', 'user123')}
                className="py-1.5 px-2 bg-[#FEFCE8] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-lg text-[10px] font-bold text-[#881337] transition-colors"
              >
                User
              </button>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-xs text-[#713F12]">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-bold text-[#E11D48] hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
