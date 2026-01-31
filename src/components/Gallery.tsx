import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, X, Grid3X3, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryPhoto {
  id: string;
  image_url: string;
  caption: string | null;
  alt_text: string | null;
  category: string | null;
  created_at: string;
}

const Gallery = () => {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhoto | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const [imageLoaded, setImageLoaded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchPhotos();
  }, []);

  useEffect(() => {
    if (activeCategory === 'all') {
      setFilteredPhotos(photos);
    } else {
      setFilteredPhotos(photos.filter(p => p.category === activeCategory));
    }
  }, [activeCategory, photos]);

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_photos')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPhotos(data || []);
      setFilteredPhotos(data || []);
      
      const uniqueCategories = [...new Set((data || []).map(p => p.category).filter(Boolean))] as string[];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching gallery photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const openLightbox = (photo: GalleryPhoto, index: number) => {
    setSelectedPhoto(photo);
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhoto(null);
  };

  const navigatePrev = useCallback(() => {
    if (selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  }, [selectedIndex, filteredPhotos]);

  const navigateNext = useCallback(() => {
    if (selectedIndex < filteredPhotos.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setSelectedPhoto(filteredPhotos[newIndex]);
    }
  }, [selectedIndex, filteredPhotos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'ArrowLeft') {
        navigatePrev();
      } else if (e.key === 'ArrowRight') {
        navigateNext();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, navigatePrev, navigateNext]);

  const handleImageLoad = (id: string) => {
    setImageLoaded(prev => ({ ...prev, [id]: true }));
  };

  if (loading) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-8">
            <Skeleton className="h-8 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center py-12">
            <Grid3X3 className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Galeri Foto</h2>
            <p className="text-muted-foreground text-sm">Belum ada foto yang ditampilkan.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="galeri" className="py-12 bg-background border-t border-border">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Instagram-style Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Grid3X3 className="w-5 h-5 text-foreground" />
            <h2 className="text-sm font-semibold uppercase tracking-widest text-foreground">
              Galeri
            </h2>
          </div>
          <p className="text-muted-foreground text-sm text-center">
            Momen perjalanan bersama 44 Trans
          </p>
        </div>

        {/* Category Tabs - Instagram Style */}
        {categories.length > 1 && (
          <div className="flex justify-center gap-8 mb-6 border-t border-border pt-4">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                "flex items-center gap-2 pb-3 text-xs uppercase tracking-widest transition-colors relative",
                activeCategory === 'all' 
                  ? "text-foreground font-semibold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Grid3X3 className="w-3 h-3" />
              Semua
              {activeCategory === 'all' && (
                <span className="absolute -top-px left-0 right-0 h-px bg-foreground" />
              )}
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={cn(
                  "pb-3 text-xs uppercase tracking-widest transition-colors relative",
                  activeCategory === category 
                    ? "text-foreground font-semibold" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {category}
                {activeCategory === category && (
                  <span className="absolute -top-px left-0 right-0 h-px bg-foreground" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Instagram-style Photo Grid - 3 columns, minimal gap */}
        <div className="grid grid-cols-3 gap-0.5 md:gap-1">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative aspect-square cursor-pointer overflow-hidden bg-muted"
              onClick={() => openLightbox(photo, index)}
            >
              {/* Skeleton while loading */}
              {!imageLoaded[photo.id] && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              
              {/* Image */}
              <img
                src={photo.image_url}
                alt={photo.alt_text || photo.caption || 'Foto galeri 44 Trans'}
                loading="lazy"
                onLoad={() => handleImageLoad(photo.id)}
                className={cn(
                  "w-full h-full object-cover transition-opacity duration-300",
                  imageLoaded[photo.id] ? 'opacity-100' : 'opacity-0'
                )}
              />

              {/* Instagram-style Hover Overlay */}
              <div className={cn(
                "absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                "flex items-center justify-center"
              )}>
                <div className="flex items-center gap-6 text-white">
                  <div className="flex items-center gap-2">
                    <Heart className="w-6 h-6 fill-white" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Posts count */}
        <div className="text-center mt-6">
          <p className="text-muted-foreground text-xs uppercase tracking-wider">
            {filteredPhotos.length} Foto
          </p>
        </div>
      </div>

      {/* Instagram-style Lightbox Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-5xl max-h-[95vh] p-0 bg-background border-none overflow-hidden">
          <div className="flex flex-col md:flex-row h-full">
            {/* Image Section */}
            <div className="relative flex-1 bg-black flex items-center justify-center min-h-[300px] md:min-h-[500px]">
              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-6 h-6" />
              </Button>

              {/* Navigation Buttons */}
              {selectedIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigatePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </Button>
              )}
              
              {selectedIndex < filteredPhotos.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={navigateNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-10 w-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </Button>
              )}

              {/* Main Image */}
              {selectedPhoto && (
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.alt_text || selectedPhoto.caption || 'Foto galeri 44 Trans'}
                  className="max-w-full max-h-[500px] object-contain"
                />
              )}
            </div>

            {/* Instagram-style Caption Section */}
            {selectedPhoto && (
              <div className="w-full md:w-80 bg-background border-t md:border-t-0 md:border-l border-border flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">44</span>
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-foreground">44 Trans</p>
                      <p className="text-xs text-muted-foreground">Jawa Bali</p>
                    </div>
                  </div>
                </div>

                {/* Caption Content */}
                <div className="flex-1 p-4 overflow-y-auto">
                  {selectedPhoto.caption && (
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/60 flex-shrink-0 flex items-center justify-center">
                        <span className="text-white text-xs font-bold">44</span>
                      </div>
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="font-semibold mr-2">44trans</span>
                          {selectedPhoto.caption}
                        </p>
                        {selectedPhoto.category && (
                          <Badge variant="secondary" className="mt-2 text-xs capitalize">
                            #{selectedPhoto.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer with counter */}
                <div className="p-4 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    {selectedIndex + 1} dari {filteredPhotos.length} foto
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Gallery;
