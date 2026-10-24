import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { HomePage } from './pages/HomePage';
import { MovieDetailPage } from './pages/MovieDetailPage';
import { ReviewSubmissionPage } from './pages/ReviewSubmissionPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { SandboxPage } from './pages/SandboxPage';
import { Film, ShieldCheck, Heart } from 'lucide-react';

export function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-[#FEFCE8] text-[#881337] selection:bg-[#FFE4E6] selection:text-[#881337]">
          {/* Main Navigation Bar */}
          <Navbar />

          {/* Dynamic Content Views */}
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/sandbox" element={<SandboxPage />} />
              <Route path="/movie/:id" element={<MovieDetailPage />} />
              <Route path="/movie/:id/review" element={<ReviewSubmissionPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>

          {/* Cinematic Footer adhering strictly to Pale Yellow & Pale Red Aesthetic */}
          <footer className="bg-[#FFFBEB] border-t border-[#FECDD3] py-8 px-4 sm:px-6 lg:px-8 mt-auto">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 rounded-lg bg-[#E11D48] flex items-center justify-center text-white">
                  <Film className="w-3.5 h-3.5" />
                </div>
                <span className="font-bold text-[#881337]">
                  Cinem<span className="text-[#E11D48]">AI</span> Network
                </span>
                <span className="text-[#9F1239]">•</span>
                <span className="text-[#713F12]">AWS Free Tier Direct Host (No Docker)</span>
              </div>

              <div className="flex items-center space-x-6 text-[#9F1239] font-medium">
                <Link to="/" className="hover:text-[#E11D48] transition-colors">Catalog</Link>
                <Link to="/admin/dashboard" className="hover:text-[#E11D48] transition-colors">Admin Portal</Link>
                <a 
                  href="/api/docs" 
                  target="_blank" 
                  rel="noreferrer" 
                  className="hover:text-[#E11D48] transition-colors"
                >
                  FastAPI OpenAPI Docs
                </a>
              </div>

              <p className="text-[#713F12] flex items-center gap-1">
                <span>Designed with</span>
                <Heart className="w-3 h-3 text-[#E11D48] fill-[#E11D48]" />
                <span>Pale Yellow & Pale Red Soft Aesthetic</span>
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
