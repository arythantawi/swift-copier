import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Plus, Pencil, Trash2, RefreshCw, Upload, Car, Loader2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface FleetVehicle {
  id: string;
  name: string;
  capacity: string;
  image_url: string | null;
  image_drive_id: string | null;
  description: string | null;
  display_order: number;
  is_active: boolean;
}

const AdminFleet = () => {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<FleetVehicle | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [form, setForm] = useState({
    name: '', capacity: '', image_url: '', description: '', display_order: 0, is_active: true
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const fetchVehicles = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('fleet_vehicles')
      .select('*')
      .order('display_order');
    if (!error) setVehicles(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openDialog = (vehicle?: FleetVehicle) => {
    if (vehicle) {
      setEditing(vehicle);
      setForm({
        name: vehicle.name,
        capacity: vehicle.capacity,
        image_url: vehicle.image_url || '',
        description: vehicle.description || '',
        display_order: vehicle.display_order,
        is_active: vehicle.is_active,
      });
      setImagePreview(vehicle.image_url);
    } else {
      setEditing(null);
      setForm({ name: '', capacity: '', image_url: '', description: '', display_order: 0, is_active: true });
      setImagePreview(null);
    }
    setImageFile(null);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maks 5MB');
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImage = async (vehicleId?: string): Promise<string | null> => {
    if (!imageFile) return form.image_url || null;
    setIsUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', imageFile);
      if (vehicleId) formData.append('vehicleId', vehicleId);

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-fleet-image`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          body: formData,
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);
      return result.imageUrl;
    } catch (error: any) {
      toast.error(error.message || 'Gagal upload gambar');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const save = async () => {
    if (!form.name || !form.capacity) {
      toast.error('Nama dan kapasitas wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      let imageUrl = form.image_url || null;

      if (editing) {
        if (imageFile) {
          imageUrl = await uploadImage(editing.id);
          if (!imageUrl && imageFile) { setIsSaving(false); return; }
        }
        const { error } = await supabase.from('fleet_vehicles').update({
          name: form.name, capacity: form.capacity, image_url: imageUrl,
          description: form.description || null, display_order: form.display_order, is_active: form.is_active,
        }).eq('id', editing.id);
        if (error) throw error;
        toast.success('Armada berhasil diperbarui');
      } else {
        // Insert first to get ID, then upload image
        const { data: newVehicle, error } = await supabase.from('fleet_vehicles').insert([{
          name: form.name, capacity: form.capacity, image_url: null,
          description: form.description || null, display_order: form.display_order, is_active: form.is_active,
        }]).select().single();
        if (error) throw error;
        
        if (imageFile && newVehicle) {
          imageUrl = await uploadImage(newVehicle.id);
        }
        toast.success('Armada berhasil ditambahkan');
      }
      setDialogOpen(false);
      fetchVehicles();
    } catch (error) {
      toast.error('Gagal menyimpan armada');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteVehicle = async (id: string) => {
    const { error } = await supabase.from('fleet_vehicles').delete().eq('id', id);
    if (error) toast.error('Gagal menghapus');
    else { toast.success('Armada dihapus'); fetchVehicles(); }
  };

  const toggleActive = async (v: FleetVehicle) => {
    await supabase.from('fleet_vehicles').update({ is_active: !v.is_active }).eq('id', v.id);
    fetchVehicles();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Kelola Armada</h2>
          <p className="text-sm text-muted-foreground">Tambah dan kelola unit kendaraan dengan gambar</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchVehicles}>
            <RefreshCw className="w-4 h-4 mr-1" /> Refresh
          </Button>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="w-4 h-4 mr-1" /> Tambah Armada
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Kapasitas</TableHead>
              <TableHead>Urutan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></TableCell></TableRow>
            ) : vehicles.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Belum ada data armada</TableCell></TableRow>
            ) : vehicles.map(v => (
              <TableRow key={v.id}>
                <TableCell>
                  {v.image_url ? (
                    <img src={v.image_url} alt={v.name} className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
                      <Car className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{v.name}</TableCell>
                <TableCell>{v.capacity}</TableCell>
                <TableCell>{v.display_order}</TableCell>
                <TableCell>
                  <Badge variant={v.is_active ? "default" : "secondary"} className="cursor-pointer" onClick={() => toggleActive(v)}>
                    {v.is_active ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(v)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus armada?</AlertDialogTitle>
                          <AlertDialogDescription>Data {v.name} akan dihapus permanen.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteVehicle(v.id)}>Hapus</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Dialog Form */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Armada' : 'Tambah Armada'}</DialogTitle>
            <DialogDescription>Isi detail kendaraan beserta gambar</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Gambar Kendaraan</Label>
              <div className="mt-2">
                {imagePreview ? (
                  <div className="relative group">
                    <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-border" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                      <label className="cursor-pointer">
                        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                        <div className="text-white text-sm font-medium flex items-center gap-2">
                          <Upload className="w-4 h-4" /> Ganti Gambar
                        </div>
                      </label>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer block">
                    <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageSelect} className="hidden" />
                    <div className="w-full h-48 rounded-xl border-2 border-dashed border-border hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <ImageIcon className="w-8 h-8" />
                      <span className="text-sm">Klik untuk upload gambar</span>
                      <span className="text-xs">JPG, PNG, WebP (maks 5MB)</span>
                    </div>
                  </label>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nama Kendaraan</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Innova Reborn" />
              </div>
              <div>
                <Label>Kapasitas</Label>
                <Input value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} placeholder="6 Seat" />
              </div>
            </div>
            <div>
              <Label>Deskripsi (Opsional)</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Deskripsi singkat kendaraan..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Urutan Tampil</Label>
                <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))} />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Aktif</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={isSaving || isUploading}>
              {(isSaving || isUploading) && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              {isUploading ? 'Mengunggah...' : isSaving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFleet;
