import React, { useState, useEffect } from 'react';
import { Search, Sparkles, Film, BarChart2, ShieldCheck, RefreshCw } from 'lucide-react';
import { movieService } from '../services/api';
import { MovieCard } from '../components/MovieCard';

const GENRES = [
  'All',
  'Sci-Fi',
  'Drama',
  'Adventure',
  'Action',
  'Animation',
  'Biography',
  'Fantasy',
];

export const HomePage = () => {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  const fetchMovies = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await movieService.getMovies({
        genre: selectedGenre === 'All' ? undefined : selectedGenre,
        search: searchQuery.trim() || undefined,
      });
      setMovies(data);
    } catch (err) {
      console.error('Error fetching movies:', err);
      setError('Could not connect to CinemAI API. Ensure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMovies();
    }, 250);
    return () => clearTimeout(timer);
  }, [selectedGenre, searchQuery]);

  return (
    <div className="min-h-screen bg-[#FEFCE8] pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-[#FFFBEB] border border-[#FECDD3] rounded-2xl p-6 sm:p-10 shadow-sm relative">
          <div className="max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFE4E6] border border-[#FCA5A5] text-[#881337] text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-[#E11D48]" />
              <span>Cloud-Native AI Sentiment Analytics Network</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-[#881337] tracking-tight leading-tight">
              Honest Film Reviews <br />
              Powered by <span className="text-[#E11D48] underline decoration-[#FECDD3]">Live NLP Intelligence</span>.
            </h1>

            <p className="text-sm sm:text-base text-[#713F12] leading-relaxed max-w-2xl">
              Explore cinema through real-time sentiment polarity, VADER NLP scoring, and toxic speech filtering. 
              Optimized for AWS Free Tier direct hosting with encrypted S3 Dossier vaulting.
            </p>

            {/* Architecture Highlights */}
            <div className="pt-2 flex flex-wrap gap-2 text-xs font-semibold text-[#881337]">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E11D48]" />
                AES-256 S3 Vault
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                <BarChart2 className="w-3.5 h-3.5 text-[#E11D48]" />
                NLTK VADER Polarity
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FEFCE8] border border-[#FECDD3]">
                <Film className="w-3.5 h-3.5 text-[#E11D48]" />
                FastAPI Direct Host
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E11D48]" />
            <input
              type="text"
              placeholder="Search by title, director, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl bg-white border border-[#FCA5A5] text-[#881337] placeholder-[#881337]/50 focus:outline-none focus:border-[#E11D48] focus:ring-2 focus:ring-[#E11D48]/20 transition-all"
            />
          </div>

          <button
            onClick={fetchMovies}
            title="Refresh titles"
            className="self-end sm:self-auto flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-[#881337] bg-[#FFFBEB] hover:bg-[#FFE4E6] border border-[#FECDD3] rounded-xl transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#E11D48] ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Genre Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {GENRES.map((genre) => {
            const active = selectedGenre === genre;
            return (
              <button
                key={genre}
                onClick={() => setSelectedGenre(genre)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-full whitespace-nowrap transition-all duration-200 ${
                  active
                    ? 'bg-[#E11D48] text-white shadow-sm shadow-[#FECDD3]'
                    : 'bg-[#FFFBEB] text-[#881337] border border-[#FECDD3] hover:border-[#E11D48] hover:bg-[#FFE4E6]'
                }`}
              >
                {genre}
              </button>
            );
          })}
        </div>
      </section>

      {/* Movies Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && movies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-[#881337] space-y-3">
            <RefreshCw className="w-8 h-8 text-[#E11D48] animate-spin" />
            <p className="text-sm font-semibold">Running sentiment analytics telemetry...</p>
          </div>
        ) : error ? (
          <div className="bg-[#FFE4E6] border border-[#FCA5A5] rounded-xl p-6 text-center text-[#881337] max-w-lg mx-auto">
            <p className="font-bold mb-2">Network Notice</p>
            <p className="text-xs mb-4">{error}</p>
            <button
              onClick={fetchMovies}
              className="px-4 py-2 bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-bold rounded-lg shadow-sm"
            >
              Retry Connection
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="bg-[#FFFBEB] border border-[#FECDD3] rounded-2xl p-12 text-center text-[#881337] max-w-md mx-auto">
            <Film className="w-12 h-12 text-[#E11D48] mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold mb-1">No movies match your search</h3>
            <p className="text-xs text-[#713F12]">Try adjusting your genre filters or search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
