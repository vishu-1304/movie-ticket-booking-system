import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { useCity } from '../context/CityContext';
import { useCities, useMovies } from '../services/queries';
import { Search, MapPin, User, LogOut, LayoutDashboard, Film, ChevronDown, X } from 'lucide-react';
import { getMovieStaticMedia } from '../utils/tmdb';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { selectedCityId, selectedCityName, setSelectedCity, searchQuery, setSearchQuery } = useCity();
  const { data: cities } = useCities();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();

  const { data: suggestionsData } = useMovies({ search: searchQuery.trim().length > 1 ? searchQuery : undefined });
  const searchSuggestions = searchQuery.trim().length > 1 ? suggestionsData : [];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Film className="w-8 h-8 text-brand animate-pulse" />
          <span className="text-2xl font-extrabold tracking-wider bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            TICKET<span className="text-brand neon-text">PASS</span>
          </span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-lg relative hidden sm:block">
          <input
            type="text"
            placeholder="Search for movies, genres, or directors..."
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-full py-2.5 pl-11 pr-10 text-dark-text focus:outline-none focus:border-brand/50 transition-all duration-300 placeholder-dark-muted"
          />
          <Search className="w-5 h-5 text-dark-muted absolute left-4 top-1/2 -translate-y-1/2" />
          
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-muted hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Autocomplete Suggestions Dropdown */}
          {showSuggestions && searchQuery.trim().length > 1 && searchSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-2xl shadow-2xl overflow-hidden z-50 glass divide-y divide-dark-border/45">
              {searchSuggestions.slice(0, 5).map((movie) => {
                const media = getMovieStaticMedia(movie.title, movie.posterUrl);
                return (
                  <div
                    key={movie.id}
                    onClick={() => {
                      navigate(`/movies/${movie.id}`);
                      setSearchQuery('');
                      setShowSuggestions(false);
                    }}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 cursor-pointer transition-colors"
                  >
                    <img src={media.poster} alt={movie.title} className="w-9 h-12 object-cover rounded-lg border border-dark-border" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-dark-text truncate">{movie.title}</p>
                      <p className="text-xs text-dark-muted truncate">{movie.genre} • {movie.language}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showSuggestions && searchQuery.trim().length > 1 && searchSuggestions && searchSuggestions.length === 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-dark-card border border-dark-border rounded-2xl shadow-2xl p-4 z-50 glass text-center text-xs text-dark-muted">
              No movies found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Actions Menu */}
        <div className="flex items-center gap-6">
          
          {/* City Selection Selector */}
          <div className="relative">
            <button
              onClick={() => setCityDropdownOpen(!cityDropdownOpen)}
              className="flex items-center gap-1.5 text-sm font-medium hover:text-brand transition-colors duration-300 text-dark-text"
            >
              <MapPin className="w-4.5 h-4.5 text-brand" />
              <span>{selectedCityName}</span>
              <ChevronDown className="w-4 h-4 text-dark-muted" />
            </button>

            {cityDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-1 z-50 glass">
                {cities?.map((city) => (
                  <button
                    key={city.id}
                    onClick={() => {
                      setSelectedCity(city.id);
                      setCityDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-all duration-200 ${
                      selectedCityId === city.id
                        ? 'bg-brand/10 text-brand font-semibold'
                        : 'hover:bg-white/5 text-dark-muted hover:text-dark-text'
                    }`}
                  >
                    {city.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Account Controls */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 bg-dark-card/80 border border-dark-border py-1.5 px-3 rounded-full hover:border-brand/40 transition-all duration-300"
              >
                <div className="w-7 h-7 bg-brand/20 border border-brand/40 text-brand rounded-full flex items-center justify-center font-bold text-xs uppercase">
                  {user.name[0]}
                </div>
                <span className="text-sm font-medium hidden md:block">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-4 h-4 text-dark-muted" />
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-dark-card border border-dark-border rounded-xl shadow-2xl py-2 z-50 glass">
                  <div className="px-4 py-2 border-b border-dark-border">
                    <p className="text-xs text-dark-muted">Signed in as</p>
                    <p className="text-sm font-semibold truncate text-dark-text">{user.email}</p>
                  </div>

                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-dark-muted hover:text-dark-text hover:bg-white/5 transition-all duration-200"
                    >
                      <LayoutDashboard className="w-4 h-4 text-brand" />
                      Admin Dashboard
                    </Link>
                  )}

                  <Link
                    to="/profile"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-dark-muted hover:text-dark-text hover:bg-white/5 transition-all duration-200"
                  >
                    <User className="w-4 h-4 text-brand" />
                    My Booking History
                  </Link>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 border-t border-dark-border"
                  >
                    <LogOut className="w-4 h-4" />
                    Log Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/auth"
              className="bg-brand hover:bg-brand-hover text-white text-sm font-semibold py-2 px-6 rounded-full transition-all duration-300 neon-glow hover:-translate-y-0.5"
            >
              Sign In
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
};
