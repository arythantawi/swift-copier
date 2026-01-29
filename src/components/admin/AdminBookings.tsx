import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealtimeBookings, Booking } from '@/hooks/useRealtimeBookings';
import { 
  Search, 
  RefreshCw, 
  Check, 
  X, 
  ExternalLink, 
  Calendar, 
  Users, 
  MapPin, 
  Phone,
  Clock,
  Filter,
  MessageCircle,
  Trash2,
  Eye,
  Zap
} from 'lucide-react';
import OfflineBookingForm from './OfflineBookingForm';
import { generateTicketPdf } from '@/lib/generateTicketPdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from 'sonner';

interface AdminBookingsProps {
  onStatsUpdate: (stats: {
    total: number;
    pending: number;
    waitingVerification: number;
    paid: number;
  }) => void;
}

const AdminBookings = ({ onStatsUpdate }: AdminBookingsProps) => {
  const { bookings, isLoading, refetch, stats } = useRealtimeBookings(500);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [specificDate, setSpecificDate] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Update parent stats when bookings change
  useEffect(() => {
    onStatsUpdate({
      total: stats.total,
      pending: stats.pending,
      waitingVerification: stats.waitingVerification,
      paid: stats.paid,
    });
  }, [stats, onStatsUpdate]);

  const updatePaymentStatus = async (orderId: string, newStatus: string, autoSendWhatsApp: boolean = true) => {
    setIsUpdating(orderId);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ payment_status: newStatus })
        .eq('order_id', orderId);

      if (error) throw error;
      
      toast.success(`Status berhasil diubah ke ${getStatusLabel(newStatus)}`);
      
      // Auto send WhatsApp ticket when payment is confirmed
      if (newStatus === 'paid' && autoSendWhatsApp) {
        const booking = bookings.find(b => b.order_id === orderId);
        if (booking) {
          toast.loading('Mengirim tiket ke WhatsApp...', { id: `wa-${orderId}` });
          try {
            await sendWhatsAppTicket(booking);
            toast.success('Tiket berhasil dikirim via WhatsApp!', { id: `wa-${orderId}` });
          } catch (waError) {
            console.error('Failed to send WhatsApp ticket:', waError);
            toast.error('Gagal mengirim tiket WhatsApp. Anda bisa kirim manual.', { id: `wa-${orderId}` });
          }
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Gagal mengubah status');
    } finally {
      setIsUpdating(null);
    }
  };

  const sendWhatsAppTicket = async (booking: Booking) => {
    // Generate PDF as base64
    const doc = await generateTicketPdf({
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
      paymentStatus: 'paid',
    }, { returnBlob: true });
    
    if (!doc) {
      throw new Error('Failed to generate PDF');
    }
    
    // Convert PDF to base64
    const pdfBase64 = doc.output('datauristring').split(',')[1];
    
    // Call edge function to send WhatsApp
    const { data, error } = await supabase.functions.invoke('send-whatsapp-ticket', {
      body: {
        booking: {
          order_id: booking.order_id,
          customer_name: booking.customer_name,
          customer_phone: booking.customer_phone,
          customer_email: booking.customer_email,
          route_from: booking.route_from,
          route_to: booking.route_to,
          route_via: booking.route_via,
          travel_date: booking.travel_date,
          pickup_time: booking.pickup_time,
          pickup_address: booking.pickup_address,
          dropoff_address: booking.dropoff_address,
          passengers: booking.passengers,
          total_price: booking.total_price,
          notes: booking.notes,
        },
        ticketBase64: pdfBase64,
      },
    });
    
    if (error) {
      throw error;
    }
    
    if (!data?.success) {
      throw new Error(data?.error || 'Failed to send WhatsApp');
    }
    
    return data;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu Pembayaran';
      case 'waiting_verification': return 'Menunggu Verifikasi';
      case 'paid': return 'Lunas';
      case 'cancelled': return 'Dibatalkan';
      default: return status;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Menunggu Pembayaran</Badge>;
      case 'waiting_verification':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Menunggu Verifikasi</Badge>;
      case 'paid':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Lunas</Badge>;
      case 'cancelled':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Dibatalkan</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatPhoneForWhatsApp = (phone: string) => {
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '62' + cleaned.slice(1);
    }
    return cleaned;
  };

  const generateWhatsAppMessage = (booking: Booking) => {
    const formattedPrice = formatPrice(booking.total_price);
    const formattedDate = formatDate(booking.travel_date);
    const route = booking.route_via 
      ? `${booking.route_from} → ${booking.route_via} → ${booking.route_to}`
      : `${booking.route_from} → ${booking.route_to}`;

    let message = `Halo ${booking.customer_name},

Terima kasih telah memesan travel di *Obie Travel*.

*🎫 TIKET PERJALANAN ANDA*
━━━━━━━━━━━━━━━
📋 Order ID: ${booking.order_id}
🛤️ Rute: ${route}
📅 Tanggal: ${formattedDate}
⏰ Jam Jemput: ${booking.pickup_time}
📍 Alamat Jemput: ${booking.pickup_address}`;

    if (booking.dropoff_address) {
      message += `
🎯 Alamat Antar: ${booking.dropoff_address}`;
    }

    message += `
👥 Jumlah Penumpang: ${booking.passengers}
💰 Total: ${formattedPrice}
━━━━━━━━━━━━━━━
✅ Status: *LUNAS*

📎 *Tiket PDF terlampir di bawah pesan ini.*
Mohon simpan tiket ini dan tunjukkan saat penjemputan.
Terima kasih! 🙏`;

    return message;
  };

  const handleSendTicketWhatsApp = async (booking: Booking) => {
    toast.loading('Mengirim tiket ke WhatsApp...', { id: `wa-manual-${booking.order_id}` });
    try {
      await sendWhatsAppTicket(booking);
      toast.success('Tiket berhasil dikirim via WhatsApp!', { id: `wa-manual-${booking.order_id}` });
    } catch (error) {
      console.error('Failed to send WhatsApp via API:', error);
      toast.error('Gagal kirim via API. Membuka WhatsApp manual...', { id: `wa-manual-${booking.order_id}` });
      
      // Fallback to manual WhatsApp
      const doc = await generateTicketPdf({
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
        passengers: booking.passengers,
        totalPrice: booking.total_price,
        notes: booking.notes,
        paymentStatus: 'paid',
      }, { returnBlob: true });
      
      if (doc) {
        doc.save(`Tiket-${booking.order_id}.pdf`);
        
        const phone = formatPhoneForWhatsApp(booking.customer_phone);
        const message = encodeURIComponent(generateWhatsAppMessage(booking));
        
        setTimeout(() => {
          window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
        }, 500);
        
        toast.info('Tiket PDF telah diunduh. Silakan lampirkan ke chat WhatsApp.');
      }
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.customer_phone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || booking.payment_status === statusFilter;
    
    // Date filter
    let matchesDate = true;
    const bookingDate = new Date(booking.travel_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (dateFilter === 'today') {
      const bookingDateOnly = new Date(bookingDate);
      bookingDateOnly.setHours(0, 0, 0, 0);
      matchesDate = bookingDateOnly.getTime() === today.getTime();
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAhead = new Date(today);
      weekAhead.setDate(weekAhead.getDate() + 7);
      matchesDate = bookingDate >= weekAgo && bookingDate <= weekAhead;
    } else if (dateFilter === 'month') {
      matchesDate = bookingDate.getMonth() === today.getMonth() && 
                    bookingDate.getFullYear() === today.getFullYear();
    } else if (dateFilter === 'specific' && specificDate) {
      const selectedDate = new Date(specificDate);
      selectedDate.setHours(0, 0, 0, 0);
      const bookingDateOnly = new Date(bookingDate);
      bookingDateOnly.setHours(0, 0, 0, 0);
      matchesDate = bookingDateOnly.getTime() === selectedDate.getTime();
    } else if (dateFilter === 'range') {
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && bookingDate >= fromDate;
      }
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && bookingDate <= toDate;
      }
    }
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      {/* Header with Offline Booking Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Daftar Pesanan</h2>
          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 flex items-center gap-1">
            <Zap className="w-3 h-3" />
            Real-time
          </Badge>
        </div>
        <OfflineBookingForm onBookingCreated={refetch} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari Order ID, nama, atau telepon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu Pembayaran</SelectItem>
                <SelectItem value="waiting_verification">Menunggu Verifikasi</SelectItem>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="cancelled">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={refetch} variant="outline" size="icon">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Date Filter */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter tanggal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tanggal</SelectItem>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="specific">Pilih Tanggal</SelectItem>
                <SelectItem value="range">Rentang Tanggal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {dateFilter === 'specific' && (
            <Input
              type="date"
              value={specificDate}
              onChange={(e) => setSpecificDate(e.target.value)}
              className="w-[180px]"
            />
          )}

          {dateFilter === 'range' && (
            <div className="flex items-center gap-2">
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[150px]"
                placeholder="Dari"
              />
              <span className="text-muted-foreground">-</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[150px]"
                placeholder="Sampai"
              />
            </div>
          )}

          {(dateFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                setDateFilter('all');
                setStatusFilter('all');
                setSearchTerm('');
                setSpecificDate('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              Reset Filter
            </Button>
          )}
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Tidak ada data pemesanan</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking) => (
            <div key={booking.id} className="bg-card rounded-xl border border-border p-6">
              <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                {/* Left: Order Info */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Order ID</p>
                      <p className="font-mono font-bold text-foreground">{booking.order_id}</p>
                    </div>
                    {getStatusBadge(booking.payment_status)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{booking.customer_name}</p>
                          <p className="text-sm text-muted-foreground">{booking.passengers} penumpang</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <a href={`tel:${booking.customer_phone}`} className="text-primary hover:underline">
                          {booking.customer_phone}
                        </a>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">
                          {booking.route_from} → {booking.route_via && `${booking.route_via} → `}{booking.route_to}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">{formatDate(booking.travel_date)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground">Jemput: {booking.pickup_time}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="text-xl font-bold text-accent">{formatPrice(booking.total_price)}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Dibuat: {formatDateTime(booking.created_at)}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="lg:w-56 space-y-2 lg:border-l lg:border-border lg:pl-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full" onClick={() => setSelectedBooking(booking)}>
                        <Eye className="w-4 h-4 mr-2" />
                        Detail
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Detail Pesanan</DialogTitle>
                        <DialogDescription>
                          {selectedBooking?.order_id}
                        </DialogDescription>
                      </DialogHeader>
                      {selectedBooking && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Nama</p>
                              <p className="font-medium">{selectedBooking.customer_name}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Telepon</p>
                              <p className="font-medium">{selectedBooking.customer_phone}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Email</p>
                              <p className="font-medium">{selectedBooking.customer_email || '-'}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Penumpang</p>
                              <p className="font-medium">{selectedBooking.passengers}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Rute</p>
                              <p className="font-medium">
                                {selectedBooking.route_from} → {selectedBooking.route_via && `${selectedBooking.route_via} → `}{selectedBooking.route_to}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Tanggal</p>
                              <p className="font-medium">{formatDate(selectedBooking.travel_date)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Jam Jemput</p>
                              <p className="font-medium">{selectedBooking.pickup_time}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-muted-foreground">Alamat Jemput</p>
                              <p className="font-medium">{selectedBooking.pickup_address}</p>
                            </div>
                            {selectedBooking.dropoff_address && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Alamat Pengantaran</p>
                                <p className="font-medium">{selectedBooking.dropoff_address}</p>
                              </div>
                            )}
                            {selectedBooking.notes && (
                              <div className="col-span-2">
                                <p className="text-muted-foreground">Catatan</p>
                                <p className="font-medium">{selectedBooking.notes}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-muted-foreground">Total</p>
                              <p className="font-bold text-accent">{formatPrice(selectedBooking.total_price)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Status</p>
                              {getStatusBadge(selectedBooking.payment_status)}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>

                  {booking.payment_proof_url && (
                    <a
                      href={booking.payment_proof_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 text-foreground rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Bukti Transfer
                    </a>
                  )}

                  {booking.payment_status === 'waiting_verification' && (
                    <>
                      <Button
                        onClick={() => updatePaymentStatus(booking.order_id, 'paid')}
                        disabled={isUpdating === booking.order_id}
                        className="w-full bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Verifikasi
                      </Button>
                      <Button
                        onClick={() => updatePaymentStatus(booking.order_id, 'pending')}
                        disabled={isUpdating === booking.order_id}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Tolak
                      </Button>
                    </>
                  )}

                  {booking.payment_status === 'pending' && (
                    <Button
                      onClick={() => updatePaymentStatus(booking.order_id, 'cancelled')}
                      disabled={isUpdating === booking.order_id}
                      variant="destructive"
                      size="sm"
                      className="w-full"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Batalkan
                    </Button>
                  )}

                  {booking.payment_status === 'paid' && (
                    <Button
                      onClick={() => handleSendTicketWhatsApp(booking)}
                      className="w-full"
                      size="sm"
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Kirim Tiket
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
