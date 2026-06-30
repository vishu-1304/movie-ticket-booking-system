import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMovieDetail, useTheatresAndShows, useIncrementInterested } from '../../services/queries';
import { useCity } from '../../context/CityContext';
import { Film, Calendar, Star, Clock, Globe2, Clapperboard, MonitorPlay, Heart, Bell, BellRing, Play, Sparkles, X } from 'lucide-react';
import { getMovieStaticMedia, fetchTMDBMovieMedia } from '../../utils/tmdb';

// Helper to get embeddable YouTube URL
const getEmbedUrl = (title: string, url?: string) => {
  if (!url) {
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

export const MovieDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { selectedCityId } = useCity();
  const navigate = useNavigate();

  // Date selection states (today, tomorrow, day after)
  const today = new Date();
  const dateTabs = [
    {
      label: 'Today',
      dateString: today.toISOString().split('T')[0],
      formatted: today.toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' }),
    },
    {
      label: 'Tomorrow',
      dateString: new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      formatted: new Date(today.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' }),
    },
    {
      label: 'Day After',
      dateString: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      formatted: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { day: 'numeric', month: 'short', weekday: 'short' }),
    },
  ];

  const [selectedDate, setSelectedDate] = useState(dateTabs[0].dateString);
  const [isReminded, setIsReminded] = useState(false);
  const [trailerVideoUrl, setTrailerVideoUrl] = useState<string | null>(null);

  // Fetch movie details
  const { data: movie, isLoading: movieLoading } = useMovieDetail(id);

  const [tmdbMedia, setTmdbMedia] = useState<{ poster: string; backdrop: string } | null>(null);

  useEffect(() => {
    if (!movie) return;
    
    // First set static seeded media as immediate display
    const staticMedia = getMovieStaticMedia(movie.title, movie.posterUrl);
    setTmdbMedia(staticMedia);
    
    // If TMDB key exists, fetch live TMDB details
    const fetchLiveMedia = async () => {
      const liveMedia = await fetchTMDBMovieMedia(movie.title);
      if (liveMedia && (liveMedia.poster || liveMedia.backdrop)) {
        setTmdbMedia(liveMedia);
      }
    };
    
    fetchLiveMedia();
  }, [movie]);

  const isUpcoming = movie ? new Date(movie.releaseDate) > today : false;

  // Fetch theatres & shows for selected movie, city, and date (only if not upcoming)
  const { data: theatres, isLoading: showsLoading } = useTheatresAndShows({
    movieId: id,
    cityId: selectedCityId,
    date: selectedDate,
  });

  // Local storage cache for liked movies
  const [likedMovies, setLikedMovies] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('likedMovies') || '[]');
    } catch {
      return [];
    }
  });

  const incrementInterestedMutation = useIncrementInterested();
  const isLiked = movie ? likedMovies.includes(movie.id) : false;

  const handleLikeClick = async () => {
    if (!movie || isLiked) return;
    try {
      await incrementInterestedMutation.mutateAsync(movie.id);
      const updated = [...likedMovies, movie.id];
      setLikedMovies(updated);
      localStorage.setItem('likedMovies', JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to register interest:', err);
    }
  };

  const handleRemindClick = () => {
    setIsReminded((prev) => !prev);
    if (!isReminded) {
      alert('Notification alert set! We will notify you when tickets go live.');
    }
  };

  const openTrailerModal = () => {
    if (!movie) return;
    setTrailerVideoUrl(getEmbedUrl(movie.title, movie.trailerUrl || undefined));
  };

  if (movieLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-pulse">
        <div className="h-96 bg-dark-card rounded-2xl"></div>
        <div className="h-48 bg-dark-card rounded-2xl"></div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="text-center py-20">
        <h3 className="text-xl font-bold">Movie not found</h3>
      </div>
    );
  }

  const formattedReleaseDate = new Date(movie.releaseDate).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const staticMedia = getMovieStaticMedia(movie.title, movie.posterUrl);
  const media = {
    poster: tmdbMedia?.poster || staticMedia.poster || movie.posterUrl,
    backdrop: tmdbMedia?.backdrop || staticMedia.backdrop || movie.posterUrl,
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* 1. Cinematic Billboard Banner */}
      <div className="relative h-[340px] md:h-[400px] w-full rounded-3xl overflow-hidden shadow-2xl border border-dark-border/30 group mb-8 select-none">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-102" 
          style={{ backgroundImage: `url(${media.backdrop})` }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-t from-dark-bg via-dark-bg/50 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-dark-bg/85 via-transparent to-transparent"></div>
        
        {/* Play Trailer Icon Overlay */}
        <button
          onClick={openTrailerModal}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand/90 hover:bg-brand text-white p-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 flex items-center justify-center hover:shadow-[0_0_30px_rgba(229,9,20,0.6)] focus:outline-none"
        >
          <Play className="w-8 h-8 fill-white ml-1" />
        </button>
      </div>

      {/* 2. Movie Info details (overlapping the billboard) */}
      <div className="grid md:grid-cols-3 gap-8 items-start relative z-10 -mt-28 px-2 md:px-6">
        
        {/* Poster */}
        <div className="aspect-[2/3] w-full max-w-[280px] mx-auto md:mx-0 rounded-2xl overflow-hidden shadow-2xl border-4 border-dark-card relative group shrink-0">
          <img src={media.poster} alt={movie.title} className="w-full h-full object-cover" />
          <button
            onClick={openTrailerModal}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-2 text-sm font-bold text-white"
          >
            <MonitorPlay className="w-10 h-10 text-brand animate-pulse" />
            Watch Trailer
          </button>
        </div>

        {/* Text Details */}
        <div className="md:col-span-2 space-y-6 bg-dark-card/60 p-6 md:p-8 rounded-2xl border border-dark-border/40 glass">
          <div className="space-y-3">
            <div className="flex gap-2 items-center flex-wrap">
              <span className="bg-brand text-white text-xs font-black px-2.5 py-1 rounded-md uppercase tracking-wider shadow-lg shadow-brand/35">
                {movie.rating}
              </span>
              <span className="text-xs text-white font-bold bg-white/10 px-2.5 py-1 rounded-md border border-white/15">
                {movie.genre}
              </span>
              {isUpcoming && (
                <span className="bg-yellow-500/10 text-yellow-500 text-xs font-bold border border-yellow-500/20 px-2.5 py-1 rounded-md">
                  Upcoming Release
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white">{movie.title}</h1>
          </div>

          {/* Quick attributes row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-dark-border/30">
            <div className="flex items-center gap-2 text-sm text-dark-text font-medium">
              <Clock className="w-4 h-4 text-brand" />
              <span>{movie.duration} Minutes</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-text font-medium">
              <Globe2 className="w-4 h-4 text-brand" />
              <span>{movie.language}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-text font-medium">
              <Clapperboard className="w-4 h-4 text-brand" />
              <span className="truncate">{movie.director}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-dark-text font-medium">
              {isUpcoming ? (
                <>
                  <Heart className="w-4 h-4 text-brand fill-brand" />
                  <span>{(movie.interested || 0).toLocaleString()} Interested</span>
                </>
              ) : (
                <>
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span>8.5 / 10</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-base text-dark-text">About the Movie</h3>
            <p className="text-dark-muted text-sm leading-relaxed">{movie.description}</p>
          </div>

          {/* Cast */}
          <div className="space-y-2">
            <h3 className="font-extrabold text-base text-dark-text">Cast Members</h3>
            <p className="text-dark-muted text-sm font-semibold">{movie.cast}</p>
          </div>
        </div>

      </div>

      {/* 2. Showtimes Scheduler OR Upcoming Movie Showcase */}
      {isUpcoming ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 space-y-6 glass flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center gap-2 text-yellow-500 font-bold justify-center md:justify-start">
              <Calendar className="w-5 h-5 animate-bounce" />
              <span>Releasing on {formattedReleaseDate}</span>
            </div>
            <h2 className="text-2xl font-black">Tickets Are Not Live Yet</h2>
            <p className="text-sm text-dark-muted max-w-md">
              This film is currently in our Upcoming list. Show interest or set a reminder to get notified as soon as advanced bookings start!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 shrink-0 w-full md:w-auto">
            <button
              onClick={handleLikeClick}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm font-black py-4 px-8 rounded-xl transition-all border ${
                isLiked
                  ? 'bg-brand/10 border-brand text-brand'
                  : 'bg-brand border-brand hover:bg-brand-hover text-white'
              }`}
            >
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand text-brand' : ''}`} />
              {isLiked ? 'Interested Registered' : 'Mark as Interested'}
            </button>
            
            <button
              onClick={handleRemindClick}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 text-sm font-black py-4 px-8 rounded-xl transition-all border ${
                isReminded
                  ? 'bg-green-500/10 border-green-500/30 text-green-400'
                  : 'bg-transparent border-dark-border hover:bg-white/5 text-dark-text'
              }`}
            >
              {isReminded ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
              {isReminded ? 'Reminder Set' : 'Remind Me'}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 md:p-8 space-y-6 glass">
          
          {/* Header & Date Picker */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-dark-border/40 pb-5">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight">Select Showtimes</h2>
              <p className="text-xs text-dark-muted">Pick a date and convenient timing below</p>
            </div>

            {/* Date tabs */}
            <div className="flex gap-2 bg-dark-bg/60 border border-dark-border rounded-xl p-1 shrink-0">
              {dateTabs.map((tab) => (
                <button
                  key={tab.dateString}
                  onClick={() => setSelectedDate(tab.dateString)}
                  className={`text-xs font-bold py-2.5 px-4 rounded-lg transition-all duration-300 ${
                    selectedDate === tab.dateString
                      ? 'bg-brand text-white'
                      : 'text-dark-muted hover:text-dark-text'
                  }`}
                >
                  <div className="text-[10px] opacity-80 font-normal">{tab.label}</div>
                  <div>{tab.formatted}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Shows Scheduler grid */}
          {showsLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-16 bg-dark-bg/60 rounded-xl"></div>
              <div className="h-16 bg-dark-bg/60 rounded-xl"></div>
            </div>
          ) : theatres && theatres.length > 0 ? (
            <div className="divide-y divide-dark-border/40">
              {theatres.map((theatre) => (
                <div key={theatre.id} className="py-6 first:pt-0 last:pb-0 flex flex-col md:flex-row gap-6 md:items-start justify-between">
                  
                  {/* Theatre Info */}
                  <div className="max-w-sm space-y-1">
                    <h3 className="font-extrabold text-base md:text-lg text-dark-text hover:text-brand transition-colors cursor-pointer">{theatre.name}</h3>
                    <p className="text-xs text-dark-muted">{theatre.address}</p>
                  </div>

                  {/* Audi Schedules */}
                  <div className="flex-1 space-y-4">
                    {theatre.screens.map((screen) => (
                      <div key={screen.id} className="flex flex-col sm:flex-row gap-2.5 sm:items-center">
                        <span className="text-[10px] font-bold tracking-wider text-dark-muted uppercase bg-white/5 border border-dark-border px-2 py-0.5 rounded w-fit sm:w-auto">
                          {screen.name}
                        </span>
                        
                        <div className="flex gap-2 flex-wrap">
                          {screen.shows.map((show) => {
                            const showTime = new Date(show.startTime).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                            });
                            
                            return (
                              <button
                                key={show.id}
                                onClick={() => navigate(`/shows/${show.id}`)}
                                className="bg-dark-bg/80 border border-dark-border/80 hover:border-brand/40 text-dark-text hover:text-brand text-xs font-semibold py-2 px-4 rounded-xl transition-all duration-300 hover:scale-[1.03]"
                              >
                                {showTime}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 flex flex-col items-center gap-3">
              <Film className="w-10 h-10 text-dark-muted animate-pulse" />
              <p className="text-sm text-dark-muted font-medium">No shows scheduled for this date in your selected city.</p>
            </div>
          )}

        </div>
      )}

      {/* 3. Trailer Overlay Modal */}
      {trailerVideoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="relative w-full max-w-4xl bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl animate-scale-up">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-dark-border/40">
              <h3 className="font-black text-base md:text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-brand" /> {movie.title} - Official Trailer
              </h3>
              <button 
                onClick={() => setTrailerVideoUrl(null)}
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

export default MovieDetailPage;
