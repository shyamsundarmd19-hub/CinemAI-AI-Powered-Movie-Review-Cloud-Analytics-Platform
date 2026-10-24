import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Film, ShieldAlert, User, LogOut, Sparkles, BarChart2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-[#FFFBEB] border-b border-[#FECDD3] shadow-sm backdrop-blur-md bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-[#E11D48] flex items-center justify-center text-white shadow-md shadow-[#FECDD3] group-hover:scale-105 transition-transform duration-200">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-[#881337] flex items-center gap-1.5">
                Cinem<span className="text-[#E11D48]">AI</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#FFE4E6] text-[#881337] border border-[#FCA5A5]">
                  AWS Free Tier
                </span>
              </span>
              <p className="text-[10px] text-[#9F1239] -mt-1 font-medium hidden sm:block">AI Sentiment Intelligence</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center space-x-2 sm:space-x-4">
            <Link
              to="/"
              className="px-3 py-1.5 text-sm font-medium text-[#881337] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg transition-colors"
            >
              Movies
            </Link>

            <Link
              to="/sandbox"
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#881337] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>DL Sandbox</span>
            </Link>

            {isAdmin && (
              <Link
                to="/admin/dashboard"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#881337] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg transition-colors border border-dashed border-[#FCA5A5]"
              >
                <BarChart2 className="w-4 h-4 text-[#E11D48]" />
                <span>Admin Dashboard</span>
              </Link>
            )}

            {/* User authentication states */}
            {user ? (
              <div className="flex items-center space-x-3 ml-2 pl-3 border-l border-[#FECDD3]">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#FFE4E6] border border-[#FCA5A5] flex items-center justify-center text-[#881337] font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-xs font-bold text-[#881337] leading-tight truncate max-w-[120px]">{user.name}</p>
                    <span className="text-[10px] uppercase font-semibold text-[#E11D48] tracking-wider">
                      {user.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-1.5 text-[#881337] hover:text-[#E11D48] hover:bg-[#FFE4E6] rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-2">
                <Link
                  to="/login"
                  className="px-3 py-1.5 text-sm font-medium text-[#881337] hover:text-[#E11D48] rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 text-sm font-semibold bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-lg shadow-sm shadow-[#FECDD3] transition-all hover:shadow"
                >
                  Join Free
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};
