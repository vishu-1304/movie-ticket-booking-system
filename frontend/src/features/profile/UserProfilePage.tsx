import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useBookingHistory } from '../../services/queries';
import { User, Mail, Phone, Calendar, MapPin, Ticket, ShieldCheck, QrCode } from 'lucide-react';
import { getMovieStaticMedia } from '../../utils/tmdb';

export const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { data: bookings, isLoading } = useBookingHistory();

  if (!user) {
    return (
      <div className="text-center py-20">
        <p className="text-dark-muted">Please log in to view profile details.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-12">
      
      {/* 1. Profile Metadata Header */}
      <div className="bg-dark-card border border-dark-border/60 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center justify-between glass">
        <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
          <div className="w-20 h-20 bg-brand/20 border border-brand/40 text-brand rounded-full flex items-center justify-center font-extrabold text-3xl uppercase shadow-lg select-none">
            {user.name[0]}
          </div>
          
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black text-dark-text">{user.name}</h1>
            
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs text-dark-muted font-medium">
              <div className="flex items-center gap-1.5">
                <Mail className="w-4 h-4 text-brand" />
                <span>{user.email}</span>
              </div>
              {user.phoneNumber && (
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-brand" />
                  <span>{user.phoneNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 items-center bg-brand/10 border border-brand/20 px-4 py-2 rounded-full text-xs font-bold text-brand uppercase tracking-wider">
          <ShieldCheck className="w-4 h-4" />
          <span>{user.role} Account</span>
        </div>
      </div>

      {/* 2. Booking History List */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Your Booking History</h2>
          <p className="text-xs text-dark-muted">View all previous ticket purchases and locks</p>
        </div>

        {isLoading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-32 bg-dark-card rounded-2xl"></div>
            <div className="h-32 bg-dark-card rounded-2xl"></div>
          </div>
        ) : bookings && bookings.length > 0 ? (
          <div className="grid gap-6">
            {bookings.map((booking) => {
              const show = booking.show;
              const movie = show.movie;
              const screen = show.screen;
              const theatre = screen.theatre;
              
              const showDate = new Date(show.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              const showTime = new Date(show.startTime).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              });

              const seatNames = booking.showSeats
                ?.map((ss: any) => `${ss.seat.rowName}-${ss.seat.seatNumber}`)
                .join(', ');

              let statusColor = 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400';
              if (booking.bookingStatus === 'CONFIRMED') statusColor = 'bg-green-500/10 border-green-500/30 text-green-400';
              if (booking.bookingStatus === 'CANCELLED') statusColor = 'bg-red-500/10 border-red-500/30 text-red-400';

              return (
                <div
                  key={booking.id}
                  className="bg-dark-card border border-dark-border/60 rounded-2xl overflow-hidden glass hover:border-dark-border transition-all duration-300 grid md:grid-cols-4"
                >
                  
                  {/* Left Movie details */}
                  <div className="p-6 md:col-span-3 flex flex-col sm:flex-row gap-6">
                    <div className="w-24 aspect-[2/3] rounded-xl overflow-hidden border border-dark-border/40 shrink-0 self-center sm:self-auto">
                      <img src={getMovieStaticMedia(movie.title, movie.posterUrl).poster} alt={movie.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 space-y-4 flex flex-col justify-between">
                      <div className="space-y-1">
                        <div className="flex gap-2 items-center flex-wrap">
                          <span className={`text-[10px] font-bold px-2 py-0.5 border rounded uppercase ${statusColor}`}>
                            {booking.bookingStatus}
                          </span>
                          <span className="text-[10px] text-dark-muted font-semibold bg-white/5 border border-dark-border px-2 py-0.5 rounded uppercase">
                            {booking.bookingNumber}
                          </span>
                        </div>
                        <h3 className="text-lg font-black text-dark-text">{movie.title}</h3>
                        <p className="text-xs text-dark-muted">{theatre.name} — {screen.name}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs text-dark-muted border-t border-dark-border/30 pt-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-brand" />
                          <span>{showDate} at {showTime}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Ticket className="w-4 h-4 text-brand" />
                          <span>Seats: <strong className="text-brand font-bold">{seatNames || 'N/A'}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right ticket bar code */}
                  <div className="bg-dark-bg/60 border-t md:border-t-0 md:border-l border-dark-border/60 p-6 flex flex-col items-center justify-center gap-4 text-center border-dashed">
                    <QrCode className="w-16 h-16 text-dark-text/40" />
                    <div>
                      <span className="text-[10px] text-dark-muted font-bold uppercase tracking-wider">Amount Paid</span>
                      <p className="font-extrabold text-dark-text text-lg mt-0.5">₹{Number(booking.totalAmount).toFixed(2)}</p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 flex flex-col items-center gap-3 border border-dashed border-dark-border rounded-2xl">
            <Ticket className="w-10 h-10 text-dark-muted" />
            <p className="text-sm text-dark-muted">You have no bookings recorded yet.</p>
          </div>
        )}
      </div>

    </div>
  );
};
export default UserProfilePage;
