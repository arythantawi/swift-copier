import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Clock,
  Users,
  Phone,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Download,
  Star,
  MessageSquare } from
'lucide-react';
import { generateTicketPdf } from '@/lib/generateTicketPdf';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import logo44Trans from '@/assets/logo-44trans.png';

interface Booking {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  travel_date: string;
  pickup_time: string;
  route_from: string;
  route_to: string;
  route_via: string | null;
  pickup_address: string;
  dropoff_address: string | null;
  passengers: number;
  total_price: number;
  payment_status: string;
  payment_proof_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'confirmed':
      return {
        label: 'Terkonfirmasi',
        variant: 'default' as const,
        icon: CheckCircle2,
        className: 'bg-green-500 hover:bg-green-600'
      };
    case 'pending':
      return {
        label: 'Menunggu Pembayaran',
        variant: 'secondary' as const,
        icon: Clock3,
        className: 'bg-yellow-500 hover:bg-yellow-600 text-black'
      };
    case 'paid':
      return {
        label: 'Sudah Dibayar',
        variant: 'default' as const,
        icon: CheckCircle2,
        className: 'bg-blue-500 hover:bg-blue-600'
      };
    case 'cancelled':
      return {
        label: 'Dibatalkan',
        variant: 'destructive' as const,
        icon: XCircle,
        className: ''
      };
    default:
      return {
        label: status,
        variant: 'outline' as const,
        icon: AlertCircle,
        className: ''
      };
  }
};

const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviewedBookingIds, setReviewedBookingIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [bookingsRes, testimonialsRes] = await Promise.all([
        supabase.from('bookings').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('testimonials').select('booking_id').eq('user_id', user.id)
      ]);

      if (bookingsRes.error) throw bookingsRes.error;
      setBookings(bookingsRes.data || []);
      setReviewedBookingIds((testimonialsRes.data || []).map(t => t.booking_id).filter(Boolean) as string[]);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
      toast({
        title: 'Gagal memuat pesanan',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBookings();
    }
  }, [user]);

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase.
    channel('user-bookings-changes').
    on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        console.log('Booking update received:', payload);

        if (payload.eventType === 'UPDATE') {
          setBookings((prev) =>
          prev.map((booking) =>
          booking.id === payload.new.id ?
          { ...booking, ...(payload.new as Booking) } :
          booking
          )
          );

          const newStatus = (payload.new as Booking).payment_status;
          const oldStatus = (payload.old as Booking).payment_status;

          if (newStatus !== oldStatus) {
            const statusConfig = getStatusConfig(newStatus);
            toast({
              title: 'Status Pesanan Diperbarui',
              description: `Pesanan ${(payload.new as Booking).order_id} sekarang ${statusConfig.label}`
            });
          }
        } else if (payload.eventType === 'INSERT') {
          setBookings((prev) => [payload.new as Booking, ...prev]);
        } else if (payload.eventType === 'DELETE') {
          setBookings((prev) => prev.filter((b) => b.id !== payload.old.id));
        }
      }
    ).
    subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>);

  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg shadow-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container px-4 sm:px-6">
          <nav className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="mr-2">

                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 rounded-full border-2 border-primary/50 bg-white/90 p-0.5 shadow-sm">
                <img src={logo44Trans} alt="44 Trans" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="font-display font-bold text-foreground">Pesanan Saya</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchBookings}
              disabled={isLoading}
              className="gap-2">

              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container px-4 sm:px-6 py-6">
        {/* Real-time indicator */}
        <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Update real-time aktif
        </div>

        {isLoading ?
        <div className="space-y-4">
            {[1, 2, 3].map((i) =>
          <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-40" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
          )}
          </div> :
        bookings.length === 0 ?
        <Card className="text-center py-12">
            <CardContent>
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Belum Ada Pesanan</h3>
              <p className="text-muted-foreground mb-6">
                Anda belum memiliki riwayat pesanan. Mulai pesan perjalanan sekarang!
              </p>
              <Button asChild>
                <Link to="/#rute">Lihat Rute</Link>
              </Button>
            </CardContent>
          </Card> :

        <div className="space-y-4">
            {bookings.map((booking) => {
            const statusConfig = getStatusConfig(booking.payment_status);
            const StatusIcon = statusConfig.icon;

            return (
              <Card key={booking.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-base font-semibold">
                          {booking.order_id}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          Dipesan {format(new Date(booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: id })}
                        </p>
                      </div>
                      <Badge className={`${statusConfig.className} gap-1 shrink-0`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-4">
                    {/* Route */}
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <div className="text-sm">
                        <p className="font-medium">{booking.route_from} → {booking.route_to}</p>
                        {booking.route_via &&
                      <p className="text-muted-foreground text-xs">via {booking.route_via}</p>
                      }
                      </div>
                    </div>

                    {/* Date & Time */}
                    <div className="flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(booking.travel_date), 'dd MMMM yyyy', { locale: id })}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.pickup_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.passengers} penumpang</span>
                      </div>
                    </div>

                    {/* Pickup Address */}
                    <div className="text-sm">
                      <p className="text-muted-foreground text-xs mb-1">Alamat Jemput:</p>
                      <p>{booking.pickup_address}</p>
                    </div>

                    {/* Price */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <span className="text-sm text-muted-foreground">Total Harga</span>
                      <span className="font-bold text-primary text-lg">
                        {formatPrice(booking.total_price)}
                      </span>
                    </div>

                    {/* Payment Proof Status */}
                    {booking.payment_proof_url &&
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 rounded-md bg-primary-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Bukti pembayaran sudah diupload
                      </div>
                  }

                    {/* Download Ticket Button for verified payments */}
                    {(booking.payment_status === 'paid' || booking.payment_status === 'confirmed') &&
                  <Button
                        variant="default"
                        className="w-full gap-2"
                        onClick={() => generateTicketPdf({
                          orderId: booking.order_id,
                          customerName: booking.customer_name,
                          customerPhone: booking.customer_phone,
                          customerEmail: booking.customer_email,
                          routeFrom: booking.route_from,
                          routeTo: booking.route_to,
                          routeVia: booking.route_via,
                          travelDate: booking.travel_date,
                          pickupTime: booking.pickup_time,
                          pickupAddress: booking.pickup_address,
                          dropoffAddress: booking.dropoff_address,
                          passengers: booking.passengers,
                          totalPrice: booking.total_price,
                          notes: booking.notes,
                          paymentStatus: booking.payment_status
                        })}
                      >
                        <Download className="w-4 h-4" />
                        Download Tiket
                      </Button>
                  }

                    {/* Review CTA for confirmed bookings */}
                    {(booking.payment_status === 'paid' || booking.payment_status === 'confirmed') && !reviewedBookingIds.includes(booking.id) &&
                  <div className="flex items-center gap-3 p-3 rounded-md bg-accent/50 border border-accent">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Star className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Bagaimana perjalanan Anda?</p>
                          <p className="text-xs text-muted-foreground">Berikan ulasan untuk membantu penumpang lain</p>
                        </div>
                        <Button variant="outline" size="sm" className="gap-1 shrink-0" asChild>
                          <Link to="/profile#ulasan">
                            <MessageSquare className="w-3 h-3" />
                            Tulis Ulasan
                          </Link>
                        </Button>
                      </div>
                  }

                    {/* Already reviewed indicator */}
                    {(booking.payment_status === 'paid' || booking.payment_status === 'confirmed') && reviewedBookingIds.includes(booking.id) &&
                  <div className="flex items-center gap-2 text-xs text-green-600 p-2 rounded-md bg-green-50">
                        <CheckCircle2 className="w-4 h-4" />
                        Anda sudah memberikan ulasan untuk pesanan ini
                      </div>
                  }

                    {/* Notes */}
                    {booking.notes &&
                  <div className="text-sm bg-secondary/30 p-3 rounded-md">
                        <p className="text-xs text-muted-foreground mb-1">Catatan:</p>
                        <p className="text-sm">{booking.notes}</p>
                      </div>
                  }

                    {/* Contact for pending bookings */}
                    {booking.payment_status === 'pending' &&
                  <div className="flex items-center gap-2 text-sm bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 p-3 rounded-md">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p>Silakan upload bukti pembayaran atau hubungi admin untuk konfirmasi.</p>
                      </div>
                  }
                  </CardContent>
                </Card>);

          })}
          </div>
        }

        {/* Help Section */}
        <Card className="mt-8 bg-primary/5 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Phone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Butuh Bantuan?</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Jika ada pertanyaan tentang pesanan Anda, silakan hubungi kami.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href="https://wa.me/6281234567890" target="_blank" rel="noopener noreferrer">
                    Hubungi WhatsApp
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>);

};

export default MyBookings;