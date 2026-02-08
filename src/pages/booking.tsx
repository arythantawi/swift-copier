import { useState, useEffect, lazy, Suspense, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Users, Calendar, User, Phone, Mail, MapPinned, CheckCircle, Printer, Navigation, Edit3, Loader2, Map, AlertTriangle, Building2, LogIn, ShieldCheck, RefreshCw } from 'lucide-react';

// Lazy load MiniMap to avoid SSR issues with Leaflet
const MiniMap = lazy(() => import('@/components/MiniMap'));
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PaymentInfoBooking from '@/components/PaymentInfoBooking';
import PaymentUpload from '@/components/PaymentUpload';
import TransactionIndicator from '@/components/ui/transaction-indicator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { generateTicketPdf } from '@/lib/generateTicketPdf';
import { getRoutePrice } from '@/lib/scheduleData';
import { useAuth } from '@/hooks/useAuth';
import { useIdempotency } from '@/hooks/useIdempotency';
import { useAtomicBooking, BookingData } from '@/hooks/useAtomicBooking';

type BookingStep = 'form' | 'payment' | 'success';
type AddressMode = 'gps' | 'manual';

const Booking = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  
  // Atomic booking and idempotency hooks - MUST be before any conditional returns
  const idempotency = useIdempotency({ 
    ttl: 5 * 60 * 1000, // 5 minutes
    storagePrefix: 'booking' 
  });
  const atomicBooking = useAtomicBooking({ 
    maxRetries: 3, 
    baseDelay: 1000 
  });
  
  const [currentStep, setCurrentStep] = useState<BookingStep>('form');
  const [orderId, setOrderId] = useState<string>('');
  const [paymentUploaded, setPaymentUploaded] = useState(false);
  const [addressMode, setAddressMode] = useState<AddressMode>('gps');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditingGpsAddress, setIsEditingGpsAddress] = useState(false);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isOutsideServiceArea, setIsOutsideServiceArea] = useState(false);
  
  // Dropoff GPS states
  const [dropoffAddressMode, setDropoffAddressMode] = useState<AddressMode>('manual');
  const [isGettingDropoffLocation, setIsGettingDropoffLocation] = useState(false);
  const [dropoffGpsCoords, setDropoffGpsCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [isEditingDropoffGpsAddress, setIsEditingDropoffGpsAddress] = useState(false);
  const [dropoffAdditionalDetails, setDropoffAdditionalDetails] = useState('');
  
  // Surabaya service area boundaries (approximate)
  const SURABAYA_BOUNDS = {
    north: -7.15,  // Batas utara
    south: -7.40,  // Batas selatan
    west: 112.60,  // Batas barat
    east: 112.85,  // Batas timur
  };
  
  const isWithinSurabaya = (lat: number, lng: number): boolean => {
    return (
      lat >= SURABAYA_BOUNDS.south &&
      lat <= SURABAYA_BOUNDS.north &&
      lng >= SURABAYA_BOUNDS.west &&
      lng <= SURABAYA_BOUNDS.east
    );
  };
  
  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';
  const via = searchParams.get('via') || '';
  const pickupTime = searchParams.get('pickupTime') || '';
  const initialDate = searchParams.get('date') || '';
  const passengers = parseInt(searchParams.get('passengers') || '1');
  
  // State for travel date (editable if not provided in URL)
  const [travelDate, setTravelDate] = useState(initialDate);
  
  // Get price from schedule data automatically
  const pricePerPerson = getRoutePrice(from, to);
  const totalPrice = pricePerPerson * passengers;

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    pickupAddress: '',
    dropoffAddress: '',
    notes: '',
  });

  // Pre-fill form with user data if logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  // Show login required screen if not authenticated
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary">
        <Navbar />
        <div className="container max-w-lg mx-auto px-4 pt-24 pb-16">
          <div className="bg-card rounded-2xl shadow-xl p-8 text-center">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogIn className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-3">Login Diperlukan</h1>
            <p className="text-muted-foreground mb-6">
              Silakan login atau daftar terlebih dahulu untuk melakukan pemesanan tiket.
            </p>
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => navigate('/auth')}
                className="w-full bg-primary hover:bg-primary/90"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Login / Daftar
              </Button>
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Beranda
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }


  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Reverse geocoding using OpenStreetMap Nominatim (free)
  const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id',
          },
        }
      );
      
      if (!response.ok) return null;
      
      const data = await response.json();
      
      if (data.display_name) {
        return data.display_name;
      }
      
      // Build address from parts if display_name not available
      const addr = data.address;
      if (addr) {
        const parts = [
          addr.road || addr.street,
          addr.house_number,
          addr.neighbourhood || addr.suburb,
          addr.village || addr.city_district,
          addr.city || addr.town || addr.municipality,
          addr.state,
          addr.postcode,
        ].filter(Boolean);
        
        if (parts.length > 0) {
          return parts.join(', ');
        }
      }
      
      return null;
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return null;
    }
  };

  // Handle marker drag to update location
  const handleMarkerDrag = async (lat: number, lng: number) => {
    // Validate service area
    const withinArea = isWithinSurabaya(lat, lng);
    setIsOutsideServiceArea(!withinArea);
    
    if (!withinArea) {
      toast.error('Lokasi di luar area layanan! Penjemputan hanya tersedia di wilayah Surabaya.');
    }
    
    setGpsCoords({ lat, lng });
    
    toast.info('Memperbarui alamat...');
    const address = await reverseGeocode(lat, lng);
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    
    let locationText: string;
    if (address) {
      locationText = `📍 ${address}\n\n📐 Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n✏️ Lokasi dikoreksi manual\n🔗 ${mapsLink}`;
    } else {
      locationText = `📍 Lokasi GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n✏️ Lokasi dikoreksi manual\n🔗 ${mapsLink}`;
    }
    
    // Preserve additional details if any
    if (additionalDetails.trim()) {
      locationText += `\n\n🏠 Detail: ${additionalDetails.trim()}`;
    }
    
    setFormData(prev => ({ ...prev, pickupAddress: locationText }));
    
    if (withinArea) {
      toast.success('Lokasi berhasil diperbarui!');
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung GPS');
      return;
    }

    setIsGettingLocation(true);
    toast.info('Mencari lokasi paling akurat...');

    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    const processLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const finalAccuracy = Math.round(position.coords.accuracy);
      
      // Validate service area
      const withinArea = isWithinSurabaya(latitude, longitude);
      setIsOutsideServiceArea(!withinArea);
      
      setGpsCoords({ lat: latitude, lng: longitude });
      
      // Get address from coordinates
      toast.info('Mendapatkan alamat...');
      const address = await reverseGeocode(latitude, longitude);
      
      // Create Google Maps link for the location
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      
      let locationText: string;
      if (address) {
        locationText = `📍 ${address}\n\n📐 Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n📏 Akurasi GPS: ±${finalAccuracy} meter\n🔗 ${mapsLink}`;
      } else {
        locationText = `📍 Lokasi GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n📏 Akurasi: ±${finalAccuracy} meter\n🔗 ${mapsLink}`;
      }
      
      setFormData(prev => ({ ...prev, pickupAddress: locationText }));
      setIsGettingLocation(false);
      
      if (!withinArea) {
        toast.error('Lokasi Anda di luar area layanan! Penjemputan hanya tersedia di wilayah Surabaya.');
      } else if (finalAccuracy > 100) {
        toast.warning(`Lokasi didapat dengan akurasi ±${finalAccuracy}m. Untuk akurasi lebih baik, coba di area terbuka.`);
      } else {
        toast.success(`Lokasi berhasil didapatkan! (akurasi ±${finalAccuracy}m)`);
      }
    };

    // Use watchPosition for better accuracy - it keeps updating until we get a good fix
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        attempts++;
        const accuracy = position.coords.accuracy;
        
        console.log(`GPS attempt ${attempts}: accuracy ${accuracy}m`);

        // Keep the position with best accuracy
        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // If accuracy is good enough (< 50m) or we've tried enough times, use it
        if (accuracy < 50 || attempts >= maxAttempts) {
          navigator.geolocation.clearWatch(watchId);
          await processLocation(bestPosition);
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setIsGettingLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Akses lokasi ditolak. Silakan izinkan akses lokasi di pengaturan browser.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Informasi lokasi tidak tersedia. Pastikan GPS aktif.');
            break;
          case error.TIMEOUT:
            toast.error('Waktu permintaan lokasi habis. Coba lagi di area terbuka.');
            break;
          default:
            toast.error('Gagal mendapatkan lokasi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    // Safety timeout - stop watching after 15 seconds if still running
    setTimeout(async () => {
      if (attempts > 0 && bestPosition) {
        navigator.geolocation.clearWatch(watchId);
        await processLocation(bestPosition);
      }
    }, 16000);
  };

  const handleAddressModeChange = (mode: AddressMode) => {
    setAddressMode(mode);
    if (mode === 'manual') {
      setFormData(prev => ({ ...prev, pickupAddress: '' }));
      setGpsCoords(null);
    }
  };

  // Handle dropoff marker drag to update location
  const handleDropoffMarkerDrag = async (lat: number, lng: number) => {
    setDropoffGpsCoords({ lat, lng });
    
    toast.info('Memperbarui alamat pengantaran...');
    const address = await reverseGeocode(lat, lng);
    const mapsLink = `https://maps.google.com/?q=${lat},${lng}`;
    
    let locationText: string;
    if (address) {
      locationText = `📍 ${address}\n\n📐 Koordinat: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n✏️ Lokasi dikoreksi manual\n🔗 ${mapsLink}`;
    } else {
      locationText = `📍 Lokasi GPS: ${lat.toFixed(6)}, ${lng.toFixed(6)}\n✏️ Lokasi dikoreksi manual\n🔗 ${mapsLink}`;
    }
    
    // Preserve additional details if any
    if (dropoffAdditionalDetails.trim()) {
      locationText += `\n\n🏠 Detail: ${dropoffAdditionalDetails.trim()}`;
    }
    
    setFormData(prev => ({ ...prev, dropoffAddress: locationText }));
    toast.success('Lokasi pengantaran berhasil diperbarui!');
  };

  const handleGetDropoffLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung GPS');
      return;
    }

    setIsGettingDropoffLocation(true);
    toast.info('Mencari lokasi pengantaran...');

    let bestPosition: GeolocationPosition | null = null;
    let attempts = 0;
    const maxAttempts = 5;

    const processDropoffLocation = async (position: GeolocationPosition) => {
      const { latitude, longitude } = position.coords;
      const finalAccuracy = Math.round(position.coords.accuracy);
      
      setDropoffGpsCoords({ lat: latitude, lng: longitude });
      
      // Get address from coordinates
      toast.info('Mendapatkan alamat pengantaran...');
      const address = await reverseGeocode(latitude, longitude);
      
      // Create Google Maps link for the location
      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      
      let locationText: string;
      if (address) {
        locationText = `📍 ${address}\n\n📐 Koordinat: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n📏 Akurasi GPS: ±${finalAccuracy} meter\n🔗 ${mapsLink}`;
      } else {
        locationText = `📍 Lokasi GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n📏 Akurasi: ±${finalAccuracy} meter\n🔗 ${mapsLink}`;
      }
      
      setFormData(prev => ({ ...prev, dropoffAddress: locationText }));
      setIsGettingDropoffLocation(false);
      
      if (finalAccuracy > 100) {
        toast.warning(`Lokasi pengantaran didapat dengan akurasi ±${finalAccuracy}m.`);
      } else {
        toast.success(`Lokasi pengantaran berhasil didapatkan! (akurasi ±${finalAccuracy}m)`);
      }
    };

    // Use watchPosition for better accuracy
    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        attempts++;
        const accuracy = position.coords.accuracy;
        
        console.log(`Dropoff GPS attempt ${attempts}: accuracy ${accuracy}m`);

        // Keep the position with best accuracy
        if (!bestPosition || accuracy < bestPosition.coords.accuracy) {
          bestPosition = position;
        }

        // If accuracy is good enough (< 50m) or we've tried enough times, use it
        if (accuracy < 50 || attempts >= maxAttempts) {
          navigator.geolocation.clearWatch(watchId);
          await processDropoffLocation(bestPosition);
        }
      },
      (error) => {
        navigator.geolocation.clearWatch(watchId);
        setIsGettingDropoffLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Akses lokasi ditolak.');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('Informasi lokasi tidak tersedia.');
            break;
          case error.TIMEOUT:
            toast.error('Waktu permintaan lokasi habis.');
            break;
          default:
            toast.error('Gagal mendapatkan lokasi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );

    // Safety timeout
    setTimeout(async () => {
      if (attempts > 0 && bestPosition) {
        navigator.geolocation.clearWatch(watchId);
        await processDropoffLocation(bestPosition);
      }
    }, 16000);
  };

  const handleDropoffAddressModeChange = (mode: AddressMode) => {
    setDropoffAddressMode(mode);
    if (mode === 'manual') {
      setFormData(prev => ({ ...prev, dropoffAddress: '' }));
      setDropoffGpsCoords(null);
    }
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.name || !formData.phone || !formData.pickupAddress) {
      toast.error('Mohon lengkapi data yang diperlukan');
      return;
    }

    if (!travelDate) {
      toast.error('Mohon pilih tanggal perjalanan');
      return;
    }

    // Idempotency check - prevent double submission
    const idempotencyKey = idempotency.generateKey({
      name: formData.name,
      phone: formData.phone,
      route: `${from}-${to}`,
      date: travelDate,
      time: pickupTime,
      passengers,
    });

    if (!idempotency.startProcessing()) {
      toast.warning('Pemesanan sedang diproses, harap tunggu...');
      return;
    }

    // Prepare booking data for atomic transaction
    const bookingData: BookingData = {
      customer_name: formData.name,
      customer_phone: formData.phone,
      customer_email: formData.email || null,
      pickup_address: formData.pickupAddress,
      dropoff_address: formData.dropoffAddress || null,
      notes: formData.notes || null,
      route_from: from,
      route_to: to,
      route_via: via || null,
      pickup_time: pickupTime,
      travel_date: travelDate,
      passengers: passengers,
      total_price: totalPrice,
      user_id: user?.id || null,
    };

    try {
      // Execute atomic booking with retry logic
      const result = await atomicBooking.executeBooking(bookingData, idempotencyKey);

      if (result.success && result.orderId) {
        idempotency.completeProcessing();
        
        // Show retry info if applicable
        if (result.retryCount && result.retryCount > 0) {
          console.log(`Booking succeeded after ${result.retryCount} retries`);
        }

        // Send email notification (don't block on this)
        supabase.functions.invoke('send-booking-notification', {
          body: {
            orderId: result.orderId,
            customerName: formData.name,
            customerPhone: formData.phone,
            customerEmail: formData.email || undefined,
            routeFrom: from,
            routeTo: to,
            routeVia: via || undefined,
            pickupTime: pickupTime,
            travelDate: travelDate,
            passengers: passengers,
            totalPrice: totalPrice,
            pickupAddress: formData.pickupAddress,
            dropoffAddress: formData.dropoffAddress || undefined,
          },
        }).then((notifResult) => {
          if (notifResult.error) {
            console.error('Failed to send notification:', notifResult.error);
          } else {
            console.log('Notification sent:', notifResult.data);
          }
        }).catch(console.error);

        setOrderId(result.orderId);
        setCurrentStep('payment');
        toast.success('Pemesanan berhasil dibuat!', {
          icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
        });
      } else {
        idempotency.failProcessing();
        toast.error(result.error || 'Gagal membuat pemesanan. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      idempotency.failProcessing();
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [formData, travelDate, from, to, via, pickupTime, passengers, totalPrice, user, idempotency, atomicBooking]);

  const handlePaymentUploadSuccess = () => {
    setPaymentUploaded(true);
    setCurrentStep('success');
  };


  // Success Screen
  if (currentStep === 'success') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-12 md:pb-16">
          <div className="container px-4 sm:px-6 max-w-2xl">
            <div className="elevated-card p-5 sm:p-6 md:p-8 text-center">
              <div className="w-16 h-16 md:w-20 md:h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6">
                <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="font-display text-xl md:text-2xl font-bold text-foreground mb-2">
                Pembayaran Sedang Diverifikasi
              </h1>
              <p className="text-muted-foreground mb-4 md:mb-6 text-sm md:text-base">
                Terima kasih, {formData.name}. Bukti pembayaran Anda sedang kami periksa. 
                Konfirmasi akan dikirim melalui WhatsApp dalam 1x24 jam.
              </p>
              
              <div className="bg-secondary/50 rounded-lg md:rounded-xl p-4 md:p-6 text-left mb-4 md:mb-6">
                <h3 className="font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">Detail Pemesanan</h3>
                <div className="space-y-2 text-xs md:text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order ID</span>
                    <span className="font-mono font-bold">{orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rute</span>
                    <span className="font-medium">{from} → {via && `${via} → `}{to}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span className="font-medium">{formatDate(travelDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jam Penjemputan</span>
                    <span className="font-medium">{pickupTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Jumlah Penumpang</span>
                    <span className="font-medium">{passengers} orang</span>
                  </div>
                  <div className="flex justify-between border-t border-border pt-2 mt-2">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-bold text-accent">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
                </div>
              
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button 
                  onClick={async () => await generateTicketPdf({
                    orderId: orderId,
                    customerName: formData.name,
                    customerPhone: formData.phone,
                    customerEmail: formData.email,
                    routeFrom: from,
                    routeTo: to,
                    routeVia: via,
                    travelDate: travelDate,
                    pickupTime: pickupTime,
                    pickupAddress: formData.pickupAddress,
                    dropoffAddress: formData.dropoffAddress,
                    passengers: passengers,
                    totalPrice: totalPrice,
                    notes: formData.notes,
                    paymentStatus: 'waiting_verification',
                  })}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  Cetak Tiket PDF
                </Button>
                <Button onClick={() => navigate('/')} className="btn-gold">
                  Kembali ke Beranda
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Payment Screen
  if (currentStep === 'payment') {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-20 md:pt-24 pb-12 md:pb-16">
          <div className="container px-4 sm:px-6 max-w-4xl">
            <Button 
              variant="ghost" 
              onClick={() => setCurrentStep('form')}
              className="mb-4 md:mb-6 text-sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Form
            </Button>

            <div className="grid md:grid-cols-2 gap-4 md:gap-6">
              {/* Payment Info */}
              <div>
                <PaymentInfoBooking orderId={orderId} totalPrice={totalPrice} />
              </div>

              {/* Upload & Summary */}
              <div className="space-y-6">
                <PaymentUpload 
                  orderId={orderId} 
                  onUploadSuccess={handlePaymentUploadSuccess}
                />

                {/* Trip Summary */}
                <div className="elevated-card p-4 md:p-6">
                  <h3 className="font-display font-semibold text-foreground mb-3 md:mb-4 text-sm md:text-base">
                    Ringkasan Perjalanan
                  </h3>
                  
                  <div className="space-y-2 md:space-y-3 text-xs md:text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono font-bold text-primary">{orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Rute</span>
                      <span className="font-medium text-foreground">
                        {from} {via && `→ ${via}`} → {to}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tanggal</span>
                      <span className="font-medium text-foreground">{formatDate(travelDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Jam Penjemputan</span>
                      <span className="font-medium text-foreground">{pickupTime}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Penumpang</span>
                      <span className="font-medium text-foreground">{passengers} orang</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Harga/orang</span>
                      <span className="font-medium text-foreground">{formatPrice(pricePerPerson)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-border">
                      <span className="font-semibold text-foreground">Total</span>
                      <span className="font-bold text-accent text-lg">{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Method Info */}
                <div className="text-xs text-center text-muted-foreground bg-secondary/30 rounded-lg p-3">
                  <p>🏦 Transfer ke rekening di atas, lalu upload bukti pembayaran</p>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Booking Form Screen
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-20 md:pt-24 pb-12 md:pb-16">
        <div className="container px-4 sm:px-6 max-w-4xl">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-4 md:mb-6 text-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6">
            {/* Booking Form */}
            <div className="md:col-span-2">
              <div className="glass-card rounded-xl md:rounded-2xl p-4 sm:p-5 md:p-6">
                <h1 className="font-display text-xl md:text-2xl font-bold text-foreground mb-4 md:mb-6">
                  Form Pemesanan
                </h1>
                
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                  <div>
                    <label className="block text-xs md:text-sm font-medium text-muted-foreground mb-1.5 md:mb-2">
                      Nama Lengkap *
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Masukkan nama lengkap"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Nomor WhatsApp *
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="08xxxxxxxxxx"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Email (Opsional)
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="email@contoh.com"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Travel Date Input */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Tanggal Perjalanan *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        type="date"
                        value={travelDate}
                        onChange={(e) => setTravelDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Alamat Penjemputan *
                    </label>
                    
                    {/* Address Mode Toggle */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => handleAddressModeChange('gps')}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          addressMode === 'gps'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <Navigation className="w-4 h-4" />
                        <span className="text-sm font-medium">GPS Lokasi</span>
                        <span className="text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full">Rekomendasi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddressModeChange('manual')}
                        className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all ${
                          addressMode === 'manual'
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-secondary/30 text-muted-foreground hover:border-primary/50'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="text-sm font-medium">Input Manual</span>
                      </button>
                    </div>

                    {/* GPS Mode */}
                    {addressMode === 'gps' && (
                      <div className="space-y-3">
                        <Button
                          type="button"
                          onClick={handleGetLocation}
                          disabled={isGettingLocation}
                          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-6"
                        >
                          {isGettingLocation ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Mendapatkan Lokasi...
                            </>
                          ) : (
                            <>
                              <Navigation className="w-5 h-5 mr-2" />
                              {gpsCoords ? 'Perbarui Lokasi GPS' : 'Bagikan Lokasi GPS Saya'}
                            </>
                          )}
                        </Button>
                        
                        {/* Outside Service Area Warning */}
                        {isOutsideServiceArea && gpsCoords && (
                          <div className="bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-800 flex items-center justify-center flex-shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-red-800 dark:text-red-300 mb-1">Di Luar Area Layanan!</p>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                  Maaf, layanan penjemputan hanya tersedia di wilayah <strong>Surabaya</strong>. 
                                  Silakan pilih lokasi penjemputan dalam area Surabaya atau gunakan input manual untuk lokasi meeting point.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {gpsCoords && !isOutsideServiceArea && (
                          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                                <MapPinned className="w-5 h-5 text-green-600 dark:text-green-400" />
                              </div>
                              <div className="flex-1">
                                <p className="font-medium text-green-800 dark:text-green-300 mb-1">Lokasi Berhasil Didapatkan!</p>
                                <p className="text-sm text-green-700 dark:text-green-400">
                                  Koordinat: {gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}
                                </p>
                                <a
                                  href={`https://maps.google.com/?q=${gpsCoords.lat},${gpsCoords.lng}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary underline mt-1 inline-block"
                                >
                                  Lihat di Google Maps
                                </a>
                              </div>
                            </div>
                            
                            {/* Toggle Edit Address */}
                            <button
                              type="button"
                              onClick={() => setIsEditingGpsAddress(!isEditingGpsAddress)}
                              className="w-full flex items-center justify-center gap-2 p-2 rounded-lg border border-green-300 dark:border-green-700 bg-white/50 dark:bg-green-900/30 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-800/50 transition-colors text-sm"
                            >
                              <Edit3 className="w-4 h-4" />
                              {isEditingGpsAddress ? 'Tutup Edit' : 'Tambah Detail Alamat (No. Rumah, Patokan, dll)'}
                            </button>
                            
                            {/* Additional Details Input */}
                            {isEditingGpsAddress && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-green-800 dark:text-green-300">
                                  Detail Tambahan:
                                </label>
                                <Textarea
                                  value={additionalDetails}
                                  onChange={(e) => {
                                    setAdditionalDetails(e.target.value);
                                    // Update the full address with additional details
                                    const baseAddress = formData.pickupAddress.split('\n\n🏠')[0];
                                    if (e.target.value.trim()) {
                                      setFormData(prev => ({
                                        ...prev,
                                        pickupAddress: `${baseAddress}\n\n🏠 Detail: ${e.target.value.trim()}`
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        pickupAddress: baseAddress
                                      }));
                                    }
                                  }}
                                  placeholder="Contoh: Rumah warna biru, No. 45, sebelah warung Pak Andi, dekat masjid"
                                  className="min-h-[80px] bg-white dark:bg-green-900/30 border-green-300 dark:border-green-700 text-foreground"
                                />
                                <p className="text-xs text-green-600 dark:text-green-400">
                                  💡 Tambahkan patokan agar driver lebih mudah menemukan lokasi Anda
                                </p>
                              </div>
                            )}
                            
                            {/* Mini Map Preview */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-green-800 dark:text-green-300">
                                <Map className="w-4 h-4" />
                                Preview Lokasi:
                              </div>
                              <Suspense fallback={
                                <div className="w-full h-[250px] rounded-lg bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 flex items-center justify-center">
                                  <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                                </div>
                              }>
                                <MiniMap 
                                  lat={gpsCoords.lat} 
                                  lng={gpsCoords.lng} 
                                  address={formData.pickupAddress}
                                  onLocationChange={handleMarkerDrag}
                                />
                              </Suspense>
                            </div>
                          </div>
                        )}
                        
                        {!gpsCoords && (
                          <p className="text-xs text-muted-foreground text-center">
                            💡 Dengan GPS, driver dapat menemukan lokasi Anda dengan lebih akurat
                          </p>
                        )}
                      </div>
                    )}

                    {/* Manual Mode */}
                    {addressMode === 'manual' && (
                      <div className="relative">
                        <MapPinned className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Textarea
                          name="pickupAddress"
                          value={formData.pickupAddress}
                          onChange={handleInputChange}
                          placeholder="Masukkan alamat lengkap untuk penjemputan (contoh: Jl. Raya No. 123, Kel. X, Kec. Y, Kota Z)"
                          className="pl-10 min-h-[100px]"
                          required={addressMode === 'manual'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Alamat Pengantaran */}
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Alamat Pengantaran / Tujuan (Opsional)
                    </label>
                    
                    {/* Dropoff Address Mode Toggle */}
                    <div className="flex gap-2 mb-3">
                      <Button
                        type="button"
                        variant={dropoffAddressMode === 'gps' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDropoffAddressModeChange('gps')}
                        className="flex-1"
                      >
                        <Map className="w-4 h-4 mr-2" />
                        Pilih di Peta
                      </Button>
                      <Button
                        type="button"
                        variant={dropoffAddressMode === 'manual' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleDropoffAddressModeChange('manual')}
                        className="flex-1"
                      >
                        <Edit3 className="w-4 h-4 mr-2" />
                        Tulis Manual
                      </Button>
                    </div>

                    {/* Dropoff Map Mode - Like Gojek */}
                    {dropoffAddressMode === 'gps' && (
                      <div className="space-y-3">
                        {/* Map for selecting location */}
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-xs text-muted-foreground">
                              Cari alamat atau geser marker untuk menentukan lokasi pengantaran
                            </span>
                          </div>
                          <Suspense fallback={
                            <div className="h-[280px] bg-secondary/50 rounded-lg flex items-center justify-center">
                              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                          }>
                            <MiniMap 
                              lat={dropoffGpsCoords?.lat ?? -7.2575}
                              lng={dropoffGpsCoords?.lng ?? 112.7521}
                              originalLat={dropoffGpsCoords?.lat ?? -7.2575}
                              originalLng={dropoffGpsCoords?.lng ?? 112.7521}
                              address={formData.dropoffAddress}
                              onLocationChange={handleDropoffMarkerDrag}
                              clickToPlace={true}
                              markerLabel="📍 Lokasi Pengantaran"
                            />
                          </Suspense>
                        </div>
                        
                        {formData.dropoffAddress && (
                          <div className="bg-secondary/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-foreground">📍 Lokasi Pengantaran Dipilih</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingDropoffGpsAddress(!isEditingDropoffGpsAddress)}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </div>
                            
                            {isEditingDropoffGpsAddress ? (
                              <Textarea
                                name="dropoffAddress"
                                value={formData.dropoffAddress}
                                onChange={handleInputChange}
                                className="min-h-[100px] text-sm"
                              />
                            ) : (
                              <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-sans">
                                {formData.dropoffAddress}
                              </pre>
                            )}
                            
                            <div className="mt-3">
                              <label className="block text-xs font-medium text-muted-foreground mb-1">
                                Detail tambahan (nama gedung, lantai, dll):
                              </label>
                              <Input
                                value={dropoffAdditionalDetails}
                                onChange={(e) => setDropoffAdditionalDetails(e.target.value)}
                                placeholder="Contoh: Gedung A Lt. 3, dekat pintu utara"
                                className="text-sm"
                              />
                            </div>
                          </div>
                        )}
                        
                        {!formData.dropoffAddress && (
                          <p className="text-xs text-muted-foreground text-center bg-secondary/30 rounded-lg py-2">
                            💡 Cari alamat di kolom pencarian atau geser marker di peta
                          </p>
                        )}
                      </div>
                    )}

                    {/* Dropoff Manual Mode */}
                    {dropoffAddressMode === 'manual' && (
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                        <Textarea
                          name="dropoffAddress"
                          value={formData.dropoffAddress}
                          onChange={handleInputChange}
                          placeholder="Masukkan alamat tujuan pengantaran (contoh: Terminal Purabaya, Jl. Bungurasih)"
                          className="pl-10 min-h-[80px]"
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Isi jika Anda ingin diantarkan ke lokasi tertentu di kota tujuan
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                      Catatan Tambahan
                    </label>
                    <Textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      placeholder="Catatan khusus untuk perjalanan Anda"
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Service Area Warning for Submit */}
                  {addressMode === 'gps' && isOutsideServiceArea && (
                    <p className="text-sm text-red-600 dark:text-red-400 text-center">
                      ⚠️ Tidak dapat melanjutkan: Lokasi di luar area layanan Surabaya
                    </p>
                  )}

                  {/* Transaction State Indicator */}
                  {atomicBooking.isTransacting && (
                    <div className="mb-4 p-3 rounded-lg bg-secondary/50 border border-border">
                      <TransactionIndicator 
                        state={atomicBooking.transactionState}
                        retryCount={atomicBooking.retryCount}
                        maxRetries={3}
                        showProgress={true}
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full btn-gold py-6 text-lg"
                    disabled={atomicBooking.isTransacting || idempotency.isLocked || (addressMode === 'gps' && isOutsideServiceArea)}
                  >
                    {atomicBooking.isTransacting ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        {atomicBooking.retryCount > 0 
                          ? `Mencoba ulang (${atomicBooking.retryCount})...` 
                          : 'Memproses...'}
                      </span>
                    ) : 'Lanjut ke Pembayaran'}
                  </Button>
                </form>
              </div>
            </div>

            {/* Order Summary */}
            <div>
              <div className="elevated-card p-6 sticky top-24">
                <h3 className="font-display font-semibold text-foreground mb-4">
                  Ringkasan Perjalanan
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Rute</p>
                      <p className="font-medium text-foreground">
                        {from} {via && `→ ${via}`} → {to}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tanggal</p>
                      <p className="font-medium text-foreground">{travelDate ? formatDate(travelDate) : 'Belum dipilih'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Jam Penjemputan</p>
                      <p className="font-medium text-foreground">{pickupTime}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Users className="w-5 h-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Jumlah Penumpang</p>
                      <p className="font-medium text-foreground">{passengers} orang</p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border mt-4 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Harga/orang</span>
                    <span className="text-foreground">{formatPrice(pricePerPerson)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Penumpang</span>
                    <span className="text-foreground">× {passengers}</span>
                  </div>
                  <div className="flex justify-between font-bold pt-2 border-t border-border">
                    <span className="text-foreground">Total</span>
                    <span className="text-accent text-xl">{formatPrice(totalPrice)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Booking;