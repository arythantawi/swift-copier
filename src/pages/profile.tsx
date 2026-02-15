import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
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
  Star,
  MessageSquare,
  User,
  Mail,
  Edit3,
  History,
  Send
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface UserTestimonial {
  id: string;
  booking_id: string | null;
  customer_name: string;
  customer_photo_url: string | null;
  customer_location: string | null;
  rating: number;
  testimonial_text: string;
  route_taken: string | null;
  is_active: boolean;
  created_at: string;
  // Original values submitted by user (not affected by admin edits)
  original_testimonial_text: string | null;
  original_rating: number | null;
  is_deleted_by_admin: boolean;
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

const Profile = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [testimonials, setTestimonials] = useState<UserTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Review form state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    testimonial_text: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get user metadata (Google profile)
  const userPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0];
  const userEmail = user?.email;

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (error: any) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchUserTestimonials = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('testimonials')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTestimonials(data || []);
    } catch (error: any) {
      console.error('Error fetching testimonials:', error);
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchBookings(), fetchUserTestimonials()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  // Note: No realtime subscription for testimonials
  // User should always see their original reviews, unaffected by admin edits/deletes

  // Real-time subscription for booking updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user-bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setBookings(prev => 
              prev.map(booking => 
                booking.id === payload.new.id 
                  ? { ...booking, ...payload.new as Booking }
                  : booking
              )
            );
            
            const newStatus = (payload.new as Booking).payment_status;
            const oldStatus = (payload.old as Booking).payment_status;
            
            if (newStatus !== oldStatus) {
              const statusConfig = getStatusConfig(newStatus);
              toast({
                title: 'Status Pesanan Diperbarui',
                description: `Pesanan ${(payload.new as Booking).order_id} sekarang ${statusConfig.label}`,
              });
            }
          } else if (payload.eventType === 'INSERT') {
            setBookings(prev => [payload.new as Booking, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setBookings(prev => prev.filter(b => b.id !== payload.old.id));
          }
        }
      )
      .subscribe();

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

  // Get bookings eligible for review (confirmed/paid and not yet reviewed)
  const getEligibleBookings = () => {
    const reviewedBookingIds = testimonials.map(t => t.booking_id);
    return bookings.filter(b => 
      ['confirmed', 'paid'].includes(b.payment_status) && 
      !reviewedBookingIds.includes(b.id)
    );
  };

  const openReviewDialog = (booking: Booking) => {
    setSelectedBooking(booking);
    setReviewForm({ rating: 5, testimonial_text: '' });
    setReviewDialogOpen(true);
  };

  const submitReview = async () => {
    if (!selectedBooking || !user || !reviewForm.testimonial_text.trim()) {
      toast({
        title: 'Gagal',
        description: 'Mohon isi ulasan Anda',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('testimonials').insert([{
        user_id: user.id,
        booking_id: selectedBooking.id,
        customer_name: userName || 'Pelanggan',
        customer_photo_url: userPhoto || null,
        customer_location: null,
        rating: reviewForm.rating,
        testimonial_text: reviewForm.testimonial_text,
        route_taken: `${selectedBooking.route_from} - ${selectedBooking.route_to}`,
        is_active: true,
        display_order: 0,
        // Store original values so user always sees their original review
        original_testimonial_text: reviewForm.testimonial_text,
        original_rating: reviewForm.rating,
        is_deleted_by_admin: false
      }]);

      if (error) throw error;

      toast({
        title: 'Ulasan Terkirim!',
        description: 'Terima kasih atas ulasan Anda.',
      });

      setReviewDialogOpen(false);
      fetchUserTestimonials();
    } catch (error: any) {
      console.error('Error submitting review:', error);
      toast({
        title: 'Gagal mengirim ulasan',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (rating: number, interactive = false, onChange?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`w-6 h-6 ${interactive ? 'cursor-pointer' : ''} ${
              index < rating 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-muted-foreground/30'
            }`}
            onClick={interactive && onChange ? () => onChange(index + 1) : undefined}
          />
        ))}
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const eligibleBookings = getEligibleBookings();

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary via-background to-secondary">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg shadow-lg border-b border-border/50 sticky top-0 z-50">
        <div className="container px-4 sm:px-6">
          <nav className="flex items-center justify-between h-14 md:h-16">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/')}
                className="mr-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="w-8 h-8 rounded-full border-2 border-primary/50 bg-white/90 p-0.5 shadow-sm">
                <img src={logo44Trans} alt="44 Trans" className="w-full h-full object-contain rounded-full" />
              </div>
              <span className="font-display font-bold text-foreground">Profil Saya</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container px-4 sm:px-6 py-6 bg-white min-h-screen">
        {/* Profile Card */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16 border-2 border-primary/30">
                <AvatarImage src={userPhoto} alt={userName} />
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {userName?.[0]?.toUpperCase() || <User className="w-6 h-6" />}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">{userName}</h2>
                <p className="text-sm text-muted-foreground flex items-center gap-1 truncate">
                  <Mail className="w-4 h-4 shrink-0" />
                  {userEmail}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Prompt - Show if there are eligible bookings */}
        {eligibleBookings.length > 0 && (
          <Card className="mb-6 border-primary/30 bg-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-500" />
                Beri Ulasan
              </CardTitle>
              <CardDescription>
                Anda memiliki {eligibleBookings.length} perjalanan yang bisa diulas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {eligibleBookings.slice(0, 2).map(booking => (
                  <div key={booking.id} className="flex items-center justify-between gap-3 p-3 bg-card rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {booking.route_from} → {booking.route_to}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(booking.travel_date), 'dd MMM yyyy', { locale: localeId })}
                      </p>
                    </div>
                    <Button size="sm" onClick={() => openReviewDialog(booking)} className="gap-1 shrink-0">
                      <Edit3 className="w-3 h-3" />
                      Ulas
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bookings" className="gap-2">
              <History className="w-4 h-4" />
              Pesanan ({bookings.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Ulasan ({testimonials.length})
            </TabsTrigger>
          </TabsList>

          {/* Bookings Tab */}
          <TabsContent value="bookings">
            {/* Real-time indicator */}
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Update real-time aktif
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i}>
                    <CardHeader>
                      <Skeleton className="h-6 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : bookings.length === 0 ? (
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
              </Card>
            ) : (
              <div className="space-y-4">
                {bookings.map(booking => {
                  const statusConfig = getStatusConfig(booking.payment_status);
                  const StatusIcon = statusConfig.icon;
                  const canReview = ['confirmed', 'paid'].includes(booking.payment_status) && 
                    !testimonials.some(t => t.booking_id === booking.id);
                  
                  return (
                    <Card key={booking.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <CardTitle className="text-base font-semibold">
                              {booking.order_id}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground mt-1">
                              {format(new Date(booking.created_at), 'dd MMMM yyyy, HH:mm', { locale: localeId })}
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
                            {booking.route_via && (
                              <p className="text-muted-foreground text-xs">via {booking.route_via}</p>
                            )}
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <span>{format(new Date(booking.travel_date), 'dd MMMM yyyy', { locale: localeId })}</span>
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

                        {/* Price */}
                        <div className="flex items-center justify-between pt-3 border-t">
                          <span className="text-sm text-muted-foreground">Total Harga</span>
                          <span className="font-bold text-primary text-lg">
                            {formatPrice(booking.total_price)}
                          </span>
                        </div>

                        {/* Review button */}
                        {canReview && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full gap-2"
                            onClick={() => openReviewDialog(booking)}
                          >
                            <Star className="w-4 h-4" />
                            Beri Ulasan untuk Perjalanan Ini
                          </Button>
                        )}

                        {/* Already reviewed indicator */}
                        {testimonials.some(t => t.booking_id === booking.id) && (
                          <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 dark:bg-green-900/20 p-2 rounded-md">
                            <CheckCircle2 className="w-4 h-4" />
                            Anda sudah memberikan ulasan untuk perjalanan ini
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Reviews Tab */}
          <TabsContent value="reviews">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2].map(i => (
                  <Card key={i}>
                    <CardContent className="pt-6 space-y-3">
                      <Skeleton className="h-6 w-32" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : testimonials.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
                    <MessageSquare className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Belum Ada Ulasan</h3>
                  <p className="text-muted-foreground mb-6">
                    Anda belum memberikan ulasan. Ulas perjalanan yang sudah terkonfirmasi!
                  </p>
                  {eligibleBookings.length > 0 && (
                    <Button onClick={() => openReviewDialog(eligibleBookings[0])}>
                      Tulis Ulasan Pertama
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {testimonials.map(testimonial => {
                  // Always show original values submitted by user
                  const displayText = testimonial.original_testimonial_text || testimonial.testimonial_text;
                  const displayRating = testimonial.original_rating || testimonial.rating;
                  
                  return (
                    <Card key={testimonial.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex gap-1">
                            {renderStars(displayRating)}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(testimonial.created_at), 'dd MMM yyyy', { locale: localeId })}
                          </span>
                        </div>
                        <p className="text-foreground mb-3">"{displayText}"</p>
                        {testimonial.route_taken && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="w-3 h-3" />
                            {testimonial.route_taken}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

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

      {/* Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tulis Ulasan</DialogTitle>
            <DialogDescription>
              {selectedBooking && (
                <>
                  Bagikan pengalaman perjalanan Anda dari {selectedBooking.route_from} ke {selectedBooking.route_to}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* User info preview */}
            <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg">
              <Avatar className="w-10 h-10">
                <AvatarImage src={userPhoto} alt={userName} />
                <AvatarFallback>{userName?.[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-sm">{userName}</p>
                <p className="text-xs text-muted-foreground">Akan ditampilkan sebagai pengulas</p>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <Label>Rating</Label>
              {renderStars(reviewForm.rating, true, (r) => setReviewForm(f => ({ ...f, rating: r })))}
            </div>

            {/* Testimonial text */}
            <div className="space-y-2">
              <Label htmlFor="testimonial">Ulasan Anda</Label>
              <Textarea
                id="testimonial"
                placeholder="Ceritakan pengalaman perjalanan Anda..."
                value={reviewForm.testimonial_text}
                onChange={(e) => setReviewForm(f => ({ ...f, testimonial_text: e.target.value }))}
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
              Batal
            </Button>
            <Button 
              onClick={submitReview} 
              disabled={isSubmitting || !reviewForm.testimonial_text.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Kirim Ulasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Profile;
