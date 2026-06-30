import React from 'react';
import { Film } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark-card/30 border-t border-dark-border py-8 px-6 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dark-muted">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-brand" />
          <span className="font-extrabold tracking-wider text-dark-text">
            TICKET<span className="text-brand">PASS</span>
          </span>
          <span className="mx-2">|</span>
          <span>© {new Date().getFullYear()} TicketPass Platform. All rights reserved.</span>
        </div>
        <div className="flex gap-6">
          <a href="#" className="hover:text-brand transition-colors duration-200">Privacy Policy</a>
          <a href="#" className="hover:text-brand transition-colors duration-200">Terms of Service</a>
          <a href="#" className="hover:text-brand transition-colors duration-200">Contact Support</a>
        </div>
      </div>
    </footer>
  );
};
