import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMovies, useIncrementInterested } from '../../services/queries';
import { useCity } from '../../context/CityContext';
import { Film, Calendar, Star, Play, Heart, Sparkles, Filter, X, Flame } from 'lucide-react';
import { getMovieStaticMedia } from '../../utils/tmdb';

const GENRES = ['All', 'Action', 'Sci-Fi', 'Adventure', 'Drama', 'Crime', 'Thriller', 'Romance', 'Comedy'];

// Helper to get embeddable YouTube URL
const getEmbedUrl = (title: string, url?: string) => {
  if (!url) {
    // Fallback search trailer queries or default trailers for known titles
    const query = encodeURIComponent(title + ' Official Trailer');
    return `https://www.youtube.com/embed?listType=search&list=${query}`;
  }
  let videoId = '';
  if (url.includes('v=')) {
    videoId = url.split('v=')[1]?.split('&')[0];
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0];
  } else if (url.includes('embed/')) {
    return url;
  }
  return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : '';
};

export const MovieListPage: React.FC = () => {
  const { selectedCityId } = useCity();
  const { searchQuery } = useCity();
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [activeTab, setActiveTab] = useState<'showing' | 'upcoming'>('showing');
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest');
  const [trailerVideoUrl, setTrailerVideoUrl] = useState<string | null>(null);
  const [trailerTitle, setTrailerTitle] = useState<string>('');
  const [currentSlide, setCurrentSlide] = useState(0);

  const navigate = useNavigate();
  const incrementInterestedMutation = useIncrementInterested();

  // Local storage cache for liked movies
  const [likedMovies, setLikedMovies] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('likedMovies') || '[]');
    } catch {
      return [];
    }
  });

  const filters = {
    cityId: activeTab === 'showing' ? (selectedCityId || undefined) : undefined,
    search: searchQuery || undefined,
    genre: selectedGenre === 'All' ? undefined : selectedGenre,
    status: activeTab,
  };

  const { data: movies, isLoading } = useMovies(filters);

  // Filter & sort movies locally
  const processedMovies = React.useMemo(() => {
    if (!movies) return [];
    return [...movies].sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      } else {
        return (b.interested || 0) - (a.interested || 0);
      }
    });
  }, [movies, sortBy]);

  // Auto-play timer for Hero slider
  React.useEffect(() => {
    if (activeTab !== 'showing' || searchQuery || processedMovies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % Math.min(processedMovies.length, 3));
    }, 6000);
    return () => clearInterval(interval);
  }, [processedMovies, activeTab, searchQuery]);

  // Pick the first movie for the hero banner if loaded
  const heroMovie = processedMovies && processedMovies.length > 0 ? processedMovies[0] : null;

  const handleLikeClick = async (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedMovies.includes(movieId)) return; // Already liked
    try {
      await incrementInterestedMutation.mutateAsync(movieId);
      const updated = [...likedMovies, movieId];
      setLikedMovies(updated);
      localStorage.setItem('likedMovies', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to register interest:', err);
    }
  };

  const openTrailerModal = (title: string, trailerUrl?: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setTrailerTitle(title);
    setTrailerVideoUrl(getEmbedUrl(title, trailerUrl));
  };

  const sliderMovies = processedMovies.slice(0, 3);
  const activeHeroMovie = sliderMovies[currentSlide] || heroMovie;
  const activeMedia = activeHeroMovie ? getMovieStaticMedia(activeHeroMovie.title, activeHeroMovie.posterUrl) : null;
  const backdropUrl = activeMedia ? activeMedia.backdrop : '';

  return (
    <div className="space-y-12 pb-16 relative">

      {/* 1. Hero Promo Banner Slider */}
      {sliderMovies.length > 0 && !searchQuery && activeTab === 'showing' && (
        <div className="relative h-[480px] w-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] group border border-dark-border/30">
          <div
            className="absolute inset-0 bg-cover bg-center transition-all duration-1000 ease-in-out group-hover:scale-105"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/60 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/85 via-transparent to-transparent"></div>

          <div className="absolute bottom-10 left-6 right-6 md:left-12 md:right-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex gap-2.5 items-center flex-wrap">
                <span className="bg-brand text-white text-[11px] font-black px-3 py-1 rounded-md uppercase tracking-wider shadow-lg shadow-brand/35">
                  {activeHeroMovie.rating}
                </span>
                <span className="text-xs text-white font-bold bg-white/10 px-3 py-1 rounded-md backdrop-blur-md border border-white/15">
                  {activeHeroMovie.genre}
                </span>
                <span className="text-xs text-white font-bold bg-white/10 px-3 py-1 rounded-md backdrop-blur-md border border-white/15">
                  {activeHeroMovie.language}
                </span>
                <span className="text-xs text-white font-bold bg-white/10 px-3 py-1 rounded-md backdrop-blur-md border border-white/15">
                  {activeHeroMovie.duration} Mins
                </span>
                <span className="flex items-center gap-1.5 text-xs text-yellow-500 font-bold bg-yellow-500/10 px-3 py-1 rounded-md border border-yellow-500/20">
                  <Flame className="w-3.5 h-3.5 fill-yellow-500" />
                  Trending #{currentSlide + 1}
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white drop-shadow-md transition-all duration-500">
                {activeHeroMovie.title}
              </h1>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed line-clamp-3 drop-shadow-sm font-medium transition-all duration-500">
                {activeHeroMovie.description}
              </p>
            </div>

            <div className="flex gap-4 self-start md:self-auto shrink-0 z-20">
              {activeHeroMovie.trailerUrl && (
                <button
                  onClick={() => openTrailerModal(activeHeroMovie.title, activeHeroMovie.trailerUrl)}
                  className="bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold py-3.5 px-6 rounded-full flex items-center gap-2 transition-all duration-300 backdrop-blur"
                >
                  Watch Trailer
                </button>
              )}
              <button
                onClick={() => navigate(`/movies/${activeHeroMovie.id}`)}
                className="bg-brand hover:bg-brand-hover text-white text-sm font-black py-3.5 px-8 rounded-full flex items-center gap-2 hover:shadow-[0_0_20px_rgba(229,9,20,0.55)] hover:-translate-y-0.5 transition-all duration-300"
              >
                <Play className="w-4 h-4 fill-white" />
                Book Tickets
              </button>
            </div>
          </div>

          {/* Slider pagination dots */}
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2.5 z-30">
            {sliderMovies.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${currentSlide === idx ? 'bg-brand h-6 scale-110 shadow-[0_0_8px_rgba(229,9,20,0.8)]' : 'bg-white/30 hover:bg-white/60'
                  }`}
              ></button>
            ))}
          </div>
        </div>
      )}

      {/* Trending Movies Row */}
      {activeTab === 'showing' && !searchQuery && processedMovies.length > 0 && (
        <div className="space-y-6">
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand fill-brand animate-pulse" />
            Top Trending Movies
          </h2>
          <div className="flex gap-10 overflow-x-auto no-scrollbar py-4 px-3">
            {processedMovies.slice(0, 5).map((movie, index) => {
              const media = getMovieStaticMedia(movie.title, movie.posterUrl);
              return (
                <div
                  key={movie.id}
                  onClick={() => navigate(`/movies/${movie.id}`)}
                  className="flex items-end relative min-w-[220px] h-64 cursor-pointer group select-none"
                >
                  {/* Giant Number */}
                  <span className="text-[120px] font-black leading-none select-none absolute left-[-15px] bottom-[-25px] z-10 transition-all duration-500 stroke-text">
                    {index + 1}
                  </span>

                  {/* Poster */}
                  <div className="w-[140px] h-[210px] rounded-xl overflow-hidden border border-dark-border/60 shadow-2xl relative z-20 ml-auto transition-all duration-500 group-hover:border-brand/40 group-hover:scale-[1.03] group-hover:shadow-[0_8px_30px_rgba(229,9,20,0.25)]">
                    <img src={media.poster} alt={movie.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center p-3">
                      <span className="bg-brand text-white text-[10px] font-black px-2.5 py-1.5 rounded-lg shadow-lg">Book Now</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Top Header Navigation with Dual Tabs & Sorting */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-dark-border/40 pb-5">
          <div className="flex gap-4 border-b-2 border-transparent">
            <button
              onClick={() => {
                setActiveTab('showing');
                setSelectedGenre('All');
              }}
              className={`text-2xl font-black pb-2 transition-all duration-300 relative ${activeTab === 'showing' ? 'text-white' : 'text-dark-muted hover:text-dark-text'
                }`}
            >
              Now Showing
              {activeTab === 'showing' && (
                <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-brand rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]"></span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('upcoming');
                setSelectedGenre('All');
              }}
              className={`text-2xl font-black pb-2 transition-all duration-300 relative flex items-center gap-2 ${activeTab === 'upcoming' ? 'text-white' : 'text-dark-muted hover:text-dark-text'
                }`}
            >
              Coming Soon
              <span className="bg-brand/25 text-brand text-[10px] px-2 py-0.5 rounded-full font-bold">New</span>
              {activeTab === 'upcoming' && (
                <span className="absolute bottom-[-2px] left-0 right-0 h-1 bg-brand rounded-full shadow-[0_0_10px_rgba(229,9,20,0.8)]"></span>
              )}
            </button>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-dark-muted font-bold flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Sort By:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-dark-card border border-dark-border/60 hover:border-dark-border text-xs text-dark-text font-bold px-3.5 py-2 rounded-xl focus:outline-none focus:border-brand transition-all duration-300 cursor-pointer"
            >
              <option value="latest">Latest Release</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>

        {/* Genre Tags Panel */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`text-xs px-4.5 py-2.5 rounded-full border transition-all duration-300 font-bold ${selectedGenre === genre
                ? 'bg-brand text-white border-brand shadow-[0_0_12px_rgba(229,9,20,0.35)]'
                : 'bg-dark-card/40 border-dark-border text-dark-muted hover:text-dark-text hover:border-dark-border/80'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Movies Layout Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-dark-card border border-dark-border rounded-2xl animate-pulse"></div>
          ))}
        </div>
      ) : processedMovies && processedMovies.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {processedMovies.map((movie) => {
            const isLiked = likedMovies.includes(movie.id);
            const formattedDate = new Date(movie.releaseDate).toLocaleDateString('en-US', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            });

            return (
              <div
                key={movie.id}
                onClick={() => activeTab === 'showing' && navigate(`/movies/${movie.id}`)}
                className={`bg-dark-card border border-dark-border/60 rounded-2xl overflow-hidden group glass relative flex flex-col h-full transition-all duration-300 hover:border-brand/40 ${activeTab === 'showing' ? 'cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.6)] hover:-translate-y-1' : 'hover:shadow-[0_8px_30px_rgba(0,0,0,0.4)]'
                  }`}
              >
                {/* Poster container */}
                <div className="aspect-[2/3] w-full overflow-hidden relative">
                  <img
                    src={getMovieStaticMedia(movie.title, movie.posterUrl).poster}
                    alt={movie.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />

                  {/* Action Overlays */}
                  {activeTab === 'showing' ? (
                    <div className="absolute inset-0 bg-gradient-to-t from-dark-bg/95 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                      <div className="w-full bg-brand hover:bg-brand-hover text-white text-xs font-black py-3 rounded-xl text-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                        Book Showtimes
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-dark-bg/75 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center p-4 gap-3">
                      {movie.trailerUrl && (
                        <button
                          onClick={(e) => openTrailerModal(movie.title, movie.trailerUrl, e)}
                          className="w-full bg-white text-dark-bg hover:bg-gray-200 text-xs font-black py-2.5 rounded-xl text-center shadow flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-dark-bg" /> Watch Trailer
                        </button>
                      )}
                      <button
                        onClick={(e) => handleLikeClick(movie.id, e)}
                        className={`w-full text-xs font-black py-2.5 rounded-xl text-center shadow flex items-center justify-center gap-1.5 border transition-all duration-300 ${isLiked
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'bg-brand hover:bg-brand-hover border-brand text-white'
                          }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-brand text-brand' : 'text-white'}`} />
                        {isLiked ? 'Interested' : 'Interested?'}
                      </button>
                    </div>
                  )}

                  <span className="absolute top-3 left-3 bg-dark-bg/85 border border-dark-border text-dark-text text-[10px] font-black px-2.5 py-1 rounded backdrop-blur">
                    {movie.rating}
                  </span>
                </div>

                {/* Details container */}
                <div className="p-4 flex flex-col flex-1 gap-2.5">
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-[10px] text-brand font-black uppercase tracking-wider">{movie.genre.split(', ')[0]}</span>
                    {activeTab === 'upcoming' && (
                      <span className="text-[10px] text-dark-muted font-bold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formattedDate}
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm md:text-base line-clamp-1 group-hover:text-brand transition-colors duration-300">
                    {movie.title}
                  </h3>

                  <div className="flex items-center justify-between gap-3 text-xs text-dark-muted mt-auto pt-3 border-t border-dark-border/20">
                    {activeTab === 'showing' ? (
                      <>
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold text-dark-text">8.5</span>
                        </div>
                        <span>•</span>
                        <span className="font-medium">{movie.duration}m</span>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <Heart className="w-3.5 h-3.5 text-brand fill-brand" />
                          <span className="font-bold text-dark-text">{(movie.interested || 0).toLocaleString()}</span>
                          <span className="text-[10px] text-dark-muted font-semibold">Interested</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-4 border border-dashed border-dark-border rounded-2xl glass">
          <Film className="w-12 h-12 text-dark-muted animate-pulse" />
          <div>
            <h3 className="font-bold text-lg">No movies found</h3>
            <p className="text-sm text-dark-muted max-w-xs mt-1">Try resetting filters or matching different search terms.</p>
          </div>
        </div>
      )}

      {/* 4. Trailer Overlay Modal */}
      {trailerVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border/40">
              <h3 className="font-black text-base md:text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" /> {trailerTitle} - Official Trailer
              </h3>
              <button
                onClick={() => {
                  setTrailerVideoUrl(null);
                  setTrailerTitle('');
                }}
                className="text-dark-muted hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Video Body */}
            <div className="aspect-video w-full bg-black">
              <iframe
                src={trailerVideoUrl}
                title="Trailer Player"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MovieListPage;
