import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Instagram, 
  Facebook, 
  MapPin, 
  Clock, 
  Scissors, 
  ChevronRight, 
  ChevronLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  Phone
} from 'lucide-react';
import { SHOPS, SERVICES, BARBERS } from './constants';
import { cn } from './lib/utils';
import { format, addDays, startOfToday, isSameDay } from 'date-fns';
import { it } from 'date-fns/locale';

type Step = 'location' | 'barber' | 'service' | 'datetime' | 'confirm' | 'success';

export default function App() {
  const [step, setStep] = useState<Step>('location');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedBarberId, setSelectedBarberId] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [busySlots, setBusySlots] = useState<{ start: string; end: string }[]>([]);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const selectedShop = SHOPS.find(s => s.id === selectedShopId);
  const selectedBarber = BARBERS.find(b => b.id === selectedBarberId);
  const selectedService = SERVICES.find(s => s.id === selectedServiceId);
  
  const barbersInShop = useMemo(() => 
    BARBERS.filter(b => b.shopId === selectedShopId), 
    [selectedShopId]
  );

  const baseTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '16:00', '17:00'];

  useEffect(() => {
    if (step === 'datetime' && selectedBarber?.calendarId && selectedDate) {
      const fetchAvailability = async () => {
        setIsLoadingCalendar(true);
        try {
          const { calendarService } = await import('./lib/calendarService');
          const busy = await calendarService.getBusySlots(selectedBarber.calendarId, selectedDate);
          setBusySlots(busy);
        } catch (e) {
          console.error('Failed to fetch busy slots', e);
        } finally {
          setIsLoadingCalendar(false);
        }
      };
      fetchAvailability();
    }
  }, [step, selectedBarber?.calendarId, selectedDate]);

  const availableTimes = useMemo(() => {
    return baseTimes.filter(time => {
      const [hours, minutes] = time.split(':').map(Number);
      const slotStart = new Date(selectedDate);
      slotStart.setHours(hours, minutes, 0, 0);
      
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotStart.getMinutes() + (selectedService?.duration || 30));

      // Check if slot overlaps with any busy slot
      return !busySlots.some(busy => {
        const busyStart = new Date(busy.start);
        const busyEnd = new Date(busy.end);
        return (slotStart < busyEnd && slotEnd > busyStart);
      });
    });
  }, [baseTimes, busySlots, selectedDate, selectedService]);

  const handleBookingConfirm = async () => {
    if (!selectedShopId || !selectedBarberId || !selectedServiceId || !selectedTime || !customerName || !customerPhone) {
      alert('Per favore completa tutti i campi');
      return;
    }

    setIsBooking(true);
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(startTime.getMinutes() + (selectedService?.duration || 30));

      const { bookingService } = await import('./lib/bookingService');
      await bookingService.createBooking({
        shopId: selectedShopId,
        barberId: selectedBarberId,
        serviceId: selectedServiceId,
        customerName,
        customerPhone,
        startTime,
        endTime
      });

      // Google Calendar Integration
      if (selectedBarber?.calendarId) {
        const { calendarService } = await import('./lib/calendarService');
        await calendarService.createBookingEvent({
          calendarId: selectedBarber.calendarId,
          summary: `Prenotazione: ${selectedService?.name} - ${customerName}`,
          description: `Cliente: ${customerName}\nTel: ${customerPhone}\nNegozio: ${selectedShop?.name}`,
          start: startTime,
          end: endTime
        });
      }

      setStep('success');
    } catch (error) {
      console.error(error);
      alert('Errore durante la prenotazione. Riprova.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleNext = () => {
    if (step === 'location') setStep('barber');
    else if (step === 'barber') setStep('service');
    else if (step === 'service') setStep('datetime');
    else if (step === 'datetime') setStep('confirm');
    else if (step === 'confirm') handleBookingConfirm();
  };

  const handleBack = () => {
    if (step === 'barber') setStep('location');
    else if (step === 'service') setStep('barber');
    else if (step === 'datetime') setStep('service');
    else if (step === 'confirm') setStep('datetime');
  };

  return (
    <div className="min-h-screen text-white font-sans selection:bg-accent/30 overflow-x-hidden">
      <div className="mesh-bg" />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/5 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-accent leading-none">
              Elite Barber
            </h1>
            <p className="text-[10px] opacity-50 uppercase tracking-[0.2em] mt-1 font-bold">Luxury Grooming Network</p>
          </div>
          <div className="flex items-center gap-4">
            <a href="#" className="p-2 opacity-50 hover:opacity-100 hover:text-accent transition-all">
              <Instagram size={20} />
            </a>
            <a href="#" className="p-2 opacity-50 hover:opacity-100 hover:text-accent transition-all">
              <Facebook size={20} />
            </a>
          </div>
        </div>
      </header>

      <main className="relative max-w-xl mx-auto px-6 py-8 pb-32">
        <AnimatePresence mode="wait">
          {/* STEP 1: LOCATION */}
          {step === 'location' && (
            <motion.div
              key="location"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-3xl font-bold tracking-tight">Benvenuto.</h2>
                <p className="text-zinc-400 mt-2">Scegli uno dei nostri 3 atelier per iniziare.</p>
              </div>

              <div className="grid gap-4">
                {SHOPS.map((shop) => (
                  <button
                    key={shop.id}
                    id={`shop-${shop.id}`}
                    onClick={() => { setSelectedShopId(shop.id); handleNext(); }}
                    className={cn(
                      "group relative overflow-hidden glass p-6 text-left transition-all hover:border-accent/50 hover:bg-white/5",
                      selectedShopId === shop.id && "glass-active"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="text-lg font-bold group-hover:text-accent transition-colors">
                          {shop.name}
                        </h3>
                        <div className="flex items-center opacity-60 text-sm gap-1.5 italic">
                          <MapPin size={14} className="text-accent" />
                          {shop.address}
                        </div>
                      </div>
                      <div className="p-2 rounded-full bg-white/10 text-white/40 group-hover:bg-accent group-hover:text-black transition-all">
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: BARBER */}
          {step === 'barber' && (
            <motion.div
              key="barber"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={handleBack} className="p-2 -ml-2 opacity-50 hover:opacity-100 hover:text-white">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-black">Step 2 di 5</span>
              </div>

              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Chi ti curerà?</h2>
                <p className="opacity-50 text-sm">I nostri esperti nel network Blade & Co.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {barbersInShop.map((barber) => (
                  <button
                    key={barber.id}
                    id={`barber-${barber.id}`}
                    onClick={() => { setSelectedBarberId(barber.id); handleNext(); }}
                    className={cn(
                      "flex flex-col items-center p-6 glass text-center transition-all hover:bg-white/5",
                      selectedBarberId === barber.id && "glass-active"
                    )}
                  >
                    <div className="relative mb-4">
                      <img 
                        src={barber.avatar} 
                        alt={barber.name} 
                        className="w-20 h-20 rounded-full border border-white/10 group-hover:border-accent" 
                      />
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
                    </div>
                    <h3 className="font-bold">{barber.name}</h3>
                    <p className="text-[10px] text-accent mt-1 uppercase font-black tracking-widest">{barber.specialty}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: SERVICE */}
          {step === 'service' && (
            <motion.div
              key="service"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={handleBack} className="p-2 -ml-2 opacity-50 hover:opacity-100 hover:text-white">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-black">Step 3 di 5</span>
              </div>

              <div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase mb-1">Scegli il servizio.</h2>
                <p className="opacity-50 text-sm">Dalla barba al taglio completo, solo il top.</p>
              </div>

              <div className="grid gap-3">
                {SERVICES.map((service) => (
                  <button
                    key={service.id}
                    id={`service-${service.id}`}
                    onClick={() => { setSelectedServiceId(service.id); handleNext(); }}
                    className={cn(
                      "group flex items-center justify-between p-5 glass transition-all hover:bg-white/5",
                      selectedServiceId === service.id && "glass-active"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-white/10 text-accent group-hover:bg-accent group-hover:text-black transition-all">
                        <Scissors size={20} />
                      </div>
                      <div className="text-left">
                        <h3 className="font-bold">{service.name}</h3>
                        <p className="text-[10px] opacity-40 uppercase font-black tracking-widest">{service.duration} min</p>
                      </div>
                    </div>
                    <span className="text-lg font-black text-accent italic">€{service.price}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: DATETIME */}
          {step === 'datetime' && (
            <motion.div
              key="datetime"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={handleBack} className="p-2 -ml-2 opacity-50 hover:opacity-100 hover:text-white">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.2em] text-accent font-black">Step 4 di 5</span>
              </div>

              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Quando ci vediamo?</h2>
                  <p className="opacity-50 text-sm font-bold uppercase tracking-widest text-[10px]">
                    {isLoadingCalendar ? 'Sincronizzazione in corso...' : 'Sincronizzato con Google Calendar'}
                  </p>
                </div>

                {/* Simple Horizontal Date Picker */}
                <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                  {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                    const date = addDays(startOfToday(), offset);
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={offset}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "flex-shrink-0 w-16 h-20 glass flex flex-col items-center justify-center transition-all",
                          isSelected 
                            ? "bg-accent border-accent text-black font-bold" 
                            : "hover:border-white/20"
                        )}
                      >
                        <span className={cn("text-[10px] uppercase font-bold tracking-widest", isSelected ? "text-black" : "opacity-40")}>
                          {format(date, 'eee', { locale: it })}
                        </span>
                        <span className="text-xl mt-1 font-black italic">{format(date, 'dd')}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Grid */}
                <div className="grid grid-cols-3 gap-2">
                  {availableTimes.map((time) => (
                    <button
                      key={time}
                      id={`time-${time}`}
                      onClick={() => { setSelectedTime(time); handleNext(); }}
                      className={cn(
                        "py-3 glass text-sm font-medium transition-all",
                        selectedTime === time
                          ? "bg-accent border-accent text-black font-black"
                          : "hover:bg-white/5"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: CONFIRM */}
          {step === 'confirm' && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-2 mb-2">
                <button onClick={handleBack} className="p-2 -ml-2 opacity-50 hover:opacity-100 hover:text-white">
                  <ChevronLeft size={20} />
                </button>
                <span className="text-[10px] uppercase tracking-[0.3em] text-accent font-black">Step 5 di 5</span>
              </div>

              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-accent/10 glass flex items-center justify-center mx-auto mb-4 text-accent">
                  <Scissors size={40} />
                </div>
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">Riepilogo.</h2>
                <p className="opacity-50 text-sm">Controlla i dettagli e prenota la poltrona.</p>
              </div>

              <div className="glass p-8 space-y-6">
                <div className="space-y-4 pb-6 border-b border-white/10">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black ml-1">Il tuo Nome</label>
                    <input 
                      type="text" 
                      placeholder="es. Mario Rossi"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase tracking-[0.2em] opacity-40 font-black ml-1">Cellulare</label>
                    <input 
                      type="tel" 
                      placeholder="es. 333 123 4567"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-sm focus:border-accent focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-black">Dove</p>
                    <p className="font-bold text-lg">{selectedShop?.name}</p>
                  </div>
                  <MapPin className="text-accent" size={18} />
                </div>

                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-black">Con chi</p>
                    <p className="font-bold text-lg">{selectedBarber?.name}</p>
                  </div>
                  <img src={selectedBarber?.avatar} className="w-10 h-10 rounded-full border border-white/10" />
                </div>

                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-black">Servizio</p>
                    <p className="font-bold text-lg">{selectedService?.name}</p>
                  </div>
                  <p className="font-black text-accent italic text-xl">€{selectedService?.price}</p>
                </div>

                <div className="flex items-start justify-between border-b border-white/10 pb-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest opacity-40 font-black">Quando</p>
                    <p className="font-bold text-lg">
                      {format(selectedDate, 'd MMMM', { locale: it })} alle {selectedTime}
                    </p>
                  </div>
                  <Clock className="text-accent" size={18} />
                </div>
              </div>

              <button
                id="btn-confirm-final"
                disabled={isBooking}
                onClick={handleBookingConfirm}
                className={cn(
                  "w-full h-16 bg-accent hover:opacity-90 text-black font-black uppercase text-lg tracking-[0.2em] rounded-2xl shadow-xl shadow-accent/10 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                  isBooking && "animate-pulse"
                )}
              >
                {isBooking ? 'Elaborazione...' : 'Conferma Prenotazione'}
              </button>
            </motion.div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="py-12 space-y-8 text-center"
            >
              <div className="relative">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                  className="w-32 h-32 bg-accent rounded-full flex items-center justify-center mx-auto text-black shadow-2xl shadow-accent/40"
                >
                  <CheckCircle2 size={64} />
                </motion.div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-accent/20 blur-[80px] -z-10" />
              </div>

              <div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Fatto!</h2>
                <p className="text-xl font-medium tracking-tight">
                  La poltrona è riservata per te.
                </p>
                <p className="opacity-50 mt-2 max-w-[280px] mx-auto text-sm italic">
                  Abbiamo inviato i dettagli anche al tuo calendario Google.
                </p>
              </div>

              <div className="grid gap-3 max-w-[280px] mx-auto pt-6">
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full h-14 glass hover:bg-white/10 transition-all font-bold uppercase tracking-widest text-xs"
                >
                  Nuova Prenotazione
                </button>
                <button className="flex items-center justify-center gap-2 h-14 opacity-50 hover:opacity-100 hover:text-accent transition-all text-xs uppercase font-bold tracking-widest">
                  <Phone size={18} /> Chiama il negozio
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Navigation (Quick Links) */}
      {step !== 'success' && (
        <footer className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black to-transparent pointer-events-none">
          <div className="max-w-xl mx-auto flex justify-center pointer-events-auto">
            <nav className="inline-flex items-center gap-1 glass px-3 py-2 shadow-2xl">
              <button className="p-3 text-accent bg-accent/10 rounded-xl transition-all">
                <Scissors size={20} />
              </button>
              <button className="p-3 opacity-40 hover:opacity-100 hover:text-white transition-all">
                <CalendarIcon size={20} />
              </button>
              <button className="p-3 opacity-40 hover:opacity-100 hover:text-white transition-all">
                <Instagram size={20} />
              </button>
            </nav>
          </div>
        </footer>
      )}
    </div>
  );
}
