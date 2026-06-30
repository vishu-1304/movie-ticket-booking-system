import React, { useState } from 'react';
import { useMovies } from '../../services/queries';
import api from '../../services/api';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Film, Check, AlertCircle } from 'lucide-react';
import { getMovieStaticMedia } from '../../utils/tmdb';

export const AdminMoviePage: React.FC = () => {
  const queryClient = useQueryClient();
  const { data: movies, isLoading } = useMovies({});

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(120);
  const [language, setLanguage] = useState('English');
  const [genre, setGenre] = useState('');
  const [director, setDirector] = useState('');
  const [cast, setCast] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [trailerUrl, setTrailerUrl] = useState('');
  const [releaseDate, setReleaseDate] = useState('');
  const [rating, setRating] = useState('UA');

  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      await api.post('/admin/movies', {
        title,
        description,
        duration: Number(duration),
        language,
        genre,
        director,
        cast,
        posterUrl,
        trailerUrl: trailerUrl || null,
        releaseDate: new Date(releaseDate).toISOString(),
        rating,
      });

      setSuccess('Movie added successfully!');
      setTitle('');
      setDescription('');
      setGenre('');
      setDirector('');
      setCast('');
      setPosterUrl('');
      setTrailerUrl('');
      setReleaseDate('');

      // Refresh list
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      setFormOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save movie details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (movieId: string) => {
    if (!window.confirm('Are you sure you want to delete this movie? This will clear all its scheduled shows.')) return;
    try {
      await api.delete(`/admin/movies/${movieId}`);
      queryClient.invalidateQueries({ queryKey: ['movies'] });
    } catch (err) {
      alert('Failed to delete movie');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-8">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-dark-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-black">Movie Catalogue</h1>
          <p className="text-xs text-dark-muted">Browse catalog database and append releases</p>
        </div>

        <button
          onClick={() => setFormOpen(!formOpen)}
          className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-200"
        >
          <Plus className="w-4.5 h-4.5" />
          Add Movie
        </button>
      </div>

      {/* Add Movie Form Panel */}
      {formOpen && (
        <form onSubmit={handleSubmit} className="bg-dark-card border border-dark-border rounded-2xl p-6 glass space-y-6 max-w-3xl">
          <h2 className="text-lg font-bold">New Movie Specifications</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Movie Title</label>
              <input
                type="text"
                required
                placeholder="Interstellar"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Genre(s) (comma-separated)</label>
              <input
                type="text"
                required
                placeholder="Sci-Fi, Adventure"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Duration (minutes)</label>
              <input
                type="number"
                required
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Language</label>
              <input
                type="text"
                required
                placeholder="English"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Director</label>
              <input
                type="text"
                required
                placeholder="Christopher Nolan"
                value={director}
                onChange={(e) => setDirector(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Rating Code</label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                className="w-full bg-dark-bg border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              >
                <option value="U">U (Universal)</option>
                <option value="UA">UA (Parental Guidance)</option>
                <option value="A">A (Adults Only)</option>
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-dark-muted font-bold">Cast (comma-separated)</label>
              <input
                type="text"
                required
                placeholder="Matthew McConaughey, Anne Hathaway"
                value={cast}
                onChange={(e) => setCast(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs text-dark-muted font-bold">Description Details</label>
              <textarea
                required
                rows={3}
                placeholder="Enter description plot..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Poster Image URL</label>
              <input
                type="url"
                required
                placeholder="https://example.com/poster.jpg"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Trailer Embed URL</label>
              <input
                type="url"
                placeholder="https://youtube.com/embed/..."
                value={trailerUrl}
                onChange={(e) => setTrailerUrl(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-bold">Release Date</label>
              <input
                type="date"
                required
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 px-4 text-dark-text focus:outline-none focus:border-brand/40"
              />
            </div>

          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-dark-border/40">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="bg-transparent hover:bg-white/5 border border-dark-border text-dark-muted hover:text-dark-text text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
            >
              {submitting ? 'Adding...' : 'Save Specifications'}
            </button>
          </div>
        </form>
      )}

      {/* Catalog Table */}
      {isLoading ? (
        <div className="h-48 bg-dark-card rounded-2xl animate-pulse"></div>
      ) : movies && movies.length > 0 ? (
        <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden glass">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="bg-white/5 border-b border-dark-border text-dark-muted font-bold uppercase tracking-wider">
                <th className="p-4">Movie Info</th>
                <th className="p-4">Language & Rating</th>
                <th className="p-4">Genre</th>
                <th className="p-4">Duration</th>
                <th className="p-4 text-right">Delete Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border/40">
              {movies.map((movie) => (
                <tr key={movie.id} className="hover:bg-white/2 transition-colors">
                  <td className="p-4 flex items-center gap-3">
                    <img src={getMovieStaticMedia(movie.title, movie.posterUrl).poster} alt="" className="w-10 h-14 object-cover rounded-lg border border-dark-border" />
                    <div className="max-w-[150px] sm:max-w-[200px] md:max-w-[250px] truncate">
                      <p className="font-bold text-sm text-dark-text truncate" title={movie.title}>{movie.title}</p>
                      <p className="text-[10px] text-dark-muted mt-0.5 truncate" title={movie.director}>Dir: {movie.director}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-semibold text-dark-text">{movie.language}</p>
                    <span className="text-[9px] font-bold text-brand bg-brand/10 border border-brand/20 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                      {movie.rating}
                    </span>
                  </td>
                  <td className="p-4 font-medium text-dark-muted">{movie.genre}</td>
                  <td className="p-4 font-medium text-dark-muted">{movie.duration}m</td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => handleDelete(movie.id)}
                      className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-all"
                      title="Delete Movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-10 border border-dashed border-dark-border rounded-2xl flex flex-col items-center gap-3">
          <Film className="w-8 h-8 text-dark-muted" />
          <p className="text-sm text-dark-muted">No movies in the catalog yet.</p>
        </div>
      )}

    </div>
  );
};
export default AdminMoviePage;
