import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, User, Mail, Lock, ArrowRight, Award, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // 'user', 'critic', 'admin'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await register({
        name,
        email,
        password,
        role,
      });
      navigate('/');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Failed to create account.');
    } finally {
      setLoading(false);
    }
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
          Join the CinemAI Network
        </h2>
        <p className="text-xs text-[#713F12]">
          Select your audience tier and start publishing AI-verified reviews
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
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E11D48]" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Christopher Ross"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] placeholder-[#881337]/45 focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
            </div>

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
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] placeholder-[#881337]/45 focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20"
                />
              </div>
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-2">
                Select Your Network Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'user'
                      ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-sm shadow-[#FECDD3]'
                      : 'bg-[#FEFCE8] text-[#881337] border-[#FECDD3] hover:bg-[#FFE4E6]'
                  }`}
                >
                  <User className="w-4 h-4 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">General User</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('critic')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'critic'
                      ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-sm shadow-[#FECDD3]'
                      : 'bg-[#FEFCE8] text-[#881337] border-[#FECDD3] hover:bg-[#FFE4E6]'
                  }`}
                >
                  <Award className="w-4 h-4 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">Film Critic</p>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    role === 'admin'
                      ? 'bg-[#E11D48] text-white border-[#E11D48] shadow-sm shadow-[#FECDD3]'
                      : 'bg-[#FEFCE8] text-[#881337] border-[#FECDD3] hover:bg-[#FFE4E6]'
                  }`}
                >
                  <Shield className="w-4 h-4 mx-auto mb-1" />
                  <p className="text-[11px] font-bold">Admin</p>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 py-2.5 px-4 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#FECDD3] transition-all flex items-center justify-center gap-1.5 hover:scale-[1.01] disabled:opacity-50"
            >
              <span>{loading ? 'Creating Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          <div className="text-center pt-2">
            <p className="text-xs text-[#713F12]">
              Already registered?{' '}
              <Link to="/login" className="font-bold text-[#E11D48] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
