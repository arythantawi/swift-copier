import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Loader2, Search, RefreshCw, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useIdempotency } from '@/hooks/useIdempotency';
import { useAtomicBooking, BookingData } from '@/hooks/useAtomicBooking';
import TransactionIndicator from '@/components/ui/transaction-indicator';

interface Schedule {
  id: string;
  route_from: string;
  route_to: string;
  route_via: string | null;
  pickup_time: string;
  price: number;
  category: string;
}

interface OfflineBookingFormProps {
  onBookingCreated: () => void;
}

const OfflineBookingForm = ({ onBookingCreated }: OfflineBookingFormProps) => {
  const [open, setOpen] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleSearch, setScheduleSearch] = useState('');
  
  // Atomic booking and idempotency hooks
  const idempotency = useIdempotency({ 
    ttl: 5 * 60 * 1000, // 5 minutes
    storagePrefix: 'offline_booking' 
  });
  const atomicBooking = useAtomicBooking({ 
    maxRetries: 3, 
    baseDelay: 1000 
  });
  
  // Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [travelDate, setTravelDate] = useState('');
  const [passengers, setPassengers] = useState(1);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('paid');

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    // Select only required columns for schedule selection (including category for interface compliance)
    const { data, error } = await supabase
      .from('schedules')
      .select('id, route_from, route_to, route_via, pickup_time, price, category, is_active')
      .eq('is_active', true)
      .order('route_from')
      .limit(100);
    
    if (!error && data) {
      setSchedules(data);
    }
  };

  const resetForm = useCallback(() => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerEmail('');
    setSelectedScheduleId('');
    setTravelDate('');
    setPassengers(1);
    setPickupAddress('');
    setDropoffAddress('');
    setNotes('');
    setPaymentStatus('paid');
    idempotency.reset();
    atomicBooking.reset();
  }, [idempotency, atomicBooking]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerPhone.trim() || !selectedScheduleId || !travelDate || !pickupAddress.trim()) {
      toast.error('Mohon lengkapi data yang wajib diisi');
      return;
    }

    const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
    if (!selectedSchedule) {
      toast.error('Jadwal tidak ditemukan');
      return;
    }

    // Generate idempotency key based on form data
    const idempotencyKey = idempotency.generateKey({
      name: customerName,
      phone: customerPhone,
      route: `${selectedSchedule.route_from}-${selectedSchedule.route_to}`,
      date: travelDate,
      time: selectedSchedule.pickup_time,
      passengers,
      isOffline: true,
    });

    // Check idempotency - prevent double submission
    if (!idempotency.startProcessing()) {
      toast.warning('Pesanan sedang diproses, harap tunggu...');
      return;
    }

    const totalPriceCalc = selectedSchedule.price * passengers;

    // Prepare booking data for atomic transaction
    const bookingData: BookingData = {
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      customer_email: customerEmail.trim() || null,
      pickup_address: pickupAddress.trim(),
      dropoff_address: dropoffAddress.trim() || null,
      notes: notes.trim() ? `[OFFLINE] ${notes.trim()}` : '[OFFLINE]',
      route_from: selectedSchedule.route_from,
      route_to: selectedSchedule.route_to,
      route_via: selectedSchedule.route_via || null,
      pickup_time: selectedSchedule.pickup_time,
      travel_date: travelDate,
      passengers: passengers,
      total_price: totalPriceCalc,
      user_id: null, // Offline bookings don't have a user
    };

    try {
      // Execute atomic booking with retry logic
      const result = await atomicBooking.executeBooking(bookingData, idempotencyKey);

      if (result.success && result.orderId) {
        idempotency.completeProcessing();
        
        // Update payment status if different from pending
        if (paymentStatus !== 'pending' && result.orderId) {
          await supabase
            .from('bookings')
            .update({ payment_status: paymentStatus })
            .eq('order_id', result.orderId);
        }

        // Show retry info if applicable
        if (result.retryCount && result.retryCount > 0) {
          console.log(`Offline booking succeeded after ${result.retryCount} retries`);
        }

        toast.success(`Pesanan offline berhasil dibuat: ${result.orderId}`, {
          icon: <ShieldCheck className="w-5 h-5 text-green-500" />,
        });
        resetForm();
        setOpen(false);
        onBookingCreated();
      } else {
        idempotency.failProcessing();
        toast.error(result.error || 'Gagal membuat pesanan offline. Silakan coba lagi.');
      }
    } catch (error) {
      console.error('Error creating offline booking:', error);
      idempotency.failProcessing();
      toast.error('Terjadi kesalahan. Silakan coba lagi.');
    }
  }, [
    customerName, customerPhone, customerEmail, selectedScheduleId, 
    travelDate, passengers, pickupAddress, dropoffAddress, notes, 
    paymentStatus, schedules, idempotency, atomicBooking, resetForm, onBookingCreated
  ]);

  const selectedSchedule = schedules.find(s => s.id === selectedScheduleId);
  const totalPrice = selectedSchedule ? selectedSchedule.price * passengers : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatScheduleLabel = (schedule: Schedule) => {
    const route = schedule.route_via 
      ? `${schedule.route_from} → ${schedule.route_via} → ${schedule.route_to}`
      : `${schedule.route_from} → ${schedule.route_to}`;
    return `${route} (${schedule.pickup_time})`;
  };

  // Filter schedules based on search
  const filteredSchedules = schedules.filter(schedule => {
    if (!scheduleSearch.trim()) return true;
    const searchLower = scheduleSearch.toLowerCase();
    return (
      schedule.route_from.toLowerCase().includes(searchLower) ||
      schedule.route_to.toLowerCase().includes(searchLower) ||
      (schedule.route_via && schedule.route_via.toLowerCase().includes(searchLower)) ||
      schedule.pickup_time.toLowerCase().includes(searchLower) ||
      schedule.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Tambah Pesanan Offline
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Tambah Pesanan Offline</DialogTitle>
          <DialogDescription>
            Input pesanan dari pelanggan yang memesan langsung ke admin
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Nama Pelanggan *</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama lengkap"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">No. Telepon *</Label>
              <Input
                id="customerPhone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="08xxxxxxxxxx"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail">Email (Opsional)</Label>
            <Input
              id="customerEmail"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Schedule Selection with Search */}
          <div className="space-y-2">
            <Label>Pilih Jadwal *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari rute, jam, atau kategori..."
                value={scheduleSearch}
                onChange={(e) => setScheduleSearch(e.target.value)}
                className="pl-10 mb-2"
              />
            </div>
            <Select value={selectedScheduleId} onValueChange={setSelectedScheduleId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jadwal perjalanan" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {filteredSchedules.length === 0 ? (
                  <div className="py-4 text-center text-sm text-muted-foreground">
                    Jadwal tidak ditemukan
                  </div>
                ) : (
                  filteredSchedules.map((schedule) => (
                    <SelectItem key={schedule.id} value={schedule.id}>
                      <div className="flex flex-col">
                        <span>{formatScheduleLabel(schedule)}</span>
                        <span className="text-xs text-muted-foreground">
                          {schedule.category} • {formatPrice(schedule.price)}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Travel Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="travelDate">Tanggal Perjalanan *</Label>
              <Input
                id="travelDate"
                type="date"
                value={travelDate}
                onChange={(e) => setTravelDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passengers">Jumlah Penumpang *</Label>
              <Input
                id="passengers"
                type="number"
                min={1}
                max={10}
                value={passengers}
                onChange={(e) => setPassengers(parseInt(e.target.value) || 1)}
                required
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="pickupAddress">Alamat Jemput *</Label>
            <Textarea
              id="pickupAddress"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Alamat lengkap penjemputan"
              rows={2}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoffAddress">Alamat Tujuan (Opsional)</Label>
            <Textarea
              id="dropoffAddress"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
              placeholder="Alamat lengkap tujuan"
              rows={2}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan tambahan..."
              rows={2}
            />
          </div>

          {/* Payment Status */}
          <div className="space-y-2">
            <Label>Status Pembayaran</Label>
            <Select value={paymentStatus} onValueChange={setPaymentStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paid">Lunas</SelectItem>
                <SelectItem value="pending">Belum Bayar</SelectItem>
                <SelectItem value="waiting_verification">Menunggu Verifikasi</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Total Price Display */}
          {selectedSchedule && (
            <div className="p-4 bg-muted rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Harga per orang:</span>
                <span>{formatPrice(selectedSchedule.price)}</span>
              </div>
              <div className="flex justify-between items-center text-lg font-bold mt-2">
                <span>Total ({passengers} orang):</span>
                <span className="text-accent">{formatPrice(totalPrice)}</span>
              </div>
            </div>
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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={atomicBooking.isTransacting}>
              Batal
            </Button>
            <Button type="submit" disabled={atomicBooking.isTransacting || idempotency.isLocked}>
              {atomicBooking.isTransacting ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {atomicBooking.retryCount > 0 
                    ? `Mencoba ulang (${atomicBooking.retryCount})...` 
                    : 'Memproses...'}
                </span>
              ) : 'Simpan Pesanan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default OfflineBookingForm;
