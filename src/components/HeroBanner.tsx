import { useState, useEffect, useRef, useCallback } from 'react';
import { useBanners } from '@/hooks/useSiteData';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  button_text: string | null;
  layout_type: string;
  aspect_ratio: string | null;
}

// Get aspect ratio class based on ratio string
const getAspectRatioClass = (ratio: string | null): string => {
  // Handle custom aspect ratio format: custom:width:height
  if (ratio?.startsWith('custom:')) {
    const parts = ratio.split(':');
    if (parts.length === 3) {
      const width = parseFloat(parts[1]) || 16;
      const height = parseFloat(parts[2]) || 9;
      return `aspect-[${width}/${height}]`;
    }
  }
  
  switch (ratio) {
    case '3:1': return 'aspect-[3/1]';
    case '2.76:1': return 'aspect-[2.76/1]';
    case '21:9': return 'aspect-[21/9]';
    case '16:9': return 'aspect-video';
    case '3:2': return 'aspect-[3/2]';
    case '4:3': return 'aspect-[4/3]';
    case '1:1': return 'aspect-square';
    case '3:4': return 'aspect-[3/4]';
    case '9:16': return 'aspect-[9/16]';
    default: return 'aspect-video';
  }
};

// Get mobile-friendly aspect ratio (portrait modes stay portrait, landscape modes are capped)
const getMobileAspectRatioClass = (ratio: string | null): string => {
  // Handle custom aspect ratio format: custom:width:height
  if (ratio?.startsWith('custom:')) {
    const parts = ratio.split(':');
    if (parts.length === 3) {
      const width = parseFloat(parts[1]) || 16;
      const height = parseFloat(parts[2]) || 9;
      const aspectValue = width / height;
      // For very wide custom ratios, cap at 21:9 on mobile
      if (aspectValue > 2.33) {
        return 'aspect-[21/9]';
      }
      return `aspect-[${width}/${height}]`;
    }
  }
  
  switch (ratio) {
    case '3:1': return 'aspect-[21/9]'; // Convert extra-wide to 21:9 on mobile
    case '2.76:1': return 'aspect-[21/9]'; // Convert cinematic to 21:9 on mobile
    case '21:9': return 'aspect-video'; // Convert ultra-wide to 16:9 on mobile
    case '16:9': return 'aspect-video';
    case '3:2': return 'aspect-[3/2]';
    case '4:3': return 'aspect-[4/3]';
    case '1:1': return 'aspect-square';
    case '3:4': return 'aspect-[3/4]';
    case '9:16': return 'aspect-[9/16]';
    default: return 'aspect-video';
  }
};

// Helper function to convert Google Drive links to direct image URL
const convertGoogleDriveUrl = (url: string | null): string | null => {
  if (!url) return url;
  
  const filePattern = /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const fileMatch = url.match(filePattern);
  if (fileMatch) {
    return `https://lh3.googleusercontent.com/d/${fileMatch[1]}`;
  }
  
  const openPattern = /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/;
  const openMatch = url.match(openPattern);
  if (openMatch) {
    return `https://lh3.googleusercontent.com/d/${openMatch[1]}`;
  }
  
  const ucPattern = /drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/;
  const ucMatch = url.match(ucPattern);
  if (ucMatch) {
    return `https://lh3.googleusercontent.com/d/${ucMatch[1]}`;
  }
  
  return url;
};

const HeroBanner = () => {
  // Use cached data from context instead of fetching directly
  const { banners, isLoading } = useBanners();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isDesktop, setIsDesktop] = useState(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
  const [isHovered, setIsHovered] = useState(false);
  
  const sectionRef = useRef<HTMLElement>(null);
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const imageRefs = useRef<(HTMLImageElement | HTMLDivElement | null)[]>([]);
  const textOverlayRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  // Listen for resize to determine desktop/mobile - MUST be before any early returns
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Animate slide transition with GSAP
  const animateSlide = useCallback((fromIndex: number, toIndex: number, direction: 'next' | 'prev') => {
    if (isAnimating || banners.length <= 1) return;
    
    setIsAnimating(true);
    setIsTextVisible(false);
    
    const currentSlide = slideRefs.current[fromIndex];
    const nextSlide = slideRefs.current[toIndex];
    
    if (!currentSlide || !nextSlide) {
      setIsAnimating(false);
      return;
    }

    const xOffset = direction === 'next' ? '100%' : '-100%';
    const xOffsetOut = direction === 'next' ? '-100%' : '100%';

    // Set initial state for incoming slide
    gsap.set(nextSlide, { 
      xPercent: direction === 'next' ? 100 : -100, 
      opacity: 1,
      visibility: 'visible',
      scale: 1.05
    });

    // Create timeline for smooth transition
    const tl = gsap.timeline({
      onComplete: () => {
        setCurrentIndex(toIndex);
        setIsAnimating(false);
        // Hide previous slide after animation
        gsap.set(currentSlide, { visibility: 'hidden', opacity: 0 });
      }
    });

    // Animate out current slide
    tl.to(currentSlide, {
      xPercent: direction === 'next' ? -100 : 100,
      opacity: 0,
      scale: 0.95,
      duration: 0.8,
      ease: 'power3.inOut'
    }, 0);

    // Animate in next slide
    tl.to(nextSlide, {
      xPercent: 0,
      opacity: 1,
      scale: 1,
      duration: 0.8,
      ease: 'power3.inOut'
    }, 0);

    // Animate content elements
    const nextContent = nextSlide.querySelector('.slide-content');
    if (nextContent) {
      tl.fromTo(nextContent.children, 
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power3.out' },
        0.4
      );
    }
  }, [isAnimating, banners.length]);

  // Navigate to next slide
  const goToNext = useCallback(() => {
    if (banners.length <= 1 || isAnimating) return;
    const nextIndex = (currentIndex + 1) % banners.length;
    animateSlide(currentIndex, nextIndex, 'next');
  }, [currentIndex, banners.length, isAnimating, animateSlide]);

  // Navigate to previous slide
  const goToPrevious = useCallback(() => {
    if (banners.length <= 1 || isAnimating) return;
    const prevIndex = (currentIndex - 1 + banners.length) % banners.length;
    animateSlide(currentIndex, prevIndex, 'prev');
  }, [currentIndex, banners.length, isAnimating, animateSlide]);

  // Navigate to specific slide
  const goToSlide = useCallback((index: number) => {
    if (index === currentIndex || isAnimating || banners.length <= 1) return;
    const direction = index > currentIndex ? 'next' : 'prev';
    animateSlide(currentIndex, index, direction);
  }, [currentIndex, isAnimating, banners.length, animateSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (banners.length <= 1) return;

    const startAutoPlay = () => {
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, 6000);
    };

    startAutoPlay();

    return () => {
      if (autoPlayRef.current) {
        clearInterval(autoPlayRef.current);
      }
    };
  }, [banners.length, goToNext]);

  // Reset autoplay on manual navigation
  const resetAutoPlay = useCallback(() => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
      autoPlayRef.current = setInterval(() => {
        goToNext();
      }, 6000);
    }
  }, [goToNext]);

  // Initial animation on mount
  useEffect(() => {
    if (banners.length > 0 && slideRefs.current[0]) {
      // Set all slides except first to hidden
      slideRefs.current.forEach((slide, index) => {
        if (slide) {
          if (index === 0) {
            gsap.set(slide, { 
              xPercent: 0, 
              opacity: 1, 
              visibility: 'visible',
              scale: 1 
            });
            // Animate first slide content
            const content = slide.querySelector('.slide-content');
            if (content) {
              gsap.fromTo(content.children,
                { y: 50, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
              );
            }
          } else {
            gsap.set(slide, { 
              xPercent: 100, 
              opacity: 0, 
              visibility: 'hidden',
              scale: 1.05 
            });
          }
        }
      });
    }
  }, [banners]);

  // Parallax effect on scroll
  useEffect(() => {
    if (!sectionRef.current || banners.length === 0) return;

    const ctx = gsap.context(() => {
      // Parallax effect for images
      imageRefs.current.forEach((img) => {
        if (img) {
          gsap.to(img, {
            yPercent: 20,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 1.5,
            }
          });
        }
      });

      // Subtle scale effect on the container
      gsap.fromTo(slidesContainerRef.current,
        { scale: 0.95, opacity: 0.8 },
        {
          scale: 1,
          opacity: 1,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 90%',
            end: 'top 20%',
            scrub: 1,
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, [banners]);

  // Handle banner click to show text with GSAP animation
  const handleBannerClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a')) return;
    
    const currentBanner = banners[currentIndex];
    if (currentBanner?.layout_type !== 'image_full') return;

    if (!isTextVisible && textOverlayRef.current) {
      setIsTextVisible(true);
      
      const overlay = textOverlayRef.current;
      const titleEl = overlay.querySelector('.banner-title');
      const subtitleEl = overlay.querySelector('.banner-subtitle');
      const buttonEl = overlay.querySelector('.banner-button');

      gsap.set(overlay, { visibility: 'visible' });
      
      gsap.fromTo(overlay,
        { opacity: 0 },
        { opacity: 1, duration: 0.5, ease: 'power2.out' }
      );
      
      if (titleEl) {
        gsap.fromTo(titleEl,
          { opacity: 0, y: 80, rotateX: -15 },
          { opacity: 1, y: 0, rotateX: 0, duration: 0.8, ease: 'power3.out', delay: 0.1 }
        );
      }
      
      if (subtitleEl) {
        gsap.fromTo(subtitleEl,
          { opacity: 0, y: 50 },
          { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', delay: 0.25 }
        );
      }
      
      if (buttonEl) {
        gsap.fromTo(buttonEl,
          { opacity: 0, y: 40, scale: 0.85 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: 'back.out(1.7)', delay: 0.4 }
        );
      }
    } else if (isTextVisible && textOverlayRef.current) {
      const overlay = textOverlayRef.current;
      
      gsap.to(overlay, {
        opacity: 0,
        duration: 0.4,
        ease: 'power2.in',
        onComplete: () => {
          setIsTextVisible(false);
          gsap.set(overlay, { visibility: 'hidden' });
        }
      });
    }
  }, [isTextVisible, banners, currentIndex]);

  if (isLoading || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];

  // Navigation Arrows
  const NavigationArrows = () => (
    banners.length > 1 ? (
      <div className={`transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevious(); resetAutoPlay(); }}
          disabled={isAnimating}
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <ChevronLeft className="w-6 h-6 md:w-7 md:h-7 group-hover:-translate-x-0.5 transition-transform" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); goToNext(); resetAutoPlay(); }}
          disabled={isAnimating}
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white bg-black/20 hover:bg-black/40 backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed group"
        >
          <ChevronRight className="w-6 h-6 md:w-7 md:h-7 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    ) : null
  );

  // Dots Indicator
  const DotsIndicator = ({ position = 'bottom-6' }: { position?: string }) => (
    banners.length > 1 ? (
      <div className={`absolute ${position} left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); goToSlide(index); resetAutoPlay(); }}
            disabled={isAnimating}
            className={`relative h-3 rounded-full transition-all duration-500 ${
              index === currentIndex 
                ? 'bg-white w-10 shadow-lg' 
                : 'bg-white/40 w-3 hover:bg-white/60 hover:scale-125'
            }`}
          >
            {index === currentIndex && (
              <span className="absolute inset-0 rounded-full bg-white/50 animate-ping" />
            )}
          </button>
        ))}
      </div>
    ) : null
  );

  // Progress Bar
  const ProgressBar = () => (
    banners.length > 1 ? (
      <div className={`absolute top-0 left-0 right-0 z-30 h-1 bg-white/20 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
        <div 
          className="h-full bg-gradient-to-r from-white via-white to-white/80 transition-all duration-300"
          style={{ 
            width: `${((currentIndex + 1) / banners.length) * 100}%`
          }}
        />
      </div>
    ) : null
  );

  // Render individual slide
  const renderSlide = (banner: Banner, index: number) => {
    const layoutType = banner.layout_type || 'image_caption';
    const hasImage = banner.image_url;
    const isActive = index === currentIndex;

    return (
      <div
        key={banner.id}
        ref={(el) => slideRefs.current[index] = el}
        className="absolute inset-0 w-full h-full"
        style={{ willChange: 'transform, opacity' }}
      >
        {layoutType === 'image_full' ? (
          <div 
            className="relative w-full h-full cursor-pointer"
            onClick={isActive ? handleBannerClick : undefined}
          >
            <div className="absolute inset-0">
              {hasImage ? (
                <img 
                  ref={(el) => imageRefs.current[index] = el}
                  src={convertGoogleDriveUrl(banner.image_url)!}
                  alt={banner.title}
                  className="w-full h-full object-contain"
                  draggable={false}
                  style={{ willChange: 'transform' }}
                />
              ) : (
                <div 
                  ref={(el) => imageRefs.current[index] = el}
                  className="w-full h-[120%] -mt-[10%] bg-gradient-to-br from-primary to-primary/80" 
                />
              )}
              {/* Gradient overlay for depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/10" />
            </div>
            
            {/* Text overlay for image_full */}
            {isActive && (
              <div 
                ref={textOverlayRef}
                className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex flex-col items-center justify-end pb-16 md:pb-20 px-6"
                style={{ visibility: isTextVisible ? 'visible' : 'hidden', opacity: isTextVisible ? 1 : 0 }}
              >
                <div className="slide-content text-center">
                  <h2 className="banner-title text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-4xl leading-tight drop-shadow-2xl">
                    {banner.title}
                  </h2>
                  {banner.subtitle && (
                    <p className="banner-subtitle text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed drop-shadow-lg">
                      {banner.subtitle}
                    </p>
                  )}
                  {banner.link_url && banner.button_text && (
                    <Button
                      asChild
                      size="lg"
                      className="banner-button bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a href={banner.link_url}>{banner.button_text}</a>
                    </Button>
                  )}
                </div>
              </div>
            )}
            
            {/* Click hint */}
            {isActive && !isTextVisible && (banner.title || banner.subtitle) && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 bg-black/40 backdrop-blur-md text-white text-sm md:text-base px-6 py-3 rounded-full border border-white/10 shadow-lg">
                <span className="animate-pulse">Klik untuk lihat detail</span>
              </div>
            )}
          </div>
        ) : layoutType === 'image_overlay' ? (
          <div className="relative w-full h-full">
            {hasImage && (
              <div 
                ref={(el) => imageRefs.current[index] = el}
                className="absolute inset-0 bg-contain bg-center bg-no-repeat"
                style={{ backgroundImage: `url(${convertGoogleDriveUrl(banner.image_url)})`, willChange: 'transform' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30" />
              </div>
            )}
            {!hasImage && (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            )}
            <div className="slide-content relative z-10 flex flex-col items-center justify-center text-center h-full p-8 md:p-16">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4 max-w-4xl leading-tight drop-shadow-2xl">
                {banner.title}
              </h2>
              {banner.subtitle && (
                <p className="text-lg md:text-xl lg:text-2xl text-white/90 mb-8 max-w-2xl leading-relaxed drop-shadow-lg">
                  {banner.subtitle}
                </p>
              )}
              {banner.link_url && banner.button_text && (
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg rounded-2xl shadow-2xl hover:shadow-white/20 transition-all duration-300 hover:-translate-y-1"
                >
                  <a href={banner.link_url}>{banner.button_text}</a>
                </Button>
              )}
            </div>
          </div>
        ) : layoutType === 'image_caption' ? (
          <div className="relative w-full h-full flex flex-col">
            {hasImage ? (
              <>
                <div className="flex-1 relative">
                  <img 
                    ref={(el) => imageRefs.current[index] = el}
                    src={convertGoogleDriveUrl(banner.image_url)!}
                    alt={banner.title}
                    className="w-full h-full object-contain"
                    style={{ willChange: 'transform' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
                <div className="slide-content bg-gradient-to-r from-primary via-primary to-primary/90 px-6 py-5 md:px-10 md:py-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white truncate">
                        {banner.title}
                      </h2>
                      {banner.subtitle && (
                        <p className="text-base md:text-lg text-white/80 mt-1 line-clamp-1">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                    {banner.link_url && banner.button_text && (
                      <Button
                        asChild
                        size="default"
                        className="bg-white text-primary hover:bg-white/90 px-8 py-3 text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 shrink-0 w-fit"
                      >
                        <a href={banner.link_url}>{banner.button_text}</a>
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="slide-content flex-1 bg-gradient-to-br from-primary via-primary to-primary/80 flex flex-col items-center justify-center text-center p-8 md:p-12">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-3xl leading-tight">
                  {banner.title}
                </h2>
                {banner.subtitle && (
                  <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                    {banner.subtitle}
                  </p>
                )}
                {banner.link_url && banner.button_text && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <a href={banner.link_url}>{banner.button_text}</a>
                  </Button>
                )}
              </div>
            )}
          </div>
        ) : (
          // text_only
          <div className="slide-content w-full h-full bg-gradient-to-br from-primary via-primary to-primary/80 flex flex-col items-center justify-center text-center p-8 md:p-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 max-w-3xl leading-tight">
              {banner.title}
            </h2>
            {banner.subtitle && (
              <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl leading-relaxed">
                {banner.subtitle}
              </p>
            )}
            {banner.link_url && banner.button_text && (
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 px-10 py-6 text-lg rounded-2xl shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <a href={banner.link_url}>{banner.button_text}</a>
              </Button>
            )}
          </div>
        )}
      </div>
    );
  };

  // Get current banner's aspect ratio
  const currentAspectRatio = currentBanner?.aspect_ratio || '16:9';

  // Convert aspect ratio string to CSS value
  const getAspectValue = (ratio: string | null, isMobile: boolean = false): string => {
    const r = ratio || '16:9';
    
    // Handle custom aspect ratio format: custom:width:height
    if (r.startsWith('custom:')) {
      const parts = r.split(':');
      if (parts.length === 3) {
        const width = parseFloat(parts[1]) || 16;
        const height = parseFloat(parts[2]) || 9;
        const aspectValue = width / height;
        
        // On mobile, cap very wide ratios at 21:9 (2.33)
        if (isMobile && aspectValue > 2.33) {
          return '21/9';
        }
        return `${width}/${height}`;
      }
    }
    
    // On mobile, convert ultra-wide to standard wide
    if (isMobile) {
      if (r === '21:9' || r === '3:1' || r === '2.76:1') return '16/9';
    }
    
    return r.replace(':', '/');
  };


  // Get the appropriate aspect ratio based on screen size
  const containerAspectRatio = isDesktop 
    ? getAspectValue(currentAspectRatio, false) 
    : getAspectValue(currentAspectRatio, true);

  return (
    <section ref={sectionRef} className="bg-background">
      <div className="w-full">
        <div 
          className="relative overflow-hidden"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onTouchStart={() => setIsHovered(true)}
          onTouchEnd={() => setTimeout(() => setIsHovered(false), 3000)}
        >
          <ProgressBar />
          
          {/* Slides container - uses dynamic aspect ratio based on current banner */}
          <div 
            ref={slidesContainerRef}
            className="relative w-full overflow-hidden transition-all duration-500"
            style={{ aspectRatio: containerAspectRatio }}
          >
            {banners.map((banner, index) => renderSlide(banner, index))}
          </div>
          
          <NavigationArrows />
          <DotsIndicator position="bottom-6" />
          
          {/* Banner counter with aspect ratio indicator */}
          {banners.length > 1 && (
            <div className={`absolute top-4 right-4 z-30 bg-black/30 backdrop-blur-md text-white text-sm px-4 py-2 rounded-full border border-white/10 transition-opacity duration-300 ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
              <span className="font-semibold">{currentIndex + 1}</span>
              <span className="text-white/60"> / {banners.length}</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HeroBanner;
