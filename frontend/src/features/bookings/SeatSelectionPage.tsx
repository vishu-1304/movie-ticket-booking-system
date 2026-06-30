import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useShowSeats, useLockSeats, useCreatePaymentIntent, useConfirmMockPayment } from '../../services/queries';
import { useAuth } from '../auth/AuthContext';
import { Armchair, CreditCard, Clock, CheckCircle, Ticket, Smartphone, Lock, Sparkles, Send } from 'lucide-react';

export const SeatSelectionPage: React.FC = () => {
  const { showId } = useParams<{ showId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: showData, isLoading: seatsLoading, refetch } = useShowSeats(showId);
  const lockSeatsMutation = useLockSeats();
  const createPaymentIntentMutation = useCreatePaymentIntent();
  const confirmMockMutation = useConfirmMockPayment();

  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);
  const [lockedBooking, setLockedBooking] = useState<any | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0); // countdown in seconds
  const [paymentSecret, setPaymentSecret] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Payment simulator states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isUpiPaying, setIsUpiPaying] = useState(false);
  const [upiCountdown, setUpiCountdown] = useState(15);

  const getCardType = (number: string) => {
    const cleaned = number.replace(/\s/g, '');
    if (cleaned.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(cleaned)) return 'mastercard';
    if (/^3[47]/.test(cleaned)) return 'amex';
    if (/^(6011|65|64[4-9]|622)/.test(cleaned)) return 'discover';
    if (/^(352[89]|35[3-8])/.test(cleaned)) return 'jcb';
    return 'generic';
  };

  // Redirect to login if user tries to book but isn't authenticated
  useEffect(() => {
    if (!user) {
      navigate('/auth', { state: { from: { pathname: `/shows/${showId}` } } });
    }
  }, [user, showId, navigate]);

  // Countdown timer logic
  useEffect(() => {
    if (timeLeft <= 0) {
      if (lockedBooking) {
        // Lock expired
        setLockedBooking(null);
        setSelectedSeatIds([]);
        setPaymentSecret(null);
        refetch();
        alert('Your seat hold has expired. Please select seats and check out again.');
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, lockedBooking, refetch]);

  const handleSimulatedPayment = async () => {
    if (!lockedBooking) return;
    setIsProcessingPayment(true);
    setShowOtpModal(false);

    try {
      await confirmMockMutation.mutateAsync({
        bookingId: lockedBooking.id,
      });
      setPaymentSuccess(true);
    } catch (err) {
      alert('Mock payment confirmation failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // UPI payment simulation countdown
  useEffect(() => {
    if (!isUpiPaying) return;
    if (upiCountdown <= 0) {
      handleSimulatedPayment();
      setIsUpiPaying(false);
      return;
    }
    const upiTimer = setInterval(() => {
      setUpiCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(upiTimer);
  }, [isUpiPaying, upiCountdown]);

  if (seatsLoading || !showData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col items-center justify-center gap-4 py-32">
        <div className="w-10 h-10 border-4 border-brand/30 border-t-brand rounded-full animate-spin"></div>
        <p className="text-sm text-dark-muted">Loading seat layout details...</p>
      </div>
    );
  }

  const { show, seats } = showData;

  // Group seats by row for layout rendering
  const seatsByRow: { [key: string]: typeof seats } = {};
  seats.forEach((seatState) => {
    const row = seatState.seat.rowName;
    if (!seatsByRow[row]) seatsByRow[row] = [];
    seatsByRow[row].push(seatState);
  });

  const handleSeatClick = (seatState: any) => {
    if (seatState.status !== 'AVAILABLE') return;

    setSelectedSeatIds((prev) => {
      if (prev.includes(seatState.seatId)) {
        return prev.filter((id) => id !== seatState.seatId);
      } else {
        if (prev.length >= 6) {
          alert('You can select a maximum of 6 seats per transaction.');
          return prev;
        }
        return [...prev, seatState.seatId];
      }
    });
  };

  const calculateSelectionTotal = () => {
    let total = 0;
    selectedSeatIds.forEach((id) => {
      const seatState = seats.find((s) => s.seatId === id);
      if (seatState) {
        const type = seatState.seat.type;
        if (type === 'VIP') total += Number(show.priceVip);
        else if (type === 'PREMIUM') total += Number(show.pricePremium);
        else total += Number(show.priceNormal);
      }
    });
    return total;
  };

  const getSelectedSeatNames = () => {
    return selectedSeatIds
      .map((id) => {
        const seatState = seats.find((s) => s.seatId === id);
        return seatState ? `${seatState.seat.rowName}-${seatState.seat.seatNumber}` : '';
      })
      .filter(Boolean)
      .join(', ');
  };

  const handleProceedToPay = async () => {
    if (selectedSeatIds.length === 0) return;

    try {
      // 1. Lock seats
      const lockRes = await lockSeatsMutation.mutateAsync({
        showId: show.id,
        seatIds: selectedSeatIds,
      });

      setLockedBooking(lockRes.booking);
      
      const secondsLeft = Math.floor((new Date(lockRes.expiresAt).getTime() - Date.now()) / 1000);
      setTimeLeft(secondsLeft > 0 ? secondsLeft : 600);

      // 2. Initialize Payment
      const payIntent = await createPaymentIntentMutation.mutateAsync({
        bookingId: lockRes.booking.id,
      });

      setPaymentSecret(payIntent.clientSecret);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to hold seats. They may have been locked by another user.');
      refetch();
    }
  };



  const handleCardPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length !== 16) {
      alert('Please enter a valid 16-digit card number.');
      return;
    }
    if (!cardName.trim()) {
      alert('Please enter cardholder name.');
      return;
    }
    if (cardExpiry.length !== 5 || !cardExpiry.includes('/')) {
      alert('Please enter expiry in MM/YY format.');
      return;
    }
    if (cardCvv.length !== 3) {
      alert('Please enter a valid 3-digit CVV.');
      return;
    }
    
    // Open simulated OTP modal
    setShowOtpModal(true);
    setOtpValue('');
    setOtpError('');
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue === '123456') {
      handleSimulatedPayment();
    } else {
      setOtpError('Invalid OTP code. Enter 123456 to simulate success.');
    }
  };

  const handleUpiPayStart = () => {
    setIsUpiPaying(true);
    setUpiCountdown(10); // 10 second simulation
  };

  // Render minutes:seconds countdown
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isCardNumberValid = cardNumber.replace(/\s/g, '').length === 16;
  const isCardNameValid = cardName.trim().length > 1;
  const isCardExpiryValid = cardExpiry.length === 5 && cardExpiry.includes('/');
  const isCardCvvValid = cardCvv.length === 3;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      
      {/* 1. Show summary banner */}
      <div className="bg-dark-card border border-dark-border/60 rounded-2xl p-6 flex flex-col md:flex-row justify-between gap-6 glass mb-8">
        <div className="space-y-2">
          <span className="text-xs text-brand font-bold uppercase tracking-wider">{show.movie.language} • {show.movie.rating}</span>
          <h1 className="text-2xl font-black">{show.movie.title}</h1>
          <p className="text-xs text-dark-muted">{show.screen.theatre.name} — {show.screen.name}</p>
        </div>

        <div className="flex gap-4 items-center shrink-0">
          <div className="bg-dark-bg/60 border border-dark-border px-4 py-2.5 rounded-xl text-center">
            <div className="text-[10px] text-dark-muted font-bold">DATE</div>
            <div className="text-sm font-bold">{new Date(show.startTime).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</div>
          </div>
          <div className="bg-dark-bg/60 border border-dark-border px-4 py-2.5 rounded-xl text-center">
            <div className="text-[10px] text-dark-muted font-bold">TIME</div>
            <div className="text-sm font-bold">
              {new Date(show.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
            </div>
          </div>
        </div>
      </div>

      {!lockedBooking ? (
        // --- SEAT LAYOUT & SELECTION VIEW ---
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Grid Layout Screen container */}
          <div className="lg:col-span-2 bg-dark-card border border-dark-border rounded-2xl p-8 flex flex-col items-center justify-between glass">
            
            {/* Screen indicator */}
            <div className="w-full max-w-md flex flex-col items-center gap-1.5 mb-12">
              <div className="w-full h-1.5 bg-brand/35 rounded-full shadow-[0_0_12px_rgba(229,9,20,0.3)]"></div>
              <span className="text-[10px] font-extrabold tracking-[0.25em] text-dark-muted uppercase">SCREEN THIS WAY</span>
            </div>

            {/* Seat Map */}
            <div className="space-y-3.5 w-full overflow-x-auto pb-4 flex flex-col items-center">
              {Object.keys(seatsByRow).sort().map((rowName) => (
                <div key={rowName} className="flex gap-3 items-center min-w-fit">
                  <span className="w-6 text-sm font-bold text-dark-muted text-center">{rowName}</span>
                  
                  <div className="flex gap-2.5">
                    {seatsByRow[rowName].map((seatState) => {
                      const isSelected = selectedSeatIds.includes(seatState.seatId);
                      const isBooked = seatState.status === 'BOOKED';
                      const isLocked = seatState.status === 'LOCKED';
                      const type = seatState.seat.type;

                      let seatColor = 'bg-dark-bg border border-dark-border hover:border-brand/40 text-dark-muted';
                      if (type === 'PREMIUM') seatColor = 'bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:border-brand/40';
                      if (type === 'VIP') seatColor = 'bg-yellow-500/10 border border-yellow-500/30 text-yellow-300 hover:border-brand/40';

                      if (isSelected) seatColor = 'bg-brand text-white border-brand';
                      if (isBooked || isLocked) seatColor = 'bg-dark-border text-dark-muted/30 cursor-not-allowed opacity-40';

                      const seatPrice = type === 'VIP' ? Number(show.priceVip).toFixed(0) : type === 'PREMIUM' ? Number(show.pricePremium).toFixed(0) : Number(show.priceNormal).toFixed(0);

                      return (
                        <div key={seatState.id} className="relative group">
                          <button
                            disabled={isBooked || isLocked}
                            onClick={() => handleSeatClick(seatState)}
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-200 ${seatColor}`}
                          >
                            <Armchair className="w-4.5 h-4.5" />
                          </button>
                          
                          {!isBooked && !isLocked && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-28 bg-dark-card border border-dark-border text-white text-[10px] rounded py-1.5 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-50 text-center font-bold shadow-xl glass flex flex-col gap-0.5">
                              <span className="text-brand font-black">{rowName}-{seatState.seat.seatNumber}</span>
                              <span className="text-white font-medium uppercase text-[8px] tracking-wide">{type}</span>
                              <span className="text-green-400 font-extrabold">₹{seatPrice}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Color Index Legends */}
            <div className="flex flex-wrap justify-center gap-6 mt-12 border-t border-dark-border/40 pt-6 w-full text-xs text-dark-muted font-medium">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-dark-bg border border-dark-border rounded"></div>
                <span>Normal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500/10 border border-blue-500/30 rounded"></div>
                <span>Premium</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-500/10 border border-yellow-500/30 rounded"></div>
                <span>VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-brand rounded"></div>
                <span>Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-dark-border opacity-40 rounded"></div>
                <span>Taken</span>
              </div>
            </div>

          </div>

          {/* Checkout calculator Sidebar */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 flex flex-col justify-between glass h-fit space-y-6">
            <h2 className="font-extrabold text-lg">Ticket Summary</h2>
            
            <div className="space-y-4 text-sm divide-y divide-dark-border/40">
              <div className="py-2 flex justify-between">
                <span className="text-dark-muted">Seats Selected:</span>
                <span className="font-bold text-dark-text max-w-[150px] truncate">{getSelectedSeatNames() || 'None'}</span>
              </div>
              
              <div className="py-2 flex justify-between">
                <span className="text-dark-muted">Convenience Fee:</span>
                <span className="font-bold">₹0.00</span>
              </div>

              <div className="py-4 flex justify-between text-base border-t border-dark-border">
                <span className="font-bold">Total Amount:</span>
                <span className="font-extrabold text-brand text-lg">₹{calculateSelectionTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPay}
              disabled={selectedSeatIds.length === 0 || lockSeatsMutation.isPending}
              className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-bold py-3.5 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:pointer-events-none hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              {lockSeatsMutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Proceed to Payment'
              )}
            </button>
          </div>
        </div>
      ) : (
        // --- SECURE CHECKOUT & PAYMENT PAGE ---
        <div className="max-w-2xl mx-auto bg-dark-card border border-dark-border rounded-3xl p-8 glass space-y-8 relative">
          
          {/* Header */}
          <div className="flex items-center justify-between border-b border-dark-border/40 pb-5">
            <div className="flex items-center gap-2.5">
              <CreditCard className="w-6 h-6 text-brand" />
              <h2 className="font-black text-xl">Secure Checkout</h2>
            </div>
            
            <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all duration-300 ${
              timeLeft < 120 
                ? 'text-brand bg-brand/10 border-brand animate-pulse' 
                : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30'
            }`}>
              <Clock className={`w-4 h-4 ${timeLeft < 120 ? 'animate-spin' : ''}`} />
              <span>Expires in {formatTime(timeLeft)}</span>
            </div>
          </div>

          {!paymentSuccess ? (
            <div className="space-y-6">
              {/* Review Panel */}
              <div className="bg-dark-bg/60 border border-dark-border rounded-2xl p-5 space-y-4">
                <h3 className="text-xs text-dark-muted font-bold uppercase tracking-wider">Booking Review</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-dark-muted text-xs">Movie:</span>
                    <p className="font-bold mt-0.5 text-white">{show.movie.title}</p>
                  </div>
                  <div>
                    <span className="text-dark-muted text-xs">Seats:</span>
                    <p className="font-bold text-brand mt-0.5">{getSelectedSeatNames()}</p>
                  </div>
                  <div>
                    <span className="text-dark-muted text-xs">Showtime:</span>
                    <p className="font-bold mt-0.5 text-white">
                      {new Date(show.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                  <div>
                    <span className="text-dark-muted text-xs">Total Amount:</span>
                    <p className="font-extrabold mt-0.5 text-lg text-brand">₹{Number(lockedBooking.totalAmount).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Payment Tabs Option */}
              <div className="flex gap-4 border-b border-dark-border/40 pb-1">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod('card');
                    setIsUpiPaying(false);
                  }}
                  className={`text-sm font-bold pb-3 relative transition-all duration-300 ${
                    paymentMethod === 'card' ? 'text-white' : 'text-dark-muted hover:text-dark-text'
                  }`}
                >
                  Credit/Debit Card
                  {paymentMethod === 'card' && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand"></span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`text-sm font-bold pb-3 relative transition-all duration-300 ${
                    paymentMethod === 'upi' ? 'text-white' : 'text-dark-muted hover:text-dark-text'
                  }`}
                >
                  UPI QR Scan
                  {paymentMethod === 'upi' && (
                    <span className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-brand"></span>
                  )}
                </button>
              </div>

              {/* Card Payment Form with 3D Flip Card */}
              {paymentMethod === 'card' && (
                <div className="space-y-6 animate-fade-in">
                  {/* 3D Animated Credit Card */}
                  <div className="perspective-1000 w-full max-w-[320px] mx-auto h-[180px] my-4 select-none">
                    <div className={`relative w-full h-full transform-style-3d transition-transform duration-700 ${isCardFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* Front Card Face */}
                      <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-tr from-brand/90 via-brand to-red-800 p-5 flex flex-col justify-between text-white backface-hidden shadow-2xl border border-white/10 glass">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1.5">
                            <p className="text-[9px] text-white/60 font-black tracking-widest uppercase">TICKETPASS PREMIUM</p>
                            {/* Chip */}
                            <div className="w-9 h-6.5 bg-yellow-500/25 border border-yellow-500/40 rounded flex items-center justify-center">
                              <div className="w-5 h-3.5 border border-yellow-500/35 rounded-sm"></div>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Sparkles className="w-5 h-5 text-yellow-400 fill-yellow-400 animate-pulse" />
                            {getCardType(cardNumber) !== 'generic' && (
                              <span className="text-[8px] font-black uppercase bg-white/20 border border-white/10 px-1.5 py-0.5 rounded backdrop-blur tracking-wider">
                                {getCardType(cardNumber)}
                              </span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold tracking-[0.18em] text-center my-2 font-mono">
                          {cardNumber || '•••• •••• •••• ••••'}
                        </p>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-[7px] text-white/50 font-bold uppercase">Cardholder</p>
                            <p className="text-[10px] font-black tracking-wider uppercase truncate max-w-[150px]">
                              {cardName || 'YOUR NAME'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[7px] text-white/50 font-bold uppercase">Expires</p>
                            <p className="text-[10px] font-black font-mono">
                              {cardExpiry || 'MM/YY'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Back Card Face */}
                      <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-bl from-red-950 to-dark-bg p-5 flex flex-col justify-between text-white backface-hidden rotate-y-180 shadow-2xl border border-white/5">
                        <div className="w-full h-9 bg-black absolute left-0 top-5"></div>
                        <div className="mt-11 flex items-center justify-between">
                          <div className="bg-white/10 w-3/4 h-7.5 rounded px-2 flex items-center text-white/30 select-none text-[10px] italic font-serif">
                            Secure Signature Strip
                          </div>
                          <div className="bg-white text-dark-bg font-mono font-black px-2.5 py-1 rounded text-xs select-none shadow">
                            {cardCvv || '•••'}
                          </div>
                        </div>
                        <p className="text-[7px] text-white/30 text-center">
                          Secured with 256-bit SSL encryption. Authorized transactions only.
                        </p>
                      </div>

                    </div>
                  </div>

                  {/* Form fields */}
                  <form onSubmit={handleCardPaymentSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onFocus={() => setIsCardFlipped(false)}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          const formatted = val.match(/.{1,4}/g)?.join(' ') || val;
                          setCardNumber(formatted.slice(0, 19));
                        }}
                        className={`w-full bg-dark-bg/60 border rounded-xl px-4 py-3 text-sm focus:outline-none text-white transition-all font-mono ${
                          cardNumber.length > 0
                            ? isCardNumberValid
                              ? 'border-green-500/50 focus:border-green-500'
                              : 'border-brand/50 focus:border-brand'
                            : 'border-dark-border/60 focus:border-brand'
                        }`}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onFocus={() => setIsCardFlipped(false)}
                        onChange={(e) => setCardName(e.target.value.slice(0, 26))}
                        className={`w-full bg-dark-bg/60 border rounded-xl px-4 py-3 text-sm focus:outline-none text-white transition-all ${
                          cardName.length > 0
                            ? isCardNameValid
                              ? 'border-green-500/50 focus:border-green-500'
                              : 'border-brand/50 focus:border-brand'
                            : 'border-dark-border/60 focus:border-brand'
                        }`}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onFocus={() => setIsCardFlipped(false)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            let formatted = val;
                            if (val.length > 2) {
                              formatted = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                            }
                            setCardExpiry(formatted.slice(0, 5));
                          }}
                          className={`w-full bg-dark-bg/60 border rounded-xl px-4 py-3 text-sm focus:outline-none text-white transition-all font-mono ${
                            cardExpiry.length > 0
                              ? isCardExpiryValid
                                ? 'border-green-500/50 focus:border-green-500'
                                : 'border-brand/50 focus:border-brand'
                              : 'border-dark-border/60 focus:border-brand'
                          }`}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-dark-muted font-black uppercase tracking-wider">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cardCvv}
                          onFocus={() => setIsCardFlipped(true)}
                          onBlur={() => setIsCardFlipped(false)}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            setCardCvv(val.slice(0, 3));
                          }}
                          className={`w-full bg-dark-bg/60 border rounded-xl px-4 py-3 text-sm focus:outline-none text-white transition-all font-mono ${
                            cardCvv.length > 0
                              ? isCardCvvValid
                                ? 'border-green-500/50 focus:border-green-500'
                                : 'border-brand/50 focus:border-brand'
                              : 'border-dark-border/60 focus:border-brand'
                          }`}
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-brand hover:bg-brand-hover text-white text-sm font-black py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] mt-6 flex items-center justify-center gap-2"
                    >
                      <Lock className="w-4 h-4" /> Pay ₹{Number(lockedBooking.totalAmount).toFixed(2)} Securely
                    </button>
                  </form>
                </div>
              )}

              {/* UPI QR Payment View */}
              {paymentMethod === 'upi' && (
                <div className="space-y-6 flex flex-col items-center py-4 animate-fade-in">
                  {!isUpiPaying ? (
                    <>
                      {/* Interactive QR Code Simulator */}
                      <div className="relative w-48 h-48 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center border-4 border-brand/20">
                        {/* Styled QR Code Mock SVG */}
                        <svg className="w-full h-full text-dark-bg" viewBox="0 0 100 100">
                          <path fill="currentColor" d="M0,0 h30 v10 h-20 v20 h-10 z M70,0 h30 v30 h-10 v-20 h-20 z M0,70 h10 v20 h20 v10 h-30 z M90,70 h10 v30 h-30 v-10 h-20 v-10 h30 z M10,10 h10 v10 h-10 z M20,20 h10 v10 h-10 z M15,15 h10 v10 h-10 z M75,10 h10 v10 h-10 z M80,20 h10 v10 h-10 z M10,75 h10 v10 h-10 z M20,80 h10 v10 h-10 z M45,45 h10 v10 h-10 z M40,40 h15 v15 h-15 z M45,15 h10 v30 h-10 z M15,45 h30 v10 h-30 z M80,45 h10 v35 h-10 z" />
                          <circle cx="50" cy="50" r="10" className="fill-brand" />
                        </svg>
                      </div>
                      <div className="text-center space-y-1">
                        <p className="text-sm font-black text-white">Scan this QR with any UPI App</p>
                        <p className="text-xs text-dark-muted">GPay, PhonePe, Paytm, or BHIM</p>
                      </div>

                      <button
                        onClick={handleUpiPayStart}
                        className="w-full max-w-sm bg-brand hover:bg-brand-hover text-white text-sm font-black py-4 rounded-xl shadow-lg transition-all duration-300 hover:scale-[1.01] flex items-center justify-center gap-2"
                      >
                        <Smartphone className="w-4.5 h-4.5" /> Start Simulated Verification
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-8 space-y-6 w-full max-w-sm">
                      <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-4 border-brand/20 border-t-brand rounded-full animate-spin"></div>
                        <Smartphone className="w-8 h-8 text-brand animate-pulse" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-base font-black text-white">Waiting for UPI scan...</p>
                        <p className="text-xs text-dark-muted">Please complete the payment in your UPI app in {upiCountdown}s</p>
                      </div>
                      
                      {/* Loading Progress Bar */}
                      <div className="w-full bg-dark-bg/60 h-2.5 rounded-full overflow-hidden border border-dark-border/40">
                        <div 
                          className="bg-brand h-full transition-all duration-1000 ease-linear"
                          style={{ width: `${((10 - upiCountdown) / 10) * 100}%` }}
                        ></div>
                      </div>

                      <button
                        onClick={handleSimulatedPayment}
                        className="text-xs font-bold text-brand hover:text-brand-hover bg-brand/10 border border-brand/20 px-4 py-2.5 rounded-xl"
                      >
                        Skip Timer & Pay Immediately
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cancel holds */}
              <button
                onClick={() => {
                  setLockedBooking(null);
                  setPaymentSecret(null);
                  refetch();
                }}
                className="w-full bg-transparent hover:bg-white/5 border border-dark-border text-dark-muted hover:text-dark-text text-sm font-black py-3 rounded-xl transition-all duration-200"
              >
                Cancel Booking Hold
              </button>
            </div>
          ) : (
            // --- SUCCESS CONFIRMATION PANEL ---
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 bg-green-500/15 border border-green-500/30 text-green-400 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Booking Confirmed!</h3>
                <p className="text-sm text-dark-muted">Your tickets have been successfully reserved.</p>
              </div>

              {/* Mock ticket card details */}
              <div className="printable-ticket w-full max-w-sm bg-dark-bg/60 border border-dark-border rounded-xl p-6 relative overflow-hidden text-left border-dashed">
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-dark-muted font-bold uppercase">Booking ID</span>
                      <p className="text-sm font-extrabold text-dark-text">{lockedBooking.bookingNumber}</p>
                    </div>
                    <Ticket className="w-8 h-8 text-brand/30" />
                  </div>
                  
                  <div className="border-t border-dark-border/40 pt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-dark-muted font-bold">Movie</span>
                      <p className="font-semibold text-dark-text truncate mt-0.5">{show.movie.title}</p>
                    </div>
                    <div>
                      <span className="text-dark-muted font-bold">Auditorium</span>
                      <p className="font-semibold text-dark-text mt-0.5">{show.screen.name}</p>
                    </div>
                    <div>
                      <span className="text-dark-muted font-bold">Seats</span>
                      <p className="font-semibold text-brand mt-0.5">{getSelectedSeatNames()}</p>
                    </div>
                    <div>
                      <span className="text-dark-muted font-bold">Amount Paid</span>
                      <p className="font-semibold text-dark-text mt-0.5">₹{Number(lockedBooking.totalAmount).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* SVG Barcode mock */}
                  <div className="border-t border-dark-border/40 pt-4 flex flex-col items-center gap-2">
                    <span className="text-[9px] text-dark-muted font-bold uppercase tracking-widest text-center block w-full">Admission Scan Barcode</span>
                    <div className="w-full h-10 bg-white/5 border border-dark-border/20 rounded flex items-center justify-center p-1.5">
                      <svg className="w-full h-full text-dark-text/80 opacity-70" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M2,0 v20 M4,0 v20 M6,0 v20 M10,0 v20 M12,0 v20 M18,0 v20 M20,0 v20 M22,0 v20 M24,0 v20 M28,0 v20 M32,0 v20 M34,0 v20 M36,0 v20 M40,0 v20 M44,0 v20 M46,0 v20 M50,0 v20 M52,0 v20 M56,0 v20 M60,0 v20 M64,0 v20 M68,0 v20 M70,0 v20 M74,0 v20 M78,0 v20 M82,0 v20 M84,0 v20 M88,0 v20 M92,0 v20 M94,0 v20 M98,0 v20" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 w-full justify-center">
                <button
                  onClick={() => window.print()}
                  className="bg-dark-card border border-dark-border hover:border-brand/40 text-dark-text hover:text-brand text-sm font-bold py-3.5 px-6 rounded-xl transition-all duration-300 hover:scale-[1.01]"
                >
                  Print Ticket
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="bg-brand hover:bg-brand-hover text-white text-sm font-bold py-3.5 px-8 rounded-xl transition-all duration-300 hover:scale-[1.01]"
                >
                  Go to My Bookings
                </button>
              </div>
            </div>
          )}

          {/* OTP Validation Overlay Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
              <div className="relative w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6 shadow-2xl space-y-6">
                <div className="flex items-center gap-2 text-brand border-b border-dark-border/40 pb-4">
                  <Lock className="w-5 h-5" />
                  <h3 className="font-black text-base md:text-lg">3D Secure Verification</h3>
                </div>

                <div className="space-y-2 text-sm text-dark-muted">
                  <p>
                    We sent a verification SMS with your OTP code to your registered mobile number.
                  </p>
                  <div className="bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Simulator Tip: Enter code <strong className="text-white">123456</strong> to approve.</span>
                  </div>
                </div>

                <form onSubmit={handleOtpSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="Enter 6-digit OTP"
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-[0.4em] font-black text-lg bg-dark-bg/60 border border-dark-border/60 focus:border-brand rounded-xl px-4 py-3 focus:outline-none text-white transition-all font-mono"
                      required
                    />
                    {otpError && (
                      <p className="text-xs text-brand font-bold text-center animate-bounce">{otpError}</p>
                    )}
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowOtpModal(false)}
                      className="flex-1 bg-transparent hover:bg-white/5 border border-dark-border text-dark-muted font-bold py-3 rounded-xl text-xs transition-all"
                    >
                      Cancel Transaction
                    </button>
                    <button
                      type="submit"
                      className="flex-1 bg-brand hover:bg-brand-hover text-white font-black py-3 rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Submit Code
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
export default SeatSelectionPage;
