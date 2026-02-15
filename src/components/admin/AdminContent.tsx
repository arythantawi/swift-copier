import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  RefreshCw,
  Image,
  Tag,
  HelpCircle,
  Star,
  MessageSquare,
  FileText
} from 'lucide-react';
import BannerPreview from './BannerPreview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'sonner';

// Types
interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  display_order: number;
  is_active: boolean;
  layout_type: string;
  aspect_ratio: string | null;
}

interface Promo {
  id: string;
  title: string;
  description: string | null;
  discount_text: string | null;
  promo_code: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  display_order: number;
  is_active: boolean;
}

interface Testimonial {
  id: string;
  customer_name: string;
  customer_photo_url: string | null;
  customer_location: string | null;
  rating: number;
  testimonial_text: string;
  route_taken: string | null;
  display_order: number;
  is_active: boolean;
  user_id: string | null;
  booking_id: string | null;
}

// Helper function to convert Google Drive links to direct image URL
const convertGoogleDriveUrl = (url: string): string => {
  if (!url) return url;
  
  // Pattern 1: https://drive.google.com/file/d/{FILE_ID}/view...
  const filePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }
  
  // Pattern 2: https://drive.google.com/open?id={FILE_ID}
  const openPattern = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const openMatch = url.match(openPattern);
  if (openMatch) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }
  
  // Pattern 3: https://drive.google.com/uc?id={FILE_ID}...
  const ucPattern = /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/;
  const ucMatch = url.match(ucPattern);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  
  return url;
};

const AdminContent = () => {
  const [activeTab, setActiveTab] = useState('banners');

  // Legal pages state
  const [legalPages, setLegalPages] = useState<{ id: string; slug: string; title: string; content: string; is_active: boolean }[]>([]);
  const [legalLoading, setLegalLoading] = useState(true);
  const [editingLegal, setEditingLegal] = useState<{ id: string; slug: string; title: string; content: string; is_active: boolean } | null>(null);
  const [legalDialogOpen, setLegalDialogOpen] = useState(false);
  const [legalForm, setLegalForm] = useState({ title: '', content: '', is_active: true });
  
  // Banners state
  const [banners, setBanners] = useState<Banner[]>([]);
  const [bannersLoading, setBannersLoading] = useState(true);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '', subtitle: '', image_url: '', link_url: '', button_text: '', display_order: 0, is_active: true, layout_type: 'image_caption', aspect_ratio: '16:9'
  });

  // Promos state
  const [promos, setPromos] = useState<Promo[]>([]);
  const [promosLoading, setPromosLoading] = useState(true);
  const [promoDialogOpen, setPromoDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [promoForm, setPromoForm] = useState({
    title: '', description: '', discount_text: '', promo_code: '', start_date: '', end_date: '', is_active: true
  });

  // FAQs state
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FAQ | null>(null);
  const [faqForm, setFaqForm] = useState({
    question: '', answer: '', category: 'Umum', display_order: 0, is_active: true
  });

  // Testimonials state
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialsLoading, setTestimonialsLoading] = useState(true);
  const [testimonialDialogOpen, setTestimonialDialogOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [testimonialForm, setTestimonialForm] = useState({
    customer_name: '', customer_photo_url: '', customer_location: '', rating: 5, testimonial_text: '', route_taken: '', display_order: 0, is_active: true
  });

  const [isSaving, setIsSaving] = useState(false);

  // Fetch functions - optimized with specific column selection
  const fetchBanners = async () => {
    setBannersLoading(true);
    const { data, error } = await supabase
      .from('banners')
      .select('id, title, subtitle, image_url, link_url, button_text, layout_type, display_order, is_active, aspect_ratio, created_at, updated_at')
      .order('display_order')
      .limit(100);
    if (!error) setBanners(data || []);
    setBannersLoading(false);
  };

  const fetchPromos = async () => {
    setPromosLoading(true);
    const { data, error } = await supabase
      .from('promos')
      .select('id, title, description, discount_text, promo_code, start_date, end_date, is_active, created_at, updated_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error) setPromos(data || []);
    setPromosLoading(false);
  };

  const fetchFaqs = async () => {
    setFaqsLoading(true);
    const { data, error } = await supabase
      .from('faqs')
      .select('id, question, answer, category, display_order, is_active, created_at, updated_at')
      .order('display_order')
      .limit(100);
    if (!error) setFaqs(data || []);
    setFaqsLoading(false);
  };

  const fetchTestimonials = async () => {
    setTestimonialsLoading(true);
    const { data, error } = await supabase
      .from('testimonials')
      .select('id, customer_name, customer_photo_url, customer_location, rating, testimonial_text, route_taken, display_order, is_active, user_id, booking_id, created_at, updated_at')
      .order('display_order')
      .limit(100);
    if (!error) setTestimonials(data || []);
    setTestimonialsLoading(false);
  };

  // Legal pages fetch
  const fetchLegalPages = async () => {
    setLegalLoading(true);
    const { data, error } = await supabase
      .from('legal_pages')
      .select('id, slug, title, content, is_active')
      .order('slug');
    if (!error) setLegalPages(data || []);
    setLegalLoading(false);
  };

  useEffect(() => {
    Promise.all([fetchBanners(), fetchPromos(), fetchFaqs(), fetchTestimonials(), fetchLegalPages()]);
  }, []);

  // Banner handlers

  const openBannerDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner);
      setBannerForm({
        title: banner.title,
        subtitle: banner.subtitle || '',
        image_url: banner.image_url || '',
        link_url: banner.link_url || '',
        button_text: banner.button_text || '',
        display_order: banner.display_order,
        is_active: banner.is_active,
        layout_type: banner.layout_type || 'image_caption',
        aspect_ratio: banner.aspect_ratio || '16:9',
      });
    } else {
      setEditingBanner(null);
      setBannerForm({ title: '', subtitle: '', image_url: '', link_url: '', button_text: '', display_order: 0, is_active: true, layout_type: 'image_caption', aspect_ratio: '16:9' });
    }
    setBannerDialogOpen(true);
  };

  const saveBanner = async () => {
    setIsSaving(true);
    try {
      const data = {
        title: bannerForm.title || null,
        subtitle: bannerForm.subtitle || null,
        image_url: bannerForm.image_url ? convertGoogleDriveUrl(bannerForm.image_url) : null,
        link_url: bannerForm.link_url || null,
        button_text: bannerForm.button_text || null,
        display_order: bannerForm.display_order,
        is_active: bannerForm.is_active,
        layout_type: bannerForm.layout_type,
        aspect_ratio: bannerForm.aspect_ratio,
      };
      if (editingBanner) {
        const { error } = await supabase.from('banners').update(data).eq('id', editingBanner.id);
        if (error) throw error;
        toast.success('Banner berhasil diperbarui');
      } else {
        const { error } = await supabase.from('banners').insert([data]);
        if (error) throw error;
        toast.success('Banner berhasil ditambahkan');
      }
      setBannerDialogOpen(false);
      fetchBanners();
    } catch (error) {
      toast.error('Gagal menyimpan banner');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteBanner = async (id: string) => {
    const { error } = await supabase.from('banners').delete().eq('id', id);
    if (error) toast.error('Gagal menghapus banner');
    else { toast.success('Banner dihapus'); fetchBanners(); }
  };

  const toggleBannerActive = async (banner: Banner) => {
    await supabase.from('banners').update({ is_active: !banner.is_active }).eq('id', banner.id);
    fetchBanners();
  };

  // Promo handlers
  const openPromoDialog = (promo?: Promo) => {
    if (promo) {
      setEditingPromo(promo);
      setPromoForm({
        title: promo.title,
        description: promo.description || '',
        discount_text: promo.discount_text || '',
        promo_code: promo.promo_code || '',
        start_date: promo.start_date || '',
        end_date: promo.end_date || '',
        is_active: promo.is_active,
      });
    } else {
      setEditingPromo(null);
      setPromoForm({ title: '', description: '', discount_text: '', promo_code: '', start_date: '', end_date: '', is_active: true });
    }
    setPromoDialogOpen(true);
  };

  const savePromo = async () => {
    if (!promoForm.title) {
      toast.error('Judul promo wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        title: promoForm.title,
        description: promoForm.description || null,
        discount_text: promoForm.discount_text || null,
        promo_code: promoForm.promo_code || null,
        start_date: promoForm.start_date || null,
        end_date: promoForm.end_date || null,
        is_active: promoForm.is_active,
      };
      if (editingPromo) {
        const { error } = await supabase.from('promos').update(data).eq('id', editingPromo.id);
        if (error) throw error;
        toast.success('Promo berhasil diperbarui');
      } else {
        const { error } = await supabase.from('promos').insert([data]);
        if (error) throw error;
        toast.success('Promo berhasil ditambahkan');
      }
      setPromoDialogOpen(false);
      fetchPromos();
    } catch (error) {
      toast.error('Gagal menyimpan promo');
    } finally {
      setIsSaving(false);
    }
  };

  const deletePromo = async (id: string) => {
    const { error } = await supabase.from('promos').delete().eq('id', id);
    if (error) toast.error('Gagal menghapus promo');
    else { toast.success('Promo dihapus'); fetchPromos(); }
  };

  const togglePromoActive = async (promo: Promo) => {
    await supabase.from('promos').update({ is_active: !promo.is_active }).eq('id', promo.id);
    fetchPromos();
  };

  // FAQ handlers
  const openFaqDialog = (faq?: FAQ) => {
    if (faq) {
      setEditingFaq(faq);
      setFaqForm({
        question: faq.question,
        answer: faq.answer,
        category: faq.category || 'Umum',
        display_order: faq.display_order,
        is_active: faq.is_active,
      });
    } else {
      setEditingFaq(null);
      setFaqForm({ question: '', answer: '', category: 'Umum', display_order: 0, is_active: true });
    }
    setFaqDialogOpen(true);
  };

  const saveFaq = async () => {
    if (!faqForm.question || !faqForm.answer) {
      toast.error('Pertanyaan dan jawaban wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        question: faqForm.question,
        answer: faqForm.answer,
        category: faqForm.category || 'Umum',
        display_order: faqForm.display_order,
        is_active: faqForm.is_active,
      };
      if (editingFaq) {
        const { error } = await supabase.from('faqs').update(data).eq('id', editingFaq.id);
        if (error) throw error;
        toast.success('FAQ berhasil diperbarui');
      } else {
        const { error } = await supabase.from('faqs').insert([data]);
        if (error) throw error;
        toast.success('FAQ berhasil ditambahkan');
      }
      setFaqDialogOpen(false);
      fetchFaqs();
    } catch (error) {
      toast.error('Gagal menyimpan FAQ');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteFaq = async (id: string) => {
    const { error } = await supabase.from('faqs').delete().eq('id', id);
    if (error) toast.error('Gagal menghapus FAQ');
    else { toast.success('FAQ dihapus'); fetchFaqs(); }
  };

  const toggleFaqActive = async (faq: FAQ) => {
    await supabase.from('faqs').update({ is_active: !faq.is_active }).eq('id', faq.id);
    fetchFaqs();
  };

  // Testimonial handlers
  const openTestimonialDialog = (testimonial?: Testimonial) => {
    if (testimonial) {
      setEditingTestimonial(testimonial);
      setTestimonialForm({
        customer_name: testimonial.customer_name,
        customer_photo_url: testimonial.customer_photo_url || '',
        customer_location: testimonial.customer_location || '',
        rating: testimonial.rating,
        testimonial_text: testimonial.testimonial_text,
        route_taken: testimonial.route_taken || '',
        display_order: testimonial.display_order,
        is_active: testimonial.is_active,
      });
    } else {
      setEditingTestimonial(null);
      setTestimonialForm({ customer_name: '', customer_photo_url: '', customer_location: '', rating: 5, testimonial_text: '', route_taken: '', display_order: 0, is_active: true });
    }
    setTestimonialDialogOpen(true);
  };

  const saveTestimonial = async () => {
    if (!testimonialForm.customer_name || !testimonialForm.testimonial_text) {
      toast.error('Nama pelanggan dan testimoni wajib diisi');
      return;
    }
    setIsSaving(true);
    try {
      const data = {
        customer_name: testimonialForm.customer_name,
        customer_photo_url: testimonialForm.customer_photo_url || null,
        customer_location: testimonialForm.customer_location || null,
        rating: testimonialForm.rating,
        testimonial_text: testimonialForm.testimonial_text,
        route_taken: testimonialForm.route_taken || null,
        display_order: testimonialForm.display_order,
        is_active: testimonialForm.is_active,
      };
      if (editingTestimonial) {
        const { error } = await supabase.from('testimonials').update(data).eq('id', editingTestimonial.id);
        if (error) throw error;
        toast.success('Testimoni berhasil diperbarui');
      } else {
        const { error } = await supabase.from('testimonials').insert([data]);
        if (error) throw error;
        toast.success('Testimoni berhasil ditambahkan');
      }
      setTestimonialDialogOpen(false);
      fetchTestimonials();
    } catch (error) {
      toast.error('Gagal menyimpan testimoni');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTestimonial = async (id: string) => {
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) toast.error('Gagal menghapus testimoni');
    else { toast.success('Testimoni dihapus'); fetchTestimonials(); }
  };

  const toggleTestimonialActive = async (testimonial: Testimonial) => {
    await supabase.from('testimonials').update({ is_active: !testimonial.is_active }).eq('id', testimonial.id);
    fetchTestimonials();
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, index) => (
      <Star
        key={index}
        className={`w-4 h-4 ${
          index < rating 
            ? 'text-yellow-400 fill-yellow-400' 
            : 'text-muted-foreground/30'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 max-w-2xl">
          <TabsTrigger value="banners" className="gap-2">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Banner</span>
          </TabsTrigger>
          <TabsTrigger value="promos" className="gap-2">
            <Tag className="w-4 h-4" />
            <span className="hidden sm:inline">Promo</span>
          </TabsTrigger>
          <TabsTrigger value="faqs" className="gap-2">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline">FAQ</span>
          </TabsTrigger>
          <TabsTrigger value="testimonials" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            <span className="hidden sm:inline">Testimoni</span>
          </TabsTrigger>
          <TabsTrigger value="legal" className="gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Legal</span>
          </TabsTrigger>
        </TabsList>

        {/* Banners Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manajemen Banner</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchBanners}>
                <RefreshCw className={`w-4 h-4 ${bannersLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => openBannerDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Banner
              </Button>
            </div>
          </div>

          {bannersLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : banners.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada banner</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Urutan</TableHead>
                    <TableHead className="w-24">Gambar</TableHead>
                    <TableHead>Judul</TableHead>
                    <TableHead className="hidden md:table-cell">Subtitle</TableHead>
                    <TableHead className="w-20">Status</TableHead>
                    <TableHead className="text-right w-24">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {banners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>{banner.display_order}</TableCell>
                      <TableCell>
                        {banner.image_url ? (
                          <div className="w-16 h-10 rounded-md overflow-hidden bg-muted border border-border">
                            <img 
                              src={convertGoogleDriveUrl(banner.image_url)} 
                              alt={banner.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                                const parent = img.parentElement;
                                if (parent) {
                                  parent.textContent = '';
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = 'w-full h-full flex items-center justify-center text-xs text-destructive';
                                  errorDiv.textContent = 'Error';
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-10 rounded-md bg-muted border border-border flex items-center justify-center">
                            <Image className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">{banner.subtitle || '-'}</TableCell>
                      <TableCell>
                        <Switch checked={banner.is_active} onCheckedChange={() => toggleBannerActive(banner)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openBannerDialog(banner)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Banner?</AlertDialogTitle>
                              <AlertDialogDescription>Banner "{banner.title}" akan dihapus permanen.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteBanner(banner.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Promos Tab */}
        <TabsContent value="promos" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manajemen Promo</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchPromos}>
                <RefreshCw className={`w-4 h-4 ${promosLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => openPromoDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Promo
              </Button>
            </div>
          </div>

          {promosLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : promos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada promo</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Judul</TableHead>
                    <TableHead>Diskon</TableHead>
                    <TableHead>Kode</TableHead>
                    <TableHead>Periode</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {promos.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell className="font-medium">{promo.title}</TableCell>
                      <TableCell><Badge variant="secondary">{promo.discount_text || '-'}</Badge></TableCell>
                      <TableCell className="font-mono">{promo.promo_code || '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {promo.start_date && promo.end_date 
                          ? `${promo.start_date} - ${promo.end_date}`
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <Switch checked={promo.is_active} onCheckedChange={() => togglePromoActive(promo)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openPromoDialog(promo)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Promo?</AlertDialogTitle>
                              <AlertDialogDescription>Promo "{promo.title}" akan dihapus permanen.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deletePromo(promo.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* FAQs Tab */}
        <TabsContent value="faqs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manajemen FAQ</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchFaqs}>
                <RefreshCw className={`w-4 h-4 ${faqsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => openFaqDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah FAQ
              </Button>
            </div>
          </div>

          {faqsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : faqs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada FAQ</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Urutan</TableHead>
                    <TableHead>Pertanyaan</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faqs.map((faq) => (
                    <TableRow key={faq.id}>
                      <TableCell>{faq.display_order}</TableCell>
                      <TableCell className="font-medium max-w-md truncate">{faq.question}</TableCell>
                      <TableCell><Badge variant="outline">{faq.category}</Badge></TableCell>
                      <TableCell>
                        <Switch checked={faq.is_active} onCheckedChange={() => toggleFaqActive(faq)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openFaqDialog(faq)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus FAQ?</AlertDialogTitle>
                              <AlertDialogDescription>FAQ ini akan dihapus permanen.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteFaq(faq.id)}>Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Testimonials Tab */}
        <TabsContent value="testimonials" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Manajemen Testimoni</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={fetchTestimonials}>
                <RefreshCw className={`w-4 h-4 ${testimonialsLoading ? 'animate-spin' : ''}`} />
              </Button>
              <Button onClick={() => openTestimonialDialog()}>
                <Plus className="w-4 h-4 mr-2" />
                Tambah Testimoni
              </Button>
            </div>
          </div>

          {testimonialsLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto" />
            </div>
          ) : testimonials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Belum ada testimoni</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Foto</TableHead>
                    <TableHead>Nama</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Rute</TableHead>
                    <TableHead>Sumber</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {testimonials.map((testimonial) => (
                    <TableRow key={testimonial.id}>
                      <TableCell>{testimonial.display_order}</TableCell>
                      <TableCell>
                        {testimonial.customer_photo_url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border">
                            <img 
                              src={convertGoogleDriveUrl(testimonial.customer_photo_url)} 
                              alt={testimonial.customer_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted border border-border flex items-center justify-center">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{testimonial.customer_name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.customer_location || '-'}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {renderStars(testimonial.rating)}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline">{testimonial.route_taken || '-'}</Badge></TableCell>
                      <TableCell>
                        {testimonial.user_id ? (
                          <Badge variant="secondary" className="gap-1">
                            <Star className="w-3 h-3" />
                            User
                          </Badge>
                        ) : (
                          <Badge variant="outline">Admin</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch checked={testimonial.is_active} onCheckedChange={() => toggleTestimonialActive(testimonial)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openTestimonialDialog(testimonial)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Testimoni?</AlertDialogTitle>
                              <AlertDialogDescription>Testimoni dari "{testimonial.customer_name}" akan dihapus permanen dan tidak dapat dikembalikan.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteTestimonial(testimonial.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Legal Pages Tab */}
        <TabsContent value="legal" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Halaman Legal</h3>
            <Button variant="outline" size="sm" onClick={fetchLegalPages}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh
            </Button>
          </div>
          {legalLoading ? (
            <div className="text-center py-8 text-muted-foreground">Memuat...</div>
          ) : (
            <div className="grid gap-4">
              {legalPages.map((page) => (
                <div key={page.id} className="p-5 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-primary" />
                      <div>
                        <h4 className="font-semibold">{page.title}</h4>
                        <p className="text-xs text-muted-foreground">slug: {page.slug}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={page.is_active ? "default" : "secondary"}>
                        {page.is_active ? "Aktif" : "Nonaktif"}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingLegal(page);
                          setLegalForm({ title: page.title, content: page.content, is_active: page.is_active });
                          setLegalDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-3 whitespace-pre-wrap">{page.content.substring(0, 200)}...</p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Banner Dialog */}
      <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBanner ? 'Edit Banner' : 'Tambah Banner'}</DialogTitle>
            <DialogDescription>Kelola banner untuk tampilan website</DialogDescription>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6 py-4">
            {/* Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipe Layout *</Label>
                <Select 
                  value={bannerForm.layout_type} 
                  onValueChange={(value) => setBannerForm({...bannerForm, layout_type: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image_full">🖼️ Gambar Penuh (tanpa teks)</SelectItem>
                    <SelectItem value="image_overlay">🎨 Gambar + Overlay Teks</SelectItem>
                    <SelectItem value="image_caption">📝 Gambar + Caption Bawah</SelectItem>
                    <SelectItem value="text_only">✏️ Teks Saja (tanpa gambar)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Pilih bagaimana banner akan ditampilkan di website
                </p>
              </div>
              <div className="space-y-2">
                <Label>Judul *</Label>
                <Input value={bannerForm.title} onChange={(e) => setBannerForm({...bannerForm, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Subtitle</Label>
                <Input value={bannerForm.subtitle} onChange={(e) => setBannerForm({...bannerForm, subtitle: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Aspect Ratio</Label>
                <Select 
                  value={bannerForm.aspect_ratio?.startsWith('custom:') ? 'custom' : bannerForm.aspect_ratio} 
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      // Preserve existing custom values if already custom, otherwise default to 16:9
                      if (!bannerForm.aspect_ratio?.startsWith('custom:')) {
                        setBannerForm({...bannerForm, aspect_ratio: 'custom:16:9'});
                      }
                    } else {
                      setBannerForm({...bannerForm, aspect_ratio: value});
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih aspect ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3:1">🎬 3:1 (Extra Wide)</SelectItem>
                    <SelectItem value="2.76:1">🎥 2.76:1 (Cinematic)</SelectItem>
                    <SelectItem value="21:9">📐 21:9 (Ultra Wide)</SelectItem>
                    <SelectItem value="16:9">📺 16:9 (Landscape)</SelectItem>
                    <SelectItem value="3:2">📷 3:2 (Photo)</SelectItem>
                    <SelectItem value="4:3">🖥️ 4:3 (Standard)</SelectItem>
                    <SelectItem value="1:1">⬜ 1:1 (Square)</SelectItem>
                    <SelectItem value="3:4">📱 3:4 (Portrait)</SelectItem>
                    <SelectItem value="9:16">📲 9:16 (Mobile)</SelectItem>
                    <SelectItem value="custom">✏️ Custom</SelectItem>
                  </SelectContent>
                </Select>
                {bannerForm.aspect_ratio?.startsWith('custom:') && (
                  <div className="flex items-center gap-2 mt-2">
                    <Input 
                      type="number"
                      min="1"
                      max="100"
                      placeholder="W"
                      className="w-20"
                      value={(() => {
                        const parts = bannerForm.aspect_ratio.split(':');
                        return parts.length >= 2 ? parts[1] : '16';
                      })()}
                      onChange={(e) => {
                        const width = e.target.value || '1';
                        const parts = bannerForm.aspect_ratio.split(':');
                        const height = parts.length >= 3 ? parts[2] : '9';
                        setBannerForm({...bannerForm, aspect_ratio: `custom:${width}:${height}`});
                      }}
                    />
                    <span className="text-muted-foreground font-bold">:</span>
                    <Input 
                      type="number"
                      min="1"
                      max="100"
                      placeholder="H"
                      className="w-20"
                      value={(() => {
                        const parts = bannerForm.aspect_ratio.split(':');
                        return parts.length >= 3 ? parts[2] : '9';
                      })()}
                      onChange={(e) => {
                        const parts = bannerForm.aspect_ratio.split(':');
                        const width = parts.length >= 2 ? parts[1] : '16';
                        const height = e.target.value || '1';
                        setBannerForm({...bannerForm, aspect_ratio: `custom:${width}:${height}`});
                      }}
                    />
                    <span className="text-xs text-muted-foreground">
                      (Width : Height)
                    </span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Ukuran container banner di website
                </p>
              </div>
              <div className="space-y-2">
                <Label>URL Gambar</Label>
                <Input 
                  value={bannerForm.image_url} 
                  onChange={(e) => setBannerForm({...bannerForm, image_url: e.target.value})} 
                  placeholder="https://drive.google.com/file/d/.../view" 
                />
                <p className="text-xs text-muted-foreground">
                  ✅ Mendukung link Google Drive atau link langsung
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>URL Link</Label>
                  <Input value={bannerForm.link_url} onChange={(e) => setBannerForm({...bannerForm, link_url: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Teks Tombol</Label>
                  <Input value={bannerForm.button_text} onChange={(e) => setBannerForm({...bannerForm, button_text: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urutan</Label>
                  <Input type="number" value={bannerForm.display_order} onChange={(e) => setBannerForm({...bannerForm, display_order: parseInt(e.target.value) || 0})} />
                </div>
                <div className="flex items-center justify-between pt-6">
                  <Label>Aktif</Label>
                  <Switch checked={bannerForm.is_active} onCheckedChange={(checked) => setBannerForm({...bannerForm, is_active: checked})} />
                </div>
              </div>
            </div>
            
            {/* Live Preview */}
            <div className="space-y-4">
              <BannerPreview
                title={bannerForm.title}
                subtitle={bannerForm.subtitle}
                image_url={bannerForm.image_url}
                link_url={bannerForm.link_url}
                button_text={bannerForm.button_text}
                layout_type={bannerForm.layout_type}
                aspect_ratio={bannerForm.aspect_ratio}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>Batal</Button>
            <Button onClick={saveBanner} disabled={isSaving}>
              {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promo Dialog */}
      <Dialog open={promoDialogOpen} onOpenChange={setPromoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingPromo ? 'Edit Promo' : 'Tambah Promo'}</DialogTitle>
            <DialogDescription>Kelola promosi untuk pelanggan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Judul *</Label>
              <Input value={promoForm.title} onChange={(e) => setPromoForm({...promoForm, title: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi</Label>
              <Textarea value={promoForm.description} onChange={(e) => setPromoForm({...promoForm, description: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teks Diskon</Label>
                <Input value={promoForm.discount_text} onChange={(e) => setPromoForm({...promoForm, discount_text: e.target.value})} placeholder="10% OFF" />
              </div>
              <div className="space-y-2">
                <Label>Kode Promo</Label>
                <Input value={promoForm.promo_code} onChange={(e) => setPromoForm({...promoForm, promo_code: e.target.value})} placeholder="DISKON10" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal Mulai</Label>
                <Input type="date" value={promoForm.start_date} onChange={(e) => setPromoForm({...promoForm, start_date: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Tanggal Berakhir</Label>
                <Input type="date" value={promoForm.end_date} onChange={(e) => setPromoForm({...promoForm, end_date: e.target.value})} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={promoForm.is_active} onCheckedChange={(checked) => setPromoForm({...promoForm, is_active: checked})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialogOpen(false)}>Batal</Button>
            <Button onClick={savePromo} disabled={isSaving}>
              {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FAQ Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingFaq ? 'Edit FAQ' : 'Tambah FAQ'}</DialogTitle>
            <DialogDescription>Kelola pertanyaan yang sering ditanyakan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Pertanyaan *</Label>
              <Input value={faqForm.question} onChange={(e) => setFaqForm({...faqForm, question: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Jawaban *</Label>
              <Textarea rows={4} value={faqForm.answer} onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori</Label>
                <Input value={faqForm.category} onChange={(e) => setFaqForm({...faqForm, category: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" value={faqForm.display_order} onChange={(e) => setFaqForm({...faqForm, display_order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={faqForm.is_active} onCheckedChange={(checked) => setFaqForm({...faqForm, is_active: checked})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFaqDialogOpen(false)}>Batal</Button>
            <Button onClick={saveFaq} disabled={isSaving}>
              {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Testimonial Dialog */}
      <Dialog open={testimonialDialogOpen} onOpenChange={setTestimonialDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingTestimonial ? 'Edit Testimoni' : 'Tambah Testimoni'}</DialogTitle>
            <DialogDescription>Kelola testimoni dari pelanggan</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nama Pelanggan *</Label>
                <Input value={testimonialForm.customer_name} onChange={(e) => setTestimonialForm({...testimonialForm, customer_name: e.target.value})} placeholder="Budi Santoso" />
              </div>
              <div className="space-y-2">
                <Label>Lokasi</Label>
                <Input value={testimonialForm.customer_location} onChange={(e) => setTestimonialForm({...testimonialForm, customer_location: e.target.value})} placeholder="Surabaya" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>URL Foto Pelanggan</Label>
              <Input value={testimonialForm.customer_photo_url} onChange={(e) => setTestimonialForm({...testimonialForm, customer_photo_url: e.target.value})} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Rating</Label>
              <Select value={testimonialForm.rating.toString()} onValueChange={(value) => setTestimonialForm({...testimonialForm, rating: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih rating" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <SelectItem key={rating} value={rating.toString()}>
                      <div className="flex items-center gap-2">
                        {Array.from({ length: rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        ))}
                        <span className="ml-2">{rating} Bintang</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Testimoni *</Label>
              <Textarea 
                rows={4} 
                value={testimonialForm.testimonial_text} 
                onChange={(e) => setTestimonialForm({...testimonialForm, testimonial_text: e.target.value})} 
                placeholder="Tulis testimoni pelanggan..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Rute Perjalanan</Label>
                <Input value={testimonialForm.route_taken} onChange={(e) => setTestimonialForm({...testimonialForm, route_taken: e.target.value})} placeholder="Surabaya - Denpasar" />
              </div>
              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input type="number" value={testimonialForm.display_order} onChange={(e) => setTestimonialForm({...testimonialForm, display_order: parseInt(e.target.value) || 0})} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={testimonialForm.is_active} onCheckedChange={(checked) => setTestimonialForm({...testimonialForm, is_active: checked})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestimonialDialogOpen(false)}>Batal</Button>
            <Button onClick={saveTestimonial} disabled={isSaving}>
              {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>


      {/* Legal Page Edit Dialog */}
      <Dialog open={legalDialogOpen} onOpenChange={setLegalDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit {editingLegal?.title}</DialogTitle>
            <DialogDescription>
              Konten mendukung format Markdown sederhana (## heading, ### subheading, - list)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul</Label>
              <Input value={legalForm.title} onChange={(e) => setLegalForm({ ...legalForm, title: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Konten</Label>
              <Textarea
                value={legalForm.content}
                onChange={(e) => setLegalForm({ ...legalForm, content: e.target.value })}
                rows={18}
                className="font-mono text-sm"
                placeholder="Tulis konten dengan format Markdown..."
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Aktif</Label>
              <Switch checked={legalForm.is_active} onCheckedChange={(checked) => setLegalForm({ ...legalForm, is_active: checked })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLegalDialogOpen(false)}>Batal</Button>
            <Button
              disabled={isSaving}
              onClick={async () => {
                if (!editingLegal) return;
                setIsSaving(true);
                try {
                  const { error } = await supabase
                    .from('legal_pages')
                    .update({ title: legalForm.title, content: legalForm.content, is_active: legalForm.is_active })
                    .eq('id', editingLegal.id);
                  if (error) throw error;
                  toast.success('Halaman legal berhasil diperbarui');
                  setLegalDialogOpen(false);
                  fetchLegalPages();
                } catch {
                  toast.error('Gagal menyimpan');
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              {isSaving && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminContent;
