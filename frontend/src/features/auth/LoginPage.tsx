import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { Film, Mail, Lock, User as UserIcon, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      if (isLogin) {
        await login(email, password);
        navigate(from, { replace: true });
      } else {
        await register(name, email, password, phoneNumber);
        setSuccess('Account created successfully! Please sign in.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl grid md:grid-cols-2 bg-dark-card border border-dark-border rounded-2xl overflow-hidden shadow-2xl glass">
        
        {/* Branding Promo Column */}
        <div className="relative hidden md:flex flex-col justify-between p-12 bg-gradient-to-br from-brand/20 to-dark-bg border-r border-dark-border">
          <div className="flex items-center gap-2">
            <Film className="w-8 h-8 text-brand animate-pulse" />
            <span className="text-xl font-extrabold tracking-wider">
              TICKET<span className="text-brand">PASS</span>
            </span>
          </div>

          <div className="space-y-4 my-auto">
            <h1 className="text-4xl font-extrabold leading-tight">
              Unlock the World of <br />
              <span className="text-brand neon-text font-black">Cinema Experiences</span>
            </h1>
            <p className="text-dark-muted text-sm leading-relaxed max-w-sm">
              Discover real-time listings, choose premium seats, and checkout securely with instant confirmations on the fly.
            </p>
          </div>

          <div className="text-xs text-dark-muted">
            Authorized ticketing secure platform.
          </div>
        </div>

        {/* Input Form Column */}
        <div className="p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8">
            <div className="flex gap-4 border-b border-dark-border mb-6">
              <button
                onClick={() => {
                  setIsLogin(true);
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-3 text-lg font-bold transition-all duration-200 relative ${
                  isLogin ? 'text-brand' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                Sign In
                {isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"></span>}
              </button>
              <button
                onClick={() => {
                  setIsLogin(false);
                  setError(null);
                  setSuccess(null);
                }}
                className={`pb-3 text-lg font-bold transition-all duration-200 relative ${
                  !isLogin ? 'text-brand' : 'text-dark-muted hover:text-dark-text'
                }`}
              >
                Create Account
                {!isLogin && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full"></span>}
              </button>
            </div>
            <p className="text-sm text-dark-muted">
              {isLogin ? 'Welcome back! Enter credentials to continue.' : 'Create a profile to easily reserve seat logs.'}
            </p>
          </div>

          {/* Feedback Badges */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/30 text-green-300 text-xs px-4 py-3 rounded-lg flex items-center gap-2 mb-6">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs text-dark-muted font-semibold">Full Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder="Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 pl-11 pr-4 text-dark-text focus:outline-none focus:border-brand/40 transition-colors"
                    />
                    <UserIcon className="w-5 h-5 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs text-dark-muted font-semibold">Phone Number</label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="9999999999"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 pl-11 pr-4 text-dark-text focus:outline-none focus:border-brand/40 transition-colors"
                    />
                    <Phone className="w-5 h-5 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-semibold">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="jane.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 pl-11 pr-4 text-dark-text focus:outline-none focus:border-brand/40 transition-colors"
                />
                <Mail className="w-5 h-5 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-dark-muted font-semibold">Password</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg/60 border border-dark-border text-sm rounded-xl py-3 pl-11 pr-4 text-dark-text focus:outline-none focus:border-brand/40 transition-colors"
                />
                <Lock className="w-5 h-5 text-dark-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all duration-300 neon-glow hover:-translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : isLogin ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};
export default LoginPage;
