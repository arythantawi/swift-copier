import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight, X, Camera, Filter } from 'lucide-react';
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
      
      // Extract unique categories
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

  // Keyboard navigation
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
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-48 mx-auto mb-4" />
            <Skeleton className="h-6 w-72 mx-auto" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (photos.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <Camera className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Galeri Foto</h2>
            <p className="text-muted-foreground">Belum ada foto yang ditampilkan.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="galeri" className="py-16 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <Badge variant="outline" className="mb-4 border-primary/30 text-primary">
            <Camera className="w-3 h-3 mr-1" />
            Galeri Foto
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Momen Perjalanan Kami
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Koleksi foto perjalanan dan pelayanan 44 Trans yang menampilkan kenyamanan dan profesionalisme
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            <Button
              variant={activeCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory('all')}
              className="rounded-full"
            >
              <Filter className="w-3 h-3 mr-1" />
              Semua
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={activeCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setActiveCategory(category)}
                className="rounded-full capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
        )}

        {/* Photo Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className={cn(
                "group relative aspect-square rounded-xl overflow-hidden cursor-pointer",
                "transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl",
                "bg-muted animate-fade-in"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
              onClick={() => openLightbox(photo, index)}
            >
              {/* Skeleton while loading */}
              {!imageLoaded[photo.id] && (
                <div className="absolute inset-0 bg-muted animate-pulse" />
              )}
              
              {/* Image with lazy loading */}
              <img
                src={photo.image_url}
                alt={photo.alt_text || photo.caption || 'Foto galeri 44 Trans'}
                loading="lazy"
                onLoad={() => handleImageLoad(photo.id)}
                className={cn(
                  "w-full h-full object-cover transition-all duration-500",
                  "group-hover:scale-110",
                  imageLoaded[photo.id] ? 'opacity-100' : 'opacity-0'
                )}
              />

              {/* Hover Overlay */}
              <div className={cn(
                "absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent",
                "opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                "flex flex-col justify-end p-4"
              )}>
                {photo.caption && (
                  <p className="text-white text-sm font-medium line-clamp-2">
                    {photo.caption}
                  </p>
                )}
                {photo.category && (
                  <Badge variant="secondary" className="w-fit mt-2 text-xs">
                    {photo.category}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="text-center mt-8 text-muted-foreground text-sm">
          Menampilkan {filteredPhotos.length} dari {photos.length} foto
        </div>
      </div>

      {/* Lightbox Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => closeLightbox()}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/95 border-none">
          <div className="relative w-full h-full flex items-center justify-center">
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
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
              >
                <ChevronLeft className="w-8 h-8" />
              </Button>
            )}
            
            {selectedIndex < filteredPhotos.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={navigateNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
              >
                <ChevronRight className="w-8 h-8" />
              </Button>
            )}

            {/* Main Image */}
            {selectedPhoto && (
              <div className="flex flex-col items-center max-h-[90vh] p-4">
                <img
                  src={selectedPhoto.image_url}
                  alt={selectedPhoto.alt_text || selectedPhoto.caption || 'Foto galeri 44 Trans'}
                  className="max-w-full max-h-[80vh] object-contain rounded-lg"
                />
                
                {/* Caption */}
                {selectedPhoto.caption && (
                  <div className="mt-4 text-center text-white max-w-2xl">
                    <p className="text-lg">{selectedPhoto.caption}</p>
                    {selectedPhoto.category && (
                      <Badge variant="secondary" className="mt-2">
                        {selectedPhoto.category}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Navigation Dots */}
                <div className="flex gap-1.5 mt-4">
                  {filteredPhotos.slice(
                    Math.max(0, selectedIndex - 3),
                    Math.min(filteredPhotos.length, selectedIndex + 4)
                  ).map((_, i) => {
                    const actualIndex = Math.max(0, selectedIndex - 3) + i;
                    return (
                      <button
                        key={actualIndex}
                        onClick={() => {
                          setSelectedIndex(actualIndex);
                          setSelectedPhoto(filteredPhotos[actualIndex]);
                        }}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all",
                          actualIndex === selectedIndex 
                            ? "bg-white w-6" 
                            : "bg-white/40 hover:bg-white/60"
                        )}
                      />
                    );
                  })}
                </div>

                {/* Counter */}
                <p className="text-white/60 text-sm mt-2">
                  {selectedIndex + 1} / {filteredPhotos.length}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Gallery;
