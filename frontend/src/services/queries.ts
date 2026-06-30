import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// --- Types ---
export interface City {
  id: string;
  name: string;
  slug: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  duration: number;
  language: string;
  genre: string;
  director: string;
  cast: string;
  posterUrl: string;
  trailerUrl?: string;
  releaseDate: string;
  rating: string;
  isActive: boolean;
  interested?: number;
}

export interface Show {
  id: string;
  movieId: string;
  screenId: string;
  startTime: string;
  endTime: string;
  date: string;
  priceNormal: string;
  pricePremium: string;
  priceVip: string;
}

export interface Seat {
  id: string;
  screenId: string;
  rowName: string;
  seatNumber: number;
  type: 'NORMAL' | 'PREMIUM' | 'VIP';
}

export interface ShowSeat {
  id: string;
  showId: string;
  seatId: string;
  bookingId: string | null;
  status: 'AVAILABLE' | 'LOCKED' | 'BOOKED';
  lockedByUserId: string | null;
  lockedAt: string | null;
  seat: Seat;
}

export interface Theatre {
  id: string;
  name: string;
  address: string;
  cityId: string;
  screens: {
    id: string;
    name: string;
    shows: (Show & { movie?: Movie })[];
  }[];
}

// --- Query Hooks ---
export const useCities = () => {
  return useQuery({
    queryKey: ['cities'],
    queryFn: async () => {
      const res = await api.get('/cities');
      return res.data.data.cities as City[];
    },
  });
};

export const useMovies = (filters: { cityId?: string; search?: string; genre?: string; status?: 'showing' | 'upcoming' }) => {
  return useQuery({
    queryKey: ['movies', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.cityId) params.append('cityId', filters.cityId);
      if (filters.search) params.append('search', filters.search);
      if (filters.genre) params.append('genre', filters.genre);
      if (filters.status) params.append('status', filters.status);

      const res = await api.get(`/movies?${params.toString()}`);
      return res.data.data.movies as Movie[];
    },
  });
};

export const useMovieDetail = (id?: string) => {
  return useQuery({
    queryKey: ['movie', id],
    queryFn: async () => {
      if (!id) throw new Error('Movie ID is required');
      const res = await api.get(`/movies/${id}`);
      return res.data.data.movie as Movie;
    },
    enabled: !!id,
  });
};

export const useTheatresAndShows = (filters: { movieId?: string; cityId?: string; date?: string }) => {
  return useQuery({
    queryKey: ['theatres-shows', filters],
    queryFn: async () => {
      const { movieId, cityId, date } = filters;
      if (!movieId || !cityId || !date) throw new Error('Filters are required');
      
      const res = await api.get(`/shows?movieId=${movieId}&cityId=${cityId}&date=${date}`);
      return res.data.data.theatres as Theatre[];
    },
    enabled: !!filters.movieId && !!filters.cityId && !!filters.date,
  });
};

export const useShowSeats = (showId?: string) => {
  return useQuery({
    queryKey: ['show-seats', showId],
    queryFn: async () => {
      if (!showId) throw new Error('Show ID is required');
      const res = await api.get(`/shows/${showId}/seats`);
      return res.data.data as { show: Show & { movie: { title: string; rating: string; language: string; duration: number }; screen: { name: string; theatre: { name: string; address: string } } }; seats: ShowSeat[] };
    },
    enabled: !!showId,
    refetchInterval: 5000, // Polling show seats every 5 seconds for real-time occupancy updates!
  });
};

export const useBookingHistory = () => {
  return useQuery({
    queryKey: ['booking-history'],
    queryFn: async () => {
      const res = await api.get('/bookings/history');
      return res.data.data.bookings as any[];
    },
  });
};

// --- Admin Query Hooks ---
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await api.get('/admin/dashboard');
      return res.data.data.analytics as any;
    },
  });
};

export const useAdminBookings = () => {
  return useQuery({
    queryKey: ['admin-bookings'],
    queryFn: async () => {
      const res = await api.get('/admin/bookings');
      return res.data.data.bookings as any[];
    },
  });
};

// --- Mutations ---
export const useLockSeats = () => {
  return useMutation({
    mutationFn: async (data: { showId: string; seatIds: string[] }) => {
      const res = await api.post('/bookings/lock-seats', data);
      return res.data.data as { booking: { id: string; totalAmount: string; bookingNumber: string }; expiresAt: string };
    },
  });
};

export const useCreatePaymentIntent = () => {
  return useMutation({
    mutationFn: async (data: { bookingId: string }) => {
      const res = await api.post('/bookings/create-payment', data);
      return res.data.data as { clientSecret: string; isMock: boolean; amount: string };
    },
  });
};

export const useConfirmMockPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { bookingId: string }) => {
      const res = await api.post('/bookings/confirm-mock', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-history'] });
    },
  });
};

export const useIncrementInterested = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/movies/${id}/interested`);
      return res.data.data.movie as Movie;
    },
    onSuccess: (updatedMovie) => {
      queryClient.invalidateQueries({ queryKey: ['movies'] });
      queryClient.invalidateQueries({ queryKey: ['movie', updatedMovie.id] });
    },
  });
};
