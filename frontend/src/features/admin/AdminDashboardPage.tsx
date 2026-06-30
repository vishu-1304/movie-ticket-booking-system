import React from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboard } from '../../services/queries';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Landmark, Ticket, Film, Calendar, Users, Eye, PlusCircle } from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const { data: analytics, isLoading } = useAdminDashboard();

  if (isLoading || !analytics) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 space-y-8 animate-pulse">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-dark-card rounded-2xl"></div>
          ))}
        </div>
        <div className="h-96 bg-dark-card rounded-2xl"></div>
      </div>
    );
  }

  const { totalRevenue, totalTicketsSold, totalMovies, totalUpcomingShows, occupancyRate, movieSales, recentBookings } = analytics;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12 space-y-10">
      
      {/* Header and Fast Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black">Admin Console</h1>
          <p className="text-xs text-dark-muted">Monitor tickets, revenue flows, and manage shows scheduling</p>
        </div>

        {/* Action Panel Buttons */}
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/admin/movies"
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-hover text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-200"
          >
            <PlusCircle className="w-4 h-4" />
            Manage Movies
          </Link>
          <Link
            to="/admin/shows"
            className="flex items-center gap-1.5 bg-dark-card border border-dark-border text-dark-text hover:text-brand hover:border-brand/40 text-xs font-bold py-2.5 px-4 rounded-xl transition-all duration-200"
          >
            <Calendar className="w-4 h-4" />
            Create Showtimes
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Revenue */}
        <div className="bg-dark-card border border-dark-border/60 rounded-2xl p-5 flex items-center justify-between glass">
          <div className="space-y-1">
            <span className="text-xs text-dark-muted font-bold">Total Revenue</span>
            <p className="text-2xl font-black text-brand">₹{Number(totalRevenue).toFixed(2)}</p>
          </div>
          <div className="w-12 h-12 bg-brand/10 text-brand border border-brand/20 rounded-xl flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="bg-dark-card border border-dark-border/60 rounded-2xl p-5 flex items-center justify-between glass">
          <div className="space-y-1">
            <span className="text-xs text-dark-muted font-bold">Tickets Sold</span>
            <p className="text-2xl font-black text-dark-text">{totalTicketsSold}</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center">
            <Ticket className="w-6 h-6" />
          </div>
        </div>

        {/* Active Movies */}
        <div className="bg-dark-card border border-dark-border/60 rounded-2xl p-5 flex items-center justify-between glass">
          <div className="space-y-1">
            <span className="text-xs text-dark-muted font-bold">Active Movies</span>
            <p className="text-2xl font-black text-dark-text">{totalMovies}</p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl flex items-center justify-center">
            <Film className="w-6 h-6" />
          </div>
        </div>

        {/* Occupancy Rate */}
        <div className="bg-dark-card border border-dark-border/60 rounded-2xl p-5 flex items-center justify-between glass">
          <div className="space-y-1">
            <span className="text-xs text-dark-muted font-bold">Average Occupancy</span>
            <p className="text-2xl font-black text-dark-text">{occupancyRate}%</p>
          </div>
          <div className="w-12 h-12 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Analytics Chart & Recent Bookings */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Chart Column */}
        <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-2xl p-6 glass flex flex-col justify-between h-[380px]">
          <h2 className="font-extrabold text-base md:text-lg mb-4">Tickets Sales by Movie</h2>
          
          <div className="flex-1 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={movieSales} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <XAxis dataKey="title" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#161d30', borderColor: '#232d45', borderRadius: 8, color: '#f3f4f6' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="ticketsSold" fill="#e50914" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent bookings lists */}
        <div className="bg-dark-card border border-dark-border rounded-2xl p-6 glass space-y-5 h-[380px] flex flex-col justify-between">
          <h2 className="font-extrabold text-base md:text-lg">Recent Bookings</h2>
          
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {recentBookings?.map((booking: any) => (
              <div key={booking.id} className="flex justify-between items-center border-b border-dark-border/40 pb-3 last:border-0 last:pb-0 text-xs">
                <div>
                  <p className="font-bold text-dark-text">{booking.user.name}</p>
                  <p className="text-[10px] text-dark-muted mt-0.5">{booking.show.movie.title}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-brand">₹{Number(booking.totalAmount).toFixed(2)}</span>
                  <p className="text-[9px] text-dark-muted mt-0.5">{new Date(booking.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
export default AdminDashboardPage;
