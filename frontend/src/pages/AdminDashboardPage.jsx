import React, { useState, useEffect } from 'react';
import { 
  BarChart2, ShieldAlert, Film, UploadCloud, Users, 
  MessageSquare, CheckCircle, Trash2, Sparkles, RefreshCw, AlertTriangle 
} from 'lucide-react';
import { adminService, movieService, documentService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SentimentBadge } from '../components/SentimentBar';

export const AdminDashboardPage = () => {
  const { user, isAdmin } = useAuth();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'queue', 'addMovie'
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Add Movie Form States
  const [movieForm, setMovieForm] = useState({
    title: '',
    genre: 'Sci-Fi',
    director: '',
    release_year: 2024,
    synopsis: '',
    poster_s3_url: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to load admin analytics:', err);
      showToast('Error connecting to Admin Telemetry API', true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchDashboardData();
    }
  }, [isAdmin]);

  const showToast = (text, isError = false) => {
    setToastMessage({ text, isError });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleUnflag = async (reviewId) => {
    setActionLoading(true);
    try {
      await adminService.unflagReview(reviewId);
      showToast('Review unflagged and restored to public audience stream!');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to unflag review', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePurge = async (reviewId) => {
    if (!window.confirm('Permanently purge this toxic review from database?')) return;
    setActionLoading(true);
    try {
      await adminService.purgeReview(reviewId);
      showToast('Toxic review permanently purged.');
      fetchDashboardData();
    } catch (err) {
      showToast('Failed to purge review', true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setUploadProgress(true);

    try {
      // 1. Fetch S3 Presigned PUT URL
      const presigned = await documentService.getPresignedUrl(file.name, file.type || 'image/jpeg', 'posters');
      
      // 2. Direct upload to AWS S3 with SSE-S3 AES-256 header
      await documentService.uploadDirectToS3(presigned.upload_url, file, file.type || 'image/jpeg');

      // 3. Set poster URL to downloaded S3 path
      setMovieForm((prev) => ({ ...prev, poster_s3_url: presigned.download_url }));
      showToast('Poster successfully encrypted and uploaded to AWS S3 Vault!');
    } catch (err) {
      console.error('S3 Direct Upload Error:', err);
      showToast('S3 direct upload failed. Using local preview path.', true);
      // Fallback preview
      setMovieForm((prev) => ({
        ...prev,
        poster_s3_url: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=600&q=80',
      }));
    } finally {
      setUploadProgress(false);
    }
  };

  const handleCreateMovie = async (e) => {
    e.preventDefault();
    if (!movieForm.title.trim() || !movieForm.director.trim() || !movieForm.synopsis.trim()) {
      showToast('Please fill in all movie fields.', true);
      return;
    }

    setActionLoading(true);
    try {
      await movieService.createMovie({
        ...movieForm,
        release_year: parseInt(movieForm.release_year, 10),
      });
      showToast(`Movie "${movieForm.title}" added to CinemAI catalog!`);
      setMovieForm({
        title: '',
        genre: 'Sci-Fi',
        director: '',
        release_year: 2024,
        synopsis: '',
        poster_s3_url: '',
      });
      setSelectedFile(null);
      fetchDashboardData();
      setActiveTab('overview');
    } catch (err) {
      console.error('Create movie error:', err);
      showToast(err.response?.data?.detail || 'Failed to register movie.', true);
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#FEFCE8] flex items-center justify-center p-4">
        <div className="bg-[#FFFBEB] border border-[#FCA5A5] rounded-2xl p-8 max-w-md text-center space-y-4">
          <ShieldAlert className="w-12 h-12 text-[#E11D48] mx-auto" />
          <h2 className="text-xl font-bold text-[#881337]">Admin Credentials Required</h2>
          <p className="text-xs text-[#713F12]">
            You must be signed in with an Administrator role to access the cloud monitoring and moderation portal.
          </p>
        </div>
      </div>
    );
  }

  const breakdown = analytics?.overall_sentiment_breakdown || {
    positive_pct: 0,
    neutral_pct: 0,
    negative_pct: 0,
  };

  return (
    <div className="min-h-screen bg-[#FEFCE8] pb-20">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-4 py-3 rounded-xl border shadow-lg flex items-center gap-2 text-xs font-bold ${
            toastMessage.isError
              ? 'bg-[#FFE4E6] text-[#881337] border-[#FCA5A5]'
              : 'bg-[#FFFBEB] text-[#881337] border-[#FECDD3]'
          }`}>
            <Sparkles className="w-4 h-4 text-[#E11D48]" />
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Admin Header */}
      <section className="bg-[#FFFBEB] border-b border-[#FECDD3] py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FFE4E6] text-[#881337] border border-[#FCA5A5] mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>CinemAI Telemetry & Moderation Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#881337]">
              Admin Operations Dashboard
            </h1>
            <p className="text-xs text-[#713F12] mt-0.5">
              Live sentiment metrics, AWS Free Tier telemetry, and toxic content quarantine
            </p>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-[#881337] bg-[#FEFCE8] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-xl shadow-sm transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#E11D48] ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Telemetry</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex gap-2 mt-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-[#E11D48] text-white shadow-sm shadow-[#FECDD3]'
                : 'bg-[#FFFBEB] text-[#881337] border border-[#FECDD3] hover:bg-[#FFE4E6]'
            }`}
          >
            Analytics & Telemetry
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`relative px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'queue'
                ? 'bg-[#E11D48] text-white shadow-sm shadow-[#FECDD3]'
                : 'bg-[#FFFBEB] text-[#881337] border border-[#FECDD3] hover:bg-[#FFE4E6]'
            }`}
          >
            <span>Flagged Reviews Queue</span>
            {analytics?.flagged_reviews_count > 0 && (
              <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] bg-white text-[#E11D48] font-extrabold">
                {analytics.flagged_reviews_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('addMovie')}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'addMovie'
                ? 'bg-[#E11D48] text-white shadow-sm shadow-[#FECDD3]'
                : 'bg-[#FFFBEB] text-[#881337] border border-[#FECDD3] hover:bg-[#FFE4E6]'
            }`}
          >
            + Add New Movie (S3 Vault)
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFBEB] border border-[#FECDD3] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#E11D48] mb-2">
                  <Film className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1239]">Catalog</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#881337]">
                  {analytics?.total_movies || 0}
                </h3>
                <p className="text-xs text-[#713F12]">Total Movie Titles</p>
              </div>

              <div className="bg-[#FFFBEB] border border-[#FECDD3] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#E11D48] mb-2">
                  <MessageSquare className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1239]">Reviews</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#881337]">
                  {analytics?.total_reviews || 0}
                </h3>
                <p className="text-xs text-[#713F12]">Audience Reviews</p>
              </div>

              <div className="bg-[#FFFBEB] border border-[#FECDD3] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#E11D48] mb-2">
                  <Users className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1239]">Members</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#881337]">
                  {analytics?.total_users || 0}
                </h3>
                <p className="text-xs text-[#713F12]">Registered Accounts</p>
              </div>

              <div className="bg-[#FFFBEB] border border-[#FECDD3] p-5 rounded-2xl shadow-sm">
                <div className="flex items-center justify-between text-[#E11D48] mb-2">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#9F1239]">Queue</span>
                </div>
                <h3 className="text-2xl font-extrabold text-[#881337]">
                  {analytics?.flagged_reviews_count || 0}
                </h3>
                <p className="text-xs text-[#713F12]">Flagged Toxic Reviews</p>
              </div>
            </div>

            {/* Network Sentiment Distribution Gauge & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Visual Distribution */}
              <div className="lg:col-span-7 bg-[#FFFBEB] border border-[#FECDD3] p-6 rounded-2xl shadow-sm space-y-5">
                <div>
                  <h3 className="text-base font-bold text-[#881337] flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-[#E11D48]" />
                    Overall Sentiment Polarity Distribution
                  </h3>
                  <p className="text-xs text-[#713F12]">Aggregated across all verified movie reviews</p>
                </div>

                {/* Styled Sentiment Gauge Bar */}
                <div className="space-y-4">
                  <div className="h-6 w-full bg-[#FEFCE8] rounded-xl border border-[#FECDD3] flex overflow-hidden p-1 shadow-inner">
                    <div
                      style={{ width: `${breakdown.positive_pct}%` }}
                      className="h-full bg-amber-400 rounded-l-lg transition-all duration-700"
                    />
                    <div
                      style={{ width: `${breakdown.neutral_pct}%` }}
                      className="h-full bg-[#FCD34D] transition-all duration-700"
                    />
                    <div
                      style={{ width: `${breakdown.negative_pct}%` }}
                      className="h-full bg-[#FB7185] rounded-r-lg transition-all duration-700"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-center">
                      <p className="text-[10px] font-bold text-amber-900 uppercase">Positive</p>
                      <p className="text-xl font-extrabold text-amber-900">{breakdown.positive_pct}%</p>
                    </div>

                    <div className="p-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-center">
                      <p className="text-[10px] font-bold text-[#92400E] uppercase">Neutral</p>
                      <p className="text-xl font-extrabold text-[#92400E]">{breakdown.neutral_pct}%</p>
                    </div>

                    <div className="p-3 rounded-xl bg-rose-100 border border-rose-200 text-center">
                      <p className="text-[10px] font-bold text-rose-800 uppercase">Negative</p>
                      <p className="text-xl font-extrabold text-rose-800">{breakdown.negative_pct}%</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* AWS Free Tier Telemetry Panel */}
              <div className="lg:col-span-5 bg-[#FFFBEB] border border-[#FECDD3] p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-base font-bold text-[#881337] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#E11D48]" />
                  AWS Cloud Architecture Telemetry
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                    <span className="font-semibold text-[#881337]">EC2 Compute:</span>
                    <span className="text-[#E11D48] font-bold">t2/t3.micro (Direct Host)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                    <span className="font-semibold text-[#881337]">Relational DB:</span>
                    <span className="text-[#E11D48] font-bold">PostgreSQL RDS (db.t3.micro)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                    <span className="font-semibold text-[#881337]">Storage Vault:</span>
                    <span className="text-[#E11D48] font-bold">AWS S3 (SSE-S3 AES256)</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                    <span className="font-semibold text-[#881337]">Email Alerts:</span>
                    <span className="text-[#E11D48] font-bold">Amazon SES Direct Protocol</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Flagged Toxic Reviews Moderation Queue */}
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-[#881337]">
                  Toxic Content Moderation Queue ({analytics?.flagged_queue?.length || 0})
                </h2>
                <p className="text-xs text-[#713F12]">
                  Reviews flagged by the NLP sentiment engine for severe negative phrasing or offensive terms
                </p>
              </div>
            </div>

            {!analytics?.flagged_queue || analytics.flagged_queue.length === 0 ? (
              <div className="bg-[#FFFBEB] border border-[#FECDD3] rounded-2xl p-12 text-center text-[#881337]">
                <CheckCircle className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold">Moderation Queue Clear!</h3>
                <p className="text-xs text-[#713F12] mt-0.5">No flagged reviews awaiting administrator inspection.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {analytics.flagged_queue.map((rev) => (
                  <div
                    key={rev.id}
                    className="bg-[#FFFBEB] border border-[#FCA5A5] rounded-xl p-5 shadow-sm space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-[#FECDD3] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FFE4E6] text-[#881337] border border-[#FCA5A5]">
                            FLAGGED TOXIC
                          </span>
                          <span className="text-xs font-bold text-[#881337]">
                            Movie ID: {rev.movie_id}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#9F1239] mt-0.5">
                          Submitted on {new Date(rev.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <SentimentBadge label={rev.sentiment_label} score={rev.sentiment_score} />
                        <span className="text-xs font-bold text-[#881337]">⭐ {rev.rating}/5</span>
                      </div>
                    </div>

                    <p className="text-xs sm:text-sm text-[#881337] italic bg-[#FEFCE8] p-3 rounded-lg border border-[#FECDD3]">
                      "{rev.review_text}"
                    </p>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => handleUnflag(rev.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFBEB] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-lg text-xs font-bold text-[#881337] transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Dismiss & Unflag</span>
                      </button>

                      <button
                        onClick={() => handlePurge(rev.id)}
                        disabled={actionLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E11D48] hover:bg-[#BE123C] text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Purge from DB</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Add New Movie Form with S3 Poster Uploader */}
        {activeTab === 'addMovie' && (
          <div className="max-w-2xl mx-auto bg-[#FFFBEB] border border-[#FECDD3] p-6 sm:p-8 rounded-2xl shadow-sm space-y-5">
            <div>
              <h2 className="text-xl font-bold text-[#881337] flex items-center gap-2">
                <Film className="w-5 h-5 text-[#E11D48]" />
                Register New Cinematic Title
              </h2>
              <p className="text-xs text-[#713F12]">
                Posters are uploaded via Amazon S3 Presigned URL with Server-Side Encryption (SSE-S3).
              </p>
            </div>

            <form onSubmit={handleCreateMovie} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                  Movie Title
                </label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  placeholder="e.g. Blade Runner 2049"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                    Genre
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    placeholder="e.g. Sci-Fi / Action"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                    Director
                  </label>
                  <input
                    type="text"
                    required
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    placeholder="e.g. Denis Villeneuve"
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] focus:outline-none focus:border-[#E11D48]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                    Release Year
                  </label>
                  <input
                    type="number"
                    required
                    min={1888}
                    max={2100}
                    value={movieForm.release_year}
                    onChange={(e) => setMovieForm({ ...movieForm, release_year: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] focus:outline-none focus:border-[#E11D48]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                  Synopsis
                </label>
                <textarea
                  rows={4}
                  required
                  value={movieForm.synopsis}
                  onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                  placeholder="Comprehensive plot summary for audience context..."
                  className="w-full px-3 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] focus:outline-none focus:border-[#E11D48]"
                />
              </div>

              {/* S3 Poster Upload Box */}
              <div>
                <label className="block text-xs font-bold text-[#881337] uppercase tracking-wider mb-1">
                  Movie Poster (Amazon S3 Direct Upload)
                </label>
                <div className="border-2 border-dashed border-[#FCA5A5] rounded-xl p-4 text-center bg-[#FEFCE8]">
                  <UploadCloud className="w-8 h-8 text-[#E11D48] mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#881337] mb-1">
                    {uploadProgress ? 'Encrypting & Uploading to AWS S3...' : 'Click to Select Poster Image'}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="text-xs text-[#881337] file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E11D48] file:text-white hover:file:bg-[#BE123C] cursor-pointer"
                  />
                  {movieForm.poster_s3_url && (
                    <p className="text-[11px] text-emerald-800 font-bold mt-2 truncate">
                      ✓ S3 Key Attached: {movieForm.poster_s3_url}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className="px-4 py-2 text-xs font-bold text-[#881337] hover:text-[#E11D48]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || uploadProgress}
                  className="px-5 py-2.5 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-xl shadow-sm transition-all hover:scale-[1.01] disabled:opacity-50"
                >
                  {actionLoading ? 'Creating Movie...' : 'Save & Publish Movie'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
