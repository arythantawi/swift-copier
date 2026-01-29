import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  RefreshCw,
  Calendar,
  MapPin,
  Users,
  FileDown,
  Clock,
  Phone,
  Car,
  User,
  Package,
  Luggage,
  AlertCircle,
  Send,
  CheckCircle2,
  Edit,
  GripVertical,
  Trash2,
  Plus
} from 'lucide-react';
import { generateManifestPdf, ManifestData, ManifestPassenger } from '@/lib/generateManifestPdf';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Booking {
  id: string;
  order_id: string;
  customer_name: string;
  customer_phone: string;
  pickup_address: string;
  dropoff_address: string | null;
  notes: string | null;
  route_from: string;
  route_to: string;
  route_via: string | null;
  pickup_time: string;
  travel_date: string;
  passengers: number;
  total_price: number;
  payment_status: string;
  has_large_luggage: boolean | null;
  luggage_description: string | null;
  has_package_delivery: boolean | null;
  package_description: string | null;
  special_requests: string | null;
}

interface TripOperation {
  id: string;
  trip_date: string;
  route_from: string;
  route_to: string;
  route_via: string | null;
  pickup_time: string;
  driver_name: string | null;
  driver_phone: string | null;
  vehicle_number: string | null;
}

interface EditablePassenger extends ManifestPassenger {
  id: string;
  isEditing?: boolean;
}

const AdminManifest = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tripOperations, setTripOperations] = useState<TripOperation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dateFilter, setDateFilter] = useState<string>(new Date().toISOString().split('T')[0]);
  const [routeFilter, setRouteFilter] = useState<string>('all');
  const [isManifestDialogOpen, setIsManifestDialogOpen] = useState(false);
  const [selectedBookingsGroup, setSelectedBookingsGroup] = useState<Booking[]>([]);
  const [manifestConfig, setManifestConfig] = useState({
    agentName: 'Obie Travel',
    driverName: '',
    driverPhone: '',
    vehicleNumber: '',
  });
  
  // Edit manifest state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editablePassengers, setEditablePassengers] = useState<EditablePassenger[]>([]);
  const [editingPassengerId, setEditingPassengerId] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .neq('payment_status', 'cancelled')
        .order('pickup_time', { ascending: true });

      if (bookingsError) throw bookingsError;
      setBookings((bookingsData || []) as Booking[]);

      const { data: tripsData, error: tripsError } = await supabase
        .from('trip_operations')
        .select('id, trip_date, route_from, route_to, route_via, pickup_time, driver_name, driver_phone, vehicle_number')
        .order('trip_date', { ascending: false });

      if (tripsError) throw tripsError;
      setTripOperations((tripsData || []) as TripOperation[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getAvailableDates = () => {
    const dates = new Set(bookings.map(b => b.travel_date));
    return Array.from(dates).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  };

  const getAvailableRoutes = () => {
    const routes = new Set(
      bookings
        .filter(b => b.travel_date === dateFilter)
        .map(b => `${b.route_from}-${b.route_to}`)
    );
    return Array.from(routes);
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesDate = booking.travel_date === dateFilter;
    const matchesRoute = routeFilter === 'all' || 
      `${booking.route_from}-${booking.route_to}` === routeFilter;
    return matchesDate && matchesRoute;
  });

  const groupedBookings = filteredBookings.reduce((acc, booking) => {
    const key = `${booking.pickup_time}-${booking.route_from}-${booking.route_via || ''}-${booking.route_to}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(booking);
    return acc;
  }, {} as Record<string, Booking[]>);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Lunas</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Belum Bayar</Badge>;
      case 'waiting_verification':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">Verifikasi</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Convert bookings to editable passengers
  const convertToEditablePassengers = (bookingsGroup: Booking[]): EditablePassenger[] => {
    return bookingsGroup.map(booking => ({
      id: booking.id,
      name: booking.customer_name,
      phone: booking.customer_phone,
      pickupAddress: booking.pickup_address,
      dropoffAddress: booking.dropoff_address,
      passengers: booking.passengers,
      notes: booking.notes,
      hasLargeLuggage: booking.has_large_luggage || false,
      luggageDescription: booking.luggage_description,
      hasPackageDelivery: booking.has_package_delivery || false,
      packageDescription: booking.package_description,
      specialRequests: booking.special_requests,
      paymentStatus: booking.payment_status,
    }));
  };

  const handleOpenManifestDialog = (bookingsGroup: Booking[]) => {
    if (bookingsGroup.length === 0) return;

    const firstBooking = bookingsGroup[0];
    
    const matchingTrip = tripOperations.find(trip => 
      trip.trip_date === firstBooking.travel_date &&
      trip.route_from === firstBooking.route_from &&
      trip.route_to === firstBooking.route_to &&
      trip.pickup_time === firstBooking.pickup_time
    );

    setManifestConfig({
      agentName: 'Obie Travel',
      driverName: matchingTrip?.driver_name || '',
      driverPhone: matchingTrip?.driver_phone || '',
      vehicleNumber: matchingTrip?.vehicle_number || '',
    });

    setSelectedBookingsGroup(bookingsGroup);
    setEditablePassengers(convertToEditablePassengers(bookingsGroup));
    setIsEditMode(false);
    setEditingPassengerId(null);
    setIsManifestDialogOpen(true);
  };

  const isTripProcessed = (bookingsGroup: Booking[]) => {
    if (bookingsGroup.length === 0) return false;
    const firstBooking = bookingsGroup[0];
    return tripOperations.some(trip => 
      trip.trip_date === firstBooking.travel_date &&
      trip.route_from === firstBooking.route_from &&
      trip.route_to === firstBooking.route_to &&
      trip.pickup_time === firstBooking.pickup_time
    );
  };

  const getMatchingTripOperation = (bookingsGroup: Booking[]) => {
    if (bookingsGroup.length === 0) return null;
    const firstBooking = bookingsGroup[0];
    return tripOperations.find(trip => 
      trip.trip_date === firstBooking.travel_date &&
      trip.route_from === firstBooking.route_from &&
      trip.route_to === firstBooking.route_to &&
      trip.pickup_time === firstBooking.pickup_time
    ) || null;
  };

  const hasBookingChanges = (bookingsGroup: Booking[]) => {
    const matchingTrip = getMatchingTripOperation(bookingsGroup);
    if (!matchingTrip) return false;
    return true;
  };

  const handleProcessToOperations = async (bookingsGroup: Booking[], isUpdate: boolean = false) => {
    if (bookingsGroup.length === 0) return;

    const firstBooking = bookingsGroup[0];
    const existingTrip = getMatchingTripOperation(bookingsGroup);
    
    if (!isUpdate && existingTrip) {
      toast.error('Trip ini sudah ada di data operasional');
      return;
    }

    setIsProcessing(true);
    try {
      const totalPassengers = bookingsGroup.reduce((sum, b) => sum + b.passengers, 0);
      const paidBookings = bookingsGroup.filter(b => b.payment_status === 'paid');
      const incomeTickets = paidBookings.reduce((sum, b) => sum + b.total_price, 0);

      if (isUpdate && existingTrip) {
        const updateData = {
          total_passengers: totalPassengers,
          income_tickets: incomeTickets,
          notes: `Update dari manifest. ${bookingsGroup.length} booking, ${paidBookings.length} lunas.`,
        };

        const { error } = await supabase
          .from('trip_operations')
          .update(updateData)
          .eq('id', existingTrip.id);

        if (error) throw error;
        
        toast.success('Data operasional berhasil diperbarui');
      } else {
        const tripData = {
          trip_date: firstBooking.travel_date,
          route_from: firstBooking.route_from,
          route_to: firstBooking.route_to,
          route_via: firstBooking.route_via || null,
          pickup_time: firstBooking.pickup_time,
          total_passengers: totalPassengers,
          income_tickets: incomeTickets,
          income_other: 0,
          expense_fuel: 0,
          expense_ferry: 0,
          expense_snack: 0,
          expense_meals: 0,
          expense_driver_commission: Math.round(incomeTickets * 0.15),
          expense_driver_meals: 0,
          expense_toll: 0,
          expense_parking: 0,
          expense_other: 0,
          driver_name: manifestConfig.driverName || null,
          driver_phone: manifestConfig.driverPhone || null,
          vehicle_number: manifestConfig.vehicleNumber || null,
          notes: `Auto-generated dari manifest. ${bookingsGroup.length} booking, ${paidBookings.length} lunas.`,
        };

        const { error } = await supabase
          .from('trip_operations')
          .insert([tripData]);

        if (error) throw error;
        
        toast.success('Data berhasil dikirim ke Operasional');
      }
      
      fetchData();
    } catch (error) {
      console.error('Error processing to operations:', error);
      toast.error('Gagal menyimpan data operasional');
    } finally {
      setIsProcessing(false);
    }
  };

  // Update passenger in editable list
  const updateEditablePassenger = (id: string, field: keyof EditablePassenger, value: any) => {
    setEditablePassengers(prev => 
      prev.map(p => p.id === id ? { ...p, [field]: value } : p)
    );
  };

  // Move passenger up/down
  const movePassenger = (index: number, direction: 'up' | 'down') => {
    const newList = [...editablePassengers];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newList.length) return;
    
    [newList[index], newList[targetIndex]] = [newList[targetIndex], newList[index]];
    setEditablePassengers(newList);
  };

  // Remove passenger from manifest (temporary, not from database)
  const removePassengerFromManifest = (id: string) => {
    setEditablePassengers(prev => prev.filter(p => p.id !== id));
  };

  // Add manual passenger
  const addManualPassenger = () => {
    const newPassenger: EditablePassenger = {
      id: `manual-${Date.now()}`,
      name: '',
      phone: '',
      pickupAddress: '',
      dropoffAddress: null,
      passengers: 1,
      notes: null,
      hasLargeLuggage: false,
      luggageDescription: null,
      hasPackageDelivery: false,
      packageDescription: null,
      specialRequests: null,
      paymentStatus: 'pending',
      isEditing: true,
    };
    setEditablePassengers(prev => [...prev, newPassenger]);
    setEditingPassengerId(newPassenger.id);
  };

  const handleGenerateManifest = async () => {
    if (editablePassengers.length === 0) {
      toast.error('Tidak ada penumpang untuk dicetak');
      return;
    }

    const firstBooking = selectedBookingsGroup[0];

    const passengers: ManifestPassenger[] = editablePassengers.map(p => ({
      name: p.name,
      phone: p.phone,
      pickupAddress: p.pickupAddress,
      dropoffAddress: p.dropoffAddress,
      passengers: p.passengers,
      notes: p.notes,
      hasLargeLuggage: p.hasLargeLuggage,
      luggageDescription: p.luggageDescription,
      hasPackageDelivery: p.hasPackageDelivery,
      packageDescription: p.packageDescription,
      specialRequests: p.specialRequests,
      paymentStatus: p.paymentStatus,
    }));

    const manifestData: ManifestData = {
      agentName: manifestConfig.agentName,
      tripDate: firstBooking.travel_date,
      pickupTime: firstBooking.pickup_time,
      routeFrom: firstBooking.route_from,
      routeTo: firstBooking.route_to,
      routeVia: firstBooking.route_via,
      vehicleNumber: manifestConfig.vehicleNumber || null,
      driverName: manifestConfig.driverName || null,
      driverPhone: manifestConfig.driverPhone || null,
      passengers,
    };

    await generateManifestPdf(manifestData);
    setIsManifestDialogOpen(false);
    toast.success('Manifes berhasil diunduh');
  };

  const getTotalPassengers = (bookingsGroup: Booking[]) => {
    return bookingsGroup.reduce((sum, b) => sum + b.passengers, 0);
  };

  const getPaidCount = (bookingsGroup: Booking[]) => {
    return bookingsGroup.filter(b => b.payment_status === 'paid').length;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Tanggal</Label>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                setRouteFilter('all');
              }}
              className="w-[180px]"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rute</Label>
            <Select value={routeFilter} onValueChange={setRouteFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Pilih rute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Rute</SelectItem>
                {getAvailableRoutes().map(route => (
                  <SelectItem key={route} value={route}>
                    {route.replace('-', ' → ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-end">
          <Button onClick={fetchData} variant="outline" size="icon">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Tanggal</p>
          </div>
          <p className="text-lg font-semibold text-foreground">
            {formatDate(dateFilter).split(',')[0]}
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Car className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Trip</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {Object.keys(groupedBookings).length}
          </p>
        </div>
        <div className="bg-card rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-sm text-muted-foreground">Total Penumpang</p>
          </div>
          <p className="text-2xl font-bold text-foreground">
            {filteredBookings.reduce((sum, b) => sum + b.passengers, 0)}
          </p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-5 h-5 text-green-600" />
            <p className="text-sm text-green-700 dark:text-green-400">Lunas</p>
          </div>
          <p className="text-2xl font-bold text-green-800 dark:text-green-300">
            {filteredBookings.filter(b => b.payment_status === 'paid').length}/{filteredBookings.length}
          </p>
        </div>
      </div>

      {/* Trips List */}
      {isLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-primary mb-4" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      ) : Object.keys(groupedBookings).length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Tidak ada data perjalanan untuk tanggal ini</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedBookings).map(([key, bookingsGroup]) => {
            const firstBooking = bookingsGroup[0];
            const route = firstBooking.route_via 
              ? `${firstBooking.route_from} → ${firstBooking.route_via} → ${firstBooking.route_to}`
              : `${firstBooking.route_from} → ${firstBooking.route_to}`;

            return (
              <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Trip Header */}
                <div className="bg-primary/5 dark:bg-primary/10 p-4 border-b border-border">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-primary" />
                        <span className="text-xl font-bold text-foreground">{firstBooking.pickup_time}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-foreground font-medium">{route}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Penumpang</p>
                        <p className="text-lg font-bold text-foreground">{getTotalPassengers(bookingsGroup)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Lunas</p>
                        <p className="text-lg font-bold text-green-600">{getPaidCount(bookingsGroup)}/{bookingsGroup.length}</p>
                      </div>
                      <div className="flex gap-2">
                        {isTripProcessed(bookingsGroup) ? (
                          <>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 gap-1 py-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Diproses
                            </Badge>
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => handleProcessToOperations(bookingsGroup, true)}
                              disabled={isProcessing}
                            >
                              <RefreshCw className={`w-4 h-4 mr-1 ${isProcessing ? 'animate-spin' : ''}`} />
                              Update
                            </Button>
                          </>
                        ) : (
                          <Button 
                            variant="outline" 
                            onClick={() => handleProcessToOperations(bookingsGroup, false)}
                            disabled={isProcessing}
                          >
                            <Send className="w-4 h-4 mr-2" />
                            {isProcessing ? 'Memproses...' : 'Proses'}
                          </Button>
                        )}
                        <Button onClick={() => handleOpenManifestDialog(bookingsGroup)}>
                          <FileDown className="w-4 h-4 mr-2" />
                          Cetak
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Passengers List */}
                <div className="divide-y divide-border">
                  {bookingsGroup.map((booking, index) => (
                    <div key={booking.id} className="p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground">{booking.customer_name}</p>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                <span>{booking.customer_phone}</span>
                                <span>•</span>
                                <Users className="w-3 h-3" />
                                <span>{booking.passengers} orang</span>
                              </div>
                            </div>
                            {getPaymentBadge(booking.payment_status)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                              <div>
                                <p className="text-xs text-muted-foreground">Jemput</p>
                                <p className="text-foreground">{booking.pickup_address}</p>
                              </div>
                            </div>
                            {booking.dropoff_address && (
                              <div className="flex items-start gap-2">
                                <MapPin className="w-4 h-4 text-red-600 mt-0.5" />
                                <div>
                                  <p className="text-xs text-muted-foreground">Antar</p>
                                  <p className="text-foreground">{booking.dropoff_address}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Special Info */}
                          <div className="flex flex-wrap gap-2">
                            {booking.has_large_luggage && (
                              <Badge variant="outline" className="gap-1">
                                <Luggage className="w-3 h-3" />
                                Barang Besar
                                {booking.luggage_description && `: ${booking.luggage_description}`}
                              </Badge>
                            )}
                            {booking.has_package_delivery && (
                              <Badge variant="outline" className="gap-1">
                                <Package className="w-3 h-3" />
                                Titipan
                                {booking.package_description && `: ${booking.package_description}`}
                              </Badge>
                            )}
                            {booking.special_requests && (
                              <Badge variant="outline" className="gap-1 text-orange-600 border-orange-300">
                                <AlertCircle className="w-3 h-3" />
                                {booking.special_requests}
                              </Badge>
                            )}
                            {booking.notes && (
                              <Badge variant="secondary" className="gap-1">
                                📝 {booking.notes}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manifest Config & Edit Dialog */}
      <Dialog open={isManifestDialogOpen} onOpenChange={setIsManifestDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileDown className="w-5 h-5" />
              Cetak Manifes
            </DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Edit data penumpang sebelum mencetak manifes' : 'Lengkapi data sopir dan armada untuk manifes'}
            </DialogDescription>
          </DialogHeader>

          {/* Trip & Agent Config */}
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="agentName">Nama Agent Travel</Label>
                <Input
                  id="agentName"
                  value={manifestConfig.agentName}
                  onChange={(e) => setManifestConfig({ ...manifestConfig, agentName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vehicleNumber">Nomor Plat / Armada</Label>
                <Input
                  id="vehicleNumber"
                  value={manifestConfig.vehicleNumber}
                  onChange={(e) => setManifestConfig({ ...manifestConfig, vehicleNumber: e.target.value })}
                  placeholder="N 1234 AB"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="driverName">Nama Sopir</Label>
                <Input
                  id="driverName"
                  value={manifestConfig.driverName}
                  onChange={(e) => setManifestConfig({ ...manifestConfig, driverName: e.target.value })}
                  placeholder="Masukkan nama sopir"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="driverPhone">HP Sopir</Label>
                <Input
                  id="driverPhone"
                  value={manifestConfig.driverPhone}
                  onChange={(e) => setManifestConfig({ ...manifestConfig, driverPhone: e.target.value })}
                  placeholder="08xxxxxxxxxx"
                />
              </div>
            </div>
          </div>

          {/* Toggle Edit Mode */}
          <div className="flex items-center justify-between border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Mode Edit Penumpang</span>
              <Badge variant={isEditMode ? "default" : "secondary"}>
                {editablePassengers.length} penumpang
              </Badge>
            </div>
            <Button
              variant={isEditMode ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
            >
              <Edit className="w-4 h-4 mr-2" />
              {isEditMode ? 'Selesai Edit' : 'Edit Manifest'}
            </Button>
          </div>

          {/* Editable Passengers Table */}
          {isEditMode && (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Telp</TableHead>
                    <TableHead className="w-12">Pax</TableHead>
                    <TableHead>Alamat Jemput</TableHead>
                    <TableHead>Alamat Tujuan</TableHead>
                    <TableHead className="w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {editablePassengers.map((passenger, index) => (
                    <TableRow key={passenger.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        {editingPassengerId === passenger.id ? (
                          <Input
                            value={passenger.name}
                            onChange={(e) => updateEditablePassenger(passenger.id, 'name', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium">{passenger.name}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPassengerId === passenger.id ? (
                          <Input
                            value={passenger.phone}
                            onChange={(e) => updateEditablePassenger(passenger.id, 'phone', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          passenger.phone
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPassengerId === passenger.id ? (
                          <Input
                            type="number"
                            value={passenger.passengers}
                            onChange={(e) => updateEditablePassenger(passenger.id, 'passengers', parseInt(e.target.value) || 1)}
                            className="h-8 w-14"
                            min={1}
                          />
                        ) : (
                          passenger.passengers
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPassengerId === passenger.id ? (
                          <Input
                            value={passenger.pickupAddress}
                            onChange={(e) => updateEditablePassenger(passenger.id, 'pickupAddress', e.target.value)}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm">{passenger.pickupAddress}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {editingPassengerId === passenger.id ? (
                          <Input
                            value={passenger.dropoffAddress || ''}
                            onChange={(e) => updateEditablePassenger(passenger.id, 'dropoffAddress', e.target.value || null)}
                            className="h-8"
                          />
                        ) : (
                          <span className="text-sm">{passenger.dropoffAddress || '-'}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {editingPassengerId === passenger.id ? (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingPassengerId(null)}
                            >
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingPassengerId(passenger.id)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => movePassenger(index, 'up')}
                                disabled={index === 0}
                              >
                                <GripVertical className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removePassengerFromManifest(passenger.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="p-2 border-t bg-muted/50">
                <Button variant="outline" size="sm" onClick={addManualPassenger}>
                  <Plus className="w-4 h-4 mr-2" />
                  Tambah Manual
                </Button>
              </div>
            </div>
          )}

          {/* Quick Preview (non-edit mode) */}
          {!isEditMode && (
            <div className="border rounded-lg p-3 bg-muted/30 max-h-40 overflow-y-auto">
              <p className="text-xs text-muted-foreground mb-2">Preview Penumpang:</p>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {editablePassengers.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-1">
                    <span className="font-medium">{i + 1}.</span>
                    <span>{p.name}</span>
                    <span className="text-muted-foreground">({p.passengers})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 flex-wrap">
            <Button variant="outline" onClick={() => setIsManifestDialogOpen(false)}>
              Batal
            </Button>
            {isTripProcessed(selectedBookingsGroup) ? (
              <Button 
                variant="secondary"
                onClick={() => {
                  handleProcessToOperations(selectedBookingsGroup, true);
                  setIsManifestDialogOpen(false);
                }}
                disabled={isProcessing}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isProcessing ? 'animate-spin' : ''}`} />
                Update Operasional
              </Button>
            ) : (
              <Button 
                variant="secondary"
                onClick={() => {
                  handleProcessToOperations(selectedBookingsGroup, false);
                  setIsManifestDialogOpen(false);
                }}
                disabled={isProcessing}
              >
                <Send className="w-4 h-4 mr-2" />
                Proses ke Operasional
              </Button>
            )}
            <Button onClick={handleGenerateManifest}>
              <FileDown className="w-4 h-4 mr-2" />
              Unduh PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminManifest;
