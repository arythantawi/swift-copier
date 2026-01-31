import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Camera,
  Plus,
  Pencil,
  Trash2,
  Upload,
  Image as ImageIcon,
  Eye,
  EyeOff,
  Loader2,
  Grid3X3,
} from 'lucide-react';

interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  category: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const CATEGORY_OPTIONS = [
  { value: 'umum', label: 'Umum' },
  { value: 'armada', label: 'Armada' },
  { value: 'perjalanan', label: 'Perjalanan' },
  { value: 'fasilitas', label: 'Fasilitas' },
  { value: 'pelanggan', label: 'Pelanggan' },
];

const AdminGallery = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<GalleryPhoto | null>(null);
  const [photoToDelete, setPhotoToDelete] = useState<GalleryPhoto | null>(null);
  
  const [formData, setFormData] = useState({
    image_url: '',
    caption: '',
    alt_text: '',
    category: 'umum',
    is_active: true,
  });
  
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error) {
      console.error('Error fetching photos:', error);
      toast({
        title: 'Error',
        description: 'Gagal memuat foto galeri',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'File harus berupa gambar',
        variant: 'destructive',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Ukuran file maksimal 5MB. Silakan kompres gambar terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    setUploadedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadToGoogleDrive = async (file: File): Promise<string> => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      throw new Error('Not authenticated');
    }

    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL || 'https://ojxydihfvorglvmqyyaq.supabase.co'}/functions/v1/upload-gallery-image`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionData.session.access_token}`,
        },
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Upload failed');
    }

    return result.imageUrl;
  };

  const openAddDialog = () => {
    setEditingPhoto(null);
    setFormData({
      image_url: '',
      caption: '',
      alt_text: '',
      category: 'umum',
      is_active: true,
    });
    setUploadedFile(null);
    setPreviewUrl(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (photo: GalleryPhoto) => {
    setEditingPhoto(photo);
    setFormData({
      image_url: photo.image_url,
      caption: photo.caption || '',
      alt_text: photo.alt_text || '',
      category: photo.category || 'umum',
      is_active: photo.is_active,
    });
    setUploadedFile(null);
    setPreviewUrl(photo.image_url);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      let imageUrl = formData.image_url;

      if (uploadedFile) {
        setUploading(true);
        try {
          imageUrl = await uploadToGoogleDrive(uploadedFile);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast({
            title: 'Error Upload',
            description: 'Gagal mengupload gambar ke Google Drive',
            variant: 'destructive',
          });
          return;
        } finally {
          setUploading(false);
        }
      }

      if (!imageUrl) {
        toast({
          title: 'Error',
          description: 'Silakan pilih gambar',
          variant: 'destructive',
        });
        return;
      }

      const photoData = {
        image_url: imageUrl,
        caption: formData.caption || null,
        alt_text: formData.alt_text || formData.caption || null,
        category: formData.category,
        is_active: formData.is_active,
      };

      if (editingPhoto) {
        const { error } = await supabase
          .from('gallery_photos')
          .update(photoData)
          .eq('id', editingPhoto.id);

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Foto berhasil diperbarui',
        });
      } else {
        const maxOrder = Math.max(...photos.map(p => p.display_order), 0);
        const { error } = await supabase
          .from('gallery_photos')
          .insert({
            ...photoData,
            display_order: maxOrder + 1,
          });

        if (error) throw error;

        toast({
          title: 'Berhasil',
          description: 'Foto berhasil ditambahkan',
        });
      }

      setIsDialogOpen(false);
      fetchPhotos();
    } catch (error) {
      console.error('Error saving photo:', error);
      toast({
        title: 'Error',
        description: 'Gagal menyimpan foto',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!photoToDelete) return;

    try {
      const { error } = await supabase
        .from('gallery_photos')
        .delete()
        .eq('id', photoToDelete.id);

      if (error) throw error;

      toast({
        title: 'Berhasil',
        description: 'Foto berhasil dihapus',
      });

      setIsDeleteDialogOpen(false);
      setPhotoToDelete(null);
      fetchPhotos();
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast({
        title: 'Error',
        description: 'Gagal menghapus foto',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (photo: GalleryPhoto) => {
    try {
      const { error } = await supabase
        .from('gallery_photos')
        .update({ is_active: !photo.is_active })
        .eq('id', photo.id);

      if (error) throw error;

      setPhotos(prev =>
        prev.map(p =>
          p.id === photo.id ? { ...p, is_active: !p.is_active } : p
        )
      );

      toast({
        title: 'Berhasil',
        description: `Foto ${!photo.is_active ? 'ditampilkan' : 'disembunyikan'}`,
      });
    } catch (error) {
      console.error('Error toggling photo:', error);
      toast({
        title: 'Error',
        description: 'Gagal mengubah status foto',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-3 gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Grid3X3 className="w-6 h-6 text-primary" />
            Kelola Galeri Foto
          </h2>
          <p className="text-muted-foreground text-sm">
            {photos.length} foto • Tersimpan di Google Drive
          </p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Tambah Foto
        </Button>
      </div>

      {/* Instagram-style Grid Preview */}
      {photos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Belum Ada Foto</h3>
            <p className="text-muted-foreground mb-4">
              Mulai tambahkan foto untuk galeri website Anda
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Foto Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-3 gap-1 max-w-3xl">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className={`group relative aspect-square overflow-hidden bg-muted ${!photo.is_active ? 'opacity-50' : ''}`}
            >
              <img
                src={photo.image_url}
                alt={photo.alt_text || photo.caption || 'Gallery photo'}
                className="w-full h-full object-cover"
              />
              
              {/* Status indicator */}
              {!photo.is_active && (
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    <EyeOff className="w-3 h-3 mr-1" />
                    Hidden
                  </Badge>
                </div>
              )}

              {/* Category */}
              {photo.category && (
                <div className="absolute top-2 right-2">
                  <Badge variant="outline" className="bg-background/80 text-xs capitalize">
                    {photo.category}
                  </Badge>
                </div>
              )}

              {/* Hover Actions */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => openEditDialog(photo)}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8"
                  onClick={() => toggleActive(photo)}
                >
                  {photo.is_active ? (
                    <EyeOff className="w-3 h-3" />
                  ) : (
                    <Eye className="w-3 h-3" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="destructive"
                  className="h-8 w-8"
                  onClick={() => {
                    setPhotoToDelete(photo);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              {editingPhoto ? 'Edit Foto' : 'Tambah Foto Baru'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Image Upload */}
            <div>
              <Label>Gambar</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              
              {previewUrl ? (
                <div className="relative mt-2">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-lg"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="w-4 h-4 mr-1" />
                    Ganti
                  </Button>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors aspect-square flex flex-col items-center justify-center"
                >
                  <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Klik untuk upload gambar
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP (max 10MB)
                  </p>
                  <p className="text-xs text-primary mt-2">
                    Tersimpan di Google Drive
                  </p>
                </div>
              )}
            </div>

            {/* Caption */}
            <div>
              <Label htmlFor="caption">Caption</Label>
              <Textarea
                id="caption"
                value={formData.caption}
                onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                placeholder="Deskripsi foto..."
                className="mt-1"
                rows={3}
              />
            </div>

            {/* Alt Text */}
            <div>
              <Label htmlFor="alt_text">Alt Text (SEO)</Label>
              <Input
                id="alt_text"
                value={formData.alt_text}
                onChange={(e) => setFormData({ ...formData, alt_text: e.target.value })}
                placeholder="Teks alternatif untuk gambar"
                className="mt-1"
              />
            </div>

            {/* Category */}
            <div>
              <Label>Kategori</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Tampilkan di Website</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || uploading}>
              {(saving || uploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Mengupload...' : saving ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto ini akan dihapus dari galeri. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminGallery;
